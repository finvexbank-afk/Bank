import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import TransferVerificationFlow from './TransferVerificationFlow';

const TransferModal = ({ isOpen, onClose }) => {
    const { user } = useAppContext();
    const { language } = useLanguage();
    const [step, setStep] = useState(0); // 0: details, 1: speed, 2: success
    const [transferSpeed, setTransferSpeed] = useState('Standard'); // 'Standard' or 'Immediate'
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [iban, setIban] = useState('');
    const [note, setNote] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [error, setError] = useState('');
    const [verificationOpen, setVerificationOpen] = useState(false);

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
    const normalizedIban = iban.replace(/\s+/g, '').toUpperCase();
    const ibanLooksValid = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(normalizedIban);
    const speedLabel = t(`transfer.speed.${transferSpeed.toLowerCase()}.title`, language);

    const handleNext = async () => {
        setError('');
        if (step === 0) {
            if (!beneficiaryName || !iban || !amount) return setError(t('transfer.errors.fillAll', language));
            if (!ibanLooksValid) return setError(t('transfer.errors.invalidIban', language));
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError(t('transfer.errors.invalidAmount', language));
            if (total > balance) return setError(t('transfer.errors.insufficient', language));
            setStep(1);
        } else if (step === 1) {
            if (total > balance) return setError(t('transfer.errors.insufficient', language));
            setError('');
            setVerificationOpen(true);
        } else {
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        onClose();
        setTimeout(() => {
            setStep(0);
            setBeneficiaryName('');
            setIban('');
            setNote('');
            setAmount('');
            setReference('');
            setTransferSpeed('Standard');
            setError('');
            setVerificationOpen(false);
        }, 500);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '460px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>

                <button onClick={resetAndClose} aria-label={t('transfer.close', language)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', zIndex: 10 }}><X size={20} /></button>

                <div style={{ padding: '40px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#F0F9FF', color: '#0EA5E9', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {step === 2 ? <CheckCircle size={20} /> : <Send size={20} />}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                                {step === 2 ? t('transfer.success.title', language) : t('transfer.local.title', language)}
                            </h3>
                            {step < 2 && (
                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                                    {t('transfer.step', language, { step: step + 1, total: 2 })}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                            <div>
                                <label style={labelStyle}>{t('transfer.beneficiaryName.label', language)}</label>
                                <input type="text" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder={t('transfer.beneficiaryName.placeholder', language)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>{t('transfer.iban.label', language)}</label>
                                <input type="text" value={iban} onChange={e => setIban(e.target.value)} placeholder={t('transfer.iban.placeholder', language)} style={{ ...inputStyle, textTransform: 'uppercase' }} />
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
                            <div>
                                <label style={labelStyle}>{t('transfer.note.label', language)}</label>
                                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder={t('transfer.note.placeholder', language)} style={inputStyle} />
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

                            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px 20px', border: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
                                    <span>{t('transfer.summary.amount', language)}</span>
                                    <span>€{formatAmount(numericAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
                                    <span>{t('transfer.summary.fee', language)}</span>
                                    <span>€{formatAmount(fee)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
                                    <span>{t('transfer.summary.total', language)}</span>
                                    <span>€{formatAmount(total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', color: '#10B981' }}>
                                <CheckCircle size={40} />
                            </div>
                            <p style={{ color: '#64748B', fontWeight: 500, fontSize: '15px' }}>
                                {t('transfer.success.desc', language, { amount: formatAmount(numericAmount), recipient: beneficiaryName })}
                            </p>
                            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '10px' }}>
                                {t('transfer.success.speed', language)} : <strong>{speedLabel}</strong>
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
                        {step < 2 && (
                            <button onClick={() => step === 0 ? resetAndClose() : setStep(0)} style={{ flex: 1, padding: '16px', background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}>
                                {t('transfer.actions.back', language)}
                            </button>
                        )}
                        <button onClick={handleNext} style={{ flex: 2, padding: '16px', background: step < 2 ? '#0EA5E9' : '#10B981', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: step < 2 ? '0 10px 20px rgba(14, 165, 233, 0.2)' : 'none' }}>
                            {step === 0 ? t('transfer.actions.continue', language) : step === 1 ? t('transfer.actions.review', language) : t('transfer.actions.done', language)}
                        </button>
                    </div>
                </div>
            </div>

            <TransferVerificationFlow
                open={verificationOpen}
                transfer={{
                    amount: numericAmount,
                    fee,
                    total,
                    speed: transferSpeed,
                    scope: 'Local',
                    to: beneficiaryName,
                    iban: normalizedIban,
                    description: note ? `Transfer to ${beneficiaryName} - ${note}` : `Transfer to ${beneficiaryName}`
                }}
                onClose={() => setVerificationOpen(false)}
                onCompleted={(result) => {
                    setReference(result.reference);
                    setVerificationOpen(false);
                    setStep(2);
                }}
            />
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

export default TransferModal;
