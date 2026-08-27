"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Home, Search, BookMarked, User, LogOut, Menu, X, Shield
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token && !userStr) {
      router.push("/login");
      return;
    }

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (_) {}
    }

    if (token) {
      api.get("/users/me")
        .then((res) => {
          const freshUser = res.data?.data || res.data;
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem("user", JSON.stringify(freshUser));
          }
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            router.push("/login");
          }
        });
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    { id: "/dashboard", label: "Dashboard", Icon: Home },
    { id: "/venues", label: "Browse Fields", Icon: Search },
    { id: "/history", label: "My Bookings", Icon: BookMarked },
    { id: "/profile", label: "Profile", Icon: User },
  ];

  // Helper to match active path
  const isActive = (id: string) => pathname.startsWith(id);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn(
      "flex flex-col bg-[#0F172A]",
      mobile ? "w-72 min-h-screen relative" : "w-64 min-h-screen fixed left-0 top-0"
    )}>
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#16A34A] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-base">F</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Lapang.in</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ id, label, Icon }) => (
          <Link
            key={id}
            href={id}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              isActive(id) ? "bg-[#16A34A] text-white shadow-lg shadow-green-900/30"
                           : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 mb-1">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10" />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.fullName?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">{user.fullName || user.email?.split('@')[0] || 'User'}</p>
              <p className="text-gray-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );

  if (!user) return null; // Avoid hydration flash

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex">
            <Sidebar mobile />
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 lg:ml-64 min-w-0">
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 p-1"><Menu className="w-5 h-5" /></button>
          <span className="text-gray-900 font-bold tracking-tight">Lapang.in</span>
          <Link href="/profile" className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 object-cover rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.fullName?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
          </Link>
        </div>
        
        <div className="p-5 sm:p-8">{children}</div>

        {/* Admin Access Subtly placed */}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#0F172A] text-yellow-400 text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg hover:bg-[#1E293B] transition-colors border border-white/10"
          >
            <Shield className="w-3.5 h-3.5" /> Admin Panel
          </Link>
        )}
      </div>
    </div>
  );
}
