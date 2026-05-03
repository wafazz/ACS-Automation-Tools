import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { PageProps } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useState } from 'react';
import toast from 'react-hot-toast';

interface PageData {
    settings: {
        api_key: string;
        sender_email: string;
        sender_name: string;
    };
    is_enabled: boolean;
    global_fallback_active: boolean;
}

export default function BrevoSetting() {
    const { settings, is_enabled, global_fallback_active } = usePage<PageProps<PageData>>().props;
    const [testing, setTesting] = useState(false);

    const form = useForm({
        api_key: '',
        sender_email: settings.sender_email,
        sender_name: settings.sender_name,
        is_enabled,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(route('settings.brevo.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Brevo settings saved.');
                form.reset('api_key');
            },
        });
    };

    const test = async () => {
        setTesting(true);
        try {
            const { data } = await axios.post(route('settings.brevo.test'));
            data.ok ? toast.success(data.message) : toast.error(data.message);
        } catch {
            toast.error('Test request failed.');
        } finally {
            setTesting(false);
        }
    };

    return (
        <AdminLTELayout
            title="Settings · Brevo"
            pageTitle="Email Integration (Brevo)"
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('profile.edit')} className="text-decoration-none">Settings</Link>
                    {' / '}<span>Brevo</span>
                </small>
            }
        >
            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-envelope-at me-2 text-primary" />
                                Your Brevo Account
                            </h6>

                            {global_fallback_active && !is_enabled && (
                                <div className="alert alert-info small d-flex align-items-start gap-2 mb-3">
                                    <i className="bi bi-info-circle-fill" />
                                    <div>
                                        Platform-wide Brevo is currently active as fallback. Configure your own keys
                                        below to send emails from your own Brevo account instead.
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit}>
                                <div className="mb-3">
                                    <label htmlFor="api_key" className="form-label small fw-medium">API Key</label>
                                    {settings.api_key && (
                                        <div className="mb-1">
                                            <span className="badge bg-success-subtle text-success small">
                                                <i className="bi bi-check-lg me-1" />
                                                set: <span className="font-monospace ms-1">{settings.api_key}</span>
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        id="api_key"
                                        type="password"
                                        className={`form-control font-monospace ${form.errors.api_key ? 'is-invalid' : ''}`}
                                        value={form.data.api_key}
                                        onChange={(e) => form.setData('api_key', e.target.value)}
                                        placeholder={settings.api_key ? 'Leave blank to keep existing key' : 'xkeysib-...'}
                                        autoComplete="off"
                                    />
                                    {form.errors.api_key && <div className="invalid-feedback">{form.errors.api_key}</div>}
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-md-7">
                                        <label htmlFor="sender_email" className="form-label small fw-medium">
                                            Sender Email <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="sender_email"
                                            type="email"
                                            className={`form-control ${form.errors.sender_email ? 'is-invalid' : ''}`}
                                            value={form.data.sender_email}
                                            onChange={(e) => form.setData('sender_email', e.target.value)}
                                            required
                                        />
                                        {form.errors.sender_email && <div className="invalid-feedback">{form.errors.sender_email}</div>}
                                        <div className="form-text">Must be verified in your Brevo account.</div>
                                    </div>
                                    <div className="col-12 col-md-5">
                                        <label htmlFor="sender_name" className="form-label small fw-medium">
                                            Sender Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="sender_name"
                                            type="text"
                                            className={`form-control ${form.errors.sender_name ? 'is-invalid' : ''}`}
                                            value={form.data.sender_name}
                                            onChange={(e) => form.setData('sender_name', e.target.value)}
                                            required
                                        />
                                        {form.errors.sender_name && <div className="invalid-feedback">{form.errors.sender_name}</div>}
                                    </div>
                                </div>

                                <div className="form-check form-switch mb-4">
                                    <input
                                        id="is_enabled"
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={form.data.is_enabled}
                                        onChange={(e) => form.setData('is_enabled', e.target.checked)}
                                    />
                                    <label htmlFor="is_enabled" className="form-check-label fw-medium">
                                        Enable my Brevo
                                    </label>
                                </div>

                                <div className="d-flex gap-2">
                                    <LoadingButton
                                        type="submit"
                                        loading={form.processing}
                                        className="btn btn-primary"
                                        loadingText="Saving..."
                                    >
                                        <i className="bi bi-check-lg me-1" />
                                        Save Settings
                                    </LoadingButton>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={test}
                                        disabled={testing}
                                    >
                                        {testing ? (
                                            <><span className="spinner-border spinner-border-sm me-2" /> Sending...</>
                                        ) : (
                                            <><i className="bi bi-send-check me-1" /> Send Test Email</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-info-circle me-2 text-primary" />
                                Why connect Brevo?
                            </h6>
                            <p className="text-muted small mb-2">
                                Send emails to your leads from <strong>your own</strong> Brevo account —
                                follow-ups, broadcast campaigns, post-sale onboarding, etc.
                            </p>
                            <p className="text-muted small mb-2">
                                <strong>Get your API key:</strong>{' '}
                                <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener" className="text-decoration-none">
                                    app.brevo.com → SMTP &amp; API
                                </a>
                            </p>
                            <p className="text-muted small mb-0">
                                Free tier: 300 emails/day. Test button sends a real email to <strong>your account email</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
