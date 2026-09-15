import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  id,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold border-transparent shadow-sm shadow-cyan-950/40 active:translate-y-px',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 active:translate-y-px',
    outline:
      'bg-transparent hover:bg-slate-800/60 text-slate-200 border-slate-700 hover:border-slate-600 active:translate-y-px',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white border-transparent shadow-sm shadow-rose-950/40 active:translate-y-px',
    ghost:
      'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-slate-100 border-transparent',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5 rounded',
    md: 'text-sm px-3.5 py-2 h-9 gap-2 rounded-md',
    lg: 'text-base px-5 py-2.5 h-11 gap-2.5 rounded-md',
  };

  return (
    <button
      id={id}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center border font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
