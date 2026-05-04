<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\LeadCampaign;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(): Response
    {
        $campaigns = Auth::user()->leadCampaigns()
            ->with('template:id,title')
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (LeadCampaign $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'status' => $c->status,
                'scheduled_at' => $c->scheduled_at,
                'target_kind' => $c->target_kind,
                'target_count' => $c->target_count,
                'sent_count' => $c->sent_count,
                'failed_count' => $c->failed_count,
                'progress_pct' => $c->progressPct(),
                'template' => $c->template ? ['id' => $c->template->id, 'title' => $c->template->title] : null,
                'created_at' => $c->created_at,
            ])
            ->toArray();

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
        ]);
    }

    public function create(): Response
    {
        $user = Auth::user();
        $templates = $user->templates()->orderBy('title')->get(['id', 'title'])->toArray();
        $sources = $user->leads()->whereNotNull('source')->distinct()->orderBy('source')->pluck('source')->toArray();

        // Counts for the live preview ("if you target X, this many leads will receive it")
        $statusCounts = $user->leads()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return Inertia::render('Campaigns/Create', [
            'templates' => $templates,
            'sources' => $sources,
            'statuses' => LeadStatus::options(),
            'totalLeads' => $user->leads()->count(),
            'statusCounts' => $statusCounts,
            'defaultScheduledAt' => now()->addHour()->format('Y-m-d\TH:i'),
        ]);
    }

    /**
     * AJAX: how many leads would the given filter target right now?
     * Used by the Create page to show live counts as the user picks filters.
     */
    public function targetCount(Request $request): JsonResponse
    {
        $kind = $request->string('target_kind')->toString();
        $criteria = (array) $request->input('target_criteria', []);

        $count = $this->buildTargetQuery(Auth::user(), $kind, $criteria)->count();

        return response()->json(['count' => $count]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'template_id' => ['required', 'integer'],
            'scheduled_at' => ['required', 'date'],
            'target_kind' => ['required', Rule::in(['all', 'by_status', 'by_source', 'specific'])],
            'target_criteria' => ['nullable', 'array'],
            'target_criteria.status' => ['nullable', 'string'],
            'target_criteria.source' => ['nullable', 'string'],
            'target_criteria.ids' => ['nullable', 'array'],
            'target_criteria.ids.*' => ['integer'],
        ]);

        // Verify template belongs to user
        $template = Template::where('id', $validated['template_id'])
            ->where('user_id', $user->id)
            ->first();
        if (! $template) {
            return back()->with('error', 'Invalid template.');
        }

        $criteria = $validated['target_criteria'] ?? [];
        $leads = $this->buildTargetQuery($user, $validated['target_kind'], $criteria)->get(['id']);

        if ($leads->isEmpty()) {
            return back()->with('error', 'No leads match the selected target. Adjust filters and try again.');
        }

        $scheduledAt = \Carbon\Carbon::parse($validated['scheduled_at']);

        DB::transaction(function () use ($user, $validated, $template, $leads, $scheduledAt, $criteria) {
            $campaign = $user->leadCampaigns()->create([
                'template_id' => $template->id,
                'name' => $validated['name'],
                'scheduled_at' => $scheduledAt,
                'status' => 'scheduled',
                'target_kind' => $validated['target_kind'],
                'target_criteria' => $criteria,
                'target_count' => $leads->count(),
            ]);

            // Spawn one reminder per targeted lead — denormalized so each is
            // self-contained for the autosend cron
            foreach ($leads as $lead) {
                $campaign->reminders()->create([
                    'user_id' => $user->id,
                    'lead_id' => $lead->id,
                    'type' => 'campaign',
                    'is_auto' => true,
                    'template_id' => $template->id,
                    'slot_label' => $validated['name'], // shows the campaign name in activity log
                    'due_at' => $scheduledAt,
                ]);
            }
        });

        return redirect()->route('campaigns.index')
            ->with('success', "Campaign \"{$validated['name']}\" scheduled for {$leads->count()} lead(s).");
    }

    public function show(LeadCampaign $campaign): Response
    {
        $this->authorize('view', $campaign);

        $campaign->load('template:id,title,body');

        // Compute live sent/failed/pending counts directly from reminders
        // (sent_count column might lag if we haven't refreshed yet)
        $reminders = $campaign->reminders()
            ->with('lead:id,name,phone,status')
            ->get();

        $live = [
            'sent' => $reminders->whereNotNull('auto_sent_at')->count(),
            'pending' => $reminders->whereNull('auto_sent_at')->whereNull('completed_at')->whereNull('dismissed_at')->count(),
            'cancelled' => $reminders->whereNotNull('dismissed_at')->count(),
        ];

        $sample = $reminders->take(20)->map(fn ($r) => [
            'id' => $r->id,
            'lead' => $r->lead ? ['id' => $r->lead->id, 'name' => $r->lead->name, 'phone' => $r->lead->phone] : null,
            'auto_sent_at' => $r->auto_sent_at,
            'dismissed_at' => $r->dismissed_at,
            'status' => $r->auto_sent_at ? 'sent' : ($r->dismissed_at ? 'cancelled' : 'pending'),
        ])->toArray();

        return Inertia::render('Campaigns/Show', [
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'status' => $campaign->status,
                'scheduled_at' => $campaign->scheduled_at,
                'target_kind' => $campaign->target_kind,
                'target_criteria' => $campaign->target_criteria,
                'target_count' => $campaign->target_count,
                'sent_count' => $live['sent'],
                'failed_count' => $campaign->failed_count,
                'pending_count' => $live['pending'],
                'cancelled_count' => $live['cancelled'],
                'progress_pct' => $campaign->target_count > 0
                    ? (int) round((($live['sent'] + $campaign->failed_count) / $campaign->target_count) * 100)
                    : 0,
                'template' => $campaign->template ? [
                    'id' => $campaign->template->id,
                    'title' => $campaign->template->title,
                    'body' => $campaign->template->body,
                ] : null,
                'cancelled_at' => $campaign->cancelled_at,
                'created_at' => $campaign->created_at,
                'is_cancellable' => $campaign->isCancellable(),
            ],
            'reminderSample' => $sample,
        ]);
    }

    public function cancel(LeadCampaign $campaign): RedirectResponse
    {
        $this->authorize('update', $campaign);

        if (! $campaign->isCancellable()) {
            return back()->with('error', 'This campaign cannot be cancelled.');
        }

        DB::transaction(function () use ($campaign) {
            // Soft-cancel un-sent reminders so the cron stops trying to send them
            $campaign->reminders()
                ->whereNull('auto_sent_at')
                ->whereNull('dismissed_at')
                ->update(['dismissed_at' => now()]);

            $campaign->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
        });

        return back()->with('success', 'Campaign cancelled — pending sends stopped.');
    }

    public function destroy(LeadCampaign $campaign): RedirectResponse
    {
        $this->authorize('delete', $campaign);

        // Prevent deleting in-flight campaigns (would orphan reminders)
        if ($campaign->status === 'scheduled' || $campaign->status === 'sending') {
            return back()->with('error', 'Cancel the campaign before deleting it.');
        }

        $campaign->delete();

        return redirect()->route('campaigns.index')->with('success', 'Campaign deleted.');
    }

    /**
     * Build a query that resolves the given (target_kind, target_criteria)
     * to actual Lead rows for THIS user. Centralized so create-preview,
     * store, and target-count all use the same logic.
     */
    private function buildTargetQuery($user, string $kind, array $criteria)
    {
        $query = $user->leads()->getQuery()->where('user_id', $user->id);
        // Re-scope explicitly to be safe (defense in depth)

        return match ($kind) {
            'by_status' => $query->where('status', $criteria['status'] ?? '__none__'),
            'by_source' => $query->where('source', $criteria['source'] ?? '__none__'),
            'specific' => $query->whereIn('id', array_filter(array_map('intval', (array) ($criteria['ids'] ?? [])))),
            default => $query, // 'all'
        };
    }
}
