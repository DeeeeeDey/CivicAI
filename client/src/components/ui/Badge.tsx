import { cn } from './GlassCard';

export const Badge = ({ children, color = 'info', className }: any) => {
  const colors: Record<string, string> = {
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    info: "bg-info/15 text-info",
    accent: "bg-accent/15 text-accent-hover dark:text-accent-soft",
  };
  
  return (
    <span className={cn(`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`, colors[color], className)}>
      {children}
    </span>
  );
};
