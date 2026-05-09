import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, Filter, Download as DownloadIcon, Calendar, Hash, MoreHorizontal, ChevronRight } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';

const Transactions = () => {
    const { user, transactions } = useAppContext();
    if (!user) return null;

    const [searchTerm, setSearchTerm] = useState('');

    const formatMoney = (amount) => {
        const val = amount || 0;
        return '€' + Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2 });
    };

    const filteredTransactions = transactions.filter(tx => {
        const query = searchTerm.toLowerCase();
        const to = tx.to?.toLowerCase() || '';
        const description = tx.description?.toLowerCase() || '';
        const ref = tx.ref?.toLowerCase() || tx.id?.toLowerCase() || '';
        return to.includes(query) || description.includes(query) || ref.includes(query);
    });

    return (
        <MainLayout>
            <div className="dashboard-body" style={{ display: 'block', maxWidth: '1100px', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                
                {/* Header Section */}
                <div className="flex-row-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>Account Activity</h1>
                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Real-time ledger of your financial operations.</p>
                    </div>
                    <button className="mobile-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#1E293B', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '14px' }}>
                        <DownloadIcon size={18} /> Export Statements
                    </button>
                </div>

                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    
                    {/* Filters & Search Header */}
                    <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                        <div className="flex-row-mobile" style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                                <Search size={18} color="#94A3B8" />
                                <input 
                                    type="text" 
                                    placeholder="Search by recipient or reference..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: 600, color: '#1E293B' }} 
                                />
                            </div>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                <Filter size={18} /> Filters
                            </button>
                        </div>
                    </div>

                    {/* Desktop View (Table) */}
                    <div className="desktop-only" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', background: 'white' }}>
                                    <th style={{ padding: '16px 24px', fontWeight: 800, letterSpacing: '0.05em' }}>Timeline</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 800, letterSpacing: '0.05em' }}>Description</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 800, letterSpacing: '0.05em' }}>Transaction ID</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 800, letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9', background: 'white', transition: '0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '18px 24px', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>{tx.date}</td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: tx.amount < 0 ? '#FEE2E2' : '#DCFCE7', color: tx.amount < 0 ? '#DC2626' : '#059669', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                                    {tx.amount < 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                </div>
                                                <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>{tx.to || tx.description || 'Global Settlement'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 24px', fontSize: '13px', fontFamily: 'monospace', color: '#64748B', fontWeight: 600 }}>{tx.ref || tx.id.substring(0, 10).toUpperCase()}</td>
                                        <td style={{ padding: '18px 24px' }}>
                                            <StatusBadge status={tx.status} />
                                        </td>
                                        <td style={{ padding: '18px 24px', textAlign: 'right', fontWeight: 800, color: tx.amount < 0 ? '#1E293B' : '#059669', fontSize: '15px' }}>
                                            {tx.amount > 0 ? '+' : '-'}{formatMoney(tx.amount)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>
                                            <div style={{ color: '#94A3B8', marginBottom: '12px' }}><Search size={40} style={{ margin: '0 auto' }} /></div>
                                            <p style={{ color: '#64748B', fontWeight: 600 }}>No matching transactions found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Card List) */}
                    <div className="mobile-only">
                        {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                            <div key={tx.id} style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', background: 'white', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: tx.amount < 0 ? '#FEE2E2' : '#DCFCE7', color: tx.amount < 0 ? '#DC2626' : '#059669', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                    {tx.amount < 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <h4 style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.to || tx.description || 'Transaction'}</h4>
                                        <span style={{ fontWeight: 800, color: tx.amount < 0 ? '#1E293B' : '#059669', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                            {tx.amount > 0 ? '+' : '-'}{formatMoney(tx.amount)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{tx.date}</span>
                                        <StatusBadge status={tx.status} small />
                                    </div>
                                </div>
                                <ChevronRight size={18} color="#CBD5E1" />
                            </div>
                        )) : (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <p style={{ color: '#64748B', fontWeight: 600 }}>No activities found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                .table-row-hover:hover { background: #F8FAFC !important; }
                
                @media (max-width: 1024px) {
                    .flex-row-mobile { flex-direction: column; align-items: stretch !important; gap: 16px; }
                    .mobile-full { width: 100% !important; }
                }
            `}</style>
        </MainLayout>
    );
};

const StatusBadge = ({ status, small }) => {
    const isCompleted = status === 'Completed' || status === 'Paid';
    const isPending = status === 'On-hold' || !status || status === 'Pending';
    
    return (
        <span style={{ 
            padding: small ? '2px 8px' : '6px 12px', 
            borderRadius: '20px', 
            fontSize: small ? '10px' : '12px', 
            fontWeight: 800, 
            background: isCompleted ? '#D1FAE5' : (isPending ? '#FEF3C7' : '#F1F5F9'), 
            color: isCompleted ? '#065F46' : (isPending ? '#92400E' : '#64748B'),
            display: 'inline-flex',
            alignItems: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
        }}>
            {status || 'Pending'}
        </span>
    );
};

export default Transactions;
