import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import CreateAd from './pages/CreateAd';
import NewTrade from './pages/NewTrade';
import TradeDetail from './pages/TradeDetail';
import MyTrades from './pages/MyTrades';
import WalletPage from './pages/WalletPage';
import PaymentMethods from './pages/PaymentMethods';
import Profile from './pages/Profile';
import Help from './pages/Help';
import AdminPanel from './pages/AdminPanel';
import TransactionHistory from './pages/TransactionHistory';
import SecuritySettings from './pages/SecuritySettings';
import WalletInfo from './pages/WalletInfo';
import Support from './pages/Support';
import ReferralPage from './pages/ReferralPage';
import DisputePage from './pages/DisputePage';
import TraderProfile from './pages/TraderProfile';
import TermsPage from './pages/TermsPage';
import TestingGuide from './pages/TestingGuide';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/create-ad" element={<CreateAd />} />
        <Route path="/trade/new" element={<NewTrade />} />
        <Route path="/trade/:tradeId" element={<TradeDetail />} />
        <Route path="/my-trades" element={<MyTrades />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help" element={<Help />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/security" element={<SecuritySettings />} />
        <Route path="/wallet-info" element={<WalletInfo />} />
        <Route path="/support" element={<Support />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/disputes" element={<DisputePage />} />
        <Route path="/trader/:email" element={<TraderProfile />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/testing" element={<TestingGuide />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App