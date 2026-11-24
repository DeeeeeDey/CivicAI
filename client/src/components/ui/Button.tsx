import React from 'react';
import { cn } from './GlassCard';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: React.ReactNode;
}

export const Button = ({
  children,
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) => {
  const base = "inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
    secondary: "bg-surface border border-border text-ink-900 hover:bg-black/5 dark:hover:bg-white/5",
    ghost: "bg-transparent text-ink-700 hover:bg-black/5 dark:hover:bg-white/5",
    danger: "bg-danger text-white hover:bg-red-700 shadow-sm"
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
