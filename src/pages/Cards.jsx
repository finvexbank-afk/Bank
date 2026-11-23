import React, { useState } from 'react';
import { 
  CreditCard, ChevronRight, ArrowLeft, Info, 
  CheckCircle2, HelpCircle, ShieldCheck, Plus,
  Hourglass, Wallet, Globe, Zap, Settings, Eye,
  RefreshCcw, List, Lock, ShieldAlert, EyeOff, CheckCircle, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useAppContext } from '../AppContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { t } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

const Cards = () => {
    const { user, card } = useAppContext();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list', 'apply', 'details'
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Derived states from Firestore
    const hasPendingApplication = card && card.status === 'Pending';
    const isCardActive = card && card.status === 'Active';
    
    const [flipped, setFlipped] = useState(false);
    const [showNumbers, setShowNumbers] = useState(false);
    const [cardLevel, setCardLevel] = useState('Standard');
    const [cardType, setCardType] = useState('visa');

    const rawNumber = String(card?.number || '').replace(/\D/g, '').slice(-16);
    const last4 = rawNumber.slice(-4) || '****';
    const maskedNumber = `•••• •••• •••• ${last4}`;
    const revealedNumber = rawNumber.replace(/(.{4})/g, '$1 ').trim() || maskedNumber;
    const cardNumberDisplay = isCardActive && showNumbers ? revealedNumber : maskedNumber;
    const expiryDisplay = isCardActive && showNumbers ? (card?.expiry || '--/--') : '--/--';
    const cvvDisplay = isCardActive && showNumbers ? (card?.cvv || '•••') : '•••';
    const cardBrand = String(card?.type || cardType || 'visa').toUpperCase();
    const cardTier = card?.level || cardLevel;

    const handleApply = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'cards'), {
                userId: user.id,
                userName: user.name,
                level: cardLevel,
                type: cardType,
                status: 'Pending',
                createdAt: serverTimestamp(),
                balance: 0,
                number: '•••• •••• •••• ****',
                expiry: '--/--',
                cvv: '•••'
            });
            setView('list');
        } catch (error) {
            console.error("Error applying for card:", error);
            alert(t('cards.submitFailed', language));
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- VIEW: DETAILS ---
    if (view === 'details') {
        const statusColor = isCardActive ? '#10B981' : '#F59E0B';
        const statusBg = isCardActive ? '#D1FAE5' : '#FEF3C7';
        
        return (
            <MainLayout>
                <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="flex-row-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>{t('cards.crumbDashboard', language)} {'\u003E'} {t('cards.crumbCards', language)} {'\u003E'} {t('cards.crumbDetails', language)}</p>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>{t('cards.detailsTitle', language)}</h1>
                        </div>
                        <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}><ArrowLeft size={18} /> {t('cards.back', language)}</button>
                    </div>

                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: 'clamp(24px, 6vw, 60px) clamp(16px, 4vw, 40px)', position: 'relative' }}>
                        {/* Status & Actions Header */}
                        <div className="flex-row-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
                            <div style={{ background: statusBg, color: statusColor, padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isCardActive ? <CheckCircle size={16} /> : <Hourglass size={16} />}
                                {isCardActive ? t('cards.statusActive', language) : t('cards.statusPending', language)}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {isCardActive && (
                                    <>
                                        <button className="mobile-full" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> {t('cards.deactivate', language)}</button>
                                        <button className="mobile-full" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={14} /> {t('cards.block', language)}</button>
                                    </>
                                )}
                                <button className="mobile-full" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}><List size={14} /> {t('cards.log', language)}</button>
                            </div>
                        </div>

                        {/* Card Preview Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                            <div className="card-preview" style={{ 
                                width: '100%', 
                                maxWidth: '420px', 
                                aspectRatio: '1.58/1', 
                                background: flipped ? '#1E293B' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)', 
                                borderRadius: '20px', 
                                padding: 'clamp(20px, 5vw, 32px)', 
                                color: 'white', 
                                boxShadow: '0 25px 50px rgba(0,0,0,0.15)', 
                                position: 'relative', 
                                transition: 'all 0.4s',
                                overflow: 'hidden'
                            }}>
                                {!flipped ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <p style={{ fontWeight: 700, fontSize: 'clamp(12px, 3vw, 15px)' }}>FINVEX BANK</p>
                                            <span style={{ fontWeight: 900, fontSize: 'clamp(14px, 4vw, 20px)' }}>{cardBrand}</span>
                                        </div>
                                        <div style={{ width: '45px', height: '35px', background: '#F59E0B', borderRadius: '6px', marginTop: '20px', opacity: 0.8 }}></div>
                                        <p style={{ fontSize: 'clamp(16px, 5vw, 22px)', fontWeight: 700, marginTop: 'auto', letterSpacing: '4px', marginBottom: '20px' }}>
                                            {cardNumberDisplay}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                                            <div><p style={{ fontSize: '9px', opacity: 0.7 }}>{t('cards.cardHolder', language)}</p><p style={{ fontWeight: 700, fontSize: '14px' }}>{user?.name?.toUpperCase()}</p></div>
                                            <div><p style={{ fontSize: '9px', opacity: 0.7 }}>{t('cards.validThru', language)}</p><p style={{ fontWeight: 700, fontSize: '14px' }}>{expiryDisplay}</p></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ paddingTop: '10%' }}>
                                        <div style={{ height: '18%', background: 'black', width: '120%', margin: '0 -10%', position: 'absolute', top: '15%' }}></div>
                                        <div style={{ marginTop: '25%', display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ width: '80%', height: '40px', background: 'white', borderRadius: '4px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: '15px', color: '#1E293B', fontWeight: 800, fontSize: '18px' }}>
                                                {cvvDisplay}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setFlipped(!flipped)} style={{ padding: '10px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', fontWeight: 700, fontSize: '14px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><RefreshCcw size={16} /> {t('cards.flip', language)}</button>
                                <button onClick={() => setShowNumbers(!showNumbers)} style={{ padding: '10px 20px', background: '#F0F9FF', border: '1px solid #0EA5E9', borderRadius: '10px', fontWeight: 700, fontSize: '14px', color: '#0EA5E9', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    {showNumbers ? <><EyeOff size={16} /> {t('cards.hide', language)}</> : <><Eye size={16} /> {t('cards.show', language)}</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Grid (Responsive) */}
                    <div className="grid-details-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '32px' }}>
                        <DetailInfo label={t('cards.cardNumber', language)} value={cardNumberDisplay} hasEye />
                        <DetailInfo label={t('cards.expirationDate', language)} value={expiryDisplay} hasEye />
                        <DetailInfo label="CVV" value={cvvDisplay} hasEye />
                        <DetailInfo label={t('cards.cardTypeLabel', language)} value={cardBrand} />
                        <DetailInfo label={t('cards.cardLevelLabel', language)} value={cardTier} />
                        <DetailInfo label={t('cards.currentBalance', language)} value="€0.00" />
                    </div>

                    {/* Additional Details */}
                    <div style={{ marginTop: '32px', background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>{t('cards.managementDetails', language)}</h3>
                        </div>
                        <div className="grid-details-mobile" style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>{t('cards.billingAddress', language)}</p>
                                <p style={{ fontSize: '15px', color: '#1E293B' }}>123 Rue du client, Paris, France</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginBottom: '16px' }}>{t('cards.cardLimits', language)}</p>
                                <LimitRow label={t('cards.dailyLimit', language)} value="€10,000.00" />
                                <LimitRow label={t('cards.monthlyLimit', language)} value="€20,000.00" />
                                <LimitRow label={t('cards.issuedDate', language)} value={t('cards.issuedDateValue', language)} />
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`
                    @media (max-width: 640px) {
                        .flex-row-mobile { flex-direction: column; align-items: flex-start !important; }
                        .mobile-full { width: 100%; justify-content: center !important; }
                    }
                `}</style>
            </MainLayout>
        );
    }

    if (view === 'apply') {
        return (
            <MainLayout>
                <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{t('cards.applyTitle', language)}</h1>
                        <button onClick={() => setView('list')} style={{ padding: '10px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' }}>{t('cards.cancel', language)}</button>
                    </div>
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: 'clamp(24px, 5vw, 40px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #B9E6FE' }}>
                            <Info size={20} color="#0EA5E9" />
                            <p style={{ fontSize: '13px', color: '#0EA5E9', fontWeight: 500 }}>{t('cards.instantApproval', language)}</p>
                        </div>
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>{t('cards.selectTier', language)}</label>
                            <select onChange={(e) => setCardLevel(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '15px', outline: 'none' }}>
                                <option value="Standard">{t('cards.tierStandard', language)}</option>
                                <option value="Gold">{t('cards.tierGold', language)}</option>
                                <option value="Platinum">{t('cards.tierPlatinum', language)}</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '40px' }}>
                            <input type="checkbox" id="terms" style={{ width: '20px', height: '20px', marginTop: '2px' }} />
                            <label htmlFor="terms" style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>{t('cards.termsAgree', language)}</label>
                        </div>
                        <button 
                            disabled={isSubmitting}
                            onClick={handleApply} 
                            style={{ width: '100%', padding: '18px', background: isSubmitting ? '#94A3B8' : '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}
                        >
                            {isSubmitting ? t('cards.processing', language) : t('cards.confirmPayFee', language)}
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="flex-row-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>{t('cards.listTitle', language)}</h1>
                    <button onClick={() => setView('apply')} style={{ padding: '14px 28px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}><Plus size={20} /> {t('cards.requestNewCard', language)}</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <StatBox label={t('cards.activeCards', language)} value={isCardActive ? "1" : "0"} color="#0EA5E9" icon={<CreditCard size={28} />} />
                    <StatBox label={t('cards.pendingReview', language)} value={hasPendingApplication && !isCardActive ? "1" : "0"} color="#F59E0B" icon={<Hourglass size={28} />} />
                    <StatBox label={t('cards.linkedBalance', language)} value="€ 0.00" color="#10B981" icon={<Wallet size={28} />} />
                </div>

                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: 'clamp(20px, 5vw, 40px)', minHeight: '400px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '32px' }}>{t('cards.accountInventory', language)}</h3>
                    {hasPendingApplication ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                            <div style={{ border: '1px solid #F1F5F9', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px', background: '#F8FAFC', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                                    <span style={{ background: isCardActive ? '#D1FAE5' : '#FEF3C7', color: isCardActive ? '#059669' : '#D97706', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>{isCardActive ? t('cards.statusActiveUpper', language) : t('cards.statusReviewUpper', language)}</span>
                                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>{String(cardTier).toUpperCase()}</span>
                                </div>
                                <div style={{ width: '100%', aspectRatio: '1.58/1', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: '12px', padding: '24px', color: 'white', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
                                    <p style={{ fontWeight: 700, fontSize: '13px' }}>FINVEX BANK</p>
                                    <p style={{ fontSize: '18px', fontWeight: 700, marginTop: 'auto', letterSpacing: '3px' }}>{maskedNumber}</p>
                                </div>
                                <button onClick={() => setView('details')} style={{ width: '100%', padding: '14px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#1E293B', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>{t('cards.manageCard', language)}</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ width: '64px', height: '64px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                                <CreditCard size={32} color="#94A3B8" />
                            </div>
                            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>{t('cards.noCards', language)}</h4>
                            <p style={{ fontSize: '14px', color: '#64748B' }}>{t('cards.addFirstCard', language)}</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @media (max-width: 640px) {
                    .flex-row-mobile { flex-direction: column; align-items: stretch !important; gap: 16px; }
                    .mobile-full { width: 100% !important; }
                }
            `}</style>
        </MainLayout>
    );
};

const StatBox = ({ label, value, color, icon }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '56px', height: '56px', background: `${color}15`, color, borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>{icon}</div>
        <div><p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>{label}</p><h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{value}</h3></div>
    </div>
);

const DetailInfo = ({ label, value, hasEye }) => (
    <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '10px' }}>{label}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', wordBreak: 'break-all' }}>{value}</span>
            {hasEye && <Eye size={16} color="#0EA5E9" style={{ cursor: 'pointer', flexShrink: 0 }} />}
        </div>
    </div>
);

const LimitRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px dashed #F1F5F9', paddingBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{value}</span>
    </div>
);

export default Cards;
