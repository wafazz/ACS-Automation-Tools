import AdminLTELayout from '@/Layouts/AdminLTELayout';
import EmptyState from '@/Components/UX/EmptyState';
import LoadingButton from '@/Components/UX/LoadingButton';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps, Reminder, ReminderTab, ReminderTypeValue } from '@/types';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import toast from 'react-hot-toast';

interface PageData {
    reminders: Reminder[];
    counts: Record<ReminderTab, number>;
    currentTab: ReminderTab;
}

const TABS: Array<{ key: ReminderTab; label: string; icon: string; tone: string }> = [
    { key: 'today', label: 'Today', icon: 'bi-calendar-day', tone: 'primary' },
    { key: 'upcoming', label: 'Upcoming', icon: 'bi-calendar-week', tone: 'info' },
    { key: 'overdue', label: 'Overdue', icon: 'bi-exclamation-triangle', tone: 'danger' },
    { key: 'completed', label: 'Completed', icon: 'bi-check-circle', tone: 'success' },
];

const TYPE_LABELS: Record<ReminderTypeValue, string> = {
    manual: 'Manual',
    auto_day_1: 'Day 1 follow-up',
    auto_day_3: 'Day 3 follow-up',
    auto_day_7: 'Day 7 follow-up',
};

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-MY', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatPhoneForWa(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('60')) return digits;
    if (digits.startsWith('0')) return '60' + digits.slice(1);
    return digits;
}

