import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head>
                <title>ACS — Close more deals, less effort</title>
                <meta name="description" content="ACS is a lightweight WhatsApp-first CRM for sales agents — capture leads, automate Day 1/3/7 follow-ups, send pre-filled WhatsApp messages, and never miss a hot deal. Built for takaful, insurance, property, automotive, and dropship agents in Malaysia." />
                <meta name="keywords" content="agent crm, takaful crm, whatsapp crm malaysia, lead management, follow up reminder, sales agent tool, property agent crm" />
                <meta name="author" content="ACS" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="ACS — Close more deals, less effort" />
                <meta property="og:description" content="WhatsApp-first CRM for Malaysian sales agents. Capture leads, automate follow-ups, close more deals." />
                <meta property="og:image" content="/icons/icon-512.png" />
                <meta property="og:locale" content="en_MY" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="ACS — Close more deals, less effort" />
                <meta name="twitter:description" content="WhatsApp-first CRM for Malaysian sales agents." />
                <meta name="twitter:image" content="/icons/icon-512.png" />
            </Head>

            <div className="min-vh-100 bg-light">
                {/* Top nav */}
                <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
                    <div className="container">
                        <Link href="/" className="navbar-brand fw-bold d-flex align-items-center">
                            <i className="bi bi-bullseye text-primary me-2 fs-4" />
                            ACS
                        </Link>
                        <div className="ms-auto d-flex gap-2">
                            {auth?.user ? (
                                <Link href="/dashboard" className="btn btn-primary">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="btn btn-outline-primary">
                                        Login
                                    </Link>
                                    <Link href="/register" className="btn btn-primary">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="py-5 py-md-6">
                    <div className="container py-4">
                        <div className="row align-items-center">
                            <div className="col-lg-6 mb-5 mb-lg-0">
                                <span className="badge bg-primary-subtle text-primary px-3 py-2 mb-3">
                                    For Sales Agents · Multi-Industry
                                </span>
                                <h1 className="display-4 fw-bold mb-3">
                                    Close more deals — <span className="text-primary">without more work</span>.
                                </h1>
                                <p className="lead text-muted mb-4">
                                    ACS helps takaful, insurance, property, automotive, and product agents
                                    track leads, automate follow-ups, and never miss a hot deal again.
                                </p>
                                <div className="d-flex flex-wrap gap-2">
                                    <Link href="/register" className="btn btn-primary btn-lg">
                                        Start Free Trial
                                    </Link>
                                    <a href="#features" className="btn btn-outline-secondary btn-lg">
                                        See Features
                                    </a>
                                </div>
                                <p className="text-muted small mt-3 mb-0">
                                    <i className="bi bi-check-circle-fill text-success me-1" />
                                    No credit card required · 7-day free trial
                                </p>
                            </div>

                            <div className="col-lg-6">
                                <div className="card shadow-lg border-0 overflow-hidden">
                                    <div className="card-body p-4 bg-primary text-white">
                                        <div className="d-flex align-items-center mb-3">
                                            <i className="bi bi-people-fill fs-3 me-2" />
                                            <strong>Today's Pipeline</strong>
                                        </div>
                                        <div className="row g-3">
                                            {[
                                                { l: 'New Leads', v: '12', i: 'bi-plus-circle' },
                                                { l: 'Follow-ups', v: '8', i: 'bi-bell' },
                                                { l: 'Closed', v: '3', i: 'bi-trophy' },
                                            ].map((s) => (
                                                <div key={s.l} className="col-4">
                                                    <div className="bg-white bg-opacity-10 rounded p-3 text-center">
                                                        <i className={`bi ${s.i} fs-4 d-block mb-1`} />
                                                        <div className="fs-3 fw-bold">{s.v}</div>
                                                        <small className="opacity-75">{s.l}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-5 bg-white">
                    <div className="container py-4">
                        <div className="text-center mb-5">
                            <h2 className="fw-bold">Everything you need to close more</h2>
                            <p className="text-muted">Built lean. Built for agents. Built mobile-first.</p>
                        </div>
                        <div className="row g-4">
                            {[
                                { i: 'bi-people', t: 'Lead Pipeline', d: 'Capture, organize, and track every lead through New → Follow-up → Closed.' },
                                { i: 'bi-bell', t: 'Smart Reminders', d: 'Auto-scheduled Day 1 / 3 / 7 follow-ups so no lead falls through.' },
                                { i: 'bi-whatsapp', t: 'WhatsApp Quick Send', d: 'One-click templates with personalized variables — close 2x faster.' },
                                { i: 'bi-graph-up', t: 'Conversion Analytics', d: 'See your closing rate, pipeline value, and weekly performance.' },
                                { i: 'bi-phone', t: 'Mobile-First', d: 'Works on your phone. Add to home screen — no app install.' },
                                { i: 'bi-shield-check', t: 'Your Data, Yours', d: 'Each agent has private data. No leaks, no sharing, ever.' },
                            ].map((f) => (
                                <div key={f.t} className="col-md-6 col-lg-4">
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="card-body p-4">
                                            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary mb-3" style={{ width: 50, height: 50 }}>
                                                <i className={`bi ${f.i} fs-4`} />
                                            </div>
                                            <h5 className="fw-semibold">{f.t}</h5>
                                            <p className="text-muted mb-0">{f.d}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-5">
                    <div className="container py-3">
                        <div className="card border-0 bg-primary text-white text-center shadow-lg">
                            <div className="card-body p-4 p-md-5">
                                <h2 className="fw-bold mb-3">Ready to close more this month?</h2>
                                <p className="lead mb-4 opacity-90">Join early agents using ACS to grow their income.</p>
                                <Link href="/register" className="btn btn-light btn-lg fw-semibold">
                                    Start Your Free Trial
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-4 bg-white border-top">
                    <div className="container text-center text-muted small">
                        &copy; {new Date().getFullYear()} ACS — Agent Closing System. All rights reserved.
                        <div className="mt-2">
                            <Link href="/privacy" className="text-decoration-none text-muted me-3">Privacy</Link>
                            <Link href="/terms" className="text-decoration-none text-muted">Terms of Service</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
