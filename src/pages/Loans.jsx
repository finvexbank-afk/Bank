import React, { useState, useEffect } from 'react';
import { Landmark, ArrowRight, CheckCircle2, Clock, CalendarDays, DollarSign } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

const Loans = () => {
    const { user } = useAppContext();
    const { language } = useLanguage();
    if (!user) return null;

    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('Personal');
    const [duration, setDuration] = useState('12');
    const [step, setStep] = useState(0);
    const [myLoans, setMyLoans] = useState([]);

    const statusLabels = {
        Pending: t('loans.statusPending', language),
        Rejected: t('loans.statusRejected', language),
        Approved: t('loans.statusApproved', language)
    };

    // Fetch user's past loan applications
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'loans'), where('userId', '==', user.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            // Sort locally to avoid Firebase Index requirement
            list.sort((a, b) => new Date(b.date) - new Date(a.date));
            setMyLoans(list);
        });
        return unsubscribe;
    }, [user]);

    const calcMonthly = () => {
        if (!amount) return 0;
        const interest = 0.05; // 5% flat rate
        const total = parseFloat(amount) * (1 + interest);
        return total / parseInt(duration);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'loans'), {
                userId: user.id,
                userName: user.name,
                amount: parseFloat(amount),
                purpose: purpose,
                duration: parseInt(duration),
                monthlyRepayment: calcMonthly(),
                totalRepayment: parseFloat(amount) * 1.05,
                status: 'Pending',
                date: new Date().toISOString()
            });
            setStep(1);
        } catch (error) {
            console.error("Error applying for loan", error);
        }
    };

    return (
        <MainLayout>
            <div className="dashboard-body grid-2-aside" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                
                {/* Left side: Loan Creation */}
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{t('loans.servicesTitle', language)}</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{t('loans.servicesSubtitle', language)}</p>
                    
                    <div className="widget-card" style={{ padding: '32px' }}>
                        {step === 0 ? (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Landmark size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{t('loans.newApplication', language)}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('loans.approvalTime', language)}</p>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('loans.amountLabel', language)}</label>
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                                        <input 
                                            type="number" 
                                            required
                                            max={user?.limit || 50000}
                                            placeholder={t('loans.amountPlaceholder', language)} 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC', fontSize: '16px' }} 
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('loans.durationLabel', language)}</label>
                                        <select 
                                            value={duration} 
                                            onChange={e => setDuration(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC' }}
                                        >
                                            <option value="6">{t('loans.months', language, { count: 6 })}</option>
                                            <option value="12">{t('loans.months', language, { count: 12 })}</option>
                                            <option value="24">{t('loans.months', language, { count: 24 })}</option>
                                            <option value="48">{t('loans.months', language, { count: 48 })}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('loans.purposeLabel', language)}</label>
                                        <select 
                                            value={purpose} 
                                            onChange={e => setPurpose(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC' }}
                                        >
                                            <option value="Personal">{t('loans.purposePersonal', language)}</option>
                                            <option value="Business">{t('loans.purposeBusiness', language)}</option>
                                            <option value="Real Estate">{t('loans.purposeRealEstate', language)}</option>
                                            <option value="Vehicle">{t('loans.purposeVehicle', language)}</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>{t('loans.estimatedRepaymentLabel', language)}</p>
                                        <p style={{ fontSize: '20px', fontWeight: 700, color: '#15803D' }}>{t('loans.monthlyRepayment', language, { amount: calcMonthly().toLocaleString('en-US', { minimumFractionDigits: 2 }) })}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '12px', color: '#166534' }}>{t('loans.interestRate', language)}</p>
                                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#15803D' }}>5.0%</p>
                                    </div>
                                </div>

                                <button type="submit" style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                                    {t('loans.submitApplication', language)} <ArrowRight size={18} />
                                </button>
                            </form>
                        ) : (
                            <div style={{ padding: '48px 0', textAlign: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px auto' }}>
                                    <CheckCircle2 size={40} color="#10B981" />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>{t('loans.applicationReceived', language)}</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '300px', margin: '0 auto 32px auto' }}>
                                    {t('loans.receivedBody', language, { amount: (parseFloat(amount) || 0).toLocaleString() })}
                                </p>
                                <button onClick={() => { setStep(0); setAmount(''); }} style={{ padding: '12px 24px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
                                    {t('loans.returnToLoans', language)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div className="widget-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white' }}>
                        <h3 style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>{t('loans.preApprovalLimit', language)}</h3>
                        <h2 style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-outfit)', marginBottom: '4px' }}>€{(user?.limit || 50000).toLocaleString('en-US', {minimumFractionDigits:2})}</h2>
                        <p style={{ fontSize: '13px', color: '#CBD5E1' }}>{t('loans.preApprovalBody', language)}</p>
                    </div>

                    <div className="widget-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>{t('loans.activeLoans', language)}</h3>
                        {(myLoans || []).filter(l => l.status === 'Approved').length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                                <CalendarDays size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('loans.noActiveLoans', language)}</p>
                            </div>
                        ) : myLoans.filter(l => l.status === 'Approved').map(loan => (
                            <div key={loan.id} style={{ padding: '16px', border: '1px solid #10B981', borderRadius: '12px', background: '#ECFDF5', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 600, color: '#065F46' }}>€{(loan.amount || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</h4>
                                        <p style={{ fontSize: '12px', color: '#047857' }}>{t('loans.activeDuration', language, { duration: loan.duration })}</p>
                                    </div>
                                    <CheckCircle2 size={24} color="#059669" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="widget-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>{t('loans.pastApplications', language)}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {(myLoans || []).filter(l => l.status !== 'Approved').map(loan => (
                                <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 600, fontSize: '14px' }}>€{(loan.amount || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</h4>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{loan.purpose} • {t('loans.requested', language)}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: loan.status === 'Rejected' ? '#DC2626' : '#D97706', fontWeight: 600 }}>{statusLabels[loan.status] || loan.status}</span>
                                </div>
                            ))}
                            {myLoans.filter(l => l.status !== 'Approved').length === 0 && (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('loans.noPreviousApplications', language)}</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
};

export default Loans;
