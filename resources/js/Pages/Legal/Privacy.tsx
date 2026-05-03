import { Head, Link } from '@inertiajs/react';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy" />
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
                    <h1 className="fw-bold mb-2">Privacy Policy</h1>
                    <p className="text-muted small mb-4">Last updated: 2026-05-04</p>

                    <p>
                        This Privacy Policy describes how ACS (&quot;we&quot;, &quot;us&quot;) collects, uses,
                        and shares information about you when you use the Agent Closing System web application
                        and related services (the &quot;Service&quot;).
                    </p>

                    <h4 className="fw-semibold mt-4">1. Information we collect</h4>
                    <ul>
                        <li><strong>Account info</strong>: name, email, phone, industry, password (hashed).</li>
                        <li><strong>Lead data</strong>: contact details, status, notes, and templates you create — strictly scoped to your account.</li>
                        <li><strong>Payment info</strong>: handled by our payment provider (Billplz). We never store full card numbers.</li>
                        <li><strong>Usage data</strong>: pages visited, actions taken, IP address (for security and debugging).</li>
                    </ul>

                    <h4 className="fw-semibold mt-4">2. How we use it</h4>
                    <ul>
                        <li>To provide and operate the Service.</li>
                        <li>To send transactional emails (receipts, password resets, trial expiry warnings).</li>
                        <li>To improve features and detect abuse.</li>
                        <li>We <strong>never</strong> sell your lead data or use it for marketing.</li>
                    </ul>

                    <h4 className="fw-semibold mt-4">3. Data isolation</h4>
                    <p>
                        Every query against your data is scoped by your <code>user_id</code>. Other users
                        cannot view, edit, or delete your leads, reminders, templates, or payments.
                    </p>

                    <h4 className="fw-semibold mt-4">4. Third-party services</h4>
                    <ul>
                        <li><strong>Billplz</strong> — payment processing (FPX, cards). Their privacy policy applies to checkout.</li>
                        <li><strong>Brevo</strong> — transactional email delivery.</li>
                        <li><strong>Onsend</strong> — outbound WhatsApp messages (when configured).</li>
                    </ul>

                    <h4 className="fw-semibold mt-4">5. Data retention &amp; deletion</h4>
                    <p>
                        You can delete your account at any time from <strong>Profile → Delete Account</strong>.
                        All your leads, reminders, templates, and personal data are permanently removed.
                        Aggregate (anonymous) usage stats may be retained for service health.
                    </p>

                    <h4 className="fw-semibold mt-4">6. Cookies</h4>
                    <p>
                        We use first-party cookies for authentication (Laravel session) and affiliate referral
                        tracking (60 days, httpOnly). No third-party tracking or advertising cookies.
                    </p>

                    <h4 className="fw-semibold mt-4">7. Contact</h4>
                    <p>
                        Questions about this policy? Email us at{' '}
                        <a href="mailto:hello@acs.local">hello@acs.local</a>.
                    </p>

                    <hr className="my-4" />
                    <p className="small text-muted">
                        <Link href="/terms" className="text-decoration-none">Terms of Service</Link>
                        {' · '}
                        <Link href="/" className="text-decoration-none">Back to home</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
