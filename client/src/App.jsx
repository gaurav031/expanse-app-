import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailsPage from './pages/GroupDetailsPage';
import CategoryDetailsPage from './pages/CategoryDetailsPage';
import ProfilePage from './pages/ProfilePage';
import GroupHistoryPage from './pages/GroupHistoryPage';
import BottomNav from './components/BottomNav';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/';

  return (
    <div className="font-sans text-gray-900 antialiased min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupDetailsPage />} />
        <Route path="/groups/:id/history" element={<GroupHistoryPage />} />
        <Route path="/category/:id" element={<CategoryDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
