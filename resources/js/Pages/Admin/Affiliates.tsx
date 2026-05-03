import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

interface AffiliateRow {
    id: number;
    code: string;
    balance_myr: number;
    total_earned_myr: number;
    total_paid_myr: number;
    referrals_count: number;
    commissions_count: number;
    opted_in_at: string;
    user: { id: number; name: string; email: string } | null;
}

interface PayoutRow {
    id: number;
    amount_myr: number;
    status: 'requested' | 'processing' | 'paid' | 'rejected';
    method: string;
    bank_details: { bank_name?: string; bank_account_name?: string; bank_account_number?: string } | null;
    admin_note: string | null;
    requested_at: string;
    paid_at: string | null;
    affiliate: { code: string; user_name: string | null; user_email: string | null } | null;
}

interface PageData {
    affiliates: AffiliateRow[];
    payouts: PayoutRow[];
}

const PAYOUT_STATUS_BADGE: Record<PayoutRow['status'], string> = {
    requested: 'bg-secondary-subtle text-secondary',
    processing: 'bg-info-subtle text-info',
    paid: 'bg-success-subtle text-success',
    rejected: 'bg-danger-subtle text-danger',
};

function formatMyr(value: number): string {
    return 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Affiliates() {
    const { affiliates, payouts } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();

    const pendingPayouts = payouts.filter((p) => p.status === 'requested' || p.status === 'processing');
    const completedPayouts = payouts.filter((p) => p.status === 'paid' || p.status === 'rejected');

    const markPaid = async (payout: PayoutRow) => {
        const ok = await ask({
            title: `Mark payout #${payout.id} as paid?`,
            text: `Confirm that you've transferred ${formatMyr(payout.amount_myr)} to the affiliate's bank.`,
            icon: 'success',
            tone: 'success',
            confirmText: 'Yes, mark paid',
        });
        if (!ok) return;

        const { value: note } = await Swal.fire({
            title: 'Add a note (optional)',
            input: 'text',
            inputPlaceholder: 'e.g. Bank transfer ref TXN12345',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Save',
            cancelButtonText: 'Skip',
            reverseButtons: true,
        });

        router.patch(`/admin/payouts/${payout.id}/paid`, { admin_note: note ?? null }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Payout marked as paid.'),
        });
    };

    const reject = async (payout: PayoutRow) => {
        const { value: note, isConfirmed } = await Swal.fire({
            title: `Reject payout #${payout.id}?`,
            text: 'The balance will be refunded to the affiliate. Add a reason (required).',
            input: 'textarea',
            inputPlaceholder: 'Reason for rejection...',
            inputValidator: (v) => (!v ? 'A reason is required.' : null),
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            focusCancel: true,
        });

        if (!isConfirmed || !note) return;

        router.patch(`/admin/payouts/${payout.id}/reject`, { admin_note: note }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Payout rejected, balance refunded.'),
        });
    };

    return (
        <AdminLTELayout title="Admin · Affiliates" pageTitle="Affiliates & Payouts">
            {/* Pending Payouts (action required) */}
            <div className="card border-0 shadow-sm border-start border-warning border-4 mb-4">
                <div className="card-body">
                    <h6 className="fw-semibold mb-3">
                        <i className="bi bi-hourglass-split me-2 text-warning" />
                        Pending Payouts ({pendingPayouts.length})
                    </h6>
                    {pendingPayouts.length === 0 ? (
                        <p className="text-muted small mb-0">No pending payouts. You're all caught up.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Ref</th>
                                        <th>Affiliate</th>
                                        <th className="text-end">Amount</th>
                                        <th>Bank Details</th>
                                        <th>Requested</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingPayouts.map((p) => (
                                        <tr key={p.id}>
                                            <td className="font-monospace small">#{p.id}</td>
                                            <td>
                                                <div className="fw-medium small">{p.affiliate?.user_name ?? '—'}</div>
                                                <div className="text-muted small">{p.affiliate?.code}</div>
                                            </td>
                                            <td className="text-end fw-medium">{formatMyr(p.amount_myr)}</td>
                                            <td className="small">
                                                {p.bank_details ? (
                                                    <>
                                                        <div className="fw-medium">{p.bank_details.bank_name}</div>
                                                        <div className="text-muted">{p.bank_details.bank_account_name}</div>
                                                        <div className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {p.bank_details.bank_account_number}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td className="text-muted small">
                                                {new Date(p.requested_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success"
                                                        onClick={() => markPaid(p)}
                                                    >
                                                        <i className="bi bi-check-lg me-1" />
                                                        Mark Paid
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => reject(p)}
                                                    >
                                                        <i className="bi bi-x-lg" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Affiliates List */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-0">
                    <div className="card-header bg-white border-bottom">
                        <h6 className="fw-semibold mb-0">
                            <i className="bi bi-people me-2 text-primary" />
                            All Affiliates ({affiliates.length})
                        </h6>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Affiliate</th>
                                    <th>Code</th>
                                    <th className="text-end">Balance</th>
                                    <th className="text-end">Earned</th>
                                    <th className="text-end">Paid</th>
                                    <th className="text-end">Referrals</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {affiliates.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5 text-muted">
                                            No affiliates yet.
                                        </td>
                                    </tr>
                                ) : (
                                    affiliates.map((a) => (
                                        <tr key={a.id}>
                                            <td>
                                                <div className="fw-medium small">{a.user?.name ?? '—'}</div>
                                                <div className="text-muted small">{a.user?.email}</div>
                                            </td>
                                            <td className="font-monospace small">{a.code}</td>
                                            <td className="text-end fw-medium">{formatMyr(a.balance_myr)}</td>
                                            <td className="text-end small">{formatMyr(a.total_earned_myr)}</td>
                                            <td className="text-end small">{formatMyr(a.total_paid_myr)}</td>
                                            <td className="text-end small">{a.referrals_count}</td>
                                            <td className="text-muted small">
                                                {new Date(a.opted_in_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Completed Payouts */}
            {completedPayouts.length > 0 && (
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom">
                        <h6 className="fw-semibold mb-0">
                            <i className="bi bi-check2-circle me-2 text-success" />
                            Completed Payouts
                        </h6>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Ref</th>
                                    <th>Affiliate</th>
                                    <th className="text-end">Amount</th>
                                    <th>Status</th>
                                    <th>Note</th>
                                    <th>Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedPayouts.map((p) => (
                                    <tr key={p.id}>
                                        <td className="font-monospace small">#{p.id}</td>
                                        <td className="small">{p.affiliate?.user_name ?? '—'}</td>
                                        <td className="text-end small">{formatMyr(p.amount_myr)}</td>
                                        <td>
                                            <span className={`badge ${PAYOUT_STATUS_BADGE[p.status]} px-2 py-1 small text-capitalize`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="text-muted small" style={{ maxWidth: 250 }}>
                                            {p.admin_note ?? '—'}
                                        </td>
                                        <td className="text-muted small">
                                            {p.paid_at
                                                ? new Date(p.paid_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLTELayout>
    );
}
