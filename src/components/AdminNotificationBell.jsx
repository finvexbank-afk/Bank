import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';

const formatDate = (value) => {
    if (!value) return '';
    try {
        const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    } catch {
        return '';
    }
};

const iconFor = (type) => {
    if (type === 'blocked') return <AlertTriangle size={18} />;
    if (type === 'completed') return <CheckCircle2 size={18} />;
    return <ArrowUpRight size={18} />;
};

const AdminNotificationBell = () => {
    const { language } = useLanguage();
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const q = query(collection(db, 'notifications'), where('audience', '==', 'admin'));
        return onSnapshot(q, (snap) => {
            const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
            rows.sort((a, b) => {
                const time = (value) => value?.createdAt?.toMillis?.() || new Date(value?.createdAt || 0).getTime();
                return time(b) - time(a);
            });
            setItems(rows);
        }, (err) => console.error('[Admin notifications]', err));
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const handleClick = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const unread = items.filter((item) => !item.read).length;
    const markRead = (id) => updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
    const markAll = () => Promise.all(items.filter((item) => !item.read).map((item) => markRead(item.id)));

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <button
                className="icon-btn"
                style={{ width: '36px', height: '36px', position: 'relative' }}
                onClick={() => setOpen(!open)}
                aria-label={t('notif.adminTitle', language)}
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px',
                        borderRadius: '9px', background: '#EF4444', color: 'white', fontSize: '10px',
                        fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 4px'
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="notification-backdrop" onClick={() => setOpen(false)} />
                    <div className="notification-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #F1F5F9' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{t('notif.adminTitle', language)}</h3>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {unread > 0 && (
                                    <button onClick={markAll} title={t('notif.markAll', language)} style={{ background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer', display: 'flex' }}>
                                        <CheckCheck size={18} />
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            {items.length === 0 ? (
                                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                                    {t('notif.empty', language)}
                                </div>
                            ) : items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => markRead(item.id)}
                                    style={{
                                        display: 'flex', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #F8FAFC',
                                        cursor: 'pointer', background: item.read ? 'white' : '#F0F9FF'
                                    }}
                                >
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                                        background: item.type === 'blocked' ? '#FEE2E2' : item.type === 'completed' ? '#D1FAE5' : '#E0F2FE',
                                        color: item.type === 'blocked' ? '#DC2626' : item.type === 'completed' ? '#047857' : '#0284C7',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        {iconFor(item.type)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                                            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{item.title}</h4>
                                            {!item.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />}
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, margin: '4px 0 0' }}>{item.body}</p>
                                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '6px 0 0' }}>{formatDate(item.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminNotificationBell;
