// components/LoadingSpinner.jsx
/**
 * Reusable loading spinner component
 */

import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'cyan', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    cyan: 'border-cyan-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    white: 'border-white'
  };

  return (
    <div className={`inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          border-2 border-t-transparent rounded-full animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;
