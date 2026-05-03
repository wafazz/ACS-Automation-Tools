import { Head, Link } from '@inertiajs/react';

interface Props {
    status: number;
}

const ERRORS: Record<number, { title: string; description: string; icon: string; tone: string }> = {
    403: {
        title: 'Access denied',
        description: "You don't have permission to view this page.",
        icon: 'bi-shield-exclamation',
        tone: 'text-warning',
    },
    404: {
        title: 'Page not found',
        description: "The page you're looking for has wandered off.",
        icon: 'bi-compass',
        tone: 'text-primary',
    },
    419: {
        title: 'Page expired',
        description: 'Your session has expired. Refresh the page and try again.',
        icon: 'bi-clock-history',
        tone: 'text-info',
    },
    429: {
        title: 'Too many requests',
        description: 'Slow down a bit and try again in a moment.',
        icon: 'bi-hourglass-split',
        tone: 'text-warning',
    },
    500: {
        title: 'Something went wrong',
        description: "We're on it. Please try again — if it keeps happening, contact support.",
        icon: 'bi-exclamation-triangle',
        tone: 'text-danger',
    },
    503: {
        title: "We'll be right back",
        description: "ACS is briefly down for maintenance. We're back shortly.",
        icon: 'bi-tools',
        tone: 'text-secondary',
    },
};

export default function ErrorPage({ status }: Props) {
    const error = ERRORS[status] ?? ERRORS[500];

    return (
        <>
            <Head title={`${status} — ${error.title}`} />
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
                <div className="text-center" style={{ maxWidth: 480 }}>
                    <i className={`bi ${error.icon} ${error.tone}`} style={{ fontSize: '5rem' }} />
                    <div className="display-1 fw-bold text-muted mt-2 mb-0">{status}</div>
                    <h2 className="fw-bold mt-3 mb-2">{error.title}</h2>
                    <p className="text-muted mb-4">{error.description}</p>

                    <div className="d-flex gap-2 justify-content-center">
                        <Link href="/" className="btn btn-primary">
                            <i className="bi bi-house me-1" />
                            Back home
                        </Link>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => window.history.back()}
                        >
                            <i className="bi bi-arrow-left me-1" />
                            Go back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
