// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // <-- IMPORT THE NEW LAYOUT
import SettingsPage from './pages/SettingsPage';
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      {/* Protected Routes Nested Inside the Layout */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout /> 
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* We can add more protected routes here later */}
      </Route>

    </Routes>
  );
}

export default App;