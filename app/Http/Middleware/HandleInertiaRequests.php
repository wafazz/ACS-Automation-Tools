<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $plan = $user?->currentPlan();
        $sub = $user?->activeSubscription();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'phone' => $user->phone,
                    'industry' => $user->industry?->value,
                    'plan' => $user->plan,
                    'trial_ends_at' => $user->trial_ends_at,
                    'monthly_target' => $user->monthly_target,
                    'is_admin' => (bool) $user->is_admin,
                ] : null,
                'billing' => $user ? [
                    'plan_value' => $plan?->value,
                    'plan_label' => $plan?->label(),
                    'badge' => $plan?->badgeClass(),
                    'is_trial' => $plan?->value === 'trial',
                    'is_lifetime' => $plan?->durationDays() === null,
                    'trial_days_left' => $plan?->value === 'trial' && $user->trial_ends_at
                        ? max(0, (int) now()->diffInDays($user->trial_ends_at, false))
                        : null,
                    'sub_ends_at' => $sub?->ends_at,
                ] : null,
                'integrations' => $user ? fn () => [
                    'has_brevo' => app(\App\Services\SettingService::class)->isEnabled('brevo', $user->id),
                    'has_onsend' => app(\App\Services\SettingService::class)->isEnabled('onsend', $user->id),
                ] : null,
            ],
            'sidebarCounts' => $user ? fn () => [
                'reminders_open' => $user->reminders()
                    ->whereNull('completed_at')
                    ->whereNull('dismissed_at')
                    ->where('due_at', '<=', now()->endOfDay())
                    ->count(),
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
