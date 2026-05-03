import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface KpiCard {
    label: string;
    value: string | number;
    icon: string;
    bg: string;
}

const KPIS: KpiCard[] = [
    { label: 'New Leads', value: 0, icon: 'bi-plus-circle', bg: 'bg-primary' },
    { label: 'Follow-ups Today', value: 0, icon: 'bi-bell', bg: 'bg-warning' },
    { label: 'Closed This Month', value: 0, icon: 'bi-trophy', bg: 'bg-success' },
    { label: 'Conversion Rate', value: '0%', icon: 'bi-graph-up', bg: 'bg-info' },
];

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user!;

    return (
        <AdminLTELayout
            title="Dashboard"
            pageTitle={`Welcome back, ${user.name.split(' ')[0]}`}
        >
            <div className="row g-3 mb-4">
                {KPIS.map((kpi) => (
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
                        <div className="card-header bg-white border-bottom">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-list-ul me-2" />
                                Recent Leads
                            </h5>
                        </div>
                        <div className="card-body text-center py-5">
                            <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }} />
                            <p className="text-muted mt-3 mb-3">
                                No leads yet. Add your first lead to get started.
                            </p>
                            <Link href="/leads/create" className="btn btn-primary">
                                <i className="bi bi-plus-lg me-1" />
                                Add Lead
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-bell me-2" />
                                Today's Reminders
                            </h5>
                        </div>
                        <div className="card-body text-center py-5">
                            <i className="bi bi-check2-circle text-success" style={{ fontSize: '3rem' }} />
                            <p className="text-muted mt-3 mb-0">All clear. No reminders today.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
