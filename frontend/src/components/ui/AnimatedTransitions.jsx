// components/AnimatedTransitions.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fade In Animation
export const FadeIn = ({ children, delay = 0, duration = 0.3, ...props }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration, delay }}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide Up Animation
export const SlideUp = ({ children, delay = 0, duration = 0.4, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration, delay, ease: "easeOut" }}
    {...props}
  >
    {children}
  </motion.div>
);

// Scale In Animation
export const ScaleIn = ({ children, delay = 0, duration = 0.3, ...props }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration, delay, ease: "easeOut" }}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger Children Animation
export const StaggerContainer = ({ children, staggerDelay = 0.1, ...props }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, ...props }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide In From Side
export const SlideInFromLeft = ({ children, delay = 0, duration = 0.4, ...props }) => (
  <motion.div
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration, delay, ease: "easeOut" }}
    {...props}
  >
    {children}
  </motion.div>
);

export const SlideInFromRight = ({ children, delay = 0, duration = 0.4, ...props }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 30 }}
    transition={{ duration, delay, ease: "easeOut" }}
    {...props}
  >
    {children}
  </motion.div>
);

// Bounce Animation
export const Bounce = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.3 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.3 }}
    transition={{
      duration: 0.6,
      delay,
      ease: [0, 0.71, 0.2, 1.01],
      scale: {
        type: "spring",
        damping: 5,
        stiffness: 100,
        restDelta: 0.001
      }
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Page Transition
export const PageTransition = ({ children, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    {...props}
  >
    {children}
  </motion.div>
);

// Modal Transition
export const ModalTransition = ({ children, isOpen, ...props }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// List Item Animation
export const ListItemTransition = ({ children, index = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ 
      duration: 0.3, 
      delay: index * 0.05,
      ease: "easeOut" 
    }}
    layout
    {...props}
  >
    {children}
  </motion.div>
);

// Hover Scale Animation
export const HoverScale = ({ children, scale = 1.02, ...props }) => (
  <motion.div
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Loading Spinner Animation
export const LoadingSpinner = ({ size = 24, color = "text-cyan-400" }) => (
  <motion.div
    className={`${color}`}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="31.416"
      >
        <animate
          attributeName="stroke-dasharray"
          dur="2s"
          values="0 31.416;15.708 15.708;0 31.416"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          dur="2s"
          values="0;-15.708;-31.416"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </motion.div>
);

// Pulse Animation
export const Pulse = ({ children, ...props }) => (
  <motion.div
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
    {...props}
  >
    {children}
  </motion.div>
);

// Shake Animation (for errors)
export const Shake = ({ children, trigger = false, ...props }) => (
  <motion.div
    animate={trigger ? { x: [-10, 10, -10, 10, 0] } : {}}
    transition={{ duration: 0.4 }}
    {...props}
  >
    {children}
  </motion.div>
);
