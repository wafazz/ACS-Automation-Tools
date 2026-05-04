import AdminLTELayout from '@/Layouts/AdminLTELayout';
import EmptyState from '@/Components/UX/EmptyState';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface CampaignRow {
    id: number;
    name: string;
    status: 'scheduled' | 'sending' | 'completed' | 'cancelled';
    scheduled_at: string;
    target_kind: 'all' | 'by_status' | 'by_source' | 'specific';
    target_count: number;
    sent_count: number;
    failed_count: number;
    progress_pct: number;
    template: { id: number; title: string } | null;
    created_at: string;
}

interface PageData {
    campaigns: CampaignRow[];
}

const STATUS_BADGE: Record<CampaignRow['status'], string> = {
    scheduled: 'bg-secondary-subtle text-secondary',
    sending: 'bg-info-subtle text-info',
    completed: 'bg-success-subtle text-success',
    cancelled: 'bg-danger-subtle text-danger',
};

const TARGET_LABEL: Record<CampaignRow['target_kind'], string> = {
    all: 'All leads',
    by_status: 'By status',
    by_source: 'By source',
    specific: 'Specific leads',
};

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-MY', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export default function Index() {
    const { campaigns } = usePage<PageProps<PageData>>().props;

    return (
        <AdminLTELayout
            title="Campaigns"
            pageTitle="Lead Campaigns"
            pageActions={
                <Link href={route('campaigns.create')} className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1" />
                    New Campaign
                </Link>
            }
        >
            {campaigns.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-5">
                        <EmptyState
                            icon="bi-megaphone"
                            title="No campaigns yet"
                            description="Schedule a batch send to a filtered subset of your leads — useful for promos, status nudges, or one-off blasts."
                            action={
                                <Link href={route('campaigns.create')} className="btn btn-primary">
                                    <i className="bi bi-plus-lg me-1" />
                                    Create your first campaign
                                </Link>
                            }
                        />
                    </div>
                </div>
            ) : (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Template</th>
                                        <th>Target</th>
                                        <th>Scheduled</th>
                                        <th>Status</th>
                                        <th className="text-end">Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c) => (
                                        <tr key={c.id}>
                                            <td>
                                                <Link href={route('campaigns.show', c.id)} className="fw-medium text-decoration-none">
                                                    {c.name}
                                                </Link>
                                            </td>
                                            <td className="text-muted small">{c.template?.title ?? '—'}</td>
                                            <td className="small">
                                                <span className="badge bg-light text-body">{TARGET_LABEL[c.target_kind]}</span>
                                                <span className="text-muted ms-2">{c.target_count} lead(s)</span>
                                            </td>
                                            <td className="text-muted small">{formatDateTime(c.scheduled_at)}</td>
                                            <td>
                                                <span className={`badge ${STATUS_BADGE[c.status]} px-2 py-1 small text-capitalize`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="text-end small" style={{ minWidth: 140 }}>
                                                <div className="d-flex align-items-center gap-2 justify-content-end">
                                                    <span className="text-muted">{c.sent_count}/{c.target_count}</span>
                                                    <div className="progress flex-grow-1" style={{ height: 6, maxWidth: 80 }}>
                                                        <div
                                                            className={`progress-bar ${c.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                                                            style={{ width: `${c.progress_pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </AdminLTELayout>
    );
}
