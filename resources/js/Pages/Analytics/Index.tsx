import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { PageProps } from '@/types';
import { registerCharts } from '@/utils/charts';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

interface PageData {
    kpis: {
        total_leads: number;
        new_this_month: number;
        closed_all_time: number;
        closed_this_month: number;
        conversion_rate: number;
        avg_follow_up_hours: number | null;
    };
    pipeline: {
        open_value: number;
        closed_value_month: number;
        closed_value_all: number;
    };
    goal: {
        target: number;
        achieved: number;
        progress_pct: number;
        expected_pace: number;
        days_into_month: number;
        days_in_month: number;
    };
    statusBreakdown: Array<{ status: string; label: string; count: number }>;
    sourceBreakdown: Array<{ source: string; count: number }>;
    trend: Array<{ date: string; label: string; count: number }>;
}

const STATUS_COLORS: Record<string, string> = {
    new: '#6c757d',
    follow_up: '#ffc107',
    interested: '#0dcaf0',
    closed: '#198754',
};

function formatRM(value: number): string {
    return 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatHours(hours: number | null): string {
    if (hours === null) return '—';
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
}

export default function Index() {
    const { kpis, pipeline, goal, statusBreakdown, sourceBreakdown, trend } =
        usePage<PageProps<PageData>>().props;

    useEffect(() => {
        registerCharts();
    }, []);

    const onPace = goal.achieved >= goal.expected_pace;

    return (
        <AdminLTELayout title="Analytics" pageTitle="Performance Analytics">
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
                <KpiCard
                    label="Total Leads"
                    value={kpis.total_leads}
                    sub={`${kpis.new_this_month} new this month`}
                    icon="bi-people"
                    bg="bg-primary"
                />
                <KpiCard
                    label="Closed Deals"
                    value={kpis.closed_this_month}
                    sub={`${kpis.closed_all_time} all-time`}
                    icon="bi-trophy"
                    bg="bg-success"
                />
                <KpiCard
                    label="Conversion Rate"
                    value={`${kpis.conversion_rate}%`}
                    sub="closed / total"
                    icon="bi-graph-up"
                    bg="bg-info"
                />
                <KpiCard
                    label="Avg Follow-up Time"
                    value={formatHours(kpis.avg_follow_up_hours)}
                    sub="lead created → first contact"
                    icon="bi-clock-history"
                    bg="bg-warning"
                />
            </div>

            {/* Goal Tracking + Pipeline Value Row */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-semibold mb-0">
                                    <i className="bi bi-bullseye me-2 text-primary" />
                                    Monthly Goal Progress
                                </h6>
                                <span className={`badge ${onPace ? 'bg-success' : 'bg-warning text-dark'}`}>
                                    {onPace ? 'On pace' : 'Behind pace'}
                                </span>
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-2">
                                <span className="display-5 fw-bold">{goal.achieved}</span>
                                <span className="text-muted">/ {goal.target} closed</span>
                            </div>
                            <div className="progress mb-2" style={{ height: 12 }}>
                                <div
                                    className={`progress-bar ${goal.progress_pct >= 100 ? 'bg-success' : 'bg-primary'}`}
                                    style={{ width: `${goal.progress_pct}%` }}
                                />
                            </div>
                            <div className="d-flex justify-content-between text-muted small">
                                <span>{goal.progress_pct}% achieved</span>
                                <span>
                                    Day {goal.days_into_month} of {goal.days_in_month} · expected pace: {goal.expected_pace}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-cash-stack me-2 text-success" />
                                Pipeline Value
                            </h6>
                            <div className="mb-3">
                                <div className="text-muted small">Open pipeline</div>
                                <div className="fs-4 fw-bold">{formatRM(pipeline.open_value)}</div>
                            </div>
                            <div className="row g-2">
                                <div className="col-6">
                                    <div className="text-muted small">Closed this month</div>
                                    <div className="fw-semibold text-success">{formatRM(pipeline.closed_value_month)}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">Closed all-time</div>
                                    <div className="fw-semibold">{formatRM(pipeline.closed_value_all)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trend Line + Status Doughnut */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-activity me-2 text-primary" />
                                Leads Added — Last 30 Days
                            </h6>
                            <div style={{ height: 280 }}>
                                <Line
                                    data={{
                                        labels: trend.map((t) => t.label),
                                        datasets: [{
                                            label: 'New leads',
                                            data: trend.map((t) => t.count),
                                            borderColor: '#0d6efd',
                                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                            fill: true,
                                            tension: 0.3,
                                            pointRadius: 2,
                                            pointHoverRadius: 5,
                                        }],
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true, ticks: { precision: 0 } },
                                            x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-pie-chart me-2 text-primary" />
                                Lead Status Distribution
                            </h6>
                            <div style={{ height: 240 }}>
                                <Doughnut
                                    data={{
                                        labels: statusBreakdown.map((s) => s.label),
                                        datasets: [{
                                            data: statusBreakdown.map((s) => s.count),
                                            backgroundColor: statusBreakdown.map((s) => STATUS_COLORS[s.status] ?? '#dee2e6'),
                                            borderWidth: 2,
                                            borderColor: '#fff',
                                        }],
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Source Breakdown */}
            <div className="row g-3">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-funnel me-2 text-primary" />
                                Leads by Source
                            </h6>
                            {sourceBreakdown.length === 0 ? (
                                <p className="text-muted small mb-0">
                                    No source data yet. Add a source when creating new leads to see this breakdown.
                                </p>
                            ) : (
                                <div style={{ height: 280 }}>
                                    <Bar
                                        data={{
                                            labels: sourceBreakdown.map((s) => s.source),
                                            datasets: [{
                                                label: 'Leads',
                                                data: sourceBreakdown.map((s) => s.count),
                                                backgroundColor: '#0d6efd',
                                                borderRadius: 6,
                                                maxBarThickness: 50,
                                            }],
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: { beginAtZero: true, ticks: { precision: 0 } },
                                            },
                                            indexAxis: 'x',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}

interface KpiCardProps {
    label: string;
    value: string | number;
    sub: string;
    icon: string;
    bg: string;
}

function KpiCard({ label, value, sub, icon, bg }: KpiCardProps) {
    return (
        <div className="col-12 col-sm-6 col-xl-3">
            <div className={`card text-white ${bg} shadow-sm border-0 h-100`}>
                <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="small opacity-75">{label}</div>
                        <i className={`bi ${icon} fs-4 opacity-50`} />
                    </div>
                    <div className="fs-2 fw-bold mb-1">{value}</div>
                    <div className="small opacity-75">{sub}</div>
                </div>
            </div>
        </div>
    );
}
