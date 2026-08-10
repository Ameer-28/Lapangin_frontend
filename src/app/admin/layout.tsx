"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Building2, BookOpen, Users, BarChart2, Sliders, LogOut, Globe, Menu, Search, Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get("/notifications?limit=10"),
        api.get("/notifications/unread-count"),
      ]);
      const notifData = notifRes.data;
      setNotifications(notifData?.items || notifData?.data || (Array.isArray(notifData) ? notifData : []));
      setUnreadCount(countRes.data?.unreadCount || 0);
    } catch (e) {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    api.get("/users/me")
      .then(res => {
        if (res.data.role !== "admin") {
          router.push("/admin/login");
        } else {
          setAdminUser(res.data);
          setLoading(false);
          fetchNotifications();
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [pathname, router, fetchNotifications]);

  // Refresh notifications every 30 seconds
  useEffect(() => {
    if (!adminUser) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [adminUser, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      markOneRead(n.id);
    }
    setNotifOpen(false);
    if (n.type === "booking" || n.type === "payment") {
      router.push("/admin/bookings");
    } else if (n.type === "review") {
      router.push("/admin/venues");
    } else {
      router.push("/admin");
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const dotColor = (type: string) => {
    switch (type) {
      case "booking": return "bg-blue-500";
      case "payment": return "bg-green-500";
      case "review": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  const navItems = [
    { id: "/admin", label: "Overview", Icon: LayoutDashboard },
    { id: "/admin/venues", label: "Venues", Icon: Building2 },
    { id: "/admin/bookings", label: "Bookings", Icon: BookOpen },
    { id: "/admin/users", label: "Users", Icon: Users },
    { id: "/admin/reports", label: "Reports", Icon: BarChart2 },
    { id: "/admin/settings", label: "Settings", Icon: Sliders },
  ];

  const pageTitles: Record<string, string> = {
    "/admin": "Overview",
    "/admin/venues": "Venue Management",
    "/admin/bookings": "Booking Management",
    "/admin/users": "User Management",
    "/admin/reports": "Reports & Analytics",
    "/admin/settings": "System Settings",
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#16A34A] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base">L</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Lapang.in</p>
            <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map(({ id, label, Icon }) => (
          <Link key={id} href={id} onClick={() => setSidebarOpen(false)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              pathname === id
                ? "bg-[#16A34A] text-white shadow-lg shadow-green-900/30"
                : "text-gray-400 hover:text-white hover:bg-white/8"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Admin user */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm shrink-0">
            {(adminUser?.fullName || adminUser?.name || "SA").substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{adminUser?.fullName || adminUser?.name || "Super Admin"}</p>
            <p className="text-gray-400 text-xs truncate">{adminUser?.email || "admin@lapang.in"}</p>
          </div>
        </div>
        <Link href="/"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Globe className="w-4 h-4" /> View Site
        </Link>
        <button onClick={() => { localStorage.removeItem("token"); router.push("/admin/login"); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </>
  );

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex" style={{ fontFamily: "'Poppins','Inter',sans-serif" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0F172A] fixed left-0 top-0 bottom-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-[#0F172A] h-full">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 p-1">
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-gray-900 font-bold text-base">{pageTitles[pathname] ?? "Admin"}</h1>
                <p className="text-gray-400 text-xs">Lapang.in Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input placeholder="Quick search…" className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all w-48" />
              </div>
              <div className="relative">
                <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }} className="relative p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                  <Bell className="w-4.5 h-4.5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-[#16A34A] font-semibold hover:underline flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors",
                              n.isRead ? "bg-white hover:bg-gray-50" : "bg-green-50/50 hover:bg-green-50"
                            )}
                          >
                            <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", dotColor(n.type))} />
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-xs leading-snug", n.isRead ? "text-gray-600" : "text-gray-900 font-semibold")}>{n.title}</p>
                              <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-gray-400 text-[10px] mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#16A34A] mt-1.5 shrink-0" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-xs">
                {(adminUser?.fullName || adminUser?.name || "SA").substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
