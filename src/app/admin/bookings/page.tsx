"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, XCircle, Download, X, Plus } from "lucide-react";
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

  // Offline booking modal states
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [venuesList, setVenuesList] = useState<any[]>([]);
  const [offlineVenueId, setOfflineVenueId] = useState("");
  const [offlineDate, setOfflineDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [offlineStartTime, setOfflineStartTime] = useState("19:00");
  const [offlineDuration, setOfflineDuration] = useState(1);
  const [offlineCustomerName, setOfflineCustomerName] = useState("");
  const [offlineCustomerPhone, setOfflineCustomerPhone] = useState("");
  const [offlinePaymentMethod, setOfflinePaymentMethod] = useState("cash");
  const [offlinePaymentStatus, setOfflinePaymentStatus] = useState("paid");
  const [offlinePrice, setOfflinePrice] = useState("");
  const [offlineNotes, setOfflineNotes] = useState("");
  const [submittingOffline, setSubmittingOffline] = useState(false);
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
        date: offlineDate,
        startTime: offlineStartTime,
        durationHours: Number(offlineDuration),
        customerName: offlineCustomerName.trim(),
        customerPhone: offlineCustomerPhone.trim() || undefined,
        paymentMethod: offlinePaymentMethod,
        paymentStatus: offlinePaymentStatus,
        price: offlinePrice ? Number(offlinePrice) : undefined,
        notes: offlineNotes.trim() || undefined,
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
                const uName = b.user?.fullName || b.user?.name || "Customer";
                return (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3 font-bold text-gray-700 whitespace-nowrap">{b.bookingCode ? b.bookingCode : `BK-${b.id}`}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {uName.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-gray-800 whitespace-nowrap max-w-[130px] truncate" title={uName}>{uName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-500 max-w-[120px] truncate" title={b.venue?.name || "Venue"}>{b.venue?.name || "Venue"}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      <div>{b.date ? new Date(b.date).toLocaleDateString("id-ID") : "-"}</div>
                    </td>
                    <td className="px-3 py-3 font-bold text-gray-900 whitespace-nowrap">{formatPrice(b.total ?? b.totalPrice ?? 0)}</td>
                    <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleView(b.id)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {(b.status === "upcoming" || b.status === "confirmed") && (
                          <button onClick={() => handleCancel(b.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Cancel">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setReceiptBooking(b)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Download Receipt">
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
                    <p className="text-sm text-gray-500 mb-1">Customer</p>
                    <p className="font-semibold text-gray-900">{viewBooking.user?.fullName || viewBooking.user?.name || '-'}</p>
                    <p className="text-sm text-gray-500 truncate">{viewBooking.user?.email || '-'}</p>
                    {viewBooking.user?.phone && <p className="text-sm text-gray-500">{viewBooking.user.phone}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Venue</p>
                    <p className="font-semibold text-gray-900">{viewBooking.venue?.name || '-'}</p>
                    <p className="text-sm text-gray-500">{viewBooking.venue?.city || '-'}</p>
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
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih Venue *</label>
                  <select
                    value={offlineVenueId}
                    onChange={e => setOfflineVenueId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
                  >
                    {venuesList.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.city}) - {formatPrice(v.pricePerHour)}/jam
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status Pembayaran</label>
                    <select
                      value={offlinePaymentStatus}
                      onChange={e => setOfflinePaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      <option value="paid">Lunas (Paid)</option>
                      <option value="unpaid">Belum Lunas (Unpaid)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Pemesan / Keperluan *</label>
                  <input
                    type="text"
                    value={offlineCustomerName}
                    onChange={e => setOfflineCustomerName(e.target.value)}
                    placeholder="misal: Budi Santoso (WA) / Maintenance Lapangan"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Metode Bayar</label>
                    <select
                      value={offlinePaymentMethod}
                      onChange={e => setOfflinePaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    >
                      <option value="cash">Tunai (Kasir)</option>
                      <option value="bank_transfer">Transfer Manual</option>
                      <option value="maintenance">Maintenance (Gratis)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Biaya (Rp)</label>
                    <input
                      type="number"
                      value={offlinePrice}
                      onChange={e => setOfflinePrice(e.target.value)}
                      placeholder="Otomatis dari tarif venue"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Catatan Tambahan</label>
                    <input
                      type="text"
                      value={offlineNotes}
                      onChange={e => setOfflineNotes(e.target.value)}
                      placeholder="DP 50k, sisa di tempat"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

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
                    disabled={submittingOffline}
                    className="flex-1 py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803d] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-green-600/20 transition-colors"
                  >
                    {submittingOffline ? "Menyimpan..." : "Simpan Booking Offline"}
                  </button>
                </div>
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
