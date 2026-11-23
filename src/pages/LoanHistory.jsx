import React, { useEffect, useState } from 'react';
import { Landmark, Clock, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

const statusStyle = {
    Pending: { background: '#FEF3C7', color: '#B45309', icon: Clock },
    Approved: { background: '#D1FAE5', color: '#047857', icon: CheckCircle2 },
    Rejected: { background: '#FEE2E2', color: '#B91C1C', icon: XCircle }
};

const formatDate = (value) => {
    if (!value) return '—';
    try {
        const date = value?.toDate ? value.toDate() : new Date(value);
        return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
    } catch {
        return '—';
    }
};

const LoanHistory = () => {
    const { user } = useAppContext();
    const { language } = useLanguage();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return undefined;
        const q = query(collection(db, 'loans'), where('userId', '==', user.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            setLoans(list);
            setLoading(false);
        }, (error) => {
            console.error('Loan history error:', error);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    const statusLabel = (status) => {
        if (status === 'Approved') return t('loans.statusApproved', language);
        if (status === 'Rejected') return t('loans.statusRejected', language);
        return t('loans.statusPending', language);
    };

    return (
        <MainLayout>
            <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>{t('loanHistory.title', language)}</h1>
                    <p style={{ color: '#64748B', fontSize: '14px' }}>{t('loanHistory.subtitle', language)}</p>
                </div>

                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Landmark size={20} color="#0284C7" />
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>{t('loans.pastApplications', language)}</h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>{t('loanHistory.loading', language)}</div>
                    ) : loans.length === 0 ? (
                        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <CalendarDays size={36} color="#94A3B8" style={{ margin: '0 auto 14px' }} />
                            <p style={{ color: '#64748B', fontSize: '14px' }}>{t('loanHistory.empty', language)}</p>
                        </div>
                    ) : (
                        <div>
                            {loans.map((loan) => {
                                const style = statusStyle[loan.status] || statusStyle.Pending;
                                const StatusIcon = style.icon;
                                return (
                                    <div key={loan.id} style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: style.background, color: style.color, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                            <StatusIcon size={20} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: '160px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                                                €{Number(loan.amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                            </h3>
                                            <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                                                {loan.purpose || '—'} • {loan.duration || '—'} {language === 'fr' ? 'mois' : language === 'de' ? 'Monate' : language === 'es' ? 'meses' : 'months'}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', background: style.background, color: style.color, fontSize: '11px', fontWeight: 800 }}>
                                                {statusLabel(loan.status)}
                                            </span>
                                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '6px 0 0' }}>{formatDate(loan.date || loan.createdAt)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default LoanHistory;
