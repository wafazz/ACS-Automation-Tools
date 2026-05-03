<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $start30Days = $now->copy()->subDays(29)->startOfDay();

        $base = $user->leads();

        // Top-level KPIs
        $totalLeads = (clone $base)->count();
        $newThisMonth = (clone $base)->where('created_at', '>=', $startOfMonth)->count();
        $closedAllTime = (clone $base)->where('status', LeadStatus::Closed->value)->count();
        $closedThisMonth = (clone $base)
            ->where('status', LeadStatus::Closed->value)
            ->where('updated_at', '>=', $startOfMonth)
            ->count();
        $conversionRate = $totalLeads > 0 ? round(($closedAllTime / $totalLeads) * 100, 1) : 0.0;

        // Pipeline value (open leads with amount set)
        $pipelineValue = (float) (clone $base)
            ->where('status', '!=', LeadStatus::Closed->value)
            ->sum('amount');
        $closedValueThisMonth = (float) (clone $base)
            ->where('status', LeadStatus::Closed->value)
            ->where('updated_at', '>=', $startOfMonth)
            ->sum('amount');
        $closedValueAllTime = (float) (clone $base)
            ->where('status', LeadStatus::Closed->value)
            ->sum('amount');

        // Average follow-up time (created_at to last_contacted_at) in hours
        $avgFollowUpHours = (clone $base)
            ->whereNotNull('last_contacted_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, last_contacted_at)) as avg_hours')
            ->value('avg_hours');
        $avgFollowUpHours = $avgFollowUpHours !== null ? round((float) $avgFollowUpHours, 1) : null;

        // Status distribution
        $statusCounts = (clone $base)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $statusBreakdown = array_map(
            fn (LeadStatus $s) => [
                'status' => $s->value,
                'label' => $s->label(),
                'count' => (int) ($statusCounts[$s->value] ?? 0),
            ],
            LeadStatus::cases()
        );

        // Source breakdown (top 8)
        $sourceBreakdown = (clone $base)
            ->select('source', DB::raw('COUNT(*) as total'))
            ->whereNotNull('source')
            ->groupBy('source')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['source' => $row->source, 'count' => (int) $row->total])
            ->toArray();

        // 30-day trend: leads added per day
        $trendRows = (clone $base)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as total'))
            ->where('created_at', '>=', $start30Days)
            ->groupBy('day')
            ->pluck('total', 'day');

        $trend = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->startOfDay();
            $key = $date->format('Y-m-d');
            $trend[] = [
                'date' => $key,
                'label' => $date->format('d M'),
                'count' => (int) ($trendRows[$key] ?? 0),
            ];
        }

        // Goal tracking
        $monthlyTarget = (int) $user->monthly_target;
        $goalProgress = $monthlyTarget > 0 ? min(100, round(($closedThisMonth / $monthlyTarget) * 100)) : 0;
        $daysIntoMonth = $now->day;
        $daysInMonth = $now->daysInMonth;
        $expectedPace = $monthlyTarget > 0
            ? round(($daysIntoMonth / $daysInMonth) * $monthlyTarget, 1)
            : 0;

        return Inertia::render('Analytics/Index', [
            'kpis' => [
                'total_leads' => $totalLeads,
                'new_this_month' => $newThisMonth,
                'closed_all_time' => $closedAllTime,
                'closed_this_month' => $closedThisMonth,
                'conversion_rate' => $conversionRate,
                'avg_follow_up_hours' => $avgFollowUpHours,
            ],
            'pipeline' => [
                'open_value' => $pipelineValue,
                'closed_value_month' => $closedValueThisMonth,
                'closed_value_all' => $closedValueAllTime,
            ],
            'goal' => [
                'target' => $monthlyTarget,
                'achieved' => $closedThisMonth,
                'progress_pct' => $goalProgress,
                'expected_pace' => $expectedPace,
                'days_into_month' => $daysIntoMonth,
                'days_in_month' => $daysInMonth,
            ],
            'statusBreakdown' => $statusBreakdown,
            'sourceBreakdown' => $sourceBreakdown,
            'trend' => $trend,
        ]);
    }
}
