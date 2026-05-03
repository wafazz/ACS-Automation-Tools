import { PageProps } from '@/types';
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
    { label: 'Pack Store', icon: 'bi-bag-heart', href: '/store', routeMatch: 'store' },
    { label: 'Affiliate', icon: 'bi-share', href: '/affiliate', routeMatch: 'affiliate' },
    { label: 'Analytics', icon: 'bi-graph-up', href: '/analytics', routeMatch: 'analytics' },
];

const ADMIN_NAV_ITEMS: Array<Omit<SidebarItem, 'badgeKey'>> = [
    { label: 'Stats', icon: 'bi-bar-chart-line', href: '/admin', routeMatch: 'admin' },
    { label: 'Users', icon: 'bi-people-fill', href: '/admin/users', routeMatch: 'admin/users' },
    { label: 'Payments', icon: 'bi-receipt', href: '/admin/payments', routeMatch: 'admin/payments' },
    { label: 'Affiliates', icon: 'bi-cash-coin', href: '/admin/affiliates', routeMatch: 'admin/affiliates' },
    { label: 'Pack Catalog', icon: 'bi-box-seam', href: '/admin/packs', routeMatch: 'admin/packs' },
];

const ADMIN_SETTINGS_ITEMS: Array<Omit<SidebarItem, 'badgeKey'>> = [
    { label: 'Billplz', icon: 'bi-credit-card-2-front', href: '/admin/settings/billplz', routeMatch: 'admin/settings/billplz' },
    { label: 'Brevo (Email)', icon: 'bi-envelope-at', href: '/admin/settings/brevo', routeMatch: 'admin/settings/brevo' },
    { label: 'Onsend (WhatsApp)', icon: 'bi-whatsapp', href: '/admin/settings/onsend', routeMatch: 'admin/settings/onsend' },
];

interface SidebarCounts {
    reminders_open: number;
}

export default function Sidebar() {
    const { url, props } = usePage<PageProps>();
    const counts = (props.sidebarCounts as SidebarCounts | null) ?? null;
    const isAdmin = !!props.auth.user?.is_admin;

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
                        <li className="nav-item">
                            <Link
                                href="/settings/brevo"
                                className={`nav-link ${url.startsWith('/settings/brevo') ? 'active' : ''}`}
                            >
                                <i className="nav-icon bi bi-envelope-at" />
                                <p>Email (Brevo)</p>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                href="/settings/onsend"
                                className={`nav-link ${url.startsWith('/settings/onsend') ? 'active' : ''}`}
                            >
                                <i className="nav-icon bi bi-whatsapp" />
                                <p>WhatsApp (Onsend)</p>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                href="/settings/automation"
                                className={`nav-link ${url.startsWith('/settings/automation') ? 'active' : ''}`}
                            >
                                <i className="nav-icon bi bi-lightning-charge" />
                                <p>Automation</p>
                            </Link>
                        </li>

                        {isAdmin && (
                            <>
                                <li className="nav-header mt-3 text-warning">
                                    <i className="bi bi-shield-lock me-1" />
                                    ADMIN
                                </li>
                                {ADMIN_NAV_ITEMS.map((item) => (
                                    <li key={item.href} className="nav-item">
                                        <Link
                                            href={item.href}
                                            className={`nav-link ${isActive(item.routeMatch) ? 'active' : ''}`}
                                        >
                                            <i className={`nav-icon bi ${item.icon}`} />
                                            <p>{item.label}</p>
                                        </Link>
                                    </li>
                                ))}

                                <li className="nav-header mt-2 text-warning small">
                                    <i className="bi bi-gear me-1" />
                                    INTEGRATIONS
                                </li>
                                {ADMIN_SETTINGS_ITEMS.map((item) => (
                                    <li key={item.href} className="nav-item">
                                        <Link
                                            href={item.href}
                                            className={`nav-link ${isActive(item.routeMatch) ? 'active' : ''}`}
                                        >
                                            <i className={`nav-icon bi ${item.icon}`} />
                                            <p>{item.label}</p>
                                        </Link>
                                    </li>
                                ))}
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
