import React, { ButtonHTMLAttributes, ReactNode, useState } from 'react';
import { useConfirm, ConfirmOptions } from '@/Hooks/useConfirm';

interface ConfirmButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    onConfirm: () => void | Promise<void>;
    confirm?: ConfirmOptions;
    loadingText?: string;
    children: ReactNode;
}

export default function ConfirmButton({
    onConfirm,
    confirm,
    loadingText,
    children,
    className = 'btn btn-primary',
    disabled,
    ...rest
}: ConfirmButtonProps) {
    const ask = useConfirm();
    const [busy, setBusy] = useState(false);

    const handleClick = async () => {
        const ok = await ask(confirm ?? {});
        if (!ok) return;
        try {
            setBusy(true);
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            className={className}
            onClick={handleClick}
            disabled={disabled || busy}
            {...rest}
        >
            {busy ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    {loadingText ?? 'Processing...'}
                </>
            ) : (
                children
            )}
        </button>
    );
}
