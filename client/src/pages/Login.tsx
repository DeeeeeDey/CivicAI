import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/axios';
import { Leaf } from 'lucide-react';

export const Login = () => {
  const loginFn = useAuthStore(s => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      loginFn(data.user, data.accessToken);
      const target = from !== '/' ? from : `/${data.user.role.toLowerCase()}/dashboard`;
      navigate(target, { replace: true });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Login failed');
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleDemoLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    loginMutation.mutate({ email: roleEmail, password: 'password123' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-bg-base relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Leaf className="text-accent w-10 h-10 mx-auto mb-4" />
            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h2>
            <p className="text-ink-500">Sign in to your CivicAI portal.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            {errorMsg && <div className="text-danger text-sm font-medium bg-danger/10 p-3 rounded-xl">{errorMsg}</div>}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1 ml-1">Email Address</label>
              <Input 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1 ml-1">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
              />
            </div>
            <Button className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="border-t border-ink-900/10 pt-6">
            <p className="text-[11px] text-center text-ink-500 uppercase font-bold tracking-wider mb-4">Try a Demo Account</p>
            <div className="grid grid-cols-2 gap-3">
               <Button variant="secondary" className="text-xs" onClick={() => handleDemoLogin('citizen@civicai.com')}>Citizen</Button>
               <Button variant="secondary" className="text-xs" onClick={() => handleDemoLogin('officer@civicai.com')}>Officer</Button>
               <Button variant="secondary" className="text-xs" onClick={() => handleDemoLogin('worker@civicai.com')}>Worker</Button>
               <Button variant="secondary" className="text-xs" onClick={() => handleDemoLogin('admin@civicai.com')}>Admin</Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Editorial Panel */}
      <div className="hidden md:flex w-1/2 relative bg-bg-sand overflow-hidden flex-col justify-between p-12">
        <div className="mesh-background absolute inset-0 opacity-50 mix-blend-overlay"></div>
        <div className="relative z-10">
          <Badge className="bg-white/50 text-ink-900 border-white mb-6">Transparency</Badge>
          <h2 className="text-4xl font-serif text-ink-900 leading-tight max-w-md">"CivicAI has reduced our response time by over 40% in just three months."</h2>
        </div>
        <div className="relative z-10 mt-12">
           <img src="https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&q=80&w=800" alt="City worker" className="rounded-2xl shadow-2xl object-cover h-[300px] w-full mix-blend-luminosity opacity-80" />
        </div>
      </div>
    </div>
  );
};
