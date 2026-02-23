
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer Gear Shape */}
      <path 
        d="M50 5L54 15H46L50 5ZM72.5 11.5L71.5 22.5L62.5 17.5L72.5 11.5ZM88.5 27.5L82.5 36.5L77.5 27.5L88.5 27.5ZM95 50L85 54V46L95 50ZM88.5 72.5L77.5 72.5L82.5 63.5L88.5 72.5ZM72.5 88.5L62.5 82.5L71.5 77.5L72.5 88.5ZM50 95L46 85H54L50 95ZM27.5 88.5L28.5 77.5L37.5 82.5L27.5 88.5ZM11.5 72.5L17.5 63.5L22.5 72.5L11.5 72.5ZM5 50L15 46V54L5 50ZM11.5 27.5L22.5 27.5L17.5 36.5L11.5 27.5ZM27.5 11.5L37.5 17.5L28.5 22.5L27.5 11.5Z" 
        fill="currentColor" 
      />
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="4" />
      
      {/* Refinery Elements Inside */}
      <g fill="currentColor">
        {/* Cooling Tower */}
        <path d="M35 65L38 45H46L49 65H35Z" opacity="0.9" />
        <path d="M38 42C38 42 40 38 44 40C48 42 50 38 50 38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        
        {/* Distillation Column */}
        <rect x="52" y="32" width="6" height="33" rx="1" />
        <rect x="51" y="38" width="8" height="2" />
        <rect x="51" y="45" width="8" height="2" />
        <rect x="51" y="52" width="8" height="2" />
        
        {/* Storage Tanks */}
        <rect x="62" y="55" width="8" height="10" rx="1" />
        <rect x="72" y="58" width="8" height="7" rx="1" />
      </g>

      {/* Ground Line */}
      <rect x="30" y="65" width="45" height="2" fill="currentColor" />

      {/* Trend Arrow (Zig-Zag) */}
      <path 
        d="M30 60L45 45L55 52L80 25M80 25H70M80 25V35" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};
