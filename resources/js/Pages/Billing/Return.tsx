import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

interface PaymentInfo {
    id: number;
    plan: string | null;
    plan_label: string | null;
    amount_myr: number;
    status: string;
    paid_at: string | null;
}

interface Props {
    payment: PaymentInfo;
}

export default function Return({ payment }: Props) {
    // Auto-refresh once after 3s in case the webhook is still processing
    useEffect(() => {
        if (payment.status === 'pending') {
            const t = setTimeout(() => router.reload({ only: ['payment'] }), 3000);
            return () => clearTimeout(t);
        }
    }, [payment.status]);

    const isPaid = payment.status === 'paid';
    const isPending = payment.status === 'pending';
    const isFailed = payment.status === 'failed';

    return (
        <AdminLTELayout title="Payment Result" pageTitle="Checkout">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body p-5">
                            {isPaid && (
                                <>
                                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }} />
                                    <h3 className="fw-bold mt-3 mb-2">Payment successful</h3>
                                    <p className="text-muted">
                                        Welcome to <strong>{payment.plan_label}</strong> — you're all set.
                                    </p>
                                </>
                            )}
                            {isPending && (
                                <>
                                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
                                    <h3 className="fw-bold mt-3 mb-2">Confirming payment...</h3>
                                    <p className="text-muted">
                                        Hold on — we're waiting for the bank to confirm. This usually takes a few seconds.
                                    </p>
                                </>
                            )}
                            {isFailed && (
                                <>
                                    <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '4rem' }} />
                                    <h3 className="fw-bold mt-3 mb-2">Payment failed</h3>
                                    <p className="text-muted">
                                        Something went wrong with the payment. No charge was made.
                                    </p>
                                </>
                            )}

                            <div className="text-start mt-4 mb-4">
                                <dl className="row mb-0 small">
                                    <dt className="col-6 text-muted fw-normal">Plan</dt>
                                    <dd className="col-6 mb-2 text-end">{payment.plan_label ?? '—'}</dd>

                                    <dt className="col-6 text-muted fw-normal">Amount</dt>
                                    <dd className="col-6 mb-2 text-end fw-medium">RM {payment.amount_myr.toFixed(2)}</dd>

                                    <dt className="col-6 text-muted fw-normal">Status</dt>
                                    <dd className="col-6 mb-2 text-end text-capitalize">{payment.status}</dd>

                                    <dt className="col-6 text-muted fw-normal">Reference</dt>
                                    <dd className="col-6 mb-0 text-end font-monospace small">#{payment.id}</dd>
                                </dl>
                            </div>

                            <div className="d-flex gap-2 justify-content-center">
                                <Link href={route('dashboard')} className="btn btn-primary">
                                    <i className="bi bi-house me-1" />
                                    Back to Dashboard
                                </Link>
                                {isFailed && (
                                    <Link href={route('billing.pricing')} className="btn btn-outline-primary">
                                        Try again
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
