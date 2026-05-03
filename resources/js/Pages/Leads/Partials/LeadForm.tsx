import LoadingButton from '@/Components/UX/LoadingButton';
import { Lead, StatusOption } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import toast from 'react-hot-toast';

const SOURCES = ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Referral', 'Walk-in', 'Cold Call', 'Other'];

interface Props {
    lead?: Lead;
    statuses: StatusOption[];
    submitLabel: string;
    successMessage: string;
}

export default function LeadForm({ lead, statuses, submitLabel, successMessage }: Props) {
    const isEdit = !!lead;

    const { data, setData, post, put, processing, errors } = useForm({
        name: lead?.name ?? '',
        phone: lead?.phone ?? '',
        email: lead?.email ?? '',
        source: lead?.source ?? '',
        status: lead?.status ?? 'new',
        amount: lead?.amount?.toString() ?? '',
        notes: lead?.notes ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const onSuccess = () => toast.success(successMessage);

        if (isEdit) {
            put(route('leads.update', lead!.id), { onSuccess });
        } else {
            post(route('leads.store'), { onSuccess });
        }
    };

    return (
        <form onSubmit={submit}>
            <div className="row g-3">
                <div className="col-12 col-md-6">
                    <label htmlFor="name" className="form-label fw-medium">
                        Name <span className="text-danger">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoFocus
                        required
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-12 col-md-6">
                    <label htmlFor="phone" className="form-label fw-medium">
                        Phone <span className="text-danger">*</span>
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        placeholder="0123456789"
                        required
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="col-12 col-md-6">
                    <label htmlFor="email" className="form-label fw-medium">Email</label>
                    <input
                        id="email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="optional"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="col-12 col-md-6">
                    <label htmlFor="source" className="form-label fw-medium">Source</label>
                    <select
                        id="source"
                        className={`form-select ${errors.source ? 'is-invalid' : ''}`}
                        value={data.source}
                        onChange={(e) => setData('source', e.target.value)}
                    >
                        <option value="">Where did this lead come from?</option>
                        {SOURCES.map((src) => (
                            <option key={src} value={src}>{src}</option>
                        ))}
                    </select>
                    {errors.source && <div className="invalid-feedback">{errors.source}</div>}
                </div>

                <div className="col-12 col-md-6">
                    <label htmlFor="status" className="form-label fw-medium">Status</label>
                    <select
                        id="status"
                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value as Lead['status'])}
                    >
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                </div>

                <div className="col-12 col-md-6">
                    <label htmlFor="amount" className="form-label fw-medium">Estimated Value (RM)</label>
                    <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                        placeholder="0.00"
                    />
                    {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
                </div>

                <div className="col-12">
                    <label htmlFor="notes" className="form-label fw-medium">Notes</label>
                    <textarea
                        id="notes"
                        rows={4}
                        className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder="Initial info, lead intent, anything to remember..."
                    />
                    {errors.notes && <div className="invalid-feedback">{errors.notes}</div>}
                </div>
            </div>

            <div className="mt-4 d-flex gap-2">
                <LoadingButton
                    type="submit"
                    loading={processing}
                    className="btn btn-primary"
                    loadingText="Saving..."
                >
                    <i className="bi bi-check-lg me-1" />
                    {submitLabel}
                </LoadingButton>
                <Link href={route('leads.index')} className="btn btn-light">
                    Cancel
                </Link>
            </div>
        </form>
    );
}
