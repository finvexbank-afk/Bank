import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, Mail, Loader2, Bell, Ban } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import { callTransferApi } from '../utils/transferApi';
import { useAppContext } from '../AppContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { notify, ask } from './Toast';
import { issueClientOtp } from '../utils/otpFallback';

const RESEND_DELAY = 30;
const PENDING_KEY = 'finvex_pending_transfer';

const savePending = (requestId, transfer, phase) => {
    try {
        localStorage.setItem(PENDING_KEY, JSON.stringify({ requestId, transfer, phase, updatedAt: Date.now() }));
        window.dispatchEvent(new CustomEvent('finvex:pending-change'));
    } catch {
        // Storage can be unavailable in private mode; verification still works.
    }
};

const clearPending = () => {
    try {
        localStorage.removeItem(PENDING_KEY);
        window.dispatchEvent(new CustomEvent('finvex:pending-change'));
    } catch {
        // Ignore storage errors.
    }
};

const TransferVerificationFlow = ({ open, transfer, resumeRequestId, onClose, onCompleted }) => {
    const { language } = useLanguage();
    const { user, refreshPendingTransfer } = useAppContext();
    const [phase, setPhase] = useState('preparing');
    const [requestId, setRequestId] = useState(null);
    const [codeInfo, setCodeInfo] = useState(null);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otpDelivery, setOtpDelivery] = useState(null);
    const [codeValue, setCodeValue] = useState('');
    const [otp, setOtp] = useState('');
    const [reference, setReference] = useState('');
    const [error, setError] = useState('');
    const [seconds, setSeconds] = useState(RESEND_DELAY);
    const startedRef = useRef(false);

    useEffect(() => {
        if (!open) {
            startedRef.current = false;
            return;
        }
        if (startedRef.current) return;
        startedRef.current = true;
        start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (phase !== 'otp' || seconds <= 0) return undefined;
        const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
        return () => clearInterval(timer);
    }, [phase, seconds]);

    const locale = { en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES' }[language] || 'en-US';
    const formatMoney = (value) => Number(value || 0).toLocaleString(locale, { minimumFractionDigits: 2 });
    const speedLabel = (() => {
        const speed = transfer?.speed === 'Immediate' ? 'Immediate' : 'Standard';
        const key = transfer?.scope === 'International'
            ? `intlTransfer.speed.${speed.toLowerCase()}`
            : `transfer.speed.${speed.toLowerCase()}.title`;
        return t(key, language) === key ? speed : t(key, language);
    })();

    const pushNotification = async (id, payload) => {
        if (!id) return;
        try {
            await setDoc(doc(db, 'notifications', id), {
                read: false,
                createdAt: serverTimestamp(),
                ...payload
            }, { merge: true });
        } catch (err) {
            console.error('[Verification] notification error:', err);
        }
    };

    const notifyWaiting = (currentRequestId, kind, step) => {
        if (!currentRequestId) return;
        const clientName = user?.name || user?.email || 'Client';
        const amount = Number(transfer?.amount || 0).toLocaleString(locale, { minimumFractionDigits: 2 });
        const label = step?.label || 'FINVEX';
        pushNotification(`${currentRequestId}_client_${kind}_${step?.index || 0}`, {
            userId: user?.id,
            audience: 'client',
            type: kind,
            title: t(kind === 'otp' ? 'notif.waitingOtp.title' : 'notif.waitingCode.title', language),
            body: t(kind === 'otp' ? 'notif.waitingOtp.body' : 'notif.waitingCode.body', language, { label, amount }),
            requestId: currentRequestId
        });
        pushNotification(`${currentRequestId}_admin_${kind}_${step?.index || 0}`, {
            audience: 'admin',
            type: kind,
            title: t(kind === 'otp' ? 'notif.adminWaitingOtp.title' : 'notif.adminWaitingCode.title', language),
            body: t(kind === 'otp' ? 'notif.adminWaitingOtp.body' : 'notif.adminWaitingCode.body', language, { name: clientName, label, amount }),
            requestId: currentRequestId,
            clientId: user?.id,
            clientName
        });
    };

    const notifyBlocked = (currentRequestId, message) => {
        if (!currentRequestId) return;
        pushNotification(`${currentRequestId}_admin_blocked`, {
            audience: 'admin',
            type: 'blocked',
            title: t('notif.adminBlocked.title', language),
            body: t('notif.adminBlocked.body', language, { name: user?.name || user?.email || 'Client', error: message || '' }),
            requestId: currentRequestId,
            clientId: user?.id
        });
        pushNotification(`${currentRequestId}_client_blocked`, {
            userId: user?.id,
            audience: 'client',
            type: 'blocked',
            title: t('notif.blocked.title', language),
            body: t('notif.blocked.body', language),
            requestId: currentRequestId
        });
    };

    const finish = (result, currentRequestId) => {
        setReference(result.reference);
        setPhase('success');
        clearPending();
        if (currentRequestId) {
            pushNotification(`${currentRequestId}_client_completed`, {
                userId: user?.id,
                audience: 'client',
                type: 'completed',
                title: t('notif.completed.title', language),
                body: t('notif.completed.body', language, { reference: result.reference || '' }),
                requestId: currentRequestId
            });
            pushNotification(`${currentRequestId}_admin_completed`, {
                audience: 'admin',
                type: 'completed',
                title: t('notif.adminCompleted.title', language),
                body: t('notif.adminCompleted.body', language, { name: user?.name || user?.email || 'Client', reference: result.reference || '' }),
                requestId: currentRequestId,
                clientId: user?.id
            });
        }
        if (onCompleted) onCompleted(result, currentRequestId);
    };

    const finalizeDirect = async (currentRequestId) => {
        setPhase('finalizing');
        try {
            const result = await callTransferApi('finalize', { requestId: currentRequestId });
            finish(result, currentRequestId);
        } catch (err) {
            setError(err.message);
            setPhase('error');
            notifyBlocked(currentRequestId, err.message);
        }
    };

    const applyStepResult = (result, currentRequestId, currentTransfer) => {
        if (result.code || result.nextCode) {
            const next = result.code || result.nextCode;
            notifyWaiting(currentRequestId, 'code', next);
            savePending(currentRequestId, currentTransfer, 'code');
            if (result.nextCode) {
                setPhase('advancing');
                setTimeout(() => {
                    setCodeInfo(next);
                    setCodeValue('');
                    setPhase('code');
                }, 1200);
            } else {
                setCodeInfo(next);
                setCodeValue('');
                setPhase('code');
            }
            return;
        }
        if (result.otp || result.maskedEmail) {
            notifyWaiting(currentRequestId, 'otp', {
                label: codeInfo?.label || '',
                index: codeInfo?.index || 0
            });
            setMaskedEmail(result.maskedEmail || '');
            setOtpDelivery(result.otpDelivery || (result.emailSent === true ? 'email' : null));
            setSeconds(RESEND_DELAY);
            savePending(currentRequestId, currentTransfer, 'otp');
            setPhase('otp');
            return;
        }
        if (result.ready) {
            savePending(currentRequestId, currentTransfer, 'finalizing');
            setPhase('advancing');
            setTimeout(() => finalizeDirect(currentRequestId), 1200);
            return;
        }
        if (result.reference) finish(result, currentRequestId);
    };

    const start = async () => {
        setPhase('preparing');
        setError('');
        setRequestId(null);
        setCodeInfo(null);
        setMaskedEmail('');
        setOtpDelivery(null);
        setCodeValue('');
        setOtp('');
        setReference('');
        setSeconds(RESEND_DELAY);
        try {
            const result = resumeRequestId
                ? await callTransferApi('resume', { requestId: resumeRequestId })
                : await callTransferApi('initiate', { transfer });
            const currentRequestId = result.requestId || resumeRequestId;
            setRequestId(currentRequestId);
            applyStepResult(result, currentRequestId, transfer);
        } catch (err) {
            setError(err.message);
            setPhase('error');
            notifyBlocked(null, err.message);
        }
    };

    const submitCode = async () => {
        setError('');
        setPhase('verifying');
        try {
            const result = await callTransferApi('verifyCode', { requestId, codeValue });
            applyStepResult(result, requestId, transfer);
        } catch (err) {
            setError(err.message);
            setPhase('code');
            notifyBlocked(requestId, err.message);
        }
    };

    const resendOtp = async () => {
        if (seconds > 0) return;
        setError('');
        try {
            const result = await callTransferApi('resendOtp', { requestId });
            setMaskedEmail(result.maskedEmail);
            setOtpDelivery(result.otpDelivery || (result.emailSent === true ? 'email' : null));
            setSeconds(RESEND_DELAY);
        } catch (err) {
            setError(err.message);
            notifyBlocked(requestId, err.message);
        }
    };

    const requestNotificationOtp = async () => {
        setError('');
        setPhase('issuing');
        try {
            let result = null;
            try {
                result = await callTransferApi('issueOtpNotification', { requestId });
            } catch {
                // Older deployed backends do not have this action yet.
            }
            if (!result?.otpValue && !result?.otpDelivery) {
                await issueClientOtp(requestId, user?.id, codeInfo);
            }
            setMaskedEmail(result?.maskedEmail || maskedEmail);
            setOtpDelivery('notification');
            setSeconds(RESEND_DELAY);
            setPhase('otp');
            notify.success(
                t('verify.otp.notificationSent', language),
                t('verify.otp.title', language)
            );
        } catch (err) {
            setError(err.message);
            setPhase('otp');
        }
    };

    const cancelCurrentRequest = async () => {
        if (!requestId) {
            clearPending();
            onClose();
            return;
        }
        const confirmed = await ask({
            title: t('verify.cancel.title', language),
            message: t('verify.cancel.message', language),
            confirmLabel: t('verify.cancel.confirm', language),
            tone: 'danger'
        });
        if (!confirmed) return;
        setPhase('cancelling');
        try {
            await callTransferApi('cancel', { requestId });
            clearPending();
            refreshPendingTransfer?.();
            notify.success(t('verify.cancel.success', language), t('verify.cancel.title', language));
            onClose();
        } catch (err) {
            setError(err.message);
            setPhase('otp');
        }
    };

    const submitOtp = async () => {
        setError('');
        setPhase('finalizing');
        try {
            const result = await callTransferApi('finalize', { requestId, otp });
            if (result.code || result.nextCode || result.ready) {
                applyStepResult(result, requestId, transfer);
                return;
            }
            finish(result, requestId);
        } catch (err) {
            setError(err.message);
            setPhase('otp');
            notifyBlocked(requestId, err.message);
        }
    };

    if (!open) return null;

    const busy = ['preparing', 'verifying', 'finalizing', 'advancing', 'issuing', 'cancelling'].includes(phase);

    return (
        <div
            style={overlayStyle}
            onClick={(event) => {
                if (event.target === event.currentTarget && ['error', 'success'].includes(phase)) onClose();
            }}
        >
            <div style={cardStyle}>
                <button
                    onClick={onClose}
                    aria-label={t('common.close', language)}
                    style={{
                        ...closeStyle,
                        background: phase === 'code' ? 'rgba(255,255,255,0.22)' : '#F1F5F9',
                        color: phase === 'code' ? 'white' : '#64748B'
                    }}
                >
                    <X size={20} />
                </button>

                {busy && (
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#E0F2FE', color: '#0284C7', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                            <Loader2 size={34} className="spin" />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>{t('verify.title', language)}</h3>
                        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
                            {t(phase === 'preparing' ? 'verify.preparing' : 'verify.loading', language)}
                        </p>
                    </div>
                )}

                {phase === 'error' && (
                    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                            <AlertTriangle size={34} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>{t('verify.title', language)}</h3>
                        <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.5, marginBottom: '12px' }}>
                            {t('verify.error.desc', language)}
                        </p>
                        <p style={{ color: '#EF4444', fontSize: '13px', fontWeight: 600, marginBottom: '28px', wordBreak: 'break-word' }}>{error}</p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={onClose} style={secondaryButton}>{t('verify.error.close', language)}</button>
                            <button onClick={start} style={primaryButton}>{t('verify.error.retry', language)}</button>
                        </div>
                    </div>
                )}

                {phase === 'code' && (
                    <div>
                        <div style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)', padding: '28px 24px', textAlign: 'center', color: 'white' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 12px' }}>
                                <AlertTriangle size={26} />
                            </div>
                            <h3 style={{ fontSize: '21px', fontWeight: 900, marginBottom: '4px' }}>{t('verify.code.title', language)}</h3>
                            <p style={{ fontSize: '13px', opacity: 0.9 }}>{t('verify.code.subtitle', language)}</p>
                            {codeInfo?.total > 1 && (
                                <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '6px', fontWeight: 700 }}>
                                    {t('verify.code.step', language, { current: codeInfo.index || 1, total: codeInfo.total })}
                                </p>
                            )}
                        </div>
                        <div style={{ padding: '28px 32px 32px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '-56px auto 20px', border: '5px solid white', boxShadow: '0 4px 12px rgba(220,38,38,0.15)' }}>
                                <ShieldCheck size={28} />
                            </div>
                            <p style={{ textAlign: 'center', color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                                {t('verify.code.descGeneric', language)}
                            </p>
                            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 14px', color: '#92400E', fontSize: '12px', fontWeight: 600, lineHeight: 1.5, marginBottom: '24px' }}>
                                {t('verify.code.warning', language)}
                            </div>
                            {error && <div style={errorStyle}>{error}</div>}
                            <label style={labelStyle}>{codeInfo?.label || t('verify.code.label', language)}</label>
                            <input
                                type="text"
                                value={codeValue}
                                onChange={(e) => { setCodeValue(e.target.value); setError(''); }}
                                placeholder={t('verify.code.placeholder', language)}
                                style={inputStyle}
                                autoComplete="off"
                            />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button onClick={onClose} style={secondaryButton}>{t('verify.back', language)}</button>
                                <button onClick={submitCode} disabled={!codeValue.trim()} style={{ ...primaryButton, flex: 2, opacity: codeValue.trim() ? 1 : 0.5 }}>{t('verify.code.confirm', language)}</button>
                            </div>
                            <button onClick={cancelCurrentRequest} style={{ background: 'none', border: 'none', color: '#B91C1C', fontSize: '13px', fontWeight: 700, margin: '18px auto 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Ban size={15} /> {t('verify.cancel.short', language)}
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'otp' && (
                    <div style={{ padding: '40px 32px 32px', textAlign: 'center' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#E0F2FE', color: '#0284C7', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
                            <Mail size={34} />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>{t('verify.otp.title', language)}</h3>
                        <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.5, marginBottom: '10px' }}>
                            {otpDelivery === 'email' && maskedEmail
                                ? t('verify.otp.desc', language, { email: maskedEmail })
                                : t('verify.otp.descUnknown', language)}
                        </p>
                        <p style={{ color: otpDelivery === 'email' ? '#0369A1' : '#92400E', background: otpDelivery === 'email' ? '#F0F9FF' : '#FFFBEB', border: `1px solid ${otpDelivery === 'email' ? '#BAE6FD' : '#FDE68A'}`, borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: 700, lineHeight: 1.5, marginBottom: '24px' }}>
                            {t(
                                otpDelivery === 'email' ? 'verify.otp.delivery.email'
                                    : otpDelivery === 'notification' ? 'verify.otp.delivery.notification'
                                        : 'verify.otp.delivery.unknown',
                                language,
                                { email: maskedEmail }
                            )}
                        </p>
                        {error && <div style={{ ...errorStyle, textAlign: 'left' }}>{error}</div>}
                        <label style={{ ...labelStyle, textAlign: 'left' }}>{t('verify.otp.label', language)}</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                            placeholder={t('verify.otp.placeholder', language)}
                            style={{ ...inputStyle, textAlign: 'center', fontSize: '20px', letterSpacing: '6px', fontWeight: 800 }}
                        />
                        <button onClick={requestNotificationOtp} style={{ ...secondaryButton, width: '100%', marginBottom: '10px', color: '#0369A1', borderColor: '#BAE6FD', background: '#F0F9FF' }}>
                            <Bell size={15} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            {t('verify.otp.sendNotification', language)}
                        </button>
                        <button onClick={resendOtp} disabled={seconds > 0} style={{ background: 'none', border: 'none', color: seconds > 0 ? '#94A3B8' : '#0284C7', fontSize: '13px', fontWeight: 700, margin: '6px 0 20px', cursor: seconds > 0 ? 'default' : 'pointer' }}>
                            {seconds > 0 ? t('verify.otp.resend', language, { seconds }) : t('verify.otp.resendNow', language)}
                        </button>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={onClose} style={secondaryButton}>{t('verify.back', language)}</button>
                            <button onClick={submitOtp} disabled={otp.length !== 6} style={{ ...primaryButton, flex: 2, opacity: otp.length === 6 ? 1 : 0.5 }}>{t('verify.otp.confirm', language)}</button>
                        </div>
                        <button onClick={cancelCurrentRequest} style={{ background: 'none', border: 'none', color: '#B91C1C', fontSize: '13px', fontWeight: 700, margin: '18px auto 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Ban size={15} /> {t('verify.cancel.short', language)}
                        </button>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left', background: '#F8FAFC', borderRadius: '14px', padding: '14px', marginTop: '28px', color: '#64748B', fontSize: '12px', lineHeight: 1.5 }}>
                            <ShieldCheck size={18} style={{ flexShrink: 0, color: '#0284C7' }} />
                            <span>{t('verify.otp.notice', language)}</span>
                        </div>
                    </div>
                )}

                {phase === 'success' && (
                    <div style={{ padding: '48px 32px 32px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#D1FAE5', color: '#10B981', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle2 size={42} />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '12px' }}>{t('verify.success.title', language)}</h3>
                        <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>
                            {t('verify.success.desc', language, { amount: formatMoney(transfer?.amount), recipient: transfer?.to || '' })}
                        </p>
                        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '28px' }}>
                            {t('verify.success.speed', language)} <strong>{speedLabel}</strong>
                        </p>
                        <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #F1F5F9', marginBottom: '28px' }}>
                            <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>{t('verify.success.reference', language)}</p>
                            <p style={{ fontSize: '15px', color: '#334155', fontWeight: 800, fontFamily: 'monospace', margin: 0 }}>{reference}</p>
                        </div>
                        <button onClick={onClose} style={{ ...primaryButton, background: '#10B981', boxShadow: 'none', width: '100%' }}>{t('verify.success.done', language)}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(8px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 3000
};
const cardStyle = {
    background: 'white', width: '100%', maxWidth: '460px', borderRadius: '28px', overflow: 'hidden',
    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)', position: 'relative'
};
const closeStyle = {
    position: 'absolute', top: '18px', right: '18px', background: 'rgba(255,255,255,0.2)', border: 'none',
    color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 2
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '10px', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '16px', borderRadius: '14px', border: '1.5px solid #E2E8F0', outline: 'none', background: '#F8FAFC', fontSize: '15px', fontWeight: 700, color: '#0F172A' };
const primaryButton = { flex: 1, padding: '15px', border: 'none', borderRadius: '14px', background: '#0284C7', color: 'white', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 18px rgba(2,132,199,0.2)' };
const secondaryButton = { flex: 1, padding: '15px', border: '1px solid #E2E8F0', borderRadius: '14px', background: 'white', color: '#64748B', fontWeight: 800, fontSize: '14px', cursor: 'pointer' };
const errorStyle = { padding: '12px 14px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '13px', fontWeight: 600, marginBottom: '20px' };

export default TransferVerificationFlow;
