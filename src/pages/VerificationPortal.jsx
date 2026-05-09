import React, { useState } from 'react';
import { 
  ShieldCheck, User, CheckCircle, XCircle, ChevronRight, 
  HelpCircle, MessageSquare, FileText, X, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';

const VerificationPortal = () => {
    const { user } = useAppContext();
    const navigate = useNavigate();

    if (!user) return null;

    const handleAccept = () => {
        navigate('/enrollment');
    };

    return (
        <MainLayout>
            <div className="dashboard-body" style={{ display: 'block', maxWidth: '1000px', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    <span>Dashboard</span>
                    <ChevronRight size={14} />
                    <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Account Verification</span>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>Identity Verification</h1>
                </div>

                {/* Success Banner (If Pending) */}
                {user.kycStatus === 'Pending' && (
                    <div style={{ 
                        marginBottom: '32px', width: '100%', background: 'white',
                        borderRadius: '16px', border: '1px solid #E2E8F0', borderLeft: '6px solid #10B981', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.4s ease-out'
                    }} className="flex-row-mobile">
                        <div style={{ width: '56px', height: '56px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <CheckCircle size={32} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{fontSize: '16px', fontWeight: 800, color: '#064E3B', marginBottom: '4px'}}>Application Submitted</h4>
                            <p style={{ color: '#065F46', fontSize: '14px', fontWeight: 500, lineHeight: 1.5 }}>
                                Your verification documents are currently under review by our audit team. You will be notified via email within 24-48 business hours.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    
                    {/* Card Header */}
                    <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC' }}>
                        <div style={{ color: '#0EA5E9' }}><ShieldCheck size={26} /></div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{user.kycStatus === 'Pending' ? 'Status: In Review' : 'Mandatory AML/KYC Verification'}</h3>
                    </div>

                    <div style={{ padding: 'clamp(24px, 5vw, 40px)' }}>
                        
                        {/* Welcome Box */}
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '32px', background: 'white' }}>
                            <div className="flex-row-mobile" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                                <div style={{ width: '56px', height: '56px', background: '#0EA5E9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>
                                    <User size={28} color="white" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Security Onboarding</h4>
                                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px', fontWeight: 500 }}>Complete the protocol to unlock global access</p>
                                    
                                    <div style={{ color: '#334155', lineHeight: 1.7, fontSize: '15px' }}>
                                        <p style={{ fontWeight: 800, marginBottom: '16px', color: '#1E293B' }}>Dear {user.name},</p>
                                        <p style={{ marginBottom: '16px' }}>To comply with international financial regulations and ensure the highest tier of security for your assets, we require a one-time identity verification (KYC).</p>
                                        <p style={{ marginBottom: '16px' }}>Our encrypted verification system is trusted by over two million institutional and retail clients worldwide. Processing is handled locally to guarantee your data sovereignty.</p>
                                        <p style={{ marginBottom: '16px' }}>Please review the terms of service below. Once accepted, you will be redirected to the secure document upload portal.</p>
                                        <p style={{ fontWeight: 600, color: '#0EA5E9' }}>Support: legal@finvex-bank.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms and Conditions (Only if NOT pending) */}
                        {user.kycStatus !== 'Pending' ? (
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: '#0EA5E9' }}>
                                    <FileText size={22} />
                                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>Service Agreement</h4>
                                </div>

                                <div style={{ 
                                    height: '250px', 
                                    overflowY: 'auto', 
                                    padding: '24px', 
                                    background: '#F8FAFC', 
                                    borderRadius: '16px', 
                                    fontSize: '14px', 
                                    color: '#64748B',
                                    border: '1px solid #E2E8F0',
                                    lineHeight: 1.7
                                }}>
                                    <p style={{fontWeight: 700, color: '#1E293B', marginBottom: '12px'}}>1. KYC COMPLIANCE</p>
                                    <p style={{marginBottom: '16px'}}>By proceeding, you agree to provide valid, government-issued identification. We utilize state-of-the-art encryption to protect your documentation. Accounts failing to verify within 30 days may face temporary service limitations.</p>
                                    
                                    <p style={{fontWeight: 700, color: '#1E293B', marginBottom: '12px'}}>2. DATA PROTECTION</p>
                                    <p style={{marginBottom: '16px'}}>Finvex Bank adheres to GDPR and international data standards. Your identity details are used strictly for regulatory compliance and are never shared with third-party marketing entities.</p>
                                    
                                    <p style={{fontWeight: 700, color: '#1E293B', marginBottom: '12px'}}>3. TERMINOLOGY</p>
                                    <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                                        <li><strong>IDENTITY DETAILS:</strong> Government ID, Passport, or Residency permits.</li>
                                        <li><strong>AML:</strong> Anti-Money Laundering regulatory framework.</li>
                                        <li><strong>USER:</strong> The legal individual holder of this banking account.</li>
                                    </ul>
                                </div>

                                <div className="flex-row-mobile" style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                    <button 
                                        onClick={handleAccept}
                                        style={{ 
                                            flex: 2,
                                            padding: '16px 32px', 
                                            background: '#0EA5E9', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '12px', 
                                            fontWeight: 800, 
                                            fontSize: '15px',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: '10px', 
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
                                        }}
                                    >
                                        <CheckCircle size={20} /> Accept & Start
                                    </button>
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        style={{ 
                                            flex: 1,
                                            padding: '16px 24px', 
                                            background: 'white', 
                                            color: '#64748B', 
                                            border: '1px solid #E2E8F0', 
                                            borderRadius: '12px', 
                                            fontWeight: 700, 
                                            fontSize: '15px',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: '8px', 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '60px 24px', textAlign: 'center', background: '#F8FAFC', borderRadius: '20px', marginBottom: '32px', border: '2px dashed #E2E8F0' }}>
                                <div style={{ width: '72px', height: '72px', background: '#F0F9FF', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', color: '#0EA5E9' }}>
                                    <Clock size={40} />
                                </div>
                                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>Validation Pending</h4>
                                <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                                    Our security department is currently auditing your submission. You will have full access to all banking features once the audit is approved.
                                </p>
                            </div>
                        )}

                        {/* Need Help Box */}
                        <div className="flex-row-mobile" style={{ background: '#F0F9FF', border: '1px solid #B9E6FE', borderRadius: '20px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', background: '#E0F2FE', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0EA5E9', flexShrink: 0 }}>
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>Need assistance?</h4>
                                    <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Live chat is available 24/7 for verification guidance.</p>
                                </div>
                            </div>
                            <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #B9E6FE', borderRadius: '10px', color: '#0EA5E9', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <MessageSquare size={18} /> Chat with Legal
                            </button>
                        </div>

                    </div>
                </div>

            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @media (max-width: 640px) {
                    .flex-row-mobile { flex-direction: column; align-items: stretch !important; text-align: center; }
                    .flex-row-mobile > div { align-items: center !important; }
                    .flex-row-mobile > button { width: 100% !important; }
                }
            `}</style>
        </MainLayout>
    );
};

export default VerificationPortal;
