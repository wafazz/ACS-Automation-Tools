import GuestLayout from '@/Layouts/GuestLayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import toast from 'react-hot-toast';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'), {
            onSuccess: () => toast.success('Verification email sent.'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <h2 className="h4 fw-bold mb-1">Verify your email</h2>
            <p className="text-muted mb-4">
                Thanks for signing up! Click the link in the verification email we sent
                you to activate your account.
            </p>

            {status === 'verification-link-sent' && (
                <div className="alert alert-success py-2 small">
                    A new verification link has been sent to your email.
                </div>
            )}

            <form onSubmit={submit}>
                <LoadingButton
                    type="submit"
                    loading={processing}
                    className="btn btn-primary w-100"
                    loadingText="Sending..."
                >
                    Resend verification email
                </LoadingButton>

                <div className="text-center mt-4">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="btn btn-link text-muted small text-decoration-none"
                    >
                        Log out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
