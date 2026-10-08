import os

files = {
    "src/index.css": """@import "tailwindcss";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
@import "@fontsource/instrument-serif/400-italic.css";

@theme {
  --color-bg-base: var(--bg-base);
  --color-surface: var(--surface);
  --color-surface-glass: var(--surface-glass);
  
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-text-on-accent: var(--text-on-accent);
  
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-border: var(--border);
  
  --color-success: #5E8C61;
  --color-warning: #C9962B;
  --color-danger: #B5503F;
  --color-info: #5B7C8D;

  --font-sans: "Inter", -apple-system, sans-serif;
  --font-serif: "Instrument Serif", serif;
}

@layer base {
  :root, [data-theme="light"] {
    --bg-base: #FBF8F3;
    --surface: #FFFFFF;
    --surface-glass: rgba(255, 252, 247, 0.85); /* Opaque enough for AA contrast */
    
    --text-primary: #2A2420;
    --text-secondary: #4B4238;
    --text-muted: #7C7063;
    --text-on-accent: #FFFFFF;
    
    --accent: #C2683A;
    --accent-soft: #F6E1D1;
    --border: rgba(120, 100, 70, 0.14);
    
    --flare-1: #F7C9A0;
    --flare-2: #F4B8A0;
    --flare-3: #EFC4C0;
    --flare-4: #F3DDA5;
  }
  
  [data-theme="dark"] {
    --bg-base: #1B1713;
    --surface: #26211B;
    --surface-glass: rgba(44, 38, 31, 0.90);
    
    --text-primary: #F6EFE4;
    --text-secondary: #D9CDBD;
    --text-muted: #A99C8B;
    --text-on-accent: #FFFFFF;
    
    --accent: #E8955F; /* Lighter terracotta for dark mode */
    --accent-soft: #3A261B;
    --border: rgba(255, 255, 255, 0.1);
    
    --flare-1: #4A2B15;
    --flare-2: #4A2518;
    --flare-3: #4A1A18;
    --flare-4: #4A3A15;
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-sans);
    transition: background-color 0.3s, color 0.3s;
    -webkit-font-smoothing: antialiased;
  }
  
  h1, h2, h3, h4, h5, h6 {
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }
  
  p {
    color: var(--text-secondary);
  }
}

.mesh-background {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: -1;
  background-color: var(--bg-base);
  background-image: 
    radial-gradient(circle at 30% 100%, var(--flare-1) 0%, transparent 60%),
    radial-gradient(circle at 70% 100%, var(--flare-2) 0%, transparent 60%),
    radial-gradient(circle at 50% 80%, var(--flare-3) 0%, transparent 60%),
    radial-gradient(circle at 80% 50%, var(--flare-4) 0%, transparent 60%);
  filter: blur(100px);
  opacity: 0.8;
  animation: driftFlare 25s ease-in-out infinite alternate;
}

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

.glass {
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--border);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--bg-base) 0%, transparent 100%);
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}
""",

    "index.html": """<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CivicAI</title>
    <script>
      (function() {
        try {
          var localTheme = localStorage.getItem('theme');
          if (localTheme) {
            document.documentElement.setAttribute('data-theme', localTheme);
            if (localTheme === 'dark') document.documentElement.classList.add('dark');
          } else {
            document.documentElement.setAttribute('data-theme', 'light');
          }
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""",

    "src/theme/ThemeProvider.tsx": """import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
"""
}

import os
os.makedirs('src/theme', exist_ok=True)
for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Theme foundation updated.")
