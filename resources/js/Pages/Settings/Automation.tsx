import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import toast from 'react-hot-toast';

interface SlotData {
    id: string;
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
    maxSlots: number;
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

function newSlot(): SlotData {
    return {
        id: 'tmp_' + Math.random().toString(36).slice(2, 10),
        label: 'New follow-up',
        enabled: true,
        delay_days: 1,
        hour: 9,
        minute: 0,
        template_id: null,
    };
}

export default function Automation() {
    const { automation, slots: initialSlots, templates, onsendConfigured, maxSlots } =
        usePage<PageProps<PageData>>().props;
    const ask = useConfirm();

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

    const addSlot = () => {
        if (form.data.slots.length >= maxSlots) {
            toast.error(`Max ${maxSlots} slots allowed.`);
            return;
        }
        form.setData('slots', [...form.data.slots, newSlot()]);
    };

    const removeSlot = async (idx: number) => {
        const slot = form.data.slots[idx];
        const ok = await ask({
            title: `Remove "${slot.label}"?`,
            text: 'New leads will no longer get this follow-up. Existing reminders are not affected.',
            icon: 'warning',
            tone: 'warning',
            confirmText: 'Yes, remove',
        });
        if (!ok) return;
        form.setData('slots', form.data.slots.filter((_, i) => i !== idx));
    };

    const moveSlot = (idx: number, direction: -1 | 1) => {
        const target = idx + direction;
        if (target < 0 || target >= form.data.slots.length) return;
        const next = [...form.data.slots];
        [next[idx], next[target]] = [next[target], next[idx]];
        form.setData('slots', next);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(route('settings.automation.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Automation saved.'),
        });
    };

    const now = useMemo(() => new Date(), []);
    const previews = form.data.slots.map((s) => projectFireTime(now, s.delay_days, s.hour, s.minute));

