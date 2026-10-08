import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/axios';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export const Register = () => {
  const loginFn = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Register the user
      await api.post('/auth/register', data);
      // 2. Immediately log them in
      const res = await api.post('/auth/login', { email: data.email, password: data.password });
      return res.data;
    },
    onSuccess: (data) => {
      loginFn(data.user, data.accessToken);
      navigate('/citizen/dashboard', { replace: true });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Failed to register account');
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setErrorMsg('');
    if (!name || !email || !password) {
       setErrorMsg('Please enter your name, email, and password.');
       return;
    }
    registerMutation.mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-bg-base relative z-10">
        <div className="w-full max-w-md mt-16 md:mt-0">
          <div className="mb-10 text-center">
            <Leaf className="text-accent w-10 h-10 mx-auto mb-4" />
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-ink-900">Create an Account</h2>
            <p className="text-ink-500">Join CivicAI to report and track issues.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            {errorMsg && <div className="text-danger text-sm font-medium bg-danger/10 p-3 rounded-xl">{errorMsg}</div>}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1 ml-1">Full Name</label>
              <Input 
                placeholder="John Doe" 
                value={name} 
                onChange={(e: any) => setName(e.target.value)} 
                className="bg-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1 ml-1">Email Address</label>
              <Input 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
                className="bg-surface"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-ink-700 mb-1 ml-1">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Minimum 6 characters" 
                  value={password} 
                  onChange={(e: any) => setPassword(e.target.value)} 
                  className="bg-surface pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500">
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg mt-4 shadow-sm" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          <div className="border-t border-border pt-6">
            <p className="text-center text-sm text-ink-500 mt-2">
               Already have an account? <button onClick={() => navigate('/login')} className="font-semibold text-accent hover:underline">Log in here</button>
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Editorial Panel */}
      <div className="hidden md:flex w-1/2 relative bg-surface-glass overflow-hidden flex-col justify-between p-12 border-l border-border">
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-white/50 border border-white text-ink-900 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">Community</div>
          <h2 className="text-4xl font-serif text-ink-900 leading-tight max-w-md">"CivicAI empowered me to finally get the dangerous pothole on my street fixed in under 48 hours."</h2>
        </div>
        <div className="relative z-10 mt-12 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
           <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" alt="Citizen using phone" className="object-cover h-[350px] w-full" />
        </div>
      </div>
    </div>
  );
};
