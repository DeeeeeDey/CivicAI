import os

files = {
    "src/pages/citizen/ReportIssue.tsx": """import { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, AlignLeft, Bot, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  { id: 1, name: 'Photo', icon: Camera },
  { id: 2, name: 'Location', icon: MapPin },
  { id: 3, name: 'Details', icon: AlignLeft },
  { id: 4, name: 'AI Review', icon: Bot },
  { id: 5, name: 'Submit', icon: CheckCircle2 }
];

export const ReportIssue = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [desc, setDesc] = useState('');
  
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
         <h1 className="text-3xl font-bold text-ink-900 mb-2">Report an Issue</h1>
         <p className="text-ink-500">Help us improve the city. It only takes 30 seconds.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
         <div className="absolute top-1/2 left-0 right-0 h-1 bg-ink-900/10 -translate-y-1/2 z-0 rounded-full"></div>
         <motion.div 
           className="absolute top-1/2 left-0 h-1 bg-accent -translate-y-1/2 z-0 rounded-full"
           initial={{ width: '0%' }}
           animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
           transition={{ duration: 0.5, ease: "easeOut" }}
         ></motion.div>

         {steps.map((step) => {
           const active = currentStep >= step.id;
           const current = currentStep === step.id;
           const Icon = step.icon;
           return (
             <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div 
                  initial={false}
                  animate={{ 
                    backgroundColor: active ? 'var(--color-accent)' : 'var(--color-surface)',
                    borderColor: active ? 'var(--color-accent)' : 'var(--color-ink-300)',
                    color: active ? '#FFF' : 'var(--color-ink-300)',
                    scale: current ? 1.1 : 1
                  }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold`}
                >
                   {currentStep > step.id ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </motion.div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${active ? 'text-ink-900' : 'text-ink-300'} hidden md:block absolute -bottom-6 whitespace-nowrap`}>
                   {step.name}
                </span>
             </div>
           );
         })}
      </div>

      <GlassCard className="min-h-[400px] flex flex-col mt-12 shadow-[0_20px_60px_rgba(110,85,50,0.08)] bg-white/80">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: PHOTO */}
          {currentStep === 1 && (
            <motion.div key="1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900">Take a photo</h2>
              <div className="flex-1 border-2 border-dashed border-ink-300 rounded-2xl flex items-center justify-center bg-bg-sand/30 hover:bg-bg-sand/50 transition-colors cursor-pointer group">
                 <div className="text-center text-ink-500 group-hover:text-accent transition-colors">
                    <Camera size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-semibold text-lg">Click to upload or take photo</p>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LOCATION */}
          {currentStep === 2 && (
            <motion.div key="2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900">Confirm Location</h2>
              <Input placeholder="Search address..." className="mb-4 bg-white" />
              <div className="flex-1 bg-bg-sand rounded-2xl overflow-hidden relative border border-ink-900/10 min-h-[250px]">
                 <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_routing_machine.png')] bg-cover bg-center opacity-60 mix-blend-luminosity"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <MapPin size={40} className="text-accent drop-shadow-lg" />
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: DETAILS */}
          {currentStep === 3 && (
            <motion.div key="3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900">Add details</h2>
              <textarea 
                className="w-full flex-1 p-4 rounded-2xl bg-white border border-ink-900/10 focus:outline-none focus:ring-4 focus:ring-accent/30 transition-all resize-none text-lg min-h-[250px]"
                placeholder="What exactly is the problem?"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                 {['Pothole', 'Streetlight', 'Garbage', 'Water leak'].map(chip => (
                   <button key={chip} onClick={() => setDesc(chip)} className="px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm whitespace-nowrap hover:bg-accent/20 transition-colors">{chip}</button>
                 ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: AI REVIEW */}
          {currentStep === 4 && (
            <motion.div key="4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900 flex items-center gap-2"><Bot className="text-accent" /> AI Analysis Complete</h2>
              <div className="space-y-4">
                 <div className="p-4 bg-white rounded-xl border border-ink-900/10 flex justify-between items-center">
                    <div>
                       <p className="text-xs font-bold text-ink-500 uppercase">Detected Category</p>
                       <p className="text-xl font-bold text-ink-900">Road Infrastructure</p>
                    </div>
                    <Badge color="success">94% Confidence</Badge>
                 </div>
                 <div className="p-4 bg-white rounded-xl border border-ink-900/10">
                    <p className="text-xs font-bold text-ink-500 uppercase mb-2">Severity Assessment</p>
                    <div className="flex gap-2">
                       {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-3 flex-1 rounded-full ${i <= 3 ? 'bg-warning' : 'bg-ink-900/10'}`}></div>
                       ))}
                    </div>
                    <p className="text-sm font-semibold text-ink-700 mt-2">Moderate (Level 3)</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl border border-ink-900/10 flex justify-between items-center">
                    <div>
                       <p className="text-xs font-bold text-ink-500 uppercase">Routing</p>
                       <p className="text-lg font-bold text-ink-900">Public Works Dept</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SUCCESS */}
          {currentStep === 5 && (
            <motion.div key="5" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mb-6"
              >
                 <CheckCircle2 size={48} />
              </motion.div>
              <h2 className="text-3xl font-bold text-ink-900 mb-2">Report Submitted!</h2>
              <p className="text-ink-500 mb-8 max-w-sm">Thank you. Your report has been routed to the Public Works department.</p>
              <div className="bg-white px-6 py-3 rounded-xl border border-ink-900/10 font-mono text-xl font-bold tracking-widest text-ink-900 mb-8 shadow-sm">
                 CIV-2084
              </div>
              <Link to="/citizen/dashboard"><Button variant="secondary" className="px-8 bg-white/50">Return to Dashboard</Button></Link>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation Footer */}
        {currentStep < 5 && (
          <div className="mt-auto pt-8 flex justify-between border-t border-ink-900/10">
             <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1} className={currentStep === 1 ? 'opacity-0' : ''}>
                <ArrowLeft size={18} className="mr-2" /> Back
             </Button>
             <Button onClick={nextStep} className="px-8 shadow-[0_4px_14px_rgba(194,104,58,0.3)]">
                {currentStep === 4 ? 'Confirm & Submit' : 'Next Step'} <ArrowRight size={18} className="ml-2" />
             </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
"""
}

import os

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Step 8 Wizard generated.")
