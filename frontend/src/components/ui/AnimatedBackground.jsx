// src/components/AnimatedBackground.jsx

import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full -z-10">
      <div className="shooting-stars">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>
    </div>
  );
};

export default AnimatedBackground;