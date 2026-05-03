import { useConfirm } from '@/Hooks/useConfirm';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function DeleteUserForm() {
    const ask = useConfirm();
    const [busy, setBusy] = useState(false);

    const handleDelete = async () => {
        const ok = await ask({
            title: 'Delete your account?',
            text: 'All your leads, reminders, and templates will be permanently deleted. This cannot be undone.',
            icon: 'warning',
            tone: 'danger',
            confirmText: 'Yes, delete my account',
            cancelText: 'Keep my account',
        });
        if (!ok) return;

        const { value: password, isConfirmed } = await Swal.fire({
            title: 'Confirm with your password',
            input: 'password',
            inputPlaceholder: 'Your current password',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Delete account',
            reverseButtons: true,
            focusCancel: true,
            inputValidator: (value) => (!value ? 'Password is required' : null),
        });

        if (!isConfirmed || !password) return;

        setBusy(true);
        router.delete(route('profile.destroy'), {
            data: { password },
            preserveScroll: true,
            onSuccess: () => toast.success('Account deleted.'),
            onError: (err) => {
                const msg = err.password ?? 'Could not delete account.';
                toast.error(msg);
            },
            onFinish: () => setBusy(false),
        });
    };

    return (
        <section>
            <header className="mb-3">
                <h5 className="fw-semibold mb-1 text-danger">
                    <i className="bi bi-exclamation-triangle me-2" />
                    Delete Account
                </h5>
                <p className="text-muted small mb-0">
                    Once your account is deleted, all of its resources and data will be permanently
                    removed. Download anything you want to keep before deleting.
                </p>
            </header>

            <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDelete}
                disabled={busy}
            >
                {busy ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Deleting...
                    </>
                ) : (
                    <>
                        <i className="bi bi-trash me-1" />
                        Delete my account
                    </>
                )}
            </button>
        </section>
    );
}
