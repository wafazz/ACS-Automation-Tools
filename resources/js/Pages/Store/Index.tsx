import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { PackCard, PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface PageData {
    packs: PackCard[];
    gatewayConfigured: boolean;
}

export default function Index() {
    const { packs, gatewayConfigured } = usePage<PageProps<PageData>>().props;

    return (
        <AdminLTELayout title="Pack Store" pageTitle="Template Pack Store">
            {!gatewayConfigured && (
                <div className="alert alert-warning d-flex align-items-start gap-2 mb-4">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <div>
                        <strong>Payment gateway not configured.</strong>{' '}
                        Add Billplz API keys to <code>.env</code> before purchases will work.
                    </div>
                </div>
            )}

            <div className="text-center mb-4">
                <h3 className="fw-bold">Industry-specific WhatsApp pack libraries</h3>
                <p className="text-muted">
                    Battle-tested scripts for your industry. One-time purchase, yours forever.
                </p>
            </div>

            <div className="row g-3">
                {packs.map((pack) => (
                    <div key={pack.id} className="col-12 col-md-6 col-xl-3">
                        <Link
                            href={route('store.show', pack.slug)}
                            className="card h-100 border-0 shadow-sm text-decoration-none text-body"
                        >
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div
                                        className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary"
                                        style={{ width: 48, height: 48 }}
                                    >
                                        <i className={`bi ${pack.icon ?? 'bi-box-seam'} fs-4`} />
                                    </div>
                                    {pack.owned && (
                                        <span className="badge bg-success-subtle text-success px-2 py-1">
                                            <i className="bi bi-check-circle me-1" />
                                            Owned
                                        </span>
                                    )}
                                </div>

                                <h5 className="fw-semibold mb-1">{pack.name}</h5>
                                {pack.industry_label && (
                                    <span className="badge bg-info-subtle text-info-emphasis mb-2 align-self-start">
                                        {pack.industry_label}
                                    </span>
                                )}
                                <p className="text-muted small mb-3 flex-grow-1">{pack.description}</p>

                                <div className="d-flex justify-content-between align-items-center mt-auto">
                                    <span className="fs-4 fw-bold">
                                        <span className="text-muted small fw-normal">RM</span> {pack.price_myr.toFixed(0)}
                                    </span>
                                    <small className="text-muted">
                                        <i className="bi bi-chat-square-text me-1" />
                                        {pack.item_count ?? 0} templates
                                    </small>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            <div className="text-center mt-5 text-muted small">
                <p className="mb-1">
                    <i className="bi bi-shield-check me-1" />
                    Secure one-time payment via Billplz · Templates copy directly into your library
                </p>
            </div>
        </AdminLTELayout>
    );
}
