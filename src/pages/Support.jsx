import React, { useState } from 'react';
import { MessageSquare, Send, Paperclip, LifeBuoy, CheckCircle2 } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

const TICKET_TEXT_KEYS = {
    'Card delivery delay': 'support.ticket.cardDelay',
    'Crypto deposit missing': 'support.ticket.cryptoMissing',
    'New Request': 'support.ticket.newRequest',
    'In Progress': 'support.status.inProgress',
    'Resolved': 'support.status.resolved',
    'Pending': 'support.status.pending',
    'Yesterday': 'support.date.yesterday',
    'May 12, 2025': 'support.date.may12',
    'Just now': 'support.date.justNow'
};

const Support = () => {
    const { user } = useAppContext();
    const { language } = useLanguage();
    if (!user) return null;

    const [message, setMessage] = useState('');
    const [tickets, setTickets] = useState([
        { id: 'TKT-8932', subject: 'Card delivery delay', status: 'In Progress', date: 'Yesterday' },
        { id: 'TKT-8901', subject: 'Crypto deposit missing', status: 'Resolved', date: 'May 12, 2025' }
    ]);
    const [showSuccess, setShowSuccess] = useState(false);

    const tt = (text) => TICKET_TEXT_KEYS[text] ? t(TICKET_TEXT_KEYS[text], language) : text;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setMessage('');
                setTickets([{ id: `TKT-${Math.floor(Math.random() * 10000)}`, subject: 'New Request', status: 'Pending', date: 'Just now' }, ...tickets]);
            }, 2000);
        }
    };

    return (
        <MainLayout>
            <div className="dashboard-body grid-2-support" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* Left side: Ticket Creation */}
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{t('support.title', language)}</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{t('support.subtitle', language)}</p>
                    
                    <div className="widget-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <LifeBuoy size={20} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{t('support.card.title', language)}</h3>
                        </div>

                        {showSuccess ? (
                            <div style={{ padding: '32px 0', textAlign: 'center', color: '#059669' }}>
                                <CheckCircle2 size={48} style={{ margin: '0 auto 16px' }} />
                                <h4 style={{ fontSize: '18px', fontWeight: 600 }}>{t('support.success.title', language)}</h4>
                                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{t('support.success.subtitle', language)}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('support.topic.label', language)}</label>
                                    <select style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC' }}>
                                        <option>{t('support.topic.general', language)}</option>
                                        <option>{t('support.topic.card', language)}</option>
                                        <option>{t('support.topic.dispute', language)}</option>
                                        <option>{t('support.topic.technical', language)}</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('support.message.label', language)}</label>
                                    <textarea 
                                        rows="5"
                                        placeholder={t('support.message.placeholder', language)} 
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC', resize: 'vertical' }}
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" style={{ padding: '12px', background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Paperclip size={20} />
                                    </button>
                                    <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <Send size={18} /> {t('support.submit', language)}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Right side: History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="widget-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>{t('support.history.title', language)}</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {tickets.map(t => (
                                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                                            <MessageSquare size={18} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{tt(t.subject)}</h4>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.id} • {tt(t.date)}</p>
                                        </div>
                                    </div>
                                    <span style={{ 
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                        background: t.status === 'Resolved' ? '#ECFDF5' : (t.status === 'Pending' ? '#FEF3C7' : '#EFF6FF'),
                                        color: t.status === 'Resolved' ? '#059669' : (t.status === 'Pending' ? '#D97706' : '#2563EB')
                                    }}>
                                        {tt(t.status)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
};

export default Support;
