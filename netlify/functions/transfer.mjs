import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createHash, randomInt } from 'node:crypto';

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

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'Finvex Bank <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'finvexbank@gmail.com';

const respond = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
const hashOtp = (otp, requestId) => createHash('sha256').update(`${otp}:${requestId}`).digest('hex');
const makeOtp = () => String(randomInt(0, 1000000)).padStart(6, '0');
const makeRef = () => `FINVEX/TX-${Date.now().toString(36).toUpperCase()}${randomInt(100, 999)}`;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCodePart = (length) => {
    let out = '';
    for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
    return out;
};
const makeClientCodeValue = () => `${randomCodePart(4)}-${randomCodePart(4)}`;

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const maskEmail = (email) => {
    const value = String(email || '');
    const [name, domain] = value.split('@');
    if (!domain) return value;
    const visible = name.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
};

async function sendEmail({ to, subject, html }) {
    if (!RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY is not configured. Email skipped.');
        return false;
    }
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: RESEND_FROM,
                to: [to],
                subject,
                html
            })
        });
        if (!response.ok) {
            console.error('[Email] Resend error:', response.status, await response.text());
            return false;
        }
        return true;
    } catch (error) {
        console.error('[Email] Send failed:', error.message);
        return false;
    }
}

const emailShell = (title, body) => `
    <div style="font-family:Arial,sans-serif;background:#F1F5F9;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
            <div style="background:#0284C7;color:#fff;padding:24px;font-size:20px;font-weight:bold">FINVEX BANK</div>
            <div style="padding:32px;color:#0F172A">
                <h2 style="margin:0 0 16px;font-size:22px">${escapeHtml(title)}</h2>
                <div style="font-size:15px;line-height:1.6;color:#475569">${body}</div>
            </div>
            <div style="padding:16px 32px;background:#F8FAFC;color:#94A3B8;font-size:12px">
                Finvex Bank — message automatique, ne pas répondre.
            </div>
        </div>
    </div>
`;

async function getCaller(db, idToken) {
    const decoded = await getAuth(app).verifyIdToken(idToken);
    const snap = await db.collection('users').doc(decoded.uid).get();
    if (!snap.exists) throw Object.assign(new Error('Compte introuvable.'), { status: 403 });
    return { uid: decoded.uid, profile: { id: snap.id, ...snap.data() } };
}

async function getRequest(db, uid, requestId) {
    if (!requestId || typeof requestId !== 'string') {
        throw Object.assign(new Error('Requête de virement invalide.'), { status: 400 });
    }
    const ref = db.collection('transferRequests').doc(requestId);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== uid) {
        throw Object.assign(new Error('Requête de virement introuvable.'), { status: 404 });
    }
    return { ref, data: snap.data() };
}

async function selectCode(db, profile) {
    const clientCodes = Array.isArray(profile.transferCodes) ? profile.transferCodes : [];
    const clientCode = clientCodes.find((code) => code.enabled !== false && code.value);
    if (clientCode) return clientCode;

    const snap = await db.collection('transferCodes').where('enabled', '==', true).limit(1).get();
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    return null;
}

