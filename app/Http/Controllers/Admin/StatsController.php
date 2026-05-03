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
use App\Services\BillplzService;
use App\Services\BrevoService;
use App\Services\OnsendService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StatsController extends Controller
{
    public function index(
        Request $request,
        BillplzService $billplz,
        BrevoService $brevo,
        OnsendService $onsend,
    ): Response {
        $range = $request->string('range', '30d')->toString();
        $rangeDays = match ($range) {
            '7d' => 7,
            '90d' => 90,
            default => 30,
        };

        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();
        $rangeStart = $now->copy()->subDays($rangeDays - 1)->startOfDay();

        // Top KPIs
        $totalUsers = User::count();
        $newUsersThisMonth = User::where('created_at', '>=', $startOfMonth)->count();
        $totalAdmins = User::where('is_admin', true)->count();

        $activeSubs = Subscription::where('status', 'active')
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->count();

        $usersByPlan = User::select('plan', DB::raw('COUNT(*) as total'))
            ->groupBy('plan')
            ->pluck('total', 'plan');

        // MRR — sum of monthly recurring plan prices
        $mrrCents = 0;
        foreach (Plan::cases() as $plan) {
            if ($plan === Plan::Trial || $plan === Plan::FounderLifetime) continue;
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

        // Revenue trend — paid revenue per day across the selected range, with 0-fill
        $trendRows = Payment::select(
                DB::raw('DATE(paid_at) as day'),
                DB::raw('SUM(amount_cents) as cents'),
            )
            ->where('status', 'paid')
            ->where('paid_at', '>=', $rangeStart)
            ->groupBy('day')
            ->pluck('cents', 'day');

        $trend = [];
        for ($i = $rangeDays - 1; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->startOfDay();
            $key = $date->format('Y-m-d');
            $trend[] = [
                'date' => $key,
                'label' => $date->format('d M'),
                'myr' => (float) (($trendRows[$key] ?? 0) / 100),
            ];
        }

        // Signup trend (same range)
        $signupRows = User::select(
                DB::raw('DATE(created_at) as day'),
                DB::raw('COUNT(*) as total'),
            )
            ->where('created_at', '>=', $rangeStart)
            ->groupBy('day')
            ->pluck('total', 'day');

        $signupTrend = [];
        for ($i = $rangeDays - 1; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->startOfDay();
            $signupTrend[] = (int) ($signupRows[$date->format('Y-m-d')] ?? 0);
        }

        // Recent activity feed: union of signups, payments, payouts
        $activity = collect();

        User::latest()->limit(10)->get(['id', 'name', 'email', 'created_at'])->each(function ($u) use ($activity) {
            $activity->push([
                'type' => 'signup',
                'icon' => 'bi-person-plus',
                'tone' => 'primary',
                'title' => "{$u->name} signed up",
                'detail' => $u->email,
                'at' => $u->created_at,
            ]);
        });

        Payment::with('user:id,name')
            ->where('status', 'paid')
            ->latest('paid_at')
            ->limit(10)
            ->get()
            ->each(function (Payment $p) use ($activity) {
                $kind = $p->subscription_id ? 'subscription' : ($p->template_pack_id ? 'pack' : 'payment');
                $amount = number_format($p->amountMyr(), 2);
                $userName = $p->user?->name ?? 'unknown';
                $activity->push([
                    'type' => 'payment',
                    'icon' => $kind === 'pack' ? 'bi-box-seam' : 'bi-credit-card',
                    'tone' => 'success',
                    'title' => "{$userName} paid RM {$amount}",
                    'detail' => ucfirst($kind),
                    'at' => $p->paid_at,
                ]);
            });

        Payout::with('affiliate.user:id,name')
            ->whereIn('status', ['requested', 'paid', 'rejected'])
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->each(function (Payout $p) use ($activity) {
                $userName = $p->affiliate?->user?->name ?? 'affiliate';
                $amount = number_format($p->amountMyr(), 2);
                $verb = match ($p->status) {
                    'requested' => 'requested payout of',
                    'paid' => 'received payout of',
                    'rejected' => 'payout rejected:',
                    default => 'payout',
                };
                $activity->push([
                    'type' => 'payout',
                    'icon' => $p->status === 'paid' ? 'bi-cash-coin' : 'bi-hourglass-split',
                    'tone' => $p->status === 'paid' ? 'success' : ($p->status === 'rejected' ? 'danger' : 'warning'),
                    'title' => "{$userName} {$verb} RM {$amount}",
                    'detail' => 'Payout #' . $p->id,
                    'at' => $p->updated_at,
                ]);
            });

        $activity = $activity
            ->sortByDesc('at')
            ->values()
            ->take(15)
            ->all();

        // Top performers
        $topAffiliates = Affiliate::with('user:id,name')
            ->orderByDesc('total_earned_cents')
            ->limit(5)
            ->get()
            ->map(fn (Affiliate $a) => [
                'name' => $a->user?->name ?? '—',
                'code' => $a->code,
                'earned_myr' => $a->totalEarnedMyr(),
            ])
            ->toArray();

        $topCustomers = Payment::select(
                'user_id',
                DB::raw('SUM(amount_cents) as lifetime_cents'),
            )
            ->where('status', 'paid')
            ->groupBy('user_id')
            ->orderByDesc('lifetime_cents')
            ->limit(5)
            ->with('user:id,name,plan')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->user?->name ?? '—',
                'plan' => $row->user?->plan ?? '—',
                'lifetime_myr' => (float) ($row->lifetime_cents / 100),
            ])
            ->toArray();

        // Integration health
        $health = [
            'billplz' => $billplz->isConfigured(),
            'brevo' => $brevo->isConfigured(),
            'onsend' => $onsend->isConfigured(),
        ];

        return Inertia::render('Admin/Stats', [
            'range' => $range,
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
            'trend' => $trend,
            'signupTrend' => $signupTrend,
            'activity' => $activity,
            'topAffiliates' => $topAffiliates,
            'topCustomers' => $topCustomers,
            'health' => $health,
        ]);
    }
}
