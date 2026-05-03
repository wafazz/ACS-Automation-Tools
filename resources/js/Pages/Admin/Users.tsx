import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { useConfirm } from '@/Hooks/useConfirm';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    industry: string | null;
    plan: string;
    is_admin: boolean;
    created_at: string;
    trial_ends_at: string | null;
    leads_count: number;
    reminders_count: number;
    templates_count: number;
}

interface PlanOption {
    value: string;
    label: string;
    badge: string;
}

interface PageData {
    users: AdminUser[];
    filters: { q: string; plan: string };
    plans: PlanOption[];
}

export default function Users() {
    const { users, filters, plans } = usePage<PageProps<PageData>>().props;
    const ask = useConfirm();
    const [search, setSearch] = useState(filters.q);
    const [planFilter, setPlanFilter] = useState(filters.plan);

    const applyFilters = () => {
        router.get('/admin/users', { q: search, plan: planFilter }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const planBadge = (planValue: string): string => {
        return plans.find((p) => p.value === planValue)?.badge ?? 'bg-secondary';
    };

    const planLabel = (planValue: string): string => {
        return plans.find((p) => p.value === planValue)?.label ?? planValue;
    };

    const changePlan = (user: AdminUser, plan: string) => {
        if (plan === user.plan) return;
        router.patch(`/admin/users/${user.id}/plan`, { plan }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`${user.name} → ${planLabel(plan)}`),
        });
    };

    const toggleAdmin = async (user: AdminUser) => {
        const action = user.is_admin ? 'remove admin from' : 'promote to admin';
        const ok = await ask({
            title: `${user.is_admin ? 'Remove admin' : 'Make admin'}?`,
            text: `This will ${action} ${user.name}.`,
            icon: 'question',
            tone: user.is_admin ? 'warning' : 'primary',
            confirmText: 'Yes',
        });
        if (!ok) return;
        router.patch(`/admin/users/${user.id}/admin`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Admin status updated.'),
        });
    };

    return (
        <AdminLTELayout title="Admin · Users" pageTitle="Users">
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-12 col-md-6">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name, email, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                className="form-select"
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                            >
                                <option value="">All plans</option>
                                {plans.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-md-2">
                            <button
                                type="button"
                                className="btn btn-primary w-100"
                                onClick={applyFilters}
                            >
                                <i className="bi bi-search me-1" />
                                Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>User</th>
                                    <th>Industry</th>
                                    <th>Plan</th>
                                    <th className="text-end">Leads</th>
                                    <th className="text-end">Templates</th>
                                    <th>Joined</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5 text-muted">
                                            No users match the filters.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="fw-medium d-flex align-items-center gap-2">
                                                    {user.name}
                                                    {user.is_admin && (
                                                        <span className="badge bg-warning text-dark small">
                                                            <i className="bi bi-shield-lock me-1" />
                                                            admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-muted small">{user.email}</div>
                                            </td>
                                            <td className="text-muted small text-capitalize">
                                                {user.industry ?? '—'}
                                            </td>
                                            <td>
                                                <select
                                                    className={`form-select form-select-sm`}
                                                    value={user.plan}
                                                    onChange={(e) => changePlan(user, e.target.value)}
                                                    style={{ maxWidth: 160 }}
                                                >
                                                    {plans.map((p) => (
                                                        <option key={p.value} value={p.value}>{p.label}</option>
                                                    ))}
                                                </select>
                                                <span className={`badge ${planBadge(user.plan)} small mt-1 d-inline-block`}>
                                                    {planLabel(user.plan)}
                                                </span>
                                            </td>
                                            <td className="text-end small">{user.leads_count}</td>
                                            <td className="text-end small">{user.templates_count}</td>
                                            <td className="text-muted small">
                                                {new Date(user.created_at).toLocaleDateString('en-MY', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${user.is_admin ? 'btn-outline-warning' : 'btn-outline-primary'}`}
                                                    onClick={() => toggleAdmin(user)}
                                                    title={user.is_admin ? 'Remove admin' : 'Make admin'}
                                                >
                                                    <i className={`bi ${user.is_admin ? 'bi-shield-minus' : 'bi-shield-plus'}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}
