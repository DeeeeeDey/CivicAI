import os

content = """import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion } from 'framer-motion';
import { scrollReveal, staggerContainer } from '../lib/motion';
import { AlertTriangle, MapPin, Search, Server, ShieldCheck, Zap, GitCommit, GitPullRequest, Settings, Eye, Globe2, Activity, Cpu } from 'lucide-react';

export const About = () => {
  return (
    <div className="pt-32 pb-24 space-y-32">
      {/* a. The Reality */}
      <section className="max-w-6xl mx-auto px-6">
        <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 mb-4">Urban issues. <span className="font-serif italic text-accent font-normal">Inefficient response.</span></h2>
          <p className="text-xl text-ink-500 mb-12 max-w-3xl">Cities generate thousands of maintenance requests daily. Manual triage creates bottlenecks, duplicates, and misrouting.</p>
          
          <div className="grid md:grid-cols-4 gap-4 mb-12">
             {['Potholes & Roads', 'Garbage & Waste', 'Water Leakage', 'Damaged Infrastructure'].map(i => (
                <GlassCard key={i} variants={scrollReveal} className="p-6 border-l-4 border-l-accent flex items-center justify-center text-center font-bold text-ink-900 shadow-sm">{i}</GlassCard>
             ))}
          </div>

          <GlassCard className="bg-bg-sand/30 p-8">
             <h3 className="font-bold text-ink-900 mb-6 text-xl">The Pain Points</h3>
             <div className="flex flex-wrap gap-3">
                {['Manual classification', 'Duplicate complaints', 'Poor prioritization', 'Wrong departmental routing', 'Limited transparency'].map(p => (
                   <Badge key={p} color="warning" className="text-sm px-4 py-2 border-warning/20 bg-white/50">{p}</Badge>
                ))}
             </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* b & c. Meet CivicAI & Lifecycle */}
      <section className="bg-bg-sand py-24 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Meet CivicAI</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 mb-4">An intelligent <span className="font-serif italic text-accent font-normal">connective tissue</span></h2>
            <p className="text-xl text-ink-500 max-w-2xl mx-auto">CivicAI transforms unstructured citizen complaints into structured, prioritized and actionable municipal workflows.</p>
          </div>

          <div className="grid md:grid-cols-6 gap-4">
             {[
               {name:'Report', desc:'Citizen uploads photo & text'},
               {name:'Analyze', desc:'AI extracts category & visual severity'},
               {name:'Prioritize', desc:'Scored based on location risk'},
               {name:'Detect Duplicates', desc:'Vector similarity flags overlaps'},
               {name:'Assign', desc:'Auto-routed to correct department'},
               {name:'Verify', desc:'Before/after image validation'}
             ].map((step, idx) => (
                <GlassCard key={idx} className="p-6 text-center flex flex-col items-center gap-4 bg-surface">
                   <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">{idx+1}</div>
                   <div>
                     <h4 className="font-bold text-ink-900 text-sm mb-1">{step.name}</h4>
                     <p className="text-xs text-ink-500">{step.desc}</p>
                   </div>
                </GlassCard>
             ))}
          </div>
        </div>
      </section>

      {/* d. AI at the Core (Demo) */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
           <div>
              <Badge color="accent" className="mb-4">AI at the Core</Badge>
              <h2 className="text-4xl font-bold tracking-tight text-ink-900 mb-6">Deterministic Intelligence</h2>
              <p className="text-lg text-ink-700 mb-6">We use lightweight multimodal models (CLIP) to deeply understand issues without human intervention.</p>
              <ul className="space-y-4">
                 <li className="flex gap-3"><Zap className="text-accent" /> <span><strong>Multimodal Classification:</strong> Zero-shot text/image fusion.</span></li>
                 <li className="flex gap-3"><Activity className="text-accent" /> <span><strong>Visual Severity:</strong> "Small crack" vs "Massive crater".</span></li>
                 <li className="flex gap-3"><Copy className="text-accent" /> <span><strong>Vector Deduplication:</strong> Image embeddings catch similar reports.</span></li>
              </ul>
           </div>
           <GlassCard className="p-8 shadow-2xl border-border bg-ink-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4"><Badge color="success">Live Demo Available</Badge></div>
              <h3 className="text-2xl font-bold mb-4 text-white">Experience the AI</h3>
              <p className="text-white/70 mb-8">Head to the Report Issue wizard to see the multimodal pipeline in action on your own photos.</p>
              <Button onClick={() => window.location.href='/citizen/report'} className="w-full bg-white text-ink-900 hover:bg-white/90">Try the Report Wizard</Button>
           </GlassCard>
        </div>
      </section>

      {/* e. Location as Intelligence */}
      <section className="max-w-6xl mx-auto px-6">
         <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-ink-900 mb-4">Location as <span className="font-serif italic text-accent font-normal">Intelligence</span></h2>
            <p className="text-xl text-ink-500">Spatial clustering, automated hotspot detection, and smart routing.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="md:col-span-2 h-[400px] p-0 overflow-hidden relative">
               <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_routing_machine.png')] bg-cover bg-center opacity-60"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-surface p-4 rounded-xl shadow-2xl border border-border">
                     <p className="text-sm font-bold text-ink-900 mb-1">Sector X: 47 road complaints</p>
                     <p className="text-xs text-danger">+32% vs last month. Hotspot detected.</p>
                  </div>
               </div>
            </GlassCard>
            <div className="space-y-4">
               {['Pothole → Public Works', 'Water Leakage → Water Supply', 'Fallen Tree → Parks', 'Garbage → Waste Mgmt'].map((r, i) => (
                  <GlassCard key={i} className="flex justify-between items-center p-4">
                     <span className="font-mono text-sm font-bold text-ink-700">{r.split(' → ')[0]}</span>
                     <ArrowRight size={14} className="text-ink-300" />
                     <Badge color="info">{r.split(' → ')[1]}</Badge>
                  </GlassCard>
               ))}
               <p className="text-center text-sm font-bold text-ink-500 mt-8">AI acts as decision support; Officers retain override control.</p>
            </div>
         </div>
      </section>

      {/* f. Architecture & h. Roadmap */}
      <section className="bg-bg-sand py-24 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16">
           <div>
              <h2 className="text-3xl font-bold text-ink-900 mb-6">Scalable Architecture</h2>
              <div className="space-y-4">
                 <GlassCard className="flex gap-4 items-center p-4 bg-surface"><Server className="text-ink-300" /> <div><h4 className="font-bold text-ink-900">Node/Express Backend</h4><p className="text-sm text-ink-500">Fast, scalable data layer via Prisma.</p></div></GlassCard>
                 <GlassCard className="flex gap-4 items-center p-4 bg-surface"><Cpu className="text-accent" /> <div><h4 className="font-bold text-ink-900">FastAPI AI Microservice</h4><p className="text-sm text-ink-500">Independent Python tier for CLIP multimodal inference.</p></div></GlassCard>
                 <GlassCard className="flex gap-4 items-center p-4 bg-surface"><Globe2 className="text-info" /> <div><h4 className="font-bold text-ink-900">React Client</h4><p className="text-sm text-ink-500">Vite-powered SPA with unified design system.</p></div></GlassCard>
              </div>
           </div>
           <div>
              <h2 className="text-3xl font-bold text-ink-900 mb-6">Roadmap</h2>
              <ul className="space-y-6">
                 <li><Badge className="mb-2">In Beta</Badge><p className="font-bold text-ink-900">Computer-Vision Verification</p><p className="text-sm text-ink-500">Before/after image matching to prevent fraudulent resolution claims.</p></li>
                 <li><Badge color="warning" className="mb-2">Roadmap</Badge><p className="font-bold text-ink-900">Predictive Maintenance</p><p className="text-sm text-ink-500">Forecasting asset degradation based on historical clusters.</p></li>
                 <li><Badge color="warning" className="mb-2">Roadmap</Badge><p className="font-bold text-ink-900">Multimodal WhatsApp Chatbot</p><p className="text-sm text-ink-500">Citizens report directly via chat.</p></li>
              </ul>
           </div>
        </div>
      </section>

      {/* i. Comparison Table */}
      <section className="max-w-6xl mx-auto px-6">
         <h2 className="text-4xl font-bold text-center text-ink-900 mb-12">Existing Solutions vs <span className="font-serif italic text-accent font-normal">CivicAI</span></h2>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b-2 border-ink-900/10">
                     <th className="p-4 font-bold text-ink-900">Platform Type</th>
                     <th className="p-4 font-bold text-ink-500">What exists today</th>
                     <th className="p-4 font-bold text-accent bg-accent/5 rounded-t-xl">CivicAI Advantage</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-ink-900/5">
                  <tr>
                     <td className="p-4 font-semibold text-ink-900">Government Portals (311/CPGRAMS)</td>
                     <td className="p-4 text-ink-500">Manual triaging, text-heavy forms, black-box tracking.</td>
                     <td className="p-4 bg-accent/5 font-medium text-ink-900">Automated classification, visual severity, real-time transparency.</td>
                  </tr>
                  <tr>
                     <td className="p-4 font-semibold text-ink-900">Civic CRM (SeeClickFix)</td>
                     <td className="p-4 text-ink-500">Basic maps, high duplicate noise, manual routing.</td>
                     <td className="p-4 bg-accent/5 font-medium text-ink-900">Vector image deduplication, intelligent auto-routing.</td>
                  </tr>
                  <tr>
                     <td className="p-4 font-semibold text-ink-900">Standalone AI Vision</td>
                     <td className="p-4 text-ink-500">Detects potholes from cars, but lacks citizen loop.</td>
                     <td className="p-4 bg-accent/5 font-medium text-ink-900 rounded-b-xl">End-to-end integration: Detection to Workflow to Citizen Feedback.</td>
                  </tr>
               </tbody>
            </table>
         </div>
         <p className="text-center mt-8 text-lg font-bold text-ink-700">An integrated AI intelligence + resolution layer, not simply another complaint portal.</p>
      </section>
    </div>
  );
};
"""

with open("client/src/pages/About.tsx", "w", encoding="utf-8") as f:
    f.write(content.replace("Copy", "Copy as ClipboardCopy").replace("import { AlertTriangle, MapPin, Search, Server, ShieldCheck, Zap, GitCommit, GitPullRequest, Settings, Eye, Globe2, Activity, Cpu } from 'lucide-react';", "import { AlertTriangle, MapPin, Search, Server, ShieldCheck, Zap, GitCommit, GitPullRequest, Settings, Eye, Globe2, Activity, Cpu, ArrowRight, Copy } from 'lucide-react';"))
print("About.tsx built.")
