"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, Calendar, Clock, Download, RefreshCw, X } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default function HistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings");
      const raw = res.data;
      setBookings(Array.isArray(raw) ? raw : (raw?.items || raw?.data || []));
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const filtered = tab === "all" ? bookings : bookings.filter(b => b.status === tab);

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-gray-500">Loading bookings...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Bookings</h1>
      <p className="text-gray-500 text-sm mb-6">{bookings.length} total bookings</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {(["all","upcoming","completed","cancelled"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
              tab === t ? "bg-[#16A34A] text-[#ffffff] shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {" "}
            <span className="ml-1 opacity-70">({(tab === "all" ? bookings : bookings.filter(b => b.status === t)).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bookings found</p>
          </div>
        ) : filtered.map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row gap-4 p-5">
              <div className="w-full sm:w-32 h-24 rounded-xl bg-green-100 overflow-hidden shrink-0">
                <img src={b.venue?.imageUrl || b.venue?.image || "https://images.unsplash.com/photo-1574629810360-7efbb192563a?auto=format&fit=crop&q=80"} alt={b.venue?.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-gray-900">{b.venue?.name || "Futsal Venue"}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{b.bookingCode || `#${String(b.id).substring(0, 8)}`}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#16A34A]" />{b.date ? new Date(b.date).toLocaleDateString() : '-'}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#16A34A]" />{b.startTime}</span>
                </div>
                <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                  <span className="font-bold text-[#16A34A] text-lg">{formatPrice(b.total ?? b.totalPrice ?? 0)}</span>
                  <div className="flex gap-2">
                    {b.status === "completed" && (
                      <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-gray-300 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Receipt
                      </button>
                    )}
                    {(b.status === "completed" || b.status === "cancelled") && (
                      <Link href={`/venues/${b.venueId}`} className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] text-white rounded-xl text-xs font-semibold hover:bg-[#15803d] transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Rebook
                      </Link>
                    )}
                    {b.status === "upcoming" && (
                      <button onClick={() => handleCancel(b.id)} className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
