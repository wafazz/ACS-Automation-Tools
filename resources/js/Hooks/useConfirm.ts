import Swal, { SweetAlertIcon } from 'sweetalert2';

type ConfirmTone = 'primary' | 'danger' | 'success' | 'warning';

export interface ConfirmOptions {
    title?: string;
    text?: string;
    icon?: SweetAlertIcon;
    tone?: ConfirmTone;
    confirmText?: string;
    cancelText?: string;
}

const TONE_COLORS: Record<ConfirmTone, string> = {
    primary: '#0d6efd',
    danger: '#dc3545',
    success: '#198754',
    warning: '#ffc107',
};

export function useConfirm() {
    return async (options: ConfirmOptions = {}): Promise<boolean> => {
        const tone = options.tone ?? 'primary';
        const result = await Swal.fire({
            title: options.title ?? 'Are you sure?',
            text: options.text ?? 'Please confirm this action.',
            icon: options.icon ?? 'question',
            showCancelButton: true,
            confirmButtonColor: TONE_COLORS[tone],
            cancelButtonColor: '#6c757d',
            confirmButtonText: options.confirmText ?? 'Yes, proceed',
            cancelButtonText: options.cancelText ?? 'Cancel',
            reverseButtons: true,
            focusCancel: tone === 'danger',
        });
        return result.isConfirmed;
    };
}
