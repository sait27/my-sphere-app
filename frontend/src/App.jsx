// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage'; // <-- IMPORT NEW PAGE
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} /> {/* Redirect root to dashboard */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      {/* Secured Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} /> {/* <-- ADD NEW ROUTE */}

    </Routes>
  );
}

export default App;