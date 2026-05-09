import React, { useState } from 'react';
import { 
    User, Lock, Bell, Globe, Shield, Save, CheckCircle2, 
    Camera, ChevronRight, Copy, Mail, Calendar, Phone, 
    Smartphone, HelpCircle, MessageSquare, ExternalLink
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';

const Settings = () => {
    const { user, setUser } = useAppContext();
    if (!user) return null;

    const [activeTab, setActiveTab] = useState('profile');
    const [showSuccess, setShowSuccess] = useState(false);

    // Form states
    const [firstName, setFirstName] = useState(user.name?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(user.name?.split(' ')[1] || '');
    const [email, setEmail] = useState(user.email || '');
    const [phone, setPhone] = useState(user.phone || '+3246001020304');
    const [dob, setDob] = useState(user.dob || '01/01/1990');

    const handleSave = (e) => {
        e.preventDefault();
        setUser({ ...user, name: `${firstName} ${lastName}`, email, phone, dob });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Account number copied!");
    };

    return (
        <MainLayout>
            <div className="settings-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                
                {/* Header Section */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Account Settings</h1>
                    <p style={{ fontSize: '13px', color: '#64748B' }}>Dashboard {'\u003E'} <span style={{fontWeight:600, color:'#1E293B'}}>Settings</span></p>
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
                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Account #{user.accountNumber || '85979175073'}</p>
                                
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
                                    label="Profile Information" 
                                    onClick={() => setActiveTab('profile')} 
                                />
                                <NavTab 
                                    active={activeTab === 'security'} 
                                    icon={<Shield size={18} />} 
                                    label="Security Settings" 
                                    onClick={() => setActiveTab('security')} 
                                />
                                <NavTab 
                                    active={activeTab === 'pin'} 
                                    icon={<Lock size={18} />} 
                                    label="Transaction PIN" 
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
                                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Need Help?</h4>
                            </div>
                            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
                                Contact our support team if you need assistance with your account settings or have any questions.
                            </p>
                            <button style={{ color: '#0EA5E9', background: 'none', border: 'none', padding: 0, fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Contact Support <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right side: Content Area */}
                    <div className="settings-content-card" style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: 'clamp(20px, 5vw, 40px)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        {activeTab === 'profile' && (
                            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <User size={20} color="#0EA5E9" />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Profile Information</h3>
                                </div>
                                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '32px' }}>Your personal information and account details</p>

                                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                                        <InputGroup label="First Name" icon={<User size={18} color="#94A3B8" />} value={firstName} onChange={setFirstName} />
                                        <InputGroup label="Last Name" icon={<User size={18} color="#94A3B8" />} value={lastName} onChange={setLastName} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>Account Number</label>
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
                                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>This is your unique account identifier</p>
                                    </div>

                                    <InputGroup label="Email Address" icon={<Mail size={18} color="#94A3B8" />} value={email} onChange={setEmail} type="email" />
                                    <InputGroup label="Date of Birth" icon={<Calendar size={18} color="#94A3B8" />} value={dob} onChange={setDob} placeholder="DD/MM/YYYY" />
                                    <InputGroup label="Phone Number" icon={<Phone size={18} color="#94A3B8" />} value={phone} onChange={setPhone} />

                                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" style={{ width: '100%', maxWidth: '280px', padding: '16px 32px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)', transition: 'transform 0.2s' }}>
                                            {showSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                            {showSuccess ? 'Saved successfully' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <Shield size={20} color="#0EA5E9" />
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Security Settings</h3>
                                </div>
                                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '32px' }}>Manage your account security and authentication</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <button style={{ padding: '20px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0EA5E9' }}><Lock size={20} /></div>
                                            <div style={{ textAlign: 'left' }}><h4 style={{ fontWeight: 700, fontSize: '15px' }}>Change Password</h4><p style={{ fontSize: '13px', color: '#64748B' }}>Update your login password regularly</p></div>
                                        </div>
                                        <ChevronRight size={20} color="#94A3B8" />
                                    </button>

                                    <button style={{ padding: '20px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0EA5E9' }}><Smartphone size={20} /></div>
                                            <div style={{ textAlign: 'left' }}><h4 style={{ fontWeight: 700, fontSize: '15px' }}>Two-Factor Authentication</h4><p style={{ fontSize: '13px', color: '#64748B' }}>Add an extra layer of security</p></div>
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
