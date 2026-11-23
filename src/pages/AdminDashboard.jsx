import React, { useState, useEffect } from 'react';
import { 
    Users, LayoutDashboard, Settings, LogOut, Search, 
    MoreHorizontal, CheckCircle, XCircle, Clock, Filter,
    Download, RefreshCw, UserPlus, FileText, ArrowUpRight,
    ArrowDownLeft, BarChart3, ChevronRight, UserCircle,
    ChevronDown, ChevronUp, CreditCard, ShieldCheck, Landmark, Eye, ArrowLeft,
    Globe, Wallet, Trash2, Check, ArrowUp, ArrowDown, CreditCard as CardIcon,
    Bitcoin, Landmark as BankIcon, DollarSign, Menu, Bell, Mail, 
    ShieldAlert, HardDrive, Edit3, Save, Power, UserMinus, X, MoreVertical,
    Activity as ActivityIcon, Key, Image as ImageIcon, ToggleLeft, Ghost, Eraser, LogIn, Send
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, doc, updateDoc, onSnapshot, query, orderBy, addDoc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { countries } from '../data/countries';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import { getBankDetails, getBankFieldsForFirestore, downloadRIB } from '../utils/bankDetails';
import { notify, ask } from '../components/Toast';
import TransferCodesPanel from '../components/TransferCodesPanel';
import { callTransferApi } from '../utils/transferApi';
import { createDefaultClientCodes } from '../utils/transferCodes';

// Firestore dates can be Timestamps, ISO strings or plain {seconds} objects.
const formatFirestoreDate = (value) => {
    if (!value) return 'N/A';
    try {
        let date;
        if (typeof value.toDate === 'function') date = value.toDate();
        else if (value instanceof Date) date = value;
        else if (typeof value === 'number') date = new Date(value);
        else if (typeof value === 'string') date = new Date(value);
        else if (typeof value.seconds === 'number') date = new Date(value.seconds * 1000);
        else return 'N/A';
        return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    } catch {
        return 'N/A';
    }
};

const callAdminApi = async (action, payload) => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('No authentication token');
    const response = await fetch('/.netlify/functions/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, idToken, ...payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Admin request failed');
    return data;
};

