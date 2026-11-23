import admin from 'firebase-admin';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
        console.error('FIREBASE_SERVICE_ACCOUNT is not configured');
    } else {
        try {
            const serviceAccount = JSON.parse(raw);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } catch (error) {
            console.error('Invalid FIREBASE_SERVICE_ACCOUNT:', error.message);
        }
    }
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
        if (!admin.apps.length) {
            return respond(500, { error: 'Firebase Admin is not configured on the server.' });
        }

        const { action, uid, email, idToken } = JSON.parse(event.body || '{}');
        if (!idToken) return respond(401, { error: 'Missing authentication token.' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const caller = await admin.firestore().doc(`users/${decoded.uid}`).get();
        if (!caller.exists || caller.data().role !== 'admin') {
            return respond(403, { error: 'Administrator privileges required.' });
        }
        if (!uid || typeof uid !== 'string') {
            return respond(400, { error: 'A valid uid is required.' });
        }

        if (action === 'deleteUser') {
            try {
                await admin.auth().deleteUser(uid);
            } catch (error) {
                if (error.code !== 'auth/user-not-found') throw error;
            }
            await admin.firestore().doc(`users/${uid}`).delete();
            return respond(200, { success: true });
        }

        if (action === 'updateEmail') {
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return respond(400, { error: 'A valid email is required.' });
            }
            await admin.auth().updateUser(uid, { email, emailVerified: false });
            await admin.firestore().doc(`users/${uid}`).update({ email });
            return respond(200, { success: true });
        }

        return respond(400, { error: 'Unknown action.' });
    } catch (error) {
        console.error('Admin function error:', error);
        return respond(500, { error: error.message || 'Internal server error' });
    }
};
