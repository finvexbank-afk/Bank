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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { countries } from '../data/countries';
import LanguageSelector from '../components/LanguageSelector';

const AdminDashboard = () => {
    const { user, logout } = useAppContext();
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

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin-login" />;
    }

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
        setLoading(false);
        return () => { unsubUsers(); unsubTxs(); unsubCards(); unsubLoans(); };
    }, []);

    const toggleMenu = (menu) => {
        setExpandedMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
    };

    const approveKYC = async (uid) => {
        await updateDoc(doc(db, 'users', uid), { kycStatus: 'Verified', accountStatus: 'Active' });
        alert("Account Verified!");
    };

    const handleTransaction = async (txId, status) => {
        const txRef = doc(db, 'transactions', txId);
        await updateDoc(txRef, { status: status });
    };

    const handleLoan = async (loanId, status) => {
        await updateDoc(doc(db, 'loans', loanId), { status: status });
    };

    const totalDepositValue = users.reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
    const pendingDeposits = transactions.filter(t => (t.type === 'Deposit' || t.type === 'credit') && t.status === 'Pending');
    const totalTransfersValue = transactions.filter(t => t.type === 'Transfer' || t.type === 'debit').reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
    const pendingTransfers = transactions.filter(t => (t.type === 'Transfer' || t.type === 'International Wire' || t.type === 'debit') && t.status === 'Pending');
    
    return (
        <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden', position: 'relative' }}>
            
            {window.innerWidth <= 1024 && isSidebarOpen && (
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
                position: window.innerWidth <= 1024 ? 'fixed' : 'relative',
                height: '100%',
                left: isSidebarOpen ? '0' : '-280px',
                boxShadow: isSidebarOpen && window.innerWidth <= 1024 ? '20px 0 50px rgba(0,0,0,0.1)' : 'none'
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
                    <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Global Overview" onClick={() => {setActiveTab('dashboard'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                    <NavItem active={activeTab === 'manage-users'} icon={<Users size={18} />} label="User Directory" onClick={() => {setActiveTab('manage-users'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                    <NavItem active={activeTab === 'create-user'} icon={<UserPlus size={18} />} label="Deploy New User" onClick={() => {setActiveTab('create-user'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                    <NavItem active={activeTab === 'kyc'} icon={<ShieldCheck size={18} />} label="KYC Verifications" onClick={() => {setActiveTab('kyc'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                    
                    <CollapsibleItem icon={<ArrowUpRight size={18} />} label="Transaction Ledger" expanded={expandedMenus.includes('ledger')} onToggle={() => toggleMenu('ledger')}>
                        <SubNavItem label="Outbound Wires" active={activeTab === 'transfers'} onClick={() => {setActiveTab('transfers'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                        <SubNavItem label="Inbound Deposits" active={activeTab === 'deposits'} onClick={() => {setActiveTab('deposits'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                    </CollapsibleItem>

                    <CollapsibleItem icon={<Landmark size={18} />} label="Lending Services" expanded={expandedMenus.includes('loans')} onToggle={() => toggleMenu('loans')}>
                        <SubNavItem label="Pending Requests" active={activeTab === 'loan-requests'} onClick={() => {setActiveTab('loan-requests'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                    </CollapsibleItem>

                    <CollapsibleItem icon={<CardIcon size={18} />} label="Card Infrastructure" expanded={expandedMenus.includes('cards')} onToggle={() => toggleMenu('cards')}>
                        <SubNavItem label="Issuance Requests" active={activeTab === 'card-requests'} onClick={() => {setActiveTab('card-requests'); setViewMode('list'); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} />
                    </CollapsibleItem>
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9' }}>
                     <button onClick={logout} style={{ width: '100%', padding: '12px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}>
                        <LogOut size={16} /> Termination Session
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

                <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                    {activeTab === 'dashboard' && viewMode === 'list' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="flex-row-mobile">
                                <div><h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Institutional Terminal</h1><p style={{ color: '#64748B', fontWeight: 500 }}>heartbeat and liquidity overview.</p></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                                <ComplexStat icon={<Wallet color="#F59E0B" />} label="Aggregated Balance" value={`€${totalDepositValue.toLocaleString()}`} color="#FFFBEB" />
                                <ComplexStat icon={<RefreshCw color="#3B82F6" />} label="Inbound Backlog" value={pendingDeposits.length} color="#EFF6FF" />
                                <ComplexStat icon={<ArrowUpRight color="#EF4444" />} label="Velocity Volume" value={`€${totalTransfersValue.toLocaleString()}`} color="#FEF2F2" />
                                <ComplexStat icon={<RefreshCw color="#6366F1" />} label="Wire Verification" value={pendingTransfers.length} color="#EEF2FF" />
                            </div>
                        </>
                    )}

                    {activeTab === 'manage-users' && viewMode === 'list' && (
                        <UsersPanel 
                            users={users} 
                            onManage={(u) => { setSelectedUser(u); setViewMode('detail'); }} 
                        />
                    )}

                    {activeTab === 'manage-users' && viewMode === 'detail' && selectedUser && (
                        <UserDetailsView 
                            user={selectedUser} 
                            onBack={() => setViewMode('list')} 
                            onUpdate={async (newData) => {
                                await updateDoc(doc(db, 'users', selectedUser.id), newData);
                                setSelectedUser({...selectedUser, ...newData});
                            }}
                            onDelete={async () => {
                                if(window.confirm(`⚠️ DELETION: Permanent removal of ${selectedUser.name}?`)) {
                                    await deleteDoc(doc(db, 'users', selectedUser.id));
                                    setViewMode('list');
                                    setSelectedUser(null);
                                }
                            }}
                        />
                    )}

                    {activeTab === 'create-user' && <CreateUserForm />}
                    {activeTab === 'kyc' && <KycPanel users={users.filter(u => u.kycStatus && u.kycStatus !== 'Unverified')} onApprove={approveKYC} />}
                    {activeTab === 'transfers' && <TransactionPanel transactions={transactions.filter(t => t.type === 'Transfer' || t.type === 'International Wire' || t.type === 'debit')} onUpdate={handleTransaction} title="Global Wire Settlement" />}
                    {activeTab === 'deposits' && <TransactionPanel transactions={transactions.filter(t => t.type === 'Deposit' || t.type === 'credit')} onUpdate={handleTransaction} title="Treasury Inbound Management" />}
                    {activeTab === 'loan-requests' && <LoanPanel loans={loans.filter(l => l.status === 'Pending')} onUpdate={handleLoan} />}
                    {activeTab === 'card-requests' && <CardPanel cards={cards.filter(c => c.status === 'Pending')} onUpdate={async (id) => {
                        const ref = doc(db, 'cards', id);
                        await updateDoc(ref, { status: 'Active', number: '5172 '+Math.floor(1000+Math.random()*9000)+' '+Math.floor(1000+Math.random()*9000)+' '+Math.floor(1000+Math.random()*9000), expiry: '08/30', cvv: Math.floor(100+Math.random()*900).toString() });
                        alert("Infrastructure Deployment: SECURE CARD ACTIVATED");
                    }} />}
                </div>
            </main>

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

const UsersPanel = ({ users, onManage }) => {
    const [search, setSearch] = useState('');

    const filtered = users.filter(u => 
        u.name?.toLowerCase().includes(search.toLowerCase()) || 
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ fontWeight: 900, fontSize: '18px' }}>User Directory Control</h3>
                <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                        placeholder="Search name, username or err..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600, background: '#F8FAFC' }} 
                    />
                </div>
            </div>

            <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC' }}>
                        <tr>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Client Name</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Username</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Email</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Date Registered</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Action</th>
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
                                <td style={{ padding: '18px 24px' }}>{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ padding: '18px 24px' }}>
                                    <button onClick={() => onManage(u)} style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 800 }}>Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserDetailsView = ({ user, onBack, onUpdate, onDelete }) => {
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
        if (isNaN(amt)) { alert("Institutional Order Denied: Invalid Liquidity Amount."); return; }
        
        let newBalance = user.balance || 0;
        if (formData.type === 'Fund/Add') newBalance += amt;
        else if (formData.type === 'Debit/Subtract') newBalance -= amt;
        else { alert("Protocol Specification Missing: Select adjustment type."); return; }

        await onUpdate({ balance: newBalance });
        
        // Log transaction
        await addDoc(collection(db, 'transactions'), {
            userId: user.id,
            amount: formData.type === 'Fund/Add' ? amt : -amt,
            type: formData.scope || 'Institutional Adjustment',
            desc: formData.desc || 'Treasury Reconciliation',
            status: 'Completed',
            createdAt: formData.date ? new Date(formData.date) : serverTimestamp()
        });

        alert(`TREASURY RECORD UPDATED: Account ${formData.type === 'Fund/Add' ? 'Funded' : 'Debited'} successfully.`);
        setActionType(null);
    };

    return (
        <div style={{ padding: '20px', background: '#F8FAFC', minHeight: '100%', borderRadius: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0EA5E9' }}><UserCircle size={40} /></div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>{user.name}</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700 }}><ArrowLeft size={18} /> back</button>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700 }}>Actions <ChevronDown size={18} /></button>
                    
                    {isMenuOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', zIndex: 100, width: '240px', padding: '8px 0' }}>
                            <ActionMenuItem icon={<DollarSign size={16}/>} label="Fund/Debit Account" onClick={() => { setActionType('fund'); setIsMenuOpen(false); }} />
                            <ActionMenuItem icon={<ImageIcon size={16}/>} label="Change Profile Pics" onClick={() => setIsMenuOpen(false)} />
                            <ActionMenuItem icon={<Key size={16}/>} label="Reset Password" onClick={() => setIsMenuOpen(false)} />
                            {user.accountStatus === 'Dormant' ? (
                                <ActionMenuItem icon={<Power size={16}/>} label="Set Account as Active" onClick={() => { onUpdate({ accountStatus: 'Active' }); setIsMenuOpen(false); }} color="#10B981" />
                            ) : (
                                <ActionMenuItem icon={<ShieldAlert size={16}/>} label="Set Account as Dormant" onClick={() => { onUpdate({ accountStatus: 'Dormant' }); setIsMenuOpen(false); }} color="#F59E0B" />
                            )}
                            <ActionMenuItem icon={<Edit3 size={16}/>} label="Edit User Profile" onClick={() => setIsMenuOpen(false)} />
                            <ActionMenuItem icon={<Trash2 size={16}/>} label={`Delete ${user.name.split(' ')[0]}`} onClick={() => { onDelete(); setIsMenuOpen(false); }} color="#EF4444" />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <DetailStatCard label="Account Balance" val={`€${(user.balance || 0).toLocaleString()}`} />
                <DetailStatCard label="Account Limit" val="€500,000" />
                <DetailStatCard label="Loans" val="No Loan" />
                <DetailStatCard label="KYC" val={user.kycStatus === 'Verified' ? 'Verified' : 'Pending'} pill={user.kycStatus === 'Verified'} />
            </div>

            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9' }}><h3 style={{ fontSize: '13px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>USER INFORMATION</h3></div>
                <InfoRow label="Fullname" val={user.name} />
                <InfoRow label="Email Address" val={user.email} />
                <InfoRow label="Mobile Number" val={user.phone || 'N/A'} />
                <InfoRow label="Account Number" val={user.accountNumber || 'N/A'} />
                <InfoRow label="4 Digit Transaction Pin" val={user.pin || 'N/A'} />
                <InfoRow label="IRS Filing No." val={user.irs || 'N/A'} />
                <InfoRow label="IMF Code" val={user.imf || 'N/A'} />
            </div>

            {/* FUND/DEBIT MODAL */}
            {actionType === 'fund' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', overflow:'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                                <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'#E0F2FE', display:'flex', alignItems:'center', justifyContent:'center', color:'#0EA5E9'}}><UserCircle size={26}/></div>
                                <h3 style={{fontWeight:900, fontSize:'18px', color:'#1E293B'}}>Fund/Debit Account.</h3>
                            </div>
                            <button onClick={() => setActionType(null)} style={{background:'none', border:'none', color:'#94A3B8'}}><X size={20}/></button>
                        </div>
                        
                        <div style={{ padding: '32px', display:'grid', gap:'24px' }}>
                            <FormGroup label="Amount">
                                <input 
                                    type="number" 
                                    placeholder="Enter amount" 
                                    value={formData.amount}
                                    onChange={e => setFormData({...formData, amount: e.target.value})}
                                    style={formInputLarge} 
                                />
                            </FormGroup>

                            <FormGroup label="Select where to Fund/Debit">
                                <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={formSelectStyle}>
                                    <option>Account Balance</option>
                                    <option>Fixed Deposit</option>
                                    <option>Savings Vault</option>
                                </select>
                            </FormGroup>

                            <FormGroup label="Select Fund to add, debit to subtract.">
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={formSelectStyle}>
                                    <option>Select type</option>
                                    <option>Fund/Add</option>
                                    <option>Debit/Subtract</option>
                                </select>
                            </FormGroup>

                            <FormGroup label="Transfer Scope.">
                                <select value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value})} style={formSelectStyle}>
                                    <option>Select type</option>
                                    <option>Local Inflow</option>
                                    <option>International Settlement</option>
                                    <option>Internal Balancing</option>
                                    <option>Treasury Reconciliation</option>
                                </select>
                            </FormGroup>

                            <FormGroup label="Description">
                                <input 
                                    placeholder="Institutional description..." 
                                    value={formData.desc}
                                    onChange={e => setFormData({...formData, desc: e.target.value})}
                                    style={formInputStyle} 
                                />
                            </FormGroup>

                            <FormGroup label="Date (You can back date transaction here)">
                                <input 
                                    type="datetime-local" 
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    style={formInputStyle} 
                                />
                            </FormGroup>

                            <FormGroup label="Send Email and SMS to User">
                                <select value={formData.notify} onChange={e => setFormData({...formData, notify: e.target.value})} style={formSelectStyle}>
                                    <option>No</option>
                                    <option>Yes (Instant Alert)</option>
                                </select>
                            </FormGroup>

                            <button 
                                onClick={handleFundSubmit}
                                style={{ width: '100%', padding: '16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, marginTop: '12px', fontSize:'15px', letterSpacing:'0.02em', boxShadow:'0 10px 25px rgba(37,99,235,0.2)' }}>
                                Fund Account
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 300px) 1fr', padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{val}</span>
    </div>
);

const CreateUserForm = () => {
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
                balance: parseFloat(data.balance),
                accountStatus: 'Dormant',
                role: 'user',
                createdAt: serverTimestamp()
            });
            alert("✅ INFRASTRUCTURE DEPLOYMENT SUCCESSFUL.");
        } catch (err) { alert(err.message); }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom:'32px' }}>Client Deployment</h1>
            <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <FormInput label="First Name" data={data} setData={setData} field="firstName" required />
                        <FormInput label="Last Name" data={data} setData={setData} field="lastName" required />
                        <FormInput label="Corporate Email" data={data} setData={setData} field="email" type="email" required />
                        <FormInput label="Access Code" data={data} setData={setData} field="password" type="password" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <FormInput label="Phone Number" data={data} setData={setData} field="phone" type="tel" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Country</label>
                            <select 
                                value={data.country} 
                                onChange={e=>setData({...data, country: e.target.value})} 
                                style={formInputStyle}
                            >
                                <option value="">Select a country</option>
                                {countries.map((country, index) => (
                                    <option key={index} value={country}>{country}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button disabled={loading} style={{ padding: '20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 900 }}>
                        {loading ? 'DEPLOYING...' : 'DEPLOY CLIENT NODE'}
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

const KycPanel = ({ users, onApprove }) => (
    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>Identity Verification Queue</h3>
        {users.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9', marginBottom:'12px' }}>
                <div style={{ fontWeight: 800 }}>{u.name}</div>
                <button onClick={() => onApprove(u.id)} style={{ padding: '10px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800 }}>Verify</button>
            </div>
        ))}
    </div>
);

const TransactionPanel = ({ transactions, onUpdate, title }) => (
    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}><h3 style={{ fontWeight: 900, fontSize: '18px' }}>{title} Ledger</h3></div>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}><th style={{ padding: '16px 24px' }}>Timeline</th><th style={{ padding: '16px 24px' }}>Liquidity</th><th style={{ padding: '16px 24px' }}>Clearance</th></tr></thead>
                <tbody>
                    {transactions.map(tx => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '18px 24px' }}>{new Date(tx.createdAt?.seconds*1000).toLocaleDateString()}</td>
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

const LoanPanel = ({ loans, onUpdate }) => (
    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
        <h3 style={{fontSize:'20px', fontWeight:900, marginBottom:'24px'}}>Financial Assistance Registry</h3>
        {loans.map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9', marginBottom:'12px' }}>
                <div><h4 style={{fontWeight:900}}>{l.userName}</h4><p style={{color:'#2563EB'}}>€{l.amount?.toLocaleString()}</p></div>
                <button onClick={()=>onUpdate(l.id, 'Approved')} style={{ padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Clear</button>
            </div>
        ))}
    </div>
);

const CardPanel = ({ cards, onUpdate }) => (
    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
        <h3 style={{fontSize:'20px', fontWeight:900, marginBottom:'24px'}}>Terminal Asset Deployment</h3>
        {cards.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9', marginBottom:'12px' }}>
                <h4 style={{fontWeight:900}}>{c.type} Infrastructure</h4>
                <button onClick={()=>onUpdate(c.id)} style={{ padding: '12px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900 }}>PROVISION</button>
            </div>
        ))}
    </div>
);

export default AdminDashboard;
