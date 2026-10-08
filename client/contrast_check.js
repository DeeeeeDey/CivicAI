// contrast_check.js
const chroma = require('chroma-js');

const tokens = {
  'bg-base': '#FBF8F3',
  'bg-sand': '#F4ECDF',
  'bg-linen': '#EBDFCB',
  'surface': '#FFFFFF',
  'ink-900': '#2A2420',
  'ink-700': '#4B4238',
  'ink-500': '#7C7063',
  'ink-300': '#BCB1A3',
  'accent': '#C2683A',
  'glass': '#FFFCF7' // Approximate solid color for glass test
};

const rules = [
  { fg: 'ink-900', bg: 'bg-base', level: 'AA' },
  { fg: 'ink-700', bg: 'bg-base', level: 'AA' },
  { fg: 'ink-500', bg: 'bg-base', level: 'AA Large' }, // Should be > 3:1
  { fg: 'accent', bg: 'bg-base', level: 'AA Large' },
  { fg: 'ink-900', bg: 'glass', level: 'AA' }
];

console.log("=== CONTRAST CHECK ===");
let passed = true;
for (const rule of rules) {
  const fg = tokens[rule.fg];
  const bg = tokens[rule.bg];
  const contrast = chroma.contrast(fg, bg);
  const target = rule.level === 'AA' ? 4.5 : 3.0;
  
  if (contrast >= target) {
    console.log(`✅ [PASS] ${rule.fg} on ${rule.bg}: ${contrast.toFixed(2)}:1 (Target: ${target}:1)`);
  } else {
    console.log(`❌ [FAIL] ${rule.fg} on ${rule.bg}: ${contrast.toFixed(2)}:1 (Target: ${target}:1)`);
    passed = false;
  }
}

if (!passed) process.exit(1);
