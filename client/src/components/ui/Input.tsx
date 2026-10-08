export const Input = ({ className, ...props }: any) => {
  return (
    <input 
      className={`w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm text-ink-900 placeholder:text-ink-300 ${className || ''}`} 
      {...props} 
    />
  );
};
