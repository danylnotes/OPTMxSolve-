
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  const isDay = document.documentElement.getAttribute('data-theme') === 'light';
  
  return (
    <div className={`p-6 flex flex-col transition-all duration-300 relative overflow-hidden group glass-panel rounded-2xl ${
        isDay 
        ? 'bg-white/70 border-white/50' 
        : 'bg-black/40 border-white/10'
    } ${className}`}>
      
      {(title || action) && (
        <div className={`flex justify-between items-center mb-6 pb-2 relative z-10 border-b ${isDay ? 'border-slate-200/50' : 'border-white/5'}`}>
          {title && (
            <h3 className={`text-sm font-bold uppercase tracking-widest ${isDay ? 'text-slate-700' : 'text-white/80'}`}>
              {title}
            </h3>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
};
