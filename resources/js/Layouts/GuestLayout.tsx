import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-vh-100 d-flex flex-column bg-light">
            <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5 px-3">
                <div className="w-100" style={{ maxWidth: 440 }}>
                    <div className="text-center mb-4">
                        <Link href="/" className="text-decoration-none">
                            <i className="bi bi-bullseye text-primary" style={{ fontSize: '2.5rem' }} />
                            <h1 className="h3 fw-bold text-dark mt-2 mb-0">ACS</h1>
                            <small className="text-muted">Agent Closing System</small>
                        </Link>
                    </div>
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4 p-md-5">
                            {children}
                        </div>
                    </div>
                    <p className="text-center text-muted small mt-4 mb-0">
                        &copy; {new Date().getFullYear()} ACS. Close more deals, less effort.
                    </p>
                </div>
            </div>
        </div>
    );
}
