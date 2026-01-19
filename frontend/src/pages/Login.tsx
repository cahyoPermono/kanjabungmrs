import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      
      // Redirect based on role
      if (res.data.user.role === 'ADMIN') navigate('/admin');
      else if (res.data.user.role === 'MANAGER') navigate('/manager');
      else if (res.data.user.role === 'EMPLOYEE') navigate('/employee');
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative items-center justify-center border-r p-12">
        <div className="max-w-xl text-center space-y-8">
            <img src="/logo.png" alt="KAN Jabung Logo" className="w-[80%] max-w-[400px] mx-auto object-contain" />

            <div className="pt-8 grid grid-cols-3 gap-8 opacity-70">
                <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">40+</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Tahun Mengabdi</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">3K+</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Anggota</div>
                </div>
                 <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">100%</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Syariah</div>
                </div>
            </div>
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-blue-50/30">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-sm text-muted-foreground">Sign in to your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="name@kanjabung.co.id" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            className="h-11 bg-gray-50/50"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot password?</a>
                        </div>
                        <Input 
                            id="password" 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            className="h-11 bg-gray-50/50"
                        />
                    </div>

                    <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                    &copy; {new Date().getFullYear()} KAN Jabung Syariah. All rights reserved.
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
