import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle, ShieldAlert, User, Globe, ChevronRight } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';

const TransferModal = ({ isOpen, onClose }) => {
    const { user } = useAppContext();
    const { language } = useLanguage();
    const [step, setStep] = useState(-1); // -1: Selection, 0: Details, 1: Speed, 2: Code1, 3: Code2, 4: Code3, 5: Success
    const [transferType, setTransferType] = useState('Local'); // 'Local' or 'International'
    const [transferSpeed, setTransferSpeed] = useState('Standard'); // 'Standard' or 'Immediate'
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [reference, setReference] = useState('');

    // Codes state
    const [imfCode, setImfCode] = useState('');
    const [swiftCode, setSwiftCode] = useState('');
    const [finalCode, setFinalCode] = useState('');

    // Fake expected codes
    const EXPECTED_IMF = '1234';
    const EXPECTED_SWIFT = '5678';
    const EXPECTED_FINAL = '9999';

    const [error, setError] = useState('');

    if (!isOpen) return null;

    const locale = { en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES' }[language] || 'en-US';
    const formatAmount = (value) => Number(value || 0).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const numericAmount = Number(amount);
    const fee = transferSpeed === 'Immediate' ? numericAmount * 0.01 : 0;
    const total = numericAmount + fee;
    const balance = Number(user?.balance || 0);

    const handleSelectType = (type) => {
        setTransferType(type);
        setStep(0);
    };

    const handleNext = async () => {
        setError('');
        if (step === 0) {
            if (!amount || !recipient) return setError(t('transfer.errors.fillAll', language));
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError(t('transfer.errors.invalidAmount', language));
            if (total > balance) return setError(t('transfer.errors.insufficient', language));
            setStep(1);
        } else if (step === 1) {
            // The user can change the speed after entering the amount: re-check with the fee.
            if (total > balance) return setError(t('transfer.errors.insufficient', language));
            if (transferType === 'Local') {
                await executeTransfer('Local');
            } else {
                setStep(2);
            }
        } else if (step === 2) {
            if (imfCode !== EXPECTED_IMF) return setError(t('transfer.errors.imf', language));
            setStep(3);
        } else if (step === 3) {
            if (swiftCode !== EXPECTED_SWIFT) return setError(t('transfer.errors.swift', language));
            setStep(4);
        } else if (step === 4) {
            if (finalCode !== EXPECTED_FINAL) return setError(t('transfer.errors.final', language));
            await executeTransfer('International');
        } else if (step === 5) {
            resetAndClose();
        }
    };

    const executeTransfer = async (type) => {
        if (total > balance) {
            setError(t('transfer.errors.insufficient', language));
            return;
        }

        const newBalance = balance - total;
        const now = new Date();
        const dateStr = now.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
        const txRef = `FINVEX/TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        try {
            const { db } = await import('../firebase');
            const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import('firebase/firestore');

            await updateDoc(doc(db, 'users', user.id), { balance: newBalance });
            await addDoc(collection(db, 'transactions'), {
                userId: user.id,
                userName: user.name,
                amount: -total,
                baseAmount: numericAmount,
                fee: fee,
                type: 'Debit',
                scope: type,
                speed: transferSpeed,
                description: `Transfer to ${recipient}`,
                to: recipient,
                // Immediate settles at once; standard stays pending until processed.
                status: transferSpeed === 'Immediate' ? 'Completed' : 'Pending',
                date: `${dateStr} ${timeStr}`,
                createdAt: serverTimestamp(),
                ref: txRef
            });

            setReference(txRef);
            setStep(5);
        } catch (err) {
            setError(t('transfer.errors.failed', language));
        }
    };

    const resetAndClose = () => {
        onClose();
        setTimeout(() => {
            setStep(-1);
            setAmount('');
            setRecipient('');
            setImfCode('');
            setSwiftCode('');
            setFinalCode('');
            setReference('');
            setTransferSpeed('Standard');
            setError('');
        }, 500);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '440px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>

                {/* Close Button Top Right */}
                <button onClick={resetAndClose} aria-label={t('transfer.close', language)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', zIndex: 10 }}><X size={20} /></button>

                <div style={{ padding: '40px 32px' }}>

                    {step === -1 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', background: '#0EA5E9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', color: 'white', boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>
                                <Send size={32} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{t('transfer.title', language)}</h2>
                            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px', fontWeight: 500 }}>{t('transfer.subtitle', language)}</p>

                            <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                                {/* Local Transfer Option */}
                                <div onClick={() => handleSelectType('Local')} style={optionCardStyle}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F0F9FF', color: '#0EA5E9', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}><User size={24} /></div>
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>{t('transfer.local.title', language)}</h4>
                                        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 2px 0', lineHeight: 1.2 }}>{t('transfer.local.desc', language)}</p>
                                        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: 0 }}>{t('transfer.local.fees', language)}</p>
                                    </div>
                                    <ChevronRight size={20} color="#CBD5E1" />
                                </div>

                                {/* International Transfer Option */}
                                <div onClick={() => handleSelectType('International')} style={optionCardStyle}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F0F9FF', color: '#0EA5E9', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}><Globe size={24} /></div>
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>{t('transfer.international.title', language)}</h4>
                                        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 2px 0', lineHeight: 1.2 }}>{t('transfer.international.desc', language)}</p>
                                        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: 0 }}>{t('transfer.international.requirement', language)}</p>
                                    </div>
                                    <ChevronRight size={20} color="#CBD5E1" />
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <button onClick={resetAndClose} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#1E293B', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>{t('transfer.close', language)}</button>
                            </div>
                        </div>
                    )}

                    {step >= 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#F0F9FF', color: '#0EA5E9', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {transferType === 'Local' ? <User size={20} /> : <Globe size={20} />}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                                        {t('transfer.heading', language, { type: t(`transfer.type.${transferType.toLowerCase()}`, language) })}
                                    </h3>
                                    {step < 5 && (
                                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                                            {t('transfer.step', language, { step: step + 1, total: transferType === 'Local' ? 2 : 5 })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div style={{ padding: '14px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', border: '1px solid #FEE2E2' }}>
                                    <AlertTriangle size={18} /> {error}
                                </div>
                            )}

                            {step === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <label style={labelStyle}>{t('transfer.recipient.label', language)}</label>
                                        <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={t('transfer.recipient.placeholder', language)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>{t('transfer.amount.label', language)}</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94A3B8' }}>€</span>
                                            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: '32px' }} />
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', fontWeight: 500 }}>
                                            {t('transfer.available', language)} <span style={{ color: '#0EA5E9', fontWeight: 700 }}>€{formatAmount(balance)}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>{t('transfer.speed.title', language)}</h4>
                                    <p style={{ fontSize: '14px', color: '#64748B', marginTop: 0, marginBottom: '16px' }}>{t('transfer.speed.desc', language)}</p>

                                    <div
                                        onClick={() => setTransferSpeed('Immediate')}
                                        style={{ ...optionCardStyle, border: transferSpeed === 'Immediate' ? '2px solid #0EA5E9' : '1.5px solid #F1F5F9', background: transferSpeed === 'Immediate' ? '#F0F9FF' : 'white' }}
                                    >
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', color: '#0EA5E9', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, border: '1px solid #E2E8F0' }}>⚡</div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>{t('transfer.speed.immediate.title', language)}</h4>
                                            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 2px 0' }}>{t('transfer.speed.immediate.desc', language)}</p>
                                            <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, margin: 0 }}>
                                                {t('transfer.speed.immediate.fee', language, { fee: formatAmount(numericAmount * 0.01) })}
                                            </p>
                                        </div>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: transferSpeed === 'Immediate' ? '6px solid #0EA5E9' : '2px solid #CBD5E1' }}></div>
                                    </div>

                                    <div
                                        onClick={() => setTransferSpeed('Standard')}
                                        style={{ ...optionCardStyle, border: transferSpeed === 'Standard' ? '2px solid #0EA5E9' : '1.5px solid #F1F5F9', background: transferSpeed === 'Standard' ? '#F0F9FF' : 'white' }}
                                    >
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', color: '#64748B', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, border: '1px solid #E2E8F0' }}>⏳</div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>{t('transfer.speed.standard.title', language)}</h4>
                                            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 2px 0' }}>{t('transfer.speed.standard.desc', language)}</p>
                                            <p style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, margin: 0 }}>{t('transfer.speed.standard.free', language)}</p>
                                        </div>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: transferSpeed === 'Standard' ? '6px solid #0EA5E9' : '2px solid #CBD5E1' }}></div>
                                    </div>
                                </div>
                            )}

                            {/* Verification Steps for International */}
                            {step === 2 && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', background: '#FFF7ED', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', color: '#D97706' }}><ShieldAlert size={32} /></div>
                                    <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>{t('transfer.imf.title', language)}</h4>
                                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px', lineHeight: 1.5 }}>{t('transfer.imf.desc', language)}</p>
                                    <input type="text" value={imfCode} onChange={e => setImfCode(e.target.value)} placeholder="••••" maxLength={4} style={codeInputStyle} />
                                </div>
                            )}

                            {step === 3 && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', background: '#F0F9FF', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', color: '#0EA5E9' }}><ShieldAlert size={32} /></div>
                                    <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>{t('transfer.swift.title', language)}</h4>
                                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px', lineHeight: 1.5 }}>{t('transfer.swift.desc', language)}</p>
                                    <input type="text" value={swiftCode} onChange={e => setSwiftCode(e.target.value)} placeholder="••••" maxLength={4} style={codeInputStyle} />
                                </div>
                            )}

                            {step === 4 && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', color: '#8B5CF6' }}><ShieldAlert size={32} /></div>
                                    <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>{t('transfer.tax.title', language)}</h4>
                                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px', lineHeight: 1.5 }}>{t('transfer.tax.desc', language)}</p>
                                    <input type="text" value={finalCode} onChange={e => setFinalCode(e.target.value)} placeholder="••••" maxLength={4} style={codeInputStyle} />
                                </div>
                            )}

                            {step === 5 && (
                                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', color: '#10B981' }}>
                                        <CheckCircle size={40} />
                                    </div>
                                    <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>{t('transfer.success.title', language)}</h2>
                                    <p style={{ color: '#64748B', fontWeight: 500, fontSize: '15px' }}>
                                        {t('transfer.success.desc', language, { amount: formatAmount(numericAmount), recipient })}
                                    </p>
                                    {transferSpeed === 'Immediate' && (
                                        <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, margin: '8px 0 0 0' }}>
                                            {t('transfer.success.feeNote', language, { fee: formatAmount(fee) })}
                                        </p>
                                    )}
                                    <div style={{ marginTop: '32px', padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, margin: 0 }}>{t('transfer.success.reference', language)}</p>
                                        <p style={{ fontSize: '15px', color: '#475569', fontWeight: 700, margin: '4px 0 0 0', fontFamily: 'monospace' }}>{reference}</p>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                                {step < 5 && (
                                    <button onClick={() => setStep(step === 0 ? -1 : step - 1)} style={{ flex: 1, padding: '16px', background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}>
                                        {t('transfer.actions.back', language)}
                                    </button>
                                )}
                                <button onClick={handleNext} style={{ flex: 2, padding: '16px', background: step < 5 ? '#0EA5E9' : '#10B981', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: step < 5 ? '0 10px 20px rgba(14, 165, 233, 0.2)' : 'none' }}>
                                    {step === 0 ? t('transfer.actions.continue', language) : step === 1 ? t('transfer.actions.review', language) : step < 5 ? t('transfer.actions.authenticate', language) : t('transfer.actions.done', language)}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Styles ---

const optionCardStyle = {
    display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '20px',
    border: '1.5px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: '#fff'
};

const inputStyle = {
    width: '100%', padding: '16px', borderRadius: '14px', border: '1.5px solid #E2E8F0',
    outline: 'none', background: '#F8FAFC', fontSize: '15px', fontWeight: 600, color: '#1E293B'
};

const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: 800, color: '#64748B',
    marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.02em'
};

const codeInputStyle = {
    width: '100%', padding: '20px', borderRadius: '20px', border: '3px solid #0EA5E9',
    outline: 'none', textAlign: 'center', fontSize: '28px', letterSpacing: '12px',
    fontWeight: 900, background: '#F0F9FF', color: '#0EA5E9'
};

export default TransferModal;
