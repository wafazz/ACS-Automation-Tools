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

        return Inertia::render('Settings/Automation', [
            'automation' => [
                'autosend_enabled' => (bool) ($automation?->autosend_enabled),
                'template_map' => $automation?->template_map ?? [
                    'auto_day_1' => null,
                    'auto_day_3' => null,
                    'auto_day_7' => null,
                ],
            ],
            'templates' => $templates,
            'reminderTypes' => array_map(
                fn (ReminderType $t) => [
                    'value' => $t->value,
                    'label' => $t->label(),
                    'days' => $t->defaultDelayDays(),
                ],
                ReminderType::autoTypes(),
            ),
            'onsendConfigured' => $onsendConfigured,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'autosend_enabled' => ['required', 'boolean'],
            'template_map' => ['array'],
            'template_map.auto_day_1' => ['nullable', 'integer'],
            'template_map.auto_day_3' => ['nullable', 'integer'],
            'template_map.auto_day_7' => ['nullable', 'integer'],
        ]);

        // Validate that any provided template_id belongs to THIS user
        $userTemplateIds = $user->templates()->pluck('id')->toArray();
        $cleanMap = [];
        foreach (['auto_day_1', 'auto_day_3', 'auto_day_7'] as $key) {
            $value = $validated['template_map'][$key] ?? null;
            $cleanMap[$key] = ($value !== null && \in_array((int) $value, $userTemplateIds, true))
                ? (int) $value
                : null;
        }

        UserAutomation::updateOrCreate(
            ['user_id' => $user->id],
            [
                'autosend_enabled' => $validated['autosend_enabled'],
                'template_map' => $cleanMap,
            ],
        );

        return back()->with('success', 'Automation settings saved.');
    }
}
