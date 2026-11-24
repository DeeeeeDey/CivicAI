import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GlassCard = ({ children, className, interactive = false, ...props }: any) => {
  const Component = interactive ? motion.div : 'div';
  const interactiveProps = interactive ? {
    whileHover: { y: -2, transition: { type: 'spring', stiffness: 300 } }
  } : {};

  return (
    <Component 
      className={cn("glass rounded-[24px] p-6 sm:p-8", className)}
      {...interactiveProps}
      {...props}
    >
      {children}
    </Component>
  );
};
