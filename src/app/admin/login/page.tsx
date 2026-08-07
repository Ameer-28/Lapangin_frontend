"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, EyeOff, Eye, Shield } from "lucide-react";
import api from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lapang.in");
  const [password, setPassword] = useState("admin123");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await api.post("/auth/login", { email, password });
      
      // Store token (admin/user uses same endpoint usually, but we check role in layout)
      localStorage.setItem("token", res.data.access_token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#16A34A] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <span className="text-white font-bold text-2xl">Lapang.in</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <Shield className="w-3.5 h-3.5" /> Admin Portal
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in to Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-500 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-500 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#16A34A] hover:bg-[#15803d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Signing in..." : <><Shield className="w-4.5 h-4.5" /> Sign In as Admin</>}
          </button>

          <button type="button" onClick={() => router.push("/")} className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors py-2">
            ← Back to main site
          </button>
        </form>
      </motion.div>
    </div>
  );
}
