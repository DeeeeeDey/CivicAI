import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';

export const OfficerDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-4 gap-6">
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">Pending Review</h3><p className="text-3xl font-bold text-apple-blue">42</p></GlassCard>
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">AI Flagged Duplicates</h3><p className="text-3xl font-bold text-apple-orange">18</p></GlassCard>
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">Active Field Tasks</h3><p className="text-3xl font-bold">156</p></GlassCard>
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">SLA Breaches</h3><p className="text-3xl font-bold text-apple-red">3</p></GlassCard>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4">Urgent Queue</h2>
            {[1,2,3].map(i => (
              <GlassCard key={i} className="p-5 flex justify-between items-start">
                 <div>
                    <div className="flex gap-2 mb-2">
                      <Badge color="red">Critical Severity</Badge>
                      <Badge color="blue">Water Leakage</Badge>
                    </div>
                    <h4 className="font-bold text-lg">Main Pipe Burst at Salt Lake</h4>
                    <p className="text-sm text-gray-500 mt-1">AI Confidence: 94% • Est. Duplicate: No</p>
                 </div>
                 <button className="bg-apple-blue text-white px-4 py-2 rounded-lg text-sm font-semibold">Review</button>
              </GlassCard>
            ))}
         </div>
         <div>
            <h2 className="text-xl font-bold mb-4">Live Map</h2>
            <GlassCard className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden relative p-0">
               <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_routing_machine.png')] bg-cover bg-center opacity-50 mix-blend-luminosity"></div>
               <div className="relative z-10 text-center bg-black/50 backdrop-blur-md p-4 rounded-xl text-white">Interactive Map Rendering...</div>
            </GlassCard>
         </div>
      </div>
    </div>
  );
};
