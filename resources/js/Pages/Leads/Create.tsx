import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { StatusOption } from '@/types';
import { Link } from '@inertiajs/react';
import LeadForm from './Partials/LeadForm';

export default function Create({ statuses }: { statuses: StatusOption[] }) {
    return (
        <AdminLTELayout
            title="Add Lead"
            pageTitle="Add New Lead"
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('leads.index')} className="text-decoration-none">Leads</Link>
                    {' / '}
                    <span>Add</span>
                </small>
            }
        >
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <LeadForm
                        statuses={statuses}
                        submitLabel="Save Lead"
                        successMessage="Lead created."
                    />
                </div>
            </div>
        </AdminLTELayout>
    );
}
