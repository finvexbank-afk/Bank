import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, GaugeCircle, CreditCard,
  User, EyeOff, Shield, ShieldAlert, Send, Activity,
  Clock, BarChart3, Calendar, Zap, ChevronRight, CheckCircle2,
  Wallet, History, HelpCircle, MessageSquare, Globe, Plus, Hash, Timer
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import MainLayout from '../components/MainLayout';
import '../index.css';

const Dashboard = () => {
    const { user, transactions, setIsTransferModalOpen } = useAppContext();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR'));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('fr-FR'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    
    if (!user) return null;
    
    if (user.kycStatus === 'Unverified') {
        return <Navigate to="/verify-account" />;
    }

    const formatMoney = (amount) => {
        const val = amount || 0;
        return '€' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
    };
  
    return (
        <MainLayout>
            <div className="dashboard-body">
                
                <div className="main-panel">
                    
                    {/* Top Stats Row */}
                    <div className="grid-stats">
                        <StatBox label="Current Balance" value={formatMoney(user.balance)} icon={<Wallet size={18} />} color="#0EA5E9" active />
                        <StatBox label="Monthly Income" value={formatMoney(user.monthlyIncome || 0)} icon={<ArrowUpRight size={18} />} color="#10B981" />
                        <StatBox label="Monthly Outgoing" value={formatMoney(0)} icon={<ArrowDownRight size={18} />} color="#EF4444" />
                        <StatBox label="Transaction Limit" value={formatMoney(500000)} icon={<Activity size={18} />} color="#8B5CF6" />
                    </div>

                    {/* Main Balance Card */}
                    <div className="main-card-premium" style={{ 
                        background: 'linear-gradient(135deg, #0284C7, #0369A1)', 
                        borderRadius: '24px', 
                        padding: '32px 24px', 
                        color: 'white', 
                        position: 'relative', 
                        overflow: 'hidden',
                        marginBottom: '40px',
                        boxShadow: '0 10px 30px rgba(3, 105, 161, 0.15)',
                        width: '100%'
                    }}>
                        <div style={{ position: 'absolute', top: '24px', right: '32px', textAlign: 'right' }} className="time-box-mobile">
                            <h4 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{currentTime}</h4>
                            <p style={{ fontSize: '11px', opacity: 0.8 }}>mardi 27 mai 2025</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <User size={28} />
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '2px' }}>Good Morning</p>
                                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{user.name?.split(' ')[0] || 'User'}</h3>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <p style={{ fontSize: '15px', fontWeight: 500, opacity: 0.9, marginBottom: '8px' }}>Available Balance</p>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <h2 style={{ fontSize: 'clamp(24px, 8vw, 42px)', fontWeight: 800, margin: 0 }}>{formatMoney(user.balance)}</h2>
                                <span style={{ fontSize: '16px', opacity: 0.8, fontWeight: 700 }}>EUR</span>
                                <EyeOff size={18} style={{ cursor: 'pointer', opacity: 0.6 }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Shield size={18} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>
                                        Account Number 
                                        <span style={{ 
                                            padding: '1px 8px', 
                                            borderRadius: '8px', 
                                            background: user.accountStatus === 'Dormant' ? '#EF4444' : '#10B981', 
                                            color: 'white',
                                            fontSize: '9px', 
                                            fontWeight: 800,
                                            marginLeft: '8px'
                                        }}>
                                            {user.accountStatus === 'Dormant' ? '• Inactive' : '• Active'}
                                        </span>
                                    </p>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, wordBreak: 'break-all', opacity: 0.95 }}>{user.accountNumber || '85979175073'}</h4>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => navigate('/transactions')} style={{ flex: 1, padding: '12px', background: 'white', color: '#0369A1', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Activity size={16} /> Transactions
                                </button>
                                <button onClick={() => navigate('/deposit')} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Wallet size={16} /> Top up
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div style={{ marginBottom: '48px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>What would you like to do today?</h3>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Choose from our popular actions below</p>
                        <div className="grid-actions">
                            <QuickActionBox icon={<Hash size={24} />} label="Account Info" onClick={() => navigate('/settings')} />
                            <QuickActionBox icon={<Send size={24} />} label="Send Money" onClick={() => setIsTransferModalOpen(true)} color="#0EA5E9" />
                            <QuickActionBox icon={<Plus size={24} />} label="Deposit" onClick={() => navigate('/deposit')} color="#D1FAE5" iconColor="#059669" />
                            <QuickActionBox icon={<History size={24} />} label="History" onClick={() => navigate('/transactions')} color="#F3E8FF" iconColor="#9333EA" />
                        </div>
                    </div>

                    {/* Cards Subsection */}
                    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '32px' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CreditCard size={22} color="#64748B" />
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Your Cards</h3>
                            </div>
                            <span onClick={() => navigate('/cards')} style={{ fontSize: '14px', color: '#0EA5E9', fontWeight: 700, cursor: 'pointer' }}>View all {'\u003E'}</span>
                        </div>
                        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
                                <CreditCard size={28} color="#94A3B8" />
                            </div>
                            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>No cards yet</h4>
                            <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.5 }}>You haven't applied for any virtual cards yet. Apply for a new card to get started with secure online payments.</p>
                            <button onClick={() => navigate('/cards')} style={{ padding: '14px 32px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                                <Plus size={20} /> Apply for Card
                            </button>
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Activity size={22} color="#64748B" />
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Recent Transactions</h3>
                            </div>
                            <span onClick={() => navigate('/transactions')} style={{ fontSize: '14px', color: '#0EA5E9', fontWeight: 700, cursor: 'pointer' }}>View all {'\u003E'}</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                                        <th style={{ padding: '16px 32px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>AMOUNT</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>TYPE</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>STATUS</th>
                                        <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>REFERENCE ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(transactions || []).length > 0 ? transactions.slice(0, 5).map((tx, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '20px 32px', fontWeight: 700, color: '#1E293B' }}>{formatMoney(Math.abs(tx.amount))} EUR</td>
                                            <td style={{ padding: '20px 16px' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: tx.amount < 0 ? '#FEE2E2' : '#D1FAE5', color: tx.amount < 0 ? '#EF4444' : '#059669' }}>
                                                    {tx.amount < 0 ? 'Debit' : 'Credit'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 16px' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: '#D1FAE5', color: '#059669' }}>
                                                    Processed
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 16px', fontSize: '13px', color: '#64748B', fontFamily: 'monospace' }}>BANK/{tx.id?.substring(0,8).toUpperCase()}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No recent transactions</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="right-panel">
                    
                    {/* Account Statistics Widget */}
                    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '32px' }}>Account Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <StatItem icon={<CreditCard size={18} />} color="#0EA5E9" label="Transaction Limit" value={formatMoney(500000)} />
                            <StatItem icon={<Clock size={18} />} color="#FACC15" label="Pending Transactions" value={formatMoney(0)} />
                            <StatItem icon={<BarChart3 size={18} />} color="#10B981" label="Transaction Volume" value={formatMoney(30000)} />
                            <StatItem icon={<Calendar size={18} />} color="var(--purple)" label="Account Age" value="38 minutes" />
                        </div>
                    </div>

                    {/* Quick Transfer Widget */}
                    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '24px' }}>Quick Transfer</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div onClick={() => setIsTransferModalOpen(true)} style={transferItemStyle}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F0F9FF', color: '#0EA5E9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><User size={20} /></div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Local Transfer</h4>
                                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>0% Handling charges</p>
                                </div>
                                <ChevronRight size={18} color="#94A3B8" />
                            </div>
                            <div onClick={() => navigate('/international-transfer')} style={transferItemStyle}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F0F9FF', color: '#0EA5E9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Globe size={20} /></div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>International Transfer</h4>
                                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Global reach, 0% fee</p>
                                </div>
                                <ChevronRight size={18} color="#94A3B8" />
                            </div>
                        </div>
                    </div>

                    {/* Need Help Card */}
                    <div style={{ background: 'linear-gradient(135deg, #0EA5E9, #2563EB)', borderRadius: '24px', padding: '40px', color: 'white', textAlign: 'center', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.2)' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px', backdropFilter: 'blur(10px)' }}>
                            <HelpCircle size={32} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>Need Help?</h3>
                        <p style={{ fontSize: '15px', opacity: 0.9, marginBottom: '32px', lineHeight: 1.6 }}>Our support team is here to assist you 24/7</p>
                        <button onClick={() => navigate('/support')} style={{ width: '100%', padding: '16px', background: 'white', color: '#0EA5E9', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                            <MessageSquare size={18} /> Contact Support
                        </button>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
};

const StatBox = ({ label, value, icon, color, active }) => (
    <div style={{ 
        background: active ? 'linear-gradient(135deg, #0EA5E9, #3B82F6)' : 'white', 
        padding: '24px', borderRadius: '20px', border: active ? 'none' : '1px solid #E2E8F0',
        color: active ? 'white' : 'inherit', boxShadow: active ? '0 10px 20px rgba(14, 165, 233, 0.1)' : 'none',
        minWidth: 0
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: active ? 'rgba(255,255,255,0.8)' : '#64748B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: active ? 'rgba(255,255,255,0.2)' : `${color}15`, color: active ? 'white' : color, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                {icon}
            </div>
        </div>
        <h3 style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</h3>
    </div>
);

const QuickActionBox = ({ icon, label, onClick, color = 'white', iconColor = '#0EA5E9' }) => (
    <div onClick={onClick} style={{ background: color === 'white' ? 'white' : color, padding: '20px 12px', borderRadius: '20px', border: color === 'white' ? '1px solid #E2E8F0' : 'none', textAlign: 'center', cursor: 'pointer', transition: '0.2s', minWidth: 0 }}>
        <div style={{ color: iconColor, marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
    </div>
);

const StatItem = ({ icon, color, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${color}15`, color: color, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{icon}</div>
        <div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, fontWeight: 600 }}>{label}</p>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>{value}</h4>
        </div>
    </div>
);

const transferItemStyle = { 
    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', 
    border: '1px solid #F1F5F9', cursor: 'pointer', transition: '0.2s' 
};

export default Dashboard;
