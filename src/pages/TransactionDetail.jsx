import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle,
    Copy, ShieldCheck, Landmark, Zap, CalendarDays, Hash, AlertCircle, Loader2
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { db } from '../firebase';
import {
    doc, getDoc, updateDoc, deleteDoc, collection, addDoc,
    increment, serverTimestamp
} from 'firebase/firestore';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';
import { callTransferApi } from '../utils/transferApi';
import TransferVerificationFlow from '../components/TransferVerificationFlow';
import { notify, ask } from '../components/Toast';

const ACTIVE_REQUEST_STATES = ['awaiting_code', 'awaiting_otp', 'ready_to_finalize'];

const isPendingStatus = (status) => !status || status === 'Pending' || status === 'On-hold' || status === 'Processing';
const isFailedStatus = (status) => status === 'Failed' || status === 'Rejected' || status === 'Cancelled';

const formatMoney = (amount) => '€' + Math.abs(Number(amount) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });

const formatDate = (value) => {
    if (!value) return '—';
    try {
        if (value?.toDate) return value.toDate().toLocaleString('fr-FR');
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString('fr-FR');
    } catch {
        return String(value);
    }
};

const Row = ({ icon, label, value, mono }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '4px 0 0', wordBreak: 'break-word', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
        </div>
    </div>
);

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { user, transactions, refreshPendingTransfer } = useAppContext();

    const [transaction, setTransaction] = useState(() => transactions.find((item) => item.id === id) || null);
    const [loading, setLoading] = useState(!transaction);
    const [error, setError] = useState('');
    const [resumable, setResumable] = useState(null);
    const [resumeOpen, setResumeOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fromContext = transactions.find((item) => item.id === id);
        if (fromContext) {
            setTransaction(fromContext);
            setLoading(false);
        }
    }, [transactions, id]);

    useEffect(() => {
        if (!user || !id) return;
        if (transaction) return;
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDoc(doc(db, 'transactions', id));
                if (cancelled) return;
                if (!snap.exists() || snap.data().userId !== user.id) {
                    setError(t('txDetail.notFound', language));
                } else {
                    setTransaction({ id: snap.id, ...snap.data() });
                }
            } catch (err) {
                if (!cancelled) setError(t('txDetail.notFound', language));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, user, transaction, language]);

    // A pending transfer may still be resumable (verification chain not finished).
    const probePending = useCallback(async () => {
        if (!user) return;
        try {
            const res = await callTransferApi('pending', {});
            const request = res?.request || null;
            if (!request || !ACTIVE_REQUEST_STATES.includes(request.status)) {
                setResumable(null);
                return;
            }
            const matchesThis = request.transfer?.reference === transaction?.ref
                || request.requestId === transaction?.requestId
                || (!transaction?.requestId && isPendingStatus(transaction?.status));
            setResumable(matchesThis ? request : null);
        } catch {
            setResumable(null);
        }
    }, [user, transaction]);

    useEffect(() => { probePending(); }, [probePending]);

    const handleCopy = async (value) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch { /* ignore */ }
    };

    const handleCancel = async () => {
        if (!resumable?.requestId) return;
        setBusy(true);
        try {
            await callTransferApi('cancel', { requestId: resumable.requestId });
            setResumable(null);
            refreshPendingTransfer?.();
        } catch (err) {
            setError(err.message || t('txDetail.cancelError', language));
        } finally {
            setBusy(false);
        }
    };

    const notifyUser = async (title, body) => {
        if (!user?.id) return;
        try {
            await addDoc(collection(db, 'notifications'), {
                userId: user.id,
                title,
                body,
                read: false,
                createdAt: serverTimestamp(),
                reference: transaction?.ref || transaction?.reference || id
            });
        } catch (err) {
            console.error('Notification error:', err);
        }
    };

    const handleCancelTransaction = async () => {
        if (!transaction || !pending || failed || !user?.id) return;
        const confirmedCancel = await ask({
            title: t('txDetail.cancelTransfer', language),
            message: t('txDetail.confirmCancel', language),
            confirmLabel: t('txDetail.cancelTransfer', language),
            tone: 'danger'
        });
        if (!confirmedCancel) return;
        setBusy(true);
        try {
            const txRef = doc(db, 'transactions', id);
            const snap = await getDoc(txRef);
            if (!snap.exists() || !isPendingStatus(snap.data().status)) {
                throw new Error(t('txDetail.statusChanged', language));
            }
            const refund = Math.abs(Number(transaction.amount) || 0);
            await updateDoc(txRef, {
                status: 'Cancelled',
                cancelledAt: serverTimestamp(),
                cancelledBy: user.id
            });
            if (refund > 0) {
                await updateDoc(doc(db, 'users', user.id), { balance: increment(refund) });
            }
            await notifyUser(
                t('txDetail.cancelledTitle', language),
                t('txDetail.cancelledNotice', language, { amount: formatMoney(refund) })
            );
            setTransaction((prev) => prev ? { ...prev, status: 'Cancelled', cancelledAt: new Date().toISOString() } : prev);
            setResumable(null);
            refreshPendingTransfer?.();
            notify.success(
                t('txDetail.cancelledNotice', language, { amount: formatMoney(refund) }),
                t('txDetail.cancelledTitle', language)
            );
        } catch (err) {
            setError(err.message || t('txDetail.cancelError', language));
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteTransaction = async () => {
        if (!transaction || !isFailedStatus(transaction.status)) return;
        const confirmedDelete = await ask({
            title: t('txDetail.delete', language),
            message: t('txDetail.confirmDelete', language),
            confirmLabel: t('txDetail.delete', language),
            tone: 'danger'
        });
        if (!confirmedDelete) return;
        setBusy(true);
        try {
            await deleteDoc(doc(db, 'transactions', id));
            notify.success(t('txDetail.deleted', language));
            navigate('/transactions');
        } catch (err) {
            setError(err.message || t('txDetail.deleteError', language));
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                    {t('txDetail.loading', language)}
                </div>
            </MainLayout>
        );
    }

    if (!transaction) {
        return (
            <MainLayout>
                <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '460px', margin: '0 auto' }}>
                    <AlertCircle size={40} color="#F87171" style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{t('txDetail.notFoundTitle', language)}</h2>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>{error || t('txDetail.notFound', language)}</p>
                    <button onClick={() => navigate('/transactions')} style={{ padding: '12px 24px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                        {t('txDetail.backToHistory', language)}
                    </button>
                </div>
            </MainLayout>
        );
    }

    const amount = Number(transaction.amount) || 0;
    const isDebit = amount < 0;
    const pending = isPendingStatus(transaction.status);
    const failed = isFailedStatus(transaction.status);
    const cancelled = transaction.status === 'Cancelled';
    const reference = transaction.ref || transaction.reference || `BANK/${String(transaction.id || '').slice(0, 8).toUpperCase()}`;

    const statusMeta = cancelled
        ? { bg: '#F1F5F9', color: '#475569', icon: XCircle, label: t('status.cancelled', language) }
        : failed
            ? { bg: '#FEE2E2', color: '#B91C1C', icon: XCircle, label: t('status.failed', language) }
            : pending
                ? { bg: '#FEF3C7', color: '#B45309', icon: Clock, label: t('status.pending', language) }
                : { bg: '#D1FAE5', color: '#047857', icon: CheckCircle2, label: t('status.completed', language) };
    const StatusIcon = statusMeta.icon;

    const steps = [
        { key: 'created', label: t('txDetail.stepCreated', language), done: true },
        { key: 'verified', label: t('txDetail.stepVerified', language), done: !resumable },
        { key: 'settled', label: t('txDetail.stepSettled', language), done: !pending }
    ];

    return (
        <MainLayout>
            <div style={{ maxWidth: '820px', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                <button onClick={() => navigate('/transactions')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748B', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
                    <ArrowLeft size={18} /> {t('txDetail.back', language)}
                </button>

                {/* Hero card */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: isDebit ? '#FEE2E2' : '#DCFCE7', color: isDebit ? '#DC2626' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isDebit ? <ArrowUpRight size={26} /> : <ArrowDownRight size={26} />}
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
                                {isDebit ? '-' : '+'}{formatMoney(amount)}
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>
                                {transaction.to || transaction.description || t('transactions.transactionFallback', language)}
                            </p>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: statusMeta.bg, color: statusMeta.color, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            <StatusIcon size={14} /> {statusMeta.label}
                        </span>
                    </div>

                    {pending && !failed && (
                        <div style={{ marginTop: '20px', padding: '16px', borderRadius: '14px', background: resumable ? '#FFF7ED' : '#F8FAFC', border: `1px solid ${resumable ? '#FED7AA' : '#E2E8F0'}` }}>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: resumable ? '#9A3412' : '#475569', margin: '0 0 4px' }}>
                                {resumable ? t('txDetail.resumeTitle', language) : t('txDetail.pendingTitle', language)}
                            </p>
                            <p style={{ fontSize: '13px', color: resumable ? '#B45309' : '#64748B', margin: 0, lineHeight: 1.5 }}>
                                {resumable ? t('txDetail.resumeDesc', language) : t('txDetail.pendingDescWithCancel', language)}
                            </p>
                        </div>
                    )}
                    {cancelled && (
                        <div style={{ marginTop: '20px', padding: '16px', borderRadius: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: '#475569', margin: '0 0 4px' }}>{t('txDetail.cancelledTitle', language)}</p>
                            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                                {t('txDetail.cancelledNotice', language, { amount: formatMoney(Math.abs(amount)) })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Progress timeline */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '20px clamp(20px, 4vw, 28px)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>
                        {steps.map((step, index) => (
                            <React.Fragment key={step.key}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '92px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step.done ? '#0EA5E9' : '#E2E8F0', color: step.done ? 'white' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                                        {step.done ? <CheckCircle2 size={16} /> : index + 1}
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: step.done ? '#0369A1' : '#94A3B8', textAlign: 'center', lineHeight: 1.3 }}>{step.label}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div style={{ flex: 1, height: '2px', background: steps[index + 1].done ? '#0EA5E9' : '#E2E8F0', marginBottom: '22px', minWidth: '24px' }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Details */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '8px clamp(20px, 4vw, 28px) 20px' }}>
                    <Row icon={<Hash size={16} />} label={t('txDetail.reference', language)} value={reference} mono />
                    <Row icon={<CalendarDays size={16} />} label={t('txDetail.date', language)} value={transaction.date || formatDate(transaction.createdAt)} />
                    <Row icon={<Landmark size={16} />} label={t('txDetail.type', language)} value={transaction.type || t('txDetail.typeTransfer', language)} />
                    {transaction.speed && (
                        <Row icon={<Zap size={16} />} label={t('txDetail.speed', language)} value={t(transaction.speed === 'Immediate' ? 'transactions.speed.immediate' : 'transactions.speed.standard', language)} />
                    )}
                    {transaction.to && (
                        <Row icon={<ArrowUpRight size={16} />} label={t('txDetail.beneficiary', language)} value={transaction.to} />
                    )}
                    {transaction.iban && (
                        <Row icon={<Landmark size={16} />} label="IBAN" value={transaction.iban} mono />
                    )}
                    {transaction.description && (
                        <Row icon={<ShieldCheck size={16} />} label={t('txDetail.description', language)} value={transaction.description} />
                    )}
                    {typeof transaction.fee === 'number' && transaction.fee > 0 && (
                        <Row icon={<Clock size={16} />} label={t('txDetail.fee', language)} value={formatMoney(transaction.fee)} />
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleCopy(reference)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                            <Copy size={15} /> {copied ? t('txDetail.copied', language) : t('txDetail.copyRef', language)}
                        </button>
                        {resumable && (
                            <>
                                <button onClick={() => setResumeOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                                    <ShieldCheck size={15} /> {t('txDetail.resume', language)}
                                </button>
                                <button onClick={handleCancel} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', background: 'white', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: busy ? 'not-allowed' : 'pointer' }}>
                                    {busy ? <Loader2 size={15} className="spin" /> : <XCircle size={15} />} {t('txDetail.cancelRequest', language)}
                                </button>
                            </>
                        )}
                        {pending && !failed && !resumable && (
                            <button onClick={handleCancelTransaction} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: busy ? 'not-allowed' : 'pointer' }}>
                                {busy ? <Loader2 size={15} className="spin" /> : <XCircle size={15} />} {t('txDetail.cancelTransfer', language)}
                            </button>
                        )}
                        {isFailedStatus(transaction.status) && (
                            <button onClick={handleDeleteTransaction} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: busy ? 'not-allowed' : 'pointer' }}>
                                {busy ? <Loader2 size={15} className="spin" /> : <XCircle size={15} />} {t('txDetail.delete', language)}
                            </button>
                        )}
                    </div>
                    {error && <p style={{ color: '#B91C1C', fontSize: '13px', fontWeight: 700, marginTop: '12px' }}>{error}</p>}
                </div>
            </div>

            {resumeOpen && resumable && (
                <TransferVerificationFlow
                    open={resumeOpen}
                    resumeRequestId={resumable.requestId}
                    transfer={resumable.transfer}
                    onClose={() => setResumeOpen(false)}
                    onCompleted={() => {
                        setResumeOpen(false);
                        setResumable(null);
                        refreshPendingTransfer?.();
                    }}
                />
            )}
        </MainLayout>
    );
};

export default TransactionDetail;
