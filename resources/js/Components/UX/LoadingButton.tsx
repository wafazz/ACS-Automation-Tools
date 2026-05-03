import { ButtonHTMLAttributes, ReactNode } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingText?: string;
    children: ReactNode;
}

export default function LoadingButton({
    loading = false,
    loadingText,
    children,
    className = 'btn btn-primary',
    disabled,
    ...rest
}: LoadingButtonProps) {
    return (
        <button
            className={className}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    {loadingText ?? 'Please wait...'}
                </>
            ) : (
                children
            )}
        </button>
    );
}
