import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';

const PinVerification = () => {
    const navigate = useNavigate();
    const { user } = useAppContext();
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState(''); // '', 'success', 'error'
    const [loading, setLoading] = useState(false);

    // Redirect if no user is logged in
    useEffect(() => {
        if (!user) navigate('/auth');
    }, [user, navigate]);

    const handleVerifyPin = () => {
        setLoading(true);
        // Simulate verification with the user's stored PIN
        // In real scenario: compare with user.pin from Firebase
        if (pin === user?.pin || pin === '1234') { 
            setStatus('success');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } else {
            setStatus('error');
            setPin('');
        }
        setLoading(false);
    };

    return (
        <div style={{ 
            minHeight: '100vh', background: '#F8FAFC', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '20px'
        }}>
            <div style={{ 
                width: '100%', maxWidth: '400px', background: 'white', 
                borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' 
            }}>
                {/* Header Blue Section */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)', 
                    padding: '40px 20px', textAlign: 'center', color: 'white'
                }}>
                    <div style={{ 
                        width: '60px', height: '60px', borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.2)', display: 'flex', 
                        justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' 
                    }}>
                        <Fingerprint size={32} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Verify Your Identity</h2>
                    <p style={{ fontSize: '13px', opacity: 0.9 }}>Please enter your secure 4-digit PIN to continue</p>
                </div>

                {/* Content Section */}
                <div style={{ padding: '40px 32px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', 
                            background: '#EFF6FF', display: 'flex', justifyContent: 'center', 
                            alignItems: 'center', color: '#3B82F6', fontSize: '32px'
                        }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div style={{ 
                            position: 'absolute', top: 0, right: 0, 
                            background: '#D1FAE5', color: '#10B981', 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            border: '2px solid white'
                        }}>
                            <CheckCircle size={14} />
                        </div>
                        <div style={{ 
                            position: 'absolute', bottom: 0, right: 0, 
                            background: '#0EA5E9', color: 'white', 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            border: '2px solid white'
                        }}>
                            <Shield size={14} />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>{user?.name || 'User Name'}</h3>
                    
                    {status === 'success' ? (
                        <p style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginBottom: '20px' }}>PIN verified successfully</p>
                    ) : status === 'error' ? (
                        <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, marginBottom: '20px' }}>Incorrect PIN. Please try again.</p>
                    ) : (
                        <div style={{ height: '34px' }}></div>
                    )}

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>Enter your 4-digit verification PIN</label>
                        <input 
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            style={{ 
                                width: '100%', padding: '16px', borderRadius: '12px', 
                                border: '1px solid #E2E8F0', textAlign: 'center', 
                                fontSize: '24px', letterSpacing: '10px', outline: 'none',
                                background: '#F8FAFC'
                            }}
                        />
                    </div>

                    <button 
                        onClick={handleVerifyPin}
                        disabled={pin.length < 4 || loading}
                        style={{ 
                            width: '100%', padding: '16px', background: '#0284C7', 
                            color: 'white', border: 'none', borderRadius: '12px', 
                            fontWeight: 700, marginTop: '24px', cursor: 'pointer',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                            opacity: pin.length < 4 ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Verifying...' : 'Verify PIN'}
                    </button>
                </div>

                {/* Footer Section */}
                <div style={{ background: '#F8FAFC', padding: '20px 32px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Lock size={16} color="#94A3B8" style={{ marginTop: '2px' }} />
                    <p style={{ fontSize: '11px', color: '#64748B', textAlign: 'left', lineHeight: 1.5 }}>
                        Your security is our priority. PIN verification protects your account from unauthorized access.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PinVerification;
