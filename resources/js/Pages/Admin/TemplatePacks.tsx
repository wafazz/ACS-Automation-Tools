import AdminLTELayout from '@/Layouts/AdminLTELayout';
import LoadingButton from '@/Components/UX/LoadingButton';
import { useConfirm } from '@/Hooks/useConfirm';
import { IndustryOption, PageProps } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import toast from 'react-hot-toast';

interface AdminPack {
    id: number;
    slug: string;
    name: string;
    industry: string | null;
    industry_label: string | null;
    price_myr: number;
    description: string | null;
    icon: string | null;
    is_active: boolean;
    item_count: number;
    sales_count: number;
    purchase_count: number;
}

interface PageData {
    packs: AdminPack[];
    industries: IndustryOption[];
}

export default function TemplatePacks() {
    const { packs, industries } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();
    const [editing, setEditing] = useState<AdminPack | null>(null);

    const toggleActive = async (pack: AdminPack) => {
        const ok = await ask({
            title: pack.is_active ? `Hide "${pack.name}" from store?` : `Show "${pack.name}" in store?`,
            text: pack.is_active
                ? 'It will no longer appear in /store. Existing owners are unaffected.'
                : 'It will become visible to all users in /store.',
            icon: 'question',
            tone: pack.is_active ? 'warning' : 'success',
        });
        if (!ok) return;
        router.patch(`/admin/packs/${pack.id}/active`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pack visibility updated.'),
        });
    };

    return (
        <AdminLTELayout title="Admin · Pack Catalog" pageTitle="Template Pack Catalog">
            <div className="alert alert-info mb-3 small d-flex align-items-start gap-2">
                <i className="bi bi-info-circle-fill" />
                <div>
                    Editing pack metadata (name / price / description) here. The actual templates inside
                    each pack are seeded via <code>TemplatePackSeeder</code> — to add or change items,
                    edit the seeder and run <code>php artisan db:seed --class=TemplatePackSeeder</code>.
                </div>
            </div>

            <div className="row g-3">
                {packs.map((pack) => (
                    <div key={pack.id} className="col-12 col-md-6 col-xl-4">
                        <div className={`card h-100 border-0 shadow-sm ${!pack.is_active ? 'opacity-50' : ''}`}>
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div
                                        className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary"
                                        style={{ width: 48, height: 48 }}
                                    >
                                        <i className={`bi ${pack.icon ?? 'bi-box-seam'} fs-4`} />
                                    </div>
                                    {pack.is_active ? (
                                        <span className="badge bg-success-subtle text-success small">
                                            <i className="bi bi-eye me-1" />
                                            visible
                                        </span>
                                    ) : (
                                        <span className="badge bg-secondary-subtle text-secondary small">
                                            <i className="bi bi-eye-slash me-1" />
                                            hidden
                                        </span>
                                    )}
                                </div>

                                <h6 className="fw-semibold mb-1">{pack.name}</h6>
                                {pack.industry_label && (
                                    <span className="badge bg-info-subtle text-info-emphasis mb-2 align-self-start small">
                                        {pack.industry_label}
                                    </span>
                                )}
                                <p className="text-muted small mb-3 flex-grow-1">{pack.description}</p>

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="fs-5 fw-bold">
                                        <span className="text-muted small fw-normal">RM</span> {pack.price_myr.toFixed(2)}
                                    </span>
                                    <small className="text-muted">
                                        {pack.item_count} templates · {pack.sales_count} sales
                                    </small>
                                </div>

                                <div className="d-flex gap-2 mt-auto">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary flex-grow-1"
                                        onClick={() => setEditing(pack)}
                                    >
                                        <i className="bi bi-pencil me-1" />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${pack.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                        onClick={() => toggleActive(pack)}
                                    >
                                        <i className={`bi ${pack.is_active ? 'bi-eye-slash' : 'bi-eye'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editing && <EditModal pack={editing} industries={industries} onClose={() => setEditing(null)} />}
        </AdminLTELayout>
    );
}

function EditModal({ pack, industries, onClose }: { pack: AdminPack; industries: IndustryOption[]; onClose: () => void }) {
    const form = useForm({
        name: pack.name,
        price_cents: Math.round(pack.price_myr * 100),
        description: pack.description ?? '',
        icon: pack.icon ?? '',
        industry: pack.industry ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(`/admin/packs/${pack.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pack updated.');
                onClose();
            },
        });
    };

    return (
        <>
            <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="bi bi-pencil me-2 text-primary" />
                                Edit "{pack.name}"
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
                        </div>
                        <form onSubmit={submit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="edit-name" className="form-label small fw-medium">Name</label>
                                    <input
                                        id="edit-name"
                                        type="text"
                                        className={`form-control ${form.errors.name ? 'is-invalid' : ''}`}
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                    />
                                    {form.errors.name && <div className="invalid-feedback">{form.errors.name}</div>}
                                </div>
                                <div className="row g-3 mb-3">
                                    <div className="col-6">
                                        <label htmlFor="edit-price" className="form-label small fw-medium">Price (cents)</label>
                                        <input
                                            id="edit-price"
                                            type="number"
                                            min={0}
                                            className={`form-control font-monospace ${form.errors.price_cents ? 'is-invalid' : ''}`}
                                            value={form.data.price_cents}
                                            onChange={(e) => form.setData('price_cents', Number(e.target.value))}
                                            required
                                        />
                                        <div className="form-text">
                                            = RM {(form.data.price_cents / 100).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <label htmlFor="edit-industry" className="form-label small fw-medium">Industry</label>
                                        <select
                                            id="edit-industry"
                                            className={`form-select ${form.errors.industry ? 'is-invalid' : ''}`}
                                            value={form.data.industry}
                                            onChange={(e) => form.setData('industry', e.target.value)}
                                        >
                                            <option value="">Generic</option>
                                            {industries.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="edit-icon" className="form-label small fw-medium">Icon (Bootstrap class)</label>
                                    <input
                                        id="edit-icon"
                                        type="text"
                                        className={`form-control font-monospace ${form.errors.icon ? 'is-invalid' : ''}`}
                                        value={form.data.icon}
                                        onChange={(e) => form.setData('icon', e.target.value)}
                                        placeholder="e.g. bi-shield-check"
                                    />
                                    <div className="form-text">
                                        See <a href="https://icons.getbootstrap.com" target="_blank" rel="noopener" className="text-decoration-none">icons.getbootstrap.com</a>
                                    </div>
                                </div>
                                <div className="mb-0">
                                    <label htmlFor="edit-desc" className="form-label small fw-medium">Description</label>
                                    <textarea
                                        id="edit-desc"
                                        rows={3}
                                        className={`form-control ${form.errors.description ? 'is-invalid' : ''}`}
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                    />
                                    {form.errors.description && <div className="invalid-feedback">{form.errors.description}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={onClose}>
                                    Cancel
                                </button>
                                <LoadingButton
                                    type="submit"
                                    loading={form.processing}
                                    className="btn btn-primary"
                                    loadingText="Saving..."
                                >
                                    Save Changes
                                </LoadingButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
