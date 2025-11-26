import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  loading = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'whitespace-nowrap cursor-pointer font-medium rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:from-amber-500 hover:to-orange-600',
    secondary: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg hover:shadow-xl hover:from-purple-500 hover:to-pink-600',
    outline: 'border-2 border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500',
    ghost: 'text-amber-600 hover:bg-amber-50'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          처리중...
        </div>
      ) : children}
    </button>
  );
}
