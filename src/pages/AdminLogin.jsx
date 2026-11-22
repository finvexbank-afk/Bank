import React, { useState } from 'react';
import { 
    ShieldCheck, Lock, Mail, Eye, EyeOff, Building2, 
    ChevronRight, ArrowLeft, ShieldAlert 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../components/LanguageSelector';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // CHECK IF USER IS ADMIN IN FIRESTORE
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                navigate('/admin');
            } else {
                // If not admin, sign out immediately
                await auth.signOut();
                setError(t('adminLogin.error.accessDenied', language));
            }
        } catch (err) {
            console.error(err);
            setError(t('adminLogin.error.invalidCredentials', language));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }}>
            {/* Language selector stays available on mobile */}
            <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <LanguageSelector position="inline" />
            </div>

            {/* Header / Logo */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <div style={{ 
                    width: '64px', height: '64px', background: '#3B82F6', 
                    borderRadius: '16px', display: 'flex', justifyContent: 'center', 
                    alignItems: 'center', margin: '0 auto 16px', color: 'white',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                }}>
                    <Building2 size={32} />
                </div>
                <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Finvex Bank</h1>
                <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '8px' }}>{t('adminLogin.subtitle', language)}</p>
            </div>

            {/* Login Card */}
            <div style={{ 
                width: '100%', maxWidth: '440px', background: 'white', 
                borderRadius: '24px', padding: '48px', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>{t('adminLogin.portal', language)}</h2>
                    <p style={{ fontSize: '14px', color: '#64748B' }}>{t('adminLogin.portalDesc', language)}</p>
                </div>

                {error && (
                    <div style={{ 
                        background: '#FEF2F2', border: '1px solid #FEE2E2', 
                        borderRadius: '12px', padding: '12px 16px', marginBottom: '24px',
                        display: 'flex', gap: '10px', alignItems: 'center', color: '#B91C1C',
                        fontSize: '13px', fontWeight: 500
                    }}>
                        <ShieldAlert size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>{t('adminLogin.email', language)}</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@finvex.com"
                                required
                                style={{ 
                                    width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px',
                                    border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>{t('adminLogin.password', language)}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{ 
                                    width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px',
                                    border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px'
                                }}
                            />
                            <div 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', padding: '16px', background: '#2563EB', color: 'white',
                            border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        {loading ? t('adminLogin.authenticating', language) : (
                            <>
                                {t('adminLogin.accessDashboard', language)} <ChevronRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <button 
                        onClick={() => navigate('/auth')}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                    >
                        <ArrowLeft size={16} /> {t('adminLogin.userLogin', language)}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', color: '#475569', fontSize: '12px', textAlign: 'center' }}>
                <p>{t('adminLogin.footer', language)}</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <span style={{ cursor: 'pointer' }}>{t('adminLogin.securityPolicy', language)}</span>
                    <span style={{ cursor: 'pointer' }}>{t('adminLogin.audits', language)}</span>
                    <span style={{ cursor: 'pointer' }}>{t('adminLogin.systemStatus', language)}</span>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
