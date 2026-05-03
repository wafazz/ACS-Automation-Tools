<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Plan;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query()->withCount(['leads', 'reminders', 'templates']);

        $search = $request->string('q')->toString();
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $planFilter = $request->string('plan')->toString();
        if ($planFilter !== '') {
            $query->where('plan', $planFilter);
        }

        $users = $query->latest()
            ->limit(100)
            ->get(['id', 'name', 'email', 'phone', 'industry', 'plan', 'is_admin', 'created_at', 'trial_ends_at']);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => [
                'q' => $search,
                'plan' => $planFilter,
            ],
            'plans' => array_map(
                fn (Plan $p) => ['value' => $p->value, 'label' => $p->label(), 'badge' => $p->badgeClass()],
                Plan::cases()
            ),
        ]);
    }

    public function updatePlan(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'plan' => ['required', Rule::enum(Plan::class)],
        ]);

        $user->update(['plan' => $validated['plan']]);

        return back()->with('success', "Plan updated for {$user->name}.");
    }

    public function toggleAdmin(User $user): RedirectResponse
    {
        $user->update(['is_admin' => ! $user->is_admin]);

        return back()->with('success', $user->is_admin
            ? "{$user->name} is now an admin."
            : "Admin removed from {$user->name}.");
    }
}
