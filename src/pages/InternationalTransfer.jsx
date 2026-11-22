import React, { useState, useEffect } from 'react';
import { 
  Globe, Landmark, Bitcoin, CreditCard, DollarSign, 
  MoreHorizontal, ArrowLeft, ShieldCheck, ChevronRight,
  Zap, Smartphone, Send, User, Hash, MapPin, Building,
  Key, FileText, Eye, Info, CheckCircle2, AlertCircle, X as XIcon,
  Printer, LayoutDashboard, Clock, Calendar,
  MessageCircle, Smartphone as Phone, Plus, LayoutGrid, EyeOff
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

const InternationalTransfer = () => {
    const { user, setUser } = useAppContext();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [view, setView] = useState('methods'); // 'methods', 'more', 'wire-form', 'confirm', 'codes', 'success'
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [showDormantError, setShowDormantError] = useState(false);
    const [codes, setCodes] = useState({ imf: '', swift: '', cot: '' });
    const [codeError, setCodeError] = useState('');
    
    const [formData, setFormData] = useState({
        amount: '', beneficiaryName: '', beneficiaryAccount: '', 
        bankName: '', bankAddress: '', swiftCode: '', iban: '', country: 'Belgium',
        accountType: 'Online Banking', pin: '', note: '', speed: 'Standard'
    });

    const handleContinue = () => {
        if (!formData.amount || !formData.beneficiaryName || !formData.pin) {
            return alert(t('intlTransfer.error.mandatory', language));
        }
        const amountNum = parseFloat(formData.amount);
        const fee = formData.speed === 'Immediate' ? amountNum * 0.01 : 0;
        if (amountNum <= 0 || amountNum + fee > user.balance) {
            return alert(t('intlTransfer.error.insufficient', language));
        }
        setView('confirm');
    };

    const handleConfirm = () => {
        if (user.accountStatus === 'Dormant') {
            setShowDormantError(true);
            setView('methods');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setCodeError('');
        setView('codes');
    };

    const handleCodes = (validate) => {
        if (!validate) {
            finalizeTransfer();
            return;
        }
        const expected = { imf: '1234', swift: '5678', cot: '9999' };
        const filled = Object.entries(codes).filter(([, value]) => value.trim() !== '');
        const invalid = filled.some(([key, value]) => value.trim() !== expected[key]);
        if (invalid) {
            setCodeError(t('intlTransfer.codes.error', language));
            return;
        }
        finalizeTransfer();
    };

    const finalizeTransfer = async () => {
        setLoading(true);
        const userId = user.id || user.uid;
        const baseAmount = parseFloat(formData.amount);
        const fee = formData.speed === 'Immediate' ? baseAmount * 0.01 : 0;
        const total = baseAmount + fee;
        const newBalance = user.balance - total;
        
        try {
            await updateDoc(doc(db, 'users', userId), { balance: newBalance });
            await addDoc(collection(db, 'transactions'), {
                userId,
                amount: -total,
                baseAmount,
                fee,
                speed: formData.speed,
                type: 'Debit',
                scope: 'International',
                method: 'Wire Transfer',
                description: `Wire to ${formData.beneficiaryName}`,
                to: formData.beneficiaryName,
                iban: formData.iban,
                swift: formData.swiftCode,
                country: formData.country,
                bank: formData.bankName,
                status: formData.speed === 'Immediate' ? 'Completed' : 'Pending',
                createdAt: serverTimestamp(),
                ref: `FINVEX/TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            });
            setUser({ ...user, balance: newBalance });
            setView('success');
        } catch (err) {
            alert(t('intlTransfer.error.network', language));
        }
        setLoading(false);
    };

    const setQuickAmount = (val) => {
        if (val === 'max') {
            const maxAmount = formData.speed === 'Immediate' ? user.balance / 1.01 : user.balance;
            setFormData({...formData, amount: maxAmount.toFixed(2)});
        }
        else setFormData({...formData, amount: val.toString()});
    };

    const amountNum = parseFloat(formData.amount) || 0;
    const feeAmount = formData.speed === 'Immediate' ? amountNum * 0.01 : 0;
    const totalAmount = amountNum + feeAmount;
    const formattedFee = `€${feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const speedLabel = t(formData.speed === 'Immediate' ? 'intlTransfer.speed.immediate' : 'intlTransfer.speed.standard', language);

    if (view === 'success') {
        return (
            <MainLayout>
                <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ width: '80px', height: '80px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}><CheckCircle2 size={42} /></div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>{t('intlTransfer.success.title', language)}</h2>
                    <p style={{ color: '#64748B', fontWeight: 500, lineHeight: 1.6, marginBottom: '40px' }}>{t('intlTransfer.success.desc', language)}</p>
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '16px 32px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>{t('intlTransfer.success.returnHome', language)}</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Confirmation Popup */}
            {view === 'confirm' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '550px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideIn 0.3s ease-out' }}>
                        <div style={{ padding: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#0EA5E9', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)' }}><CheckCircle2 size={24} /></div>
                                <div><h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{t('intlTransfer.confirm.title', language)}</h3><p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>{t('intlTransfer.confirm.desc', language)}</p></div>
                            </div>
                            <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}><ConfirmRow label={t('intlTransfer.confirm.methodLabel', language)} value="Wire Transfer" /><ConfirmRow label={t('intlTransfer.confirm.speedLabel', language)} value={speedLabel} /><ConfirmRow label={t('intlTransfer.common.amount', language)} value={`€${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} /><ConfirmRow label={t('intlTransfer.confirm.recipient', language)} value={formData.beneficiaryName} /><ConfirmRow label={t('intlTransfer.confirm.accountNumber', language)} value={formData.beneficiaryAccount || formData.iban} /><ConfirmRow label={t('intlTransfer.confirm.bank', language)} value={formData.bankName} /><ConfirmRow label={t('intlTransfer.confirm.feeLabel', language)} value={formattedFee} /><div style={{ height: '1px', background: '#F1F5F9', margin: '8px 0' }}></div><ConfirmRow label={t('intlTransfer.confirm.totalAmount', language)} value={`€${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isBold /><ConfirmRow label={t('intlTransfer.confirm.newBalance', language)} value={`€${(user.balance - totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isBold /></div>
                            <div style={{ display: 'flex', gap: '16px' }}><button onClick={() => setView('wire-form')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #F1F5F9', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>{t('intlTransfer.confirm.cancel', language)}</button><button onClick={handleConfirm} disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#0EA5E9', color: 'white', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>{t('intlTransfer.confirm.confirmTransfer', language)}</button></div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'codes' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideIn 0.3s ease-out' }}>
                        <div style={{ padding: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#F0F9FF', color: '#0EA5E9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}><ShieldCheck size={24} /></div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{t('intlTransfer.codes.title', language)}</h3>
                                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, fontWeight: 500, margin: 0 }}>{t('intlTransfer.codes.desc', language)}</p>
                                </div>
                            </div>

                            {codeError && (
                                <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', fontSize: '13px', fontWeight: 600, margin: '20px 0', border: '1px solid #FEE2E2' }}>{codeError}</div>
                            )}

                            <div style={{ display: 'grid', gap: '18px', margin: '28px 0 32px' }}>
                                <FormGroup label={t('intlTransfer.codes.imfLabel', language)}>
                                    <input type="text" maxLength={4} placeholder={t('intlTransfer.codes.imfPlaceholder', language)} value={codes.imf} onChange={e => { setCodes({ ...codes, imf: e.target.value }); setCodeError(''); }} style={inputStyle} />
                                </FormGroup>
                                <FormGroup label={t('intlTransfer.codes.swiftLabel', language)}>
                                    <input type="text" maxLength={4} placeholder={t('intlTransfer.codes.swiftPlaceholder', language)} value={codes.swift} onChange={e => { setCodes({ ...codes, swift: e.target.value }); setCodeError(''); }} style={inputStyle} />
                                </FormGroup>
                                <FormGroup label={t('intlTransfer.codes.cotLabel', language)}>
                                    <input type="text" maxLength={4} placeholder={t('intlTransfer.codes.cotPlaceholder', language)} value={codes.cot} onChange={e => { setCodes({ ...codes, cot: e.target.value }); setCodeError(''); }} style={inputStyle} />
                                </FormGroup>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button onClick={() => handleCodes(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #F1F5F9', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>{t('intlTransfer.codes.skip', language)}</button>
                                <button onClick={() => handleCodes(true)} disabled={loading} style={{ flex: 1.5, padding: '14px', borderRadius: '12px', border: 'none', background: '#0EA5E9', color: 'white', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>{t('intlTransfer.codes.validate', language)}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ padding: '32px', position: 'relative' }}>
                {showDormantError && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '600px', zIndex: 100, animation: 'slideIn 0.3s ease-out' }}>
                        <div style={{ background: 'white', borderRadius: '14px', borderLeft: '6px solid #EF4444', borderTop: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ background: '#FEF2F2', padding: '10px', borderRadius: '50%', color: '#EF4444' }}><AlertCircle size={22} /></div>
                            <div style={{ flex: 1 }}><p style={{ fontSize: '14px', color: '#475569', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{t('intlTransfer.error.dormantPrefix', language)}<span style={{ color: '#EF4444', fontWeight: 700 }}>notification@elmejor-precio.com</span>{t('intlTransfer.error.dormantSuffix', language)}</p></div>
                            <button onClick={() => setShowDormantError(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><XIcon size={18} /></button>
                        </div>
                    </div>
                )}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>{t('intlTransfer.title', language)}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600 }}><span>{t('intlTransfer.breadcrumb.dashboard', language)}</span><ChevronRight size={14} /><span style={{ color: '#0EA5E9' }}>{t('intlTransfer.title', language)}</span></div>
                </div>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {view === 'methods' && (
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '32px' }}>{t('intlTransfer.methods.title', language)}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                                <MethodCard icon={<div style={{background:'#1E293B', padding:'6px', borderRadius:'6px'}}><Landmark size={20} color="white"/></div>} label="Wire Transfer" sub={t('intlTransfer.methods.wire.desc', language)} onClick={() => { setSelectedMethod({label:'Wire Transfer'}); setView('wire-form'); }} />
                                <MethodCard icon={<div style={{background:'#F7931A', padding:'6px', borderRadius:'50%'}}><Bitcoin size={20} color="white"/></div>} label={t('intlTransfer.methods.crypto.label', language)} sub={t('intlTransfer.methods.crypto.desc', language)} onClick={() => alert(t('intlTransfer.error.infrastructure', language))} />
                                <MethodCard icon={<div style={{background:'#003087', padding:'6px', borderRadius:'50%'}}><Send size={20} color="white"/></div>} label="PayPal" sub={t('intlTransfer.methods.paypal.desc', language)} onClick={() => alert(t('intlTransfer.error.infrastructure', language))} />
                                <MethodCard icon={<div style={{background:'#9FE35F', padding:'6px', borderRadius:'50%'}}><Plus size={20} color="#1E293B"/></div>} label="Wise Transfer" sub={t('intlTransfer.methods.wise.desc', language)} onClick={() => alert(t('intlTransfer.error.infrastructure', language))} />
                                <MethodCard icon={<div style={{background:'black', padding:'6px', borderRadius:'8px'}}><Smartphone size={20} color="white"/></div>} label="Cash App" sub={t('intlTransfer.methods.cashapp.desc', language)} onClick={() => alert(t('intlTransfer.error.infrastructure', language))} />
                                <MethodCard icon={<div style={{background:'#FEF3C7', padding:'6px', borderRadius:'50%'}}><MoreHorizontal size={20} color="#D97706"/></div>} label={t('intlTransfer.methods.more.label', language)} sub={t('intlTransfer.methods.more.desc', language)} onClick={() => setView('more')} />
                            </div>
                            <SecurityBanner />
                        </div>
                    )}
                    {view === 'more' && (
                        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}><button onClick={() => setView('methods')} style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: '#64748B' }}><ArrowLeft size={18} /></button><h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{t('intlTransfer.more.title', language)}</h2></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}><MethodCard icon={<div style={{background:'#822D61', padding:'6px', borderRadius:'50%'}}><FileText size={20} color="white"/></div>} label="Skrill" sub={t('intlTransfer.more.skrill.desc', language)} onClick={() => alert(t('intlTransfer.error.featureSoon', language))} /><MethodCard icon={<div style={{background:'#008CFF', padding:'6px', borderRadius:'50%'}}><Send size={20} color="white"/></div>} label="Venmo" sub={t('intlTransfer.more.venmo.desc', language)} onClick={() => alert(t('intlTransfer.error.featureSoon', language))} /><MethodCard icon={<div style={{background:'#6B1C9B', padding:'6px', borderRadius:'50%'}}><Zap size={20} color="white"/></div>} label="Zelle" sub={t('intlTransfer.more.zelle.desc', language)} onClick={() => alert(t('intlTransfer.error.featureSoon', language))} /><MethodCard icon={<div style={{background:'#0075EB', padding:'6px', borderRadius:'50%'}}><CreditCard size={20} color="white"/></div>} label="Revolut" sub={t('intlTransfer.more.revolut.desc', language)} onClick={() => alert(t('intlTransfer.error.featureSoon', language))} /><MethodCard icon={<div style={{background:'#00A1E9', padding:'6px', borderRadius:'50%'}}><LayoutDashboard size={20} color="white"/></div>} label="Alipay" sub={t('intlTransfer.more.alipay.desc', language)} onClick={() => alert(t('intlTransfer.error.featureSoon', language))} /><MethodCard icon={<div style={{background:'#07C160', padding:'6px', borderRadius:'50%'}}><MessageCircle size={20} color="white"/></div>} label="WeChat Pay" sub={t('intlTransfer.more.wechat.desc', language)} onClick={() => alert(t('intlTransfer.error.featureSoon', language))} /></div>
                            <SecurityBanner />
                        </div>
                    )}
                    {view === 'wire-form' && (
                         <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                            <div style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)', borderRadius: '32px', padding: '40px', color: 'white', marginBottom: '40px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(37, 99, 235, 0.15)' }}>
                                <button onClick={() => setView('methods')} style={{ position: 'absolute', top: '32px', left: '32px', background: 'rgba(255,255,255,0.2)', border: 'none', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}><ArrowLeft size={18} /></button>
                                <div style={{ textAlign: 'center' }}><div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', backdropFilter: 'blur(10px)' }}><Landmark size={28} /></div><h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>{t('intlTransfer.form.title', language)}</h2><p style={{ fontSize: '15px', fontWeight: 500, opacity: 0.9 }}>{t('intlTransfer.form.subtitle', language)}</p></div>
                                <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'20px', background:'rgba(255,255,255,0.1)', borderRadius:'100% 100% 0 0', transform:'scaleX(2) translateY(10px)' }}></div>
                            </div>
                            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #F1F5F9', padding: '48px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
                                <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', marginBottom: '48px' }}>
                                    <label style={labelStyle}>{t('intlTransfer.form.amountLabel', language)}</label>
                                    <div style={{ position: 'relative', marginBottom: '16px' }}><span style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '36px', fontWeight: 900, color: '#1E293B' }}>€</span><input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '24px 80px 24px 60px', borderRadius: '16px', border: '2px solid #0EA5E9', fontSize: '42px', fontWeight: 900, background: 'white', outline: 'none' }} /><span style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: 700, color: '#94A3B8' }}>.00</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}><p style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>{t('intlTransfer.form.availableBalance', language, { amount: (user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) })}</p><div style={{ display: 'flex', gap: '8px' }}>{['100', '500', '1000', 'max'].map(btn => (<button key={btn} onClick={() => setQuickAmount(btn)} style={{ padding: '8px 16px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize', color:'#475569' }}>{btn === 'max' ? t('intlTransfer.form.max', language) : `$${btn}`}</button>))}</div></div>
                                </div>
                                <div style={{ marginBottom: '40px' }}>
                                    <FormGroup label={t('intlTransfer.speed.title', language)}>
                                        <div style={{ display: 'flex', gap: '16px' }} className="flex-row-mobile">
                                            <SpeedOption
                                                selected={formData.speed === 'Immediate'}
                                                onClick={() => setFormData({...formData, speed: 'Immediate'})}
                                                icon={<Zap size={20} />}
                                                title={t('intlTransfer.speed.immediate', language)}
                                                desc={t('intlTransfer.speed.immediateDesc', language)}
                                                badge={t('intlTransfer.speed.fee', language, { fee: `€${(amountNum * 0.01).toLocaleString('en-US', { minimumFractionDigits: 2 })}` })}
                                            />
                                            <SpeedOption
                                                selected={formData.speed === 'Standard'}
                                                onClick={() => setFormData({...formData, speed: 'Standard'})}
                                                icon={<Clock size={20} />}
                                                title={t('intlTransfer.speed.standard', language)}
                                                desc={t('intlTransfer.speed.standardDesc', language)}
                                                badge={t('intlTransfer.speed.free', language)}
                                                free
                                            />
                                        </div>
                                    </FormGroup>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}><InputField icon={<User size={18}/>} label={t('intlTransfer.form.beneficiaryName.label', language)} placeholder={t('intlTransfer.form.beneficiaryName.placeholder', language)} value={formData.beneficiaryName} onChange={val => setFormData({...formData, beneficiaryName: val})} /><InputField icon={<Hash size={18}/>} label={t('intlTransfer.form.beneficiaryAccount.label', language)} placeholder={t('intlTransfer.form.beneficiaryAccount.placeholder', language)} value={formData.beneficiaryAccount} onChange={val => setFormData({...formData, beneficiaryAccount: val})} /><InputField icon={<Building size={18}/>} label={t('intlTransfer.form.bankName.label', language)} placeholder={t('intlTransfer.form.bankName.placeholder', language)} value={formData.bankName} onChange={val => setFormData({...formData, bankName: val})} /><InputField icon={<MapPin size={18}/>} label={t('intlTransfer.form.bankAddress.label', language)} placeholder={t('intlTransfer.form.bankAddress.placeholder', language)} value={formData.bankAddress} onChange={val => setFormData({...formData, bankAddress: val})} /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', marginBottom: '40px' }} className="grid-3-mobile"><FormGroup label={t('intlTransfer.form.accountType', language)}><div style={{ position: 'relative' }}><LayoutGrid size={18} style={{ ...fieldIconStyle }} /><select style={{ ...formSelectStyle, paddingLeft: '44px' }} value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value})}><option>Online Banking</option><option>Savings Account</option><option>Checking Account</option><option>Corporate Account</option></select></div></FormGroup><InputField icon={<Globe size={18}/>} label={t('intlTransfer.form.country.label', language)} placeholder={t('intlTransfer.form.country.placeholder', language)} value={formData.country} onChange={val => setFormData({...formData, country: val})} /><InputField icon={<Key size={18}/>} label={t('intlTransfer.form.swift.label', language)} placeholder={t('intlTransfer.form.swift.placeholder', language)} value={formData.swiftCode} onChange={val => setFormData({...formData, swiftCode: val})} /></div>
                                <div style={{ marginBottom: '40px' }}><InputField icon={<CreditCard size={18}/>} label={t('intlTransfer.form.iban.label', language)} placeholder={t('intlTransfer.form.iban.placeholder', language)} value={formData.iban} onChange={val => setFormData({...formData, iban: val})} /><p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: 600 }}>{t('intlTransfer.form.iban.note', language)}</p></div>
                                <div style={{ marginBottom: '40px' }}><FormGroup label={t('intlTransfer.form.pin.label', language)}><div style={{ position: 'relative' }}><Key size={18} style={{ ...fieldIconStyle }} /><input type={showPin ? "text" : "password"} placeholder={t('intlTransfer.form.pin.placeholder', language)} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} style={{ ...inputStyle, paddingLeft: '44px', paddingRight: '48px' }} /><div onClick={() => setShowPin(!showPin)} style={{ position:'absolute', right:'16px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#94A3B8' }}>{showPin ? <EyeOff size={18} /> : <Eye size={18} />}</div></div></FormGroup><p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: 600 }}>{t('intlTransfer.form.pin.note', language)}</p></div>
                                <div style={{ marginBottom: '48px' }}><FormGroup label={t('intlTransfer.form.note.label', language)}><div style={{ position: 'relative' }}><MessageCircle size={18} style={{ position:'absolute', left:'16px', top:'16px', color:'#94A3B8' }} /><textarea placeholder={t('intlTransfer.form.note.placeholder', language)} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} style={{ ...inputStyle, height: '100px', paddingLeft: '44px', paddingTop:'14px', resize:'none' }} /></div></FormGroup></div>
                                <div style={{ background: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9', marginBottom: '48px', overflow: 'hidden' }}><div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={18} color="#0EA5E9" /><h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0 }}>{t('intlTransfer.form.summary.title', language)}</h4></div><div style={{ padding: '24px' }}><SummaryRow label={t('intlTransfer.common.amount', language)} value={`€${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} /><SummaryRow label={t('intlTransfer.form.summary.speed', language)} value={speedLabel} /><SummaryRow label={t('intlTransfer.form.summary.fee', language)} value={formattedFee} /><div style={{ height: '1px', background: '#E2E8F0', margin: '16px 0' }}></div><SummaryRow label={t('intlTransfer.form.summary.total', language)} value={`€${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isTotal /><SummaryRow label={t('intlTransfer.form.summary.newBalanceAfter', language)} value={`€${(user.balance - totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} /></div></div>
                                <div style={{ display: 'flex', gap: '20px' }} className="flex-row-mobile"><button onClick={handleContinue} style={{ flex: 1.5, background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(14, 165, 233, 0.2)' }}><Send size={20} /> {t('intlTransfer.form.continue', language)}</button><button onClick={() => navigate('/dashboard')} style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', padding: '18px', borderRadius: '16px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', color: '#1E293B', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}><ArrowLeft size={20} /> {t('intlTransfer.form.backDashboard', language)}</button></div>
                            </div>
                            <div style={{ marginTop: '32px' }}><SecurityBanner /></div>
                         </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @media (max-width: 768px) { .grid-3-mobile { grid-template-columns: 1fr !important; } .flex-row-mobile { flex-direction: column; } }
            `}</style>
        </MainLayout>
    );
};

// --- Reusable Components ---

const ConfirmRow = ({ label, value, isBold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>{label}</span><span style={{ fontSize: isBold ? '15px' : '14px', fontWeight: isBold ? 800 : 700, color: '#1E293B', textAlign:'right' }}>{value}</span></div>
);

const MethodCard = ({ icon, label, sub, onClick }) => (
    <div onClick={onClick} style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '24px', padding: '32px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ flexShrink: 0 }}>{icon}</div><h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1E293B' }}>{label}</h3></div><p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>{sub}</p></div>
);

const SecurityBanner = () => {
    const { language } = useLanguage();
    return (
        <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ color: '#0EA5E9' }}><ShieldCheck size={20} /></div><div><h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '2px' }}>{t('intlTransfer.security.title', language)}</h4><p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{t('intlTransfer.security.desc', language)}</p></div></div>
    );
};

const FormGroup = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</label>{children}</div>
);

const InputField = ({ label, icon, placeholder, value, onChange }) => (
    <FormGroup label={label}><div style={{ position: 'relative' }}><div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>{icon}</div><input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, paddingLeft: '44px' }} /></div></FormGroup>
);

const SummaryRow = ({ label, value, isTotal }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: isTotal ? '15px' : '14px', fontWeight: isTotal ? 800 : 600, color: '#64748B' }}>{label}</span><span style={{ fontSize: isTotal ? '18px' : '15px', fontWeight: 800, color: '#1E293B' }}>{value}</span></div>
);

const SpeedOption = ({ selected, onClick, icon, title, desc, badge, free }) => (
    <div onClick={onClick} style={selected ? { ...speedCardStyle, borderColor: '#0EA5E9', background: '#F0F9FF', boxShadow: '0 8px 20px rgba(14, 165, 233, 0.12)' } : speedCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ color: selected ? '#0EA5E9' : '#94A3B8', display: 'flex' }}>{icon}</span>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0 }}>{title}</h4>
            <span style={{ marginLeft: 'auto', width: '18px', height: '18px', borderRadius: '50%', border: selected ? '5px solid #0EA5E9' : '2px solid #CBD5E1', background: 'white', flexShrink: 0 }}></span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, lineHeight: 1.5, margin: '0 0 12px' }}>{desc}</p>
        <span style={{ fontSize: '13px', fontWeight: 800, color: free ? '#10B981' : '#0EA5E9' }}>{badge}</span>
    </div>
);

const speedCardStyle = { flex: 1, border: '2px solid #E2E8F0', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease', background: 'white' };
const inputStyle = { width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #E2E8F0', fontSize: '15px', fontWeight: 600, outline: 'none', background: '#F8FAFC', color: '#1E293B' };
const formSelectStyle = { ...inputStyle, cursor:'pointer', appearance:'none', backgroundImage:'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', backgroundSize:'16px' };
const fieldIconStyle = { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 1 };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.02em' };

export default InternationalTransfer;
