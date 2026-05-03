import GuestLayout from '@/Layouts/GuestLayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import toast from 'react-hot-toast';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onSuccess: () => toast.success('Welcome back!'),
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Login" />

            <h2 className="h4 fw-bold mb-1">Welcome back</h2>
            <p className="text-muted mb-4">Sign in to manage your leads.</p>

            {status && (
                <div className="alert alert-success py-2 small">{status}</div>
            )}

            <form onSubmit={submit}>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">Email</label>
                    <input
                        id="email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">Password</label>
                    <input
                        id="password"
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                        <input
                            id="remember"
                            type="checkbox"
                            className="form-check-input"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <label htmlFor="remember" className="form-check-label small">
                            Remember me
                        </label>
                    </div>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="small text-decoration-none"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <LoadingButton
                    type="submit"
                    loading={processing}
                    className="btn btn-primary w-100"
                    loadingText="Signing in..."
                >
                    Login
                </LoadingButton>

                <p className="text-center text-muted small mt-4 mb-0">
                    No account yet?{' '}
                    <Link href={route('register')} className="text-decoration-none fw-medium">
                        Create one free
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
