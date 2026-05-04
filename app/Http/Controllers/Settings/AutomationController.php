<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\UserAutomation;
use App\Services\OnsendService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
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

        $slots = $automation
            ? $automation->slots()
            : UserAutomation::defaultSlots();

        return Inertia::render('Settings/Automation', [
            'automation' => [
                'autosend_enabled' => (bool) ($automation?->autosend_enabled),
            ],
            'slots' => $slots,
            'templates' => $templates,
            'onsendConfigured' => $onsendConfigured,
            'maxSlots' => UserAutomation::MAX_SLOTS,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'autosend_enabled' => ['required', 'boolean'],
            'slots' => ['required', 'array', 'min:0', 'max:' . UserAutomation::MAX_SLOTS],
            'slots.*.id' => ['nullable', 'string', 'max:64'],
            'slots.*.label' => ['required', 'string', 'max:60'],
            'slots.*.enabled' => ['required', 'boolean'],
            'slots.*.delay_days' => ['required', 'integer', 'min:0', 'max:365'],
            'slots.*.hour' => ['required', 'integer', 'min:0', 'max:23'],
            'slots.*.minute' => ['required', 'integer', 'min:0', 'max:59'],
            'slots.*.template_id' => ['nullable', 'integer'],
        ]);

        $userTemplateIds = $user->templates()->pluck('id')->toArray();
        $cleanSlots = [];

        foreach ($validated['slots'] as $slot) {
            $templateId = $slot['template_id'] ?? null;
            // Cross-user template references silently dropped to null
            if ($templateId !== null && ! \in_array((int) $templateId, $userTemplateIds, true)) {
                $templateId = null;
            }

            $cleanSlots[] = [
                'id' => isset($slot['id']) && $slot['id'] !== '' ? (string) $slot['id'] : (string) Str::uuid(),
                'label' => trim((string) $slot['label']),
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
                'schedule' => $cleanSlots,
            ],
        );

        return back()->with('success', 'Automation settings saved.');
    }
}
