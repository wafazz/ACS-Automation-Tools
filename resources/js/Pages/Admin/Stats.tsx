import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface PageData {
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
}

function formatMyr(value: number): string {
    return 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Stats() {
    const { kpis, revenue, usersByPlan } = usePage<PageProps<PageData>>().props;

    const monthlyDelta = kpis.new_users_this_month >= 0 ? '+' : '';
    const revenueDelta = revenue.this_month_myr - revenue.last_month_myr;
    const revenueDeltaPct = revenue.last_month_myr > 0
        ? ((revenueDelta / revenue.last_month_myr) * 100).toFixed(1)
        : '—';

    return (
        <AdminLTELayout title="Admin · Stats" pageTitle="Global Stats">
            <div className="alert alert-warning mb-4 d-flex align-items-start gap-2">
                <i className="bi bi-shield-lock-fill" />
                <div>
                    <strong>Admin area.</strong> Read-only stats across the entire SaaS.
                    Use the sidebar to manage users, payments, affiliates, and pack catalog.
                </div>
            </div>

            {/* Revenue Row */}
            <div className="row g-3 mb-4">
                <RevenueCard
                    label="MRR (Monthly Recurring)"
                    value={formatMyr(revenue.mrr_myr)}
                    sub={`ARR ${formatMyr(revenue.arr_myr)}`}
                    icon="bi-graph-up-arrow"
                    bg="bg-success"
                />
                <RevenueCard
                    label="This Month Revenue"
                    value={formatMyr(revenue.this_month_myr)}
                    sub={revenueDeltaPct !== '—' ? `${revenueDelta >= 0 ? '+' : ''}${revenueDeltaPct}% vs last month` : 'no comparison data'}
                    icon="bi-cash-coin"
                    bg="bg-primary"
                />
                <RevenueCard
                    label="All-Time Revenue"
                    value={formatMyr(revenue.total_myr)}
                    sub="paid payments only"
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

            {/* Operations KPIs */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <h6 className="fw-semibold mb-3">
                        <i className="bi bi-speedometer me-2 text-primary" />
                        Operations
                    </h6>
                    <div className="row g-3">
                        <KpiTile label="Total Users" value={kpis.total_users} sub={`${monthlyDelta}${kpis.new_users_this_month} this month`} />
                        <KpiTile label="Active Subscriptions" value={kpis.active_subs} sub="paying customers" />
                        <KpiTile label="Total Affiliates" value={kpis.total_affiliates} sub="opted-in" />
                        <KpiTile label="Pending Payouts" value={kpis.pending_payouts} sub="needs admin action" warn={kpis.pending_payouts > 0} />
                        <KpiTile label="Total Leads" value={kpis.total_leads} sub={`${kpis.total_leads_closed} closed`} />
                        <KpiTile label="Admins" value={kpis.total_admins} sub="users with admin flag" />
                    </div>
                </div>
            </div>

            {/* Users by Plan */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-semibold mb-0">
                            <i className="bi bi-pie-chart me-2 text-primary" />
                            Users by Plan
                        </h6>
                        <Link href="/admin/users" className="btn btn-sm btn-outline-primary">
                            Manage Users
                        </Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Plan</th>
                                    <th className="text-end">Users</th>
                                    <th className="text-end">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersByPlan.map((row) => {
                                    const pct = kpis.total_users > 0
                                        ? ((row.count / kpis.total_users) * 100).toFixed(1)
                                        : '0';
                                    return (
                                        <tr key={row.plan}>
                                            <td>
                                                <span className={`badge ${row.badge}`}>{row.label}</span>
                                            </td>
                                            <td className="text-end fw-medium">{row.count}</td>
                                            <td className="text-end text-muted small">{pct}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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

function KpiTile({ label, value, sub, warn = false }: { label: string; value: string | number; sub: string; warn?: boolean }) {
    return (
        <div className="col-6 col-md-4 col-xl-2">
            <div className={`border rounded p-3 h-100 ${warn ? 'border-warning bg-warning-subtle' : ''}`}>
                <div className="text-muted small mb-1">{label}</div>
                <div className={`fs-4 fw-bold ${warn ? 'text-warning-emphasis' : ''}`}>{value}</div>
                <div className="text-muted small">{sub}</div>
            </div>
        </div>
    );
}
