import React, { useState } from 'react';
import { 
  Building2, ArrowRight, ShieldCheck, Mail, Lock, User, 
  AlertCircle, Eye, EyeOff, CheckCircle, Smartphone, 
  Globe, CreditCard, ChevronLeft, X
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAppContext } from '../AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import LanguageSelector from '../components/LanguageSelector';
import { countries } from '../data/countries';

const Auth = () => {
    const { user } = useAppContext();
    const { language } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    
    // Form fields
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        country: '',
        accountType: 'Checking',
        transactionPin: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [isEmailSent, setIsEmailSent] = useState(false);

    // Only redirect if NOT in the post-registration email-sent state
    if (user && !isEmailSent && localStorage.getItem('justRegistered') !== 'true') {
        return <Navigate to="/dashboard" />;
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.username) return setError(t('auth.errors.fillRequired', language));
        } else if (step === 2) {
            if (!formData.email || !formData.phone) return setError(t('auth.errors.emailPhoneRequired', language));
        } else if (step === 3) {
            if (!formData.transactionPin || formData.transactionPin.length !== 4) return setError(t('auth.errors.pinRequired', language));
        }
        setStep(step + 1);
    };

    const handlePrev = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        
        if (isLogin) {
            setLoading(true);
            try {
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                navigate('/dashboard');
            } catch (err) {
                setError(t('auth.errors.invalidCredentials', language));
                setLoading(false);
            }
        } else {
            if (formData.password !== formData.confirmPassword) return setError(t('auth.errors.passwordMismatch', language));
            if (!formData.termsAccepted) return setError(t('auth.errors.termsRequired', language));
            
            setLoading(true);
            try {
                // Block auto-redirect BEFORE creating the account
                localStorage.setItem('justRegistered', 'true');

                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const firebaseUser = userCredential.user;

                // Generate a unique account number
                const accountNumber = `${Date.now()}`.slice(-11);
                
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                    uid: firebaseUser.uid,
                    name: `${formData.firstName} ${formData.lastName}`,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    middleName: formData.middleName,
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                    country: formData.country,
                    accountType: formData.accountType,
                    accountNumber: accountNumber,
                    pin: formData.transactionPin,
                    balance: 0.00,
                    currency: 'USD',
                    accountStatus: 'Dormant',
                    kycStatus: 'Unverified',
                    role: 'client',
                    monthlyIncome: 0,
                    monthlyOutgoing: 0,
                    limit: 50000,
                    createdAt: new Date().toISOString()
                });

                // === Send REAL verification email via Firebase ===
                await sendEmailVerification(firebaseUser);
                
                // Show verification screen
                setIsEmailSent(true);
            } catch (err) {
                console.error("Auth error:", err);
                let msg = t('auth.errors.generalError', language);
                if (err.code === 'auth/email-already-in-use') msg = t('auth.errors.emailExists', language);
                setError(msg);
                setLoading(false);
            }
        }
    };

    return (
        <div className="auth-container" style={{ background: '#F8FAFC' }}>
            
            {/* Left side Banner - Blue */}
            <div className="auth-banner" style={{ 
                flex: 1, 
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: '48px', 
                position: 'relative', 
                overflow: 'hidden' 
            }}>
                {/* Circle Decorations */}
                <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: '10%', left: '10%' }}></div>
                <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: '5%', right: '5%' }}></div>
                
                <div style={{ maxWidth: '440px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ marginBottom: '32px' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={64} color="white" />
                            <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '4px', fontFamily: 'var(--font-outfit)' }}>FINVEX<br/>BANK.</h2>
                         </div>
                    </div>

                    <h1 style={{ fontSize: '42px', fontWeight: 700, marginBottom: '24px', fontFamily: 'var(--font-outfit)', lineHeight: 1.1 }}>{t('auth.title', language)}</h1>
                    <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: 1.5, marginBottom: '40px' }}>{t('auth.subtitle', language)}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={14} /></div>
                            <p style={{ fontSize: '15px', fontWeight: 500 }}>{t('auth.features.secure.title', language)} - <span style={{ opacity: 0.8 }}>{t('auth.features.secure.description', language)}</span></p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={14} /></div>
                            <p style={{ fontSize: '15px', fontWeight: 500 }}>{t('auth.features.fast.title', language)} - <span style={{ opacity: 0.8 }}>{t('auth.features.fast.description', language)}</span></p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={14} /></div>
                            <p style={{ fontSize: '15px', fontWeight: 500 }}>{t('auth.features.access.title', language)} - <span style={{ opacity: 0.8 }}>{t('auth.features.access.description', language)}</span></p>
                        </div>
                    </div>
                </div>

                {/* Bottom Left Language Selector */}
                <LanguageSelector position="bottom-left" />
            </div>

            {/* Right side Form */}
            <div className="auth-right">
                
                {isEmailSent ? (
                    <div style={{ width: '100%', maxWidth: '580px', background: 'white', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        {/* Header Blue */}
                        <div style={{ background: '#1DA1F2', padding: '40px', color: 'white', textAlign: 'center' }}>
                            <div style={{ width: '48px', height: '48px', border: '1px solid white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                                <Mail size={24} color="white" />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{t('auth.verification.title', language)}</h2>
                            <p style={{ fontSize: '14px', opacity: 0.9 }}>{t('auth.verification.subtitle', language)}</p>
                        </div>

                        <div style={{ padding: '32px' }}>
                            {/* Success Alert */}
                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderLeft: '4px solid #22C55E', borderRadius: '4px', padding: '16px', marginBottom: '40px', display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative' }}>
                                <CheckCircle size={20} color="#22C55E" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>{t('auth.verification.success', language)}</h4>
                                    <p style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                                        {t('auth.verification.message', language)}
                                    </p>
                                </div>
                                <button onClick={() => setIsEmailSent(false)} style={{ background: 'none', border: 'none', color: '#22C55E', cursor: 'pointer', position: 'absolute', top: '16px', right: '16px' }}><X size={16} /></button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <div style={{ width: '70px', height: '70px', background: '#38BDF8', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                                    <Mail size={32} color="white" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>{t('auth.verification.checkInbox', language)}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('auth.verification.checkInboxDesc', language)}</p>
                            </div>

                            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '24px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>{t('auth.verification.notReceived', language)}</h4>
                                <ol style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                                    <li>{t('auth.verification.troubleshoot.spam', language)}</li>
                                    <li>{t('auth.verification.troubleshoot.typo', language)}</li>
                                    <li>{t('auth.verification.troubleshoot.autocomplete', language)}</li>
                                </ol>
                            </div>

                            {/* Resend email */}
                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('auth.verification.notReceived', language)}</p>
                                <button 
                                    onClick={async () => {
                                        try {
                                            if (auth.currentUser) {
                                                await sendEmailVerification(auth.currentUser);
                                                alert(t('auth.verification.resend', language) + '!');
                                            }
                                        } catch(e) { alert('Veuillez patienter avant de renvoyer.'); }
                                    }}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {t('auth.verification.resend', language)}
                                </button>
                            </div>

                            {/* Dev Button: Remove in production! */}
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => { localStorage.removeItem('justRegistered'); navigate('/verify-account'); }} 
                                    style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    {t('auth.verification.devButton', language)}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="auth-form-card">
                        
                        {isLogin ? (
                            <>
                                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                                    <h1 style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-outfit)', marginBottom: '8px' }}>{t('auth.signIn.title', language)}</h1>
                                    <p style={{ color: 'var(--text-muted)' }}>{t('auth.signIn.subtitle', language)}</p>
                                </div>

                                {error && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', marginBottom: '24px', fontSize: '14px' }}>
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signIn.email', language)}</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} required />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signIn.password', language)}</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} required />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8' }}>
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button disabled={loading} type="submit" style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 600, marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                        {loading ? t('auth.loading', language) : t('auth.signIn.button', language)} <ArrowRight size={18} />
                                    </button>
                                </form>

                                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    {t('auth.signIn.noAccount', language)} <span onClick={() => { setIsLogin(false); setStep(1); }} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{t('auth.signIn.createAccount', language)}</span>
                                </div>
                            </>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h2 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>{t('auth.signUp.title', language)}</h2>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>{t('auth.signUp.step', language)} {step} {t('auth.signUp.of', language)} 4</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="auth-progress-bar">
                                    <div style={{ width: `${(step / 4) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'all 0.4s ease' }}></div>
                                </div>
                                <div className="auth-step-labels">
                                    <span style={{ color: step >= 1 ? 'var(--primary)' : 'var(--text-muted)' }}>{t('auth.signUp.steps.personal', language)}</span>
                                    <span style={{ color: step >= 2 ? 'var(--primary)' : 'var(--text-muted)' }}>{t('auth.signUp.steps.contact', language)}</span>
                                    <span style={{ color: step >= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>{t('auth.signUp.steps.account', language)}</span>
                                    <span style={{ color: step >= 4 ? 'var(--primary)' : 'var(--text-muted)' }}>{t('auth.signUp.steps.security', language)}</span>
                                </div>

                                {error && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', marginBottom: '24px', fontSize: '14px' }}>
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                )}

                                {step === 1 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                                                <User size={32} color="var(--primary)" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('auth.signUp.personal.title', language)}</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('auth.signUp.personal.subtitle', language)}</p>
                                        </div>
                                        <div className="auth-grid">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.personal.firstName', language)} *</label>
                                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Smith" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.personal.middleName', language)}</label>
                                                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="David" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.personal.lastName', language)} *</label>
                                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Smith" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.personal.username', language)} *</label>
                                                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="johnsmith123" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                         <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                                                <Mail size={32} color="var(--primary)" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('auth.signUp.contact.title', language)}</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('auth.signUp.contact.subtitle', language)}</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.contact.email', language)} *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.contact.phone', language)} *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Smartphone size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (234) 567-8901" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.contact.country', language)} *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Globe size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <select name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', background: 'white' }}>
                                                    <option value="">Select a country</option>
                                                    {countries.map((country, index) => (
                                                        <option key={index} value={country}>{country}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                                                <Building2 size={32} color="var(--primary)" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('auth.signUp.account.title', language)}</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('auth.signUp.account.subtitle', language)}</p>
                                        </div>
                                        <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.account.accountType', language)} *</label>
                                        <div className="auth-account-types">
                                            <div 
                                                onClick={() => setFormData({...formData, accountType: 'Checking'})}
                                                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: formData.accountType === 'Checking' ? '2px solid var(--primary)' : '1px solid #E2E8F0', background: formData.accountType === 'Checking' ? 'var(--primary-light)' : 'white', cursor: 'pointer', textAlign: 'center' }}
                                            >
                                                <CreditCard size={24} color={formData.accountType === 'Checking' ? 'var(--primary)' : '#94A3B8'} style={{ marginBottom: '8px' }} />
                                                <p style={{ fontSize: '14px', fontWeight: 600 }}>{t('auth.signUp.account.checking', language)}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('auth.signUp.account.checkingDesc', language)}</p>
                                            </div>
                                            <div 
                                                onClick={() => setFormData({...formData, accountType: 'Savings'})}
                                                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: formData.accountType === 'Savings' ? '2px solid var(--primary)' : '1px solid #E2E8F0', background: formData.accountType === 'Savings' ? 'var(--primary-light)' : 'white', cursor: 'pointer', textAlign: 'center' }}
                                            >
                                                <Building2 size={24} color={formData.accountType === 'Savings' ? 'var(--primary)' : '#94A3B8'} style={{ marginBottom: '8px' }} />
                                                <p style={{ fontSize: '14px', fontWeight: 600 }}>{t('auth.signUp.account.savings', language)}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('auth.signUp.account.savingsDesc', language)}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.account.pin', language)} *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type="password" name="transactionPin" maxLength={4} value={formData.transactionPin} onChange={handleChange} placeholder="••••" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', letterSpacing: '8px' }} />
                                            </div>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('auth.signUp.account.pinDesc', language)}</p>
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                                                <ShieldCheck size={32} color="var(--primary)" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{t('auth.signUp.security.title', language)}</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('auth.signUp.security.subtitle', language)}</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.security.password', language)} *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8' }}>
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('auth.signUp.security.confirmPassword', language)} *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                        </div>
                                        <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} style={{ marginTop: '3px', accentColor: 'var(--primary)' }} />
                                            <span>{t('auth.signUp.security.terms', language)} <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</a></span>
                                        </label>
                                    </div>
                                )}

                                <div className="auth-buttons">
                                    {step > 1 && (
                                        <button onClick={handlePrev} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                            <ChevronLeft size={18} /> {t('auth.signUp.previous', language) || 'Previous'}
                                        </button>
                                    )}
                                    <button 
                                        onClick={step === 4 ? handleSubmit : handleNext} 
                                        disabled={loading}
                                        style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        {loading ? t('auth.loading', language) : step === 4 ? t('auth.signUp.createAccount', language) || 'Create Account' : t('auth.signUp.next', language) || 'Next'} {step < 4 && <ArrowRight size={18} />}
                                    </button>
                                </div>

                                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    {t('auth.signUp.hasAccount', language) || 'Already have an account?'} <span onClick={() => setIsLogin(true)} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{t('auth.signIn.title', language)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;