const AdminDashboard = () => {
    const { user, logout } = useAppContext();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [expandedMenus, setExpandedMenus] = useState(['loans', 'cards', 'settings']);
    const [selectedUser, setSelectedUser] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [cards, setCards] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataError, setDataError] = useState('');

    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin-login" />;
    }

    useEffect(() => {
        setLoading(true);
        setDataError('');
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            console.error('Firestore users error:', err);
            setDataError(err?.message || 'Firestore error');
            setLoading(false);
        });
        const unsubTxs = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')), (snap) => {
            setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubCards = onSnapshot(collection(db, 'cards'), (snap) => {
            setCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubLoans = onSnapshot(collection(db, 'loans'), (snap) => {
            setLoans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { unsubUsers(); unsubTxs(); unsubCards(); unsubLoans(); };
    }, []);

    const toggleMenu = (menu) => {
        setExpandedMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
    };

    const approveKYC = async (uid) => {
        await updateDoc(doc(db, 'users', uid), { kycStatus: 'Verified', accountStatus: 'Active' });
        notify.success(t('admin.alert.accountVerified', language));
    };

    const handleTransaction = async (txId, status) => {
        const txRef = doc(db, 'transactions', txId);
        await updateDoc(txRef, { status: status });
    };

    const handleLoan = async (loanId, status) => {
        await updateDoc(doc(db, 'loans', loanId), { status: status });
    };

    const switchAdminTab = (tab) => {
        setActiveTab(tab);
        setViewMode('list');
        setSelectedUser(null);
        setIsSidebarOpen(false);
    };

    const totalDepositValue = users.reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
    const pendingDeposits = transactions.filter(t => (t.type === 'Deposit' || t.type === 'credit') && t.status === 'Pending');
    const totalTransfersValue = transactions.filter(t => t.type === 'Transfer' || t.type === 'debit').reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
    const pendingTransfers = transactions.filter(t => (t.type === 'Transfer' || t.type === 'International Wire' || t.type === 'debit') && t.status === 'Pending');
    
    return (
        <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden', position: 'relative' }}>
            
            {isMobile && isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ 
                        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', 
                        zIndex: 999, backdropFilter: 'blur(4px)'
                    }} 
                />
            )}

            <aside style={{ 
                width: '280px', background: 'white', borderRight: '1px solid #E2E8F0', 
                display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                overflow: 'hidden', zIndex: 1000,
                position: isMobile ? 'fixed' : 'relative',
                height: '100%',
                left: isSidebarOpen ? '0' : '-280px',
                boxShadow: isSidebarOpen && isMobile ? '20px 0 50px rgba(0,0,0,0.1)' : 'none'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: '#2563EB' }}><BankIcon size={26} /></div>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em' }}>FINVEX <span style={{color:'#2563EB'}}>ADMIN</span></span>
                    </div>
                </div>

                <div style={{ padding: '20px 24px', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{user.name}</p>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                    <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label={t('admin.nav.overview', language)} onClick={() => {setActiveTab('dashboard'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    <NavItem active={activeTab === 'manage-users'} icon={<Users size={18} />} label={t('admin.nav.userDirectory', language)} onClick={() => {setActiveTab('manage-users'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    <NavItem active={activeTab === 'create-user'} icon={<UserPlus size={18} />} label={t('admin.nav.deployUser', language)} onClick={() => {setActiveTab('create-user'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    <NavItem active={activeTab === 'kyc'} icon={<ShieldCheck size={18} />} label={t('admin.nav.kyc', language)} onClick={() => {setActiveTab('kyc'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    <NavItem active={activeTab === 'transfer-codes'} icon={<Key size={18} />} label={t('admin.nav.transferCodes', language)} onClick={() => {setActiveTab('transfer-codes'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    
                    <CollapsibleItem icon={<ArrowUpRight size={18} />} label={t('admin.nav.ledger', language)} expanded={expandedMenus.includes('ledger')} onToggle={() => toggleMenu('ledger')}>
                        <SubNavItem label={t('admin.nav.outboundWires', language)} active={activeTab === 'transfers'} onClick={() => {setActiveTab('transfers'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                        <SubNavItem label={t('admin.nav.inboundDeposits', language)} active={activeTab === 'deposits'} onClick={() => {setActiveTab('deposits'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    </CollapsibleItem>

                    <CollapsibleItem icon={<Landmark size={18} />} label={t('admin.nav.lending', language)} expanded={expandedMenus.includes('loans')} onToggle={() => toggleMenu('loans')}>
                        <SubNavItem label={t('admin.nav.pendingRequests', language)} active={activeTab === 'loan-requests'} onClick={() => {setActiveTab('loan-requests'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    </CollapsibleItem>

                    <CollapsibleItem icon={<CardIcon size={18} />} label={t('admin.nav.cardInfra', language)} expanded={expandedMenus.includes('cards')} onToggle={() => toggleMenu('cards')}>
                        <SubNavItem label={t('admin.nav.issuanceRequests', language)} active={activeTab === 'card-requests'} onClick={() => {setActiveTab('card-requests'); setViewMode('list'); if(isMobile) setIsSidebarOpen(false); }} />
                    </CollapsibleItem>
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9' }}>
                     <button onClick={logout} style={{ width: '100%', padding: '12px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}>
                        <LogOut size={16} /> {t('admin.nav.terminateSession', language)}
                     </button>
                </div>
            </aside>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <header style={{ height: '70px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: '#F1F5F9', border: 'none', color: '#1E293B', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Menu size={22} /></button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <LanguageSelector position="inline" />
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 4vw, 32px)', paddingBottom: isMobile ? 'calc(110px + env(safe-area-inset-bottom))' : undefined }}>
                    {activeTab === 'dashboard' && viewMode === 'list' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="flex-row-mobile">
                                <div><h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>{t('admin.dash.title', language)}</h1><p style={{ color: '#64748B', fontWeight: 500 }}>{t('admin.dash.subtitle', language)}</p></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                                <ComplexStat icon={<Wallet color="#F59E0B" />} label={t('admin.dash.aggregatedBalance', language)} value={`€${totalDepositValue.toLocaleString()}`} color="#FFFBEB" />
                                <ComplexStat icon={<RefreshCw color="#3B82F6" />} label={t('admin.dash.inboundBacklog', language)} value={pendingDeposits.length} color="#EFF6FF" />
                                <ComplexStat icon={<ArrowUpRight color="#EF4444" />} label={t('admin.dash.velocityVolume', language)} value={`€${totalTransfersValue.toLocaleString()}`} color="#FEF2F2" />
                                <ComplexStat icon={<RefreshCw color="#6366F1" />} label={t('admin.dash.wireVerification', language)} value={pendingTransfers.length} color="#EEF2FF" />
                            </div>
                        </>
                    )}

                    {activeTab === 'manage-users' && viewMode === 'list' && (
                        <UsersPanel 
                            users={users} 
                            loading={loading}
                            error={dataError}
                            onManage={(u) => { setSelectedUser(u); setViewMode('detail'); }} 
                        />
                    )}

                    {activeTab === 'manage-users' && viewMode === 'detail' && selectedUser && (
                        <UserDetailsView 
                            user={selectedUser} 
                            onBack={() => setViewMode('list')} 
                            onUpdate={async (newData) => {
                                const uid = selectedUser.id;
                                const previousEmail = selectedUser.email;
                                await updateDoc(doc(db, 'users', uid), newData);
                                setSelectedUser({...selectedUser, ...newData});
                                if (newData.email && newData.email !== previousEmail) {
                                    try {
                                        await callAdminApi('updateEmail', { uid, email: newData.email });
                                    } catch (err) {
                                        console.error('Email sync error:', err);
                                        notify.error(t('admin.alert.emailSyncFailed', language));
                                    }
                                }
                            }}
                            onDelete={async () => {
                                const confirmedDelete = await ask({
                                    title: t('admin.alert.deleteUserTitle', language),
                                    message: t('admin.alert.deleteUser', language, { name: selectedUser.name }),
                                    confirmLabel: t('admin.alert.deleteConfirm', language),
                                    tone: 'danger'
                                });
                                if (!confirmedDelete) return;
                                const uid = selectedUser.id;
                                try {
                                    await callAdminApi('deleteUser', { uid });
                                    setViewMode('list');
                                    setSelectedUser(null);
                                    notify.success(t('admin.alert.deleteUserComplete', language));
                                } catch (err) {
                                    console.error('Full deletion error:', err);
                                    await deleteDoc(doc(db, 'users', uid));
                                    setViewMode('list');
                                    setSelectedUser(null);
                                    notify.warning(t('admin.alert.authDeletionNotice', language));
                                }
                            }}
                        />
                    )}

                    {activeTab === 'create-user' && <CreateUserForm />}
                    {activeTab === 'transfer-codes' && <TransferCodesPanel />}
                    {activeTab === 'kyc' && <KycPanel users={users.filter(u => u.kycStatus && u.kycStatus !== 'Unverified')} onApprove={approveKYC} />}
                    {activeTab === 'transfers' && <TransactionPanel transactions={transactions.filter(t => t.type === 'Transfer' || t.type === 'International Wire' || t.type === 'debit')} onUpdate={handleTransaction} title={t('admin.panel.wireSettlement', language)} />}
                    {activeTab === 'deposits' && <TransactionPanel transactions={transactions.filter(t => t.type === 'Deposit' || t.type === 'credit')} onUpdate={handleTransaction} title={t('admin.panel.treasuryInbound', language)} />}
                    {activeTab === 'loan-requests' && <LoanPanel loans={loans.filter(l => l.status === 'Pending')} onUpdate={handleLoan} />}
                    {activeTab === 'card-requests' && <CardPanel cards={cards.filter(c => c.status === 'Pending')} onUpdate={async (id) => {
                        const ref = doc(db, 'cards', id);
                        await updateDoc(ref, { status: 'Active', number: '5172 '+Math.floor(1000+Math.random()*9000)+' '+Math.floor(1000+Math.random()*9000)+' '+Math.floor(1000+Math.random()*9000), expiry: '08/30', cvv: Math.floor(100+Math.random()*900).toString() });
                        notify.success(t('admin.alert.cardActivated', language));
                    }} />}
                </div>
            </main>

            {isMobile && (
                <div className="mobile-nav admin-mobile-nav">
                    <div className={`mn-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => switchAdminTab('dashboard')}>
                        <LayoutDashboard size={22} />
                        <span>{t('admin.mobile.overview', language)}</span>
                    </div>
                    <div className={`mn-item ${activeTab === 'manage-users' ? 'active' : ''}`} onClick={() => switchAdminTab('manage-users')}>
                        <Users size={22} />
                        <span>{t('admin.mobile.users', language)}</span>
                    </div>
                    <div className="mn-fab" onClick={() => switchAdminTab('create-user')} title={t('admin.nav.deployUser', language)}>
                        <UserPlus size={24} />
                    </div>
                    <div className={`mn-item ${activeTab === 'kyc' ? 'active' : ''}`} onClick={() => switchAdminTab('kyc')}>
                        <ShieldCheck size={22} />
                        <span>{t('admin.mobile.kyc', language)}</span>
                    </div>
                    <div className={`mn-item ${activeTab === 'transfers' || activeTab === 'deposits' ? 'active' : ''}`} onClick={() => switchAdminTab('transfers')}>
                        <ArrowUpRight size={22} />
                        <span>{t('admin.mobile.ledger', language)}</span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 2s linear infinite; }
            `}</style>
        </div>
    );
};

const NavItem = ({ active, icon, label, onClick }) => (
    <div onClick={onClick} style={{ 
        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px', cursor: 'pointer', 
        background: active ? '#F1F5F9' : 'transparent', 
        color: active ? '#2563EB' : '#64748B', 
        fontWeight: active ? 800 : 500, 
        transition: '0.2s',
        borderLeft: `4px solid ${active ? '#2563EB' : 'transparent'}`
    }}>
        {icon} <span style={{ fontSize: '14px' }}>{label}</span>
    </div>
);

const CollapsibleItem = ({ icon, label, expanded, onToggle, children }) => (
    <div>
        <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', cursor: 'pointer', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>{icon} <span style={{ fontSize: '14px', fontWeight: 600 }}>{label}</span></div>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {expanded && <div style={{ background: '#F8FAFC' }}>{children}</div>}
    </div>
);

const SubNavItem = ({ label, active, onClick }) => (
    <div onClick={onClick} style={{ padding: '12px 24px 12px 54px', fontSize: '13px', color: active ? '#2563EB' : '#64748B', fontWeight: active ? 800 : 500, cursor: 'pointer', transition: '0.2s' }}>
        <ChevronRight size={12} style={{ display: 'inline', marginRight: '8px', opacity: active ? 1 : 0 }} /> {label}
    </div>
);

const ComplexStat = ({ icon, label, value, color }) => (
    <div style={{ padding: '24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: color || '#F8FAFC', borderRadius: '12px' }}>{icon}</div>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B' }}>{value}</h3>
    </div>
);

const UsersPanel = ({ users, loading, error, onManage }) => {
    const { language } = useLanguage();
    const [search, setSearch] = useState('');

    const filtered = users.filter(u => 
        u.name?.toLowerCase().includes(search.toLowerCase()) || 
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ fontWeight: 900, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {t('admin.users.title', language)}
                    <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: '20px', padding: '2px 10px', fontSize: '12px' }}>{users.length}</span>
                </h3>
                <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                        placeholder={t('admin.users.search', language)} 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600, background: '#F8FAFC' }} 
                    />
                </div>
            </div>

            {error && (
                <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', color: '#991B1B', fontSize: '13px', fontWeight: 600 }}>
                    {t('admin.users.error', language)} : {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>{t('admin.users.loading', language)}</div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>{t('admin.users.empty', language)}</div>
            ) : (
            <>
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC' }}>
                        <tr>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.users.col.name', language)}</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.users.col.username', language)}</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.users.col.email', language)}</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.users.col.status', language)}</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.users.col.registered', language)}</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.users.col.action', language)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '18px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 900, fontSize: '14px' }}>
                                            {(u.name || 'U')[0].toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 800, color: '#1E293B' }}>{u.name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '18px 24px', color: '#64748B' }}>{u.username}</td>
                                <td style={{ padding: '18px 24px' }}>{u.email}</td>
                                <td style={{ padding: '18px 24px' }}>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: u.accountStatus === 'Active' ? '#D1FAE5' : '#FEE2E2', color: u.accountStatus === 'Active' ? '#065F46' : '#991B1B' }}>
                                        {u.accountStatus?.toUpperCase() || 'ACTIVE'}
                                    </span>
                                </td>
                                <td style={{ padding: '18px 24px' }}>{formatFirestoreDate(u.createdAt)}</td>
                                <td style={{ padding: '18px 24px' }}>
                                    <button onClick={() => onManage(u)} style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 800 }}>{t('admin.users.manage', language)}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mobile-only" style={{ padding: '12px' }}>
                {filtered.map(u => (
                    <div key={u.id} style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', marginBottom: '12px', background: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 900 }}>
                                {(u.name || 'U')[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>@{u.username || '—'}</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', wordBreak: 'break-word', marginBottom: '8px' }}>{u.email}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, background: u.accountStatus === 'Active' ? '#D1FAE5' : '#FEE2E2', color: u.accountStatus === 'Active' ? '#065F46' : '#991B1B' }}>
                                {u.accountStatus?.toUpperCase() || 'ACTIVE'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{formatFirestoreDate(u.createdAt)}</span>
                            <button onClick={() => onManage(u)} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 800, fontSize: '12px' }}>
                                {t('admin.users.manage', language)}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            </>
            )}
        </div>
    );
};

const EditField = ({ label, value, onChange, type = 'text', options }) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{label}</span>
        {options ? (
            <select value={value} onChange={(e) => onChange(e.target.value)} style={formInputLarge}>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        ) : type === 'textarea' ? (
            <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} style={formInputLarge} />
        ) : (
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={formInputLarge} />
        )}
    </label>
);

const EditUserModal = ({ user, language, onClose, onSave }) => {
    const bank = getBankDetails(user);
    const [form, setForm] = useState({
        name: user.name || '',
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob || '',
        country: user.country || '',
        photoURL: user.photoURL || '',
        accountNumber: bank.accountNumber,
        accountType: user.accountType || 'Checking',
        currency: user.currency || 'EUR',
        balance: user.balance ?? 0,
        limit: user.limit ?? 50000,
        accountStatus: user.accountStatus || 'Dormant',
        kycStatus: user.kycStatus || 'Unverified',
        role: user.role || 'client',
        pin: user.pin || '',
        irs: user.irs || '',
        imf: user.imf || '',
        swift: user.swift || '',
        cot: user.cot || '',
        iban: bank.ibanRaw,
        bic: bank.bic,
        bankName: bank.bankName,
        bankAddress: bank.bankAddress,
        bankCode: bank.bankCode,
        branchCode: bank.branchCode,
        ribKey: bank.ribKey
    });
    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handlePhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 600000) { notify.error(t('admin.edit.photoTooLarge', language)); return; }
        const reader = new FileReader();
        reader.onload = () => set('photoURL', reader.result);
        reader.readAsDataURL(file);
    };

    const submit = (e) => {
        e.preventDefault();
        onSave({ ...form, balance: Number(form.balance) || 0, limit: Number(form.limit) || 0 });
        onClose();
    };

    const section = (title, fields) => (
        <div key={title} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 900, color: '#2563EB', textTransform: 'uppercase', marginBottom: '14px' }}>{title}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>{fields}</div>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '18px', color: '#1E293B' }}>{t('admin.edit.title', language)} : {user.name}</h3>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8' }}><X size={20} /></button>
                </div>
                <form onSubmit={submit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {section(t('admin.edit.identity', language), [
                        <EditField key="name" label={t('admin.details.fullname', language)} value={form.name} onChange={(v) => set('name', v)} />,
                        <EditField key="firstName" label={t('admin.create.firstName', language)} value={form.firstName} onChange={(v) => set('firstName', v)} />,
                        <EditField key="middleName" label={t('admin.edit.middleName', language)} value={form.middleName} onChange={(v) => set('middleName', v)} />,
                        <EditField key="lastName" label={t('admin.create.lastName', language)} value={form.lastName} onChange={(v) => set('lastName', v)} />,
                        <EditField key="username" label={t('admin.edit.username', language)} value={form.username} onChange={(v) => set('username', v)} />,
                        <EditField key="email" label={t('admin.details.email', language)} value={form.email} onChange={(v) => set('email', v)} type="email" />,
                        <EditField key="phone" label={t('admin.details.mobile', language)} value={form.phone} onChange={(v) => set('phone', v)} />,
                        <EditField key="dob" label={t('admin.edit.dob', language)} value={form.dob} onChange={(v) => set('dob', v)} />,
                        <EditField key="country" label={t('admin.create.country', language)} value={form.country} onChange={(v) => set('country', v)} />
                    ])}
                    {section(t('admin.edit.account', language), [
                        <EditField key="accountNumber" label={t('admin.details.accountNumber', language)} value={form.accountNumber} onChange={(v) => set('accountNumber', v)} />,
                        <EditField key="accountType" label={t('admin.edit.accountType', language)} value={form.accountType} onChange={(v) => set('accountType', v)} options={['Checking', 'Savings']} />,
                        <EditField key="currency" label={t('admin.edit.currency', language)} value={form.currency} onChange={(v) => set('currency', v)} />,
                        <EditField key="balance" label={t('admin.details.balance', language)} value={form.balance} onChange={(v) => set('balance', v)} type="number" />,
                        <EditField key="limit" label={t('admin.details.limit', language)} value={form.limit} onChange={(v) => set('limit', v)} type="number" />,
                        <EditField key="accountStatus" label={t('admin.edit.status', language)} value={form.accountStatus} onChange={(v) => set('accountStatus', v)} options={['Dormant', 'Active', 'Restricted', 'Closed']} />,
                        <EditField key="kycStatus" label={t('admin.edit.kyc', language)} value={form.kycStatus} onChange={(v) => set('kycStatus', v)} options={['Unverified', 'Pending', 'Verified']} />,
                        <EditField key="role" label={t('admin.edit.role', language)} value={form.role} onChange={(v) => set('role', v)} options={['client', 'user', 'admin']} />,
                        <EditField key="pin" label={t('admin.details.pin', language)} value={form.pin} onChange={(v) => set('pin', v)} />
                    ])}
                    {section(t('admin.edit.bank', language), [
                        <EditField key="iban" label={t('admin.details.iban', language)} value={form.iban} onChange={(v) => set('iban', v)} />,
                        <EditField key="bic" label={t('admin.details.bic', language)} value={form.bic} onChange={(v) => set('bic', v)} />,
                        <EditField key="bankName" label={t('admin.details.bank', language)} value={form.bankName} onChange={(v) => set('bankName', v)} />,
                        <EditField key="bankAddress" label={t('settings.bank.address', language)} value={form.bankAddress} onChange={(v) => set('bankAddress', v)} />,
                        <EditField key="bankCode" label={t('admin.edit.bankCode', language)} value={form.bankCode} onChange={(v) => set('bankCode', v)} />,
                        <EditField key="branchCode" label={t('admin.edit.branchCode', language)} value={form.branchCode} onChange={(v) => set('branchCode', v)} />,
                        <EditField key="ribKey" label={t('admin.details.ribKey', language)} value={form.ribKey} onChange={(v) => set('ribKey', v)} />
                    ])}
                    {section(t('admin.edit.documents', language), [
                        <EditField key="irs" label={t('admin.details.irs', language)} value={form.irs} onChange={(v) => set('irs', v)} />,
                        <EditField key="imf" label={t('admin.details.imf', language)} value={form.imf} onChange={(v) => set('imf', v)} />,
                        <EditField key="swift" label={t('admin.edit.swift', language)} value={form.swift} onChange={(v) => set('swift', v)} />,
                        <EditField key="cot" label={t('admin.edit.cot', language)} value={form.cot} onChange={(v) => set('cot', v)} />
                    ])}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{t('admin.edit.photo', language)}</span>
                        <input type="file" accept="image/*" onChange={handlePhoto} />
                        {form.photoURL && <img src={form.photoURL} alt="preview" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', marginTop: '8px' }} />}
                    </div>
                    <button type="submit" style={{ padding: '15px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>{t('admin.edit.save', language)}</button>
                </form>
            </div>
        </div>
    );
};

const UserDetailsView = ({ user, onBack, onUpdate, onDelete }) => {
    const { language } = useLanguage();
    const bankDetails = getBankDetails(user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        location: 'Account Balance',
        type: 'Select type',
        scope: 'Select type',
        desc: '',
        date: '',
        notify: 'No'
    });

    const handleFundSubmit = async () => {
        const amt = parseFloat(formData.amount);
        if (isNaN(amt) || amt <= 0) { notify.error(t('admin.alert.invalidAmount', language)); return; }
        if (formData.type !== 'Fund/Add' && formData.type !== 'Debit/Subtract') {
            notify.error(t('admin.alert.selectType', language));
            return;
        }

        try {
            await callTransferApi('adminCredit', {
                uid: user.id,
                amount: amt,
                mode: formData.type,
                description: formData.desc || 'Treasury Reconciliation',
                notify: formData.notify
            });
            notify.success(formData.type === 'Fund/Add' ? t('admin.alert.recordFunded', language) : t('admin.alert.recordDebited', language));
            setActionType(null);
        } catch (error) {
            notify.error(error.message);
        }
    };

    return (
        <div style={{ padding: '20px', background: '#F8FAFC', minHeight: '100%', borderRadius: '24px' }}>
            {/* Header */}
            <div className="admin-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0EA5E9', overflow: 'hidden' }}>
                        {user.photoURL ? <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={40} />}
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>{user.name}</h1>
                </div>
                <div className="admin-detail-actions" style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700 }}><ArrowLeft size={18} /> {t('admin.details.back', language)}</button>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700 }}>{t('admin.details.actions', language)} <ChevronDown size={18} /></button>
                    
                    {isMenuOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', zIndex: 100, width: '240px', padding: '8px 0' }}>
                            <ActionMenuItem icon={<DollarSign size={16}/>} label={t('admin.details.action.fundDebit', language)} onClick={() => { setActionType('fund'); setIsMenuOpen(false); }} />
                            <ActionMenuItem icon={<ImageIcon size={16}/>} label={t('admin.details.action.changePhoto', language)} onClick={() => { setActionType('edit'); setIsMenuOpen(false); }} />
                            <ActionMenuItem icon={<Key size={16}/>} label={t('admin.details.action.resetPassword', language)} onClick={async () => {
                                setIsMenuOpen(false);
                                try {
                                    if (!user.email) throw new Error('No email');
                                    await sendPasswordResetEmail(auth, user.email);
                                    notify.success(t('admin.alert.passwordReset', language));
                                } catch (err) {
                                    notify.error(t('admin.alert.passwordResetFailed', language));
                                }
                            }} />
                            {user.accountStatus === 'Dormant' ? (
                                <ActionMenuItem icon={<Power size={16}/>} label={t('admin.details.action.setActive', language)} onClick={() => { onUpdate({ accountStatus: 'Active' }); setIsMenuOpen(false); }} color="#10B981" />
                            ) : (
                                <ActionMenuItem icon={<ShieldAlert size={16}/>} label={t('admin.details.action.setDormant', language)} onClick={() => { onUpdate({ accountStatus: 'Dormant' }); setIsMenuOpen(false); }} color="#F59E0B" />
                            )}
                            <ActionMenuItem icon={<Edit3 size={16}/>} label={t('admin.details.action.editProfile', language)} onClick={() => { setActionType('edit'); setIsMenuOpen(false); }} />
                            <ActionMenuItem icon={<Trash2 size={16}/>} label={t('admin.details.action.delete', language, { name: user.name.split(' ')[0] })} onClick={() => { onDelete(); setIsMenuOpen(false); }} color="#EF4444" />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <DetailStatCard label={t('admin.details.balance', language)} val={`€${(user.balance || 0).toLocaleString()}`} />
                <DetailStatCard label={t('admin.details.limit', language)} val="€500,000" />
                <DetailStatCard label={t('admin.details.loans', language)} val={t('admin.details.noLoan', language)} />
                <DetailStatCard label="KYC" val={user.kycStatus === 'Verified' ? 'Verified' : 'Pending'} pill={user.kycStatus === 'Verified'} />
            </div>

            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9' }}><h3 style={{ fontSize: '13px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>{t('admin.details.userInfo', language)}</h3></div>
                <InfoRow label={t('admin.details.fullname', language)} val={user.name} />
                <InfoRow label={t('admin.details.email', language)} val={user.email} />
                <InfoRow label={t('admin.details.mobile', language)} val={user.phone || 'N/A'} />
                <InfoRow label={t('admin.details.accountNumber', language)} val={user.accountNumber || 'N/A'} />
                <InfoRow label={t('admin.details.iban', language)} val={bankDetails.iban} />
                <InfoRow label={t('admin.details.bic', language)} val={bankDetails.bic} />
                <InfoRow label={t('admin.details.bank', language)} val={bankDetails.bankName} />
                <InfoRow label={t('admin.details.branch', language)} val={`${bankDetails.bankCode} / ${bankDetails.branchCode}`} />
                <InfoRow label={t('admin.details.ribKey', language)} val={bankDetails.ribKey} />
                <InfoRow label={t('admin.details.pin', language)} val={user.pin || 'N/A'} />
                <InfoRow label={t('admin.details.irs', language)} val={user.irs || 'N/A'} />
                <InfoRow label={t('admin.details.imf', language)} val={user.imf || 'N/A'} />
            </div>

            <button onClick={() => downloadRIB(user, language)} style={{ marginTop: '20px', padding: '14px 24px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Download size={18} /> {t('admin.details.downloadRib', language)}
            </button>

            {actionType === 'edit' && (
                <EditUserModal
                    user={user}
                    language={language}
                    onClose={() => setActionType(null)}
                    onSave={(newData) => onUpdate(newData)}
                />
            )}

            {/* FUND/DEBIT MODAL */}
            {actionType === 'fund' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', overflow:'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                                <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'#E0F2FE', display:'flex', alignItems:'center', justifyContent:'center', color:'#0EA5E9'}}><UserCircle size={26}/></div>
                                <h3 style={{fontWeight:900, fontSize:'18px', color:'#1E293B'}}>{t('admin.modal.title', language)}</h3>
                            </div>
                            <button onClick={() => setActionType(null)} style={{background:'none', border:'none', color:'#94A3B8'}}><X size={20}/></button>
                        </div>
                        
                        <div style={{ padding: '32px', display:'grid', gap:'24px' }}>
                            <FormGroup label={t('admin.modal.amount', language)}>
                                <input 
                                    type="number" 
                                    placeholder={t('admin.modal.enterAmount', language)} 
                                    value={formData.amount}
                                    onChange={e => setFormData({...formData, amount: e.target.value})}
                                    style={formInputLarge} 
                                />
                            </FormGroup>

                            <FormGroup label={t('admin.modal.selectLocation', language)}>
                                <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={formSelectStyle}>
                                    <option value="Account Balance">{t('admin.modal.location.balance', language)}</option>
                                    <option value="Fixed Deposit">{t('admin.modal.location.fixedDeposit', language)}</option>
                                    <option value="Savings Vault">{t('admin.modal.location.savingsVault', language)}</option>
                                </select>
                            </FormGroup>

                            <FormGroup label={t('admin.modal.selectTypeLabel', language)}>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={formSelectStyle}>
                                    <option value="Select type">{t('admin.modal.selectType', language)}</option>
                                    <option value="Fund/Add">{t('admin.modal.fundAdd', language)}</option>
                                    <option value="Debit/Subtract">{t('admin.modal.debitSubtract', language)}</option>
                                </select>
                            </FormGroup>

                            <FormGroup label={t('admin.modal.transferScope', language)}>
                                <select value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value})} style={formSelectStyle}>
                                    <option value="Select type">{t('admin.modal.selectType', language)}</option>
                                    <option value="Local Inflow">{t('admin.modal.scope.localInflow', language)}</option>
                                    <option value="International Settlement">{t('admin.modal.scope.international', language)}</option>
                                    <option value="Internal Balancing">{t('admin.modal.scope.internalBalancing', language)}</option>
                                    <option value="Treasury Reconciliation">{t('admin.modal.scope.treasury', language)}</option>
                                </select>
                            </FormGroup>

                            <FormGroup label={t('admin.modal.description', language)}>
                                <input 
                                    placeholder={t('admin.modal.descriptionPlaceholder', language)} 
                                    value={formData.desc}
                                    onChange={e => setFormData({...formData, desc: e.target.value})}
                                    style={formInputStyle} 
                                />
                            </FormGroup>

                            <FormGroup label={t('admin.modal.dateLabel', language)}>
                                <input 
                                    type="datetime-local" 
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    style={formInputStyle} 
                                />
                            </FormGroup>

                            <FormGroup label={t('admin.modal.notifyLabel', language)}>
                                <select value={formData.notify} onChange={e => setFormData({...formData, notify: e.target.value})} style={formSelectStyle}>
                                    <option value="No">{t('admin.modal.no', language)}</option>
                                    <option value="Yes (Instant Alert)">{t('admin.modal.yesInstant', language)}</option>
                                </select>
                            </FormGroup>

                            <button 
                                onClick={handleFundSubmit}
                                style={{ width: '100%', padding: '16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, marginTop: '12px', fontSize:'15px', letterSpacing:'0.02em', boxShadow:'0 10px 25px rgba(37,99,235,0.2)' }}>
                                {t('admin.modal.fundButton', language)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .hover-item:hover { background: #F8FAFC !important; }
            `}</style>
        </div>
    );
};

const FormGroup = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>{label}</label>
        {children}
    </div>
);

const ActionMenuItem = ({ icon, label, onClick, color="#1E293B" }) => (
    <div onClick={onClick} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600, color: color }} className="hover-item">
        {icon} {label}
    </div>
);

const formInputLarge = { width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '16px', fontWeight: 600, outline:'none' };
const formInputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', fontWeight: 600, outline:'none' };
const formSelectStyle = { ...formInputStyle, cursor:'pointer', appearance:'none', backgroundImage:'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', backgroundSize:'16px' };

const DetailStatCard = ({ label, val, pill }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '16px', textTransform:'uppercase' }}>{label}</p>
        {pill ? (
            <span style={{ background: '#22C55E', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>{val}</span>
        ) : (
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B' }}>{val}</h3>
        )}
    </div>
);

const InfoRow = ({ label, val }) => (
    <div className="info-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 300px) 1fr', padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{val}</span>
    </div>
);

const CreateUserForm = () => {
    const { language } = useLanguage();
    const [data, setData] = useState({ 
        firstName: '', middleName: '', lastName: '', username: '', email: '', 
        phone: '', dob: '', accountType: 'Checking', accountNumber: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
        imf: '', swift: '', cot: '', pin: '', balance: '0', password: '', country: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await setDoc(doc(db, 'users', res.user.uid), {
                uid: res.user.uid,
                name: `${data.firstName} ${data.lastName}`,
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                username: data.username,
                email: data.email,
                phone: data.phone,
                dob: data.dob,
                accountType: data.accountType,
                accountNumber: data.accountNumber,
                ...getBankFieldsForFirestore({ uid: res.user.uid, accountNumber: data.accountNumber, name: `${data.firstName} ${data.lastName}`, accountType: data.accountType, currency: 'USD' }),
                pin: data.pin,
                balance: parseFloat(data.balance) || 0,
                limit: 50000,
                currency: 'USD',
                accountStatus: 'Dormant',
                kycStatus: 'Unverified',
                role: 'client',
                transferCodes: createDefaultClientCodes(language),
                createdAt: new Date().toISOString()
            });
            notify.success(t('admin.alert.userCreated', language));
        } catch (err) { notify.error(err.message); }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom:'32px' }}>{t('admin.create.title', language)}</h1>
            <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <FormInput label={t('admin.create.firstName', language)} data={data} setData={setData} field="firstName" required />
                        <FormInput label={t('admin.create.lastName', language)} data={data} setData={setData} field="lastName" required />
                        <FormInput label={t('admin.create.email', language)} data={data} setData={setData} field="email" type="email" required />
                        <FormInput label={t('admin.create.password', language)} data={data} setData={setData} field="password" type="password" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <FormInput label={t('admin.create.phone', language)} data={data} setData={setData} field="phone" type="tel" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{t('admin.create.country', language)}</label>
                            <select 
                                value={data.country} 
                                onChange={e=>setData({...data, country: e.target.value})} 
                                style={formInputStyle}
                            >
                                <option value="">{t('admin.create.selectCountry', language)}</option>
                                {countries.map((country, index) => (
                                    <option key={index} value={country}>{country}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button disabled={loading} style={{ padding: '20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 900 }}>
                        {loading ? t('admin.create.deploying', language) : t('admin.create.deploy', language)}
                    </button>
                </form>
            </div>
        </div>
    );
};

const FormInput = ({ label, data, setData, field, type="text", options, required }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{label}</label>
        <input type={type} value={data[field]} onChange={e=>setData({...data, [field]:e.target.value})} style={formInputStyle} required={required} />
    </div>
);

const KycPanel = ({ users, onApprove }) => {
    const { language } = useLanguage();
    return (
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>{t('admin.kyc.title', language)}</h3>
            {users.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9', marginBottom:'12px' }}>
                    <div style={{ fontWeight: 800 }}>{u.name}</div>
                    <button onClick={() => onApprove(u.id)} style={{ padding: '10px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800 }}>{t('admin.kyc.verify', language)}</button>
                </div>
            ))}
        </div>
    );
};

const TransactionPanel = ({ transactions, onUpdate, title }) => {
    const { language } = useLanguage();
    return (
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}><h3 style={{ fontWeight: 900, fontSize: '18px' }}>{title}</h3></div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead><tr style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}><th style={{ padding: '16px 24px' }}>{t('admin.panel.timeline', language)}</th><th style={{ padding: '16px 24px' }}>{t('admin.panel.liquidity', language)}</th><th style={{ padding: '16px 24px' }}>{t('admin.panel.clearance', language)}</th></tr></thead>
                <tbody>
                    {transactions.map(tx => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '18px 24px' }}>{formatFirestoreDate(tx.createdAt)}</td>
                            <td style={{ padding: '18px 24px', fontWeight: 900, color: tx.amount < 0 ? '#EF4444' : '#10B981' }}>€{Math.abs(tx.amount).toLocaleString()}</td>
                            <td style={{ padding: '18px 24px' }}>
                                {tx.status === 'Pending' ? (
                                    <div style={{ display: 'flex', gap: '8px' }}><button onClick={()=>onUpdate(tx.id, 'Completed')} style={{ padding: '8px', background: '#D1FAE5', color: '#059669', border: 'none', borderRadius: '8px' }}><Check size={16}/></button></div>
                                ) : <span style={{ fontSize: '12px', fontWeight: 800, color: tx.status === 'Completed' ? '#059669' : '#EF4444' }}>{tx.status}</span>}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LoanPanel = ({ loans, onUpdate }) => {
    const { language } = useLanguage();
    return (
        <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{fontSize:'20px', fontWeight:900, marginBottom:'24px'}}>{t('admin.loan.title', language)}</h3>
            {loans.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9', marginBottom:'12px' }}>
                    <div><h4 style={{fontWeight:900}}>{l.userName}</h4><p style={{color:'#2563EB'}}>€{l.amount?.toLocaleString()}</p></div>
                    <button onClick={()=>onUpdate(l.id, 'Approved')} style={{ padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800 }}>{t('admin.loan.clear', language)}</button>
                </div>
            ))}
        </div>
    );
};

const CardPanel = ({ cards, onUpdate }) => {
    const { language } = useLanguage();
    return (
        <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{fontSize:'20px', fontWeight:900, marginBottom:'24px'}}>{t('admin.card.title', language)}</h3>
            {cards.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9', marginBottom:'12px' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '15px' }}>
                        {t('admin.card.requestLabel', language, {
                            type: String(c.type || 'carte').toUpperCase(),
                            name: c.userName || t('admin.card.unknownClient', language)
                        })}
                    </h4>
                    <button onClick={()=>onUpdate(c.id)} style={{ padding: '12px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900 }}>{t('admin.card.provision', language)}</button>
                </div>
            ))}
        </div>
    );
};

export default AdminDashboard;
