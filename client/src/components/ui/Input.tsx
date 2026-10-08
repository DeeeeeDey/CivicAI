export const Input = (props: any) => {
  return (
    <input 
      className="w-full px-4 py-3 rounded-xl bg-white/40 dark:bg-black/40 border border-gray-300/30 dark:border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-sm backdrop-blur-md placeholder-gray-500" 
      {...props} 
    />
  );
};
