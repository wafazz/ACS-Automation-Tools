import LoadingButton from '@/Components/UX/LoadingButton';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import toast from 'react-hot-toast';

export default function UpdatePasswordForm() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                toast.success('Password updated.');
            },
            onError: (err) => {
                if (err.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (err.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section>
            <header className="mb-4">
                <h5 className="fw-semibold mb-1">
                    <i className="bi bi-shield-lock me-2 text-primary" />
                    Update Password
                </h5>
                <p className="text-muted small mb-0">
                    Use a long, random password to keep your account secure.
                </p>
            </header>

            <form onSubmit={updatePassword}>
                <div className="row g-3">
                    <div className="col-12 col-md-4">
                        <label htmlFor="current_password" className="form-label fw-medium">
                            Current password
                        </label>
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            type="password"
                            className={`form-control ${errors.current_password ? 'is-invalid' : ''}`}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            autoComplete="current-password"
                        />
                        {errors.current_password && (
                            <div className="invalid-feedback">{errors.current_password}</div>
                        )}
                    </div>

                    <div className="col-12 col-md-4">
                        <label htmlFor="password" className="form-label fw-medium">
                            New password
                        </label>
                        <input
                            id="password"
                            ref={passwordInput}
                            type="password"
                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                        />
                        {errors.password && (
                            <div className="invalid-feedback">{errors.password}</div>
                        )}
                    </div>

                    <div className="col-12 col-md-4">
                        <label htmlFor="password_confirmation" className="form-label fw-medium">
                            Confirm password
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            className={`form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                        />
                        {errors.password_confirmation && (
                            <div className="invalid-feedback">{errors.password_confirmation}</div>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <LoadingButton
                        type="submit"
                        loading={processing}
                        className="btn btn-primary"
                        loadingText="Updating..."
                    >
                        <i className="bi bi-key me-1" />
                        Update password
                    </LoadingButton>
                </div>
            </form>
        </section>
    );
}
