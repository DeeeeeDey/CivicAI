import os

content = """import { useState, useRef } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, AlignLeft, Bot, CheckCircle2, ArrowRight, ArrowLeft, Image as ImageIcon, AlertTriangle, Copy, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useLocationStore } from '../../store/locationStore';

const steps = [
  { id: 1, name: 'Photo', icon: Camera },
  { id: 2, name: 'Location', icon: MapPin },
  { id: 3, name: 'Details', icon: AlignLeft },
  { id: 4, name: 'AI Review', icon: Bot },
  { id: 5, name: 'Submit', icon: CheckCircle2 }
];

export const ReportIssue = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { lat, lng, label } = useLocationStore();
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  
  const [isSameIssue, setIsSameIssue] = useState<boolean | null>(null);
  
  const handleFile = (e: any) => {
    if (e.target.files && e.target.files[0]) {
       const f = e.target.files[0];
       setFile(f);
       setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const processAI = async () => {
    if (currentStep !== 3) return;
    setAiLoading(true);
    setCurrentStep(4);
    try {
      const fd = new FormData();
      fd.append('description', desc);
      fd.append('latitude', String(lat));
      fd.append('longitude', String(lng));
      fd.append('category', 'Unknown');
      if (file) {
         fd.append('image', file);
      }
      
      const res = await api.post('/ai/preview', fd, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAiData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const submitComplaint = async () => {
    try {
      const fd = new FormData();
      fd.append('description', desc);
      fd.append('latitude', String(lat));
      fd.append('longitude', String(lng));
      fd.append('category', aiData?.category || 'Unknown');
      if (file) {
         fd.append('image', file);
      }
      
      await api.post('/complaints', fd, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentStep(5);
    } catch (err) {
      alert("Error submitting complaint");
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderGauge = (score: number) => {
    // Score 1-5 to percentage
    const perc = (score / 5) * 100;
    const colors = ['#5E8C61', '#E0B84F', '#C2683A', '#A9562C', '#8A3B1B']; // success to critical
    const color = colors[score - 1] || colors[2];
    const labels = ['Low', 'Moderate', 'High', 'Severe', 'Critical'];
    return (
      <div className="flex flex-col items-center">
         <div className="relative w-32 h-16 overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-ink-900/10 border-b-transparent border-r-transparent -rotate-45"></div>
            <motion.div 
               initial={{ rotate: -90 }}
               animate={{ rotate: -90 + (180 * (perc/100)) }}
               transition={{ duration: 1, type: "spring" }}
               className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-b-transparent border-r-transparent -rotate-45"
               style={{ borderTopColor: color, borderLeftColor: color }}
            ></motion.div>
         </div>
         <p className="mt-2 font-bold text-ink-900 text-lg">{labels[score-1]}</p>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 relative z-10">
      <div className="mb-8">
         <h1 className="text-3xl font-bold text-ink-900 mb-2">Report an Issue</h1>
         <p className="text-ink-500">Help us improve the city. It only takes 30 seconds.</p>
      </div>

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
           return (
             <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${active ? 'bg-accent text-white shadow-lg' : 'bg-surface border border-border text-ink-300'}`}>
                 <step.icon size={18} />
               </div>
               <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${active ? 'text-ink-900' : 'text-ink-300'}`}>{step.name}</span>
             </div>
           );
         })}
      </div>

      <GlassCard className="min-h-[400px] p-6 md:p-8 flex flex-col shadow-xl border-border">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: PHOTO */}
          {currentStep === 1 && (
            <motion.div key="1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900">Upload a Photo</h2>
              <div className="flex-1 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-surface relative overflow-hidden group">
                {previewUrl ? (
                   <>
                      <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Button variant="secondary" onClick={() => {setFile(null); setPreviewUrl(null);}}>Change Photo</Button>
                      </div>
                   </>
                ) : (
                   <>
                      <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
                         <Camera size={24} />
                      </div>
                      <p className="font-semibold text-ink-900">Tap to take a photo</p>
                      <p className="text-sm text-ink-500 mb-6">or drag and drop here</p>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFile} />
                   </>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: LOCATION */}
          {currentStep === 2 && (
            <motion.div key="2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900">Confirm Location</h2>
              <div className="flex-1 bg-surface rounded-2xl border border-border flex items-center justify-center flex-col gap-4">
                 <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <MapPin size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-ink-900">{label}</h3>
                 <p className="text-ink-500">Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</p>
                 <Button variant="secondary" className="mt-4" onClick={() => alert("Use the map in the navigation bar to change location first.")}>Change Location</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: DETAILS */}
          {currentStep === 3 && (
            <motion.div key="3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900">Add Details</h2>
              <div className="flex-1 flex flex-col">
                 <label className="text-sm font-bold text-ink-900 mb-2">Description</label>
                 <textarea 
                   value={desc}
                   onChange={e => setDesc(e.target.value)}
                   className="w-full flex-1 p-4 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent resize-none text-ink-900"
                   placeholder="Describe the issue... (e.g., Deep pothole on the main road, dangerous for bikes)"
                 ></textarea>
              </div>
            </motion.div>
          )}

          {/* STEP 4: AI REVIEW */}
          {currentStep === 4 && (
            <motion.div key="4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-ink-900 flex items-center gap-2"><Bot className="text-accent" /> AI Analysis Complete</h2>
              
              {aiLoading ? (
                 <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-ink-500 font-medium">Multimodal AI is analyzing your report...</p>
                 </div>
              ) : aiData ? (
                 <div className="space-y-6">
                    {/* 01 Classification */}
                    <div className="p-4 bg-surface rounded-xl border border-border shadow-sm">
                       <div className="flex items-center gap-2 mb-4">
                          <ImageIcon className="text-accent" size={18} />
                          <h3 className="font-bold text-ink-900">01 Classification</h3>
                       </div>
                       <div className="flex flex-col md:flex-row gap-4 items-center">
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                             {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-ink-900/10"></div>}
                             <motion.div 
                               className="absolute inset-0 bg-accent/20 border-t-2 border-accent"
                               animate={{ y: ['-100%', '100%'] }}
                               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                             ></motion.div>
                          </div>
                          <div className="flex-1 w-full space-y-2">
                             {aiData.top_categories?.map((c:any, idx:number) => (
                                <div key={idx} className="flex flex-col gap-1">
                                   <div className="flex justify-between text-xs font-semibold">
                                      <span className={idx===0 ? "text-ink-900" : "text-ink-500"}>{c.category}</span>
                                      <span className={idx===0 ? "text-accent" : "text-ink-500"}>{Math.round(c.confidence * 100)}%</span>
                                   </div>
                                   <div className="w-full h-1.5 bg-ink-900/10 rounded-full overflow-hidden">
                                      <div className={`h-full ${idx===0 ? 'bg-accent' : 'bg-ink-300'}`} style={{ width: `${c.confidence * 100}%` }}></div>
                                   </div>
                                </div>
                             ))}
                             <div className="mt-2 flex items-center gap-2">
                                <Badge className="text-[10px]" color={aiData.signal_driver === 'both agree' ? 'success' : aiData.signal_driver === 'disagree' ? 'warning' : 'accent'}>
                                   Signal: {aiData.signal_driver}
                                </Badge>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* 02 Severity */}
                    <div className="p-4 bg-surface rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-6">
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-4">
                             <AlertTriangle className="text-accent" size={18} />
                             <h3 className="font-bold text-ink-900">02 Severity Assessment</h3>
                          </div>
                          <ul className="text-sm space-y-2 text-ink-700">
                             {aiData.explanation?.map((ex:any, i:number) => (
                                <li key={i} className="flex gap-2 items-start">
                                   <span className="text-accent font-bold">+{ex.contribution}</span>
                                   <span><strong>{ex.factor}:</strong> {ex.note}</span>
                                </li>
                             ))}
                          </ul>
                       </div>
                       <div className="shrink-0 flex items-center justify-center p-4">
                          {renderGauge(aiData.severity)}
                       </div>
                    </div>

                    {/* 03 Duplicates */}
                    {aiData.duplicate_probability > 0.4 && (
                       <div className="p-4 bg-surface rounded-xl border border-border shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                             <Copy className="text-accent" size={18} />
                             <h3 className="font-bold text-ink-900">03 Duplicate Detection</h3>
                          </div>
                          <p className="text-sm text-ink-500 mb-4">We found a visually and contextually similar issue nearby.</p>
                          <div className="grid grid-cols-2 gap-4 text-center text-sm mb-4">
                             <div className="p-2 border border-border rounded-lg bg-white/50">
                                <p className="font-bold text-accent">{Math.round(aiData.duplicate_probability * 100)}% Match</p>
                                <p className="text-xs text-ink-500">Overall AI Similarity</p>
                             </div>
                             <div className="p-2 border border-border rounded-lg bg-white/50">
                                <p className="font-bold text-ink-900">#{aiData.matched_complaint_id}</p>
                                <p className="text-xs text-ink-500">Existing Record</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Button variant={isSameIssue === true ? "primary" : "secondary"} className="flex-1" onClick={() => setIsSameIssue(true)}>Yes, this is the same issue</Button>
                             <Button variant={isSameIssue === false ? "primary" : "secondary"} className="flex-1 bg-surface border-border" onClick={() => setIsSameIssue(false)}>No, this is different</Button>
                          </div>
                       </div>
                    )}
                 </div>
              ) : (
                 <p>Error loading AI analysis.</p>
              )}
            </motion.div>
          )}

          {/* STEP 5: SUBMIT */}
          {currentStep === 5 && (
            <motion.div key="5" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
                 <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-bold text-ink-900 mb-2">Report Submitted!</h2>
              <p className="text-ink-500 mb-8 max-w-md">Your issue has been logged, analyzed by AI, and routed to the correct department.</p>
              <div className="flex gap-4">
                 <Button onClick={() => navigate('/citizen')}>Go to Dashboard</Button>
                 <Button variant="secondary" onClick={() => window.location.reload()}>Report Another</Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {currentStep < 5 && (
          <div className="mt-auto pt-8 flex justify-between border-t border-border">
             <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1 || aiLoading} className={currentStep === 1 ? 'opacity-0' : ''}>
                <ArrowLeft size={18} className="mr-2" /> Back
             </Button>
             
             {currentStep === 3 ? (
                <Button onClick={processAI} disabled={!desc || !file} className="px-8">
                   Analyze with AI <ArrowRight size={18} className="ml-2" />
                </Button>
             ) : currentStep === 4 ? (
                <Button onClick={submitComplaint} className="px-8 shadow-lg shadow-accent/20 bg-accent text-white hover:bg-accent-hover">
                   Confirm & Submit <CheckCircle2 size={18} className="ml-2" />
                </Button>
             ) : (
                <Button onClick={nextStep} disabled={currentStep === 1 && !file} className="px-8">
                   Next Step <ArrowRight size={18} className="ml-2" />
                </Button>
             )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
"""

with open("client/src/pages/citizen/ReportIssue.tsx", "w") as f:
    f.write(content)
print("Updated ReportIssue.tsx")
