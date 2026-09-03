"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Check,
  Shield,
  User as UserIcon,
  LogOut,
  BookMarked,
} from "lucide-react";

import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync user from localStorage and API
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (_) {}
    } else {
      setUser(null);
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
        .catch(() => {});

      // Fetch unread count
      api.get("/notifications/unread-count")
        .then((res) => {
          setUnreadCount(res.data?.unreadCount || 0);
        })
        .catch(() => {});
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [pathname]);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get("/notifications?limit=6"),
        api.get("/notifications/unread-count"),
      ]);
      const items = notifRes.data?.items || notifRes.data?.data || (Array.isArray(notifRes.data) ? notifRes.data : []);
      setNotifications(items);
      setUnreadCount(countRes.data?.unreadCount || 0);
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setUnreadCount(0);
    router.push("/login");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "baru saja";
    if (mins < 60) return `${mins}m lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}j lalu`;
    return `${Math.floor(hrs / 24)}h lalu`;
  };

  // Nav links
  const navigationLinks = [
    { href: "/", label: "Beranda" },
    {
      label: "Cari Lapangan",
      submenu: true,
      type: "description" as const,
      items: [
        {
          href: "/venues",
          label: "Semua Lapangan",
          description: "Jelajahi seluruh arena futsal dengan ketersediaan slot real-time.",
        },
        {
          href: "/venues?type=Indoor",
          label: "Lapangan Indoor",
          description: "Nyaman bermain tanpa khawatir panas terik atau hujan.",
        },
        {
          href: "/venues?type=Outdoor",
          label: "Lapangan Outdoor",
          description: "Sensasi bermain futsal di ruang terbuka dengan sirkulasi maksimal.",
        },
      ],
    },
    ...(user ? [{ href: "/history", label: "Riwayat Booking" }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile trigger & Brand & Desktop Nav */}
        <div className="flex items-center gap-4 lg:gap-8">
          
          {/* Mobile Popover Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-9 md:hidden text-white hover:bg-white/10 p-0"
                variant="ghost"
                size="icon"
              >
                <svg
                  className="pointer-events-none"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3 bg-[#0F172A] border border-white/10 text-white md:hidden">
              <div className="flex flex-col space-y-2">
                <Link href="/" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/10">
                  Beranda
                </Link>
                <Link href="/venues" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/10">
                  Cari Lapangan
                </Link>
                {user && (
                  <Link href="/history" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/10">
                    Riwayat Booking
                  </Link>
                )}
                {user && (
                  <Link href="/profile" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/10">
                    Profil Saya
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link href="/admin" className="px-3 py-2 text-sm font-semibold text-yellow-400 rounded-lg hover:bg-white/10 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Link>
                )}

                <div className="border-t border-white/10 my-2 pt-2">
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-white/10 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link href="/login" className="w-full text-center py-2 text-sm font-medium border border-white/20 rounded-lg hover:bg-white/10">
                        Sign In
                      </Link>
                      <Link href="/register" className="w-full text-center py-2 text-sm font-semibold bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D]">
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-md shadow-green-900/30">
              <span className="text-white font-bold text-base">F</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Lapang.in</span>
          </Link>

          {/* Desktop NavigationMenu */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {navigationLinks.map((link, index) => (
                  <NavigationMenuItem key={index}>
                    {link.submenu ? (
                      <>
                        <NavigationMenuTrigger className="text-gray-300 hover:text-white bg-transparent hover:bg-white/10 data-[state=open]:bg-white/10 px-3 py-2 text-sm font-medium rounded-lg transition-colors">
                          {link.label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className={cn(
                            "grid w-[380px] gap-2 p-3 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl text-white",
                            link.type === "description" && "w-[440px]"
                          )}>
                            {link.items.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={item.href}
                                    className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-white/10 focus:bg-white/10"
                                  >
                                    <div className="font-medium text-sm text-white">
                                      {item.label}
                                    </div>
                                    {"description" in item && (
                                      <p className="line-clamp-2 text-xs leading-snug text-gray-400 mt-1">
                                        {(item as any).description}
                                      </p>
                                    )}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          href={link.href || "/"}
                          className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center"
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
              <NavigationMenuViewport />
            </NavigationMenu>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>

              {/* Notification Menu */}
              <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications(); }}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 relative text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4.5 min-w-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold bg-red-500 text-white border-2 border-[#0F172A]"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 sm:w-88 bg-[#0F172A] border border-white/10 text-white shadow-2xl p-0">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifikasi</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-[#4ADE80] hover:underline flex items-center gap-1 font-medium"
                      >
                        <Check className="w-3 h-3" /> Tandai semua
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">
                        Belum ada notifikasi
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) markOneRead(n.id);
                            router.push("/history");
                          }}
                          className={cn(
                            "p-3 text-xs flex items-start gap-2.5 cursor-pointer transition-colors",
                            n.isRead ? "hover:bg-white/5 text-gray-300" : "bg-[#16A34A]/10 hover:bg-[#16A34A]/20 text-white"
                          )}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1 shrink-0",
                            n.type === "booking" ? "bg-blue-400" : n.type === "review" ? "bg-yellow-400" : "bg-[#4ADE80]"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{n.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#4ADE80] mt-1 shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-white/10 text-center">
                    <Link href="/history" className="text-xs text-[#4ADE80] hover:underline font-medium">
                      Lihat Semua Pemesanan →
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 rounded-full p-0 overflow-hidden ring-2 ring-white/10 hover:ring-[#16A34A] transition-all">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#16A34A] to-[#22C55E] flex items-center justify-center text-white text-xs font-bold">
                        {user.fullName?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || "U"}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 bg-[#0F172A] border border-white/10 text-white shadow-2xl">
                  <DropdownMenuLabel className="font-normal p-3 border-b border-white/10">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-white leading-none truncate">
                        {user.fullName || user.email?.split('@')[0] || "User"}
                      </p>
                      <p className="text-xs text-gray-400 leading-none truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer py-2.5">
                    <Link href="/profile" className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span>Profil Saya</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer py-2.5">
                    <Link href="/history" className="flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-gray-400" />
                      <span>Riwayat Pemesanan</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer py-2.5 text-yellow-400">
                      <Link href="/admin" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-semibold">Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-500/10 text-red-400 cursor-pointer py-2.5">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10 text-sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm px-4 shadow-sm shadow-green-900/30">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