    const someActive = form.data.slots.some((s) => s.enabled && s.template_id !== null);
    const willActuallyAutosend = form.data.autosend_enabled && onsendConfigured && someActive;

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
            pageActions={
                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addSlot}
                    disabled={form.data.slots.length >= maxSlots}
                    title={form.data.slots.length >= maxSlots ? `Max ${maxSlots} slots reached` : 'Add follow-up slot'}
                >
                    <i className="bi bi-plus-lg me-1" />
                    Add Slot
                </button>
            }
        >
            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    {willActuallyAutosend ? (
                        <div className="alert alert-success d-flex align-items-start gap-2 mb-3">
                            <i className="bi bi-check-circle-fill" />
                            <div>
                                <strong>Autosend is active.</strong>{' '}
                                Cron runs hourly and sends every enabled slot's template via your Onsend
                                whenever a reminder becomes due.
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
                                    {!someActive && <li>Add at least one enabled slot with a template assigned</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body">
                            <div className="form-check form-switch">
                                <input
                                    id="autosend_enabled"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={form.data.autosend_enabled}
                                    onChange={(e) => form.setData('autosend_enabled', e.target.checked)}
                                />
                                <label htmlFor="autosend_enabled" className="form-check-label fw-medium">
                                    <i className="bi bi-lightning-charge me-2 text-primary" />
                                    Enable autosend (master switch)
                                </label>
                                <div className="form-text">
                                    When off, no reminders are auto-sent regardless of per-slot settings.
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        {form.data.slots.length === 0 && (
                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-body text-center py-5">
                                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: '2.5rem' }} />
                                    <p className="text-muted mt-3 mb-3">No follow-up slots defined yet.</p>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={addSlot}
                                    >
                                        <i className="bi bi-plus-lg me-1" />
                                        Add your first slot
                                    </button>
                                </div>
                            </div>
                        )}

                        {form.data.slots.map((slot, idx) => (
                            <div key={slot.id} className={`card border-0 shadow-sm mb-3 ${slot.enabled ? '' : 'opacity-75'}`}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                                            <span
                                                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white flex-shrink-0"
                                                style={{ width: 28, height: 28, fontSize: '0.85rem' }}
                                            >
                                                {idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm fw-semibold"
                                                value={slot.label}
                                                onChange={(e) => updateSlot(idx, { label: e.target.value })}
                                                placeholder="e.g. Welcome, Day-3 nudge"
                                                maxLength={60}
                                                style={{ maxWidth: 320 }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <div className="form-check form-switch mb-0 me-2">
                                                <input
                                                    id={`enabled-${slot.id}`}
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={slot.enabled}
                                                    onChange={(e) => updateSlot(idx, { enabled: e.target.checked })}
                                                />
                                                <label htmlFor={`enabled-${slot.id}`} className="form-check-label small">
                                                    {slot.enabled ? 'On' : 'Off'}
                                                </label>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => moveSlot(idx, -1)}
                                                disabled={idx === 0}
                                                title="Move up"
                                            >
                                                <i className="bi bi-arrow-up" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => moveSlot(idx, 1)}
                                                disabled={idx === form.data.slots.length - 1}
                                                title="Move down"
                                            >
                                                <i className="bi bi-arrow-down" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeSlot(idx)}
                                                title="Remove"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-12 col-md-3">
                                            <label htmlFor={`days-${slot.id}`} className="form-label small fw-medium">
                                                Send after
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    id={`days-${slot.id}`}
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
                                            <label htmlFor={`time-${slot.id}`} className="form-label small fw-medium">
                                                At time
                                            </label>
                                            <input
                                                id={`time-${slot.id}`}
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
                                            <label htmlFor={`template-${slot.id}`} className="form-label small fw-medium">
                                                Template
                                            </label>
                                            <select
                                                id={`template-${slot.id}`}
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

                        {form.data.slots.length > 0 && (
                            <div className="d-flex gap-2 mb-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={addSlot}
                                    disabled={form.data.slots.length >= maxSlots}
                                >
                                    <i className="bi bi-plus-lg me-1" />
                                    Add another slot
                                </button>
                                <span className="align-self-center text-muted small">
                                    {form.data.slots.length} / {maxSlots} slots
                                </span>
                            </div>
                        )}

                        <LoadingButton
                            type="submit"
                            loading={form.processing}
                            className="btn btn-primary"
                            loadingText="Saving..."
                        >
                            <i className="bi bi-check-lg me-1" />
                            Save Automation
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
                                If you add a lead right now:
                            </p>
                            {form.data.slots.length === 0 ? (
                                <p className="small fst-italic text-muted">No follow-ups would be scheduled.</p>
                            ) : (
                                <ol className="list-unstyled mb-3">
                                    {form.data.slots.map((slot, idx) => (
                                        <li key={slot.id} className="d-flex align-items-start gap-2 mb-2 pb-2 border-bottom">
                                            <span
                                                className={`d-inline-flex align-items-center justify-content-center rounded-circle small flex-shrink-0 ${slot.enabled ? 'bg-primary text-white' : 'bg-secondary-subtle text-muted'}`}
                                                style={{ width: 24, height: 24, fontSize: '0.7rem' }}
                                            >
                                                {idx + 1}
                                            </span>
                                            <div className="flex-grow-1">
                                                <div className="small fw-medium">{slot.label || 'Untitled'}</div>
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
                            )}

                            <h6 className="fw-semibold mb-2 small">Status check</h6>
                            <ul className="list-unstyled small mb-3">
                                <StatusRow ok={form.data.autosend_enabled} label="Master switch on" />
                                <StatusRow
                                    ok={onsendConfigured}
                                    label="Onsend configured"
                                    fixHref={onsendConfigured ? null : route('settings.onsend')}
                                />
                                <StatusRow ok={someActive} label="≥1 slot ready" />
                                <StatusRow
                                    ok={templates.length > 0}
                                    label={`Templates available (${templates.length})`}
                                    fixHref={templates.length === 0 ? route('templates.create') : null}
                                />
                            </ul>

                            <div className="alert alert-info small mb-0">
                                <i className="bi bi-info-circle me-1" />
                                Schedule changes apply to <strong>new leads only</strong>.
                                Existing reminders carry their own template snapshot.
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
