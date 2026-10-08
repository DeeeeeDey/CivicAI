import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';
import { scrollReveal, staggerContainer } from '../lib/motion';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '../store/locationStore';
import { useTheme } from '../theme/ThemeProvider';

export const Transparency = () => {
  const { lat, lng } = useLocationStore();
  const { theme } = useTheme();

  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto w-full relative z-10">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="text-center mb-16">
         <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">Live City Data</Badge>
         <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-ink-900 mb-4">Transparency <span className="font-serif italic text-accent font-normal">Dashboard</span></h1>
         <p className="text-ink-500 text-lg max-w-2xl mx-auto">We believe civic action should happen in the open. Track city-wide performance, resolution times, and department efficiency in real time.</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
         <div className="grid md:grid-cols-3 gap-6">
            <GlassCard variants={scrollReveal} className="text-center shadow-xl">
               <h3 className="text-ink-300 text-xs font-bold uppercase tracking-widest mb-2">Total Issues Fixed</h3>
               <p className="text-5xl font-serif text-accent">14,203</p>
            </GlassCard>
            <GlassCard variants={scrollReveal} className="text-center shadow-xl">
               <h3 className="text-ink-300 text-xs font-bold uppercase tracking-widest mb-2">City-wide Resolution Rate</h3>
               <p className="text-5xl font-serif text-ink-900">92.4%</p>
            </GlassCard>
            <GlassCard variants={scrollReveal} className="text-center shadow-xl">
               <h3 className="text-ink-300 text-xs font-bold uppercase tracking-widest mb-2">Avg. Resolution Time</h3>
               <p className="text-5xl font-serif text-ink-900">46h</p>
            </GlassCard>
         </div>

         <div className="grid md:grid-cols-2 gap-8 mt-12">
            <GlassCard variants={scrollReveal} className="h-[400px] shadow-xl">
               <h2 className="text-xl font-bold text-ink-900 mb-6">Issues by Department</h2>
               <div className="space-y-4">
                  {[
                    { name: 'Roads & Infrastructure', val: 85, count: '4.2k' },
                    { name: 'Water & Sanitation', val: 65, count: '3.1k' },
                    { name: 'Electricity', val: 45, count: '2.0k' },
                    { name: 'Waste Management', val: 30, count: '1.2k' }
                  ].map(dept => (
                    <div key={dept.name}>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-ink-700">{dept.name}</span>
                          <span className="text-ink-500">{dept.count}</span>
                       </div>
                       <div className="w-full h-3 bg-ink-900/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            whileInView={{ width: `${dept.val}%` }} 
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-accent rounded-full"
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </GlassCard>

            <GlassCard variants={scrollReveal} className="h-[400px] p-0 overflow-hidden relative shadow-xl">
               <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between pointer-events-none">
                  <h2 className="text-xl font-bold text-ink-900 bg-surface/80 backdrop-blur-md self-start px-3 py-1 rounded-xl shadow-sm border border-border">Live Heatmap</h2>
               </div>
               <div className="absolute inset-0">
                  <MapContainer center={[lat, lng]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} className={theme === 'dark' ? 'map-tiles-dark' : ''}>
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <CircleMarker center={[lat + 0.02, lng - 0.02]} radius={40} pathOptions={{ color: 'transparent', fillColor: '#C2683A', fillOpacity: 0.5 }} />
                     <CircleMarker center={[lat - 0.05, lng + 0.04]} radius={55} pathOptions={{ color: 'transparent', fillColor: '#C2683A', fillOpacity: 0.3 }} />
                     <CircleMarker center={[lat, lng + 0.01]} radius={25} pathOptions={{ color: 'transparent', fillColor: '#C05A44', fillOpacity: 0.7 }} />
                     <CircleMarker center={[lat - 0.01, lng - 0.05]} radius={35} pathOptions={{ color: 'transparent', fillColor: '#E0B84F', fillOpacity: 0.6 }} />
                  </MapContainer>
               </div>
            </GlassCard>
         </div>
      </motion.div>
    </div>
  );
};
