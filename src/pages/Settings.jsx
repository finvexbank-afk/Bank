import React, { useState } from 'react';
import { 
    User, Lock, Bell, Globe, Shield, Save, CheckCircle2, 
    Camera, ChevronRight, Copy, Mail, Calendar, Phone, 
    Smartphone, HelpCircle, MessageSquare, ExternalLink, Landmark, Download
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { getBankDetails, downloadRIB } from '../utils/bankDetails';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

const Settings = () => {
    const { user, setUser } = useAppContext();
    const { language } = useLanguage();
    if (!user) return null;

    const [activeTab, setActiveTab] = useState('profile');
    const [showSuccess, setShowSuccess] = useState(false);

    // Form states
    const [firstName, setFirstName] = useState(user.name?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(user.name?.split(' ')[1] || '');
    const [email, setEmail] = useState(user.email || '');
    const [phone, setPhone] = useState(user.phone || '+3246001020304');
    const [dob, setDob] = useState(user.dob || '01/01/1990');
    const bankDetails = getBankDetails(user);

    const handleSave = (e) => {
        e.preventDefault();
        setUser({ ...user, name: `${firstName} ${lastName}`, email, phone, dob });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert(t('settings.alert.accountCopied', language));
    };

    return (
        <MainLayout>
            <div className="settings-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                
                {/* Header Section */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{t('settings.title', language)}</h1>
                    <p style={{ fontSize: '13px', color: '#64748B' }}>{t('settings.breadcrumb.dashboard', language)} {'\u003E'} <span style={{fontWeight:600, color:'#1E293B'}}>{t('settings.breadcrumb.settings', language)}</span></p>
                </div>

                <div className="grid-2-settings">
                    
                    {/* Left side: Navigation & Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Profile Summary Card */}
                        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <div style={{ background: 'linear-gradient(135deg, #0EA5E9, #2563EB)', padding: '40px 24px', textAlign: 'center', position: 'relative' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'white', margin: '0 auto 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', border: '5px solid rgba(255,255,255,0.2)' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <User size={40} />
                                    </div>
                                    <button style={{ position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#64748B' }}>
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{firstName} {lastName}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{t('settings.accountLabel', language, { number: user.accountNumber || '85979175073' })}</p>
                                
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20px', overflow: 'hidden', lineHeight: 0 }}>
                                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{height: '100%', width: '100%'}}>
                                        <path d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{stroke: 'none', fill: 'white'}}></path>
                                    </svg>
                                </div>
                            </div>

                            <div style={{ padding: '24px' }}>
                                <NavTab 
                                    active={activeTab === 'profile'} 
                                    icon={<User size={18} />} 
                                    label={t('settings.nav.profile', language)} 
                                    onClick={() => setActiveTab('profile')} 
                                />
                                <NavTab 
                                    active={activeTab === 'bank'} 
                                    icon={<Landmark size={18} />} 
                                    label={t('settings.nav.bank', language)} 
                                    onClick={() => setActiveTab('bank')} 
                                />
                                <NavTab 
                                    active={activeTab === 'security'} 
                                    icon={<Shield size={18} />} 
                                    label={t('settings.nav.security', language)} 
                                    onClick={() => setActiveTab('security')} 
                                />
                                <NavTab 
                                    active={activeTab === 'pin'} 
                                    icon={<Lock size={18} />} 
                                    label={t('settings.nav.pin', language)} 
                                    onClick={() => setActiveTab('pin')} 
                                />
                            </div>
                        </div>

                        {/* Help Card */}
                        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0EA5E9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                                    <HelpCircle size={20} />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>{t('settings.help.title', language)}</h4>
                            </div>
                            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
                                {t('settings.help.text', language)}
                            </p>
                            <button style={{ color: '#0EA5E9', background: 'none', border: 'none', padding: 0, fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {t('settings.help.button', language)} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right side: Content Area */}
                    <div className="settings-content-card" style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: 'clamp(20px, 5vw, 40px)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        {activeTab === 'profile' && (
                            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <User size={20} color="#0EA5E9" />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{t('settings.nav.profile', language)}</h3>
                                </div>
                                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '32px' }}>{t('settings.profile.subtitle', language)}</p>

                                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                                        <InputGroup label={t('settings.form.firstName', language)} icon={<User size={18} color="#94A3B8" />} value={firstName} onChange={setFirstName} />
                                        <InputGroup label={t('settings.form.lastName', language)} icon={<User size={18} color="#94A3B8" />} value={lastName} onChange={setLastName} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>{t('settings.form.accountNumber', language)}</label>
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <div style={{ position: 'absolute', left: '16px', color: '#94A3B8' }}>#</div>
                                            <input 
                                                readOnly 
                                                value={user.accountNumber || '85979175073'} 
                                                style={{ width: '100%', padding: '16px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '15px', fontWeight: 600, color: '#1E293B' }} 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => copyToClipboard(user.accountNumber || '85979175073')}
                                                style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>{t('settings.form.accountHint', language)}</p>
                                    </div>

                                    <InputGroup label={t('settings.form.email', language)} icon={<Mail size={18} color="#94A3B8" />} value={email} onChange={setEmail} type="email" />
                                    <InputGroup label={t('settings.form.dob', language)} icon={<Calendar size={18} color="#94A3B8" />} value={dob} onChange={setDob} placeholder="DD/MM/YYYY" />
                                    <InputGroup label={t('settings.form.phone', language)} icon={<Phone size={18} color="#94A3B8" />} value={phone} onChange={setPhone} />

                                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" style={{ width: '100%', maxWidth: '280px', padding: '16px 32px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)', transition: 'transform 0.2s' }}>
                                            {showSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                            {showSuccess ? t('settings.form.saved', language) : t('settings.form.save', language)}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'bank' && (
                            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <Landmark size={20} color="#0EA5E9" />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{t('settings.bank.title', language)}</h3>
                                </div>
                                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>{t('settings.bank.subtitle', language)}</p>

                                <div style={{ background: 'linear-gradient(135deg, #0284C7, #0EA5E9)', borderRadius: '18px', padding: '24px', color: 'white', marginBottom: '24px' }}>
                                    <p style={{ fontSize: '11px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{t('settings.bank.iban', language)}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: 700, wordBreak: 'break-all', flex: 1, minWidth: '200px' }}>{bankDetails.iban}</h2>
                                        <button type="button" onClick={() => copyToClipboard(bankDetails.ibanRaw)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, cursor: 'pointer' }}>
                                            <Copy size={16} /> {t('settings.bank.copy', language)}
                                        </button>
                                    </div>
                                    <p style={{ marginTop: '16px', fontSize: '13px', opacity: 0.9 }}>{t('settings.bank.bic', language)} : <strong>{bankDetails.bic}</strong></p>
                                </div>

                                <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                                    {[
                                        [t('settings.bank.holder', language), bankDetails.accountHolder],
                                        [t('settings.bank.bank', language), bankDetails.bankName],
                                        [t('settings.bank.address', language), bankDetails.bankAddress],
                                        [t('settings.bank.branch', language), `${bankDetails.bankCode} / ${bankDetails.branchCode}`],
                                        [t('settings.form.accountNumber', language), bankDetails.accountNumber],
                                        [t('settings.bank.key', language), bankDetails.ribKey],
                                        [t('settings.bank.type', language), bankDetails.accountType],
                                        [t('settings.bank.currency', language), bankDetails.currency]
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '14px 18px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '13px', color: '#64748B' }}>{label}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', wordBreak: 'break-all', textAlign: 'right' }}>{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <button type="button" onClick={() => downloadRIB(user, language)} style={{ width: '100%', maxWidth: '320px', padding: '15px 24px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}>
                                    <Download size={18} /> {t('settings.bank.download', language)}
                                </button>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <Shield size={20} color="#0EA5E9" />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{t('settings.nav.security', language)}</h3>
                                </div>
                                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '32px' }}>{t('settings.security.subtitle', language)}</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <button style={{ padding: '20px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0EA5E9' }}><Lock size={20} /></div>
                                            <div style={{ textAlign: 'left' }}><h4 style={{ fontWeight: 700, fontSize: '15px' }}>{t('settings.security.password.title', language)}</h4><p style={{ fontSize: '13px', color: '#64748B' }}>{t('settings.security.password.subtitle', language)}</p></div>
                                        </div>
                                        <ChevronRight size={20} color="#94A3B8" />
                                    </button>

                                    <button style={{ padding: '20px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0EA5E9' }}><Smartphone size={20} /></div>
                                            <div style={{ textAlign: 'left' }}><h4 style={{ fontWeight: 700, fontSize: '15px' }}>{t('settings.security.twoFactor.title', language)}</h4><p style={{ fontSize: '13px', color: '#64748B' }}>{t('settings.security.twoFactor.subtitle', language)}</p></div>
                                        </div>
                                        <div style={{ background: '#CBD5E1', width: '40px', height: '20px', borderRadius: '10px', position: 'relative' }}>
                                            <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', left: '2px', top: '2px' }}></div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @media (max-width: 480px) {
                    .settings-content-card { padding: 20px !important; }
                }
            `}</style>
        </MainLayout>
    );
};

const NavTab = ({ active, icon, label, onClick }) => (
    <button 
        onClick={onClick}
        style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '16px', 
            background: active ? '#F0F9FF' : 'transparent', 
            color: active ? '#0EA5E9' : '#64748B', 
            border: active ? '1px solid #B9E6FE' : '1px solid transparent', 
            borderRadius: '12px', 
            fontWeight: 700, 
            fontSize: '14px', 
            cursor: 'pointer', 
            transition: '0.2s',
            marginBottom: '8px'
        }}
    >
        {icon} <span style={{ flex: 1, textAlign: 'left' }}>{label}</span> <ChevronRight size={16} style={{ opacity: active ? 1 : 0 }} />
    </button>
);

const InputGroup = ({ label, icon, value, onChange, type = "text", placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>{label}</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '16px' }}>{icon}</div>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ 
                    width: '100%', 
                    padding: '16px 16px 16px 48px', 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0', 
                    background: '#F8FAFC', 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    color: '#1E293B',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                }} 
                onFocus={(e) => e.target.style.borderColor = '#0EA5E9'}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
        </div>
    </div>
);

export default Settings;
