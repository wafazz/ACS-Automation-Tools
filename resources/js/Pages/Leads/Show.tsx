import AdminLTELayout from '@/Layouts/AdminLTELayout';
import StatusBadge from '@/Components/Leads/StatusBadge';
import { useConfirm } from '@/Hooks/useConfirm';
import { Lead, LeadStatusValue, PageProps, StatusOption, Template } from '@/types';
import { renderTemplate, waLink } from '@/utils/whatsapp';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

interface Props {
    lead: Lead;
    statuses: StatusOption[];
    templates: Template[];
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Show({ lead, statuses, templates }: Props) {
    const { auth } = usePage<PageProps>().props;
    const agent = auth.user!;
    const ask = useConfirm();
    const [busy, setBusy] = useState(false);

    const noteForm = useForm({ note: '' });

    const sendTemplate = (template: Template) => {
        const message = renderTemplate(template.body, lead, agent);
        window.open(waLink(lead.phone, message), '_blank', 'noopener');
    };

    const copyTemplate = async (template: Template) => {
        const message = renderTemplate(template.body, lead, agent);
        try {
            await navigator.clipboard.writeText(message);
            toast.success(`Copied "${template.title}" to clipboard.`);
        } catch {
            // Fallback: SweetAlert with the text in a textarea
            await Swal.fire({
                title: template.title,
                input: 'textarea',
                inputValue: message,
                showCancelButton: false,
                confirmButtonText: 'Done',
                confirmButtonColor: '#0d6efd',
            });
        }
    };

    const handleStatusChange = async (newStatus: LeadStatusValue) => {
        if (newStatus === lead.status) return;
        const newLabel = statuses.find((s) => s.value === newStatus)?.label ?? newStatus;

        const ok = await ask({
            title: `Move to "${newLabel}"?`,
            text: 'This will be logged in the lead\'s status history.',
            icon: 'question',
            tone: 'primary',
            confirmText: 'Yes, update status',
        });
        if (!ok) return;

        const { value: note } = await Swal.fire({
            title: 'Add a quick note (optional)',
            input: 'textarea',
            inputPlaceholder: 'e.g. Called and confirmed interested...',
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Save',
            cancelButtonText: 'Skip',
            reverseButtons: true,
        });

        setBusy(true);
        router.patch(
            route('leads.status', lead.id),
            { status: newStatus, note: note || null },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Moved to "${newLabel}".`),
                onFinish: () => setBusy(false),
            }
        );
    };

    const handleDelete = async () => {
        const ok = await ask({
            title: 'Delete this lead?',
            text: `${lead.name} will be permanently removed.`,
            icon: 'warning',
            tone: 'danger',
            confirmText: 'Yes, delete',
        });
        if (!ok) return;
        router.delete(route('leads.destroy', lead.id), {
            onSuccess: () => toast.success('Lead deleted.'),
        });
    };

    const submitNote: FormEventHandler = (e) => {
        e.preventDefault();
        noteForm.post(route('leads.notes', lead.id), {
            preserveScroll: true,
            onSuccess: () => {
                noteForm.reset('note');
                toast.success('Note added.');
            },
        });
    };

    const waBlankLink = waLink(lead.phone, '');

    return (
        <AdminLTELayout
            title={lead.name}
            pageTitle={lead.name}
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('leads.index')} className="text-decoration-none">Leads</Link>
                    {' / '}
                    <span>{lead.name}</span>
                </small>
            }
            pageActions={
                <div className="d-flex gap-2 flex-wrap">
                    <div className="btn-group">
                        <a
                            href={waBlankLink}
                            target="_blank"
                            rel="noopener"
                            className="btn btn-success"
                            title="Open WhatsApp chat (no message)"
                        >
                            <i className="bi bi-whatsapp me-1" />
                            WhatsApp
                        </a>
                        <button
                            type="button"
                            className="btn btn-success dropdown-toggle dropdown-toggle-split"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <span className="visually-hidden">Send template</span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 280 }}>
                            <li>
                                <h6 className="dropdown-header">
                                    <i className="bi bi-chat-square-text me-1" />
                                    Send a template
                                </h6>
                            </li>
                            {templates.length === 0 ? (
                                <li>
                                    <span className="dropdown-item-text small text-muted">
                                        No templates yet.{' '}
                                        <Link href={route('templates.create')} className="text-decoration-none">
                                            Create one
                                        </Link>
                                    </span>
                                </li>
                            ) : (
                                templates.map((tpl) => (
                                    <li key={tpl.id} className="d-flex align-items-center px-2 gap-1">
                                        <button
                                            type="button"
                                            className="dropdown-item flex-grow-1 small"
                                            onClick={() => sendTemplate(tpl)}
                                        >
                                            <i className="bi bi-whatsapp text-success me-2" />
                                            {tpl.title}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-link text-muted p-1"
                                            onClick={() => copyTemplate(tpl)}
                                            title="Copy to clipboard"
                                        >
                                            <i className="bi bi-clipboard" />
                                        </button>
                                    </li>
                                ))
                            )}
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <Link href={route('templates.index')} className="dropdown-item small text-muted">
                                    <i className="bi bi-gear me-2" />
                                    Manage templates
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="btn-group">
                        <Link href={route('leads.edit', lead.id)} className="btn btn-outline-primary">
                            <i className="bi bi-pencil me-1" />
                            Edit
                        </Link>
                        <button type="button" onClick={handleDelete} className="btn btn-outline-danger">
                            <i className="bi bi-trash" />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="row g-4">
                {/* Left: Lead Info */}
                <div className="col-12 col-lg-8">
                    {/* Status Pipeline */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-semibold mb-0">
                                    <i className="bi bi-funnel me-2 text-primary" />
                                    Status Pipeline
                                </h6>
                                <StatusBadge status={lead.status} statuses={statuses} />
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {statuses.map((s) => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        className={`btn btn-sm ${
                                            s.value === lead.status
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'
                                        }`}
                                        disabled={busy || s.value === lead.status}
                                        onClick={() => handleStatusChange(s.value)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Add Note */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-chat-square-text me-2 text-primary" />
                                Add Note to Timeline
                            </h6>
                            <form onSubmit={submitNote}>
                                <textarea
                                    className={`form-control mb-2 ${noteForm.errors.note ? 'is-invalid' : ''}`}
                                    rows={2}
                                    value={noteForm.data.note}
                                    onChange={(e) => noteForm.setData('note', e.target.value)}
                                    placeholder="What happened in this conversation?"
                                    required
                                />
                                {noteForm.errors.note && (
                                    <div className="invalid-feedback d-block">{noteForm.errors.note}</div>
                                )}
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    disabled={noteForm.processing}
                                >
                                    {noteForm.processing ? 'Saving...' : 'Add Note'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-clock-history me-2 text-primary" />
                                Activity Timeline
                            </h6>
                            {(!lead.status_history || lead.status_history.length === 0) ? (
                                <p className="text-muted small mb-0">No activity yet.</p>
                            ) : (
                                <ul className="list-unstyled mb-0">
                                    {lead.status_history.map((entry) => (
                                        <li key={entry.id} className="border-start border-3 border-primary-subtle ps-3 pb-3 position-relative">
                                            <div className="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-2">
                                                <div>
                                                    {entry.from_status && entry.from_status !== entry.to_status ? (
                                                        <span className="small">
                                                            <StatusBadge status={entry.from_status} statuses={statuses} size="sm" />
                                                            <i className="bi bi-arrow-right mx-2 text-muted" />
                                                            <StatusBadge status={entry.to_status} statuses={statuses} size="sm" />
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-light text-secondary px-2 py-1 small">
                                                            <i className="bi bi-chat-dots me-1" />
                                                            Note
                                                        </span>
                                                    )}
                                                </div>
                                                <small className="text-muted">{formatDateTime(entry.created_at)}</small>
                                            </div>
                                            {entry.note && <p className="small mb-1">{entry.note}</p>}
                                            {entry.changer && (
                                                <small className="text-muted">— {entry.changer.name}</small>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Lead Details */}
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-person me-2 text-primary" />
                                Lead Details
                            </h6>
                            <dl className="row mb-0 small">
                                <dt className="col-5 text-muted fw-normal">Phone</dt>
                                <dd className="col-7 mb-2">{lead.phone}</dd>

                                {lead.email && (<>
                                    <dt className="col-5 text-muted fw-normal">Email</dt>
                                    <dd className="col-7 mb-2 text-break">{lead.email}</dd>
                                </>)}

                                {lead.source && (<>
                                    <dt className="col-5 text-muted fw-normal">Source</dt>
                                    <dd className="col-7 mb-2">{lead.source}</dd>
                                </>)}

                                {lead.amount && (<>
                                    <dt className="col-5 text-muted fw-normal">Est. Value</dt>
                                    <dd className="col-7 mb-2 fw-medium">RM {Number(lead.amount).toFixed(2)}</dd>
                                </>)}

                                <dt className="col-5 text-muted fw-normal">Created</dt>
                                <dd className="col-7 mb-2">{formatDateTime(lead.created_at)}</dd>

                                {lead.last_contacted_at && (<>
                                    <dt className="col-5 text-muted fw-normal">Last Contact</dt>
                                    <dd className="col-7 mb-0">{formatDateTime(lead.last_contacted_at)}</dd>
                                </>)}
                            </dl>

                            {lead.notes && (
                                <>
                                    <hr />
                                    <h6 className="fw-semibold small mb-2">Initial Notes</h6>
                                    <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                        {lead.notes}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
