import React from 'react';
import { cn } from './GlassCard';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';
  className?: string;
}

export const Badge = ({ children, color = 'info', className, ...props }: BadgeProps) => {
  const colors: Record<string, string> = {
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    info: "bg-info/10 text-info border border-info/20",
    accent: "bg-accent/10 text-accent border border-accent/25",
    neutral: "bg-black/5 dark:bg-white/5 text-ink-700 border border-border"
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tabular-nums",
        colors[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
