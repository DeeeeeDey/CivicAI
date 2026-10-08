import { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export const Track = () => {
  const [ticketId, setTicketId] = useState('');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative z-10">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full max-w-xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 mb-4">Track a <span className="font-serif italic text-accent font-normal">Complaint</span></h1>
        <p className="text-ink-500 mb-8">Enter your public complaint ID to see its real-time status.</p>
        
        <GlassCard className="p-8 shadow-2xl">
           <form className="flex flex-col sm:flex-row gap-4" onSubmit={e => e.preventDefault()}>
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={20} />
                 <Input 
                   placeholder="e.g. CIV-2041" 
                   value={ticketId}
                   onChange={(e:any) => setTicketId(e.target.value)}
                   className="pl-12 h-14 text-lg font-mono uppercase"
                 />
              </div>
              <Button className="h-14 px-8 text-lg">Track</Button>
           </form>
        </GlassCard>
        
        <p className="mt-8 text-sm text-ink-500">
           Don't have an ID? <a href="/login" className="text-accent hover:underline">Log in to view your history</a>.
        </p>
      </motion.div>
    </div>
  );
};
