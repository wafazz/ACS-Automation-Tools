import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { Lead, StatusOption } from '@/types';
import { Link } from '@inertiajs/react';
import LeadForm from './Partials/LeadForm';

export default function Edit({ lead, statuses }: { lead: Lead; statuses: StatusOption[] }) {
    return (
        <AdminLTELayout
            title={`Edit ${lead.name}`}
            pageTitle="Edit Lead"
            breadcrumb={
                <small className="text-muted">
                    <Link href={route('leads.index')} className="text-decoration-none">Leads</Link>
                    {' / '}
                    <Link href={route('leads.show', lead.id)} className="text-decoration-none">{lead.name}</Link>
                    {' / '}
                    <span>Edit</span>
                </small>
            }
        >
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <LeadForm
                        lead={lead}
                        statuses={statuses}
                        submitLabel="Update Lead"
                        successMessage="Lead updated."
                    />
                </div>
            </div>
        </AdminLTELayout>
    );
}
