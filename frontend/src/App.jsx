// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import ExpensesPage from './pages/ExpensesPage';
import ListifyPage from './pages/ListifyPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import AdvancedTodosPage from './pages/AdvancedTodosPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SubscriptionAnalyticsPage from './pages/SubscriptionAnalyticsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout'; 
import { Toaster } from 'react-hot-toast'; 

function App() {
  return (
    <>  
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#334155', // slate-700
            color: '#fff',
          },
        }}
      />
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
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscriptions/analytics" element={<SubscriptionAnalyticsPage />} />
        <Route path="lists" element={<ListifyPage />} />
        <Route path="todos" element={<AdvancedTodosPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* We can add more protected routes here later */}
      </Route>
      
      {/* Catch all route for 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
    </>
  );
}

export default App;