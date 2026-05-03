import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface PlanCard {
    value: string;
    label: string;
    tagline: string;
    price_myr: number;
    cadence: string;
    features: string[];
    badge: string;
    is_lifetime: boolean;
    max_leads: number | null;
    max_templates: number | null;
}

interface PageData {
    plans: PlanCard[];
    currentPlan: string | null;
    gatewayConfigured: boolean;
}

const PLAN_HIGHLIGHT: Record<string, { highlight: boolean; cta: string }> = {
    starter: { highlight: false, cta: 'Choose Starter' },
    pro: { highlight: true, cta: 'Go Pro' },
    team: { highlight: false, cta: 'Get Team' },
    founder_ltd: { highlight: false, cta: 'Claim Lifetime Deal' },
};

export default function Pricing() {
    const { plans, currentPlan, gatewayConfigured } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();
    const [submitting, setSubmitting] = useState<string | null>(null);

    const checkout = async (plan: PlanCard) => {
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
            title: `Proceed to payment of RM ${plan.price_myr.toFixed(2)}?`,
            text: `You'll be redirected to Billplz to complete payment for ${plan.label}.`,
            icon: 'info',
            tone: 'success',
            confirmText: 'Yes, proceed',
        });
        if (!ok) return;

        setSubmitting(plan.value);
        router.post(route('billing.checkout', plan.value), {}, {
            onFinish: () => setSubmitting(null),
        });
    };

    return (
        <AdminLTELayout title="Pricing" pageTitle="Plans & Pricing">
            {!gatewayConfigured && (
                <div className="alert alert-warning d-flex align-items-start gap-2 mb-4">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <div>
                        <strong>Payment gateway not configured.</strong>{' '}
                        Add your Billplz API keys to <code>.env</code> before checkout will work.
                        See <code>.env.example</code> for the required keys.
                    </div>
                </div>
            )}

            <div className="text-center mb-4">
                <h3 className="fw-bold">Pick the plan that fits your hustle</h3>
                <p className="text-muted">
                    All paid plans include WhatsApp quick send, auto reminders, and goal tracking.
                </p>
            </div>

            <div className="row g-3 align-items-stretch">
                {plans.map((plan) => {
                    const meta = PLAN_HIGHLIGHT[plan.value] ?? { highlight: false, cta: 'Choose plan' };
                    const isCurrent = currentPlan === plan.value;

                    return (
                        <div key={plan.value} className="col-12 col-md-6 col-xl-3">
                            <div
                                className={`card h-100 border-0 shadow-sm ${meta.highlight ? 'border-2 border-primary shadow' : ''}`}
                                style={meta.highlight ? { borderColor: '#0d6efd', borderStyle: 'solid' } : undefined}
                            >
                                {meta.highlight && (
                                    <div className="card-header bg-primary text-white text-center fw-semibold py-2">
                                        <i className="bi bi-star-fill me-1" />
                                        Most Popular
                                    </div>
                                )}
                                <div className="card-body d-flex flex-column">
                                    <div className="mb-3">
                                        <span className={`badge ${plan.badge} mb-2`}>{plan.label}</span>
                                        <p className="text-muted small mb-2">{plan.tagline}</p>
                                        <div className="d-flex align-items-baseline gap-1">
                                            <span className="text-muted">RM</span>
                                            <span className="display-5 fw-bold">{plan.price_myr.toFixed(0)}</span>
                                            <span className="text-muted small">/ {plan.cadence}</span>
                                        </div>
                                    </div>

                                    <ul className="list-unstyled small mb-4 flex-grow-1">
                                        {plan.features.map((f) => (
                                            <li key={f} className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrent ? (
                                        <button
                                            type="button"
                                            className="btn btn-outline-success w-100"
                                            disabled
                                        >
                                            <i className="bi bi-check-lg me-1" />
                                            Current plan
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`btn ${meta.highlight ? 'btn-primary' : 'btn-outline-primary'} w-100`}
                                            onClick={() => checkout(plan)}
                                            disabled={submitting !== null}
                                        >
                                            {submitting === plan.value ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Redirecting...
                                                </>
                                            ) : (
                                                meta.cta
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-center mt-5 text-muted small">
                <p className="mb-1">
                    <i className="bi bi-shield-check me-1" />
                    Secure checkout via Billplz · FPX, credit/debit cards supported
                </p>
                <p className="mb-0">
                    Need help choosing? <a href="mailto:hello@acs.local" className="text-decoration-none">Contact us</a>.
                </p>
            </div>
        </AdminLTELayout>
    );
}
