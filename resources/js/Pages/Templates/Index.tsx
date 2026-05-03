import AdminLTELayout from '@/Layouts/AdminLTELayout';
import EmptyState from '@/Components/UX/EmptyState';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps, Template } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

interface OwnedPack {
    id: number;
    slug: string;
    name: string;
    icon: string | null;
}

interface PageData {
    templates: Template[];
    ownedPacks: OwnedPack[];
}

export default function Index() {
    const { templates, ownedPacks } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return templates;
        return templates.filter(
            (t) => t.title.toLowerCase().includes(term) || t.body.toLowerCase().includes(term)
        );
    }, [templates, search]);

    const remove = async (template: Template) => {
        const ok = await ask({
            title: 'Delete this template?',
            text: `"${template.title}" will be permanently deleted.`,
            icon: 'warning',
            tone: 'danger',
            confirmText: 'Yes, delete',
        });
        if (!ok) return;
        router.delete(route('templates.destroy', template.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Template deleted.'),
        });
    };

    return (
        <AdminLTELayout
            title="Templates"
            pageTitle="WhatsApp Templates"
            pageActions={
                <Link href={route('templates.create')} className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1" />
                    New Template
                </Link>
            }
        >
            {ownedPacks.length > 0 && (
                <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-semibold mb-0">
                                <i className="bi bi-bag-check me-2 text-success" />
                                My Packs ({ownedPacks.length})
                            </h6>
                            <Link href={route('store.index')} className="small text-decoration-none">
                                Browse more →
                            </Link>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            {ownedPacks.map((pack) => (
                                <Link
                                    key={pack.id}
                                    href={route('store.show', pack.slug)}
                                    className="badge bg-light text-body text-decoration-none border px-3 py-2"
                                >
                                    <i className={`bi ${pack.icon ?? 'bi-box-seam'} me-1 text-primary`} />
                                    {pack.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search text-muted" />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search templates by title or body..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-5">
                        <EmptyState
                            icon="bi-chat-square-text"
                            title={search ? 'No matches' : 'No templates yet'}
                            description={
                                search
                                    ? 'Try a different search term.'
                                    : 'Create your first WhatsApp template — use variables like {first_name} to personalize.'
                            }
                            action={
                                !search && (
                                    <Link href={route('templates.create')} className="btn btn-primary">
                                        <i className="bi bi-plus-lg me-1" />
                                        New Template
                                    </Link>
                                )
                            }
                        />
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {filtered.map((template) => (
                        <div key={template.id} className="col-12 col-md-6 col-xl-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                                        <h6 className="fw-semibold mb-0">{template.title}</h6>
                                        {template.is_default && (
                                            <span className="badge bg-info-subtle text-info small flex-shrink-0">
                                                <i className="bi bi-star-fill me-1" />
                                                default
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className="text-muted small mb-3 flex-grow-1"
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 4,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {template.body}
                                    </p>
                                    <div className="d-flex gap-2 mt-auto">
                                        <Link
                                            href={route('templates.edit', template.id)}
                                            className="btn btn-sm btn-outline-primary flex-grow-1"
                                        >
                                            <i className="bi bi-pencil me-1" />
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => remove(template)}
                                            title="Delete"
                                        >
                                            <i className="bi bi-trash" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLTELayout>
    );
}
