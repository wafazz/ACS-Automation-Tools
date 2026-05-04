import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps, StatusOption } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

interface PageData {
    templates: Array<{ id: number; title: string }>;
    sources: string[];
    statuses: StatusOption[];
    totalLeads: number;
    statusCounts: Record<string, number>;
    defaultScheduledAt: string;
}

type TargetKind = 'all' | 'by_status' | 'by_source' | 'specific';

export default function Create() {
    const { templates, sources, statuses, totalLeads, statusCounts, defaultScheduledAt } =
        usePage<PageProps<PageData>>().props;
    const ask = useConfirm();
    const [liveCount, setLiveCount] = useState<number | null>(totalLeads);

    const form = useForm({
        name: '',
        template_id: (templates[0]?.id ?? null) as number | null,
        scheduled_at: defaultScheduledAt,
        target_kind: 'all' as TargetKind,
        target_criteria: {
            status: '' as string,
            source: '' as string,
            ids: [] as number[],
        },
    });

    // Specific-IDs free-text input — parsed on the fly
    const [idsInput, setIdsInput] = useState('');
    useEffect(() => {
        if (form.data.target_kind !== 'specific') return;
        const ids = idsInput
            .split(/[\s,]+/)
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n) && n > 0);
        form.setData('target_criteria', { ...form.data.target_criteria, ids });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idsInput, form.data.target_kind]);

    // Refresh live count whenever filters change (debounced via effect dependency)
    const filterDeps = useMemo(
        () => JSON.stringify({ kind: form.data.target_kind, criteria: form.data.target_criteria }),
        [form.data.target_kind, form.data.target_criteria]
    );
    useEffect(() => {
        let cancelled = false;
        setLiveCount(null);
        axios.post(route('campaigns.target-count'), {
            target_kind: form.data.target_kind,
            target_criteria: form.data.target_criteria,
        })
            .then(({ data }) => { if (!cancelled) setLiveCount(data.count); })
            .catch(() => { if (!cancelled) setLiveCount(0); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterDeps]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        if (liveCount === 0) {
            toast.error('No leads match the selected target.');
            return;
        }
        const ok = await ask({
            title: `Schedule campaign for ${liveCount} lead(s)?`,
            text: `Reminders will be created now and sent at ${new Date(form.data.scheduled_at).toLocaleString('en-MY')}.`,
            icon: 'info',
            tone: 'success',
            confirmText: 'Yes, schedule it',
        });
        if (!ok) return;
        form.post(route('campaigns.store'));
    };

    return (
        <AdminLTELayout
            title="New Campaign"
            pageTitle="New Campaign"
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('campaigns.index')} className="text-decoration-none">Campaigns</Link>
                    {' / '}<span>New</span>
                </small>
            }
        >
            <form onSubmit={submit}>
                <div className="row g-3">
                    <div className="col-12 col-lg-8">
                        <div className="card border-0 shadow-sm mb-3">
                            <div className="card-body">
                                <h6 className="fw-semibold mb-3">
                                    <i className="bi bi-megaphone me-2 text-primary" />
                                    Basics
                                </h6>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label htmlFor="name" className="form-label small fw-medium">
                                            Campaign name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            className={`form-control ${form.errors.name ? 'is-invalid' : ''}`}
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            placeholder="e.g. May Promo Blast"
                                            required
                                            autoFocus
                                        />
                                        {form.errors.name && <div className="invalid-feedback">{form.errors.name}</div>}
                                    </div>
                                    <div className="col-12 col-md-7">
                                        <label htmlFor="template_id" className="form-label small fw-medium">
                                            Template <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            id="template_id"
                                            className={`form-select ${form.errors.template_id ? 'is-invalid' : ''}`}
                                            value={form.data.template_id ?? ''}
                                            onChange={(e) => form.setData('template_id', e.target.value === '' ? null : Number(e.target.value))}
                                            required
                                        >
                                            <option value="">— Pick a template —</option>
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))}
                                        </select>
                                        {form.errors.template_id && <div className="invalid-feedback">{form.errors.template_id}</div>}
                                    </div>
                                    <div className="col-12 col-md-5">
                                        <label htmlFor="scheduled_at" className="form-label small fw-medium">
                                            Send at <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="scheduled_at"
                                            type="datetime-local"
                                            className={`form-control ${form.errors.scheduled_at ? 'is-invalid' : ''}`}
                                            value={form.data.scheduled_at}
                                            onChange={(e) => form.setData('scheduled_at', e.target.value)}
                                            required
                                        />
                                        <div className="form-text small">Cron runs hourly — sends within ~60min of this time.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm mb-3">
                            <div className="card-body">
                                <h6 className="fw-semibold mb-3">
                                    <i className="bi bi-funnel me-2 text-primary" />
                                    Target Leads
                                </h6>

                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {(['all', 'by_status', 'by_source', 'specific'] as TargetKind[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            className={`btn btn-sm ${form.data.target_kind === k ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => form.setData('target_kind', k)}
                                        >
                                            {k === 'all' && <><i className="bi bi-people me-1" />All leads</>}
                                            {k === 'by_status' && <><i className="bi bi-tag me-1" />By status</>}
                                            {k === 'by_source' && <><i className="bi bi-share me-1" />By source</>}
                                            {k === 'specific' && <><i className="bi bi-list-check me-1" />Specific IDs</>}
                                        </button>
                                    ))}
                                </div>

                                {form.data.target_kind === 'by_status' && (
                                    <div>
                                        <label htmlFor="filter_status" className="form-label small fw-medium">Status</label>
                                        <select
                                            id="filter_status"
                                            className="form-select"
                                            value={form.data.target_criteria.status}
                                            onChange={(e) => form.setData('target_criteria', { ...form.data.target_criteria, status: e.target.value })}
                                        >
                                            <option value="">— Select status —</option>
                                            {statuses.map((s) => (
                                                <option key={s.value} value={s.value}>{s.label} ({statusCounts[s.value] ?? 0})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {form.data.target_kind === 'by_source' && (
                                    <div>
                                        <label htmlFor="filter_source" className="form-label small fw-medium">Source</label>
                                        {sources.length === 0 ? (
                                            <p className="text-muted small mb-0">
                                                No sources tracked yet. Add a source when creating leads.
                                            </p>
                                        ) : (
                                            <select
                                                id="filter_source"
                                                className="form-select"
                                                value={form.data.target_criteria.source}
                                                onChange={(e) => form.setData('target_criteria', { ...form.data.target_criteria, source: e.target.value })}
                                            >
                                                <option value="">— Select source —</option>
                                                {sources.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {form.data.target_kind === 'specific' && (
                                    <div>
                                        <label htmlFor="filter_ids" className="form-label small fw-medium">
                                            Lead IDs (comma or space separated)
                                        </label>
                                        <textarea
                                            id="filter_ids"
                                            rows={3}
                                            className="form-control font-monospace"
                                            value={idsInput}
                                            onChange={(e) => setIdsInput(e.target.value)}
                                            placeholder="e.g. 12, 15, 27, 42"
                                        />
                                        <div className="form-text small">
                                            {form.data.target_criteria.ids.length} valid ID(s) parsed.
                                            Hint: lead IDs are visible in the URL when you open a lead.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <LoadingButton
                            type="submit"
                            loading={form.processing}
                            className="btn btn-primary"
                            loadingText="Scheduling..."
                            disabled={liveCount === 0}
                        >
                            <i className="bi bi-calendar-plus me-1" />
                            Schedule Campaign
                        </LoadingButton>
                    </div>

                    <div className="col-12 col-lg-4">
                        <div className="card border-0 shadow-sm sticky-top" style={{ top: 80 }}>
                            <div className="card-body">
                                <h6 className="fw-semibold mb-3">
                                    <i className="bi bi-eye me-2 text-primary" />
                                    Live Preview
                                </h6>
                                <div className="text-center py-3">
                                    {liveCount === null ? (
                                        <div className="text-muted small">
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Counting...
                                        </div>
                                    ) : (
                                        <>
                                            <div className="display-4 fw-bold text-primary">{liveCount}</div>
                                            <div className="text-muted small">
                                                lead{liveCount === 1 ? '' : 's'} will be targeted
                                            </div>
                                        </>
                                    )}
                                </div>
                                <hr />
                                <ul className="list-unstyled small mb-0">
                                    <li className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted">Total leads</span>
                                        <span className="fw-medium">{totalLeads}</span>
                                    </li>
                                    <li className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted">Onsend handles delivery</span>
                                        <Link href={route('settings.onsend')} className="text-decoration-none small">
                                            check setup →
                                        </Link>
                                    </li>
                                </ul>
                                {liveCount === 0 && (
                                    <div className="alert alert-warning small mt-3 mb-0">
                                        <i className="bi bi-exclamation-triangle me-1" />
                                        Zero leads match — adjust filters above.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLTELayout>
    );
}
