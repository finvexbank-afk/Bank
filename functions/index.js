const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

async function assertAdmin(request) {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const snapshot = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!snapshot.exists || snapshot.data().role !== 'admin') {
        throw new HttpsError('permission-denied', 'Administrator privileges required.');
    }
}

exports.deleteUserAccount = onCall(async (request) => {
    await assertAdmin(request);
    const uid = request.data && request.data.uid;
    if (!uid || typeof uid !== 'string') {
        throw new HttpsError('invalid-argument', 'A valid uid is required.');
    }

    try {
        await admin.auth().deleteUser(uid);
    } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
    }
    await admin.firestore().doc(`users/${uid}`).delete();
    return { success: true };
});

exports.updateUserEmail = onCall(async (request) => {
    await assertAdmin(request);
    const { uid, email } = request.data || {};
    if (!uid || typeof uid !== 'string' || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpsError('invalid-argument', 'A valid uid and email are required.');
    }

    await admin.auth().updateUser(uid, { email, emailVerified: false });
    await admin.firestore().doc(`users/${uid}`).update({ email });
    return { success: true };
});
