import os

files = {
    "src/index.css": """@import "tailwindcss";

@theme {
  --color-glass-light: rgba(255, 255, 255, 0.65);
  --color-glass-dark: rgba(30, 30, 30, 0.55);
  --color-apple-blue: #0A84FF;
  --color-apple-green: #30D158;
  --color-apple-orange: #FF9F0A;
  --color-apple-red: #FF453F;
  
  --font-sans: 'SF Pro Display', 'Inter', -apple-system, sans-serif;
}

@layer base {
  :root {
    --bg-color: #f2f2f7;
    --text-color: #1c1c1e;
    --mesh-color-1: #c9e2ff;
    --mesh-color-2: #e0d1ff;
    --mesh-color-3: #ffd1e8;
  }
  
  .dark {
    --bg-color: #000000;
    --text-color: #f2f2f7;
    --mesh-color-1: #1a0033;
    --mesh-color-2: #001a33;
    --mesh-color-3: #33001a;
  }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: var(--font-sans);
    transition: background-color 0.3s, color 0.3s;
  }
}

.mesh-background {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: -1;
  background: radial-gradient(circle at 20% 30%, var(--mesh-color-1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, var(--mesh-color-2) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, var(--mesh-color-3) 0%, transparent 50%);
  filter: blur(80px);
  animation: pulseMesh 15s infinite alternate;
}

@keyframes pulseMesh {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.1) translate(20px, 20px); }
}

@media (prefers-reduced-motion: reduce) {
  .mesh-background {
    animation: none;
  }
}

.glass {
  background: var(--color-glass-light);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.04);
}

.dark .glass {
  background: var(--color-glass-dark);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
""",

    "src/main.tsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
""",

    "index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CivicAI Design System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""",

    "src/App.tsx": """import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { DesignSystem } from './pages/DesignSystem';

function App() {
  return (
    <ThemeProvider>
      <div className="mesh-background"></div>
      <Router>
        <Routes>
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="/" element={<div className="p-8 text-center h-screen flex flex-col justify-center items-center"><h1 className="text-4xl font-bold tracking-tight mb-4">CivicAI Frontend</h1><a href="/design-system" className="text-apple-blue font-medium text-lg hover:underline">Explore the Design System &rarr;</a></div>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
""",

    "src/theme/ThemeProvider.tsx": """import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  useEffect(() => {
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
""",

    "src/components/ui/GlassCard.tsx": """export const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`glass rounded-3xl p-8 ${className}`}>
      {children}
    </div>
  );
};
""",

    "src/components/ui/Button.tsx": """export const Button = ({ children, variant = 'primary', className='', ...props }: any) => {
  const base = "px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95 duration-200 text-sm";
  const variants = {
    primary: "bg-apple-blue text-white shadow-md hover:bg-blue-600",
    secondary: "bg-gray-200/60 dark:bg-gray-800/60 text-gray-900 dark:text-white hover:bg-gray-300/60 dark:hover:bg-gray-700/60 backdrop-blur-md",
    ghost: "bg-transparent text-apple-blue hover:bg-apple-blue/10"
  };
  return <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
};
""",

    "src/components/ui/Input.tsx": """export const Input = (props: any) => {
  return (
    <input 
      className="w-full px-4 py-3 rounded-xl bg-white/40 dark:bg-black/40 border border-gray-300/30 dark:border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-sm backdrop-blur-md placeholder-gray-500" 
      {...props} 
    />
  );
};
""",
    
    "src/components/ui/Badge.tsx": """export const Badge = ({ children, color='blue' }: any) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[color]}`}>{children}</span>
}
""",

    "src/pages/DesignSystem.tsx": """import { useTheme } from '../theme/ThemeProvider';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const DesignSystem = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Design System</h1>
           <p className="text-gray-500 dark:text-gray-400">Apple Frosted Glass Component Library</p>
        </div>
        <Button variant="secondary" onClick={toggleTheme}>Toggle Theme ({theme})</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <GlassCard>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Glass Surface</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm leading-relaxed">
            This card uses backdrop-filter blur, saturation enhancements, and subtle 
            inner borders to create an iOS-like frosted glass effect. It floats seamlessly
            over the animated mesh gradient background.
          </p>
          
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Status Badges</h3>
          <div className="flex flex-wrap gap-3">
             <Badge color="blue">Info</Badge>
             <Badge color="green">Resolved</Badge>
             <Badge color="orange">In Progress</Badge>
             <Badge color="red">Critical</Badge>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-bold mb-6 tracking-tight">Interactive Elements</h2>
          
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Buttons</h3>
          <div className="flex flex-wrap gap-4 mb-8">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Form Inputs</h3>
          <div className="space-y-4">
            <Input placeholder="Enter your email address..." />
            <Input type="password" placeholder="Password" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
""",
    "vite.config.ts": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
})
"""
}

import os
os.makedirs('src/theme', exist_ok=True)
os.makedirs('src/components/ui', exist_ok=True)
os.makedirs('src/pages', exist_ok=True)

for path, content in files.items():
    with open(path, 'w') as f:
        f.write(content)

print("Frontend scaffolding complete.")
