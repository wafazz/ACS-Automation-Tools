import GuestLayout from '@/Layouts/GuestLayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <h2 className="h4 fw-bold mb-1">Confirm your password</h2>
            <p className="text-muted mb-4">
                This is a secure area. Re-enter your password to continue.
            </p>

            <form onSubmit={submit}>
                <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-medium">Password</label>
                    <input
                        id="password"
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={data.password}
                        autoComplete="current-password"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                <LoadingButton
                    type="submit"
                    loading={processing}
                    className="btn btn-primary w-100"
                    loadingText="Confirming..."
                >
                    Confirm
                </LoadingButton>
            </form>
        </GuestLayout>
    );
}
