import React, { useState } from 'react';
import { 
    ShieldCheck, Lock, Mail, Eye, EyeOff, Building2, 
    ChevronRight, ArrowLeft, ShieldAlert 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AdminLogin = () => {
    const navigate = useNavigate();
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
                setError('Access denied. This account does not have administrator privileges.');
            }
        } catch (err) {
            console.error(err);
            setError('Invalid email or password. Please try again.');
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
                <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '8px' }}>Administrative Control Panel</p>
            </div>

            {/* Login Card */}
            <div style={{ 
                width: '100%', maxWidth: '440px', background: 'white', 
                borderRadius: '24px', padding: '48px', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Admin Portal</h2>
                    <p style={{ fontSize: '14px', color: '#64748B' }}>Enter your administrator credentials to continue.</p>
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
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Admin Email</label>
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
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Security Password</label>
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
                        {loading ? 'Authenticating...' : (
                            <>
                                Access Dashboard <ChevronRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <button 
                        onClick={() => navigate('/auth')}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                    >
                        <ArrowLeft size={16} /> User Login Portal
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', color: '#475569', fontSize: '12px', textAlign: 'center' }}>
                <p>© 2025 Finvex Banking Group. Internal Systems. Authorized access only.</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <span style={{ cursor: 'pointer' }}>Security Policy</span>
                    <span style={{ cursor: 'pointer' }}>Audits</span>
                    <span style={{ cursor: 'pointer' }}>System Status</span>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
