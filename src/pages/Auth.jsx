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

const Auth = () => {
    const { user } = useAppContext();
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
        country: 'United States',
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
            if (!formData.firstName || !formData.lastName || !formData.username) return setError('Please fill all required fields.');
        } else if (step === 2) {
            if (!formData.email || !formData.phone) return setError('Email and Phone are required.');
        } else if (step === 3) {
            if (!formData.transactionPin || formData.transactionPin.length !== 4) return setError('Please enter a 4-digit PIN.');
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
                setError("Invalid email or password.");
                setLoading(false);
            }
        } else {
            if (formData.password !== formData.confirmPassword) return setError("Passwords do not match.");
            if (!formData.termsAccepted) return setError("Please accept the terms and conditions.");
            
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
                let msg = "An error occurred.";
                if (err.code === 'auth/email-already-in-use') msg = "This email is already registered.";
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

                    <h1 style={{ fontSize: '42px', fontWeight: 700, marginBottom: '24px', fontFamily: 'var(--font-outfit)', lineHeight: 1.1 }}>Start Banking with Us</h1>
                    <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: 1.5, marginBottom: '40px' }}>Create your Finvex Bank account in just a few steps and enjoy our full range of banking services.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={14} /></div>
                            <p style={{ fontSize: '15px', fontWeight: 500 }}>Secure Banking Platform - <span style={{ opacity: 0.8 }}>Industry-leading security protocols to keep your funds safe</span></p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={14} /></div>
                            <p style={{ fontSize: '15px', fontWeight: 500 }}>Fast Transfers - <span style={{ opacity: 0.8 }}>Send and receive money quickly to anyone, anywhere</span></p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={14} /></div>
                            <p style={{ fontSize: '15px', fontWeight: 500 }}>24/7 Account Access - <span style={{ opacity: 0.8 }}>Manage your finances anytime, anywhere on any device</span></p>
                        </div>
                    </div>
                </div>

                {/* Bottom Left Language Selector */}
                <div style={{ position: 'absolute', bottom: '32px', left: '32px', background: 'white', padding: '8px 16px', borderRadius: '8px', color: '#1E293B', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <img src="https://flagcdn.com/w20/gb.png" width="20" alt="EN" />
                    EN <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} />
                </div>
            </div>

            {/* Right side Form */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', padding: '40px', justifyContent: 'center', alignItems: 'center', background: '#F1F5F9' }}>
                
                {isEmailSent ? (
                    <div style={{ width: '100%', maxWidth: '580px', background: 'white', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        {/* Header Blue */}
                        <div style={{ background: '#1DA1F2', padding: '40px', color: 'white', textAlign: 'center' }}>
                            <div style={{ width: '48px', height: '48px', border: '1px solid white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                                <Mail size={24} color="white" />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Vérifiez votre adresse e-mail</h2>
                            <p style={{ fontSize: '14px', opacity: 0.9 }}>Veuillez vérifier votre boîte de réception pour le lien de vérification</p>
                        </div>

                        <div style={{ padding: '32px' }}>
                            {/* Success Alert */}
                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderLeft: '4px solid #22C55E', borderRadius: '4px', padding: '16px', marginBottom: '40px', display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative' }}>
                                <CheckCircle size={20} color="#22C55E" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>Succès</h4>
                                    <p style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                                        Votre inscription a réussi. Un lien de vérification a été envoyé à votre adresse e-mail. Veuillez cliquer dessus pour vérifier votre adresse e-mail.
                                    </p>
                                </div>
                                <button onClick={() => setIsEmailSent(false)} style={{ background: 'none', border: 'none', color: '#22C55E', cursor: 'pointer', position: 'absolute', top: '16px', right: '16px' }}><X size={16} /></button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <div style={{ width: '70px', height: '70px', background: '#38BDF8', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                                    <Mail size={32} color="white" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Vérifiez votre boîte de réception</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Nous vous avons envoyé un e-mail avec un lien pour confirmer votre compte</p>
                            </div>

                            <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '24px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Vous n'avez pas reçu l'e-mail ?</h4>
                                <ol style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                                    <li>L'e-mail peut être dans votre dossier spam</li>
                                    <li>L'adresse e-mail que vous avez saisie peut contenir une faute de frappe.</li>
                                    <li>Vous avez peut-être accidentellement saisi une autre adresse e-mail (cela se produit généralement avec la saisie semi-automatique)</li>
                                </ol>
                            </div>

                            {/* Resend email */}
                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Vous n'avez toujours pas reçu l'email ?</p>
                                <button 
                                    onClick={async () => {
                                        try {
                                            if (auth.currentUser) {
                                                await sendEmailVerification(auth.currentUser);
                                                alert('Email de vérification renvoyé !');
                                            }
                                        } catch(e) { alert('Veuillez patienter avant de renvoyer.'); }
                                    }}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Renvoyer l'email de vérification
                                </button>
                            </div>

                            {/* Dev Button: Remove in production! */}
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => { localStorage.removeItem('justRegistered'); navigate('/verify-account'); }} 
                                    style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    [DEV] Aller au Dashboard sans vérifier l'email
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ width: '100%', maxWidth: '580px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '48px' }}>
                        
                        {isLogin ? (
                            <>
                                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                                    <h1 style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-outfit)', marginBottom: '8px' }}>Sign In</h1>
                                    <p style={{ color: 'var(--text-muted)' }}>Access your Finvex Bank account</p>
                                </div>

                                {error && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', marginBottom: '24px', fontSize: '14px' }}>
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600 }}>Email Address</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} required />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600 }}>Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} required />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8' }}>
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button disabled={loading} type="submit" style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 600, marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                        {loading ? 'Entering...' : 'Sign In'} <ArrowRight size={18} />
                                    </button>
                                </form>

                                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Don't have an account? <span onClick={() => { setIsLogin(false); setStep(1); }} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Create Account</span>
                                </div>
                            </>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h2 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>Create Your Account</h2>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Step {step} of 4</span>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(step / 4) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'all 0.4s ease' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: step >= 1 ? 'var(--primary)' : 'var(--text-muted)' }}>Personal Info</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: step >= 2 ? 'var(--primary)' : 'var(--text-muted)' }}>Contact Details</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: step >= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>Account Setup</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: step >= 4 ? 'var(--primary)' : 'var(--text-muted)' }}>Security</span>
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
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Personal Information</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Please provide your legal name as it appears on official documents</p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>Legal First Name *</label>
                                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Smith" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>Middle Name</label>
                                                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="David" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>Legal Last Name *</label>
                                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Smith" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600 }}>Username *</label>
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
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Contact Information</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>We'll use these details to communicate with you about your account</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>Email Address *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>Phone Number *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Smartphone size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (234) 567-8901" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>Country *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Globe size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <select name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', background: 'white' }}>
                                                    <option>United States</option>
                                                    <option>France</option>
                                                    <option>United Kingdom</option>
                                                    <option>Canada</option>
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
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Account Setup</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Choose your account type and set up your transaction PIN</p>
                                        </div>
                                        <label style={{ fontSize: '13px', fontWeight: 600 }}>Account Type *</label>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div 
                                                onClick={() => setFormData({...formData, accountType: 'Checking'})}
                                                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: formData.accountType === 'Checking' ? '2px solid var(--primary)' : '1px solid #E2E8F0', background: formData.accountType === 'Checking' ? 'var(--primary-light)' : 'white', cursor: 'pointer', textAlign: 'center' }}
                                            >
                                                <CreditCard size={24} color={formData.accountType === 'Checking' ? 'var(--primary)' : '#94A3B8'} style={{ marginBottom: '8px' }} />
                                                <p style={{ fontSize: '14px', fontWeight: 600 }}>Checking Account</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Perfect for daily transactions</p>
                                            </div>
                                            <div 
                                                onClick={() => setFormData({...formData, accountType: 'Savings'})}
                                                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: formData.accountType === 'Savings' ? '2px solid var(--primary)' : '1px solid #E2E8F0', background: formData.accountType === 'Savings' ? 'var(--primary-light)' : 'white', cursor: 'pointer', textAlign: 'center' }}
                                            >
                                                <Building2 size={24} color={formData.accountType === 'Savings' ? 'var(--primary)' : '#94A3B8'} style={{ marginBottom: '8px' }} />
                                                <p style={{ fontSize: '14px', fontWeight: 600 }}>Savings Account</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Earn interest on deposits</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>Transaction PIN (4 digits) *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type="password" name="transactionPin" maxLength={4} value={formData.transactionPin} onChange={handleChange} placeholder="••••" style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', letterSpacing: '8px' }} />
                                            </div>
                                            <p style={{ fontSize: '11px', color: 'var(--text_muted)' }}>Your PIN will be required to authorize transactions</p>
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                                                <ShieldCheck size={32} color="var(--primary)" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Secure Your Account</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Create a strong password to protect your account</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>Password *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8' }}>
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600 }}>Confirm Password *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                                                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                                            </div>
                                        </div>
                                        <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} style={{ marginTop: '3px', accentColor: 'var(--primary)' }} />
                                            <span>I agree to the <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</a></span>
                                        </label>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                    {step > 1 && (
                                        <button onClick={handlePrev} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                            <ChevronLeft size={18} /> Previous
                                        </button>
                                    )}
                                    <button 
                                        onClick={step === 4 ? handleSubmit : handleNext} 
                                        disabled={loading}
                                        style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        {loading ? 'Processing...' : step === 4 ? 'Create Account' : 'Next'} {step < 4 && <ArrowRight size={18} />}
                                    </button>
                                </div>

                                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Already have an account? <span onClick={() => setIsLogin(true)} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Sign in instead</span>
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
