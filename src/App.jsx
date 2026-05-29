import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Cards from './pages/Cards';
import Deposit from './pages/Deposit';
import Transactions from './pages/Transactions';
import Support from './pages/Support';
import Loans from './pages/Loans';
import IRS from './pages/IRS';
import Settings from './pages/Settings';
import Enrollment from './pages/Enrollment';
import VerificationPortal from './pages/VerificationPortal';
import PinVerification from './pages/PinVerification';
import LoanRequest from './pages/LoanRequest';
import InternationalTransfer from './pages/InternationalTransfer';
import AdminLogin from './pages/AdminLogin';
import { AppProvider } from './AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/support" element={<Support />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/irs" element={<IRS />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/verify-account" element={<VerificationPortal />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/verify-pin" element={<PinVerification />} />
            <Route path="/loan-request" element={<LoanRequest />} />
            <Route path="/international-transfer" element={<InternationalTransfer />} />
          </Routes>
        </Router>
      </AppProvider>
    </LanguageProvider>
  );
}


export default App;
