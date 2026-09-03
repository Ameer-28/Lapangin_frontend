"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Star, Trash2, Building2, User, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { PopupModal, PopupType } from "@/components/ui/PopupModal";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, message: "" });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (ratingFilter !== "all") params.set("rating", ratingFilter);
      if (venueFilter !== "all") params.set("venueId", venueFilter);
      params.set("page", page.toString());
      params.set("limit", "12");

      const res = await api.get(`/admin/reviews?${params.toString()}`);
      const data = res.data;
      setReviews(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotalCount(data.meta?.total || 0);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter, venueFilter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    // Fetch venues for the filter dropdown
    api.get("/venues?limit=100")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setVenues(list);
      })
      .catch(() => {});
  }, []);

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setPopup({
      isOpen: true,
      type: "confirm",
      title: "Hapus Ulasan Ini?",
      message: "Ulasan yang dihapus tidak dapat dipulihkan. Rating venue akan dihitung ulang secara otomatis.",
      onConfirm: () => handleDelete(id),
    });
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/admin/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
      setPopup({
        isOpen: true,
        type: "success",
        title: "Review Dihapus",
        message: "Review berhasil dihapus dan rating venue telah diperbarui.",
      });
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Menghapus",
        message: err.response?.data?.message || "Gagal menghapus review.",
      });
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Moderasi Review & Rating</h1>
          <p className="text-sm text-gray-500">
            Kelola ulasan customer, filter berdasarkan rating atau venue, dan hapus review yang melanggar ketentuan ({totalCount} ulasan).
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama pemesan, email, venue, atau komentar..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#16A34A] focus:bg-white transition-all"
          />
        </div>

        {/* Rating Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap font-medium">Rating:</label>
          <select
            value={ratingFilter}
            onChange={e => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-[#16A34A]"
          >
            <option value="all">Semua Bintang</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Bintang)</option>
            <option value="4">⭐⭐⭐⭐ (4 Bintang)</option>
            <option value="3">⭐⭐⭐ (3 Bintang)</option>
            <option value="2">⭐⭐ (2 Bintang)</option>
            <option value="1">⭐ (1 Bintang)</option>
          </select>
        </div>

        {/* Venue Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap font-medium">Venue:</label>
          <select
            value={venueFilter}
            onChange={e => {
              setVenueFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-[#16A34A] max-w-[200px]"
          >
            <option value="all">Semua Venue</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Tidak ada review ditemukan</h3>
          <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter bintang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(r => {
            const customerName = r.user?.fullName || r.user?.name || "Customer";
            const initial = customerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Rating Stars & Delete Button */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4",
                            star <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-100"
                          )}
                        />
                      ))}
                      <span className="text-xs font-bold text-gray-700 ml-1.5">{r.rating}.0</span>
                    </div>

                    <button
                      onClick={() => confirmDelete(r.id)}
                      disabled={deleting && deleteTargetId === r.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Review Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-gray-800 line-clamp-4 italic mb-4">
                    "{r.comment || "Tanpa komentar tertulis."}"
                  </p>
                </div>

                {/* Metadata Card Footer */}
                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{customerName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{r.user?.email || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1 truncate max-w-[60%]">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="truncate text-gray-600 font-medium">{r.venue?.name || "Venue"}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "-"}</span>
                    </div>
                  </div>

                  {r.booking?.bookingCode && (
                    <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded font-mono w-fit">
                      Ref: {r.booking.bookingCode}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-gray-500">
            Halaman {page} dari {totalPages}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          >
            Selanjutnya
          </button>
        </div>
      )}

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
