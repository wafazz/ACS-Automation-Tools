import AdminLTELayout from '@/Layouts/AdminLTELayout';
import StatusBadge from '@/Components/Leads/StatusBadge';
import EmptyState from '@/Components/UX/EmptyState';
import { Lead, PageProps, Reminder, StatusOption } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface DashboardProps {
    stats: {
        total_leads: number;
        new_this_month: number;
        closed_this_month: number;
        conversion_rate: number;
    };
    recentLeads: Lead[];
    todayReminders: Reminder[];
    overdueCount: number;
    statuses: StatusOption[];
}

export default function Dashboard() {
    const { auth, stats, recentLeads, todayReminders, overdueCount, statuses } =
        usePage<PageProps<DashboardProps>>().props;
    const user = auth.user!;

    const completeReminder = (id: number) => {
        router.patch(route('reminders.complete', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Reminder completed.'),
        });
    };

    const kpis = [
        { label: 'Total Leads', value: stats.total_leads, icon: 'bi-people', bg: 'bg-primary' },
        { label: 'New This Month', value: stats.new_this_month, icon: 'bi-plus-circle', bg: 'bg-info' },
        { label: 'Closed This Month', value: stats.closed_this_month, icon: 'bi-trophy', bg: 'bg-success' },
        { label: 'Conversion Rate', value: `${stats.conversion_rate}%`, icon: 'bi-graph-up', bg: 'bg-warning' },
    ];

    return (
        <AdminLTELayout
            title="Dashboard"
            pageTitle={`Welcome back, ${user.name.split(' ')[0]}`}
            pageActions={
                <Link href={route('leads.create')} className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1" />
                    Add Lead
                </Link>
            }
        >
            <div className="row g-3 mb-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="col-12 col-sm-6 col-xl-3">
                        <div className={`card text-white ${kpi.bg} shadow-sm border-0 h-100`}>
                            <div className="card-body d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <div className="small opacity-75">{kpi.label}</div>
                                    <div className="fs-3 fw-bold">{kpi.value}</div>
                                </div>
                                <i className={`bi ${kpi.icon} fs-1 opacity-50`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-list-ul me-2" />
                                Recent Leads
                            </h5>
                            <Link href={route('leads.index')} className="btn btn-sm btn-outline-primary">
                                View all
                            </Link>
                        </div>
                        <div className="card-body p-0">
                            {recentLeads.length === 0 ? (
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
                                                        <Link
                                                            href={route('leads.show', lead.id)}
                                                            className="fw-medium text-decoration-none"
                                                        >
                                                            {lead.name}
                                                        </Link>
                                                    </td>
                                                    <td className="text-muted small">{lead.phone}</td>
                                                    <td>
                                                        <StatusBadge status={lead.status} statuses={statuses} size="sm" />
                                                    </td>
                                                    <td className="text-end text-muted small">
                                                        {new Date(lead.created_at).toLocaleDateString('en-MY', {
                                                            day: '2-digit', month: 'short',
                                                        })}
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

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-bell me-2" />
                                Today's Reminders
                                {overdueCount > 0 && (
                                    <span className="badge text-bg-danger ms-2">
                                        {overdueCount} overdue
                                    </span>
                                )}
                            </h5>
                            <Link href={`${route('reminders.index')}?tab=today`} className="btn btn-sm btn-outline-primary">
                                View all
                            </Link>
                        </div>
                        <div className="card-body p-0">
                            {todayReminders.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-check2-circle text-success" style={{ fontSize: '3rem' }} />
                                    <p className="text-muted mt-3 mb-0 small">
                                        All clear. No reminders due today.
                                    </p>
                                </div>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {todayReminders.map((r) => (
                                        <li key={r.id} className="list-group-item d-flex justify-content-between align-items-start gap-2">
                                            <div className="flex-grow-1">
                                                {r.lead ? (
                                                    <Link
                                                        href={route('leads.show', r.lead.id)}
                                                        className="fw-medium text-decoration-none small"
                                                    >
                                                        {r.lead.name}
                                                    </Link>
                                                ) : (
                                                    <span className="small fst-italic text-muted">General</span>
                                                )}
                                                <div className="text-muted small">
                                                    <i className="bi bi-clock me-1" />
                                                    {new Date(r.due_at).toLocaleTimeString('en-MY', {
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-success"
                                                onClick={() => completeReminder(r.id)}
                                                title="Mark complete"
                                            >
                                                <i className="bi bi-check-lg" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
