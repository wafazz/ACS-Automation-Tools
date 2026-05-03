import LoadingButton from '@/Components/UX/LoadingButton';
import { IndustryOption, PageProps } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import toast from 'react-hot-toast';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    industries,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    industries: IndustryOption[];
}) {
    const user = usePage<PageProps>().props.auth.user!;

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        industry: user.industry ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Profile updated.'),
        });
    };

    return (
        <section>
            <header className="mb-4">
                <h5 className="fw-semibold mb-1">
                    <i className="bi bi-person-circle me-2 text-primary" />
                    Profile Information
                </h5>
                <p className="text-muted small mb-0">
                    Update your account details and contact info.
                </p>
            </header>

            <form onSubmit={submit}>
                <div className="row g-3">
                    <div className="col-12 col-md-6">
                        <label htmlFor="name" className="form-label fw-medium">Full name</label>
                        <input
                            id="name"
                            type="text"
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                        />
                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                        <label htmlFor="email" className="form-label fw-medium">Email</label>
                        <input
                            id="email"
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                        <label htmlFor="phone" className="form-label fw-medium">Phone (WhatsApp)</label>
                        <input
                            id="phone"
                            type="tel"
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="0123456789"
                            autoComplete="tel"
                        />
                        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                        <label htmlFor="industry" className="form-label fw-medium">Industry</label>
                        <select
                            id="industry"
                            className={`form-select ${errors.industry ? 'is-invalid' : ''}`}
                            value={data.industry}
                            onChange={(e) => setData('industry', e.target.value)}
                        >
                            <option value="">Select industry</option>
                            {industries.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errors.industry && <div className="invalid-feedback">{errors.industry}</div>}
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="alert alert-warning mt-3 mb-0 py-2 small">
                        Your email is unverified.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="alert-link p-0 border-0 bg-transparent"
                        >
                            Resend verification email
                        </Link>
                        {status === 'verification-link-sent' && (
                            <span className="text-success d-block mt-1">
                                A new verification link has been sent.
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-4">
                    <LoadingButton
                        type="submit"
                        loading={processing}
                        className="btn btn-primary"
                        loadingText="Saving..."
                    >
                        <i className="bi bi-check-lg me-1" />
                        Save changes
                    </LoadingButton>
                </div>
            </form>
        </section>
    );
}
