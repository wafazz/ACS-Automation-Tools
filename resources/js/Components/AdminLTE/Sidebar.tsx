import { Link, usePage } from '@inertiajs/react';

interface SidebarItem {
    label: string;
    icon: string;
    href: string;
    routeMatch: string;
    badgeKey?: 'reminders_open';
}

const NAV_ITEMS: SidebarItem[] = [
    { label: 'Dashboard', icon: 'bi-speedometer2', href: '/dashboard', routeMatch: 'dashboard' },
    { label: 'Leads', icon: 'bi-people', href: '/leads', routeMatch: 'leads' },
    { label: 'Reminders', icon: 'bi-bell', href: '/reminders', routeMatch: 'reminders', badgeKey: 'reminders_open' },
    { label: 'Templates', icon: 'bi-chat-square-text', href: '/templates', routeMatch: 'templates' },
    { label: 'Analytics', icon: 'bi-graph-up', href: '/analytics', routeMatch: 'analytics' },
];

interface SidebarCounts {
    reminders_open: number;
}

export default function Sidebar() {
    const { url, props } = usePage();
    const counts = (props.sidebarCounts as SidebarCounts | null) ?? null;

    const isActive = (match: string) => url.startsWith('/' + match);
    const getBadge = (item: SidebarItem): number => {
        if (!item.badgeKey || !counts) return 0;
        return counts[item.badgeKey] ?? 0;
    };

    return (
        <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
            <div className="sidebar-brand">
                <Link href="/dashboard" className="brand-link d-flex align-items-center">
                    <i className="bi bi-bullseye text-primary fs-4 me-2" />
                    <span className="brand-text fw-bold">ACS</span>
                </Link>
            </div>

            <div className="sidebar-wrapper">
                <nav className="mt-2">
                    <ul
                        className="nav sidebar-menu flex-column"
                        data-lte-toggle="treeview"
                        role="menu"
                    >
                        {NAV_ITEMS.map((item) => {
                            const badge = getBadge(item);
                            return (
                                <li key={item.href} className="nav-item">
                                    <Link
                                        href={item.href}
                                        className={`nav-link ${isActive(item.routeMatch) ? 'active' : ''}`}
                                    >
                                        <i className={`nav-icon bi ${item.icon}`} />
                                        <p>
                                            {item.label}
                                            {badge > 0 && (
                                                <span className="badge text-bg-warning ms-2">{badge}</span>
                                            )}
                                        </p>
                                    </Link>
                                </li>
                            );
                        })}

                        <li className="nav-header mt-3">ACCOUNT</li>
                        <li className="nav-item">
                            <Link
                                href="/profile"
                                className={`nav-link ${isActive('profile') ? 'active' : ''}`}
                            >
                                <i className="nav-icon bi bi-person-circle" />
                                <p>Profile</p>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
