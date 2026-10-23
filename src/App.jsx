import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';               // <-- Added
import SelectExpenseTypePage from './pages/SelectExpenseTypePage'; // <-- Added
import ExpenseFormPage from './pages/ExpenseFormPage';
import { ToastProvider } from './context/ToastContext';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  // Check if the user is an approver (Head or HR)
  const isApprover = user?.role === 'head' || user?.role === 'hr';

  return (
    <Routes>
      {/* Send approvers to /dashboard, employees to /my */}
      <Route path="/login" element={user ? <Navigate to={isApprover ? '/dashboard' : '/my'} /> : <LoginPage />} />
      
      {/* Approver Dashboard */}
      <Route path="/dashboard" element={user && isApprover ? <DashboardPage /> : <Navigate to="/login" />} />
      
      {/* Employee Dashboard (uses the same component for now) */}
      <Route path="/my" element={user && !isApprover ? <DashboardPage /> : <Navigate to="/login" />} />
      
      {/* Shared Routes */}
      <Route path="/expenses" element={user ? <ExpensesPage /> : <Navigate to="/login" />} />
      <Route path="/new" element={user ? <SelectExpenseTypePage /> : <Navigate to="/login" />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
      <Route path="/form" element={user ? <ExpenseFormPage /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;