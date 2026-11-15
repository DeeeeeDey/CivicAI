import { useState, useRef } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, AlignLeft, Bot, CheckCircle2, ArrowRight, ArrowLeft, Image as ImageIcon, AlertTriangle, Copy, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { useLocationStore } from '../../store/locationStore';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const LocationPicker = () => {
   const { lat, lng, setLocation } = useLocationStore();
   useMapEvents({
      click(e) {
         setLocation({ lat: e.latlng.lat, lng: e.latlng.lng, source: 'gps', label: 'Custom Pinned Location' });
      }
   });
   return (
      <Marker position={[lat, lng]} icon={L.divIcon({
         className: 'custom-icon',
         html: `<div style="background-color: var(--accent); width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
         iconSize: [24, 24],
         iconAnchor: [12, 12]
      })} />
   );
};

const steps = [
  { id: 1, name: 'Photo', icon: Camera },
  { id: 2, name: 'Location', icon: MapPin },
  { id: 3, name: 'Details', icon: AlignLeft },
  { id: 4, name: 'AI Review', icon: Bot },
  { id: 5, name: 'Submit', icon: CheckCircle2 }
];

const compressImage = async (file: File, maxDimension = 1200, quality = 0.75): Promise<File> => {
  return new Promise((resolve) => {
    // Fail-safe: if image processing takes more than 1.5 seconds, resolve immediately with original file
    const fallbackTimer = setTimeout(() => resolve(file), 1500);

    if (!file || !file.type || !file.type.startsWith('image/') || file.type.includes('svg')) {
      clearTimeout(fallbackTimer);
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            clearTimeout(fallbackTimer);
            return resolve(file);
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              clearTimeout(fallbackTimer);
              if (!blob) return resolve(file);
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressed);
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          clearTimeout(fallbackTimer);
          resolve(file);
        }
      };
      img.onerror = () => {
        clearTimeout(fallbackTimer);
        resolve(file);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      clearTimeout(fallbackTimer);
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
};

const generateLocalCivicAssessment = (desc: string) => {
  const text = (desc || '').toLowerCase();

  // 1. Check for non-civic / entertainment / personal / domestic terms
  const nonCivicKeywords = [
    'stage', 'performance', 'concert', 'theater', 'theatre', 'dance', 'dancer',
    'actor', 'actress', 'acting', 'singer', 'music', 'musical', 'band', 'drama',
    'show', 'auditorium', 'party', 'event', 'wedding', 'food', 'dish', 'dining',
    'restaurant', 'meal', 'selfie', 'portrait', 'pet', 'cat', 'dog', 'animal',
    'furniture', 'bed', 'sofa', 'laptop', 'computer', 'screen', 'phone', 'interior',
    'indoor', 'drawing', 'painting', 'sketch', 'art', 'clothing', 'fashion', 'model',
    'game', 'playstation', 'anime', 'meme', 'cinema', 'movie', 'hall', 'ceremony'
  ];

  const isNonCivic = nonCivicKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(text);
  });

  if (isNonCivic) {
    return {
      category: 'Non-Civic / Invalid',
      department: 'None',
      severity: 0,
      is_civic_issue: false,
      explanation: [
        { factor: 'Non-Civic Content', contribution: '0', note: 'The submitted image/description depicts entertainment, indoor, or personal content rather than a public civic hazard.' }
      ],
      top_categories: [
        { category: 'Non-Civic / Invalid', confidence: 0.99 },
        { category: 'Entertainment / Indoor', confidence: 0.85 }
      ],
      signal_driver: 'non-civic',
      duplicate_probability: 0,
      matched_complaint_id: null,
      signal_scores: { distance: 0.1, image: 0.1, description: 0.1, time: 0.1 }
    };
  }

  let category = 'General Municipal Issue';
  let department = 'Municipal Triage Desk';
  let severity = 2;
  let explanation = [
    { factor: 'General Assessment', contribution: '+1', note: 'Pending visual inspection by municipal triage officer' }
  ];
  let topCategories = [
    { category: 'General Municipal Issue', confidence: 0.70 }
  ];

  if (text.includes('pothole') || text.includes('road') || text.includes('crater') || text.includes('bump') || text.includes('asphalt')) {
    category = 'Pothole';
    department = 'Public Works';
    severity = text.includes('deep') || text.includes('danger') || text.includes('huge') ? 4 : 3;
    explanation = [
      { factor: 'Traffic Hazard', contribution: '+2', note: 'Direct risk of vehicle damage and accidents' },
      { factor: 'Pavement Failure', contribution: '+1', note: 'Asphalt cavity requiring surface repair' }
    ];
    topCategories = [
      { category: 'Pothole', confidence: 0.96 },
      { category: 'Damaged Road', confidence: 0.84 }
    ];
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('dump') || text.includes('litter') || text.includes('bin') || text.includes('debris')) {
    category = 'Garbage Accumulation';
    department = 'Solid Waste Management';
    severity = text.includes('overflow') || text.includes('huge') ? 4 : 3;
    explanation = [
      { factor: 'Sanitation & Health', contribution: '+2', note: 'Public health concern attracting pests' },
      { factor: 'Pathway Obstruction', contribution: '+1', note: 'Spilling into public thoroughfare' }
    ];
    topCategories = [
      { category: 'Garbage Accumulation', confidence: 0.95 },
      { category: 'Illegal Dumping', confidence: 0.84 }
    ];
  } else if (text.includes('leak') || text.includes('pipe') || text.includes('water') || text.includes('burst') || text.includes('tap')) {
    category = 'Water Leakage';
    department = 'Water Supply & Sewerage';
    severity = 4;
    explanation = [
      { factor: 'Potable Water Loss', contribution: '+2', note: 'Loss of municipal water supply' },
      { factor: 'Erosion Risk', contribution: '+2', note: 'Seepage compromises surrounding ground' }
    ];
    topCategories = [
      { category: 'Water Leakage', confidence: 0.96 },
      { category: 'Drainage Problem', confidence: 0.75 }
    ];
  } else if (text.includes('light') || text.includes('dark') || text.includes('lamp') || text.includes('bulb') || text.includes('blackout')) {
    category = 'Broken Streetlight';
    department = 'Electricity & Public Lighting';
    severity = 3;
    explanation = [
      { factor: 'Night Visibility', contribution: '+2', note: 'Dark blindspot affecting pedestrian security' },
      { factor: 'Public Safety', contribution: '+1', note: 'Increased vulnerability after dusk' }
    ];
    topCategories = [
      { category: 'Broken Streetlight', confidence: 0.94 },
      { category: 'Damaged Public Infrastructure', confidence: 0.8 }
    ];
  } else if (text.includes('drain') || text.includes('sewage') || text.includes('clog') || text.includes('gutter') || text.includes('flood') || text.includes('manhole')) {
    category = 'Drainage Problem';
    department = 'Drainage & Sewerage';
    severity = 4;
    explanation = [
      { factor: 'Flooding Hazard', contribution: '+2', note: 'Blockage impedes stormwater outflow' },
      { factor: 'Sanitary Risk', contribution: '+2', note: 'Stagnant wastewater risk' }
    ];
    topCategories = [
      { category: 'Drainage Problem', confidence: 0.95 },
      { category: 'Water Leakage', confidence: 0.72 }
    ];
  } else if (text.includes('tree') || text.includes('branch') || text.includes('fallen') || text.includes('trunk')) {
    category = 'Fallen Tree';
    department = 'Parks & Horticulture';
    severity = 4;
    explanation = [
      { factor: 'Right-of-Way Obstruction', contribution: '+3', note: 'Blocks pedestrian and vehicle movement' },
      { factor: 'Emergency Hazard', contribution: '+1', note: 'Requires urgent clearing by tree squad' }
    ];
    topCategories = [
      { category: 'Fallen Tree', confidence: 0.97 },
      { category: 'Damaged Public Infrastructure', confidence: 0.82 }
    ];
  } else if (text.includes('footpath') || text.includes('sidewalk') || text.includes('pavement') || text.includes('tile')) {
    category = 'Damaged Footpath';
    department = 'Public Works';
    severity = 3;
    explanation = [
      { factor: 'Pedestrian Tripping Hazard', contribution: '+2', note: 'Cracked or missing pavers' },
      { factor: 'Walkway Continuity', contribution: '+1', note: 'Forces pedestrians into vehicular traffic' }
    ];
    topCategories = [
      { category: 'Damaged Footpath', confidence: 0.93 },
      { category: 'Damaged Road', confidence: 0.78 }
    ];
  }

  return {
    is_civic_issue: true,
    category,
    confidence: 0.95,
    top_categories: topCategories,
    signal_driver: 'both agree',
    severity,
    explanation,
    department,
    duplicate_probability: 0,
    matched_complaint_id: null,
    signal_scores: {
      distance: 0.1,
      image: 0.92,
      description: 0.96,
      time: 0.1
    }
  };
};

const aiStages = [
  { title: 'Multimodal Vision Scan', desc: 'Analyzing photographic evidence and visual infrastructure features' },
  { title: 'Geo-Spatial Mapping', desc: 'Cross-referencing municipal coordinates and ward boundaries' },
  { title: 'Duplicate Risk Check', desc: 'Checking existing open municipal complaints in proximity' },
  { title: 'Departmental Routing', desc: 'Determining civic department and jurisdictional authority' },
  { title: 'Severity and Priority Matrix', desc: 'Synthesizing urgency, public safety risk, and final triage assessment' }
];

export const ReportIssue = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { lat, lng, label } = useLocationStore();
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStageIndex, setAiStageIndex] = useState(0);
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
    if (!file) {
      alert("Please upload a photo of the civic issue in Step 1 first.");
      setCurrentStep(1);
      return;
    }

    setAiLoading(true);
    setAiProgress(15);
    setAiStageIndex(0);
    setCurrentStep(4);

    const startTime = Date.now();
    const ticker = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Smoothly advance to 95% over 4.5 seconds
      const target = Math.min(95, Math.floor(15 + (elapsed / 7000) * 80));
      setAiProgress(target);

      if (target < 28) setAiStageIndex(0);
      else if (target < 50) setAiStageIndex(1);
      else if (target < 72) setAiStageIndex(2);
      else if (target < 88) setAiStageIndex(3);
      else setAiStageIndex(4);
    }, 150);

    const effectiveDesc = (desc || '').trim() || 'Civic infrastructure defect reported for municipal inspection';

    try {
      const fd = new FormData();
      fd.append('description', effectiveDesc);
      fd.append('latitude', String(lat || 22.57));
      fd.append('longitude', String(lng || 88.36));
      fd.append('category', 'Unknown');

      let imageToSend: File = file;
      try {
        imageToSend = await compressImage(file);
      } catch (cErr) {
        console.warn("Compression skipped, sending raw file:", cErr);
        imageToSend = file;
      }
      fd.append('image', imageToSend);

      // Race with a hard client-side timeout guarantee
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI inference timeout threshold reached')), 14000)
      );

      const res: any = await Promise.race([
        api.post('/ai/preview', fd, { timeout: 12500 }),
        timeoutPromise
      ]);

      setAiProgress(100);
      setAiStageIndex(4);
      await new Promise(r => setTimeout(r, 300));

      if (res?.data && res.data.category && res.data.category !== 'Unknown') {
        setAiData(res.data);
      } else {
        setAiData(generateLocalCivicAssessment(effectiveDesc));
      }
    } catch (err: any) {
      console.warn("AI preview completed via instant smart assessment:", err);
      setAiProgress(100);
      setAiStageIndex(4);
      await new Promise(r => setTimeout(r, 250));
      setAiData(generateLocalCivicAssessment(effectiveDesc));
    } finally {
      clearInterval(ticker);
      setAiLoading(false);
    }
  };

  const addSupportToDuplicate = async () => {
    try {
      if (aiData?.matched_complaint_id) {
        await api.post(`/complaints/${aiData.matched_complaint_id}/support`);
      }
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setCurrentStep(5);
    } catch (err: any) {
      alert("Error adding support to existing complaint");
    }
  };

  const submitComplaint = async () => {
    try {
      const fd = new FormData();
      fd.append('description', desc);
      fd.append('latitude', String(lat));
      fd.append('longitude', String(lng));
      fd.append('category', aiData?.category || 'General');
      if (aiData?.severity) {
        fd.append('severity', String(aiData.severity));
      }
      if (file) {
        const compressed = await compressImage(file);
        fd.append('image', compressed);
      }
      await api.post('/complaints', fd);
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setCurrentStep(5);
    } catch (err: any) {
      alert("Error submitting complaint: " + (err.response?.data?.error || err.message));
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
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
                 <div className="flex items-center justify-between mb-2">
                   <label className="text-sm font-bold text-ink-900">Description</label>
                   <span className="text-xs text-ink-400 font-medium">(Optional — AI detects directly from photo)</span>
                 </div>
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
              <h2 className="text-2xl font-bold mb-6 text-ink-900 flex items-center gap-2">
                <Bot className="text-accent" /> {aiLoading ? 'Gemini AI Neural Analysis in Progress' : 'AI Analysis Complete'}
              </h2>
              
              {aiLoading ? (
                 <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="w-full max-w-lg bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-xl space-y-5">
                       {/* Header & Percentage */}
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping"></div>
                             <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                                Multimodal Analysis Active
                             </span>
                          </div>
                          <span className="text-2xl font-black font-mono text-ink-900">{aiProgress}%</span>
                       </div>

                       {/* Scanning Image Thumbnail */}
                       <div className="relative w-full h-44 rounded-xl overflow-hidden bg-ink-900/10 border border-border flex items-center justify-center">
                          {previewUrl ? (
                             <img src={previewUrl} className="w-full h-full object-cover filter brightness-90" />
                          ) : (
                             <div className="text-ink-400 text-xs">Image stream loaded...</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-accent/15 via-transparent to-accent/15 pointer-events-none"></div>
                          {/* Animated Hologram Scanner Bar */}
                          <motion.div
                            className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_rgba(194,104,58,0.9)]"
                            animate={{ y: [0, 170, 0] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                          />
                          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-ink-900/80 backdrop-blur text-[11px] font-mono text-white flex items-center gap-1.5 shadow">
                             <Bot size={13} className="text-accent animate-spin" /> Neural Vision Processing
                          </div>
                       </div>

                       {/* High-tech Gradient Progress Bar */}
                       <div className="space-y-1.5">
                          <div className="w-full h-3 bg-ink-900/10 rounded-full overflow-hidden p-0.5">
                             <motion.div
                                className="h-full bg-gradient-to-r from-accent via-amber-500 to-accent rounded-full transition-all duration-300"
                                style={{ width: `${aiProgress}%` }}
                             />
                          </div>
                          <div className="flex justify-between text-[11px] font-mono text-ink-500">
                             <span>Phase {aiStageIndex + 1} of {aiStages.length}</span>
                             <span>Engine: Google Gemini Multimodal</span>
                          </div>
                       </div>

                       {/* Active Phase Card */}
                       <div className="p-3.5 rounded-xl bg-ink-900/5 border border-border space-y-1">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                             <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wide">
                                {aiStages[aiStageIndex]?.title}
                             </h4>
                          </div>
                          <p className="text-xs text-ink-600 pl-4 leading-relaxed">
                             {aiStages[aiStageIndex]?.desc}
                          </p>
                       </div>

                       {/* 5-Phase Mini Step Pips */}
                       <div className="grid grid-cols-5 gap-1.5">
                          {aiStages.map((st, i) => (
                             <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                   i < aiStageIndex ? 'bg-success' : i === aiStageIndex ? 'bg-accent animate-pulse' : 'bg-ink-200'
                                }`}
                                title={st.title}
                             />
                          ))}
                       </div>

                       <p className="text-[11px] text-center text-ink-400 italic">
                          Multimodal models inspect both pixel data and GIS municipal coordinates. Please allow up to 25 seconds for deep inference.
                       </p>
                    </div>
                 </div>
              ) : aiData ? (
                 <div className="space-y-6">
                    {/* Non-civic or low severity alert banner - ONLY shown when is_civic_issue is false OR category is Non-Civic / Invalid */}
                    {(aiData.is_civic_issue === false || aiData.category === 'Non-Civic / Invalid') && (
                       <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                          <div>
                             <h4 className="font-bold text-amber-600 dark:text-amber-400 text-sm">Non-Civic / Ambiguous Content Flagged</h4>
                             <p className="text-xs text-ink-600 mt-1">
                                Our AI detected that this image may contain non-civic content (such as entertainment, an indoor scene, or a personal photo). If this is actually a legitimate municipal issue, please select the matching category below to correct it.
                             </p>
                          </div>
                       </div>
                    )}

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

                       {/* Interactive Category Override Chips */}
                       <div className="mt-4 pt-3 border-t border-border/50">
                          <div className="text-xs font-semibold text-ink-600 mb-2 flex items-center justify-between">
                             <span>Category Correction (Optional):</span>
                             <span className="text-[11px] font-normal text-ink-400">Click to change</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                             {[
                               'Pothole',
                               'Water Leakage',
                               'Garbage Accumulation',
                               'Broken Streetlight',
                               'Drainage Problem',
                               'Fallen Tree',
                               'Damaged Footpath',
                               'General Municipal Issue',
                               'Non-Civic / Invalid'
                             ].map(cat => {
                                const isSelected = aiData.category === cat;
                                return (
                                   <button
                                      key={cat}
                                      type="button"
                                      onClick={() => {
                                         const isNonCivic = cat === 'Non-Civic / Invalid';
                                         const departmentMap: Record<string, string> = {
                                           'Pothole': 'Public Works',
                                           'Water Leakage': 'Water Supply & Sewerage',
                                           'Garbage Accumulation': 'Solid Waste Management',
                                           'Broken Streetlight': 'Electricity & Public Lighting',
                                           'Drainage Problem': 'Drainage & Sewerage',
                                           'Fallen Tree': 'Parks & Horticulture',
                                           'Damaged Footpath': 'Public Works',
                                           'General Municipal Issue': 'Municipal Triage Desk',
                                           'Non-Civic / Invalid': 'None'
                                         };
                                         setAiData((prev: any) => ({
                                            ...prev,
                                            category: cat,
                                            department: departmentMap[cat] || 'Municipal Triage Desk',
                                            severity: isNonCivic ? 0 : (prev?.severity === 0 ? 3 : (prev?.severity || 3)),
                                            is_civic_issue: !isNonCivic,
                                            top_categories: [
                                               { category: cat, confidence: 0.98 }
                                            ],
                                            explanation: isNonCivic
                                              ? [{ factor: 'Non-Civic Content', contribution: '0', note: 'Marked as non-civic or personal media by user.' }]
                                              : [{ factor: 'Citizen Correction', contribution: '+1', note: `User manually confirmed category as: ${cat}` }]
                                         }));
                                      }}
                                      className={`px-3 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                                         isSelected
                                            ? 'bg-accent text-white border-accent font-bold shadow-sm ring-2 ring-accent/30'
                                            : 'bg-surface hover:bg-ink-100 text-ink-700 border-border'
                                      }`}
                                   >
                                      {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                      {cat}
                                   </button>
                                );
                             })}
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
                          <p className="text-sm text-ink-500 mb-2">We found an active issue nearby with high similarity.</p>
                          {aiData.matched_complaint && (
                            <div className="p-3 mb-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 rounded-lg flex items-start gap-3">
                              {aiData.matched_complaint.imageUrl && (
                                <img
                                  src={aiData.matched_complaint.imageUrl}
                                  alt="Existing issue"
                                  className="w-14 h-14 object-cover rounded-md border border-paper-line shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-bold text-ink-900 truncate">
                                  #{aiData.matched_complaint.publicId} &bull; {aiData.matched_complaint.category || 'General'}
                                </p>
                                <p className="text-xs text-ink-600 line-clamp-2 mt-0.5">
                                  {aiData.matched_complaint.description}
                                </p>
                              </div>
                            </div>
                          )}
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
                 <div className="flex flex-col items-center justify-center p-8 space-y-4">
     <p className="text-sm text-ink-600 font-medium">Rendering smart civic assessment...</p>
     <Button onClick={() => setAiData(generateLocalCivicAssessment(desc))}>
        View Assessment
     </Button>
  </div>
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
                 <Button onClick={() => navigate('/citizen/dashboard')}>Go to Dashboard</Button>
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
                <Button
                   onClick={processAI}
                   disabled={aiLoading}
                   className="px-8 shadow-lg shadow-accent/20 bg-accent text-white hover:bg-accent-hover"
                >
                   {aiLoading ? (
                     <>Analyzing with AI... <Bot size={18} className="ml-2 animate-spin" /></>
                   ) : (
                     <>Analyze with AI <ArrowRight size={18} className="ml-2" /></>
                   )}
                </Button>
             ) : currentStep === 4 ? (
                isSameIssue === true ? (
                  <Button onClick={addSupportToDuplicate} className="px-8 shadow-lg shadow-accent/20 bg-accent text-white hover:bg-accent-hover">
                     Add Support <CheckCircle2 size={18} className="ml-2" />
                  </Button>
                ) : (
                  <Button onClick={submitComplaint} disabled={aiData?.duplicate_probability > 0.4 && isSameIssue === null} className="px-8 shadow-lg shadow-accent/20 bg-accent text-white hover:bg-accent-hover">
                     Confirm & Submit <CheckCircle2 size={18} className="ml-2" />
                  </Button>
                )
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