async function issueOtp(db, requestRef, requestData, profile) {
    const otp = makeOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await requestRef.update({
        status: 'awaiting_otp',
        otpHash: hashOtp(otp, requestRef.id),
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        updatedAt: FieldValue.serverTimestamp()
    });

    const sent = await sendEmail({
        to: profile.email,
        subject: 'Votre code de confirmation Finvex',
        html: emailShell(
            'Code de confirmation',
            `<p>Bonjour ${escapeHtml(profile.name || 'client')},</p>
             <p>Voici votre code à six chiffres pour finaliser votre virement :</p>
             <div style="margin:24px 0;padding:20px;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0369A1">${otp}</div>
             <p>Ce code expire dans 5 minutes. Ne le communiquez à personne, y compris au personnel Finvex.</p>`
        )
    });

    return { sent, maskedEmail: maskEmail(profile.email) };
}

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return respond(204, {});
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

    try {
        if (!app) return respond(500, { error: 'Firebase Admin is not configured on the server.' });

        const db = getFirestore(app);
        const { action, idToken, ...payload } = JSON.parse(event.body || '{}');
        if (!idToken) return respond(401, { error: 'Missing authentication token.' });

        const { uid, profile } = await getCaller(db, idToken);

        if (action === 'initiate') {
            const transfer = payload.transfer || {};
            const amount = round2(transfer.amount);
            const speed = transfer.speed === 'Immediate' ? 'Immediate' : 'Standard';
            const fee = round2(speed === 'Immediate' ? amount * 0.01 : 0);
            const total = round2(amount + fee);
            if (!(amount > 0)) return respond(400, { error: 'Montant invalide.' });

            const balance = round2(profile.balance || 0);
            if (total > balance) return respond(400, { error: 'Solde insuffisant.' });

            const code = await selectCode(db, profile);
            if (!code) return respond(400, { error: 'Aucun code de confirmation actif n\'est configuré.' });

            const ref = db.collection('transferRequests').doc();
            await ref.set({
                userId: uid,
                status: 'awaiting_code',
                code: {
                    id: code.id || null,
                    label: code.label || 'Code Finvex',
                    message: code.message || 'Saisissez votre code de confirmation.',
                    value: code.value
                },
                transfer: {
                    amount,
                    fee,
                    total,
                    speed,
                    scope: transfer.scope || 'Local',
                    to: transfer.to || '',
                    iban: transfer.iban || '',
                    description: transfer.description || '',
                    method: transfer.method || null
                },
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });

            return respond(200, {
                requestId: ref.id,
                code: { label: code.label || 'Code Finvex', message: code.message || '' },
                amount,
                fee,
                total,
                speed
            });
        }

        if (action === 'verifyCode') {
            const { requestId, codeValue } = payload;
            const { ref, data } = await getRequest(db, uid, requestId);
            if (data.status !== 'awaiting_code') return respond(400, { error: 'Cette étape n\'est plus valable.' });

            const submitted = String(codeValue || '').trim().toUpperCase().replace(/[\s-]+/g, '');
            const expected = String(data.code?.value || '').trim().toUpperCase().replace(/[\s-]+/g, '');
            const attempts = (data.codeAttempts || 0) + 1;
            if (!submitted || submitted !== expected) {
                await ref.update({ codeAttempts: attempts, updatedAt: FieldValue.serverTimestamp() });
                if (attempts >= 5) {
                    await ref.update({ status: 'failed', failedReason: 'too_many_code_attempts' });
                    return respond(429, { error: 'Trop de tentatives. Veuillez recommencer.' });
                }
                return respond(400, { error: 'Code incorrect.' });
            }

            await ref.update({ codeAttempts: attempts, codeVerifiedAt: FieldValue.serverTimestamp() });
            const result = await issueOtp(db, ref, data, profile);
            if (!result.sent) return respond(502, { error: 'Le service e-mail est momentanément indisponible.' });
            return respond(200, { maskedEmail: result.maskedEmail });
        }

        if (action === 'resendOtp') {
            const { requestId } = payload;
            const { ref, data } = await getRequest(db, uid, requestId);
            if (data.status !== 'awaiting_otp') return respond(400, { error: 'Cette étape n\'est plus valable.' });
            const result = await issueOtp(db, ref, data, profile);
            if (!result.sent) return respond(502, { error: 'Le service e-mail est momentanément indisponible.' });
            return respond(200, { maskedEmail: result.maskedEmail });
        }

        if (action === 'finalize') {
            const { requestId, otp } = payload;
            const { ref, data } = await getRequest(db, uid, requestId);
            if (data.status !== 'awaiting_otp') return respond(400, { error: 'Cette étape n\'est plus valable.' });
            if (Date.now() > (data.otpExpiresAt || 0)) {
                await ref.update({ status: 'expired', updatedAt: FieldValue.serverTimestamp() });
                return respond(400, { error: 'Code expiré. Veuillez le demander à nouveau.' });
            }

            const submittedHash = hashOtp(String(otp || '').trim(), requestId);
            if (submittedHash !== data.otpHash) {
                const attempts = (data.otpAttempts || 0) + 1;
                await ref.update({ otpAttempts: attempts, updatedAt: FieldValue.serverTimestamp() });
                if (attempts >= 5) {
                    await ref.update({ status: 'failed', failedReason: 'too_many_otp_attempts' });
                    return respond(429, { error: 'Trop de tentatives. Veuillez recommencer.' });
                }
                return respond(400, { error: 'Code OTP incorrect.' });
            }

            const transfer = data.transfer || {};
            const total = round2(transfer.total || 0);
            const reference = makeRef();
            const txRef = db.collection('transactions').doc();
            const notificationRef = db.collection('notifications').doc();

            await db.runTransaction(async (tx) => {
                const userRef = db.collection('users').doc(uid);
                const snap = await tx.get(userRef);
                const balance = round2(snap.data()?.balance || 0);
                if (total > balance) throw Object.assign(new Error('Solde insuffisant.'), { status: 400 });

                tx.update(userRef, { balance: round2(balance - total) });
                tx.set(txRef, {
                    userId: uid,
                    userName: profile.name || '',
                    amount: -total,
                    baseAmount: round2(transfer.amount || 0),
                    fee: round2(transfer.fee || 0),
                    type: transfer.scope === 'International' ? 'International Wire' : 'Transfer',
                    scope: transfer.scope || 'Local',
                    speed: transfer.speed || 'Standard',
                    description: transfer.description || `Transfer to ${transfer.to || ''}`,
                    to: transfer.to || '',
                    iban: transfer.iban || '',
                    status: transfer.speed === 'Immediate' ? 'Completed' : 'Pending',
                    date: new Date().toLocaleString('fr-FR'),
                    createdAt: FieldValue.serverTimestamp(),
                    ref: reference
                });
                tx.set(notificationRef, {
                    userId: uid,
                    type: 'transfer',
                    title: 'Virement enregistré',
                    body: `Votre virement de ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € vers ${transfer.to || 'votre bénéficiaire'} a été enregistré.`,
                    reference,
                    read: false,
                    createdAt: FieldValue.serverTimestamp()
                });
            });

            await ref.update({
                status: 'completed',
                reference,
                completedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });

            await sendEmail({
                to: profile.email,
                subject: 'Votre virement a été enregistré',
                html: emailShell(
                    'Virement enregistré',
                    `<p>Bonjour ${escapeHtml(profile.name || 'client')},</p>
                     <p>Votre virement de <strong>${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong> vers ${escapeHtml(transfer.to || 'votre bénéficiaire')} a été enregistré.</p>
                     <p>Référence : <strong>${escapeHtml(reference)}</strong></p>`
                )
            });

            return respond(200, { reference, balance: round2((profile.balance || 0) - total) });
        }

        if (action === 'adminCredit') {
            if (profile.role !== 'admin') return respond(403, { error: 'Administrator privileges required.' });
            const targetUid = payload.uid;
            const amount = round2(payload.amount);
            const mode = payload.mode === 'Debit/Subtract' ? 'Debit/Subtract' : 'Fund/Add';
            if (!targetUid || !(amount > 0)) return respond(400, { error: 'Montant ou client invalide.' });

            const targetRef = db.collection('users').doc(targetUid);
            const targetSnap = await targetRef.get();
            if (!targetSnap.exists) return respond(404, { error: 'Client introuvable.' });
            const target = targetSnap.data();
            const delta = mode === 'Fund/Add' ? amount : -amount;
            const newBalance = round2((target.balance || 0) + delta);
            const reference = makeRef();
            const txRef = db.collection('transactions').doc();
            const notificationRef = db.collection('notifications').doc();

            await db.runTransaction(async (tx) => {
                tx.update(targetRef, { balance: newBalance });
                tx.set(txRef, {
                    userId: targetUid,
                    userName: target.name || '',
                    amount: delta,
                    type: mode === 'Fund/Add' ? 'credit' : 'debit',
                    scope: 'Institutional Adjustment',
                    description: payload.description || 'Ajustement de trésorerie',
                    status: 'Completed',
                    date: new Date().toLocaleString('fr-FR'),
                    createdAt: FieldValue.serverTimestamp(),
                    ref: reference
                });
                tx.set(notificationRef, {
                    userId: targetUid,
                    type: mode === 'Fund/Add' ? 'credit' : 'debit',
                    title: mode === 'Fund/Add' ? 'Compte crédité' : 'Compte débité',
                    body: `${mode === 'Fund/Add' ? 'Un crédit de' : 'Un débit de'} ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € a été appliqué à votre compte.`,
                    reference,
                    read: false,
                    createdAt: FieldValue.serverTimestamp()
                });
            });

            if (payload.notify !== 'No' && target.email) {
                await sendEmail({
                    to: target.email,
                    subject: mode === 'Fund/Add' ? 'Votre compte a été crédité' : 'Votre compte a été débité',
                    html: emailShell(
                        mode === 'Fund/Add' ? 'Compte crédité' : 'Compte débité',
                        `<p>Bonjour ${escapeHtml(target.name || 'client')},</p>
                         <p>Un montant de <strong>${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong> a été ${mode === 'Fund/Add' ? 'crédité' : 'débité'} sur votre compte Finvex.</p>
                         <p>Référence : <strong>${escapeHtml(reference)}</strong></p>`
                    )
                });
            }

            return respond(200, { success: true, balance: newBalance, reference });
        }

        if (action === 'sendClientCodeEmail') {
            if (profile.role !== 'admin') return respond(403, { error: 'Administrator privileges required.' });
            const targetUid = payload.uid;
            if (!targetUid || typeof targetUid !== 'string') return respond(400, { error: 'Client invalide.' });

            const targetRef = db.collection('users').doc(targetUid);
            const targetSnap = await targetRef.get();
            if (!targetSnap.exists) return respond(404, { error: 'Client introuvable.' });
            const target = targetSnap.data();
            if (!target.email) return respond(400, { error: 'Ce client n\'a pas d\'adresse e-mail.' });

            const existingCodes = Array.isArray(target.transferCodes) ? target.transferCodes : [];
            let code;

            if (payload.codeId) {
                code = existingCodes.find((item) => item.id === payload.codeId);
                if (!code) return respond(404, { error: 'Code client introuvable.' });
            } else {
                code = {
                    id: `code_${Date.now()}_${randomCodePart(6)}`,
                    label: payload.label || 'Code Finvex',
                    value: makeClientCodeValue(),
                    message: payload.message || 'Voici votre code de confirmation Finvex pour finaliser votre opération.',
                    enabled: true,
                    scope: 'client',
                    createdAt: new Date().toISOString()
                };
                await targetRef.update({ transferCodes: [...existingCodes, code] });
            }

            const sent = await sendEmail({
                to: target.email,
                subject: 'Votre code de confirmation Finvex',
                html: emailShell(
                    'Code de confirmation',
                    `<p>Bonjour ${escapeHtml(target.name || 'client')},</p>
                     <p>${escapeHtml(code.message || 'Voici votre code de confirmation Finvex.')}</p>
                     <div style="margin:24px 0;padding:20px;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;text-align:center;font-size:28px;font-weight:bold;letter-spacing:6px;color:#0369A1">${escapeHtml(code.value)}</div>
                     <p>Si vous n'avez pas demandé ce code, contactez immédiatement votre conseiller Finvex.</p>`
                )
            });

            await db.collection('notifications').doc().set({
                userId: targetUid,
                type: 'code',
                title: 'Code de confirmation envoyé',
                body: `Un code de confirmation (${code.label}) a été envoyé à ${target.email}.`,
                reference: code.value,
                read: false,
                createdAt: FieldValue.serverTimestamp()
            });

            return sent
                ? respond(200, { success: true, code })
                : respond(502, { error: 'E-mail non envoyé. Vérifiez la configuration Resend.' });
        }

        if (action === 'sendTestEmail') {
            if (profile.role !== 'admin') return respond(403, { error: 'Administrator privileges required.' });
            const to = payload.to || ADMIN_EMAIL;
            const sent = await sendEmail({
                to,
                subject: 'Test e-mail Finvex Bank',
                html: emailShell('Test de messagerie', '<p>Si vous recevez ce message, la messagerie transactionnelle Finvex est correctement configurée.</p>')
            });
            return sent
                ? respond(200, { success: true })
                : respond(502, { error: 'E-mail non envoyé. Vérifiez RESEND_API_KEY dans Netlify.' });
        }

        return respond(400, { error: 'Unknown action.' });
    } catch (error) {
        console.error('Transfer function error:', error);
        return respond(error.status || 500, { error: error.message || 'Internal server error' });
    }
};
