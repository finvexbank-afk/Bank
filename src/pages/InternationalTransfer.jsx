import React, { useState, useEffect } from 'react';
import { 
  Globe, Landmark, Bitcoin, CreditCard, DollarSign, 
  MoreHorizontal, ArrowLeft, ShieldCheck, ChevronRight,
  Zap, Smartphone, Send, User, Hash, MapPin, Building,
  Key, FileText, Eye, Info, CheckCircle2, AlertCircle, X as XIcon,
  Shield, TriangleAlert, Lock, Printer, LayoutDashboard, Clock, Calendar,
  MessageCircle, Smartphone as Phone, Plus, LayoutGrid, EyeOff
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const InternationalTransfer = () => {
    const { user, setUser } = useAppContext();
    const navigate = useNavigate();
    const [view, setView] = useState('methods'); // 'methods', 'more', 'wire-form', 'confirm', 'imf', 'swift', 'cot', 'success'
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [inputCode, setInputCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [showDormantError, setShowDormantError] = useState(false);
    
    const [formData, setFormData] = useState({
        amount: '', beneficiaryName: '', beneficiaryAccount: '', 
        bankName: '', bankAddress: '', swiftCode: '', iban: '', country: 'Belgium',
        accountType: 'Online Banking', pin: '', note: ''
    });

    // Mock verification requirements
    const EXPECTED_IMF = '1234';
    const EXPECTED_SWIFT = '5678';
    const EXPECTED_COT = '9999';

    const handleContinue = () => {
        if (!formData.amount || !formData.beneficiaryName || !formData.pin) {
            return alert("Security Protocol: All mandatory fields including Transaction PIN must be completed.");
        }
        if (parseFloat(formData.amount) > user.balance) {
            return alert("Capital Deficiency: Insufficient balance for this international settlement.");
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
        setView('imf');
    };

    const verifyCode = (type, code, nextView) => {
        let expected = '';
        if (type === 'imf') expected = user.imf || EXPECTED_IMF;
        if (type === 'swift') expected = user.swift || EXPECTED_SWIFT;
        if (type === 'cot') expected = user.cot || EXPECTED_COT;

        if (inputCode === expected) {
            setInputCode('');
            if (nextView === 'finalize') finalizeTransfer();
            else setView(nextView);
        } else {
            alert(`Authentication Error: Invalid ${type.toUpperCase()} clearance code.`);
        }
    };

    const finalizeTransfer = async () => {
        setLoading(true);
        const amountNum = parseFloat(formData.amount);
        const newBalance = user.balance - amountNum;
        
        try {
            await updateDoc(doc(db, 'users', user.uid), { balance: newBalance });
            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                amount: -amountNum,
                type: 'Debit',
                scope: 'International',
                method: 'Wire Transfer',
                description: `Wire to ${formData.beneficiaryName}`,
                bank: formData.bankName,
                status: 'Completed',
                createdAt: serverTimestamp(),
                ref: `FINVEX/TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            });
            setUser({ ...user, balance: newBalance });
            setView('success');
        } catch (err) {
            alert("Network Failure: Settlement could not be broadcasted.");
        }
        setLoading(false);
    };

    const setQuickAmount = (val) => {
        if (val === 'max') setFormData({...formData, amount: user.balance.toString()});
        else setFormData({...formData, amount: val.toString()});
    };

    if (view === 'success') {
        return (
            <MainLayout>
                <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ width: '80px', height: '80px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}><CheckCircle2 size={42} /></div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>Transfer Transmitted</h2>
                    <p style={{ color: '#64748B', fontWeight: 500, lineHeight: 1.6, marginBottom: '40px' }}>Your international settlement order has been dispatched for regional clearance.</p>
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '16px 32px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Return Home</button>
                </div>
            </MainLayout>
        );
    }

    if (view === 'imf') {
        return (
            <MainLayout>
                <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                        {/* Header Red */}
                        <div style={{ background: '#EF4444', padding: '60px 20px', color: 'white', textAlign: 'center' }}>
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '50%' }}>
                                    <TriangleAlert size={48} color="white" />
                                </div>
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Before You Proceed!</h1>
                            <p style={{ fontSize: '16px', opacity: 0.9, fontWeight: 500 }}>Additional verification is required</p>
                        </div>

                        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: '#FEF2F2', color: '#EF4444', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 32px' }}>
                                <Shield size={40} />
                            </div>
                            
                            <p style={{ fontSize: '18px', color: '#475569', fontWeight: 500, lineHeight: 1.6, marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
                                The IMF code is required to enable you to continue with this transaction. Please contact our online customer care on representative with the live chat: they will help you with the appropriate IMF code for this transaction.
                            </p>

                            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                                <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>IMF Code</label>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Enter IMF code" 
                                    value={inputCode} 
                                    onChange={e => setInputCode(e.target.value)} 
                                    style={{ width: '100%', padding: '18px 24px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '16px', fontWeight: 600, color: '#1E293B', outline: 'none', marginBottom: '24px', textAlign: 'center' }} 
                                />
                                <button 
                                    onClick={() => verifyCode('imf', inputCode, 'swift')} 
                                    style={{ width: '100%', padding: '18px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(14, 165, 233, 0.2)' }}
                                >
                                    <CheckCircle2 size={20} />
                                    Confirm IMF Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (view === 'swift' || view === 'cot') {
        const config = {
            swift: { title: 'SWIFT Compliance', desc: 'Cross-border protocol validation for high-liquidity netting.', next: 'cot', label: 'SWIFT Code' },
            cot: { title: 'Tax Finalization', desc: 'Final settlement and regional tax clearance execution.', next: 'finalize', label: 'COT Code' }
        };
        const current = config[view];
        return (
            <MainLayout>
                <div style={{ padding: '60px 24px', maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '48px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: '64px', height: '64px', background: '#F0F9FF', color: '#0EA5E9', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}><Shield size={32} /></div>
                        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>{current.title}</h2>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px', lineHeight: 1.5 }}>{current.desc}</p>
                        <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>{current.label}</label>
                        </div>
                        <input type="text" placeholder="••••" value={inputCode} onChange={e => setInputCode(e.target.value)} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '2px solid #0EA5E9', fontSize: '28px', textAlign: 'center', fontWeight: 900, letterSpacing: '8px', marginBottom: '32px', outline: 'none' }} />
                        <button onClick={() => verifyCode(view, inputCode, current.next)} style={{ width: '100%', padding: '18px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>{loading ? 'Processing...' : 'Authenticate'}</button>
                    </div>
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
                                <div><h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Confirm Your Transfer</h3><p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>Please review your transfer details before confirming. Once submitted, this transaction cannot be reversed.</p></div>
                            </div>
                            <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}><ConfirmRow label="Transfer Method" value="Wire Transfer" /><ConfirmRow label="Amount" value={`€${Number(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} /><ConfirmRow label="Recipient" value={formData.beneficiaryName} /><ConfirmRow label="Account Number" value={formData.beneficiaryAccount || formData.iban} /><ConfirmRow label="Bank" value={formData.bankName} /><div style={{ height: '1px', background: '#F1F5F9', margin: '8px 0' }}></div><ConfirmRow label="Total Amount" value={`€${Number(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isBold /><ConfirmRow label="New Balance" value={`€${(user.balance - Number(formData.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isBold /></div>
                            <div style={{ display: 'flex', gap: '16px' }}><button onClick={() => setView('wire-form')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #F1F5F9', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>Cancel</button><button onClick={handleConfirm} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#0EA5E9', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>Confirm Transfer</button></div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ padding: '32px', position: 'relative' }}>
                {showDormantError && (
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '600px', zIndex: 100, animation: 'slideIn 0.3s ease-out' }}>
                        <div style={{ background: 'white', borderRadius: '14px', borderLeft: '6px solid #EF4444', borderTop: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ background: '#FEF2F2', padding: '10px', borderRadius: '50%', color: '#EF4444' }}><AlertCircle size={22} /></div>
                            <div style={{ flex: 1 }}><p style={{ fontSize: '14px', color: '#475569', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>Sorry, your account is dormant. Contact support on <span style={{ color: '#EF4444', fontWeight: 700 }}>notification@elmejor-precio.com</span> for more details.</p></div>
                            <button onClick={() => setShowDormantError(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><XIcon size={18} /></button>
                        </div>
                    </div>
                )}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>International Transfer</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600 }}><span>Dashboard</span><ChevronRight size={14} /><span style={{ color: '#0EA5E9' }}>International Transfer</span></div>
                </div>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {view === 'methods' && (
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '32px' }}>Select Transfer Method</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                                <MethodCard icon={<div style={{background:'#1E293B', padding:'6px', borderRadius:'6px'}}><Landmark size={20} color="white"/></div>} label="Wire Transfer" sub="Transfer funds directly to international bank accounts." onClick={() => { setSelectedMethod({label:'Wire Transfer'}); setView('wire-form'); }} />
                                <MethodCard icon={<div style={{background:'#F7931A', padding:'6px', borderRadius:'50%'}}><Bitcoin size={20} color="white"/></div>} label="Cryptocurrency" sub="Send funds to your cryptocurrency wallet." onClick={() => alert('Infrastructure update in progress.')} />
                                <MethodCard icon={<div style={{background:'#003087', padding:'6px', borderRadius:'50%'}}><Send size={20} color="white"/></div>} label="PayPal" sub="Transfer funds to your PayPal account." onClick={() => alert('Infrastructure update in progress.')} />
                                <MethodCard icon={<div style={{background:'#9FE35F', padding:'6px', borderRadius:'50%'}}><Plus size={20} color="#1E293B"/></div>} label="Wise Transfer" sub="Transfer with lower fees using Wise." onClick={() => alert('Infrastructure update in progress.')} />
                                <MethodCard icon={<div style={{background:'black', padding:'6px', borderRadius:'8px'}}><Smartphone size={20} color="white"/></div>} label="Cash App" sub="Quick transfers to your Cash App account." onClick={() => alert('Infrastructure update in progress.')} />
                                <MethodCard icon={<div style={{background:'#FEF3C7', padding:'6px', borderRadius:'50%'}}><MoreHorizontal size={20} color="#D97706"/></div>} label="More Options" sub="Zelle, Venmo, Revolut, and more." onClick={() => setView('more')} />
                            </div>
                            <SecurityBanner />
                        </div>
                    )}
                    {view === 'more' && (
                        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}><button onClick={() => setView('methods')} style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: '#64748B' }}><ArrowLeft size={18} /></button><h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Additional Transfer Methods</h2></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}><MethodCard icon={<div style={{background:'#822D61', padding:'6px', borderRadius:'50%'}}><FileText size={20} color="white"/></div>} label="Skrill" sub="Transfer funds to your Skrill account." onClick={() => alert('Feature coming soon.')} /><MethodCard icon={<div style={{background:'#008CFF', padding:'6px', borderRadius:'50%'}}><Send size={20} color="white"/></div>} label="Venmo" sub="Send funds to your Venmo account." onClick={() => alert('Feature coming soon.')} /><MethodCard icon={<div style={{background:'#6B1C9B', padding:'6px', borderRadius:'50%'}}><Zap size={20} color="white"/></div>} label="Zelle" sub="Quick transfers to your Zelle account." onClick={() => alert('Feature coming soon.')} /><MethodCard icon={<div style={{background:'#0075EB', padding:'6px', borderRadius:'50%'}}><CreditCard size={20} color="white"/></div>} label="Revolut" sub="Transfer to your Revolut account with low fees." onClick={() => alert('Feature coming soon.')} /><MethodCard icon={<div style={{background:'#00A1E9', padding:'6px', borderRadius:'50%'}}><LayoutDashboard size={20} color="white"/></div>} label="Alipay" sub="Send funds to your Alipay account." onClick={() => alert('Feature coming soon.')} /><MethodCard icon={<div style={{background:'#07C160', padding:'6px', borderRadius:'50%'}}><MessageCircle size={20} color="white"/></div>} label="WeChat Pay" sub="Transfer to your WeChat Pay wallet." onClick={() => alert('Feature coming soon.')} /></div>
                            <SecurityBanner />
                        </div>
                    )}
                    {view === 'wire-form' && (
                         <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                            <div style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)', borderRadius: '32px', padding: '40px', color: 'white', marginBottom: '40px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(37, 99, 235, 0.15)' }}>
                                <button onClick={() => setView('methods')} style={{ position: 'absolute', top: '32px', left: '32px', background: 'rgba(255,255,255,0.2)', border: 'none', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}><ArrowLeft size={18} /></button>
                                <div style={{ textAlign: 'center' }}><div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', backdropFilter: 'blur(10px)' }}><Landmark size={28} /></div><h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>International Wire Transfer</h2><p style={{ fontSize: '15px', fontWeight: 500, opacity: 0.9 }}>Funds will reflect in the Beneficiary Account within 72hours.</p></div>
                                <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'20px', background:'rgba(255,255,255,0.1)', borderRadius:'100% 100% 0 0', transform:'scaleX(2) translateY(10px)' }}></div>
                            </div>
                            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #F1F5F9', padding: '48px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
                                <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', marginBottom: '48px' }}>
                                    <label style={labelStyle}>Amount to Transfer</label>
                                    <div style={{ position: 'relative', marginBottom: '16px' }}><span style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '36px', fontWeight: 900, color: '#1E293B' }}>€</span><input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '24px 80px 24px 60px', borderRadius: '16px', border: '2px solid #0EA5E9', fontSize: '42px', fontWeight: 900, background: 'white', outline: 'none' }} /><span style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: 700, color: '#94A3B8' }}>.00</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}><p style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Available balance: €{(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p><div style={{ display: 'flex', gap: '8px' }}>{['100', '500', '1000', 'max'].map(btn => (<button key={btn} onClick={() => setQuickAmount(btn)} style={{ padding: '8px 16px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize', color:'#475569' }}>{btn === 'max' ? 'Max' : `$${btn}`}</button>))}</div></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}><InputField icon={<User size={18}/>} label="Beneficiary Account Name" placeholder="Enter beneficiary's full name" value={formData.beneficiaryName} onChange={val => setFormData({...formData, beneficiaryName: val})} /><InputField icon={<Hash size={18}/>} label="Beneficiary Account Number" placeholder="Enter account number" value={formData.beneficiaryAccount} onChange={val => setFormData({...formData, beneficiaryAccount: val})} /><InputField icon={<Building size={18}/>} label="Bank Name" placeholder="Enter bank name" value={formData.bankName} onChange={val => setFormData({...formData, bankName: val})} /><InputField icon={<MapPin size={18}/>} label="Bank Address" placeholder="Enter bank address" value={formData.bankAddress} onChange={val => setFormData({...formData, bankAddress: val})} /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', marginBottom: '40px' }} className="grid-3-mobile"><FormGroup label="Account Type"><div style={{ position: 'relative' }}><LayoutGrid size={18} style={{ ...fieldIconStyle }} /><select style={{ ...formSelectStyle, paddingLeft: '44px' }} value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value})}><option>Online Banking</option><option>Savings Account</option><option>Checking Account</option><option>Corporate Account</option></select></div></FormGroup><InputField icon={<Globe size={18}/>} label="Country" placeholder="Belgium" value={formData.country} onChange={val => setFormData({...formData, country: val})} /><InputField icon={<Key size={18}/>} label="Swift Code" placeholder="Enter SWIFT/BIC code" value={formData.swiftCode} onChange={val => setFormData({...formData, swiftCode: val})} /></div>
                                <div style={{ marginBottom: '40px' }}><InputField icon={<CreditCard size={18}/>} label="IBAN Number" placeholder="Enter IBAN number" value={formData.iban} onChange={val => setFormData({...formData, iban: val})} /><p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: 600 }}>International Bank Account Number - Format varies by country</p></div>
                                <div style={{ marginBottom: '40px' }}><FormGroup label="Transaction PIN"><div style={{ position: 'relative' }}><Key size={18} style={{ ...fieldIconStyle }} /><input type={showPin ? "text" : "password"} placeholder="Enter your 4-10 digit PIN" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} style={{ ...inputStyle, paddingLeft: '44px', paddingRight: '48px' }} /><div onClick={() => setShowPin(!showPin)} style={{ position:'absolute', right:'16px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#94A3B8' }}>{showPin ? <EyeOff size={18} /> : <Eye size={18} />}</div></div></FormGroup><p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: 600 }}>This is your transaction PIN, not your login password</p></div>
                                <div style={{ marginBottom: '48px' }}><FormGroup label="Note (Optional)"><div style={{ position: 'relative' }}><MessageCircle size={18} style={{ position:'absolute', left:'16px', top:'16px', color:'#94A3B8' }} /><textarea placeholder="Optional payment description or note" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} style={{ ...inputStyle, height: '100px', paddingLeft: '44px', paddingTop:'14px', resize:'none' }} /></div></FormGroup></div>
                                <div style={{ background: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9', marginBottom: '48px', overflow: 'hidden' }}><div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={18} color="#0EA5E9" /><h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Transaction Summary</h4></div><div style={{ padding: '24px' }}><SummaryRow label="Amount" value={`€${Number(formData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} /><SummaryRow label="Fee" value="€0.00" /><div style={{ height: '1px', background: '#E2E8F0', margin: '16px 0' }}></div><SummaryRow label="Total" value={`€${Number(formData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} isTotal /><SummaryRow label="New Balance After Transfer" value={`€${(user.balance - Number(formData.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} /></div></div>
                                <div style={{ display: 'flex', gap: '20px' }} className="flex-row-mobile"><button onClick={handleContinue} style={{ flex: 1.5, background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(14, 165, 233, 0.2)' }}><Send size={20} /> Continue to Transfer</button><button onClick={() => navigate('/dashboard')} style={{ flex: 1, background: 'white', border: '1px solid #E2E8F0', padding: '18px', borderRadius: '16px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', color: '#1E293B', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}><ArrowLeft size={20} /> Back to Dashboard</button></div>
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

const SecurityBanner = () => (
    <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: '20px', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ color: '#0EA5E9' }}><ShieldCheck size={20} /></div><div><h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '2px' }}>Secure Transaction</h4><p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>All transfers are encrypted and processed securely. Never share your PIN with anyone.</p></div></div>
);

const FormGroup = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</label>{children}</div>
);

const InputField = ({ label, icon, placeholder, value, onChange }) => (
    <FormGroup label={label}><div style={{ position: 'relative' }}><div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>{icon}</div><input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, paddingLeft: '44px' }} /></div></FormGroup>
);

const SummaryRow = ({ label, value, isTotal }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: isTotal ? '15px' : '14px', fontWeight: isTotal ? 800 : 600, color: '#64748B' }}>{label}</span><span style={{ fontSize: isTotal ? '18px' : '15px', fontWeight: 800, color: '#1E293B' }}>{value}</span></div>
);

const inputStyle = { width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #E2E8F0', fontSize: '15px', fontWeight: 600, outline: 'none', background: '#F8FAFC', color: '#1E293B' };
const formSelectStyle = { ...inputStyle, cursor:'pointer', appearance:'none', backgroundImage:'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', backgroundSize:'16px' };
const fieldIconStyle = { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 1 };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.02em' };

export default InternationalTransfer;
