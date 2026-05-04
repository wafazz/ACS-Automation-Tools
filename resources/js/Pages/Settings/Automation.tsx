import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { PageProps } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import toast from 'react-hot-toast';

interface SlotData {
    key: 'auto_day_1' | 'auto_day_3' | 'auto_day_7';
    label: string;
    enabled: boolean;
    delay_days: number;
    hour: number;
    minute: number;
    template_id: number | null;
}

interface PageData {
    automation: {
        autosend_enabled: boolean;
    };
    slots: SlotData[];
    templates: Array<{ id: number; title: string; is_default: boolean }>;
    onsendConfigured: boolean;
}

function pad(n: number): string {
    return n.toString().padStart(2, '0');
}

function projectFireTime(now: Date, delayDays: number, hour: number, minute: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + delayDays);
    d.setHours(hour, minute, 0, 0);
    return d;
}

function formatProjection(d: Date): string {
    return d.toLocaleString('en-MY', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Automation() {
    const { automation, slots: initialSlots, templates, onsendConfigured } =
        usePage<PageProps<PageData>>().props;

    const form = useForm({
        autosend_enabled: automation.autosend_enabled,
        slots: initialSlots.map((s) => ({ ...s })),
    });

    const updateSlot = (idx: number, patch: Partial<SlotData>) => {
        form.setData(
            'slots',
            form.data.slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(route('settings.automation.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Automation settings saved.'),
        });
    };

    // Live projection — shows when reminders would fire if a lead was added right now
    const now = useMemo(() => new Date(), []);
    const previews = form.data.slots.map((s) => projectFireTime(now, s.delay_days, s.hour, s.minute));

    const someEnabledAndAssigned = form.data.slots.some(
        (s) => s.enabled && s.template_id !== null,
    );
    const willActuallyAutosend = form.data.autosend_enabled && onsendConfigured && someEnabledAndAssigned;

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
                    {willActuallyAutosend ? (
                        <div className="alert alert-success d-flex align-items-start gap-2 mb-3">
                            <i className="bi bi-check-circle-fill" />
                            <div>
                                <strong>Autosend is active.</strong>{' '}
                                The hourly cron will automatically send your assigned templates to leads
                                whenever a configured slot becomes due.
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                            <i className="bi bi-exclamation-triangle-fill" />
                            <div>
                                <strong>Autosend is currently INACTIVE.</strong>
                                <ul className="small mb-0 mt-1">
                                    {!form.data.autosend_enabled && <li>Toggle the master switch below</li>}
                                    {!onsendConfigured && (
                                        <li>
                                            <Link href={route('settings.onsend')} className="alert-link">
                                                Configure your Onsend credentials
                                            </Link>
                                        </li>
                                    )}
                                    {!someEnabledAndAssigned && <li>Enable at least one follow-up slot below and assign a template</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-lightning-charge me-2 text-primary" />
                                Master Switch
                            </h6>
                            <div className="form-check form-switch">
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
                                    Master switch. When off, no reminders are auto-sent regardless of per-slot settings.
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        {form.data.slots.map((slot, idx) => (
                            <div key={slot.key} className={`card border-0 shadow-sm mb-3 ${slot.enabled ? '' : 'opacity-75'}`}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                        <h6 className="fw-semibold mb-0">
                                            <i className="bi bi-calendar-check me-2 text-primary" />
                                            {slot.label}
                                        </h6>
                                        <div className="form-check form-switch mb-0">
                                            <input
                                                id={`enabled-${slot.key}`}
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={slot.enabled}
                                                onChange={(e) => updateSlot(idx, { enabled: e.target.checked })}
                                            />
                                            <label htmlFor={`enabled-${slot.key}`} className="form-check-label small">
                                                {slot.enabled ? 'Enabled' : 'Disabled'}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-12 col-md-3">
                                            <label htmlFor={`days-${slot.key}`} className="form-label small fw-medium">
                                                Send after
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    id={`days-${slot.key}`}
                                                    type="number"
                                                    min={0}
                                                    max={365}
                                                    className="form-control"
                                                    value={slot.delay_days}
                                                    onChange={(e) => updateSlot(idx, { delay_days: Math.max(0, Math.min(365, Number(e.target.value) || 0)) })}
                                                    disabled={!slot.enabled}
                                                />
                                                <span className="input-group-text">day{slot.delay_days === 1 ? '' : 's'}</span>
                                            </div>
                                        </div>
                                        <div className="col-12 col-md-3">
                                            <label htmlFor={`time-${slot.key}`} className="form-label small fw-medium">
                                                At time
                                            </label>
                                            <input
                                                id={`time-${slot.key}`}
                                                type="time"
                                                className="form-control"
                                                value={`${pad(slot.hour)}:${pad(slot.minute)}`}
                                                onChange={(e) => {
                                                    const [h, m] = e.target.value.split(':').map(Number);
                                                    updateSlot(idx, { hour: h ?? 9, minute: m ?? 0 });
                                                }}
                                                disabled={!slot.enabled}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label htmlFor={`template-${slot.key}`} className="form-label small fw-medium">
                                                Template
                                            </label>
                                            <select
                                                id={`template-${slot.key}`}
                                                className="form-select"
                                                value={slot.template_id ?? ''}
                                                onChange={(e) => updateSlot(idx, { template_id: e.target.value === '' ? null : Number(e.target.value) })}
                                                disabled={!slot.enabled}
                                            >
                                                <option value="">— No template —</option>
                                                {templates.map((tpl) => (
                                                    <option key={tpl.id} value={tpl.id}>
                                                        {tpl.title}{tpl.is_default ? ' (default)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {slot.enabled && (
                                        <div className="mt-3 small text-muted">
                                            <i className="bi bi-clock me-1" />
                                            If a lead is added now, this fires at{' '}
                                            <strong className="text-body">{formatProjection(previews[idx])}</strong>
                                            {!slot.template_id && (
                                                <span className="text-warning ms-2">
                                                    <i className="bi bi-exclamation-triangle me-1" />
                                                    no template assigned
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

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

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm sticky-top" style={{ top: 80 }}>
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-eye me-2 text-primary" />
                                Live Preview
                            </h6>
                            <p className="text-muted small mb-3">
                                If you add a lead right now, here's when each follow-up would fire:
                            </p>
                            <ol className="list-unstyled mb-3">
                                {form.data.slots.map((slot, idx) => (
                                    <li key={slot.key} className="d-flex align-items-start gap-2 mb-2 pb-2 border-bottom">
                                        <span
                                            className={`d-inline-flex align-items-center justify-content-center rounded-circle small flex-shrink-0 ${slot.enabled ? 'bg-primary text-white' : 'bg-secondary-subtle text-muted'}`}
                                            style={{ width: 24, height: 24, fontSize: '0.7rem' }}
                                        >
                                            {idx + 1}
                                        </span>
                                        <div className="flex-grow-1">
                                            <div className="small fw-medium">{slot.label}</div>
                                            {slot.enabled ? (
                                                <div className="small text-muted">
                                                    {formatProjection(previews[idx])}
                                                </div>
                                            ) : (
                                                <div className="small text-muted fst-italic">disabled</div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>

                            <h6 className="fw-semibold mb-2 small">Status check</h6>
                            <ul className="list-unstyled small mb-3">
                                <StatusRow ok={form.data.autosend_enabled} label="Master switch on" />
                                <StatusRow
                                    ok={onsendConfigured}
                                    label="Onsend configured"
                                    fixHref={onsendConfigured ? null : route('settings.onsend')}
                                />
                                <StatusRow
                                    ok={someEnabledAndAssigned}
                                    label="≥1 slot ready"
                                />
                                <StatusRow
                                    ok={templates.length > 0}
                                    label={`Templates available (${templates.length})`}
                                    fixHref={templates.length === 0 ? route('templates.create') : null}
                                />
                            </ul>

                            <div className="alert alert-info small mb-0">
                                <i className="bi bi-info-circle me-1" />
                                Schedule changes apply to <strong>new leads only</strong>.
                                Existing reminders keep their original due times.
                            </div>
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
                <Link href={fixHref} className="small text-decoration-none">fix →</Link>
            )}
        </li>
    );
}
