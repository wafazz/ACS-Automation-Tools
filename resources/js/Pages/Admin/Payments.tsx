import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';

interface PaymentRow {
    id: number;
    amount_myr: number;
    currency: string;
    status: string;
    gateway: string;
    gateway_ref: string | null;
    paid_at: string | null;
    created_at: string;
    plan: string;
    kind: 'subscription' | 'pack' | 'other';
    user: { id: number; name: string; email: string } | null;
    pack: { name: string; slug: string } | null;
}

interface PageData {
    payments: PaymentRow[];
    filters: { status: string; kind: string };
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-secondary-subtle text-secondary',
    paid: 'bg-success-subtle text-success',
    failed: 'bg-danger-subtle text-danger',
};

function formatMyr(value: number): string {
    return 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-MY', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export default function Payments() {
    const { payments, filters } = usePage<PageProps<PageData>>().props;

    const setFilter = (key: 'status' | 'kind', value: string) => {
        router.get('/admin/payments', { ...filters, [key]: value }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    };

    return (
        <AdminLTELayout title="Admin · Payments" pageTitle="Payment History">
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-12 col-md-4">
                            <label className="form-label small fw-medium mb-1">Status</label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.status}
                                onChange={(e) => setFilter('status', e.target.value)}
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="form-label small fw-medium mb-1">Type</label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.kind}
                                onChange={(e) => setFilter('kind', e.target.value)}
                            >
                                <option value="">All types</option>
                                <option value="subscription">Subscription</option>
                                <option value="pack">Template Pack</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Ref</th>
                                    <th>User</th>
                                    <th>Plan / Pack</th>
                                    <th className="text-end">Amount</th>
                                    <th>Status</th>
                                    <th>Gateway</th>
                                    <th>Paid</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-5 text-muted">
                                            No payments match the filters.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="font-monospace small">#{p.id}</td>
                                            <td>
                                                {p.user ? (
                                                    <>
                                                        <div className="fw-medium small">{p.user.name}</div>
                                                        <div className="text-muted small">{p.user.email}</div>
                                                    </>
                                                ) : (
                                                    <span className="text-muted small">—</span>
                                                )}
                                            </td>
                                            <td className="small">
                                                {p.kind === 'pack' && p.pack ? (
                                                    <span>
                                                        <i className="bi bi-box-seam me-1 text-info" />
                                                        {p.pack.name}
                                                    </span>
                                                ) : (
                                                    <span>
                                                        <i className="bi bi-credit-card me-1 text-primary" />
                                                        {p.plan}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-end fw-medium">{formatMyr(p.amount_myr)}</td>
                                            <td>
                                                <span className={`badge ${STATUS_BADGE[p.status] ?? 'bg-light text-body'} px-2 py-1 small text-capitalize`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-muted small text-capitalize">{p.gateway}</div>
                                                {p.gateway_ref && (
                                                    <div className="font-monospace text-muted" style={{ fontSize: '0.7rem' }}>
                                                        {p.gateway_ref.slice(0, 12)}...
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-muted small">{formatDateTime(p.paid_at)}</td>
                                            <td className="text-muted small">{formatDateTime(p.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
