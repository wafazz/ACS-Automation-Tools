import { Link, router, usePage } from '@inertiajs/react';
import { useConfirm } from '@/Hooks/useConfirm';
import toast from 'react-hot-toast';
import { PageProps } from '@/types';

export default function Topbar() {
    const { auth } = usePage<PageProps>().props;
    const ask = useConfirm();

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        const ok = await ask({
            title: 'Logout?',
            text: 'You will need to sign in again to access ACS.',
            icon: 'question',
            tone: 'primary',
            confirmText: 'Yes, logout',
        });
        if (!ok) return;

        router.post('/logout', {}, {
            onSuccess: () => toast.success('Logged out successfully'),
        });
    };

    return (
        <nav className="app-header navbar navbar-expand bg-body">
            <div className="container-fluid">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a
                            className="nav-link"
                            data-lte-toggle="sidebar"
                            href="#"
                            role="button"
                            aria-label="Toggle sidebar"
                        >
                            <i className="bi bi-list" style={{ fontSize: '1.4rem' }} />
                        </a>
                    </li>
                </ul>

                <ul className="navbar-nav ms-auto">
                    {/* Notifications placeholder */}
                    <li className="nav-item dropdown">
                        <a
                            className="nav-link"
                            href="#"
                            data-bs-toggle="dropdown"
                            aria-label="Notifications"
                        >
                            <i className="bi bi-bell" style={{ fontSize: '1.2rem' }} />
                            <span className="navbar-badge badge text-bg-warning">0</span>
                        </a>
                        <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                            <span className="dropdown-item dropdown-header">No new notifications</span>
                        </div>
                    </li>

                    {/* User dropdown */}
                    <li className="nav-item dropdown">
                        <a
                            className="nav-link d-flex align-items-center"
                            href="#"
                            data-bs-toggle="dropdown"
                        >
                            <i className="bi bi-person-circle me-1" style={{ fontSize: '1.4rem' }} />
                            <span className="d-none d-md-inline">{auth.user.name}</span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                                <Link href="/profile" className="dropdown-item">
                                    <i className="bi bi-person me-2" />
                                    Profile
                                </Link>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <a
                                    href="#"
                                    className="dropdown-item text-danger"
                                    onClick={handleLogout}
                                >
                                    <i className="bi bi-box-arrow-right me-2" />
                                    Logout
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
