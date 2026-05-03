<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Plan;
use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StatsController extends Controller
{
    public function index(): Response
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        $totalUsers = User::count();
        $newUsersThisMonth = User::where('created_at', '>=', $startOfMonth)->count();
        $totalAdmins = User::where('is_admin', true)->count();

        $activeSubs = Subscription::where('status', 'active')
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->count();

        $usersByPlan = User::select('plan', DB::raw('COUNT(*) as total'))
            ->groupBy('plan')
            ->pluck('total', 'plan');

        // MRR — sum of monthly equivalent of currently-active recurring plans
        $mrrCents = 0;
        foreach (Plan::cases() as $plan) {
            if ($plan === Plan::Trial || $plan === Plan::FounderLifetime) {
                continue; // trial is free, lifetime doesn't recur
            }
            $count = (int) ($usersByPlan[$plan->value] ?? 0);
            $mrrCents += $count * $plan->priceCents();
        }

        $totalRevenueCents = (int) Payment::where('status', 'paid')->sum('amount_cents');
        $thisMonthRevenueCents = (int) Payment::where('status', 'paid')
            ->where('paid_at', '>=', $startOfMonth)
            ->sum('amount_cents');
        $lastMonthRevenueCents = (int) Payment::where('status', 'paid')
            ->whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('amount_cents');

        $totalAffiliates = Affiliate::count();
        $totalCommissionPaidCents = (int) Affiliate::sum('total_paid_cents');
        $totalCommissionEarnedCents = (int) Affiliate::sum('total_earned_cents');
        $pendingPayoutsCount = Payout::whereIn('status', ['requested', 'processing'])->count();

        $totalLeads = Lead::count();
        $totalLeadsClosed = Lead::where('status', 'closed')->count();

        return Inertia::render('Admin/Stats', [
            'kpis' => [
                'total_users' => $totalUsers,
                'new_users_this_month' => $newUsersThisMonth,
                'total_admins' => $totalAdmins,
                'active_subs' => $activeSubs,
                'total_affiliates' => $totalAffiliates,
                'pending_payouts' => $pendingPayoutsCount,
                'total_leads' => $totalLeads,
                'total_leads_closed' => $totalLeadsClosed,
            ],
            'revenue' => [
                'mrr_myr' => $mrrCents / 100,
                'arr_myr' => ($mrrCents * 12) / 100,
                'this_month_myr' => $thisMonthRevenueCents / 100,
                'last_month_myr' => $lastMonthRevenueCents / 100,
                'total_myr' => $totalRevenueCents / 100,
                'commission_paid_myr' => $totalCommissionPaidCents / 100,
                'commission_earned_myr' => $totalCommissionEarnedCents / 100,
            ],
            'usersByPlan' => array_map(
                fn (Plan $p) => [
                    'plan' => $p->value,
                    'label' => $p->label(),
                    'count' => (int) ($usersByPlan[$p->value] ?? 0),
                    'badge' => $p->badgeClass(),
                ],
                Plan::cases()
            ),
        ]);
    }
}
