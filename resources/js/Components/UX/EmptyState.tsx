import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}

export default function EmptyState({
    icon = 'bi-inbox',
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="text-center py-5 px-3">
            <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3"
                style={{ width: 80, height: 80 }}
            >
                <i className={`bi ${icon} text-secondary`} style={{ fontSize: '2rem' }} />
            </div>
            <h5 className="fw-semibold mb-2">{title}</h5>
            {description && (
                <p className="text-muted mb-3" style={{ maxWidth: 380, margin: '0 auto' }}>
                    {description}
                </p>
            )}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
