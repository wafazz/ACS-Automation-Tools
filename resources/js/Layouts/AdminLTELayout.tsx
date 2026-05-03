import { PropsWithChildren, ReactNode, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import Sidebar from '@/Components/AdminLTE/Sidebar';
import Topbar from '@/Components/AdminLTE/Topbar';

interface AdminLTELayoutProps {
    title?: string;
    breadcrumb?: ReactNode;
    pageTitle?: string;
    pageActions?: ReactNode;
}

export default function AdminLTELayout({
    title,
    breadcrumb,
    pageTitle,
    pageActions,
    children,
}: PropsWithChildren<AdminLTELayoutProps>) {
    useEffect(() => {
        document.body.classList.add('layout-fixed', 'sidebar-expand-lg', 'bg-body-tertiary');
        return () => {
            document.body.classList.remove('layout-fixed', 'sidebar-expand-lg', 'bg-body-tertiary');
        };
    }, []);

    return (
        <>
            {title && <Head title={title} />}
            <div className="app-wrapper">
                <Topbar />
                <Sidebar />

                <main className="app-main">
                    {(pageTitle || breadcrumb || pageActions) && (
                        <div className="app-content-header">
                            <div className="container-fluid">
                                <div className="row align-items-center">
                                    <div className="col-sm-6">
                                        {pageTitle && <h3 className="mb-0">{pageTitle}</h3>}
                                        {breadcrumb && <div className="mt-1">{breadcrumb}</div>}
                                    </div>
                                    {pageActions && (
                                        <div className="col-sm-6 text-sm-end mt-3 mt-sm-0">
                                            {pageActions}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="app-content">
                        <div className="container-fluid">
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                {children}
                            </motion.div>
                        </div>
                    </div>
                </main>

                <footer className="app-footer">
                    <div className="float-end d-none d-sm-inline">
                        Built for agents who close.
                    </div>
                    <strong>
                        &copy; {new Date().getFullYear()} <a href="#">ACS</a>.
                    </strong>{' '}
                    All rights reserved.
                </footer>
            </div>
        </>
    );
}
