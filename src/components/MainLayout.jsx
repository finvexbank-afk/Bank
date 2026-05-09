import React, { useState } from 'react';
import { 
  Building2, Home, Activity, CreditCard, Send, Globe, Download, 
  Landmark, FileText, History, Settings, LifeBuoy, Calendar,
  Menu, PieChart, LayoutGrid, User, Bell, AlertCircle, ChevronDown, LogOut, X
} from 'lucide-react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import TransferModal from './TransferModal';
import { useAppContext } from '../AppContext';

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isTransferModalOpen, setIsTransferModalOpen, logout } = useAppContext();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!user) {
        return <Navigate to="/auth" />;
    }

    // Force KYC verification if not verified
    const allowedPaths = ['/verify-account', '/enrollment', '/settings', '/support'];
    if (user.kycStatus !== 'Verified' && !allowedPaths.includes(location.pathname) && user.role !== 'admin') {
        return <Navigate to="/verify-account" />;
    }

    const isActive = (path) => location.pathname === path;

    const formatMoney = (amount) => {
        const val = amount || 0;
        return '€' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="app-container">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo">
                    <img src="/logo/logo-noir.png" alt="Finvex Bank" width="140" />
                    <button className="mobile-only" onClick={closeSidebar} style={{ marginLeft: 'auto', background: 'none', color: '#64748B' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="sidebar-profile">
                    <div className="profile-card">
                        <div className="avatar">
                            {(user.name || "U").charAt(0)}
                        </div>
                        <p className="profile-name">{user.name || 'User'}</p>
                        <p className="profile-id">ID: {user.uid?.substring(0, 8) || '85979175073'}</p>
                        
                        <div 
                            className="badge-kyc" 
                            onClick={() => { user.kycStatus !== 'Verified' && navigate('/verify-account'); closeSidebar(); }}
                            style={{ 
                                marginTop: '12px',
                                background: user.kycStatus === 'Verified' ? '#ECFDF5' : '#FEF3C7',
                                color: user.kycStatus === 'Verified' ? '#059669' : '#D97706',
                                cursor: user.kycStatus === 'Verified' ? 'default' : 'pointer'
                            }}
                        >
                            {user.kycStatus === 'Verified' ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                                <AlertCircle size={14} />
                            )}
                            {user.kycStatus === 'Verified' ? 'KYC Verified' : 'Verify KYC'}
                        </div>

                        <div className="btn-group" style={{ marginTop: '16px' }}>
                            <button className="btn-outline" onClick={() => { navigate('/settings'); closeSidebar(); }}><User size={14} /> Profile</button>
                            <button className="btn-outline" onClick={logout} style={{ color: 'var(--primary)' }}><LogOut size={14} /> Logout</button>
                        </div>
                    </div>
                </div>

                <div className="sidebar-nav">
                    <div className="nav-section">
                        <p className="nav-title">MAIN MENU</p>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); closeSidebar(); }} className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}><Home size={18} /> Dashboard</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/transactions'); closeSidebar(); }} className={`nav-item ${isActive('/transactions') ? 'active' : ''}`}><Activity size={18} /> Transactions</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/cards'); closeSidebar(); }} className={`nav-item ${isActive('/cards') ? 'active' : ''}`}><CreditCard size={18} /> Cards</a>
                    </div>
 
                    <div className="nav-section">
                        <p className="nav-title">TRANSFERS</p>
                        <a href="#" onClick={(e) => { e.preventDefault(); setIsTransferModalOpen(true); closeSidebar(); }} className="nav-item"><Send size={18} /> Local Transfer</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/international-transfer'); closeSidebar(); }} className={`nav-item ${isActive('/international-transfer') ? 'active' : ''}`}><Globe size={18} /> International Wire</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/deposit'); closeSidebar(); }} className={`nav-item ${isActive('/deposit') ? 'active' : ''}`}><Download size={18} /> Deposit</a>
                    </div>
                    
                    <div className="nav-section">
                        <p className="nav-title">SERVICES</p>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/loan-request'); closeSidebar(); }} className={`nav-item ${isActive('/loan-request') ? 'active' : ''}`}><Landmark size={18} /> Loan Request</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/irs'); closeSidebar(); }} className={`nav-item ${isActive('/irs') ? 'active' : ''}`}><FileText size={18} /> IRS Tax Refund</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/loan-history'); closeSidebar(); }} className={`nav-item ${isActive('/loan-history') ? 'active' : ''}`}><History size={18} /> Loan History</a>
                    </div>
                    
                    <div className="nav-section">
                        <p className="nav-title">ACCOUNT</p>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/settings'); closeSidebar(); }} className={`nav-item ${isActive('/settings') ? 'active' : ''}`}><Settings size={18} /> Settings</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/support'); closeSidebar(); }} className={`nav-item ${isActive('/support') ? 'active' : ''}`}><LifeBuoy size={18} /> Support Ticket</a>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Topbar */}
                <header className="topbar" style={{ height: '70px', minHeight: '70px' }}>
                    <div className="topbar-left mobile-flex" style={{gap: '12px', flex: 1}}>
                        <Menu size={22} className="mobile-only" style={{cursor: 'pointer', flexShrink: 0}} onClick={toggleSidebar} />
                        <div className="mobile-only flex-center" style={{ flex: 1, textAlign: 'center' }}>
                            <img src="/logo/logo-noir.png" alt="Logo" style={{ maxHeight: '32px', width: 'auto', objectFit: 'contain' }} />
                        </div>
                        <div className="date-display">
                            <Calendar size={18} />
                            Today
                        </div>
                    </div>
                    
                    <div className="topbar-right" style={{ gap: '8px' }}>
                        <div className="mini-balance" style={{ fontSize: '13px', padding: '6px 12px' }}>
                            <CreditCard size={16} /> {formatMoney(user.balance)}
                        </div>
                        <button className="icon-btn" style={{ width: '36px', height: '36px' }}><Bell size={18} /></button>
                        <button className="icon-btn" style={{ width: '36px', height: '36px' }} onClick={() => navigate('/admin')} title="Go to Admin Panel"><Settings size={18} /></button>
                    </div>
                </header>

                {children}

                <footer className="desktop-footer">
                    <div>© 2025 Finvex Bank. All rights reserved.</div>
                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Contact Support</a>
                    </div>
                </footer>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="mobile-nav">
                <div className={`mn-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
                    <Home size={22} />
                    <span>Home</span>
                </div>
                <div className={`mn-item ${isActive('/transactions') ? 'active' : ''}`} onClick={() => navigate('/transactions')}>
                    <Activity size={22} />
                    <span>Activity</span>
                </div>
                <div className="mn-fab" onClick={() => setIsTransferModalOpen(true)}>
                    <Send size={24} />
                </div>
                <div className={`mn-item ${isActive('/cards') ? 'active' : ''}`} onClick={() => navigate('/cards')}>
                    <CreditCard size={22} />
                    <span>Cards</span>
                </div>
                <div className={`mn-item ${isActive('/settings') ? 'active' : ''}`} onClick={() => navigate('/settings')}>
                    <User size={22} />
                    <span>Account</span>
                </div>
            </div>

            <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />
        </div>
    );
};

export default MainLayout;
