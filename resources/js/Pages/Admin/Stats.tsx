import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { PageProps } from '@/types';
import { registerCharts } from '@/utils/charts';
import { Link, router, usePage } from '@inertiajs/react';
import { Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components at module load (must happen BEFORE first render)
registerCharts();

interface ActivityItem {
    type: 'signup' | 'payment' | 'payout';
    icon: string;
    tone: 'primary' | 'success' | 'warning' | 'danger';
    title: string;
    detail: string;
    at: string;
}

interface PageData {
    range: '7d' | '30d' | '90d';
    kpis: {
        total_users: number;
        new_users_this_month: number;
        total_admins: number;
        active_subs: number;
        total_affiliates: number;
        pending_payouts: number;
        total_leads: number;
        total_leads_closed: number;
    };
    revenue: {
        mrr_myr: number;
        arr_myr: number;
        this_month_myr: number;
        last_month_myr: number;
        total_myr: number;
        commission_paid_myr: number;
        commission_earned_myr: number;
    };
    usersByPlan: Array<{ plan: string; label: string; count: number; badge: string }>;
    trend: Array<{ date: string; label: string; myr: number }>;
    signupTrend: number[];
    activity: ActivityItem[];
    topAffiliates: Array<{ name: string; code: string; earned_myr: number }>;
    topCustomers: Array<{ name: string; plan: string; lifetime_myr: number }>;
    health: { billplz: boolean; brevo: boolean; onsend: boolean };
}

const PLAN_COLOR: Record<string, string> = {
    trial: '#6c757d',
    starter: '#0d6efd',
    pro: '#198754',
    team: '#0dcaf0',
    founder_ltd: '#ffc107',
};

const RANGES: Array<{ value: '7d' | '30d' | '90d'; label: string }> = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
];

function formatMyr(value: number): string {
    return 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' });
}

