import React, { useState } from 'react';
import { 
  Banknote, Clock, Percent, FileCheck, ShieldCheck, 
  Home, Car, Building2, HelpCircle, ChevronRight,
  TrendingUp, CheckCircle2, Search, ArrowRight,
  MessageSquare, Wallet, X, AlertCircle, Users, CreditCard, Activity,
  Info, ArrowLeft, FileText, Calendar, Landmark
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '../AppContext';

const LoanRequest = () => {
    const { user } = useAppContext();
    const [isApplying, setIsApplying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    
    const [formData, setFormData] = useState({
        purpose: '',
        loanType: 'Select Loan/Credit Facility',
        amount: '',
        duration: '12 Months',
        monthlyIncome: '€2,000 - €5,000',
        termsAccepted: false
    });

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.purpose || !formData.amount || !formData.termsAccepted || formData.loanType.includes('Select')) {
            return alert("Validation Failed: Please complete all required fields indicated by the red asterisk.");
        }
        
        setLoading(true);
        try {
            await addDoc(collection(db, 'loans'), {
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                loanType: formData.loanType,
                amount: parseFloat(formData.amount),
                duration: formData.duration,
                purpose: formData.purpose,
                monthlyIncome: formData.monthlyIncome,
                status: 'Pending',
                createdAt: serverTimestamp()
            });
            setSubmitted(true);
            setTimeout(() => {
                setIsApplying(false);
                setSubmitted(false);
                setFormData({ purpose: '', loanType: 'Select Loan/Credit Facility', amount: '', duration: '12 Months', monthlyIncome: '€2,000 - €5,000', termsAccepted: false });
            }, 3000);
        } catch (error) {
            alert("Infrastructure Link Failure: Application could not be transmitted.");
        }
        setLoading(false);
    };

    if (isApplying) {
        return (
            <MainLayout>
                <div style={{ padding: '32px' }}>
                    {/* Header Section */}
                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Loan Services</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
                            <span>Dashboard</span>
                            <ChevronRight size={14} />
                            <span style={{ color: '#0EA5E9' }}>Loan Services</span>
                        </div>
                    </div>

                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        {/* Form Banner */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)', 
                            borderRadius: '32px', padding: '60px 40px', textAlign: 'center', 
                            color: 'white', marginBottom: '40px', position: 'relative', overflow: 'hidden'
                        }}>
                             {/* Wave Decoration Effect */}
                             <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'20px', background:'rgba(255,255,255,0.1)', borderRadius:'100% 100% 0 0', transform:'scaleX(2) translateY(10px)' }}></div>
                            
                            <div style={{ 
                                width: '64px', height: '64px', background: 'rgba(255,255,255,0.15)', 
                                borderRadius: '20px', display: 'flex', justifyContent: 'center', 
                                alignItems: 'center', margin: '0 auto 24px', backdropFilter: 'blur(10px)'
                            }}>
                                <FileText size={32} strokeWidth={2} />
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>Loan Application Form</h1>
                            <p style={{ fontSize: '16px', fontWeight: 500, opacity: 0.9 }}>Complete the form below to apply for a loan</p>
                        </div>

                        <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #F1F5F9', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <button onClick={() => setIsApplying(false)} style={{ background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginBottom: '32px' }}>
                                <ArrowLeft size={18} /> Back to Information
                            </button>

                            {submitted ? (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                                        <CheckCircle2 size={42} />
                                    </div>
                                    <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#065F46' }}>Order Transmitted!</h3>
                                    <p style={{ color: '#047857', marginTop: '12px', fontWeight: 600 }}>Your dossier is undergoing treasury validation.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ textAlign:'right', marginBottom:'24px' }}>
                                        <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700 }}>* Required fields</span>
                                    </div>

                                    {/* Section: Loan Details */}
                                    <FormSectionHeader icon={<FileText size={18}/>} title="Loan Details" />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                                        <FormGroup label="Loan Amount (EUR)">
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748B', fontSize: '16px' }}>€</span>
                                                <input type="number" placeholder="Enter loan amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ ...formInputStyle, paddingLeft: '36px' }} />
                                            </div>
                                        </FormGroup>
                                        <FormGroup label="Duration (Months)">
                                            <div style={{ position: 'relative' }}>
                                                <Calendar size={18} style={{ ...fieldIconStyle }} />
                                                <select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} style={{ ...formSelectStyle, paddingLeft: '44px' }}>
                                                    <option>12 Months</option>
                                                    <option>24 Months</option>
                                                    <option>36 Months</option>
                                                    <option>48 Months</option>
                                                    <option>60 Months</option>
                                                </select>
                                            </div>
                                        </FormGroup>
                                    </div>

                                    <div style={{ marginBottom: '32px' }}>
                                        <FormGroup label="Credit Facility">
                                            <div style={{ position: 'relative' }}>
                                                <Landmark size={18} style={{ ...fieldIconStyle }} />
                                                <select value={formData.loanType} onChange={e => setFormData({...formData, loanType: e.target.value})} style={{ ...formSelectStyle, paddingLeft: '44px' }}>
                                                    <option>Select Loan/Credit Facility</option>
                                                    <option>Personal Home Loans</option>
                                                    <option>Automobile Loans</option>
                                                    <option>Business Loans</option>
                                                    <option>Joint Mortgage</option>
                                                    <option>Secured Overdraft</option>
                                                    <option>Health Finance</option>
                                                </select>
                                            </div>
                                        </FormGroup>
                                    </div>

                                    <div style={{ marginBottom: '40px' }}>
                                        <FormGroup label="Purpose of Loan">
                                            <div style={{ position: 'relative' }}>
                                                <MessageSquare size={18} style={{ position: 'absolute', left: '16px', top: '16px', color:'#94A3B8' }} />
                                                <textarea placeholder="Please describe the purpose of this loan..." value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} style={{ ...formInputStyle, height: '140px', paddingLeft:'46px', paddingTop:'14px', resize:'none' }} />
                                            </div>
                                        </FormGroup>
                                    </div>

                                    {/* Section: Financial Information */}
                                    <FormSectionHeader icon={<Wallet size={18}/>} title="Financial Information" />
                                    <div style={{ marginBottom: '40px' }}>
                                        <FormGroup label="Monthly Net Income">
                                            <div style={{ position: 'relative' }}>
                                                <Banknote size={18} style={{ ...fieldIconStyle }} />
                                                <select value={formData.monthlyIncome} onChange={e => setFormData({...formData, monthlyIncome: e.target.value})} style={{ ...formSelectStyle, paddingLeft: '44px' }}>
                                                    <option>€500 - €1,000</option>
                                                    <option>€1,000 - €2,000</option>
                                                    <option>€2,000 - €5,000</option>
                                                    <option>€5,000 - €10,000</option>
                                                    <option>Above €10,000</option>
                                                </select>
                                            </div>
                                        </FormGroup>
                                    </div>

                                    {/* Terms Section */}
                                    <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9', marginBottom: '40px', display: 'flex', gap: '16px' }}>
                                        <input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop:'4px' }} />
                                        <div>
                                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>I agree to the terms and conditions</p>
                                            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, fontWeight: 500 }}>By submitting this application, I confirm that all information provided is accurate and complete. I authorize Finvex Bank to verify my information and credit history.</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button type="submit" disabled={loading} style={{ flex: 1.5, padding: '18px', background: '#075985', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize:'16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {loading ? 'Transmitting Data...' : 'Submit Loan Application'}
                                        </button>
                                        <button type="button" onClick={() => setIsApplying(false)} style={{ flex: 1, padding: '18px', background: 'white', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '14px', fontWeight: 800, fontSize:'16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                            <X size={20} /> Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ padding: '32px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Loan Services</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
                        <span>Dashboard</span>
                        <ChevronRight size={14} />
                        <span style={{ color: '#0EA5E9' }}>Loan Services</span>
                    </div>
                </div>
                
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)', 
                        borderRadius: '32px', padding: '80px 40px', textAlign: 'center', 
                        color: 'white', marginBottom: '64px', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(37, 99, 235, 0.15)'
                    }}>
                        <div style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'40px', background:'rgba(255,255,255,0.1)', borderRadius:'100% 100% 0 0', transform:'scaleX(2) translateY(20px)' }}></div>
                        <div style={{ 
                            width: '80px', height: '80px', background: 'rgba(255,255,255,0.15)', 
                            borderRadius: '24px', display: 'flex', justifyContent: 'center', 
                            alignItems: 'center', margin: '0 auto 32px', backdropFilter: 'blur(10px)'
                        }}>
                            <Banknote size={40} strokeWidth={1.5} />
                        </div>
                        <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px' }}>Loan Services</h1>
                        <p style={{ fontSize: '18px', fontWeight: 500, opacity: 0.9 }}>Financial solutions to help you achieve your goals</p>
                    </div>

                    <SectionHeader icon={<CheckCircle2 size={24} color="#0EA5E9" />} title="Why Choose Our Loan Services" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '80px' }}>
                        <FeatureCard icon={<Clock size={28} color="#0EA5E9" />} title="Quick Approval" desc="Get a decision within hours and funds within days" />
                        <FeatureCard icon={<Percent size={28} color="#0EA5E9" />} title="Competitive Rates" desc="Low interest rates tailored to your credit profile" />
                        <FeatureCard icon={<FileCheck size={28} color="#0EA5E9" />} title="Simple Process" desc="Straightforward application with minimal paperwork" />
                        <FeatureCard icon={<ShieldCheck size={28} color="#0EA5E9" />} title="Secure & Confidential" desc="Your information is protected with bank-level security" />
                    </div>

                    <SectionHeader icon={<TrendingUp size={24} color="#0EA5E9" />} title="Available Loan Types" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                        <LoanTypeCard icon={<Home size={32} />} title="Personal Home Loans" desc="Finance your dream home with competitive rates" />
                        <LoanTypeCard icon={<Car size={32} />} title="Automobile Loans" desc="Get on the road with flexible auto financing" />
                        <LoanTypeCard icon={<Building2 size={32} />} title="Business Loans" desc="Grow your business with tailored financing solutions" />
                        <LoanTypeCard icon={<Users size={32} />} title="Joint Mortgage" desc="Share responsibility with a co-borrower" />
                        <LoanTypeCard icon={<CreditCard size={32} />} title="Secured Overdraft" desc="Access funds when needed with asset backing" />
                        <LoanTypeCard icon={<Activity size={32} />} title="Health Finance" desc="Cover medical expenses with flexible payment options" />
                    </div>
                    <div style={{ textAlign:'center', marginBottom:'80px' }}><button style={{ background:'none', border:'none', color:'#0EA5E9', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', margin:'0 auto' }}>View all loan options <ChevronRight size={16} /></button></div>

                    <SectionHeader icon={<Info size={24} color="#0EA5E9" />} title="How It Works" />
                    <div style={{ position: 'relative', paddingLeft: '48px', marginBottom:'80px' }}>
                        <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '10px', width: '2px', background: '#F1F5F9' }}></div>
                        <StepItem num="1" title="Apply Online" desc="Complete our simple online application form with your details and loan requirements" />
                        <StepItem num="2" title="Quick Review" desc="Our team reviews your application and may contact you for additional information" />
                        <StepItem num="3" title="Approval & Disbursement" desc="Once approved, the loan amount will be transferred to your account" />
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: '32px', padding: '48px', marginBottom: '80px', border:'1px solid #F1F5F9' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'32px' }}><HelpCircle size={24} color="#0EA5E9" /><h2 style={{ fontSize: '20px', fontWeight: 800 }}>Frequently Asked Questions</h2></div>
                        <div style={{ display: 'grid', gap: '16px' }}><FAQItem question="What documents do I need to apply?" answer="You'll need identification, proof of income, and address verification." /><FAQItem question="How long does approval take?" answer="Standard applications are typically processed within 1-3 business days." /></div>
                    </div>

                    <div style={{ background: 'linear-gradient(to right, #E0F2FE, #F0F9FF)', borderRadius: '32px', padding: '64px 40px', textAlign: 'center', border: '1px solid #BAE6FD' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0C4A6E', marginBottom: '16px' }}>Ready to get started?</h2>
                        <p style={{ fontSize: '16px', color: '#0369A1', marginBottom: '32px', fontWeight: 500 }}>Apply now and get a decision on your loan application quickly</p>
                        <button onClick={() => setIsApplying(true)} style={{ background: '#0EA5E9', color: 'white', border: 'none', padding: '16px 48px', borderRadius: '16px', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>Apply for a Loan</button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

// --- Reusable Components ---

const FormSectionHeader = ({ icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: '#0EA5E9', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{title}</h3>
    </div>
);

const FormGroup = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ fontSize: '14px', fontWeight: 800, color: '#475569' }}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
        {children}
    </div>
);

const SectionHeader = ({ icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}><div style={{ width: '40px', height: '40px', background: '#F0F9FF', color: '#0EA5E9', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{icon}</div><h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1E293B' }}>{title}</h2></div>
);

const FeatureCard = ({ icon, title, desc }) => (
    <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '24px' }}><div style={{ marginBottom: '20px' }}>{icon}</div><h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>{title}</h4><p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, fontWeight: 500 }}>{desc}</p></div>
);

