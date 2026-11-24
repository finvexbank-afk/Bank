const NETLIFY_SITE = 'https://finevexbank.netlify.app';

export const getFunctionsBase = () => {
    const configured = import.meta.env?.VITE_FUNCTION_BASE;
    if (configured) return String(configured).replace(/\/$/, '');
    if (typeof window === 'undefined') return '/.netlify/functions';
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    const isNetlify = host === 'finevexbank.netlify.app' || host.endsWith('.netlify.app');
    return isLocal || isNetlify ? '/.netlify/functions' : `${NETLIFY_SITE}/.netlify/functions`;
};

export const getFunctionUrl = (name) => `${getFunctionsBase()}/${name}`;
