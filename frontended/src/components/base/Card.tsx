
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function Card({ children, className = '', hover = false, glow = false }: CardProps) {
  const baseClasses = 'bg-white rounded-2xl shadow-lg border border-gray-100';
  const hoverClasses = hover ? 'hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer' : '';
  const glowClasses = glow ? 'shadow-amber-200/50 hover:shadow-amber-300/70' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}>
      {children}
    </div>
  );
}
