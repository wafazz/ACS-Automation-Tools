import AdminLTELayout from '@/Layouts/AdminLTELayout';
import StatusBadge from '@/Components/Leads/StatusBadge';
import EmptyState from '@/Components/UX/EmptyState';
import { useConfirm } from '@/Hooks/useConfirm';
import { Lead, PageProps, Reminder, StatusOption } from '@/types';
import { registerCharts } from '@/utils/charts';
import { Link, router, usePage } from '@inertiajs/react';
import { Doughnut, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

// Register Chart.js components at module load (must run BEFORE first render)
registerCharts();

interface ActivityItem {
    lead_id: number;
    title: string;
    note: string | null;
    is_note: boolean;
    tone: 'primary' | 'success' | 'secondary';
    icon: string;
    at: string;
}

interface DashboardProps {
    stats: {
        total_leads: number;
        new_this_month: number;
        closed_this_month: number;
        conversion_rate: number;
    };
    trend7d: number[];
    statusBreakdown: Array<{ status: string; label: string; count: number; badge: string }>;
    statuses: StatusOption[];
    recentLeads: Lead[];
    todayReminders: Reminder[];
    overdueCount: number;
    upcomingCount: number;
    activity: ActivityItem[];
    goal: {
        target: number;
        achieved: number;
        progress_pct: number;
        expected_pace: number;
        on_pace: boolean;
        days_into_month: number;
        days_in_month: number;
    };
}

const STATUS_COLOR: Record<string, string> = {
    new: '#6c757d',
    follow_up: '#ffc107',
    interested: '#0dcaf0',
    closed: '#198754',
};

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

function formatPhoneForWa(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('60')) return digits;
    if (digits.startsWith('0')) return '60' + digits.slice(1);
    return digits;
}