export default function Stats() {
    const { range, kpis, revenue, usersByPlan, trend, signupTrend, activity, topAffiliates, topCustomers, health } =
        usePage<PageProps<PageData>>().props;

    const setRange = (r: '7d' | '30d' | '90d') => {
        router.get(route('admin.stats'), { range: r }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    };

    const refresh = () => {
        router.reload();
    };

    const revenueDelta = revenue.this_month_myr - revenue.last_month_myr;
    const revenueDeltaPct = revenue.last_month_myr > 0
        ? ((revenueDelta / revenue.last_month_myr) * 100).toFixed(1)
        : null;

    return (
        <AdminLTELayout
            title="Admin · Stats"
            pageTitle="Global Stats"
            pageActions={
                <div className="d-flex gap-2 align-items-center">
                    <HealthDots health={health} />
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={refresh} title="Refresh">
                        <i className="bi bi-arrow-clockwise" />
                    </button>
                </div>
            }
        >
            {/* Revenue Cards */}
            <div className="row g-3 mb-4">
                <RevenueCard
                    label="MRR"
                    value={formatMyr(revenue.mrr_myr)}
                    sub={`ARR ${formatMyr(revenue.arr_myr)}`}
                    icon="bi-graph-up-arrow"
                    bg="bg-success"
                />
                <RevenueCard
                    label="This Month"
                    value={formatMyr(revenue.this_month_myr)}
                    sub={
                        revenueDeltaPct !== null
                            ? `${revenueDelta >= 0 ? '↑' : '↓'} ${Math.abs(parseFloat(revenueDeltaPct))}% vs last month`
                            : 'first month'
                    }
                    icon="bi-cash-coin"
                    bg="bg-primary"
                />
                <RevenueCard
                    label="All-Time"
                    value={formatMyr(revenue.total_myr)}
                    sub="lifetime paid"
                    icon="bi-bank"
                    bg="bg-info"
                />
                <RevenueCard
                    label="Commissions Paid"
                    value={formatMyr(revenue.commission_paid_myr)}
                    sub={`${formatMyr(revenue.commission_earned_myr)} earned`}
                    icon="bi-share"
                    bg="bg-warning"
                />
            </div>

            {/* Revenue Trend Chart + Range Selector */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <h6 className="fw-semibold mb-0">
                            <i className="bi bi-activity me-2 text-primary" />
                            Revenue & Signups Trend
                        </h6>
                        <div className="btn-group btn-group-sm">
                            {RANGES.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    className={`btn ${range === r.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setRange(r.value)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 280 }}>
                        <Line
                            data={{
                                labels: trend.map((t) => t.label),
                                datasets: [
                                    {
                                        label: 'Revenue (RM)',
                                        data: trend.map((t) => t.myr),
                                        borderColor: '#198754',
                                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                        fill: true,
                                        tension: 0.3,
                                        pointRadius: 2,
                                        pointHoverRadius: 5,
                                        yAxisID: 'y',
                                    },
                                    {
                                        label: 'Signups',
                                        data: signupTrend,
                                        borderColor: '#0d6efd',
                                        backgroundColor: 'transparent',
                                        borderDash: [4, 4],
                                        tension: 0.3,
                                        pointRadius: 2,
                                        pointHoverRadius: 5,
                                        yAxisID: 'y1',
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: { mode: 'index', intersect: false },
                                plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        position: 'left',
                                        title: { display: true, text: 'RM', font: { size: 11 } },
                                    },
                                    y1: {
                                        beginAtZero: true,
                                        position: 'right',
                                        ticks: { precision: 0 },
                                        grid: { drawOnChartArea: false },
                                        title: { display: true, text: 'signups', font: { size: 11 } },
                                    },
                                    x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* KPI grid + Doughnut */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-speedometer me-2 text-primary" />
                                Operations
                            </h6>
                            <div className="row g-3">
                                <KpiTile href="/admin/users" label="Total Users" value={kpis.total_users} sub={`+${kpis.new_users_this_month} this month`} icon="bi-people" />
                                <KpiTile href="/admin/users" label="Admins" value={kpis.total_admins} sub="with admin flag" icon="bi-shield-lock" />
                                <KpiTile href="/admin/payments" label="Active Subs" value={kpis.active_subs} sub="paying customers" icon="bi-credit-card-2-front" />
                                <KpiTile href="/admin/affiliates" label="Affiliates" value={kpis.total_affiliates} sub="opted-in" icon="bi-share" />
                                <KpiTile href="/admin/affiliates" label="Pending Payouts" value={kpis.pending_payouts} sub={kpis.pending_payouts > 0 ? 'needs action' : 'all clear'} icon="bi-cash-coin" warn={kpis.pending_payouts > 0} />
                                <KpiTile href="/admin/users" label="Total Leads" value={kpis.total_leads} sub={`${kpis.total_leads_closed} closed`} icon="bi-funnel" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-pie-chart me-2 text-primary" />
                                Users by Plan
                            </h6>
                            {kpis.total_users === 0 ? (
                                <p className="text-muted small mb-0">No users yet.</p>
                            ) : (
                                <div style={{ height: 220 }}>
                                    <Doughnut
                                        data={{
                                            labels: usersByPlan.map((p) => p.label),
                                            datasets: [{
                                                data: usersByPlan.map((p) => p.count),
                                                backgroundColor: usersByPlan.map((p) => PLAN_COLOR[p.plan] ?? '#dee2e6'),
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
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Feed + Top Performers */}
            <div className="row g-3">
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom">
                            <h6 className="fw-semibold mb-0">
                                <i className="bi bi-clock-history me-2 text-primary" />
                                Recent Activity
                            </h6>
                        </div>
                        <div className="card-body p-0">
                            {activity.length === 0 ? (
                                <p className="text-muted small p-4 mb-0">No activity yet.</p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {activity.map((item, idx) => (
                                        <li key={idx} className="list-group-item d-flex align-items-start gap-3 py-3">
                                            <div
                                                className={`d-flex align-items-center justify-content-center rounded-circle bg-${item.tone}-subtle text-${item.tone} flex-shrink-0`}
                                                style={{ width: 36, height: 36 }}
                                            >
                                                <i className={`bi ${item.icon}`} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-medium small">{item.title}</div>
                                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                    {item.detail}
                                                </div>
                                            </div>
                                            <div className="text-muted small flex-shrink-0">{formatRelative(item.at)}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    {/* Top Affiliates */}
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="fw-semibold mb-0">
                                <i className="bi bi-trophy me-2 text-warning" />
                                Top Affiliates
                            </h6>
                            <Link href="/admin/affiliates" className="small text-decoration-none">View all →</Link>
                        </div>
                        <div className="card-body p-0">
                            {topAffiliates.length === 0 ? (
                                <p className="text-muted small p-3 mb-0">No affiliates yet.</p>
                            ) : (
                                <ol className="list-group list-group-flush list-group-numbered">
                                    {topAffiliates.map((a, idx) => (
                                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-medium small">{a.name}</div>
                                                <div className="font-monospace text-muted" style={{ fontSize: '0.7rem' }}>{a.code}</div>
                                            </div>
                                            <span className="badge bg-success-subtle text-success">{formatMyr(a.earned_myr)}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="fw-semibold mb-0">
                                <i className="bi bi-star me-2 text-primary" />
                                Top Customers
                            </h6>
                            <Link href="/admin/payments" className="small text-decoration-none">View all →</Link>
                        </div>
                        <div className="card-body p-0">
                            {topCustomers.length === 0 ? (
                                <p className="text-muted small p-3 mb-0">No paying customers yet.</p>
                            ) : (
                                <ol className="list-group list-group-flush list-group-numbered">
                                    {topCustomers.map((c, idx) => (
                                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-medium small">{c.name}</div>
                                                <div className="text-muted text-capitalize" style={{ fontSize: '0.7rem' }}>{c.plan}</div>
                                            </div>
                                            <span className="badge bg-primary-subtle text-primary">{formatMyr(c.lifetime_myr)}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}

function RevenueCard({ label, value, sub, icon, bg }: { label: string; value: string; sub: string; icon: string; bg: string }) {
    return (
        <div className="col-12 col-sm-6 col-xl-3">
            <div className={`card text-white ${bg} shadow-sm border-0 h-100`}>
                <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="small opacity-75">{label}</div>
                        <i className={`bi ${icon} fs-4 opacity-50`} />
                    </div>
                    <div className="fs-3 fw-bold mb-1">{value}</div>
                    <div className="small opacity-75">{sub}</div>
                </div>
            </div>
        </div>
    );
}

function KpiTile({ href, label, value, sub, icon, warn = false }: { href: string; label: string; value: string | number; sub: string; icon: string; warn?: boolean }) {
    return (
        <div className="col-6 col-md-4">
            <Link
                href={href}
                className={`d-block border rounded p-3 h-100 text-decoration-none text-body ${warn ? 'border-warning bg-warning-subtle' : ''}`}
                style={{ transition: 'all 0.15s' }}
            >
                <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="text-muted small">{label}</span>
                    <i className={`bi ${icon} ${warn ? 'text-warning' : 'text-secondary'}`} />
                </div>
                <div className={`fs-4 fw-bold ${warn ? 'text-warning-emphasis' : ''}`}>{value}</div>
                <div className="text-muted small">{sub}</div>
            </Link>
        </div>
    );
}

function HealthDots({ health }: { health: { billplz: boolean; brevo: boolean; onsend: boolean } }) {
    const items: Array<{ key: keyof typeof health; label: string; href: string }> = [
        { key: 'billplz', label: 'Billplz', href: '/admin/settings/billplz' },
        { key: 'brevo', label: 'Brevo', href: '/admin/settings/brevo' },
        { key: 'onsend', label: 'Onsend', href: '/admin/settings/onsend' },
    ];
    return (
        <div className="d-none d-md-flex align-items-center gap-2 me-2">
            {items.map((item) => (
                <Link
                    key={item.key}
                    href={item.href}
                    className="d-flex align-items-center gap-1 text-decoration-none small"
                    title={`${item.label}: ${health[item.key] ? 'configured' : 'not configured'}`}
                >
                    <span
                        className={`d-inline-block rounded-circle ${health[item.key] ? 'bg-success' : 'bg-secondary'}`}
                        style={{ width: 8, height: 8 }}
                    />
                    <span className="text-muted">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