export default function Index() {
    const { reminders, counts, currentTab } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();
    const [showAddForm, setShowAddForm] = useState(false);

    const switchTab = (tab: ReminderTab) => {
        router.get(route('reminders.index'), { tab }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const complete = (id: number) => {
        router.patch(route('reminders.complete', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Reminder completed.'),
        });
    };

    const snooze = (id: number) => {
        router.patch(route('reminders.snooze', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Snoozed by 1 day.'),
        });
    };

    const dismiss = async (id: number) => {
        const ok = await ask({
            title: 'Dismiss this reminder?',
            text: 'It will be removed from your active list. You can find it in Completed if needed.',
            icon: 'question',
            tone: 'warning',
            confirmText: 'Yes, dismiss',
        });
        if (!ok) return;
        router.patch(route('reminders.dismiss', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Dismissed.'),
        });
    };

    const remove = async (id: number) => {
        const ok = await ask({
            title: 'Delete this reminder?',
            text: 'This cannot be undone.',
            icon: 'warning',
            tone: 'danger',
            confirmText: 'Yes, delete',
        });
        if (!ok) return;
        router.delete(route('reminders.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Reminder deleted.'),
        });
    };

    return (
        <AdminLTELayout
            title="Reminders"
            pageTitle="Follow-up Reminders"
            pageActions={
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAddForm((v) => !v)}
                >
                    <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`} />
                    {showAddForm ? 'Cancel' : 'Add Reminder'}
                </button>
            }
        >
            {showAddForm && <AddReminderCard onClose={() => setShowAddForm(false)} />}

            {/* Tabs */}
            <ul className="nav nav-pills mb-3 gap-1 flex-wrap">
                {TABS.map((tab) => {
                    const isActive = tab.key === currentTab;
                    return (
                        <li key={tab.key} className="nav-item">
                            <button
                                type="button"
                                className={`nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'text-body'}`}
                                onClick={() => switchTab(tab.key)}
                            >
                                <i className={`bi ${tab.icon}`} />
                                {tab.label}
                                <span className={`badge ${isActive ? 'bg-light text-primary' : `bg-${tab.tone}-subtle text-${tab.tone}`}`}>
                                    {counts[tab.key]}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {reminders.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-5">
                        <EmptyState
                            icon={currentTab === 'completed' ? 'bi-check2-all' : 'bi-bell-slash'}
                            title={
                                currentTab === 'today' ? 'No reminders due today' :
                                currentTab === 'upcoming' ? 'Nothing upcoming' :
                                currentTab === 'overdue' ? 'No overdue reminders' :
                                'Nothing completed yet'
                            }
                            description={
                                currentTab === 'overdue'
                                    ? 'Great — your follow-ups are on track.'
                                    : 'Reminders are auto-created when you add a new lead (Day 1 / 3 / 7).'
                            }
                        />
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {reminders.map((reminder) => (
                        <div key={reminder.id} className="col-12">
                            <ReminderCard
                                reminder={reminder}
                                tab={currentTab}
                                typeLabel={TYPE_LABELS[reminder.type]}
                                onComplete={() => complete(reminder.id)}
                                onSnooze={() => snooze(reminder.id)}
                                onDismiss={() => dismiss(reminder.id)}
                                onDelete={() => remove(reminder.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </AdminLTELayout>
    );
}

function AddReminderCard({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        lead_id: '' as string,
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        note: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('reminders.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Reminder added.');
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
                <h6 className="fw-semibold mb-3">
                    <i className="bi bi-plus-circle me-2 text-primary" />
                    Quick Manual Reminder
                </h6>
                <form onSubmit={submit} className="row g-3">
                    <div className="col-12 col-md-3">
                        <label htmlFor="lead_id" className="form-label small fw-medium">
                            Lead ID (optional)
                        </label>
                        <input
                            id="lead_id"
                            type="number"
                            className={`form-control ${errors.lead_id ? 'is-invalid' : ''}`}
                            value={data.lead_id}
                            onChange={(e) => setData('lead_id', e.target.value)}
                            placeholder="e.g. 12"
                        />
                        {errors.lead_id && <div className="invalid-feedback">{errors.lead_id}</div>}
                    </div>
                    <div className="col-12 col-md-4">
                        <label htmlFor="due_at" className="form-label small fw-medium">
                            Due at <span className="text-danger">*</span>
                        </label>
                        <input
                            id="due_at"
                            type="datetime-local"
                            className={`form-control ${errors.due_at ? 'is-invalid' : ''}`}
                            value={data.due_at}
                            onChange={(e) => setData('due_at', e.target.value)}
                            required
                        />
                        {errors.due_at && <div className="invalid-feedback">{errors.due_at}</div>}
                    </div>
                    <div className="col-12 col-md-5">
                        <label htmlFor="note" className="form-label small fw-medium">
                            Note
                        </label>
                        <input
                            id="note"
                            type="text"
                            className={`form-control ${errors.note ? 'is-invalid' : ''}`}
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                            placeholder="What to remember?"
                        />
                        {errors.note && <div className="invalid-feedback">{errors.note}</div>}
                    </div>
                    <div className="col-12">
                        <LoadingButton
                            type="submit"
                            loading={processing}
                            className="btn btn-primary"
                            loadingText="Adding..."
                        >
                            <i className="bi bi-check-lg me-1" />
                            Add Reminder
                        </LoadingButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface ReminderCardProps {
    reminder: Reminder;
    tab: ReminderTab;
    typeLabel: string;
    onComplete: () => void;
    onSnooze: () => void;
    onDismiss: () => void;
    onDelete: () => void;
}

function ReminderCard({ reminder, tab, typeLabel, onComplete, onSnooze, onDismiss, onDelete }: ReminderCardProps) {
    const isCompleted = !!reminder.completed_at;
    const borderColor =
        tab === 'overdue' ? 'border-danger' :
        tab === 'today' ? 'border-primary' :
        tab === 'upcoming' ? 'border-info' :
        'border-success';

    return (
        <div className={`card border-0 shadow-sm border-start border-4 ${borderColor}`}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <span className="badge bg-secondary-subtle text-secondary px-2 py-1 small">
                                {typeLabel}
                            </span>
                            <span className="text-muted small">
                                <i className="bi bi-clock me-1" />
                                {formatDateTime(reminder.due_at)}
                            </span>
                            {reminder.snooze_count > 0 && (
                                <span className="text-muted small">
                                    <i className="bi bi-arrow-clockwise me-1" />
                                    snoozed ×{reminder.snooze_count}
                                </span>
                            )}
                        </div>
                        {reminder.lead ? (
                            <div className="mb-1">
                                <Link
                                    href={route('leads.show', reminder.lead.id)}
                                    className="fw-medium text-decoration-none"
                                >
                                    {reminder.lead.name}
                                </Link>
                                <span className="text-muted small ms-2">{reminder.lead.phone}</span>
                            </div>
                        ) : (
                            <div className="mb-1 text-muted small fst-italic">General reminder</div>
                        )}
                        {reminder.note && (
                            <p className="small text-muted mb-0">{reminder.note}</p>
                        )}
                    </div>

                    {!isCompleted && (
                        <div className="btn-group btn-group-sm">
                            {reminder.lead && (
                                <a
                                    href={`https://wa.me/${formatPhoneForWa(reminder.lead.phone)}`}
                                    target="_blank"
                                    rel="noopener"
                                    className="btn btn-success"
                                    title="WhatsApp"
                                >
                                    <i className="bi bi-whatsapp" />
                                </a>
                            )}
                            <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={onComplete}
                                title="Mark complete"
                            >
                                <i className="bi bi-check-lg" />
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={onSnooze}
                                title="Snooze 1 day"
                            >
                                <i className="bi bi-clock-history" />
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-warning"
                                onClick={onDismiss}
                                title="Dismiss"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={onDelete}
                                title="Delete"
                            >
                                <i className="bi bi-trash" />
                            </button>
                        </div>
                    )}
                    {isCompleted && (
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-success-subtle text-success px-2 py-1">
                                <i className="bi bi-check-circle me-1" />
                                Completed {formatDateTime(reminder.completed_at!)}
                            </span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={onDelete}
                                title="Delete"
                            >
                                <i className="bi bi-trash" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
