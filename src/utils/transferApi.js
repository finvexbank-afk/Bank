import { auth } from '../firebase';

export const callTransferApi = async (action, payload = {}) => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('No authentication token');

    const response = await fetch('/.netlify/functions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, idToken, ...payload })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Transfer request failed');
    return data;
};
