<?php

namespace App\Http\Controllers;

use App\Enums\ReminderType;
use App\Http\Requests\StoreReminderRequest;
use App\Models\Reminder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReminderController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->string('tab', 'today')->toString();
        if (! \in_array($tab, ['today', 'upcoming', 'overdue', 'completed'], true)) {
            $tab = 'today';
        }

        $base = Auth::user()->reminders()->with(['lead:id,name,phone,status']);

        $list = match ($tab) {
            'today' => (clone $base)->dueToday()->orderBy('due_at'),
            'upcoming' => (clone $base)->upcoming()->orderBy('due_at'),
            'overdue' => (clone $base)->overdue()->orderBy('due_at'),
            'completed' => (clone $base)->whereNotNull('completed_at')->latest('completed_at'),
        };

        $reminders = $list->limit(100)->get();

        $counts = [
            'today' => Auth::user()->reminders()->dueToday()->count(),
            'upcoming' => Auth::user()->reminders()->upcoming()->count(),
            'overdue' => Auth::user()->reminders()->overdue()->count(),
            'completed' => Auth::user()->reminders()->whereNotNull('completed_at')->count(),
        ];

        return Inertia::render('Reminders/Index', [
            'reminders' => $reminders,
            'counts' => $counts,
            'currentTab' => $tab,
        ]);
    }

    public function store(StoreReminderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Auth::user()->reminders()->create([
            'lead_id' => $data['lead_id'] ?? null,
            'type' => ReminderType::Manual->value,
            'due_at' => $data['due_at'],
            'note' => $data['note'] ?? null,
        ]);

        return back()->with('success', 'Reminder added.');
    }

    public function complete(Reminder $reminder): RedirectResponse
    {
        $this->authorize('update', $reminder);

        $reminder->update(['completed_at' => now()]);

        if ($reminder->lead_id) {
            $reminder->lead()->update(['last_contacted_at' => now()]);
        }

        return back()->with('success', 'Reminder completed.');
    }

    public function snooze(Reminder $reminder): RedirectResponse
    {
        $this->authorize('update', $reminder);

        $reminder->update([
            'due_at' => $reminder->due_at->addDay(),
            'snooze_count' => $reminder->snooze_count + 1,
        ]);

        return back()->with('success', 'Snoozed by 1 day.');
    }

    public function dismiss(Reminder $reminder): RedirectResponse
    {
        $this->authorize('update', $reminder);

        $reminder->update(['dismissed_at' => now()]);

        return back()->with('success', 'Reminder dismissed.');
    }

    public function destroy(Reminder $reminder): RedirectResponse
    {
        $this->authorize('delete', $reminder);

        $reminder->delete();

        return back()->with('success', 'Reminder deleted.');
    }
}
