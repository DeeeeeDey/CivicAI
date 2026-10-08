import { useTheme } from '../theme/ThemeProvider';
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
