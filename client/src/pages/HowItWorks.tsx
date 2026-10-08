import { GlassCard } from '../components/ui/GlassCard';

export const HowItWorks = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto w-full">
      <h1 className="text-5xl font-bold tracking-tight text-ink-900 mb-12 text-center">How CivicAI <span className="font-serif italic text-accent font-normal">Works</span></h1>
      <div className="grid md:grid-cols-2 gap-8">
         {['1. Report', '2. AI Analysis', '3. Officer Review', '4. Worker Fix'].map(step => (
            <GlassCard key={step} className="h-48 flex items-center justify-center">
               <h2 className="text-2xl font-bold text-ink-700">{step}</h2>
            </GlassCard>
         ))}
      </div>
    </div>
  );
};
