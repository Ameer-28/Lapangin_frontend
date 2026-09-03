"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { GreenButton } from "@/components/ui/GreenButton";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setSubmitted(true);
      if (res.data?.resetToken) {
        setDevResetToken(res.data.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengirim permintaan reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#071810] flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-10 text-white"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-12 h-12 bg-[#16A34A] rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform shadow-lg shadow-green-600/30">
              <span className="text-white font-bold text-xl">F</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Lupa Password?</h1>
          <p className="text-gray-400 text-sm">
            Masukkan email Anda untuk menerima instruksi pemulihan kata sandi.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3.5 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-5">
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#4ADE80] mx-auto mb-2" />
              <h3 className="font-bold text-[#4ADE80] text-base">Permintaan Terkirim!</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Jika email <strong>{email}</strong> terdaftar di sistem kami, instruksi pemulihan telah dikirimkan. Silakan periksa inbox atau folder spam Anda.
              </p>
            </div>

            {devResetToken && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-2">
                <p className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" /> Mode Uji Coba (Dev Token):
                </p>
                <p className="text-gray-400 text-[11px] font-mono break-all">{devResetToken}</p>
                <Link
                  href={`/reset-password?token=${devResetToken}`}
                  className="inline-block w-full py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-lg text-center transition-colors text-xs"
                >
                  Buka Halaman Reset Sekarang →
                </Link>
              </div>
            )}

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all"
                />
              </div>
            </div>

            <GreenButton
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 text-sm font-bold shadow-lg shadow-green-600/30"
            >
              {loading ? "Mengirim Permintaan..." : "Kirim Tautan Reset Password"}
            </GreenButton>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
