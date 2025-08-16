// components/LoadingState.jsx

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ 
  message = 'Loading...', 
  size = 'medium',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const variants = {
    default: 'text-cyan-400',
    white: 'text-white',
    slate: 'text-slate-400'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 
        className={`animate-spin ${sizeClasses[size]} ${variants[variant]}`}
      />
      {message && (
        <p className={`text-sm ${variants[variant]} animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
};

// Skeleton loader component for better UX
export const SkeletonLoader = ({ className = '', rows = 3 }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-slate-700/50 rounded-lg w-full"></div>
        </div>
      ))}
    </div>
  );
};

// Card skeleton for list items
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-slate-700/30 rounded-xl p-4 animate-pulse ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-slate-600/50 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-600/50 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-600/30 rounded w-1/2"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-slate-600/30 rounded-lg"></div>
        <div className="h-16 bg-slate-600/30 rounded-lg"></div>
      </div>
    </div>
  );
};

export default LoadingState;
