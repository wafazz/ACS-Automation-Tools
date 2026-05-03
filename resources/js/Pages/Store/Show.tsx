import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { useConfirm } from '@/Hooks/useConfirm';
import { PackDetail } from '@/types';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    pack: PackDetail;
    owned: boolean;
    gatewayConfigured: boolean;
}

export default function Show({ pack, owned, gatewayConfigured }: Props) {
    const ask = useConfirm();
    const [submitting, setSubmitting] = useState(false);

    const buy = async () => {
        if (!gatewayConfigured) {
            await ask({
                title: 'Payment gateway not configured',
                text: 'Billplz API keys are missing. Add them to .env (BILLPLZ_API_KEY / BILLPLZ_X_SIGNATURE / BILLPLZ_COLLECTION_ID).',
                icon: 'warning',
                tone: 'warning',
                confirmText: 'Got it',
            });
            return;
        }

        const ok = await ask({
            title: `Buy ${pack.name} for RM ${pack.price_myr.toFixed(2)}?`,
            text: `${pack.items.length} templates will be added to your library. You'll be redirected to Billplz to complete payment.`,
            icon: 'info',
            tone: 'success',
            confirmText: 'Yes, proceed',
        });
        if (!ok) return;

        setSubmitting(true);
        router.post(route('store.checkout', pack.slug), {}, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AdminLTELayout
            title={pack.name}
            pageTitle={pack.name}
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('store.index')} className="text-decoration-none">Pack Store</Link>
                    {' / '}
                    <span>{pack.name}</span>
                </small>
            }
        >
            <div className="row g-4">
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm sticky-top" style={{ top: 80 }}>
                        <div className="card-body text-center p-4">
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary mb-3"
                                style={{ width: 80, height: 80 }}
                            >
                                <i className={`bi ${pack.icon ?? 'bi-box-seam'}`} style={{ fontSize: '2.5rem' }} />
                            </div>
                            <h4 className="fw-bold mb-2">{pack.name}</h4>
                            {pack.industry_label && (
                                <span className="badge bg-info-subtle text-info-emphasis mb-3">
                                    {pack.industry_label}
                                </span>
                            )}
                            <p className="text-muted small mb-3">{pack.description}</p>

                            <div className="display-5 fw-bold mb-1">
                                <span className="text-muted small fw-normal">RM</span> {pack.price_myr.toFixed(0)}
                            </div>
                            <p className="text-muted small mb-4">one time · lifetime access</p>

                            {owned ? (
                                <button type="button" className="btn btn-outline-success w-100 mb-2" disabled>
                                    <i className="bi bi-check-lg me-1" />
                                    Owned
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary w-100 mb-2"
                                    onClick={buy}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Redirecting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-cart-plus me-1" />
                                            Buy Pack
                                        </>
                                    )}
                                </button>
                            )}
                            <small className="text-muted">
                                <i className="bi bi-shield-check me-1" />
                                Secure checkout via Billplz
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-list-ul me-2 text-primary" />
                                What's inside ({pack.items.length} templates)
                            </h6>
                            <div className="row g-3">
                                {pack.items.map((item) => (
                                    <div key={item.id} className="col-12 col-md-6">
                                        <div className="border rounded p-3 h-100">
                                            <h6 className="fw-semibold small mb-2">
                                                <i className="bi bi-chat-square-text text-primary me-1" />
                                                {item.title}
                                            </h6>
                                            <p
                                                className="small text-muted mb-0 font-monospace"
                                                style={{
                                                    whiteSpace: 'pre-wrap',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {item.body}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!owned && (
                                <div className="alert alert-info mt-4 mb-0 small d-flex align-items-start gap-2">
                                    <i className="bi bi-info-circle-fill" />
                                    <div>
                                        After purchase, all {pack.items.length} templates will be cloned into your library.
                                        You can edit, customize, or delete them — they're fully yours.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