export default function Dashboard() {
    const { auth, stats, trend7d, statusBreakdown, statuses, recentLeads, todayReminders,
            overdueCount, upcomingCount, activity, goal } =
        usePage<PageProps<DashboardProps>>().props;
    const user = auth.user!;
    const billing = auth.billing;
    const ask = useConfirm();

    const completeReminder = (id: number) => {
        router.patch(route('reminders.complete', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Reminder completed.'),
        });
    };

    const snoozeReminder = (id: number) => {
        router.patch(route('reminders.snooze', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Snoozed by 1 day.'),
        });
    };

    const dismissReminder = async (id: number) => {
        const ok = await ask({
            title: 'Dismiss this reminder?',
            text: 'It will be removed from your active list.',
            icon: 'question',
            tone: 'warning',
        });
        if (!ok) return;
        router.patch(route('reminders.dismiss', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Dismissed.'),
        });
    };

    const refresh = () => router.reload();

    return (
        <AdminLTELayout
            title="Dashboard"
            pageTitle={`Welcome back, ${user.name.split(' ')[0]}`}
            pageActions={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={refresh} title="Refresh">
                        <i className="bi bi-arrow-clockwise" />
                    </button>
                    <Link href={route('leads.create')} className="btn btn-primary">
                        <i className="bi bi-plus-lg me-1" />
                        Add Lead
                    </Link>
                </div>
            }
        >
            {/* Trial banner */}
            {billing?.is_trial && (
                <div className="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                        <i className="bi bi-stars me-2" />
                        <strong>Trial</strong> — {billing.trial_days_left ?? 0} day{billing.trial_days_left === 1 ? '' : 's'} left to keep all features
                    </div>
                    <Link href="/pricing" className="btn btn-warning btn-sm">
                        See plans →
                    </Link>
                </div>
            )}

            {/* KPI cards (clickable, with sparkline on Total Leads) */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <Link href={route('leads.index')} className="card text-white bg-primary shadow-sm border-0 h-100 text-decoration-none d-block">
                        <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                                <div className="small opacity-75">Total Leads</div>
                                <i className="bi bi-people fs-4 opacity-50" />
                            </div>
                            <div className="fs-2 fw-bold mb-1">{stats.total_leads}</div>
                            <Sparkline data={trend7d} stroke="rgba(255,255,255,0.85)" fill="rgba(255,255,255,0.15)" />
                            <div className="small opacity-75 mt-1">last 7 days</div>
                        </div>
                    </Link>
                </div>
                <KpiCard label="New This Month" value={stats.new_this_month} sub="freshly added" icon="bi-plus-circle" bg="bg-info" href={route('leads.index')} />
                <KpiCard label="Closed This Month" value={stats.closed_this_month} sub={`${goal.target} goal`} icon="bi-trophy" bg="bg-success" href={`${route('leads.index')}?status=closed`} />
                <KpiCard label="Conversion Rate" value={`${stats.conversion_rate}%`} sub="closed / total" icon="bi-graph-up" bg="bg-warning" href={route('analytics.index')} />
            </div>

            {/* Goal + Status Pipeline row */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-semibold mb-0">
                                    <i className="bi bi-bullseye me-2 text-primary" />
                                    Monthly Goal
                                </h6>
                                <span className={`badge ${goal.on_pace ? 'bg-success' : 'bg-warning text-dark'}`}>
                                    {goal.on_pace ? 'On pace' : 'Behind pace'}
                                </span>
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-2">
                                <span className="display-6 fw-bold">{goal.achieved}</span>
                                <span className="text-muted">/ {goal.target} closed</span>
                            </div>
                            <div className="progress mb-2" style={{ height: 10 }}>
                                <div
                                    className={`progress-bar ${goal.progress_pct >= 100 ? 'bg-success' : 'bg-primary'}`}
                                    style={{ width: `${goal.progress_pct}%` }}
                                />
                            </div>
                            <div className="d-flex justify-content-between text-muted small">
                                <span>{goal.progress_pct}% achieved</span>
                                <span>Day {goal.days_into_month} of {goal.days_in_month} · pace: {goal.expected_pace}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-funnel me-2 text-primary" />
                                Pipeline
                            </h6>
                            {stats.total_leads === 0 ? (
                                <p className="text-muted small mb-0">No leads yet.</p>
                            ) : (
                                <div className="row g-2 align-items-center">
                                    <div className="col-7" style={{ height: 130 }}>
                                        <Doughnut
                                            data={{
                                                labels: statusBreakdown.map((s) => s.label),
                                                datasets: [{
                                                    data: statusBreakdown.map((s) => s.count),
                                                    backgroundColor: statusBreakdown.map((s) => STATUS_COLOR[s.status] ?? '#dee2e6'),
                                                    borderWidth: 2,
                                                    borderColor: '#fff',
                                                }],
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                cutout: '65%',
                                                plugins: { legend: { display: false } },
                                            }}
                                        />
                                    </div>
                                    <div className="col-5">
                                        {statusBreakdown.map((s) => (
                                            <Link
                                                key={s.status}
                                                href={`${route('leads.index')}?status=${s.status}`}
                                                className="d-flex justify-content-between align-items-center text-decoration-none text-body py-1 small"
                                                title={`Filter leads by ${s.label}`}
                                            >
                                                <span className="d-flex align-items-center gap-2">
                                                    <span
                                                        className="d-inline-block rounded-circle"
                                                        style={{ width: 10, height: 10, backgroundColor: STATUS_COLOR[s.status] ?? '#dee2e6' }}
                                                    />
                                                    {s.label}
                                                </span>
                                                <span className="fw-medium">{s.count}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Leads + Today's Reminders */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="fw-semibold mb-0">
                                <i className="bi bi-list-ul me-2 text-primary" />
                                Recent Leads
                            </h6>
                            <Link href={route('leads.index')} className="btn btn-sm btn-outline-primary">View all</Link>
                        </div>
                        <div className="card-body p-0">
                            {recentLeads.length === 0 ? (
                                <div className="p-4">
                                    <EmptyState
                                        icon="bi-people"
                                        title="No leads yet"
                                        description="Add your first lead to start tracking your pipeline."
                                        action={
                                            <Link href={route('leads.create')} className="btn btn-primary">
                                                <i className="bi bi-plus-lg me-1" />
                                                Add Lead
                                            </Link>
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Status</th>
                                                <th className="text-end">Added</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentLeads.map((lead) => (
                                                <tr key={lead.id}>
                                                    <td>
                                                        <Link href={route('leads.show', lead.id)} className="fw-medium text-decoration-none">
                                                            {lead.name}
                                                        </Link>
                                                    </td>
                                                    <td className="text-muted small">{lead.phone}</td>
                                                    <td>
                                                        <StatusBadge status={lead.status} statuses={statuses} size="sm" />
                                                    </td>
                                                    <td className="text-end text-muted small">
                                                        {new Date(lead.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h6 className="fw-semibold mb-0">
                                <i className="bi bi-bell me-2 text-primary" />
                                Today
                                {overdueCount > 0 && (
                                    <span className="badge text-bg-danger ms-2">{overdueCount} overdue</span>
                                )}
                                {upcomingCount > 0 && (
                                    <span className="badge text-bg-info ms-1">{upcomingCount} upcoming</span>
                                )}
                            </h6>
                            <Link href={`${route('reminders.index')}?tab=today`} className="btn btn-sm btn-outline-primary">View all</Link>
                        </div>
                        <div className="card-body p-0">
                            {todayReminders.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="bi bi-check2-circle text-success" style={{ fontSize: '2.5rem' }} />
                                    <p className="text-muted mt-2 mb-0 small">All clear. No reminders due today.</p>
                                </div>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {todayReminders.map((r) => (
                                        <li key={r.id} className="list-group-item d-flex justify-content-between align-items-start gap-2">
                                            <div className="flex-grow-1">
                                                {r.lead ? (
                                                    <Link href={route('leads.show', r.lead.id)} className="fw-medium text-decoration-none small">
                                                        {r.lead.name}
                                                    </Link>
                                                ) : (
                                                    <span className="small fst-italic text-muted">General</span>
                                                )}
                                                <div className="text-muted small">
                                                    <i className="bi bi-clock me-1" />
                                                    {new Date(r.due_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className="btn-group btn-group-sm">
                                                {r.lead && (
                                                    <a
                                                        href={`https://wa.me/${formatPhoneForWa(r.lead.phone)}`}
                                                        target="_blank"
                                                        rel="noopener"
                                                        className="btn btn-outline-success"
                                                        title="WhatsApp"
                                                    >
                                                        <i className="bi bi-whatsapp" />
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-success"
                                                    onClick={() => completeReminder(r.id)}
                                                    title="Complete"
                                                >
                                                    <i className="bi bi-check-lg" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => snoozeReminder(r.id)}
                                                    title="Snooze 1 day"
                                                >
                                                    <i className="bi bi-clock-history" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-warning"
                                                    onClick={() => dismissReminder(r.id)}
                                                    title="Dismiss"
                                                >
                                                    <i className="bi bi-x-lg" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h6 className="fw-semibold mb-0">
                        <i className="bi bi-clock-history me-2 text-primary" />
                        Recent Activity
                    </h6>
                </div>
                <div className="card-body p-0">
                    {activity.length === 0 ? (
                        <p className="text-muted small p-4 mb-0">
                            No activity yet. Update a lead's status or add a note to see it here.
                        </p>
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
                                        <Link href={route('leads.show', item.lead_id)} className="fw-medium small text-decoration-none text-body">
                                            {item.title}
                                        </Link>
                                        {item.note && (
                                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                {item.note}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-muted small flex-shrink-0">{formatRelative(item.at)}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AdminLTELayout>
    );
}

function KpiCard({ label, value, sub, icon, bg, href }: { label: string; value: string | number; sub: string; icon: string; bg: string; href: string }) {
    return (
        <div className="col-12 col-sm-6 col-xl-3">
            <Link href={href} className={`card text-white ${bg} shadow-sm border-0 h-100 text-decoration-none d-block`}>
                <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="small opacity-75">{label}</div>
                        <i className={`bi ${icon} fs-4 opacity-50`} />
                    </div>
                    <div className="fs-2 fw-bold mb-1">{value}</div>
                    <div className="small opacity-75">{sub}</div>
                </div>
            </Link>
        </div>
    );
}

function Sparkline({ data, stroke, fill }: { data: number[]; stroke: string; fill: string }) {
    if (data.length === 0) return null;
    return (
        <div style={{ height: 32 }}>
            <Line
                data={{
                    labels: data.map((_, i) => i),
                    datasets: [{
                        data,
                        borderColor: stroke,
                        backgroundColor: fill,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                    }],
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false, beginAtZero: true },
                    },
                    elements: { line: { borderJoinStyle: 'round' } },
                }}
            />
        </div>
    );
}
