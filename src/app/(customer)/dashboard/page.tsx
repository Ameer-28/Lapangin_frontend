"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, BookMarked, Heart, User, Calendar, MapPin } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/data";
import { GreenButton } from "@/components/ui/GreenButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes, bookingsRes, favRes] = await Promise.all([
          api.get("/users/me"),
          api.get("/users/me/stats"),
          api.get("/bookings?status=upcoming"),
          api.get("/favorites"),
        ]);
        
        setProfile(profileRes.data.data);
        setStats(statsRes.data.data);
        setUpcoming(bookingsRes.data.data || []);
        setFavorites(favRes.data.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500">Loading dashboard...</div>;
  }

  const statCards = [
    { label: "Total Bookings", value: stats?.totalBookings || "0", sub: "All time", color: "#16A34A", bg: "#F0FDF4" },
    { label: "Hours Played", value: `${stats?.hoursPlayed || 0}h`, sub: "All time", color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Favorite Venue", value: (favorites?.length || 0).toString(), sub: "Saved venues", color: "#FACC15", bg: "#FEFCE8" },
    { label: "Avg. Rating", value: (stats?.avgRating || "0.0").toString(), sub: "Given to venues", color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  const quickActions = [
    { label: "Book a Field", Icon: Search, href: "/browse", bg: "bg-[#16A34A]", fg: "text-white" },
    { label: "My Bookings", Icon: BookMarked, href: "/history", bg: "bg-white", fg: "text-gray-800" },
    { label: "Saved Venues", Icon: Heart, href: "/browse?favorites=true", bg: "bg-white", fg: "text-gray-800" }, // Alternatively to favorites page if it exists
    { label: "Profile", Icon: User, href: "/profile", bg: "bg-white", fg: "text-gray-800" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Good morning, {profile?.name?.split(' ')[0] || 'Player'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Ready to play? Here's your overview.</p>
        </div>
        <button className="relative p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#16A34A] rounded-full" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-gray-800 text-sm font-medium">{s.label}</div>
            <div className="text-gray-400 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map(({ label, Icon, href, bg, fg }) => (
            <Link key={label} href={href}
              className={cn("rounded-2xl p-5 flex flex-col items-start gap-3 border border-gray-100 shadow-sm hover:shadow-md transition-all", bg, fg)}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Upcoming Bookings</h2>
          <Link href="/history" className="text-[#16A34A] text-sm font-semibold hover:underline">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No upcoming bookings</p>
            <GreenButton onClick={() => router.push("/browse")} className="mt-4 px-6 py-2.5 text-sm mx-auto">Book a Field</GreenButton>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                <div className="w-20 h-16 rounded-xl bg-green-100 overflow-hidden shrink-0">
                  <img src={b.venue?.image} alt={b.venue?.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{b.venue?.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{b.date}</p>
                  <p className="text-gray-500 text-xs">{b.startTime} - {b.endTime}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={b.status} />
                  <p className="text-[#16A34A] font-bold text-sm mt-1.5">{formatPrice(b.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favourite Venues */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Favourite Venues</h2>
          <Link href="/browse" className="text-[#16A34A] text-sm font-semibold hover:underline">Browse more</Link>
        </div>
        
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No saved venues yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {favorites.slice(0, 3).map(f => (
              <div key={f.venueId} onClick={() => router.push(`/venues/${f.venueId}`)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
                <div className="h-32 bg-green-100 overflow-hidden">
                  <img src={f.venue?.image} alt={f.venue?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-900 text-sm">{f.venue?.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 text-gray-400 text-xs"><MapPin className="w-3 h-3" />{f.venue?.city}</div>
                    <span className="text-[#16A34A] font-bold text-xs">{formatPrice(f.venue?.pricePerHour)}/hr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
