<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Enums\ReminderType;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

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
        $data = $request->validated();
        $data['status'] ??= LeadStatus::New->value;

        $lead = Auth::user()->leads()->create($data);

        $lead->statusHistory()->create([
            'changed_by' => Auth::id(),
            'from_status' => null,
            'to_status' => $lead->status->value,
            'note' => 'Lead created.',
        ]);

        // Auto-spawn Day 1 / 3 / 7 follow-up reminders
        foreach (ReminderType::autoTypes() as $type) {
            $lead->reminders()->create([
                'user_id' => Auth::id(),
                'type' => $type->value,
                'due_at' => now()->addDays($type->defaultDelayDays())->setTime(9, 0),
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
}
