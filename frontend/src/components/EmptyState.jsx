// src/components/EmptyState.jsx

import React from 'react';

function EmptyState({ icon, title, message }) {
  // The Icon component is passed in as a prop
  const IconComponent = icon; 

  return (
    <div className="text-center py-16 px-6">
      <div className="flex justify-center items-center mb-4">
        <IconComponent className="text-slate-500" size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{message}</p>
    </div>
  );
}

export default EmptyState;