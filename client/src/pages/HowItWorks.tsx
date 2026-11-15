import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  Camera,
  Bot,
  GitMerge,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Bell,
  ArrowRight,
  MapPin,
  Sparkles,
  Zap,
  Clock,
  Layers,
  FileCheck,
  Eye,
  Check
} from 'lucide-react';

interface StepData {
  number: string;
  tag: string;
  tagColor: 'info' | 'warning' | 'danger' | 'success' | 'default';
  title: string;
  headline: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  accentColor: string;
  metric: { value: string; label: string };
  previewWidget: {
    type: 'ai' | 'merge' | 'route' | 'proof' | 'notify' | 'geo' | 'verify';
    title: string;
    detail: string;
  };
}

const steps: StepData[] = [
  {
    number: '01',
    tag: 'Citizen Initiative',
    tagColor: 'info',
    title: 'Snap, Geo-Lock & Report',
    headline: 'Zero friction civic reporting directly from your browser',
    description:
      'A citizen spots an infrastructure failure—whether a deep pothole, ruptured water pipe, fallen tree, or non-functional streetlight. In three taps, they capture a live photo while browser GPS locks coordinates automatically without manual address hunting.',
    features: [
      'Automatic HTML5 high-precision GPS telemetry',
      'Instant image compression for low-bandwidth cellular networks',
      'No mandatory app download—accessible on any mobile browser'
    ],
    icon: Camera,
    accentColor: '#0284c7',
    metric: { value: '< 15s', label: 'Average Submission Time' },
    previewWidget: {
      type: 'geo',
      title: 'GPS Coordinates Locked',
      detail: '22.5726° N, 88.3639° E • Precision: ±4m'
    }
  },
  {
    number: '02',
    tag: 'Multimodal AI Vision',
    tagColor: 'warning',
    title: 'Sub-3s Multimodal Triage',
    headline: 'Google Gemini 1.5 Flash categorizes & scores severity',
    description:
      'The uploaded image is streamed to our Google Gemini 1.5 Flash Vision engine. Within three seconds, the model classifies the civic hazard, assigns a severity score from 1 to 5 based on structural risk, and generates an automated action brief for municipal engineers.',
    features: [
      'Standardized 1–5 physical severity index',
      'Structured JSON schema parsing with zero clerical errors',
      'Offline rule-based fallback guarantees zero-downtime tolerance'
    ],
    icon: Bot,
    accentColor: '#d97706',
    metric: { value: '94.2%', label: 'Zero-Shot Accuracy' },
    previewWidget: {
      type: 'ai',
      title: 'Gemini Vision Assessment',
      detail: 'Category: Pothole • Severity: 4/5 • Urgent Repair'
    }
  },
  {
    number: '03',
    tag: 'Spatial Intelligence',
    tagColor: 'info',
    title: 'Haversine Geospatial Deduplication',
    headline: 'Eliminating duplicate report flooding in real time',
    description:
      'When major infrastructure breaks down, scores of citizens report the same issue. CivicAI executes a high-speed Haversine spatial radius query (80-meter threshold) across active complaints in the same category, grouping satellite reports into a single master ticket.',
    features: [
      '80-meter spatial clustering algorithm',
      'Eliminates up to 40% duplicate administrative backlog',
      'Dual-citizen binding: all original reporters retain tracking access'
    ],
    icon: GitMerge,
    accentColor: '#6366f1',
    metric: { value: '40%', label: 'Backlog Reduction' },
    previewWidget: {
      type: 'merge',
      title: 'Duplicate Incident Clustered',
      detail: 'Merged 3 duplicate tickets into Master #CIV-8334'
    }
  },
  {
    number: '04',
    tag: 'Supervisory Command',
    tagColor: 'default',
    title: 'Smart Dispatch & SLA Assignment',
    headline: 'Municipal officers match tasks to nearest field crews',
    description:
      'Municipal officers view a priority-ranked triage queue sorted by AI severity and SLA breach risk. With one click, the officer confirms the AI recommendations and dispatches the work order directly to the nearest certified field crew based on departmental jurisdiction.',
    features: [
      'Priority-ordered hazard queue with SLA countdowns',
      'One-click accept or override with supervisor audit logs',
      'Automated dispatch to trade-matched municipal workers'
    ],
    icon: ShieldCheck,
    accentColor: '#059669',
    metric: { value: '< 2h', label: 'Average Triage-to-Dispatch' },
    previewWidget: {
      type: 'route',
      title: 'Work Order Dispatched',
      detail: 'Assigned to Crew: North Zone PWD Team #3'
    }
  },
  {
    number: '05',
    tag: 'Field Operations',
    tagColor: 'warning',
    title: 'On-Site Execution & Navigation',
    headline: 'Field crews execute repairs with live route tracking',
    description:
      'Field crews access their assigned jobs on a mobile portal with turn-by-turn navigation directly to the incident pin. With a single tap, the worker toggles the status to IN_PROGRESS, alerting supervisors and reporting citizens that physical repairs are underway.',
    features: [
      'Direct turn-by-turn map navigation to exact coordinates',
      'One-tap job start with idempotent state transition guards',
      'Zero paper forms—full digital workflow on field smartphones'
    ],
    icon: Wrench,
    accentColor: '#eab308',
    metric: { value: '100%', label: 'Paperless Field Flow' },
    previewWidget: {
      type: 'verify',
      title: 'Status: IN_PROGRESS',
      detail: 'Crew on site • Repair vehicle active'
    }
  },
  {
    number: '06',
    tag: 'Quality Assurance',
    tagColor: 'danger',
    title: 'Tamper-Evident Photo Proof',
    headline: 'Work cannot be closed without before/after visual verification',
    description:
      'To prevent "ghost closures" and bureaucratic apathy, CivicAI enforces a strict Finite State Machine constraint: a ticket cannot advance to RESOLVED until the field worker snaps and uploads photographic proof of the finished repair from the site.',
    features: [
      'Mandatory after-repair photo upload requirement',
      'Timestamp and geo-telemetry attached to resolution proof',
      'Cloud storage persistence for municipal and citizen audit'
    ],
    icon: FileCheck,
    accentColor: '#c2683a',
    metric: { value: '0%', label: 'Unverified Closures' },
    previewWidget: {
      type: 'proof',
      title: 'Proof Uploaded & Stored',
      detail: 'Before vs. After Photographic Audit Passed'
    }
  },
  {
    number: '07',
    tag: 'Closed-Loop Accountability',
    tagColor: 'success',
    title: 'Dual Notification & Verified Closure',
    headline: 'Real-time email updates to all stakeholders at every step',
    description:
      'The moment resolution is submitted, automated transactional emails and in-app alerts fire simultaneously to every citizen associated with the ticket (including merged reporters). Citizens have a verification window to confirm satisfaction or dispute the resolution.',
    features: [
      'Automated HTML email alerts dispatched on every state change',
      'Direct one-click tracking links with full timeline history',
      '30-day active data retention before cold compliance archiving'
    ],
    icon: Bell,
    accentColor: '#10b981',
    metric: { value: '30 Days', label: 'Active Retention Window' },
    previewWidget: {
      type: 'notify',
      title: 'All Parties Notified',
      detail: 'Emails dispatched to 3 reporters • Ticket Verified'
    }
  }
];

