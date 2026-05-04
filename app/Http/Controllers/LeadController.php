<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Lead;
use App\Models\Template;
use App\Services\OnsendService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $statusFilter = $request->string('status')->toString();

        $query = Auth::user()->leads()->latest();

        if ($statusFilter !== '' && \in_array($statusFilter, array_column(LeadStatus::cases(), 'value'), true)) {
            $query->where('status', $statusFilter);
        }

        $leads = $query->get(['id', 'name', 'phone', 'email', 'source', 'status', 'amount', 'last_contacted_at', 'created_at']);

        $counts = Auth::user()->leads()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('Leads/Index', [
            'leads' => $leads,
            'statuses' => LeadStatus::options(),
            'counts' => [
                'all' => $counts->sum(),
                'new' => $counts['new'] ?? 0,
                'follow_up' => $counts['follow_up'] ?? 0,
                'interested' => $counts['interested'] ?? 0,
                'closed' => $counts['closed'] ?? 0,
            ],
            'currentStatus' => $statusFilter,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Leads/Create', [
            'statuses' => LeadStatus::options(),
        ]);
    }

    public function store(StoreLeadRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $maxLeads = $user->currentPlan()->maxLeads();
        if ($maxLeads !== null && $user->leads()->count() >= $maxLeads) {
            return redirect()->route('billing.pricing')
                ->with('error', "You've hit the {$maxLeads}-lead limit on your current plan. Upgrade to add more.");
        }

        $data = $request->validated();
        $data['status'] ??= LeadStatus::New->value;

        $lead = $user->leads()->create($data);

        $lead->statusHistory()->create([
            'changed_by' => $user->id,
            'from_status' => null,
            'to_status' => $lead->status->value,
            'note' => 'Lead created.',
        ]);

        // Auto-spawn one reminder per subscriber-defined slot. Each reminder
        // carries its own template_id + slot_label (denormalized) so the
        // autosend cron is self-contained — and editing the schedule later
        // doesn't change the intent of reminders already in flight.
        $automation = $user->automation;
        $slots = $automation
            ? $automation->slots()
            : \App\Models\UserAutomation::defaultSlots();

        foreach ($slots as $slot) {
            $lead->reminders()->create([
                'user_id' => $user->id,
                'type' => 'auto',
                'is_auto' => (bool) ($slot['enabled'] ?? false),
                'template_id' => $slot['template_id'] ?? null,
                'slot_label' => $slot['label'] ?? null,
                'due_at' => now()
                    ->addDays((int) ($slot['delay_days'] ?? 0))
                    ->setTime((int) ($slot['hour'] ?? 9), (int) ($slot['minute'] ?? 0)),
            ]);
        }

        return redirect()->route('leads.show', $lead)->with('success', 'Lead created.');
    }

    public function show(Lead $lead): Response
    {
        $this->authorize('view', $lead);

        $lead->load(['statusHistory.changer:id,name']);

        $templates = Auth::user()->templates()
            ->orderByDesc('is_default')
            ->orderBy('title')
            ->get(['id', 'title', 'body']);

        return Inertia::render('Leads/Show', [
            'lead' => $lead,
            'statuses' => LeadStatus::options(),
            'templates' => $templates,
        ]);
    }

    public function edit(Lead $lead): Response
    {
        $this->authorize('update', $lead);

        return Inertia::render('Leads/Edit', [
            'lead' => $lead,
            'statuses' => LeadStatus::options(),
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): RedirectResponse
    {
        $previousStatus = $lead->status;
        $data = $request->validated();

        $lead->fill($data);

        if ($lead->isDirty('status')) {
            $lead->statusHistory()->create([
                'changed_by' => Auth::id(),
                'from_status' => $previousStatus->value,
                'to_status' => $lead->status,
                'note' => 'Status changed via edit.',
            ]);
        }

        $lead->save();

        return redirect()->route('leads.show', $lead)->with('success', 'Lead updated.');
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $this->authorize('delete', $lead);

        $lead->delete();

        return redirect()->route('leads.index')->with('success', 'Lead deleted.');
    }

    public function updateStatus(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $validated = $request->validate([
            'status' => ['required', Rule::enum(LeadStatus::class)],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $previousStatus = $lead->status;

        if ($previousStatus->value === $validated['status']) {
            return back()->with('success', 'Status unchanged.');
        }

        $lead->update([
            'status' => $validated['status'],
            'last_contacted_at' => now(),
        ]);

        $lead->statusHistory()->create([
            'changed_by' => Auth::id(),
            'from_status' => $previousStatus->value,
            'to_status' => $validated['status'],
            'note' => $validated['note'] ?? null,
        ]);

        return back()->with('success', 'Status updated.');
    }

    public function addNote(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        $validated = $request->validate([
            'note' => ['required', 'string', 'max:1000'],
        ]);

        $lead->statusHistory()->create([
            'changed_by' => Auth::id(),
            'from_status' => $lead->status->value,
            'to_status' => $lead->status->value,
            'note' => $validated['note'],
        ]);

        $lead->update(['last_contacted_at' => now()]);

        return back()->with('success', 'Note added.');
    }

    /**
     * Send a rendered template to the lead via the subscriber's Onsend WhatsApp.
     * Returns JSON {ok, message, channel: 'onsend'|'wa_link', wa_link?}.
     *
     * If Onsend is not configured for the user, returns wa_link so the frontend
     * can fall back to opening wa.me — no error, just a different channel.
     */
    public function sendTemplate(Lead $lead, Template $template): JsonResponse
    {
        $this->authorize('view', $lead);
        $this->authorize('view', $template);

        $user = Auth::user();
        $whatsapp = app(WhatsAppService::class);
        $rendered = $whatsapp->render($template->body, $lead, $user);

        $onsend = OnsendService::for($user->id);

        if (! $onsend->isConfigured()) {
            // Graceful fallback — frontend opens wa.me in a new tab
            return response()->json([
                'ok' => true,
                'channel' => 'wa_link',
                'wa_link' => $whatsapp->waLink($lead->phone, $rendered),
                'message' => 'Onsend not configured — opening WhatsApp Web instead.',
            ]);
        }

        try {
            $onsend->sendMessage($lead->phone, $rendered);

            // Log as a note in the lead's activity timeline + bump last_contacted_at
            $lead->statusHistory()->create([
                'changed_by' => $user->id,
                'from_status' => $lead->status->value,
                'to_status' => $lead->status->value,
                'note' => "Sent via Onsend: {$template->title}",
            ]);
            $lead->update(['last_contacted_at' => now()]);
            $template->increment('use_count');

            return response()->json([
                'ok' => true,
                'channel' => 'onsend',
                'message' => "Sent “{$template->title}” to {$lead->name}.",
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'ok' => false,
                'channel' => 'onsend',
                'message' => 'Onsend send failed: ' . $e->getMessage(),
                'wa_link' => $whatsapp->waLink($lead->phone, $rendered),
            ], 500);
        }
    }
}