const LoanTypeCard = ({ icon, title, desc }) => (
    <div style={{ background: 'white', border: '1px solid #F1F5F9', padding: '32px', borderRadius: '24px' }}><div style={{ color: '#0EA5E9', marginBottom: '24px' }}>{icon}</div><h4 style={{ fontSize: '17px', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>{title}</h4><p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, fontWeight: 500 }}>{desc}</p></div>
);

const StepItem = ({ num, title, desc }) => (
    <div style={{ position: 'relative', marginBottom: '40px' }}><div style={{ position: 'absolute', left: '-48px', top: '0', width: '34px', height: '34px', background: '#0EA5E9', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize:'15px', fontWeight: 900, border: '6px solid white', zIndex: 2 }}>{num}</div><div style={{ paddingLeft: '12px' }}><h4 style={{ fontSize: '17px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{title}</h4><p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>{desc}</p></div></div>
);

const FAQItem = ({ question, answer }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9' }}><h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>{question}</h4><p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, fontWeight: 500 }}>{answer}</p></div>
);

const formInputStyle = { width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #E2E8F0', fontSize: '15px', fontWeight: 600, outline: 'none', background: '#F8FAFC', color: '#1E293B' };
const formSelectStyle = { ...formInputStyle, cursor:'pointer', appearance:'none', backgroundImage:'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat:'no-repeat', backgroundPosition:'right 16px center', backgroundSize:'18px' };
const fieldIconStyle = { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 1 };

export default LoanRequest;
