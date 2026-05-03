import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { IndustryOption, Template, TemplateVariable } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import toast from 'react-hot-toast';

interface Props {
    template: Template | null;
    industries: IndustryOption[];
    variables: TemplateVariable[];
}

export default function Editor({ template, industries, variables }: Props) {
    const isEdit = !!template;
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    const { data, setData, post, put, processing, errors } = useForm({
        title: template?.title ?? '',
        body: template?.body ?? '',
        industry: template?.industry ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const onSuccess = () => toast.success(isEdit ? 'Template updated.' : 'Template created.');
        if (isEdit) {
            put(route('templates.update', template!.id), { onSuccess });
        } else {
            post(route('templates.store'), { onSuccess });
        }
    };

    const insertVariable = (token: string) => {
        const textarea = bodyRef.current;
        if (!textarea) {
            setData('body', data.body + token);
            return;
        }
        const start = textarea.selectionStart ?? data.body.length;
        const end = textarea.selectionEnd ?? data.body.length;
        const next = data.body.slice(0, start) + token + data.body.slice(end);
        setData('body', next);
        // Restore caret after insertion
        requestAnimationFrame(() => {
            textarea.focus();
            const pos = start + token.length;
            textarea.setSelectionRange(pos, pos);
        });
    };

    return (
        <AdminLTELayout
            title={isEdit ? `Edit: ${template!.title}` : 'New Template'}
            pageTitle={isEdit ? 'Edit Template' : 'New Template'}
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('templates.index')} className="text-decoration-none">Templates</Link>
                    {' / '}
                    <span>{isEdit ? template!.title : 'New'}</span>
                </small>
            }
        >
            <div className="row g-3">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <form onSubmit={submit}>
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label fw-medium">
                                        Title <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. Day-3 Follow-up"
                                        autoFocus
                                        required
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="industry" className="form-label fw-medium">Industry</label>
                                    <select
                                        id="industry"
                                        className={`form-select ${errors.industry ? 'is-invalid' : ''}`}
                                        value={data.industry}
                                        onChange={(e) => setData('industry', e.target.value)}
                                    >
                                        <option value="">All / Generic</option>
                                        {industries.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.industry && <div className="invalid-feedback">{errors.industry}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="body" className="form-label fw-medium">
                                        Message body <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        id="body"
                                        ref={bodyRef}
                                        rows={10}
                                        className={`form-control font-monospace ${errors.body ? 'is-invalid' : ''}`}
                                        value={data.body}
                                        onChange={(e) => setData('body', e.target.value)}
                                        placeholder="Hi {first_name}, terima kasih..."
                                        required
                                    />
                                    {errors.body && <div className="invalid-feedback">{errors.body}</div>}
                                    <div className="form-text">
                                        Use the variable buttons on the right to insert dynamic placeholders.
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <LoadingButton
                                        type="submit"
                                        loading={processing}
                                        className="btn btn-primary"
                                        loadingText="Saving..."
                                    >
                                        <i className="bi bi-check-lg me-1" />
                                        {isEdit ? 'Update Template' : 'Save Template'}
                                    </LoadingButton>
                                    <Link href={route('templates.index')} className="btn btn-light">
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-semibold mb-3">
                                <i className="bi bi-braces me-2 text-primary" />
                                Variables
                            </h6>
                            <p className="text-muted small mb-3">
                                Click to insert at cursor position. Variables are replaced when sending.
                            </p>
                            <div className="d-flex flex-column gap-2">
                                {variables.map((v) => (
                                    <button
                                        key={v.key}
                                        type="button"
                                        className="btn btn-sm btn-light text-start font-monospace"
                                        onClick={() => insertVariable(v.key)}
                                    >
                                        <span className="text-primary">{v.key}</span>
                                        <span className="text-muted ms-2 small">— {v.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
