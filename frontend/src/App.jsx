// src/App.jsx

import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  // We use a simple state to track if the user is logged in.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // This function will be passed to LoginPage to update the state on successful login
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  return (
    <div>
      {/* Conditionally render the correct page */}
      {isLoggedIn ? (
        <DashboardPage />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;