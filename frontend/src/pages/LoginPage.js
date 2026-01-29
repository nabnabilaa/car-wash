import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuthToken, setCurrentUser } from '../utils/auth';
import { Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password,
      });

      const { token, user } = response.data;
      setAuthToken(token);
      setCurrentUser(user);

      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Left Side - Branding / Hero */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#121214] items-center justify-center p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/10 blur-[100px] rounded-full opacity-40 translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F59E0B]/5 blur-[100px] rounded-full opacity-30 -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#D4AF37]/20 rotate-3 hover:rotate-6 transition-transform duration-500">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 font-secondary">Welcome to <span className="text-[#D4AF37]">OTOPIA</span></h1>
          <p className="text-xl text-zinc-400 leading-relaxed mb-8">
            Premium POS & Management System for modern auto detailing businesses.
          </p>


        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-4 right-4">
          <button onClick={() => navigate('/')} className="text-sm text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
            Back to Home <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full max-w-md animate-in slide-in-from-right-8 duration-700 fade-in">
          <div className="text-center lg:text-left mb-10">
            <div className="lg:hidden w-16 h-16 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/20">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-zinc-500">Masuk untuk mengakses dashboard staff.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Username</label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Password</label>
                <a href="#" className="text-xs text-[#D4AF37] hover:underline">Forgot password?</a>
              </div>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black font-bold h-12 rounded-lg hover:bg-[#b5952f] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>



          <div className="mt-8 text-center">
            <p className="text-zinc-600 text-xs">
              &copy; 2025 OTOPIA by PPM Autoworks. <br />All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};