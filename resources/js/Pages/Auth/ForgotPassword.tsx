import GuestLayout from '@/Layouts/GuestLayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import toast from 'react-hot-toast';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'), {
            onSuccess: () => toast.success('Reset link sent — check your email.'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <h2 className="h4 fw-bold mb-1">Reset your password</h2>
            <p className="text-muted mb-4">
                Enter your email and we'll send you a password reset link.
            </p>

            {status && (
                <div className="alert alert-success py-2 small">{status}</div>
            )}

            <form onSubmit={submit}>
                <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-medium">Email</label>
                    <input
                        id="email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <LoadingButton
                    type="submit"
                    loading={processing}
                    className="btn btn-primary w-100"
                    loadingText="Sending..."
                >
                    Email reset link
                </LoadingButton>

                <p className="text-center text-muted small mt-4 mb-0">
                    Remembered it?{' '}
                    <Link href={route('login')} className="text-decoration-none fw-medium">
                        Back to login
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
