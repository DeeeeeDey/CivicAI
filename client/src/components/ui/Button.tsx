import { motion } from 'framer-motion';
import { cn } from './GlassCard';

export const Button = ({ children, variant = 'primary', className, ...props }: any) => {
  const base = "inline-flex items-center justify-center px-6 py-3 rounded-[14px] font-medium transition-colors text-[15px] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/35";
  
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
    secondary: "glass text-ink-900 dark:text-white hover:bg-white/40 dark:hover:bg-black/40",
    ghost: "bg-transparent text-ink-700 dark:text-ink-300 hover:bg-ink-900/5 dark:hover:bg-white/10",
    destructive: "bg-danger text-white hover:bg-red-700"
  };

  return (
    <motion.button 
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(base, variants[variant as keyof typeof variants], className)} 
      {...props}
    >
      {children}
    </motion.button>
  );
};
