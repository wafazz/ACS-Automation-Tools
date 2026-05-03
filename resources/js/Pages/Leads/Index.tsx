import AdminLTELayout from '@/Layouts/AdminLTELayout';
import StatusBadge from '@/Components/Leads/StatusBadge';
import EmptyState from '@/Components/UX/EmptyState';
import { useConfirm } from '@/Hooks/useConfirm';
import { Lead, StatusOption } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import toast from 'react-hot-toast';

import { PageProps } from '@/types';

interface PageData {
    leads: Lead[];
    statuses: StatusOption[];
    counts: Record<'all' | 'new' | 'follow_up' | 'interested' | 'closed', number>;
    currentStatus: string;
}

const TABS: Array<{ key: keyof PageData['counts']; label: string; statusValue: string }> = [
    { key: 'all', label: 'All', statusValue: '' },
    { key: 'new', label: 'New', statusValue: 'new' },
    { key: 'follow_up', label: 'Follow-up', statusValue: 'follow_up' },
    { key: 'interested', label: 'Interested', statusValue: 'interested' },
    { key: 'closed', label: 'Closed', statusValue: 'closed' },
];

export default function Index() {
    const { leads, statuses, counts, currentStatus } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();

    const filteredLeads = useMemo(() => {
        const term = '';
        return leads.filter((l) =>
            term === '' ||
            l.name.toLowerCase().includes(term) ||
            l.phone.includes(term) ||
            (l.email ?? '').toLowerCase().includes(term)
        );
    }, [leads]);

    const handleDelete = async (lead: Lead) => {
        const ok = await ask({
            title: 'Delete this lead?',
            text: `${lead.name} will be permanently removed along with all status history. This cannot be undone.`,
            icon: 'warning',
            tone: 'danger',
            confirmText: 'Yes, delete',
        });
        if (!ok) return;

        router.delete(route('leads.destroy', lead.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Lead deleted.'),
        });
    };

    const filterByTab = (statusValue: string) => {
        router.get(
            route('leads.index'),
            statusValue ? { status: statusValue } : {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    return (
        <AdminLTELayout
            title="Leads"
            pageTitle="Leads"
            pageActions={
                <Link href={route('leads.create')} className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1" />
                    Add Lead
                </Link>
            }
        >
            {/* Status Tabs */}
            <ul className="nav nav-pills mb-3 gap-1 flex-wrap">
                {TABS.map((tab) => {
                    const isActive = (tab.statusValue || '') === (currentStatus || '');
                    return (
                        <li key={tab.key} className="nav-item">
                            <button
                                type="button"
                                className={`nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'text-body'}`}
                                onClick={() => filterByTab(tab.statusValue)}
                            >
                                {tab.label}
                                <span className={`badge ${isActive ? 'bg-light text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                                    {counts[tab.key]}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    {filteredLeads.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                icon="bi-people"
                                title={currentStatus ? 'No leads in this bucket' : 'No leads yet'}
                                description={
                                    currentStatus
                                        ? `Switch to a different status tab or add a lead in "${currentStatus.replace('_', ' ')}".`
                                        : 'Add your first lead to start tracking your pipeline.'
                                }
                                action={
                                    <Link href={route('leads.create')} className="btn btn-primary">
                                        <i className="bi bi-plus-lg me-1" />
                                        Add Lead
                                    </Link>
                                }
                            />
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Source</th>
                                        <th>Status</th>
                                        <th className="text-end">Amount</th>
                                        <th>Last Contacted</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead) => (
                                        <tr key={lead.id}>
                                            <td>
                                                <Link
                                                    href={route('leads.show', lead.id)}
                                                    className="fw-medium text-decoration-none"
                                                >
                                                    {lead.name}
                                                </Link>
                                            </td>
                                            <td className="text-muted small">{lead.phone}</td>
                                            <td className="text-muted small">
                                                {lead.source ?? <span className="text-secondary-subtle">—</span>}
                                            </td>
                                            <td>
                                                <StatusBadge status={lead.status} statuses={statuses} size="sm" />
                                            </td>
                                            <td className="text-end text-muted small">
                                                {lead.amount ? `RM ${Number(lead.amount).toFixed(2)}` : '—'}
                                            </td>
                                            <td className="text-muted small">
                                                {lead.last_contacted_at
                                                    ? new Date(lead.last_contacted_at).toLocaleDateString('en-MY', {
                                                          day: '2-digit', month: 'short',
                                                      })
                                                    : '—'}
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <Link
                                                        href={route('leads.show', lead.id)}
                                                        className="btn btn-outline-secondary"
                                                        title="View"
                                                    >
                                                        <i className="bi bi-eye" />
                                                    </Link>
                                                    <Link
                                                        href={route('leads.edit', lead.id)}
                                                        className="btn btn-outline-secondary"
                                                        title="Edit"
                                                    >
                                                        <i className="bi bi-pencil" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handleDelete(lead)}
                                                        title="Delete"
                                                    >
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLTELayout>
    );
}
