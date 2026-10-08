import os

files = {
    "src/index.css": """@import "tailwindcss";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
@import "@fontsource/instrument-serif/400-italic.css";

@theme {
  --color-bg-base: #FBF8F3;
  --color-bg-sand: #F4ECDF;
  --color-bg-linen: #EBDFCB;
  --color-surface: #FFFFFF;
  
  --color-ink-900: #2A2420;
  --color-ink-700: #4B4238;
  --color-ink-500: #7C7063;
  --color-ink-300: #BCB1A3;
  
  --color-accent: #C2683A;
  --color-accent-hover: #A9562C;
  --color-accent-soft: #F6E1D1;
  
  --color-success: #5E8C61;
  --color-warning: #C9962B;
  --color-danger: #B5503F;
  --color-info: #5B7C8D;

  --color-glass-light: rgba(255, 252, 247, 0.62);
  --color-glass-dark: rgba(44, 38, 31, 0.55);

  --font-sans: "Inter", -apple-system, sans-serif;
  --font-serif: "Instrument Serif", serif;
}

@layer base {
  :root {
    --bg-color: var(--color-bg-base);
    --text-color: var(--color-ink-900);
    --flare-1: #F7C9A0;
    --flare-2: #F4B8A0;
    --flare-3: #EFC4C0;
    --flare-4: #F3DDA5;
  }
  
  .dark {
    --bg-color: #1B1713;
    --text-color: #F3ECE0;
    --flare-1: #4A2B15;
    --flare-2: #4A2518;
    --flare-3: #4A1A18;
    --flare-4: #4A3A15;
  }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: var(--font-sans);
    transition: background-color 0.3s, color 0.3s;
    -webkit-font-smoothing: antialiased;
  }
  
  h1, h2, h3, h4, h5, h6 {
    letter-spacing: -0.02em;
  }
}

/* Warm Light Flare Background */
.mesh-background {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: -1;
  background-color: var(--bg-color);
  background-image: 
    radial-gradient(circle at 30% 100%, var(--flare-1) 0%, transparent 60%),
    radial-gradient(circle at 70% 100%, var(--flare-2) 0%, transparent 60%),
    radial-gradient(circle at 50% 80%, var(--flare-3) 0%, transparent 60%),
    radial-gradient(circle at 80% 50%, var(--flare-4) 0%, transparent 60%);
  filter: blur(100px);
  opacity: 0.8;
  animation: driftFlare 25s ease-in-out infinite alternate;
}

/* Add a subtle grain overlay */
.mesh-background::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: multiply;
  pointer-events: none;
}

@keyframes driftFlare {
  0% { transform: scale(1) translate(0, 5%); }
  100% { transform: scale(1.05) translate(-2%, -5%); }
}

@media (prefers-reduced-motion: reduce) {
  .mesh-background { animation: none; }
}

/* Frosted Glass Base */
.glass {
  background: var(--color-glass-light);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9),
              0 12px 40px rgba(110, 85, 50, 0.10),
              0 2px 6px rgba(110, 85, 50, 0.06);
}

.dark .glass {
  background: var(--color-glass-dark);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05),
              0 12px 40px rgba(0, 0, 0, 0.4);
}
""",

    "src/lib/motion.ts": """export const springConfig = {
  type: "spring",
  stiffness: 260,
  damping: 28
};

export const fadeEase = [0.22, 1, 0.36, 1];

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: fadeEase } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 }
  }
};

export const scrollReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: fadeEase }
};

export const hoverCard = {
  whileHover: { y: -4, boxShadow: "0 20px 40px rgba(110, 85, 50, 0.12)" },
  transition: springConfig
};
""",

    "src/components/ui/GlassCard.tsx": """import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GlassCard = ({ children, className, interactive = false, ...props }: any) => {
  const Component = interactive ? motion.div : 'div';
  const interactiveProps = interactive ? {
    whileHover: { y: -2, transition: { type: 'spring', stiffness: 300 } }
  } : {};

  return (
    <Component 
      className={cn("glass rounded-[24px] p-6 sm:p-8", className)}
      {...interactiveProps}
      {...props}
    >
      {children}
    </Component>
  );
};
""",

    "src/components/ui/Button.tsx": """import { motion } from 'framer-motion';
import { cn } from './GlassCard';

export const Button = ({ children, variant = 'primary', className, ...props }: any) => {
  const base = "inline-flex items-center justify-center px-6 py-3 rounded-[14px] font-medium transition-colors text-[15px] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/35";
  
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
    secondary: "glass text-ink-900 dark:text-white hover:bg-white/40 dark:hover:bg-black/40",
    ghost: "bg-transparent text-ink-700 dark:text-ink-300 hover:bg-ink-900/5 dark:hover:bg-white/10",
    destructive: "bg-danger text-white hover:bg-red-700"
  };

  return (
    <motion.button 
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(base, variants[variant as keyof typeof variants], className)} 
      {...props}
    >
      {children}
    </motion.button>
  );
};
""",

    "src/components/ui/Badge.tsx": """import { cn } from './GlassCard';

export const Badge = ({ children, color = 'info', className }: any) => {
  const colors: Record<string, string> = {
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    info: "bg-info/15 text-info",
    accent: "bg-accent/15 text-accent-hover dark:text-accent-soft",
  };
  
  return (
    <span className={cn(`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`, colors[color], className)}>
      {children}
    </span>
  );
};
"""
}

import os
os.makedirs('src/lib', exist_ok=True)
os.makedirs('src/components/ui', exist_ok=True)

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Step 1 & 2 base generated.")
