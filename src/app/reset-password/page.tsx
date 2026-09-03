"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { GreenButton } from "@/components/ui/GreenButton";
import api from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Token reset tidak ditemukan. Silakan minta tautan baru.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password minimal harus 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengatur ulang kata sandi. Token mungkin sudah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold">Token Tidak Ditemukan</h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Tautan reset password yang Anda buka tidak memiliki token valid. Silakan lakukan permintaan reset kembali.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block px-5 py-2.5 bg-[#16A34A] text-white text-xs font-bold rounded-xl hover:bg-[#15803d] transition-colors"
        >
          Minta Tautan Reset Baru
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3.5 rounded-xl mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 text-[#4ADE80] flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#4ADE80]">Password Berhasil Diubah!</h2>
          <p className="text-xs text-gray-300">
            Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk menggunakan password baru.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold rounded-xl text-center text-sm shadow-lg shadow-green-600/30 transition-colors"
          >
            Masuk Sekarang
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase mb-1.5">
              Konfirmasi Password Baru
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
              className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] transition-all"
            />
          </div>

          <GreenButton
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 text-sm font-bold shadow-lg shadow-green-600/30"
          >
            {loading ? "Menyimpan Password..." : "Simpan Password Baru"}
          </GreenButton>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Batal & Kembali ke Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#071810] flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-10 text-white"
      >
        <div className="text-center mb-6">
          <Link href="/">
            <div className="w-12 h-12 bg-[#16A34A] rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform shadow-lg shadow-green-600/30">
              <span className="text-white font-bold text-xl">F</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Atur Ulang Kata Sandi</h1>
          <p className="text-gray-400 text-sm">
            Buat kata sandi baru yang kuat untuk akun Lapang.in Anda.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-6 text-xs text-gray-400">Memuat...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
