import { Head, Link } from '@inertiajs/react';

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service" />
            <div className="min-vh-100 bg-light">
                <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
                    <div className="container">
                        <Link href="/" className="navbar-brand fw-bold d-flex align-items-center">
                            <i className="bi bi-bullseye text-primary me-2 fs-4" />
                            ACS
                        </Link>
                    </div>
                </nav>

                <div className="container py-5" style={{ maxWidth: 800 }}>
                    <h1 className="fw-bold mb-2">Terms of Service</h1>
                    <p className="text-muted small mb-4">Last updated: 2026-05-04</p>

                    <p>
                        By creating an account or using the ACS web application (the &quot;Service&quot;),
                        you agree to these Terms of Service.
                    </p>

                    <h4 className="fw-semibold mt-4">1. Eligibility</h4>
                    <p>You must be at least 18 years old and able to form a binding contract.</p>

                    <h4 className="fw-semibold mt-4">2. Account responsibility</h4>
                    <ul>
                        <li>Keep your password secure. You are responsible for activity on your account.</li>
                        <li>Provide accurate information at registration. Update it if it changes.</li>
                        <li>One account per person, unless you've purchased a Team plan.</li>
                    </ul>

                    <h4 className="fw-semibold mt-4">3. Subscription &amp; payments</h4>
                    <ul>
                        <li>Plans renew monthly via Billplz. You can change or cancel anytime from <strong>Plans &amp; Billing</strong>.</li>
                        <li>Founder Lifetime Deal is one-time and non-refundable after 7 days.</li>
                        <li>Failed payments suspend the account until renewed.</li>
                        <li>Refunds for monthly plans within 7 days of charge, no questions asked. Email <a href="mailto:hello@acs.local">hello@acs.local</a>.</li>
                    </ul>

                    <h4 className="fw-semibold mt-4">4. Acceptable use</h4>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Use the Service to send unsolicited bulk messages (spam) or anything illegal.</li>
                        <li>Reverse-engineer, scrape, or attempt to access another user's data.</li>
                        <li>Resell access to your account or share login credentials.</li>
                    </ul>
                    <p>We may suspend accounts that violate these rules without notice.</p>

                    <h4 className="fw-semibold mt-4">5. WhatsApp usage</h4>
                    <p>
                        ACS facilitates WhatsApp messaging via <code>wa.me</code> links and (optionally)
                        third-party services like Onsend. You are responsible for complying with WhatsApp's
                        Terms of Service and applicable communication laws (including PDPA, anti-spam rules).
                    </p>

                    <h4 className="fw-semibold mt-4">6. Affiliate program</h4>
                    <ul>
                        <li>Commissions are 30% of recurring subscription payments from referred users.</li>
                        <li>Pack purchases are not commissioned.</li>
                        <li>Minimum payout is RM 50; payouts are processed manually within 3 business days of request.</li>
                        <li>Self-referrals are prohibited and will be cancelled.</li>
                    </ul>

                    <h4 className="fw-semibold mt-4">7. Service availability</h4>
                    <p>
                        We aim for high uptime but make no guarantees. Scheduled maintenance will be
                        announced in advance when possible. We are not liable for indirect damages from
                        downtime.
                    </p>

                    <h4 className="fw-semibold mt-4">8. Intellectual property</h4>
                    <p>
                        ACS code, brand, and templates we provide remain our property. The data you create
                        (leads, custom templates, notes) belongs to you.
                    </p>

                    <h4 className="fw-semibold mt-4">9. Termination</h4>
                    <p>
                        You can delete your account at any time. We may terminate accounts that violate these
                        Terms. Pro-rated refunds at our discretion.
                    </p>

                    <h4 className="fw-semibold mt-4">10. Changes</h4>
                    <p>
                        We may update these Terms occasionally. Material changes will be communicated via
                        email at least 14 days before taking effect.
                    </p>

                    <hr className="my-4" />
                    <p className="small text-muted">
                        <Link href="/privacy" className="text-decoration-none">Privacy Policy</Link>
                        {' · '}
                        <Link href="/" className="text-decoration-none">Back to home</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
