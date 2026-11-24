import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Temporary recovery path for requests created by an older backend that only
// delivered OTP by email. It writes the same hash format the backend verifies,
// plus the plain OTP used by the admin OTP field and the client notification.
export const issueClientOtp = async (requestId, uid, step) => {
    if (!requestId) throw new Error('Requête introuvable.');

    const requestRef = doc(db, 'transferRequests', requestId);
    const snap = await getDoc(requestRef);
    if (!snap.exists()) throw new Error('Requête introuvable.');

    const data = snap.data();
    if (data.userId && uid && data.userId !== uid) throw new Error('Requête introuvable.');

    const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    const otp = String(random).padStart(6, '0');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${otp}:${requestId}`));
    const otpHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');

    const stepIndex = Number.isInteger(step?.index) ? step.index : Math.max(1, Number(data.currentStep || 0) + 1);

    await updateDoc(requestRef, {
        status: 'awaiting_otp',
        otpHash,
        otpValue: otp,
        otpDelivery: 'notification',
        otpExpiresAt: Date.now() + 5 * 60 * 1000,
        otpAttempts: 0,
        otpStepIndex: Math.max(0, stepIndex - 1),
        otpCodeId: step?.id || null,
        otpIssuedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    await setDoc(doc(db, 'notifications', `${requestId}_client_otp_recovery`), {
        userId: data.userId || uid,
        audience: 'client',
        type: 'otp',
        title: 'Votre code OTP',
        body: `Votre code OTP pour ce virement est ${otp}. Il expire dans 5 minutes. Ne le communiquez à personne.`,
        otp,
        delivery: 'notification',
        requestId,
        read: false,
        createdAt: serverTimestamp()
    });

    return otp;
};
