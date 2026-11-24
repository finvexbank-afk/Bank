/**
 * Resolves the base URL of the serverless API.
 *
 * Rule: the frontend always talks to the backend of the host that served it.
 * There is deliberately NO cross-host fallback — a fresh Vercel bundle calling
 * the Netlify function is exactly how the "e-mail service unavailable" error
 * appeared: a new client hitting a stale deployment of the other host.
 *
 *  - Vercel          -> /api/transfer        (api/transfer.mjs adapter)
 *  - Netlify         -> /.netlify/functions/transfer
 *  - localhost:3000  -> /api                 (vercel dev)
 *  - localhost:8888  -> /.netlify/functions  (netlify dev)
 */
export const getFunctionsBase = () => {
    const configured = import.meta.env?.VITE_FUNCTION_BASE;
    if (configured) return String(configured).replace(/\/$/, '');
    if (typeof window === 'undefined') return '/api';

    const host = window.location.hostname;
    if (host.endsWith('.netlify.app')) return '/.netlify/functions';
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
        return window.location.port === '8888' ? '/.netlify/functions' : '/api';
    }

    return '/api';
};

export const getFunctionUrl = (name) => `${getFunctionsBase()}/${name}`;
