import { GlassCard } from '../components/ui/GlassCard';

export const About = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto w-full">
      <h1 className="text-5xl font-bold tracking-tight text-ink-900 mb-8">Our <span className="font-serif italic text-accent font-normal">Story</span></h1>
      <GlassCard className="prose prose-lg dark:prose-invert max-w-none text-ink-700">
        <p className="lead text-xl mb-6">
          CivicAI was born from a simple realization: cities are drowning in data but starving for clarity.
        </p>
        <p className="mb-4">
          Every day, thousands of civic complaints are filed—potholes, broken streetlights, illegal dumping. Yet, the systems managing these reports were built decades ago. They rely on manual triaging, leading to massive backlogs, duplicate worker dispatches, and frustrated citizens.
        </p>
        <p>
          We built CivicAI to be the intelligent connective tissue between citizens and their government. By using lightweight, deterministic AI layers to instantly classify, score, and deduplicate reports, we help cities fix problems 40% faster.
        </p>
      </GlassCard>
    </div>
  );
};
