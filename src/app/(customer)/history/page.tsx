"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, Calendar, Clock, Download, RefreshCw, X, Star } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { PopupModal, PopupType } from "@/components/ui/PopupModal";
import { ReceiptModal } from "@/components/ui/ReceiptModal";

export default function HistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "pending_payment" | "upcoming" | "completed" | "cancelled">("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [receiptBooking, setReceiptBooking] = useState<any>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewedVenues, setReviewedVenues] = useState<Set<string>>(new Set());
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadSnapScript = (isProd: boolean, clientKey: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const snapUrl = isProd
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

      const existingScript = document.querySelector(`script[src="${snapUrl}"]`);
      if (existingScript && (window as any).snap) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = snapUrl;
      script.setAttribute("data-client-key", clientKey);
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayPending = async (b: any) => {
    try {
      const res = await api.post("/payments/create-snap-token", { bookingId: b.id });
      const { snapToken, isProduction, clientKey } = res.data;
      await loadSnapScript(isProduction, clientKey);
      if ((window as any).snap && snapToken) {
        (window as any).snap.pay(snapToken, {
          onSuccess: () => {
            fetchBookings();
            setPopup({
              isOpen: true,
              type: "success",
              title: "Pembayaran Berhasil",
              message: "Pembayaran Anda telah berhasil dan jadwal booking telah aktif!",
            });
          },
          onPending: () => {
            fetchBookings();
          },
          onError: () => {
            setPopup({
              isOpen: true,
              type: "error",
              title: "Pembayaran Gagal",
              message: "Pembayaran tidak berhasil. Silakan coba kembali.",
            });
          },
        });
      }
    } catch (e: any) {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Membuka Pembayaran",
        message: e.response?.data?.message || "Tidak dapat memuat gateway pembayaran.",
      });
    }
  };

  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, message: "" });

  const fetchReviewedVenues = async () => {
    try {
      const res = await api.get("/reviews/my-reviewed-venues");
      const venueIds: string[] = Array.isArray(res.data) ? res.data : [];
      setReviewedVenues(new Set(venueIds));
    } catch (e) {
      // fallback: check from booking data
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings");
      const raw = res.data;
      const fetchedBookings = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBookings();
    fetchReviewedVenues();
  }, [router]);

  const handleSubmitReview = async () => {
    if (!reviewBookingId || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewBookingId,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      // Find the venueId of this booking and mark the entire venue as reviewed
      const booking = bookings.find(b => b.id === reviewBookingId);
      if (booking?.venueId) {
        setReviewedVenues(prev => new Set(prev).add(booking.venueId));
      }
      setReviewBookingId(null);
      setReviewRating(0);
      setReviewComment('');
      setPopup({
        isOpen: true,
        type: "success",
        title: "Review Terkirim ⭐",
        message: "Terima kasih atas ulasan dan rating yang Anda berikan!",
      });
    } catch (error: any) {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Mengirim Review",
        message: error.response?.data?.message || "Terjadi kesalahan saat mengirim ulasan.",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancel = async (id: string) => {
    setPopup({
      isOpen: true,
      type: "confirm",
      title: "Batalkan Booking?",
      message: "Apakah Anda yakin ingin membatalkan jadwal lapangan ini?",
      onConfirm: async () => {
        try {
          await api.patch(`/bookings/${id}/cancel`);
          fetchBookings();
          setPopup({
            isOpen: true,
            type: "success",
            title: "Booking Dibatalkan",
            message: "Jadwal booking Anda telah berhasil dibatalkan.",
          });
        } catch (error) {
          console.error("Error cancelling booking:", error);
          setPopup({
            isOpen: true,
            type: "error",
            title: "Gagal Membatalkan",
            message: "Gagal membatalkan booking. Silakan coba beberapa saat lagi.",
          });
        }
      },
    });
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
        {([
          { key: "all", label: "Semua" },
          { key: "pending_payment", label: "Menunggu Bayar" },
          { key: "upcoming", label: "Upcoming" },
          { key: "completed", label: "Selesai" },
          { key: "cancelled", label: "Dibatalkan" },
        ] as const).map(t => {
          const count = t.key === "all" ? bookings.length : bookings.filter(b => b.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                tab === t.key
                  ? "bg-[#16A34A] text-white shadow-md"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              )}
            >
              {t.label}
              {" "}
              <span className="ml-1 opacity-80">({count})</span>
            </button>
          );
        })}
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
                  <div className="flex items-center gap-2">
                    {b.status === "pending_payment" && b.paymentExpiresAt && (
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        Batas: {new Date(b.paymentExpiresAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    <StatusBadge status={b.status} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#16A34A]" />{b.date ? new Date(b.date).toLocaleDateString() : '-'}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#16A34A]" />{b.startTime}</span>
                </div>
                <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                  <span className="font-bold text-[#16A34A] text-lg">{formatPrice(b.total ?? b.totalPrice ?? 0)}</span>
                  <div className="flex gap-2">
                    {b.status === "pending_payment" && (
                      <>
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Batalkan
                        </button>
                        <button
                          onClick={() => handlePayPending(b)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/20 transition-colors"
                        >
                          Bayar Sekarang
                        </button>
                      </>
                    )}
                    {b.status === "completed" && (
                      reviewedVenues.has(b.venueId) ? (
                        <span className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed">
                          ✅ Reviewed
                        </span>
                      ) : (
                        <button onClick={() => setReviewBookingId(b.id)} className="flex items-center gap-1.5 px-4 py-2 border border-yellow-400 text-yellow-600 bg-yellow-50 rounded-xl text-xs font-semibold hover:bg-yellow-100 transition-colors">
                          <Star className="w-3.5 h-3.5 fill-current" /> Beri Rating
                        </button>
                      )
                    )}
                    {b.status === "completed" && (
                      <button onClick={() => setReceiptBooking(b)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-gray-300 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Receipt
                      </button>
                    )}
                    {(b.status === "completed" || b.status === "cancelled" || b.status === "expired") && (
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

      {/* Review Modal */}
      <AnimatePresence>
        {reviewBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setReviewBookingId(null);
                setReviewRating(0);
                setReviewComment('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Beri Rating & Review</h3>
                <button
                  onClick={() => {
                    setReviewBookingId(null);
                    setReviewRating(0);
                    setReviewComment('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-1 justify-center mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      className={`w-10 h-10 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Komentar (Opsional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Bagaimana pengalaman Anda?"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setReviewBookingId(null);
                    setReviewRating(0);
                    setReviewComment('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || submittingReview}
                  className="flex-1 px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-semibold hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingReview ? 'Mengirim...' : 'Kirim Review'}
                </button>
              </div>
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
