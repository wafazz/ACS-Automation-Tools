import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { PageProps } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useState } from 'react';
import toast from 'react-hot-toast';

interface PageData {
    settings: {
        api_key: string;
        x_signature: string;
        collection_id: string;
        sandbox: boolean;
    };
    is_enabled: boolean;
    env_fallback: {
        has_api_key: boolean;
        has_x_signature: boolean;
        has_collection_id: boolean;
    };
}

export default function BillplzSetting() {
    const { settings, is_enabled, env_fallback } = usePage<PageProps<PageData>>().props;
    const [testing, setTesting] = useState(false);

    const form = useForm({
        api_key: '',
        x_signature: '',
        collection_id: settings.collection_id,
        sandbox: settings.sandbox,
        is_enabled,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(route('admin.settings.billplz.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Billplz settings saved.');
                form.reset('api_key', 'x_signature');
            },
        });
    };

    const test = async () => {
        setTesting(true);
        try {
            const { data } = await axios.post(route('admin.settings.billplz.test'));
            data.ok ? toast.success(data.message) : toast.error(data.message);
        } catch {
            toast.error('Test request failed.');
        } finally {
            setTesting(false);
        }
    };

    return (
        <AdminLTELayout title="Admin · Billplz" pageTitle="Billplz Integration">
            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-credit-card-2-front me-2 text-primary" />
                                API Credentials
                            </h6>

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
                                        placeholder={settings.api_key ? 'Leave blank to keep existing key' : 'Paste your Billplz API key'}
                                        autoComplete="off"
                                    />
                                    {form.errors.api_key && <div className="invalid-feedback">{form.errors.api_key}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="x_signature" className="form-label small fw-medium">X Signature Key</label>
                                    {settings.x_signature && (
                                        <div className="mb-1">
                                            <span className="badge bg-success-subtle text-success small">
                                                <i className="bi bi-check-lg me-1" />
                                                set: <span className="font-monospace ms-1">{settings.x_signature}</span>
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        id="x_signature"
                                        type="password"
                                        className={`form-control font-monospace ${form.errors.x_signature ? 'is-invalid' : ''}`}
                                        value={form.data.x_signature}
                                        onChange={(e) => form.setData('x_signature', e.target.value)}
                                        placeholder={settings.x_signature ? 'Leave blank to keep existing key' : 'Paste your X Signature key'}
                                        autoComplete="off"
                                    />
                                    {form.errors.x_signature && <div className="invalid-feedback">{form.errors.x_signature}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="collection_id" className="form-label small fw-medium">Collection ID</label>
                                    <input
                                        id="collection_id"
                                        type="text"
                                        className={`form-control font-monospace ${form.errors.collection_id ? 'is-invalid' : ''}`}
                                        value={form.data.collection_id}
                                        onChange={(e) => form.setData('collection_id', e.target.value)}
                                        placeholder="e.g. abc123xy"
                                    />
                                    {form.errors.collection_id && <div className="invalid-feedback">{form.errors.collection_id}</div>}
                                </div>

                                <div className="form-check form-switch mb-3">
                                    <input
                                        id="sandbox"
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={form.data.sandbox}
                                        onChange={(e) => form.setData('sandbox', e.target.checked)}
                                    />
                                    <label htmlFor="sandbox" className="form-check-label">
                                        Sandbox mode <span className="text-muted small">(use billplz-sandbox.com)</span>
                                    </label>
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
                                        Use DB settings <span className="text-muted small">(otherwise fall back to .env values)</span>
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
                                            <><span className="spinner-border spinner-border-sm me-2" /> Testing...</>
                                        ) : (
                                            <><i className="bi bi-send-check me-1" /> Test Connection</>
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
                                .env Fallback
                            </h6>
                            <p className="text-muted small mb-3">
                                These values are loaded if the DB setting is disabled or empty.
                            </p>
                            <ul className="list-unstyled small mb-0">
                                <FallbackRow label="BILLPLZ_API_KEY" present={env_fallback.has_api_key} />
                                <FallbackRow label="BILLPLZ_X_SIGNATURE" present={env_fallback.has_x_signature} />
                                <FallbackRow label="BILLPLZ_COLLECTION_ID" present={env_fallback.has_collection_id} />
                            </ul>
                            <hr />
                            <p className="text-muted small mb-0">
                                <strong>Where to find these:</strong>{' '}
                                <a href="https://www.billplz-sandbox.com" target="_blank" rel="noopener" className="text-decoration-none">
                                    billplz-sandbox.com
                                </a>{' '}→ Settings → API. Create a Collection separately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}

function FallbackRow({ label, present }: { label: string; present: boolean }) {
    return (
        <li className="mb-2 d-flex align-items-center gap-2">
            <i className={`bi ${present ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'}`} />
            <code className="small">{label}</code>
        </li>
    );
}
