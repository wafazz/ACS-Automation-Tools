import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { PageProps } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useState } from 'react';
import toast from 'react-hot-toast';

interface PageData {
    settings: {
        instance_id: string;
        access_token: string;
    };
    is_enabled: boolean;
}

export default function OnsendSetting() {
    const { settings, is_enabled } = usePage<PageProps<PageData>>().props;
    const [testing, setTesting] = useState(false);

    const form = useForm({
        instance_id: '',
        access_token: '',
        is_enabled,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(route('admin.settings.onsend.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Onsend settings saved.');
                form.reset('instance_id', 'access_token');
            },
        });
    };

    const test = async () => {
        setTesting(true);
        try {
            const { data } = await axios.post(route('admin.settings.onsend.test'));
            data.ok ? toast.success(data.message) : toast.error(data.message);
        } catch {
            toast.error('Test request failed.');
        } finally {
            setTesting(false);
        }
    };

    return (
        <AdminLTELayout title="Admin · Onsend" pageTitle="Onsend (WhatsApp) Integration">
            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-whatsapp me-2 text-success" />
                                WhatsApp Send Credentials
                            </h6>

                            <form onSubmit={submit}>
                                <div className="mb-3">
                                    <label htmlFor="instance_id" className="form-label small fw-medium">Instance ID</label>
                                    {settings.instance_id && (
                                        <div className="mb-1">
                                            <span className="badge bg-success-subtle text-success small">
                                                <i className="bi bi-check-lg me-1" />
                                                set: <span className="font-monospace ms-1">{settings.instance_id}</span>
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        id="instance_id"
                                        type="password"
                                        className={`form-control font-monospace ${form.errors.instance_id ? 'is-invalid' : ''}`}
                                        value={form.data.instance_id}
                                        onChange={(e) => form.setData('instance_id', e.target.value)}
                                        placeholder={settings.instance_id ? 'Leave blank to keep existing value' : 'Paste your Onsend instance ID'}
                                        autoComplete="off"
                                    />
                                    {form.errors.instance_id && <div className="invalid-feedback">{form.errors.instance_id}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="access_token" className="form-label small fw-medium">Access Token</label>
                                    {settings.access_token && (
                                        <div className="mb-1">
                                            <span className="badge bg-success-subtle text-success small">
                                                <i className="bi bi-check-lg me-1" />
                                                set: <span className="font-monospace ms-1">{settings.access_token}</span>
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        id="access_token"
                                        type="password"
                                        className={`form-control font-monospace ${form.errors.access_token ? 'is-invalid' : ''}`}
                                        value={form.data.access_token}
                                        onChange={(e) => form.setData('access_token', e.target.value)}
                                        placeholder={settings.access_token ? 'Leave blank to keep existing value' : 'Paste your access token'}
                                        autoComplete="off"
                                    />
                                    {form.errors.access_token && <div className="invalid-feedback">{form.errors.access_token}</div>}
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
                                        Enable Onsend WhatsApp sending
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
                                            <><i className="bi bi-send-check me-1" /> Send Test WhatsApp</>
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
                                About Onsend
                            </h6>
                            <p className="text-muted small mb-2">
                                Onsend is used for outbound WhatsApp messages — useful for system-triggered
                                notifications (payment receipts, trial expiry warnings, broadcasts).
                            </p>
                            <p className="text-muted small mb-2">
                                Phone numbers are auto-normalized to MY format (60xxxxxxxxx).
                            </p>
                            <p className="text-muted small mb-2">
                                <strong>Where to get credentials:</strong>{' '}
                                <a href="https://app.onsend.io" target="_blank" rel="noopener" className="text-decoration-none">
                                    app.onsend.io
                                </a>{' '}→ create instance, scan QR with your business WhatsApp.
                            </p>
                            <p className="text-muted small mb-0">
                                Test button sends a real message to <strong>your admin profile phone</strong>.
                                Set it in Profile if missing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
