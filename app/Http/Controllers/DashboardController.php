<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Models\LeadStatusHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $start7Days = $now->copy()->subDays(6)->startOfDay();

        $leads = $user->leads();

        // KPIs
        $totalLeads = (clone $leads)->count();
        $newThisMonth = (clone $leads)->where('created_at', '>=', $startOfMonth)->count();
        $closedThisMonth = (clone $leads)
            ->where('status', LeadStatus::Closed->value)
            ->where('updated_at', '>=', $startOfMonth)
            ->count();
        $closedAllTime = (clone $leads)->where('status', LeadStatus::Closed->value)->count();
        $conversionRate = $totalLeads > 0 ? round(($closedAllTime / $totalLeads) * 100) : 0;

        // Status distribution (also used for clickable status pills)
        $statusCounts = (clone $leads)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $statusBreakdown = array_map(
            fn (LeadStatus $s) => [
                'status' => $s->value,
                'label' => $s->label(),
                'count' => (int) ($statusCounts[$s->value] ?? 0),
                'badge' => $s->badgeClass(),
            ],
            LeadStatus::cases()
        );

        // 7-day leads-added trend (mini chart in KPI card)
        $trendRows = (clone $leads)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as total'))
            ->where('created_at', '>=', $start7Days)
            ->groupBy('day')
            ->pluck('total', 'day');

        $trend7d = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->startOfDay();
            $trend7d[] = (int) ($trendRows[$date->format('Y-m-d')] ?? 0);
        }

        // Recent leads (table)
        $recentLeads = (clone $leads)
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'phone', 'status', 'created_at']);

        // Today's reminders (full data for the right-side card)
        $todayReminders = $user->reminders()
            ->with('lead:id,name,phone')
            ->dueToday()
            ->orderBy('due_at')
            ->limit(8)
            ->get();
        $overdueCount = $user->reminders()->overdue()->count();
        $upcomingCount = $user->reminders()->upcoming()->count();

        // Recent activity — last 8 status history entries across user's leads
        $activity = LeadStatusHistory::query()
            ->whereIn('lead_id', (clone $leads)->select('id'))
            ->with('lead:id,name')
            ->latest('created_at')
            ->limit(8)
            ->get()
            ->map(function (LeadStatusHistory $h) {
                $isNote = $h->from_status === $h->to_status;
                $leadName = $h->lead?->name ?? 'lead';
                $title = $isNote
                    ? "Note added on {$leadName}"
                    : "{$leadName}: " . ($h->from_status?->label() ?? 'New') . " → " . $h->to_status->label();
                return [
                    'lead_id' => $h->lead_id,
                    'title' => $title,
                    'note' => $h->note,
                    'is_note' => $isNote,
                    'tone' => $isNote ? 'secondary' : ($h->to_status === LeadStatus::Closed ? 'success' : 'primary'),
                    'icon' => $isNote ? 'bi-chat-dots' : 'bi-arrow-right-circle',
                    'at' => $h->created_at,
                ];
            })
            ->toArray();

        // Goal tracking
        $monthlyTarget = (int) ($user->monthly_target ?? 10);
        $goalProgress = $monthlyTarget > 0 ? min(100, round(($closedThisMonth / $monthlyTarget) * 100)) : 0;
        $daysIntoMonth = $now->day;
        $daysInMonth = $now->daysInMonth;
        $expectedPace = $monthlyTarget > 0
            ? round(($daysIntoMonth / $daysInMonth) * $monthlyTarget, 1)
            : 0;

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_leads' => $totalLeads,
                'new_this_month' => $newThisMonth,
                'closed_this_month' => $closedThisMonth,
                'conversion_rate' => $conversionRate,
            ],
            'trend7d' => $trend7d,
            'statusBreakdown' => $statusBreakdown,
            'statuses' => LeadStatus::options(),
            'recentLeads' => $recentLeads,
            'todayReminders' => $todayReminders,
            'overdueCount' => $overdueCount,
            'upcomingCount' => $upcomingCount,
            'activity' => $activity,
            'goal' => [
                'target' => $monthlyTarget,
                'achieved' => $closedThisMonth,
                'progress_pct' => $goalProgress,
                'expected_pace' => $expectedPace,
                'on_pace' => $closedThisMonth >= $expectedPace,
                'days_into_month' => $daysIntoMonth,
                'days_in_month' => $daysInMonth,
            ],
        ]);
    }
}
