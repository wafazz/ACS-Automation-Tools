import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

// Bootstrap JS bundle (with Popper) - powers dropdowns, modals, tooltips
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const appName = import.meta.env.VITE_APP_NAME || 'ACS';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3500,
                        style: {
                            fontSize: '14px',
                            borderRadius: '8px',
                        },
                        success: {
                            iconTheme: { primary: '#198754', secondary: '#fff' },
                        },
                        error: {
                            iconTheme: { primary: '#dc3545', secondary: '#fff' },
                        },
                    }}
                />
            </>
        );
    },
    progress: {
        color: '#0d6efd',
        showSpinner: true,
    },
});

// Register the service worker (production builds only — avoids HMR conflicts in dev)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('SW registration failed:', err);
        });
    });
}
