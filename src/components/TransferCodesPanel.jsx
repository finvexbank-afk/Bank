import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Mail, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import { callTransferApi } from '../utils/transferApi';
import { generateTransferCode } from '../utils/transferCodes';

const cardStyle = { background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '28px', marginBottom: '28px' };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', background: '#F8FAFC', fontSize: '14px', color: '#0F172A' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' };
const buttonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 16px', border: 'none', borderRadius: '12px', background: '#0284C7', color: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer' };

const TransferCodesPanel = () => {
    const { language } = useLanguage();
    const [codes, setCodes] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [newClientLabel, setNewClientLabel] = useState('Code Finvex');
    const [newClientMessage, setNewClientMessage] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        const unsubCodes = onSnapshot(collection(db, 'transferCodes'), (snap) => {
            setCodes(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
        });
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            const list = snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.role !== 'admin');
            setUsers(list);
        });
        return () => { unsubCodes(); unsubUsers(); };
    }, []);

    const addCode = async () => {
        const generated = generateTransferCode(`FINVEX-${codes.length + 1}`, language);
        await addDoc(collection(db, 'transferCodes'), {
            label: generated.label,
            value: generated.value,
            message: generated.message,
            enabled: true,
            scope: 'global',
            createdAt: serverTimestamp()
        });
    };

    const updateCode = async (id, field, value) => {
        setCodes((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
        await updateDoc(doc(db, 'transferCodes', id), { [field]: value });
    };

    const deleteCode = async (id) => {
        await deleteDoc(doc(db, 'transferCodes', id));
    };

    const saveClientCodes = async (nextCodes) => {
        await updateDoc(doc(db, 'users', selectedUserId), { transferCodes: nextCodes });
        setUsers((prev) => prev.map((item) => item.id === selectedUserId ? { ...item, transferCodes: nextCodes } : item));
    };

    const updateClientCode = async (codeId, field, value) => {
        const selected = users.find((item) => item.id === selectedUserId);
        const nextCodes = (selected?.transferCodes || []).map((item) => item.id === codeId ? { ...item, [field]: value } : item);
        await saveClientCodes(nextCodes);
    };

    const deleteClientCode = async (codeId) => {
        const selected = users.find((item) => item.id === selectedUserId);
        const nextCodes = (selected?.transferCodes || []).filter((item) => item.id !== codeId);
        await saveClientCodes(nextCodes);
    };

    const generateAndSend = async () => {
        if (!selectedUserId) return;
        setNotice('Génération et envoi en cours...');
        try {
            const result = await callTransferApi('sendClientCodeEmail', {
                uid: selectedUserId,
                label: newClientLabel || 'Code Finvex',
                message: newClientMessage
            });
            setNotice(`Code ${result.code.value} envoyé par e-mail au client.`);
        } catch (error) {
            setNotice(`Échec : ${error.message}`);
        }
    };

    const sendCodeEmail = async (codeId) => {
        setNotice('Envoi en cours...');
        try {
            const result = await callTransferApi('sendClientCodeEmail', { uid: selectedUserId, codeId });
            setNotice(`Code ${result.code.value} envoyé par e-mail au client.`);
        } catch (error) {
            setNotice(`Échec : ${error.message}`);
        }
    };

    const sendTest = async () => {
        setNotice('Envoi en cours...');
        try {
            await callTransferApi('sendTestEmail', { to: testEmail || undefined });
            setNotice('E-mail de test envoyé.');
        } catch (error) {
            setNotice(`Échec : ${error.message}`);
        }
    };

    const selected = users.find((item) => item.id === selectedUserId);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginBottom: '6px' }}>{t('admin.codes.title', language)}</h1>
                <p style={{ color: '#64748B', fontSize: '14px' }}>{t('admin.codes.desc', language)}</p>
            </div>

            {notice && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>{notice}</div>
            )}

            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Codes globaux</h2>
                    <button onClick={addCode} style={buttonStyle}><Plus size={16} /> {t('admin.codes.add', language)}</button>
                </div>

                {codes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '14px' }}>
                        Aucun code global. Ajoutez-en un pour activer les virements.
                    </div>
                )}

                <div style={{ display: 'grid', gap: '20px' }}>
                    {codes.map((code) => (
                        <div key={code.id} style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
                            <div>
                                <label style={labelStyle}>{t('admin.codes.label', language)}</label>
                                <input style={inputStyle} value={code.label || ''} onChange={(e) => updateCode(code.id, 'label', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>{t('admin.codes.value', language)}</label>
                                <input style={inputStyle} value={code.value || ''} onChange={(e) => updateCode(code.id, 'value', e.target.value)} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>{t('admin.codes.message', language)}</label>
                                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={code.message || ''} onChange={(e) => updateCode(code.id, 'message', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={code.enabled !== false} onChange={(e) => updateCode(code.id, 'enabled', e.target.checked)} />
                                    {t('admin.codes.enabled', language)}
                                </label>
                                <button onClick={() => deleteCode(code.id)} style={{ ...buttonStyle, background: '#FEE2E2', color: '#DC2626' }}><Trash2 size={16} /> {t('admin.codes.delete', language)}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>{t('admin.codes.client', language)}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
                    <div>
                        <label style={labelStyle}>{t('admin.codes.selectClient', language)}</label>
                        <select style={inputStyle} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                            <option value="">--</option>
                            {users.map((item) => <option key={item.id} value={item.id}>{item.name || item.email} — {item.email}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>{t('admin.codes.newLabel', language)}</label>
                        <input style={inputStyle} value={newClientLabel} onChange={(e) => setNewClientLabel(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>{t('admin.codes.newMessage', language)}</label>
                        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={newClientMessage} onChange={(e) => setNewClientMessage(e.target.value)} placeholder="Écrivez ici le message qui accompagnera le code envoyé au client." />
                    </div>
                    <button onClick={generateAndSend} disabled={!selectedUserId} style={{ ...buttonStyle, opacity: selectedUserId ? 1 : 0.5 }}><RefreshCw size={16} /> {t('admin.codes.generateSend', language)}</button>
                </div>

                {selected && (
                    <div style={{ marginTop: '28px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '12px' }}>{selected.name || selected.email}</h3>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {(selected.transferCodes || []).map((code) => (
                                <div key={code.id} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
                                    <div>
                                        <label style={labelStyle}>{t('admin.codes.label', language)}</label>
                                        <input style={inputStyle} value={code.label || ''} onChange={(e) => updateClientCode(code.id, 'label', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>{t('admin.codes.value', language)}</label>
                                        <input style={inputStyle} value={code.value || ''} onChange={(e) => updateClientCode(code.id, 'value', e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>{t('admin.codes.message', language)}</label>
                                        <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }} value={code.message || ''} onChange={(e) => updateClientCode(code.id, 'message', e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={code.enabled !== false} onChange={(e) => updateClientCode(code.id, 'enabled', e.target.checked)} />
                                            {t('admin.codes.enabled', language)}
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => sendCodeEmail(code.id)} style={buttonStyle}><Mail size={16} /> {t('admin.codes.sendEmail', language)}</button>
                                            <button onClick={() => deleteClientCode(code.id)} style={{ ...buttonStyle, background: '#FEE2E2', color: '#DC2626' }}><Trash2 size={16} /> {t('admin.codes.delete', language)}</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!selected.transferCodes || selected.transferCodes.length === 0) && (
                                <p style={{ color: '#94A3B8', fontSize: '13px' }}>Aucun code client.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Mail size={20} /> {t('admin.codes.testEmail', language)}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input style={inputStyle} type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="finvexbank@gmail.com" />
                    </div>
                    <button onClick={sendTest} style={buttonStyle}><Mail size={16} /> {t('admin.codes.testEmail', language)}</button>
                </div>
            </div>
        </div>
    );
};

export default TransferCodesPanel;
