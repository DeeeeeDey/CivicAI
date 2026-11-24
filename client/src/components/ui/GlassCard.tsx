import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
}

export const GlassCard = ({ children, className, interactive = false, ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-sm",
        interactive && "hover:border-accent/40 transition-colors duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
