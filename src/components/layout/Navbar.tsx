"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { GreenButton } from "../ui/GreenButton";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check auth status
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Lapang.in</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Browse Fields", href: "/venues" },
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Pricing", href: "/#pricing" }
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="text-gray-300 hover:text-white text-sm transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                Login
              </Link>
              <Link href="/register">
                <GreenButton className="px-5 py-2 text-sm">Register</GreenButton>
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white p-1">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#0F172A] border-t border-white/10 px-4 py-4 space-y-2">
          <Link href="/venues" onClick={() => setOpen(false)} className="block w-full text-left text-gray-300 text-sm py-2.5 border-b border-white/5">
            Browse Fields
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block w-full text-left text-gray-300 text-sm py-2.5 border-b border-white/5">
                Dashboard
              </Link>
              <button onClick={() => { handleLogout(); setOpen(false); }} className="block w-full text-left text-gray-300 text-sm py-2.5">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="block w-full text-left text-gray-300 text-sm py-2.5 border-b border-white/5">
                Login
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="mt-2 block w-full bg-[#16A34A] text-center text-white text-sm py-2.5 rounded-xl font-medium">
                Register Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
