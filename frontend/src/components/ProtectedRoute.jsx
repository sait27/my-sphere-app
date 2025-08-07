// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if the access token exists in localStorage
  const isLoggedIn = !!localStorage.getItem('access_token');

  if (!isLoggedIn) {
    // If the user is not logged in, redirect them to the login page
    return <Navigate to="/login" replace />;
  }

  // If the user is logged in, show the page they were trying to access
  return children;
};

export default ProtectedRoute;