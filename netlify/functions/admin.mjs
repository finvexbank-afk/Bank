import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

let app = null;
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (raw) {
    try {
        app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(raw)) });
    } catch (error) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT:', error.message);
    }
} else {
    console.error('FIREBASE_SERVICE_ACCOUNT is not configured');
}

const respond = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
});

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return respond(204, {});
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

    try {
        if (!app) {
            return respond(500, { error: 'Firebase Admin is not configured on the server.' });
        }
        const auth = getAuth(app);
        const firestore = getFirestore(app);

        const { action, uid, email, idToken } = JSON.parse(event.body || '{}');
        if (!idToken) return respond(401, { error: 'Missing authentication token.' });

        const decoded = await auth.verifyIdToken(idToken);
        const caller = await firestore.doc(`users/${decoded.uid}`).get();
        if (!caller.exists || caller.data().role !== 'admin') {
            return respond(403, { error: 'Administrator privileges required.' });
        }
        if (!uid || typeof uid !== 'string') {
            return respond(400, { error: 'A valid uid is required.' });
        }

        if (action === 'deleteUser') {
            try {
                await auth.deleteUser(uid);
            } catch (error) {
                if (error.code !== 'auth/user-not-found') throw error;
            }
            await firestore.doc(`users/${uid}`).delete();
            return respond(200, { success: true });
        }

        if (action === 'updateEmail') {
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return respond(400, { error: 'A valid email is required.' });
            }
            await auth.updateUser(uid, { email, emailVerified: false });
            await firestore.doc(`users/${uid}`).update({ email });
            return respond(200, { success: true });
        }

        return respond(400, { error: 'Unknown action.' });
    } catch (error) {
        console.error('Admin function error:', error);
        return respond(500, { error: error.message || 'Internal server error' });
    }
};
