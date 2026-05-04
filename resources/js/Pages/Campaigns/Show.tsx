import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { useConfirm } from '@/Hooks/useConfirm';
import { Link, router } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface CampaignDetail {
    id: number;
    name: string;
    status: 'scheduled' | 'sending' | 'completed' | 'cancelled';
    scheduled_at: string;
    target_kind: string;
    target_criteria: Record<string, unknown> | null;
    target_count: number;
    sent_count: number;
    failed_count: number;
    pending_count: number;
    cancelled_count: number;
    progress_pct: number;
    template: { id: number; title: string; body: string } | null;
    cancelled_at: string | null;
    created_at: string;
    is_cancellable: boolean;
}

interface ReminderRow {
    id: number;
    lead: { id: number; name: string; phone: string } | null;
    auto_sent_at: string | null;
    dismissed_at: string | null;
    status: 'sent' | 'pending' | 'cancelled';
}

interface Props {
    campaign: CampaignDetail;
    reminderSample: ReminderRow[];
}

const STATUS_BADGE: Record<CampaignDetail['status'], string> = {
    scheduled: 'bg-secondary',
    sending: 'bg-info',
    completed: 'bg-success',
    cancelled: 'bg-danger',
};

const ROW_STATUS_BADGE: Record<ReminderRow['status'], string> = {
    sent: 'bg-success-subtle text-success',
    pending: 'bg-secondary-subtle text-secondary',
    cancelled: 'bg-danger-subtle text-danger',
};

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-MY', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export default function Show({ campaign, reminderSample }: Props) {
    const ask = useConfirm();

    const cancel = async () => {
        const ok = await ask({
            title: `Cancel "${campaign.name}"?`,
            text: `${campaign.pending_count} pending send(s) will be stopped. Already-sent messages can't be unsent.`,
            icon: 'warning',
            tone: 'danger',
            confirmText: 'Yes, cancel',
        });
        if (!ok) return;
        router.patch(route('campaigns.cancel', campaign.id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Campaign cancelled.'),
        });
    };

    const remove = async () => {
        const ok = await ask({
            title: `Delete this campaign?`,
            text: 'Removes the campaign record. Sent activity logs stay on the lead timeline.',
            icon: 'warning',
            tone: 'danger',
            confirmText: 'Yes, delete',
        });
        if (!ok) return;
        router.delete(route('campaigns.destroy', campaign.id));
    };

    return (
        <AdminLTELayout
            title={`Campaign: ${campaign.name}`}
            pageTitle={campaign.name}
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('campaigns.index')} className="text-decoration-none">Campaigns</Link>
                    {' / '}<span>{campaign.name}</span>
                </small>
            }
            pageActions={
                <div className="d-flex gap-2">
                    {campaign.is_cancellable && (
                        <button type="button" className="btn btn-outline-warning" onClick={cancel}>
                            <i className="bi bi-x-octagon me-1" />
                            Cancel campaign
                        </button>
                    )}
                    {!campaign.is_cancellable && (
                        <button type="button" className="btn btn-outline-danger" onClick={remove}>
                            <i className="bi bi-trash me-1" />
                            Delete
                        </button>
                    )}
                </div>
            }
        >
            <div className="row g-3 mb-3">
                <div className="col-12 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-1">Status</div>
                            <span className={`badge ${STATUS_BADGE[campaign.status]} fs-6 px-3 py-2 text-capitalize`}>
                                {campaign.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-1">Targeted</div>
                            <div className="fs-3 fw-bold">{campaign.target_count}</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-1">Sent</div>
                            <div className="fs-3 fw-bold text-success">{campaign.sent_count}</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-1">Pending</div>
                            <div className="fs-3 fw-bold text-secondary">{campaign.pending_count}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                        <span className="fw-medium">Progress</span>
                        <span className="text-muted">{campaign.progress_pct}%</span>
                    </div>
                    <div className="progress" style={{ height: 12 }}>
                        <div
                            className={`progress-bar ${campaign.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${campaign.progress_pct}%` }}
                        />
                    </div>
                    <div className="d-flex justify-content-between mt-2 small text-muted">
                        <span>Sent: {campaign.sent_count}</span>
                        <span>Failed: {campaign.failed_count}</span>
                        <span>Cancelled: {campaign.cancelled_count}</span>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                <div className="col-12 col-lg-7">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom">
                            <h6 className="fw-semibold mb-0">
                                <i className="bi bi-list me-2 text-primary" />
                                Sample of Targeted Leads (first 20)
                            </h6>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Lead</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Sent at</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reminderSample.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-4 text-muted small">No reminders found.</td></tr>
                                        ) : (
                                            reminderSample.map((r) => (
                                                <tr key={r.id}>
                                                    <td>
                                                        {r.lead ? (
                                                            <Link href={route('leads.show', r.lead.id)} className="fw-medium text-decoration-none small">
                                                                {r.lead.name}
                                                            </Link>
                                                        ) : <span className="text-muted small">—</span>}
                                                    </td>
                                                    <td className="text-muted small">{r.lead?.phone ?? '—'}</td>
                                                    <td>
                                                        <span className={`badge ${ROW_STATUS_BADGE[r.status]} px-2 py-1 small text-capitalize`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted small">{formatDateTime(r.auto_sent_at)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-info-circle me-2 text-primary" />
                                Campaign Details
                            </h6>
                            <dl className="row mb-0 small">
                                <dt className="col-5 text-muted fw-normal">Scheduled</dt>
                                <dd className="col-7 mb-2">{formatDateTime(campaign.scheduled_at)}</dd>
                                <dt className="col-5 text-muted fw-normal">Created</dt>
                                <dd className="col-7 mb-2">{formatDateTime(campaign.created_at)}</dd>
                                {campaign.cancelled_at && (<>
                                    <dt className="col-5 text-muted fw-normal">Cancelled</dt>
                                    <dd className="col-7 mb-2 text-danger">{formatDateTime(campaign.cancelled_at)}</dd>
                                </>)}
                                <dt className="col-5 text-muted fw-normal">Target</dt>
                                <dd className="col-7 mb-2 text-capitalize">{campaign.target_kind.replace('_', ' ')}</dd>
                                {campaign.target_criteria && Object.keys(campaign.target_criteria).length > 0 && (<>
                                    <dt className="col-5 text-muted fw-normal">Criteria</dt>
                                    <dd className="col-7 mb-2 small font-monospace">
                                        {JSON.stringify(campaign.target_criteria)}
                                    </dd>
                                </>)}
                            </dl>

                            {campaign.template && (
                                <>
                                    <hr />
                                    <h6 className="fw-semibold small mb-2">
                                        <i className="bi bi-chat-square-text me-1" />
                                        {campaign.template.title}
                                    </h6>
                                    <p className="small text-muted font-monospace mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                        {campaign.template.body}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
