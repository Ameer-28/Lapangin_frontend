"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { GreenButton } from "@/components/ui/GreenButton";
import api from "@/lib/api";

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } catch (e) {}
    }
  }, [router]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.post('/auth/login', { email, password: pw });
      localStorage.setItem('token', res.data.access_token);
      
      // Get user profile
      const profileRes = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${res.data.access_token}` }
      });
      const userData = profileRes.data;
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (userData?.role === 'admin') {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://lapangin-backend.vercel.app';
    const baseUrl = rawUrl.replace(/\/api\/?$/, '');
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#071810] flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-10"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-12 h-12 bg-[#16A34A] rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">F</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm">Sign in to your Lapang.in account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors mb-6 text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" /><span className="text-gray-500 text-xs">or</span><div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@email.com"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input value={pw} onChange={e => setPw(e.target.value)} type={showPw ? "text" : "password"} placeholder="••••••••"
                className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all pr-12"
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button className="text-[#4ADE80] text-xs hover:text-[#22C55E] transition-colors">Forgot password?</button>
            </div>
          </div>
        </div>

        <GreenButton onClick={handleLogin} className="w-full py-3.5 mt-6 text-base" type="submit">
          {loading ? "Signing in..." : "Sign In"}
        </GreenButton>

        <p className="text-center text-gray-400 text-sm mt-6">
          {"Don't have an account? "}
          <Link href="/register" className="text-[#4ADE80] font-semibold hover:text-[#22C55E] transition-colors">Register free</Link>
        </p>
      </motion.div>
    </div>
  );
}
