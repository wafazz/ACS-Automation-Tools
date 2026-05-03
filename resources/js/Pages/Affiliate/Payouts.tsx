import AdminLTELayout from '@/Layouts/AdminLTELayout';
import EmptyState from '@/Components/UX/EmptyState';
import LoadingButton from '@/Components/UX/LoadingButton';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import toast from 'react-hot-toast';

type PayoutStatus = 'requested' | 'processing' | 'paid' | 'rejected';

interface PayoutRow {
    id: number;
    amount_myr: number;
    status: PayoutStatus;
    method: string;
    requested_at: string;
    paid_at: string | null;
    admin_note: string | null;
}

interface PageData {
    affiliate: {
        code: string;
        balance_myr: number;
        total_paid_myr: number;
    };
    payouts: PayoutRow[];
    payoutMinMyr: number;
}

const STATUS_BADGE: Record<PayoutStatus, string> = {
    requested: 'bg-secondary-subtle text-secondary',
    processing: 'bg-info-subtle text-info',
    paid: 'bg-success-subtle text-success',
    rejected: 'bg-danger-subtle text-danger',
};

function formatMyr(value: number): string {
    return 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Payouts() {
    const { affiliate, payouts, payoutMinMyr } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();

    const canRequest = affiliate.balance_myr >= payoutMinMyr;
    const hasPending = payouts.some((p) => p.status === 'requested' || p.status === 'processing');

    const form = useForm({
        bank_name: '',
        bank_account_name: '',
        bank_account_number: '',
    });

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        const ok = await ask({
            title: `Request payout of ${formatMyr(affiliate.balance_myr)}?`,
            text: 'We process payouts within 3 business days. Please double-check your bank details.',
            icon: 'info',
            tone: 'success',
            confirmText: 'Yes, request',
        });
        if (!ok) return;

        form.post(route('affiliate.payouts.request'), {
            onSuccess: () => {
                form.reset();
                toast.success('Payout request submitted.');
            },
        });
    };

    return (
        <AdminLTELayout
            title="Payouts"
            pageTitle="Affiliate Payouts"
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('affiliate.dashboard')} className="text-decoration-none">Affiliate</Link>
                    {' / '}
                    <span>Payouts</span>
                </small>
            }
        >
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <div className="card text-white bg-success border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="small opacity-75 mb-1">Available Balance</div>
                            <div className="fs-2 fw-bold">{formatMyr(affiliate.balance_myr)}</div>
                            <div className="small opacity-75">
                                Min. payout: {formatMyr(payoutMinMyr)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small mb-1">Total Paid Out</div>
                            <div className="fs-2 fw-bold">{formatMyr(affiliate.total_paid_myr)}</div>
                            <div className="small text-muted">all-time withdrawals</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Payout Form */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <h6 className="fw-semibold mb-3">
                        <i className="bi bi-cash-coin me-2 text-primary" />
                        Request Payout
                    </h6>

                    {hasPending && (
                        <div className="alert alert-info small mb-3">
                            <i className="bi bi-hourglass-split me-2" />
                            You have a pending payout. New requests are paused until it's processed.
                        </div>
                    )}

                    {!canRequest && !hasPending && (
                        <div className="alert alert-warning small mb-3">
                            <i className="bi bi-info-circle me-2" />
                            You need at least {formatMyr(payoutMinMyr)} to request a payout.{' '}
                            <Link href={route('affiliate.dashboard')} className="alert-link">
                                Refer more agents to grow your balance
                            </Link>.
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="row g-3">
                            <div className="col-12 col-md-4">
                                <label htmlFor="bank_name" className="form-label small fw-medium">
                                    Bank name <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="bank_name"
                                    type="text"
                                    className={`form-control ${form.errors.bank_name ? 'is-invalid' : ''}`}
                                    value={form.data.bank_name}
                                    onChange={(e) => form.setData('bank_name', e.target.value)}
                                    placeholder="e.g. Maybank, CIMB, Public Bank"
                                    disabled={!canRequest || hasPending}
                                    required
                                />
                                {form.errors.bank_name && <div className="invalid-feedback">{form.errors.bank_name}</div>}
                            </div>
                            <div className="col-12 col-md-4">
                                <label htmlFor="bank_account_name" className="form-label small fw-medium">
                                    Account holder name <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="bank_account_name"
                                    type="text"
                                    className={`form-control ${form.errors.bank_account_name ? 'is-invalid' : ''}`}
                                    value={form.data.bank_account_name}
                                    onChange={(e) => form.setData('bank_account_name', e.target.value)}
                                    placeholder="As registered with the bank"
                                    disabled={!canRequest || hasPending}
                                    required
                                />
                                {form.errors.bank_account_name && <div className="invalid-feedback">{form.errors.bank_account_name}</div>}
                            </div>
                            <div className="col-12 col-md-4">
                                <label htmlFor="bank_account_number" className="form-label small fw-medium">
                                    Account number <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="bank_account_number"
                                    type="text"
                                    className={`form-control font-monospace ${form.errors.bank_account_number ? 'is-invalid' : ''}`}
                                    value={form.data.bank_account_number}
                                    onChange={(e) => form.setData('bank_account_number', e.target.value)}
                                    placeholder="1234567890"
                                    disabled={!canRequest || hasPending}
                                    required
                                />
                                {form.errors.bank_account_number && <div className="invalid-feedback">{form.errors.bank_account_number}</div>}
                            </div>
                        </div>
                        <div className="mt-3">
                            <LoadingButton
                                type="submit"
                                loading={form.processing}
                                className="btn btn-primary"
                                loadingText="Submitting..."
                                disabled={!canRequest || hasPending}
                            >
                                <i className="bi bi-send me-1" />
                                Request {formatMyr(affiliate.balance_myr)}
                            </LoadingButton>
                        </div>
                    </form>
                </div>
            </div>

            {/* Payout History */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h6 className="fw-semibold mb-0">
                        <i className="bi bi-clock-history me-2 text-primary" />
                        Payout History
                    </h6>
                </div>
                <div className="card-body p-0">
                    {payouts.length === 0 ? (
                        <div className="p-4">
                            <EmptyState
                                icon="bi-cash-stack"
                                title="No payouts yet"
                                description="Your past payout requests and their status will appear here."
                            />
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Reference</th>
                                        <th className="text-end">Amount</th>
                                        <th>Status</th>
                                        <th>Method</th>
                                        <th>Requested</th>
                                        <th>Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.map((p) => (
                                        <tr key={p.id}>
                                            <td className="font-monospace small">#{p.id}</td>
                                            <td className="text-end fw-medium">{formatMyr(p.amount_myr)}</td>
                                            <td>
                                                <span className={`badge ${STATUS_BADGE[p.status]} px-2 py-1 small text-capitalize`}>
                                                    {p.status}
                                                </span>
                                                {p.admin_note && (
                                                    <div className="small text-muted mt-1" style={{ maxWidth: 250 }}>
                                                        {p.admin_note}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-muted small text-capitalize">{p.method.replace('_', ' ')}</td>
                                            <td className="text-muted small">{formatDate(p.requested_at)}</td>
                                            <td className="text-muted small">{formatDate(p.paid_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLTELayout>
    );
}
