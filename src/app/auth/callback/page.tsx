"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const processAuth = async () => {
      try {
        localStorage.setItem("token", token);

        // Fallback user from JWT in case /auth/profile takes time
        try {
          const base64Url = token.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            if (decoded?.sub) {
              localStorage.setItem(
                "user",
                JSON.stringify({
                  id: decoded.sub,
                  email: decoded.email,
                  role: decoded.role || "user",
                })
              );
            }
          }
        } catch (_) {}

        // Fetch full profile from backend
        const profileRes = await api.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = profileRes.data;
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
        }

        if (userData?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      } catch (err) {
        console.error("Profile fetch error, checking saved user:", err);
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed.role === "admin") {
              window.location.href = "/admin";
            } else {
              window.location.href = "/";
            }
            return;
          } catch (_) {}
        }
        router.push("/login");
      }
    };

    processAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#071810] flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold">Completing Google Login...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#071810] flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
