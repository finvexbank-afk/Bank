import React, { useState } from 'react';
import { 
  Plus, ChevronRight, ArrowLeft, Wallet, 
  CreditCard, Globe, Zap, ShieldCheck, 
  Copy, CheckCircle, Upload, DollarSign,
  Bitcoin, Landmark, User, Info, Smartphone,
  RefreshCw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';
import { notify } from '../components/Toast';

const Deposit = () => {
    const { user } = useAppContext();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [view, setView] = useState('selection'); // 'selection' or 'payment'
    const [selectedMethod, setSelectedMethod] = useState('');
    const [amount, setAmount] = useState('0.00');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const methods = [
        { id: 'USDT', label: 'USDT', icon: <DollarSign size={20} color="#10B981" />, color: '#D1FAE5' },
        { id: 'Bank Transfer', label: t('deposit.methodBank', language), icon: <Landmark size={20} color="#3B82F6" />, color: '#DBEAFE' },
        { id: 'Paypal', label: 'Paypal', icon: <div style={{width:'20px', height:'20px', background:'#2563EB', borderRadius:'50%'}}></div>, color: '#EFF6FF' },
        { id: 'Bitcoin', label: 'BTC', icon: <Bitcoin size={20} color="#F59E0B" />, color: '#FEF3C7' }
    ];

    const quickAmounts = ['100', '500', '1000', '5000'];

    const handleContinue = () => {
        if (!selectedMethod || parseFloat(amount) <= 0) {
            notify.error(t('deposit.validationError', language));
            return;
        }
        setView('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmitPayment = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const date = new Date();
            const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            await addDoc(collection(db, 'transactions'), {
                userId: user.id,
                userName: user.name,
                amount: parseFloat(amount),
                type: 'Credit',
                method: selectedMethod,
                status: 'Pending',
                date: `${dateStr} ${timeStr}`,
                createdAt: serverTimestamp(),
                ref: `FINVEX/DP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            });

            setIsSubmitting(false);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                navigate('/dashboard');
            }, 5000);
        } catch (error) {
            console.error("Error submitting deposit:", error);
            notify.error(t('deposit.submitFailed', language));
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
                
                {/* SUCCESS POPUP */}
                {showSuccess && (
                    <div className="popup-responsive" style={{ 
                        position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', 
                        width: 'calc(100% - 32px)', maxWidth: '450px', background: 'white', 
                        borderRadius: '12px', borderLeft: '5px solid #10B981', boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 9999,
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        <div style={{ width: '40px', height: '40px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <CheckCircle size={22} color="#10B981" />
                        </div>
                        <p style={{ flex: 1, fontSize: '14px', color: '#1E293B', fontWeight: 600, lineHeight: 1.4 }}>
                            {t('deposit.successMessage', language)}
                        </p>
                        <X size={18} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setShowSuccess(false)} />
                    </div>
                )}

                {/* --- VIEW: PAYMENT --- */}
                {view === 'payment' ? (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <div className="flex-row-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px' }}>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{t('deposit.finalizeTitle', language)}</h1>
                                <p style={{ fontSize: '13px', color: '#64748B' }}>{t('deposit.crumbDashboard', language)} {'\u003E'} {t('deposit.crumbDeposits', language)} {'\u003E'} <span style={{fontWeight:600, color:'#1E293B'}}>{t('deposit.crumbPayment', language)}</span></p>
                            </div>
                            <button onClick={() => setView('selection')} style={{ padding: '10px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}><ArrowLeft size={18} /> {t('deposit.edit', language)}</button>
                        </div>

                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <div className="flex-row-mobile" style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#F8FAFC' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CreditCard size={20} color="#3B82F6" /><h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>{t('deposit.methodLabel', language, { method: selectedMethod })}</h3></div>
                                <div style={{ background: '#0EA5E9', color: 'white', padding: '8px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 800 }}>€{parseFloat(amount).toLocaleString()} EUR</div>
                            </div>
                            <div style={{ padding: 'clamp(24px, 5vw, 48px)' }}>
                                <div style={{ background: '#F0F9FF', border: '1px solid #B9E6FE', borderRadius: '16px', padding: '24px', marginBottom: '40px', display: 'flex', gap: '16px' }}>
                                    <Info size={24} color="#0EA5E9" style={{flexShrink: 0}} />
                                    <div><h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0369A1', marginBottom: '6px' }}>{t('deposit.fundingInstructions', language)}</h4><p style={{ fontSize: '14px', color: '#0C4A6E', lineHeight: 1.6 }}>{t('deposit.fundingInstructionsBody', language)}</p></div>
                                </div>
                                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                                    <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '24px', display: 'inline-block', border: '1px solid #F1F5F9', width: '100%', maxWidth: '300px' }}>
                                        <Smartphone size={32} color="#0EA5E9" style={{marginBottom: '16px'}} /><h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '24px' }}>{t('deposit.scanToPay', language)}</h4>
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TPCRRGUkpsnFM3r5cu9JfdeXBvhZoygP" alt="QR" style={{ width: '100%', maxWidth: '200px', border: '8px solid white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                                    </div>
                                </div>
                                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9', marginBottom: '40px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '10px' }}>{t('deposit.recipientAddress', language)}</p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input readOnly value="TPCRRGUkpsnFM3r5cu9JfdeXBvhZoygPR" style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, minWidth: 0 }} />
                                        <button onClick={() => notify.success(t('deposit.copied', language))} style={{ padding: '12px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', flexShrink: 0 }}><Copy size={18} color="#64748B" /></button>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '48px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '16px' }}>{t('deposit.uploadReceipt', language)}</p>
                                    <div style={{ border: '2px dashed #CBD5E1', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer' }}>
                                        <Upload size={32} color="#94A3B8" style={{ marginBottom: '16px' }} /><p style={{ fontSize: '14px', color: '#0EA5E9', fontWeight: 700 }}>{t('deposit.tapToSelect', language)}</p>
                                    </div>
                                </div>
                                <button onClick={handleSubmitPayment} disabled={isSubmitting} style={{ width: '100%', padding: '20px', background: isSubmitting ? '#94A3B8' : '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}>
                                    {isSubmitting ? <RefreshCw className="spin" size={20} /> : <><CheckCircle size={20} /> {t('deposit.completeDeposit', language)}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- VIEW: SELECTION --- */
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>{t('deposit.addLiquidity', language)}</h1>
                            <p style={{ fontSize: '13px', color: '#64748B' }}>{t('deposit.crumbDashboard', language)} {'\u003E'} <span style={{fontWeight:600, color:'#1E293B'}}>{t('deposit.crumbFunding', language)}</span></p>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #0284C7, #075985)', borderRadius: '24px', padding: 'clamp(32px, 8vw, 60px) 24px', color: 'white', textAlign: 'center', marginBottom: '40px' }}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}><Wallet size={28} /></div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>{t('deposit.accountRefill', language)}</h2>
                            <p style={{ fontSize: '14px', opacity: 0.9 }}>{t('deposit.accountRefillBody', language)}</p>
                        </div>
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: 'clamp(24px, 5vw, 40px)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '16px' }}>{t('deposit.selectGateway', language)}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                                {methods.map(m => (
                                    <MethodCard key={m.id} method={m} selected={selectedMethod === m.id} onSelect={() => setSelectedMethod(m.id)} />
                                ))}
                            </div>
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '40px' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>{t('deposit.depositAmount', language)}</p>
                                <div style={{ position: 'relative', marginBottom: '16px' }}>
                                    <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>€</div>
                                    <input type="number" placeholder="0.00" value={amount === '0.00' ? '' : amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '20px 24px 20px 48px', fontSize: '28px', fontWeight: 800, borderRadius: '16px', border: '2px solid #E2E8F0', outline: 'none', color: '#1E293B' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '48px', flexWrap: 'wrap' }}>
                                    {quickAmounts.map(q => (<button key={q} onClick={() => setAmount(q)} style={{ padding: '10px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>+€{parseFloat(q).toLocaleString()}</button>))}
                                </div>
                                <div className="flex-row-mobile" style={{ display: 'flex', gap: '16px' }}>
                                    <button onClick={handleContinue} style={{ flex: 2, padding: '18px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}>{t('deposit.proceedGateway', language)}</button>
                                    <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '18px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 800, color: '#64748B', cursor: 'pointer' }}>{t('deposit.cancel', language)}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes slideDown { 0% { opacity: 0; transform: translate(-50%, -20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
                @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @media (max-width: 640px) {
                    .flex-row-mobile { flex-direction: column; align-items: stretch !important; }
                }
            `}</style>
        </MainLayout>
    );
};

const MethodCard = ({ method, selected, onSelect }) => (
    <div onClick={onSelect} style={{ padding: '16px', borderRadius: '16px', border: `2px solid ${selected ? '#0EA5E9' : '#F1F5F9'}`, background: selected ? '#F0F9FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: '0.2s' }}>
        <div style={{ width: '36px', height: '36px', background: method.color, borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>{method.icon}</div>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap' }}>{method.label}</span>
    </div>
);

export default Deposit;
