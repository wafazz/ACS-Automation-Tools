<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ReminderType;
use App\Http\Controllers\Controller;
use App\Models\UserAutomation;
use App\Services\OnsendService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AutomationController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $automation = $user->automation;
        $templates = $user->templates()
            ->orderByDesc('is_default')
            ->orderBy('title')
            ->get(['id', 'title', 'is_default'])
            ->toArray();

        $onsendConfigured = OnsendService::for($user->id)->isConfigured();

        // Build slot data for the UI — falls back to defaults if user hasn't
        // configured yet, so the form shows sensible starting values.
        $slots = [];
        foreach (ReminderType::autoTypes() as $type) {
            $slot = $automation ? $automation->slot($type) : UserAutomation::defaultSlot($type);
            $slots[] = [
                'key' => $type->value,
                'label' => $type->label(),
                'enabled' => $slot['enabled'],
                'delay_days' => $slot['delay_days'],
                'hour' => $slot['hour'],
                'minute' => $slot['minute'],
                'template_id' => $slot['template_id'],
            ];
        }

        return Inertia::render('Settings/Automation', [
            'automation' => [
                'autosend_enabled' => (bool) ($automation?->autosend_enabled),
            ],
            'slots' => $slots,
            'templates' => $templates,
            'onsendConfigured' => $onsendConfigured,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'autosend_enabled' => ['required', 'boolean'],
            'slots' => ['required', 'array', 'size:3'],
            'slots.*.key' => ['required', 'string'],
            'slots.*.enabled' => ['required', 'boolean'],
            'slots.*.delay_days' => ['required', 'integer', 'min:0', 'max:365'],
            'slots.*.hour' => ['required', 'integer', 'min:0', 'max:23'],
            'slots.*.minute' => ['required', 'integer', 'min:0', 'max:59'],
            'slots.*.template_id' => ['nullable', 'integer'],
        ]);

        $userTemplateIds = $user->templates()->pluck('id')->toArray();
        $autoTypeValues = array_map(fn (ReminderType $t) => $t->value, ReminderType::autoTypes());

        $schedule = [];
        foreach ($validated['slots'] as $slot) {
            // Only accept known slot keys (auto_day_1/3/7) — silently drop unknowns
            if (! \in_array($slot['key'], $autoTypeValues, true)) {
                continue;
            }

            $templateId = $slot['template_id'] ?? null;
            if ($templateId !== null && ! \in_array((int) $templateId, $userTemplateIds, true)) {
                $templateId = null; // Cross-user template references silently dropped
            }

            $schedule[$slot['key']] = [
                'enabled' => (bool) $slot['enabled'],
                'delay_days' => (int) $slot['delay_days'],
                'hour' => (int) $slot['hour'],
                'minute' => (int) $slot['minute'],
                'template_id' => $templateId === null ? null : (int) $templateId,
            ];
        }

        UserAutomation::updateOrCreate(
            ['user_id' => $user->id],
            [
                'autosend_enabled' => $validated['autosend_enabled'],
                'schedule' => $schedule,
            ],
        );

        return back()->with('success', 'Automation settings saved.');
    }
}
