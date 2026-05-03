import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { PageProps } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import toast from 'react-hot-toast';

interface ReminderTypeOption {
    value: 'auto_day_1' | 'auto_day_3' | 'auto_day_7';
    label: string;
    days: number;
}

interface PageData {
    automation: {
        autosend_enabled: boolean;
        template_map: Record<string, number | null>;
    };
    templates: Array<{ id: number; title: string; is_default: boolean }>;
    reminderTypes: ReminderTypeOption[];
    onsendConfigured: boolean;
}

export default function Automation() {
    const { automation, templates, reminderTypes, onsendConfigured } =
        usePage<PageProps<PageData>>().props;

    const form = useForm({
        autosend_enabled: automation.autosend_enabled,
        template_map: {
            auto_day_1: automation.template_map.auto_day_1 ?? null,
            auto_day_3: automation.template_map.auto_day_3 ?? null,
            auto_day_7: automation.template_map.auto_day_7 ?? null,
        } as Record<string, number | null>,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(route('settings.automation.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Automation settings saved.'),
        });
    };

    const setTemplate = (key: string, value: string) => {
        form.setData('template_map', {
            ...form.data.template_map,
            [key]: value === '' ? null : Number(value),
        });
    };

    const allTypesAssigned = reminderTypes.every((t) => form.data.template_map[t.value] !== null);
    const someTypesAssigned = reminderTypes.some((t) => form.data.template_map[t.value] !== null);
    const willActuallyAutosend = form.data.autosend_enabled && onsendConfigured && someTypesAssigned;

    return (
        <AdminLTELayout
            title="Settings · Automation"
            pageTitle="Automation"
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('profile.edit')} className="text-decoration-none">Settings</Link>
                    {' / '}<span>Automation</span>
                </small>
            }
        >
            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    {/* Status banner */}
                    {willActuallyAutosend ? (
                        <div className="alert alert-success d-flex align-items-start gap-2 mb-3">
                            <i className="bi bi-check-circle-fill" />
                            <div>
                                <strong>Autosend is active.</strong>{' '}
                                The hourly cron will automatically send your assigned templates to leads
                                whenever a Day 1/3/7 reminder becomes due.
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                            <i className="bi bi-exclamation-triangle-fill" />
                            <div>
                                <strong>Autosend is currently INACTIVE.</strong>
                                <ul className="small mb-0 mt-1">
                                    {!form.data.autosend_enabled && <li>Toggle "Enable autosend" below</li>}
                                    {!onsendConfigured && (
                                        <li>
                                            <Link href={route('settings.onsend')} className="alert-link">
                                                Configure your Onsend credentials
                                            </Link>
                                        </li>
                                    )}
                                    {!someTypesAssigned && <li>Assign at least one template below</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-lightning-charge me-2 text-primary" />
                                Auto-send Reminder Templates
                            </h6>
                            <p className="text-muted small mb-4">
                                Pick a template for each follow-up day. When the reminder becomes due, ACS
                                automatically sends the rendered template to the lead via your Onsend account.
                                Closed leads are never auto-messaged.
                            </p>

                            <form onSubmit={submit}>
                                <div className="form-check form-switch mb-4">
                                    <input
                                        id="autosend_enabled"
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={form.data.autosend_enabled}
                                        onChange={(e) => form.setData('autosend_enabled', e.target.checked)}
                                    />
                                    <label htmlFor="autosend_enabled" className="form-check-label fw-medium">
                                        Enable autosend
                                    </label>
                                    <div className="form-text">
                                        Master switch. When off, no reminders are auto-sent regardless of template assignments.
                                    </div>
                                </div>

                                <div className="mb-4">
                                    {reminderTypes.map((type) => (
                                        <div key={type.value} className="mb-3">
                                            <label htmlFor={type.value} className="form-label fw-medium">
                                                <i className="bi bi-calendar-check me-2 text-primary" />
                                                {type.label}
                                                <span className="text-muted small ms-2">
                                                    (fires {type.days} day{type.days === 1 ? '' : 's'} after lead added)
                                                </span>
                                            </label>
                                            <select
                                                id={type.value}
                                                className="form-select"
                                                value={form.data.template_map[type.value] ?? ''}
                                                onChange={(e) => setTemplate(type.value, e.target.value)}
                                            >
                                                <option value="">— No template (manual only) —</option>
                                                {templates.map((tpl) => (
                                                    <option key={tpl.id} value={tpl.id}>
                                                        {tpl.title}{tpl.is_default ? ' (default)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                <LoadingButton
                                    type="submit"
                                    loading={form.processing}
                                    className="btn btn-primary"
                                    loadingText="Saving..."
                                >
                                    <i className="bi bi-check-lg me-1" />
                                    Save Automation Settings
                                </LoadingButton>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-info-circle me-2 text-primary" />
                                How it works
                            </h6>
                            <ol className="text-muted small ps-3 mb-3">
                                <li className="mb-2">
                                    Add a lead. ACS auto-creates 3 reminders (Day 1, 3, 7 at 09:00 MYT).
                                </li>
                                <li className="mb-2">
                                    When each reminder becomes due, an hourly cron checks if you have autosend on +
                                    a template assigned for that day.
                                </li>
                                <li className="mb-2">
                                    If yes, the rendered template is sent via your Onsend WhatsApp instantly. The
                                    reminder is marked auto-sent and a note is added to the lead's activity timeline.
                                </li>
                                <li>
                                    If no (autosend off, no template, no Onsend, or lead already closed), the
                                    reminder stays as a manual to-do as before.
                                </li>
                            </ol>
                            <div className="alert alert-info small mb-0">
                                <i className="bi bi-shield-check me-1" />
                                Each reminder is sent <strong>at most once</strong> automatically — even if the cron
                                runs multiple times.
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm mt-3">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-clipboard-check me-2 text-primary" />
                                Status check
                            </h6>
                            <ul className="list-unstyled small mb-0">
                                <StatusRow ok={form.data.autosend_enabled} label="Autosend enabled" />
                                <StatusRow
                                    ok={onsendConfigured}
                                    label="Onsend configured"
                                    fixHref={onsendConfigured ? null : route('settings.onsend')}
                                />
                                <StatusRow ok={allTypesAssigned} label="All 3 templates assigned" />
                                <StatusRow
                                    ok={templates.length > 0}
                                    label={`Templates available (${templates.length})`}
                                    fixHref={templates.length === 0 ? route('templates.create') : null}
                                />
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}

function StatusRow({ ok, label, fixHref = null }: { ok: boolean; label: string; fixHref?: string | null }) {
    return (
        <li className="mb-2 d-flex justify-content-between align-items-center gap-2">
            <span className="d-flex align-items-center gap-2">
                <i className={`bi ${ok ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'}`} />
                {label}
            </span>
            {!ok && fixHref && (
                <Link href={fixHref} className="small text-decoration-none">
                    fix →
                </Link>
            )}
        </li>
    );
}
