"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, XCircle, Download, X, Plus, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

import { PopupModal, PopupType } from "@/components/ui/PopupModal";
import { ReceiptModal } from "@/components/ui/ReceiptModal";

export default function AdminBookings() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [receiptBooking, setReceiptBooking] = useState<any>(null);

  // Reschedule states
  const [rescheduleBooking, setRescheduleBooking] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("19:00");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleCourts, setRescheduleCourts] = useState<any[]>([]);
  const [rescheduleCourtId, setRescheduleCourtId] = useState("");

  // Offline booking modal states
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [venuesList, setVenuesList] = useState<any[]>([]);
  const [offlineVenueId, setOfflineVenueId] = useState("");
  const [offlineCourts, setOfflineCourts] = useState<any[]>([]);
  const [offlineCourtId, setOfflineCourtId] = useState("");
  const [offlineDate, setOfflineDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [offlineStartTime, setOfflineStartTime] = useState("19:00");
  const [offlineDuration, setOfflineDuration] = useState(1);
  const [offlineBookingSource, setOfflineBookingSource] = useState("walk_in");
  const [offlineCustomerName, setOfflineCustomerName] = useState("");
  const [offlineCustomerPhone, setOfflineCustomerPhone] = useState("");
  const [offlinePaymentMethod, setOfflinePaymentMethod] = useState("cash");
  const [offlinePaymentStatus, setOfflinePaymentStatus] = useState("paid");
  const [offlinePrice, setOfflinePrice] = useState("");
  const [offlineNotes, setOfflineNotes] = useState("");
  const [submittingOffline, setSubmittingOffline] = useState(false);
  const [daySlots, setDaySlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (offlineVenueId) {
      api.get(`/admin/venues/${offlineVenueId}/courts`)
        .then(res => {
          const courts = res.data || [];
          setOfflineCourts(courts);
          const active = courts.find((c: any) => c.isActive) || courts[0];
          setOfflineCourtId(active ? active.id : "");
        })
        .catch(() => {
          setOfflineCourts([]);
          setOfflineCourtId("");
        });
    }
  }, [offlineVenueId]);

  useEffect(() => {
    if (showOfflineModal && offlineVenueId && offlineDate) {
      fetchDaySlots(offlineVenueId, offlineDate, offlineCourtId);
    }
  }, [showOfflineModal, offlineVenueId, offlineDate, offlineCourtId]);

  const fetchDaySlots = async (venueId: string, dateStr: string, courtIdStr?: string) => {
    setLoadingSlots(true);
    try {
      const courtQuery = courtIdStr ? `&courtId=${courtIdStr}` : '';
      const res = await api.get(`/venues/${venueId}/slots?date=${dateStr}${courtQuery}`);
      setDaySlots(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (_) {
      setDaySlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (rescheduleBooking && rescheduleDate) {
      setLoadingRescheduleSlots(true);
      const vId = rescheduleBooking.venueId || rescheduleBooking.venue?.id;
      const courtQuery = rescheduleCourtId ? `&courtId=${rescheduleCourtId}` : '';
      api.get(`/venues/${vId}/slots?date=${rescheduleDate}${courtQuery}`)
        .then(res => {
          setRescheduleSlots(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        })
        .catch(() => setRescheduleSlots([]))
        .finally(() => setLoadingRescheduleSlots(false));
    }
  }, [rescheduleBooking, rescheduleDate, rescheduleCourtId]);

  const handleOpenReschedule = async (b: any) => {
    setRescheduleBooking(b);
    const curDate = b.date ? new Date(b.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    setRescheduleDate(curDate);
    setRescheduleStartTime(b.startTime || "19:00");
    setRescheduleReason("");
    const vId = b.venueId || b.venue?.id;
    try {
      const res = await api.get(`/admin/venues/${vId}/courts`);
      const courts = res.data || [];
      setRescheduleCourts(courts);
      setRescheduleCourtId(b.courtId || b.court?.id || courts[0]?.id || "");
    } catch (_) {
      setRescheduleCourts([]);
      setRescheduleCourtId("");
    }
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBooking || !rescheduleDate || !rescheduleStartTime) return;

    setSubmittingReschedule(true);
    try {
      await api.patch(`/admin/bookings/${rescheduleBooking.id}/reschedule`, {
        newCourtId: rescheduleCourtId || undefined,
        newDate: rescheduleDate,
        newStartTime: rescheduleStartTime,
        reason: rescheduleReason.trim() || undefined,
      });

      setRescheduleBooking(null);
      fetchData();
      setPopup({
        isOpen: true,
        type: "success",
        title: "Reschedule Berhasil",
        message: `Booking berhasil dipindahkan ke tanggal ${rescheduleDate} pukul ${rescheduleStartTime}. Pelanggan telah dinotifikasi.`,
      });
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Reschedule",
        message: err.response?.data?.message || "Gagal menjadwalkan ulang booking.",
      });
    } finally {
      setSubmittingReschedule(false);
    }
  };

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

  const handleOpenOfflineModal = async () => {
    try {
      if (venuesList.length === 0) {
        const res = await api.get("/admin/venues?limit=100");
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
        setVenuesList(list);
        if (list.length > 0 && !offlineVenueId) {
          setOfflineVenueId(list[0].id);
        }
      }
    } catch (_) {}
    setShowOfflineModal(true);
  };

  const handleSubmitOfflineBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineVenueId || !offlineCustomerName.trim() || !offlineDate || !offlineStartTime) {
      setPopup({
        isOpen: true,
        type: "warning",
        title: "Data Belum Lengkap",
        message: "Silakan lengkapi venue, tanggal, jam, dan nama pemesan/keperluan.",
      });
      return;
    }
    setSubmittingOffline(true);
    try {
      await api.post("/admin/bookings", {
        venueId: offlineVenueId,
        courtId: offlineCourtId || undefined,
        date: offlineDate,
        startTime: offlineStartTime,
        durationHours: Number(offlineDuration),
        customerName: offlineCustomerName.trim(),
        customerPhone: offlineCustomerPhone.trim() || undefined,
        paymentMethod: offlinePaymentMethod,
        paymentStatus: offlinePaymentStatus,
        price: offlinePrice ? Number(offlinePrice) : undefined,
        notes: offlineNotes.trim() || undefined,
        bookingSource: offlineBookingSource,
      });

      setShowOfflineModal(false);
      // Reset fields
      setOfflineCustomerName("");
      setOfflineCustomerPhone("");
      setOfflineNotes("");
      setOfflinePrice("");
      fetchData();

      setPopup({
        isOpen: true,
        type: "success",
        title: "Booking Offline Berhasil",
        message: "Slot waktu berhasil diblokir dan tercatat di sistem.",
      });
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Membuat Booking Offline",
        message: err.response?.data?.message || "Terjadi kesalahan saat memblokir slot.",
      });
    } finally {
      setSubmittingOffline(false);
    }
  };

  const handleView = async (id: string) => {
    try {
      const res = await api.get(`/admin/bookings/${id}`);
      setViewBooking(res.data.data || res.data);
    } catch (error) {
      console.error('Failed to load booking details', error);
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Memuat Detail",
        message: "Tidak dapat memuat detail booking ini."
      });
    }
  };

  const handleCancel = async (id: number) => {
    setPopup({
      isOpen: true,
      type: "confirm",
      title: "Batalkan Booking Ini?",
      message: "Apakah Anda yakin ingin membatalkan transaksi booking pengguna ini?",
      onConfirm: async () => {
        try {
          await api.patch(`/admin/bookings/${id}/cancel`);
          setBookings(bs => bs.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
          setPopup({
            isOpen: true,
            type: "success",
            title: "Booking Dibatalkan",
            message: "Transaksi booking telah berhasil dibatalkan."
          });
        } catch (error) {
          console.error("Failed to cancel", error);
          setPopup({
            isOpen: true,
            type: "error",
            title: "Gagal Membatalkan",
            message: "Gagal membatalkan transaksi booking."
          });
        }
      }
    });
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

  const counts: Record<string, number> = {
    all: bookings.length,
    pending_payment: bookings.filter(b => b.status === "pending_payment").length,
    upcoming: bookings.filter(b => b.status === "upcoming" || b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled" || b.status === "expired").length,
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all", label: "Semua" },
            { key: "pending_payment", label: "Menunggu Bayar" },
            { key: "upcoming", label: "Upcoming" },
            { key: "completed", label: "Selesai" },
            { key: "cancelled", label: "Dibatalkan" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={cn("px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                filter === t.key ? "bg-[#16A34A] text-white shadow" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              {t.label} ({counts[t.key] || 0})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings…"
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 w-full"
            />
          </div>
          <button
            onClick={handleOpenOfflineModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold shadow-sm shadow-green-600/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Booking Offline / Blokir Slot</span>
            <span className="sm:hidden">Offline</span>
          </button>
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
            <tbody className="divide-y divide-gray-50 text-xs">
              {filtered.map(b => {
                const uName = b.customerName || b.user?.fullName || b.user?.name || "Customer";
                const isOffline = b.bookingSource && b.bookingSource !== 'online';
                const sourceLabels: Record<string, string> = {
                  walk_in: "Walk-in Kasir",
                  whatsapp: "WhatsApp",
                  phone: "Telepon",
                  maintenance: "Maintenance",
                  tournament: "Turnamen",
                  manual_block: "Blokir Slot",
                  online: "Online",
                };
                return (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3 font-bold text-gray-700 whitespace-nowrap">
                      <div>{b.bookingCode ? b.bookingCode : `BK-${b.id}`}</div>
                      {isOffline && (
                        <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-0.5">
                          {sourceLabels[b.bookingSource] || b.bookingSource}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {uName.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-800 font-medium whitespace-nowrap max-w-[130px] truncate block" title={uName}>{uName}</span>
                          {b.customerPhone && <span className="text-[11px] text-gray-400 block">{b.customerPhone}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-800" title={b.venue?.name || "Venue"}>{b.venue?.name || "Venue"}</div>
                      {b.court?.name ? (
                        <span className="inline-block text-[10px] font-semibold text-[#16A34A] bg-green-50 px-1.5 py-0.5 rounded border border-green-200 mt-0.5">
                          {b.court.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 block">{b.venue?.city || ""}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      <div>{b.date ? new Date(b.date).toLocaleDateString("id-ID") : "-"}</div>
                      <div className="text-[11px] text-gray-400">{b.startTime} ({b.durationHours || 1} jam)</div>
                    </td>
                    <td className="px-3 py-3 font-bold text-gray-900 whitespace-nowrap">{formatPrice(b.total ?? b.totalPrice ?? 0)}</td>
                    <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleView(b.id)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Lihat Detail">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {(b.status === "upcoming" || b.status === "confirmed" || b.status === "pending_payment") && (
                          <button onClick={() => handleOpenReschedule(b)} className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Reschedule / Pindah Jadwal">
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(b.status === "upcoming" || b.status === "confirmed" || b.status === "pending_payment") && (
                          <button onClick={() => handleCancel(b.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Batalkan">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setReceiptBooking(b)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Cetak Struk">
                          <Download className="w-3.5 h-3.5" />
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

      <AnimatePresence>
        {viewBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewBooking(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setViewBooking(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Booking Code</p>
                  <p className="font-bold text-gray-900">{viewBooking.bookingCode || `BK-${viewBooking.id}`}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Customer / Pemesan</p>
                    <p className="font-semibold text-gray-900">{viewBooking.customerName || viewBooking.user?.fullName || viewBooking.user?.name || '-'}</p>
                    {viewBooking.user?.email && <p className="text-sm text-gray-500 truncate">{viewBooking.user.email}</p>}
                    {(viewBooking.customerPhone || viewBooking.user?.phone) && (
                      <p className="text-sm text-gray-500">{viewBooking.customerPhone || viewBooking.user?.phone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Sumber Booking</p>
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full capitalize">
                      {viewBooking.bookingSource || 'online'}
                    </span>
                  </div>
                  {viewBooking.adminNotes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Catatan Admin</p>
                      <p className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{viewBooking.adminNotes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Venue & Lapangan</p>
                    <p className="font-semibold text-gray-900">{viewBooking.venue?.name || '-'}</p>
                    <p className="text-sm text-gray-500">{viewBooking.venue?.city || '-'}</p>
                    {viewBooking.court?.name && (
                      <p className="text-xs font-bold text-[#16A34A] bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 mt-1.5 inline-block">
                        {viewBooking.court.name} ({viewBooking.court.courtType || 'Vinyl'})
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">
                      {viewBooking.date ? new Date(viewBooking.date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Time</p>
                    <p className="font-semibold text-gray-900">{viewBooking.startTime || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900">{viewBooking.durationHours ? `${viewBooking.durationHours} jam` : (viewBooking.duration ? `${viewBooking.duration} jam` : '-')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatPrice(viewBooking.subtotal || viewBooking.totalPrice || 0)}</span>
                  </div>
                  {viewBooking.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount</span>
                      <span>-{formatPrice(viewBooking.discount)}</span>
                    </div>
                  )}
                  {viewBooking.serviceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service Fee</span>
                      <span className="font-medium">{formatPrice(viewBooking.serviceFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[#16A34A]">{formatPrice(viewBooking.total || viewBooking.totalPrice || 0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment</p>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900 uppercase">{viewBooking.paymentMethod || '-'}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${viewBooking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {viewBooking.paymentStatus || 'pending'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Booking Status</p>
                    <StatusBadge status={viewBooking.status} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offline Booking / Slot Block Modal */}
      <AnimatePresence>
        {showOfflineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowOfflineModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden p-6 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Booking Offline / Blokir Slot</h3>
                  <p className="text-xs text-gray-500">Catat sewa walk-in/WA atau pemeliharaan lapangan</p>
                </div>
                <button
                  onClick={() => setShowOfflineModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitOfflineBooking} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih Venue *</label>
                    <select
                      value={offlineVenueId}
                      onChange={e => setOfflineVenueId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
                    >
                      {venuesList.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih Lapangan *</label>
                    <select
                      value={offlineCourtId}
                      onChange={e => setOfflineCourtId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      {offlineCourts.length === 0 ? (
                        <option value="">(Lapangan Utama)</option>
                      ) : (
                        offlineCourts.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.courtType || 'Vinyl'}) {c.pricePerHour ? `- ${formatPrice(c.pricePerHour)}/jam` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sumber Booking</label>
                    <select
                      value={offlineBookingSource}
                      onChange={e => setOfflineBookingSource(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      <option value="walk_in">Walk-in Kasir</option>
                      <option value="whatsapp">Pesanan WhatsApp</option>
                      <option value="phone">Telepon Manual</option>
                      <option value="maintenance">Maintenance / Perawatan</option>
                      <option value="tournament">Turnamen / Event</option>
                      <option value="manual_block">Blokir Slot Operasional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tanggal *</label>
                    <input
                      type="date"
                      value={offlineDate}
                      onChange={e => setOfflineDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Jam Mulai *</label>
                    <select
                      value={offlineStartTime}
                      onChange={e => setOfflineStartTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      {Array.from({ length: 17 }, (_, i) => {
                        const h = (i + 7).toString().padStart(2, "0");
                        return <option key={h} value={`${h}:00`}>{h}:00</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Durasi Main</label>
                    <select
                      value={offlineDuration}
                      onChange={e => setOfflineDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      <option value={1}>1 Jam</option>
                      <option value={2}>2 Jam</option>
                      <option value={3}>3 Jam</option>
                      <option value={4}>4 Jam</option>
                    </select>
                  </div>
                </div>

                {/* Real-time slot availability preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase">Ketersediaan Slot ({offlineDate})</label>
                    {loadingSlots && <span className="text-[11px] text-gray-400">Memeriksa slot...</span>}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                    {daySlots.length === 0 ? (
                      <div className="col-span-full py-2 text-center text-xs text-gray-400">Pilih venue & tanggal untuk memeriksa slot</div>
                    ) : (
                      daySlots.map(slot => {
                        const isSelected = offlineStartTime === slot.startTime;
                        return (
                          <button
                            key={slot.id || slot.startTime}
                            type="button"
                            disabled={slot.isBooked}
                            onClick={() => setOfflineStartTime(slot.startTime)}
                            className={cn(
                              "py-1 px-1.5 rounded-lg text-[11px] font-medium border text-center transition-all",
                              slot.isBooked
                                ? "bg-red-50 text-red-500 border-red-200 cursor-not-allowed line-through"
                                : isSelected
                                  ? "bg-[#16A34A] text-white border-[#16A34A] shadow-sm font-bold"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50"
                            )}
                          >
                            {slot.startTime}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Pemesan / Keperluan *</label>
                    <input
                      type="text"
                      value={offlineCustomerName}
                      onChange={e => setOfflineCustomerName(e.target.value)}
                      placeholder="Budi Santoso / Perawatan Lampu"
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">No. Telepon (Opsional)</label>
                    <input
                      type="text"
                      value={offlineCustomerPhone}
                      onChange={e => setOfflineCustomerPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status Bayar</label>
                    <select
                      value={offlinePaymentStatus}
                      onChange={e => setOfflinePaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      <option value="paid">Lunas (Paid)</option>
                      <option value="unpaid">Belum Lunas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Metode Bayar</label>
                    <select
                      value={offlinePaymentMethod}
                      onChange={e => setOfflinePaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      <option value="cash">Tunai (Kasir)</option>
                      <option value="bank_transfer">Transfer Manual</option>
                      <option value="maintenance">Gratis / Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Biaya (Rp)</label>
                    <input
                      type="number"
                      value={offlinePrice}
                      onChange={e => setOfflinePrice(e.target.value)}
                      placeholder="Otomatis tarif venue"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={offlineNotes}
                    onChange={e => setOfflineNotes(e.target.value)}
                    placeholder="misal: DP 50k tunai di kasir, sisa bayar setelah main"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                  />
                </div>

                {(() => {
                  const startH = parseInt(offlineStartTime.split(":")[0], 10);
                  const conflictSlots: string[] = [];
                  for (let i = 0; i < offlineDuration; i++) {
                    const t = `${(startH + i).toString().padStart(2, "0")}:00`;
                    const match = daySlots.find(s => s.startTime === t);
                    if (match && match.isBooked) conflictSlots.push(t);
                  }
                  const hasConflict = conflictSlots.length > 0;
                  return (
                    <>
                      {hasConflict && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>
                            <strong>Peringatan Bentrok:</strong> Jam {conflictSlots.join(", ")} sudah terisi atau diblokir. Pilih jam lain.
                          </span>
                        </div>
                      )}
                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowOfflineModal(false)}
                          className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={submittingOffline || hasConflict}
                          className="flex-1 py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-green-600/20 transition-colors"
                        >
                          {submittingOffline
                            ? "Menyimpan..."
                            : hasConflict
                              ? "Jadwal Bentrok"
                              : "Simpan Booking Offline"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRescheduleBooking(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden p-6 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reschedule / Pindah Jadwal</h3>
                  <p className="text-xs text-gray-500">Pindahkan booking ke tanggal atau jam lain</p>
                </div>
                <button
                  onClick={() => setRescheduleBooking(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current booking info summary */}
              <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kode Booking:</span>
                  <span className="font-bold text-gray-800">{rescheduleBooking.bookingCode || `BK-${rescheduleBooking.id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium text-gray-800">{rescheduleBooking.customerName || rescheduleBooking.user?.fullName || "Customer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Venue:</span>
                  <span className="font-medium text-gray-800">{rescheduleBooking.venue?.name || "Venue"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lapangan Saat Ini:</span>
                  <span className="font-semibold text-[#16A34A]">{rescheduleBooking.court?.name || "Lapangan 1 (Utama)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jadwal Lama:</span>
                  <span className="font-semibold text-red-600">
                    {rescheduleBooking.date ? new Date(rescheduleBooking.date).toLocaleDateString("id-ID") : "-"} pukul {rescheduleBooking.startTime} ({rescheduleBooking.durationHours || 1} jam)
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitReschedule} className="mt-4 space-y-4">
                {rescheduleCourts.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pindahkan ke Lapangan</label>
                    <select
                      value={rescheduleCourtId}
                      onChange={e => setRescheduleCourtId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      {rescheduleCourts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.courtType || 'Vinyl'}) {c.pricePerHour ? `- ${formatPrice(c.pricePerHour)}/jam` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tanggal Baru *</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={e => setRescheduleDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Jam Mulai Baru *</label>
                    <select
                      value={rescheduleStartTime}
                      onChange={e => setRescheduleStartTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      {Array.from({ length: 17 }, (_, i) => {
                        const h = (i + 7).toString().padStart(2, "0");
                        return <option key={h} value={`${h}:00`}>{h}:00</option>;
                      })}
                    </select>
                  </div>
                </div>

                {/* Target slot availability preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase">Ketersediaan Slot ({rescheduleDate})</label>
                    {loadingRescheduleSlots && <span className="text-[11px] text-gray-400">Memeriksa slot...</span>}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                    {rescheduleSlots.length === 0 ? (
                      <div className="col-span-full py-2 text-center text-xs text-gray-400">Pilih tanggal untuk memeriksa slot</div>
                    ) : (
                      rescheduleSlots.map(slot => {
                        const isSelected = rescheduleStartTime === slot.startTime;
                        const isCurrentBookingSlot = slot.bookingId === rescheduleBooking.id;
                        const isOccupied = slot.isBooked && !isCurrentBookingSlot;
                        return (
                          <button
                            key={slot.id || slot.startTime}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => setRescheduleStartTime(slot.startTime)}
                            className={cn(
                              "py-1 px-1.5 rounded-lg text-[11px] font-medium border text-center transition-all",
                              isOccupied
                                ? "bg-red-50 text-red-500 border-red-200 cursor-not-allowed line-through"
                                : isSelected
                                  ? "bg-[#16A34A] text-white border-[#16A34A] shadow-sm font-bold"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50"
                            )}
                          >
                            {slot.startTime}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Alasan Reschedule (Opsional)</label>
                  <input
                    type="text"
                    value={rescheduleReason}
                    onChange={e => setRescheduleReason(e.target.value)}
                    placeholder="misal: Permintaan customer, renovasi darurat"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                  />
                </div>

                {(() => {
                  const startH = parseInt(rescheduleStartTime.split(":")[0], 10);
                  const duration = rescheduleBooking.durationHours || 1;
                  const conflictSlots: string[] = [];
                  for (let i = 0; i < duration; i++) {
                    const t = `${(startH + i).toString().padStart(2, "0")}:00`;
                    const match = rescheduleSlots.find(s => s.startTime === t);
                    if (match && match.isBooked && match.bookingId !== rescheduleBooking.id) {
                      conflictSlots.push(t);
                    }
                  }
                  const hasConflict = conflictSlots.length > 0;
                  return (
                    <>
                      {hasConflict && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>
                            <strong>Peringatan Bentrok:</strong> Jam {conflictSlots.join(", ")} sudah terisi. Silakan pilih waktu lain.
                          </span>
                        </div>
                      )}
                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setRescheduleBooking(null)}
                          className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReschedule || hasConflict}
                          className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition-colors"
                        >
                          {submittingReschedule
                            ? "Memindahkan..."
                            : hasConflict
                              ? "Jadwal Bentrok"
                              : "Konfirmasi Reschedule"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReceiptModal
        isOpen={!!receiptBooking}
        onClose={() => setReceiptBooking(null)}
        booking={receiptBooking}
      />

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
        onConfirm={popup.onConfirm}
      />
    </div>
  );
}
