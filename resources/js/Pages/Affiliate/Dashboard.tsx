import AdminLTELayout from '@/Layouts/AdminLTELayout';
import EmptyState from '@/Components/UX/EmptyState';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ReferralRow {
    id: number;
    status: 'pending' | 'qualified' | 'cancelled';
    qualified_at: string | null;
    created_at: string;
    referred_user: { name: string; email: string; plan: string } | null;
}

interface OptedInData {
    optedIn: true;
    affiliate: {
        code: string;
        balance_myr: number;
        total_earned_myr: number;
        total_paid_myr: number;
        opted_in_at: string;
    };
    stats: {
        referrals_total: number;
        referrals_qualified: number;
    };
    referrals: ReferralRow[];
    referralLink: string;
    commissionRate: number;
    payoutMinMyr: number;
}

interface OptedOutData {
    optedIn: false;
    commissionRate: number;
}

type PageData = OptedInData | OptedOutData;

const STATUS_BADGE: Record<ReferralRow['status'], string> = {
    pending: 'bg-secondary-subtle text-secondary',
    qualified: 'bg-success-subtle text-success',
    cancelled: 'bg-danger-subtle text-danger',
};

function formatMyr(value: number): string {
    return 'RM ' + value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard() {
    const data = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();
    const [optingIn, setOptingIn] = useState(false);

    if (!data.optedIn) {
        return <OptInScreen
            commissionRate={data.commissionRate}
            optingIn={optingIn}
            onOptIn={async () => {
                const ok = await ask({
                    title: 'Join the affiliate program?',
                    text: `You'll get a unique referral link and earn ${data.commissionRate}% on every paid month from agents you refer.`,
                    icon: 'info',
                    tone: 'success',
                    confirmText: 'Yes, join',
                });
                if (!ok) return;
                setOptingIn(true);
                router.post(route('affiliate.opt-in'), {}, {
                    onFinish: () => setOptingIn(false),
                });
            }}
        />;
    }

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(data.referralLink);
            toast.success('Link copied!');
        } catch {
            toast.error('Could not copy. Tap and hold to select instead.');
        }
    };

    return (
        <AdminLTELayout
            title="Affiliate"
            pageTitle="Affiliate Dashboard"
            pageActions={
                <Link href={route('affiliate.payouts')} className="btn btn-outline-primary">
                    <i className="bi bi-cash-coin me-1" />
                    Payouts
                </Link>
            }
        >
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card text-white bg-success border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="small opacity-75 mb-1">Available Balance</div>
                            <div className="fs-3 fw-bold">{formatMyr(data.affiliate.balance_myr)}</div>
                            <div className="small opacity-75">ready to withdraw</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card text-white bg-primary border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="small opacity-75 mb-1">Total Earned</div>
                            <div className="fs-3 fw-bold">{formatMyr(data.affiliate.total_earned_myr)}</div>
                            <div className="small opacity-75">all-time commissions</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card text-white bg-info border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="small opacity-75 mb-1">Qualified Referrals</div>
                            <div className="fs-3 fw-bold">{data.stats.referrals_qualified}</div>
                            <div className="small opacity-75">of {data.stats.referrals_total} total signups</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card text-white bg-warning border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="small opacity-75 mb-1">Commission Rate</div>
                            <div className="fs-3 fw-bold">{data.commissionRate}%</div>
                            <div className="small opacity-75">on every paid month</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referral Link */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <h6 className="fw-semibold mb-3">
                        <i className="bi bi-link-45deg me-2 text-primary" />
                        Your Referral Link
                    </h6>
                    <p className="text-muted small mb-3">
                        Share this link anywhere. Anyone who signs up via your link is automatically tracked
                        for {AFFILIATE_COOKIE_DAYS_LABEL}, and you earn {data.commissionRate}% on every payment they make.
                    </p>
                    <div className="input-group">
                        <span className="input-group-text bg-light font-monospace">
                            <i className="bi bi-tag me-2 text-primary" />
                            {data.affiliate.code}
                        </span>
                        <input
                            type="text"
                            className="form-control font-monospace small"
                            value={data.referralLink}
                            readOnly
                            onFocus={(e) => e.target.select()}
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={copyLink}
                        >
                            <i className="bi bi-clipboard me-1" />
                            Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Referrals */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h6 className="fw-semibold mb-0">
                        <i className="bi bi-people me-2 text-primary" />
                        Recent Referrals
                    </h6>
                </div>
                <div className="card-body p-0">
                    {data.referrals.length === 0 ? (
                        <div className="p-4">
                            <EmptyState
                                icon="bi-share"
                                title="No referrals yet"
                                description="Share your link with agent friends, in WhatsApp groups, or on social media to start earning."
                            />
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Plan</th>
                                        <th>Status</th>
                                        <th className="text-end">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.referrals.map((r) => (
                                        <tr key={r.id}>
                                            <td className="fw-medium">{r.referred_user?.name ?? '—'}</td>
                                            <td className="text-muted small">{r.referred_user?.email ?? '—'}</td>
                                            <td>
                                                <span className="badge bg-light text-body small">
                                                    {r.referred_user?.plan ?? '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${STATUS_BADGE[r.status]} px-2 py-1 small`}>
                                                    {r.status === 'qualified' ? 'Earning' : r.status}
                                                </span>
                                            </td>
                                            <td className="text-end text-muted small">
                                                {new Date(r.created_at).toLocaleDateString('en-MY', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </td>
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

const AFFILIATE_COOKIE_DAYS_LABEL = '60 days';

interface OptInScreenProps {
    commissionRate: number;
    optingIn: boolean;
    onOptIn: () => void;
}

function OptInScreen({ commissionRate, optingIn, onOptIn }: OptInScreenProps) {
    return (
        <AdminLTELayout title="Affiliate" pageTitle="Affiliate Program">
            <div className="row justify-content-center">
                <div className="col-12 col-md-10 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-5 text-center">
                            <i className="bi bi-share text-primary" style={{ fontSize: '4rem' }} />
                            <h3 className="fw-bold mt-3">Earn {commissionRate}% on every referral</h3>
                            <p className="text-muted">
                                Join the ACS affiliate program and earn recurring commission for every agent you bring on board.
                            </p>

                            <div className="row g-3 my-4 text-start">
                                {[
                                    { i: 'bi-link-45deg', t: 'Get a unique referral link', d: 'Auto-generated short code anyone can use to sign up.' },
                                    { i: 'bi-percent', t: `${commissionRate}% commission`, d: 'On every monthly payment your referred agents make.' },
                                    { i: 'bi-cash-coin', t: 'Manual payout via bank transfer', d: 'Request a payout once your balance hits RM 50.' },
                                ].map((b) => (
                                    <div key={b.t} className="col-md-4">
                                        <div className="border rounded p-3 h-100">
                                            <i className={`bi ${b.i} text-primary fs-4`} />
                                            <h6 className="fw-semibold small mt-2 mb-1">{b.t}</h6>
                                            <p className="small text-muted mb-0">{b.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary btn-lg"
                                onClick={onOptIn}
                                disabled={optingIn}
                            >
                                {optingIn ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-rocket-takeoff me-1" />
                                        Join the affiliate program
                                    </>
                                )}
                            </button>
                            <p className="text-muted small mt-3 mb-0">
                                Free to join · No commitment · Opt out anytime
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
