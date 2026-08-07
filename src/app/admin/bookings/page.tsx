"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, XCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import api from "@/lib/api";

export default function AdminBookings() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        api.get("/admin/bookings"),
        api.get("/admin/bookings/stats")
      ]);
      const rawBookings = bookingsRes.data;
      setBookings(Array.isArray(rawBookings) ? rawBookings : (rawBookings?.items || rawBookings?.data || []));
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (confirm("Cancel this booking?")) {
      try {
        await api.patch(`/admin/bookings/${id}/cancel`);
        setBookings(bs => bs.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
      } catch (error) {
        console.error("Failed to cancel", error);
      }
    }
  };

  const filtered = bookings.filter(b => {
    const matchF = filter === "all" || b.status === filter;
    const userName = b.user?.fullName || b.user?.name || "";
    const venueName = b.venue?.name || "";
    const bookingCode = b.bookingCode || b.id?.toString() || "";
    const matchS = userName.toLowerCase().includes(search.toLowerCase()) ||
                   bookingCode.toLowerCase().includes(search.toLowerCase()) ||
                   venueName.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const counts = {
    all: bookings.length,
    upcoming:  bookings.filter(b => b.status === "upcoming" || b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all","upcoming","completed","cancelled"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === t ? "bg-[#16A34A] text-white shadow" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings…"
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Booking ID","Customer","Venue","Date & Time","Amount","Status","Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => {
                const uName = b.user?.fullName || b.user?.name || "Customer";
                return (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-gray-700">{b.bookingCode ? b.bookingCode : `BK-${b.id}`}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {uName.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-800 whitespace-nowrap">{uName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-[130px] truncate">{b.venue?.name || "Venue"}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div>{b.date ? new Date(b.date).toLocaleDateString() : "-"}</div>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{formatPrice(b.total ?? b.totalPrice ?? 0)}</td>
                    <td className="px-4 py-4"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(b.status === "upcoming" || b.status === "confirmed") && (
                          <button onClick={() => handleCancel(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {bookings.length} bookings</p>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center"><ChevronLeft className="w-3.5 h-3.5 text-gray-400" /></button>
            <button className="w-7 h-7 rounded-lg bg-[#16A34A] text-white text-xs font-bold">1</button>
            <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center"><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
