const fs = require('fs');
const path = require('path');

const figuresDir = path.join(__dirname, '../figures');
const latexFiguresDir = path.join(__dirname, '../latex/figures');
const publicFiguresDir = path.join(__dirname, '../client/public/figures');

[figuresDir, latexFiguresDir, publicFiguresDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// 1. Architecture Diagram SVG
const archSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" width="100%" height="100%">
  <defs>
    <linearGradient id="gradClient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="gradServer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="gradAI" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
    <linearGradient id="gradData" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569" />
    </marker>
  </defs>

  <rect width="900" height="520" fill="#f8fafc" rx="8" />
  
  <!-- Section: Client Layer -->
  <rect x="30" y="20" width="840" height="90" rx="8" fill="#e0f2fe" stroke="#bae6fd" stroke-width="1.5" />
  <text x="45" y="42" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0369a1">PRESENTATION TIER (CLIENT APPLICATIONS)</text>
  
  <rect x="50" y="52" width="180" height="46" rx="6" fill="url(#gradClient)" />
  <text x="140" y="75" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Citizen Web / PWA</text>
  <text x="140" y="90" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#e0f2fe" text-anchor="middle">React 18 + Vite + Geolocation</text>

  <rect x="255" y="52" width="180" height="46" rx="6" fill="url(#gradClient)" />
  <text x="345" y="75" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Officer Review Desk</text>
  <text x="345" y="90" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#e0f2fe" text-anchor="middle">Triage Queue &amp; Merge UI</text>

  <rect x="460" y="52" width="180" height="46" rx="6" fill="url(#gradClient)" />
  <text x="550" y="75" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Field Worker Portal</text>
  <text x="550" y="90" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#e0f2fe" text-anchor="middle">Mobile Tasks &amp; Proof Upload</text>

  <rect x="665" y="52" width="180" height="46" rx="6" fill="url(#gradClient)" />
  <text x="755" y="75" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Admin SLA Dashboard</text>
  <text x="755" y="90" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#e0f2fe" text-anchor="middle">Zonal Analytics &amp; Audit Logs</text>

  <!-- Connectors Client -> Gateway -->
  <line x1="140" y1="98" x2="140" y2="140" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />
  <line x1="345" y1="98" x2="345" y2="140" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />
  <line x1="550" y1="98" x2="550" y2="140" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />
  <line x1="755" y1="98" x2="755" y2="140" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Section: API Gateway Layer -->
  <rect x="30" y="140" width="840" height="75" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
  <text x="45" y="162" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#334155">GATEWAY &amp; SECURITY TIER</text>
  
  <rect x="50" y="172" width="245" height="34" rx="4" fill="url(#gradServer)" />
  <text x="172" y="194" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">Express 5.x REST API</text>

  <rect x="325" y="172" width="245" height="34" rx="4" fill="url(#gradServer)" />
  <text x="447" y="194" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">JWT Auth + RBAC Guard</text>

  <rect x="600" y="172" width="245" height="34" rx="4" fill="url(#gradServer)" />
  <text x="722" y="194" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">Helmet + RateLimiter + Multer</text>

  <!-- Connectors Gateway -> Core Engine -->
  <line x1="450" y1="215" x2="450" y2="250" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Section: Processing & Intelligence Engine -->
  <rect x="30" y="250" width="840" height="120" rx="8" fill="#ccfbf1" stroke="#99f6e4" stroke-width="1.5" />
  <text x="45" y="272" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0f766e">PROCESSING &amp; INTELLIGENCE TIER</text>
  
  <rect x="50" y="285" width="245" height="70" rx="6" fill="url(#gradAI)" />
  <text x="172" y="312" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Gemini 1.5 Flash Vision</text>
  <text x="172" y="330" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#ccfbf1" text-anchor="middle">Damage Classification &amp; Severity</text>
  <text x="172" y="344" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="#99f6e4" text-anchor="middle">Structured JSON Schema Parsing</text>

  <rect x="325" y="285" width="245" height="70" rx="6" fill="url(#gradAI)" />
  <text x="447" y="312" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Haversine Duplicate Engine</text>
  <text x="447" y="330" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#ccfbf1" text-anchor="middle">80m Radius Spatial Clustering</text>
  <text x="447" y="344" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="#99f6e4" text-anchor="middle">Multi-Complaint Parent-Child Sync</text>

  <rect x="600" y="285" width="245" height="70" rx="6" fill="url(#gradAI)" />
  <text x="722" y="312" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">FSM &amp; Notification Service</text>
  <text x="722" y="330" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#ccfbf1" text-anchor="middle">Strict State Lifecycle Validation</text>
  <text x="722" y="344" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="#99f6e4" text-anchor="middle">Dual Email + In-App Alerts</text>

  <!-- Connectors Core Engine -> Data -->
  <line x1="450" y1="370" x2="450" y2="405" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Section: Data Persistence Tier -->
  <rect x="30" y="405" width="840" height="95" rx="8" fill="#e0e7ff" stroke="#c7d2fe" stroke-width="1.5" />
  <text x="45" y="427" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#3730a3">DATA &amp; PERSISTENCE TIER</text>
  
  <rect x="150" y="438" width="280" height="50" rx="6" fill="url(#gradData)" />
  <text x="290" y="460" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">PostgreSQL 15 (Relational DB)</text>
  <text x="290" y="476" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#c7d2fe" text-anchor="middle">Prisma ORM | Users, Complaints, Audits</text>

  <rect x="470" y="438" width="280" height="50" rx="6" fill="url(#gradData)" />
  <text x="610" y="460" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Supabase Object Storage</text>
  <text x="610" y="476" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#c7d2fe" text-anchor="middle">Secure Public/Private Photo Buckets</text>
</svg>`;

// 2. FSM State Machine SVG
const fsmSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 300" width="100%" height="100%">
  <defs>
    <marker id="fsmArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#1e3a8a" />
    </marker>
  </defs>
  <rect width="860" height="300" fill="#f8fafc" rx="8" />

  <!-- State Nodes -->
  <!-- DRAFT -->
  <rect x="30" y="50" width="110" height="45" rx="8" fill="#94a3b8" />
  <text x="85" y="78" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">DRAFT</text>

  <!-- SUBMITTED -->
  <rect x="190" y="50" width="120" height="45" rx="8" fill="#3b82f6" />
  <text x="250" y="78" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">SUBMITTED</text>

  <!-- ASSIGNED -->
  <rect x="360" y="50" width="120" height="45" rx="8" fill="#6366f1" />
  <text x="420" y="78" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">ASSIGNED</text>

  <!-- IN_PROGRESS -->
  <rect x="530" y="50" width="130" height="45" rx="8" fill="#eab308" />
  <text x="595" y="78" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">IN_PROGRESS</text>

  <!-- RESOLVED -->
  <rect x="710" y="50" width="120" height="45" rx="8" fill="#10b981" />
  <text x="770" y="78" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">RESOLVED</text>

  <!-- VERIFIED (Bottom) -->
  <rect x="710" y="190" width="120" height="45" rx="8" fill="#047857" />
  <text x="770" y="218" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">VERIFIED</text>

  <!-- REOPENED (Bottom Left) -->
  <rect x="360" y="190" width="120" height="45" rx="8" fill="#ef4444" />
  <text x="420" y="218" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">REOPENED</text>

  <!-- Arrows -->
  <line x1="140" y1="72" x2="185" y2="72" stroke="#1e3a8a" stroke-width="2" marker-end="url(#fsmArrow)" />
  <text x="162" y="66" font-family="Helvetica, Arial" font-size="9" fill="#475569" text-anchor="middle">Submit</text>

  <line x1="310" y1="72" x2="355" y2="72" stroke="#1e3a8a" stroke-width="2" marker-end="url(#fsmArrow)" />
  <text x="335" y="66" font-family="Helvetica, Arial" font-size="9" fill="#475569" text-anchor="middle">Assign</text>

  <line x1="480" y1="72" x2="525" y2="72" stroke="#1e3a8a" stroke-width="2" marker-end="url(#fsmArrow)" />
  <text x="502" y="66" font-family="Helvetica, Arial" font-size="9" fill="#475569" text-anchor="middle">Start Job</text>

  <line x1="660" y1="72" x2="705" y2="72" stroke="#1e3a8a" stroke-width="2" marker-end="url(#fsmArrow)" />
  <text x="682" y="66" font-family="Helvetica, Arial" font-size="9" fill="#475569" text-anchor="middle">Proof Upload</text>

  <line x1="770" y1="95" x2="770" y2="185" stroke="#1e3a8a" stroke-width="2" marker-end="url(#fsmArrow)" />
  <text x="805" y="145" font-family="Helvetica, Arial" font-size="9" fill="#047857">Verify</text>

  <line x1="710" y1="90" x2="485" y2="195" stroke="#ef4444" stroke-width="2" marker-end="url(#fsmArrow)" stroke-dasharray="4" />
  <text x="610" y="160" font-family="Helvetica, Arial" font-size="9" fill="#ef4444">Dispute</text>

  <line x1="420" y1="190" x2="420" y2="100" stroke="#1e3a8a" stroke-width="2" marker-end="url(#fsmArrow)" />
  <text x="375" y="145" font-family="Helvetica, Arial" font-size="9" fill="#475569">Reassign</text>

  <!-- Note Box -->
  <rect x="30" y="180" width="280" height="60" rx="6" fill="#f1f5f9" stroke="#cbd5e1" />
  <text x="40" y="200" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155">Lifecycle Automation Guards:</text>
  <text x="40" y="216" font-family="Helvetica, Arial" font-size="9" fill="#64748b">• Automated Dual Email at EVERY step</text>
  <text x="40" y="228" font-family="Helvetica, Arial" font-size="9" fill="#64748b">• 30-Day Auto Retention Window</text>
</svg>`;

// Write files
const files = [
  { name: 'architecture_diagram.svg', content: archSvg },
  { name: 'state_machine.svg', content: fsmSvg }
];

files.forEach(f => {
  fs.writeFileSync(path.join(figuresDir, f.name), f.content, 'utf8');
  fs.writeFileSync(path.join(latexFiguresDir, f.name), f.content, 'utf8');
  fs.writeFileSync(path.join(publicFiguresDir, f.name), f.content, 'utf8');
});

console.log("SVGs written successfully.");
