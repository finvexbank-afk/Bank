const NETLIFY_SITE = 'https://finevexbank.netlify.app';

/**
 * Resolves the base URL of the serverless API.
 *
 * The same function code ships to both hosts:
 *  - Vercel   -> /api/transfer        (api/transfer.mjs adapter)
 *  - Netlify  -> /.netlify/functions/transfer
 *
 * Each host must call its own backend, otherwise the frontend silently talks to
 * a stale deployment of the other host (this is exactly how the "e-mail service
 * unavailable" error appeared: a fresh Vercel bundle calling an old Netlify
 * function).
 */
export const getFunctionsBase = () => {
    const configured = import.meta.env?.VITE_FUNCTION_BASE;
    if (configured) return String(configured).replace(/\/$/, '');
    if (typeof window === 'undefined') return '/api';

    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    const isNetlify = host === 'finevexbank.netlify.app' || host.endsWith('.netlify.app');

    // Netlify keeps its own functions directory.
    if (isNetlify) return '/.netlify/functions';

    // Locally we run `netlify dev` (port 8888) which serves /.netlify/functions.
    // When using `vercel dev` (port 3000) the /api route is served instead.
    if (isLocal) {
        return window.location.port === '3000' ? '/api' : '/.netlify/functions';
    }

    // Vercel production/preview domains.
    return '/api';
};

export const getFunctionUrl = (name) => `${getFunctionsBase()}/${name}`;

export { NETLIFY_SITE };
