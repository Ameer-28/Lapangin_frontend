"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DollarSign, BookOpen, Users, MapPin, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import api from "@/lib/api";
import { formatPrice } from "@/lib/data";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminOverview() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [overviewRes, revenueRes, statusRes, bookingsRes] = await Promise.all([
          api.get("/admin/reports/overview"),
          api.get("/admin/reports/revenue"),
          api.get("/admin/reports/bookings-by-status"),
          api.get("/admin/bookings?limit=6")
        ]);

        const statusRaw = statusRes.data || {};
        const formattedStatus = Array.isArray(statusRaw)
          ? statusRaw
          : [
              { name: "Upcoming", value: statusRaw.upcoming || 0, color: "#3B82F6" },
              { name: "Completed", value: statusRaw.completed || 0, color: "#16A34A" },
              { name: "Cancelled", value: statusRaw.cancelled || 0, color: "#EF4444" },
            ];

        const bookingsList = Array.isArray(bookingsRes.data)
          ? bookingsRes.data
          : (bookingsRes.data?.items || bookingsRes.data?.data || []);

        setData({
          overview: overviewRes.data || {},
          revenue: Array.isArray(revenueRes.data) ? revenueRes.data : [],
          status: formattedStatus,
          recentBookings: bookingsList
        });
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!data) return <div>Failed to load data</div>;

  const totalRevenue = data.overview?.totalRevenue ?? 0;
  const totalBookings = data.overview?.totalBookings ?? 0;
  const activeUsers = data.overview?.totalUsers ?? data.overview?.activeUsers ?? 0;
  const activeVenues = data.overview?.totalVenues ?? data.overview?.activeVenues ?? 0;

  const stats = [
    { label: "Total Revenue",   value: formatPrice(totalRevenue),  sub: "Lifetime completed revenue", Icon: DollarSign,   color: "#16A34A", bg: "#F0FDF4", trend: "up" },
    { label: "Total Bookings",  value: totalBookings.toString(),    sub: "All time bookings",          Icon: BookOpen,     color: "#3B82F6", bg: "#EFF6FF", trend: "up" },
    { label: "Active Users",    value: activeUsers.toString(),      sub: "Total registered users",    Icon: Users,        color: "#8B5CF6", bg: "#F5F3FF", trend: "up" },
    { label: "Active Venues",   value: activeVenues.toString(),     sub: "Total active venues",        Icon: MapPin,       color: "#F59E0B", bg: "#FFFBEB", trend: "neutral" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-[#FFFFFF] rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                <s.Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5 font-medium">{s.label}</p>
            <p className="text-gray-400 text-xs mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">Revenue Trend</h2>
              <p className="text-gray-400 text-xs mt-0.5">Last 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.revenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v / 1000000}M`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`Rp ${(v/1000000).toFixed(1)}M`, "Revenue"]} contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Booking Status</h2>
          <p className="text-gray-400 text-xs mb-4">All time status breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.status} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {data.status.map((entry: any, i: number) => <Cell key={i} fill={entry.color || '#ccc'} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}`, ""]} contentStyle={{ borderRadius: "10px", fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {data.status.map((d: any) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color || '#ccc' }} />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <span className="font-bold text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Bookings Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-900">Monthly Bookings</h2>
            <p className="text-gray-400 text-xs mt-0.5">Total transactions per month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.revenue} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
            <Bar dataKey="bookings" fill="#16A34A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Bookings</h2>
          <button onClick={() => router.push("/admin/bookings")} className="text-[#16A34A] text-sm font-semibold hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Booking ID","Customer","Venue","Date","Amount","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentBookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">{b.bookingCode ? b.bookingCode : `BK-${b.id}`}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{b.user?.fullName || b.user?.name || "Customer"}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 max-w-[140px] truncate">{b.venue?.name || "Venue"}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{b.date ? new Date(b.date).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{formatPrice(b.total ?? b.totalPrice ?? 0)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