export const HowItWorks = () => {
  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto w-full relative z-10 overflow-hidden">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-20 space-y-4"
      >
        <Badge className="bg-accent/10 text-accent border-accent/20 px-3 py-1 text-xs uppercase tracking-widest font-bold">
          The CivicAI Lifecycle
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink-900">
          How CivicAI <span className="font-serif italic text-accent font-normal">Works</span>
        </h1>
        <p className="text-ink-500 text-base sm:text-lg leading-relaxed">
          From a citizen’s snapshot to automated AI triage, geospatial deduplication, and tamper-evident field proof—follow the complete closed-loop journey of urban problem resolution.
        </p>

        {/* Quick Highlights Bar */}
        <div className="pt-4 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-ink-700">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm">
            <Sparkles size={14} className="text-accent" /> 7 Integrated Steps
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm">
            <Zap size={14} className="text-warning" /> &lt; 3s AI Triage
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm">
            <GitMerge size={14} className="text-info" /> Zero Duplicate Waste
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm">
            <CheckCircle2 size={14} className="text-success" /> 100% Photographic Proof
          </span>
        </div>
      </motion.div>

      {/* Timeline Section with Central Curved String */}
      <div className="relative">
        {/* ========================================================================= */}
        {/* DESKTOP CURVED SVG STRING (Visible on md and up) */}
        {/* ========================================================================= */}
        <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 2800"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="20%" stopColor="#d97706" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#059669" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#c2683a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
              <filter id="stringGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Glowing background shadow curve */}
            <path
              d="
                M 500 50
                C 440 180, 560 320, 500 450
                C 430 580, 570 720, 500 850
                C 420 980, 580 1120, 500 1250
                C 430 1380, 570 1520, 500 1650
                C 420 1780, 580 1920, 500 2050
                C 430 2180, 570 2320, 500 2450
                C 450 2580, 550 2680, 500 2750
              "
              stroke="url(#timelineGradient)"
              strokeWidth="10"
              strokeOpacity="0.15"
              fill="none"
              strokeLinecap="round"
            />

            {/* Main Smooth Curved Connecting String */}
            <path
              d="
                M 500 50
                C 440 180, 560 320, 500 450
                C 430 580, 570 720, 500 850
                C 420 980, 580 1120, 500 1250
                C 430 1380, 570 1520, 500 1650
                C 420 1780, 580 1920, 500 2050
                C 430 2180, 570 2320, 500 2450
                C 450 2580, 550 2680, 500 2750
              "
              stroke="url(#timelineGradient)"
              strokeWidth="4"
              strokeDasharray="6 6"
              fill="none"
              strokeLinecap="round"
              filter="url(#stringGlow)"
            />

            {/* Elegant looping curl embellishment between Step 2 and Step 3 */}
            <path
              d="M 500 850 C 530 890, 560 930, 540 960 C 520 990, 470 980, 480 940 C 490 910, 520 900, 500 950"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeOpacity="0.4"
              fill="none"
            />

            {/* Small curly loop embellishment between Step 5 and Step 6 */}
            <path
              d="M 500 2050 C 470 2090, 440 2130, 460 2160 C 480 2190, 530 2180, 520 2140 C 510 2110, 480 2100, 500 2150"
              stroke="#c2683a"
              strokeWidth="2.5"
              strokeOpacity="0.4"
              fill="none"
            />
          </svg>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE CURVED STRING (Visible below md) */}
        {/* ========================================================================= */}
        <div className="md:hidden absolute top-0 bottom-0 left-6 w-8 pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 40 2800" fill="none" preserveAspectRatio="none">
            <path
              d="M 20 20 C 35 300, 5 600, 20 900 C 35 1200, 5 1500, 20 1800 C 35 2100, 5 2400, 20 2780"
              stroke="url(#timelineGradient)"
              strokeWidth="3.5"
              strokeDasharray="5 5"
              fill="none"
            />
          </svg>
        </div>

        {/* Steps Stack */}
        <div className="space-y-16 sm:space-y-24 relative z-10">
          {steps.map((step, index) => {
            const isEven = index % 2 === 1;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative"
              >
                {/* Center Node on the String (Desktop) */}
                <div className="hidden md:flex absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center z-20">
                  <div
                    className="w-12 h-12 rounded-full border-4 border-surface shadow-xl flex items-center justify-center font-bold text-sm text-white transition-transform hover:scale-110"
                    style={{ backgroundColor: step.accentColor }}
                  >
                    {step.number}
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-2 animate-ping"
                    style={{ backgroundColor: step.accentColor }}
                  ></div>
                </div>

                {/* Mobile Left Node */}
                <div className="md:hidden absolute left-6 top-6 -translate-x-1/2 flex items-center justify-center z-20">
                  <div
                    className="w-10 h-10 rounded-full border-3 border-surface shadow-md flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: step.accentColor }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Grid Layout: Card on one side, Companion Widget on the other */}
                <div className="pl-14 md:pl-0 grid md:grid-cols-2 gap-8 md:gap-24 items-center">
                  {/* Left Column Content */}
                  <div className={`${isEven ? 'md:order-2' : 'md:order-1 md:text-right'}`}>
                    <GlassCard className="p-6 sm:p-8 space-y-4 hover:border-accent/50 transition-all duration-300 shadow-xl group">
                      <div className={`flex items-center gap-3 ${isEven ? 'justify-start' : 'md:justify-end'}`}>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: step.accentColor }}
                        >
                          <Icon size={20} />
                        </div>
                        <div>
                          <Badge color={step.tagColor}>{step.tag}</Badge>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-ink-900 group-hover:text-accent transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-sm font-semibold text-accent/90 mt-1">{step.headline}</p>
                      </div>

                      <p className="text-sm text-ink-600 leading-relaxed text-justify md:text-inherit">
                        {step.description}
                      </p>

                      <div className="pt-2 border-t border-border/60 space-y-2">
                        {step.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className={`flex items-center gap-2 text-xs text-ink-700 ${
                              isEven ? 'justify-start' : 'md:justify-end'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                              <Check size={11} />
                            </span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>

                  {/* Right Column Companion Widget / KPI Showcase */}
                  <div className={`${isEven ? 'md:order-1' : 'md:order-2'}`}>
                    <div className="space-y-4 max-w-md mx-auto md:max-w-none">
                      {/* Interactive Visual Mini-Card */}
                      <div className="p-5 rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md shadow-lg space-y-3">
                        <div className="flex items-center justify-between text-xs text-ink-400 font-mono">
                          <span className="flex items-center gap-1.5 font-bold uppercase">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.accentColor }}></span>
                            {step.previewWidget.title}
                          </span>
                          <span className="font-bold text-ink-900">{step.metric.value}</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-bg-base/70 border border-border/50 text-xs font-mono text-ink-800">
                          {step.previewWidget.detail}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-ink-400 pt-1">
                          <span>{step.metric.label}</span>
                          <span className="text-accent font-semibold flex items-center gap-1">
                            Verified Protocol <CheckCircle2 size={12} className="text-success" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-28"
      >
        <GlassCard className="p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-6 relative overflow-hidden border-accent/30 shadow-2xl bg-gradient-to-b from-surface to-surface-glass">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-info/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <Badge className="bg-accent/10 text-accent border-accent/20">Try It Live</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">
            Experience the Closed-Loop Civic Difference
          </h2>
          <p className="text-ink-600 text-sm sm:text-base max-w-xl mx-auto">
            Ready to test automated AI vision triage or explore incidents already resolving in your municipality?
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/citizen/report">
              <Button className="px-6 py-3 text-sm flex items-center gap-2">
                <Camera size={16} /> Report an Issue Now
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="secondary" className="px-6 py-3 text-sm flex items-center gap-2">
                <MapPin size={16} /> Explore Live Issue Map <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default HowItWorks;
