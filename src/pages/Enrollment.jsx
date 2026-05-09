import React, { useState, useRef } from 'react';
import { 
  User, Mail, Smartphone, MapPin, Briefcase, CreditCard, 
  ShieldCheck, UploadCloud, ChevronRight, CheckCircle,
  FileText, Globe, Camera, Info, Layout, Building2, XCircle, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAppContext } from '../AppContext';
import MainLayout from '../components/MainLayout';
import { sendAdminKYCAlert } from '../utils/emailService';

// SUB-COMPONENTS
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ color: '#0EA5E9', background: '#F0F9FF', padding: '10px', borderRadius: '12px' }}>
            <Icon size={20} />
        </div>
        <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>{title}</h4>
            {subtitle && <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{subtitle}</p>}
        </div>
    </div>
);

const InputField = ({ label, name, type = "text", placeholder, icon: Icon, options, value, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>{label} *</label>
        <div style={{ position: 'relative' }}>
            {Icon && <Icon size={18} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)' }} />}
            {options ? (
                <select 
                    name={name} 
                    value={value} 
                    onChange={onChange}
                    style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', background: 'white', fontSize: '15px', fontWeight: 600, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '16px' }}
                >
                    <option value="">Select {label}</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input 
                    type={type} 
                    name={name} 
                    value={value} 
                    onChange={onChange} 
                    placeholder={placeholder} 
                    style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', fontWeight: 600, color: '#1E293B' }} 
                />
            )}
        </div>
    </div>
);

const UploadBox = ({ label }) => {
    const fileRef = useRef();
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>{label} *</p>
            <input type="file" ref={fileRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <div 
                onClick={() => fileRef.current.click()}
                style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', padding: 'clamp(24px, 5vw, 40px)', textAlign: 'center', background: '#F8FAFC', cursor: 'pointer', transition: '0.2s', position: 'relative' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: fileName ? '#10B981' : '#0EA5E9' }}>
                        {fileName ? <CheckCircle size={36} /> : <UploadCloud size={36} />}
                    </div>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                            {fileName ? fileName : 'Select identification file'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>High-resolution photo required (max 5MB)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Enrollment = () => {
    const { user } = useAppContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [docType, setDocType] = useState('Passport');

    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        title: '',
        gender: '',
        zipcode: '',
        dob: '',
        ssn: '',
        accountType: user?.accountType || 'Checking',
        employmentType: '',
        annualIncome: '',
        address: '',
        city: '',
        state: '',
        nationality: user?.country || '',
        nextOfKinName: '',
        nextOfKinAddress: '',
        relationship: '',
        nextOfKinAge: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.id), {
                ...formData,
                kycStatus: 'Pending',
                accountStatus: 'Restricted'
            });
            
            await sendAdminKYCAlert({
                name: formData.fullName,
                uid: user.id
            });

            setShowSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            setTimeout(() => {
                navigate('/verify-account');
            }, 5000);
        } catch (error) {
            console.error("KYC Submission Error:", error);
            alert("Failed to submit application.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <MainLayout>
            <div className="dashboard-body" style={{ display: 'block', maxWidth: '1000px', margin: '0 auto', position: 'relative', padding: 'clamp(16px, 4vw, 32px)' }}>
                
                {/* Success Banner */}
                {showSuccess && (
                    <div style={{ 
                        marginBottom: '32px', width: '100%', background: 'white',
                        borderRadius: '20px', borderLeft: '6px solid #10B981', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        padding: '24px', display: 'flex', alignItems: 'center', gap: '20px',
                        animation: 'slideDown 0.4s ease-out', border: '1px solid #E2E8F0', borderLeft: '6px solid #10B981'
                    }} className="flex-row-mobile">
                        <div style={{ width: '56px', height: '56px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <CheckCircle size={32} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{fontSize:'16px', fontWeight:800, color:'#064E3B', marginBottom:'4px'}}>Verification Dispatched</h4>
                            <p style={{ color: '#065F46', fontSize: '14px', fontWeight: 500, lineHeight: 1.5 }}>
                                Identity dossier successfully submitted. Audit pending. Keep tabs on your mailbox for status updates.
                            </p>
                        </div>
                        <button onClick={() => setShowSuccess(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>Identity Dossier</h1>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                        <span>Verification</span>
                        <ChevronRight size={14} />
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>AML Submission</span>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC' }}>
                        <div style={{ color: '#0EA5E9' }}><ShieldCheck size={26} /></div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>Secure KYC Enrollment</h3>
                            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>All data is encrypted with 256-bit institutional standards.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: 'clamp(20px, 5vw, 40px)' }}>
                        {/* PERSONAL DETAILS */}
                        <div style={{ border: '1px solid #F1F5F9', borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '32px' }}>
                            <SectionHeader icon={User} title="Individual Profile" subtitle="Full legal identity as shown on identification" />
                            <div className="grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                <InputField label="Full Legal Name" name="fullName" value={formData.fullName} onChange={handleChange} icon={User} />
                                <InputField label="Secure Email" name="email" value={formData.email} onChange={handleChange} icon={Mail} />
                                <InputField label="Primary Phone" name="phone" value={formData.phone} onChange={handleChange} icon={Smartphone} />
                                <InputField label="Honorific" name="title" value={formData.title} onChange={handleChange} icon={Info} options={['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Professor']} />
                                <InputField label="Gender Identification" name="gender" value={formData.gender} onChange={handleChange} icon={User} options={['Male', 'Female', 'Non-Binary']} />
                                <InputField label="Postal Code" name="zipcode" value={formData.zipcode} onChange={handleChange} icon={MapPin} />
                                <InputField label="Birth Date" name="dob" value={formData.dob} onChange={handleChange} icon={Camera} type="date" />
                            </div>
                        </div>

                        {/* EMPLOYMENT */}
                        <div style={{ border: '1px solid #F1F5F9', borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '32px' }}>
                            <SectionHeader icon={Briefcase} title="Financial Profile" subtitle="Employment and liquidity range assessment" />
                            <div className="grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                <InputField label="National ID / SSN / Tax ID" name="ssn" value={formData.ssn} onChange={handleChange} icon={ShieldCheck} />
                                <InputField label="Target Account Scope" name="accountType" value={formData.accountType} onChange={handleChange} icon={Layout} options={['Tier 1 Checking', 'High-Yield Savings', 'Institutional Business']} />
                                <InputField label="Employment Status" name="employmentType" value={formData.employmentType} onChange={handleChange} icon={Building2} options={['Corporate Staff', 'Entrepreneur', 'Public Sector', 'Retired Executive']} />
                                <InputField label="Annual Gross Liquidity" name="annualIncome" value={formData.annualIncome} onChange={handleChange} icon={CreditCard} options={['€10k - €50k', '€50k - €150k', '€150k - €500k', '€500k+']} />
                            </div>
                        </div>

                        {/* ADDRESS */}
                        <div style={{ border: '1px solid #F1F5F9', borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '32px' }}>
                            <SectionHeader icon={MapPin} title="Residency Ledger" />
                            <div className="grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                <InputField label="Residential Address" name="address" value={formData.address} onChange={handleChange} icon={Layout} />
                                <InputField label="City Town" name="city" value={formData.city} onChange={handleChange} icon={Building2} />
                                <InputField label="Province State" name="state" value={formData.state} onChange={handleChange} icon={MapPin} />
                                <InputField label="Primary Nationality" name="nationality" value={formData.nationality} onChange={handleChange} icon={Globe} />
                            </div>
                        </div>

                        {/* DOCUMENTS */}
                        <div style={{ border: '1px solid #F1F5F9', borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '40px' }}>
                            <SectionHeader icon={FileText} title="Document Archive" subtitle="Selection of government-issued identification" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                                {[
                                    { id: 'Passport', label: "Passport", icon: Globe }, 
                                    { id: 'ID', label: 'National ID', icon: Layout }, 
                                    { id: 'License', label: 'License', icon: CreditCard }
                                ].map(doc => (
                                    <div key={doc.id} onClick={() => setDocType(doc.id)} style={{ padding: '20px', border: `2px solid ${docType === doc.id ? '#0EA5E9' : '#F1F5F9'}`, borderRadius: '16px', cursor: 'pointer', textAlign: 'center', background: docType === doc.id ? '#F0F9FF' : 'white', transition: '0.2s' }}>
                                        <div style={{ color: docType === doc.id ? '#0EA5E9' : '#94A3B8', marginBottom: '10px' }}><doc.icon size={24} style={{ margin: '0 auto' }} /></div>
                                        <p style={{ fontSize: '13px', fontWeight: 800, color: docType === doc.id ? '#0EA5E9' : '#64748B' }}>{doc.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <UploadBox label="Primary identification (Front)" />
                                <UploadBox label="Identification (Rear)" />
                                <UploadBox label="Biometric Portrait Photo" />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={{ 
                                width: '100%', 
                                padding: '20px', 
                                background: loading ? '#94A3B8' : '#0EA5E9', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '16px', 
                                fontWeight: 800, 
                                fontSize: '16px', 
                                cursor: loading ? 'not-allowed' : 'pointer', 
                                boxShadow: '0 10px 25px rgba(14, 165, 233, 0.3)' 
                            }}
                        >
                            {loading ? 'Transmitting Dossier...' : 'Finalize and Submit'}
                        </button>
                    </form>
                </div>
            </div>
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @media (max-width: 640px) {
                    .flex-row-mobile { flex-direction: column; text-align: center; }
                    .grid-2-mobile { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </MainLayout>
    );
};

export default Enrollment;
