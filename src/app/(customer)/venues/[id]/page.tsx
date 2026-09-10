"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ChevronLeft, MapPin, Heart, Clock, Star, 
  Calendar as CalendarIcon, AlertTriangle, CheckCircle2, Shield, Award,
  Sparkles, ArrowRight, Building2
} from "lucide-react";
import { GreenButton } from "@/components/ui/GreenButton";
import { Stars } from "@/components/ui/Stars";
import { formatPrice, FACILITY_MAP } from "@/lib/data";
import { cn as cx } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";
import { PopupModal, PopupType } from "@/components/ui/PopupModal";

function VenueDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const paramCourt = searchParams.get("courtId");

  const [venue, setVenue] = useState<any>(null);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(paramCourt || "");
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);

  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    fetchVenue();
    fetchReviews();
    checkFavorite();
  }, [id]);

  const fetchVenue = async () => {
    try {
      const res = await api.get(`/venues/${id}`);
      const v = res.data.data || res.data;
      setVenue(v);
      
      const vCourts = v.courts || [];
      setCourts(vCourts);
      if (vCourts.length > 0 && !selectedCourtId) {
        const active = vCourts.find((c: any) => c.isActive) || vCourts[0];
        setSelectedCourtId(active.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/venues/${id}/reviews`);
      const raw = res.data;
      setReviews(Array.isArray(raw) ? raw : (raw?.data || []));
    } catch (err) {
      console.error(err);
    }
  };

  const checkFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get(`/favorites/${id}/check`, {
        headers: { "X-Skip-Auth-Redirect": "true" }
      });
      setLiked(res.data?.isFavorite || res.data?.data?.isFavorite || false);
    } catch (err) {
      // Optional check, silently ignore 401
    }
  };

  const toggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      if (liked) {
        await api.delete(`/favorites/${id}`);
        setLiked(false);
      } else {
        await api.post(`/favorites/${id}`);
        setLiked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookNow = (targetCourtId?: string) => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === "admin") {
          setPopup({
            isOpen: true,
            type: "warning",
            title: "Akses Ditolak",
            message: "Akun Admin tidak diperbolehkan melakukan pemesanan lapangan. Silakan gunakan akun customer biasa."
          });
          return;
        }
      } catch (e) {}
    }

    const courtToBook = targetCourtId || selectedCourtId;
    const q = new URLSearchParams();
    q.set("venueId", venue.id);
    if (courtToBook) {
      q.set("courtId", courtToBook);
    }

    router.push(`/bookings/new?${q.toString()}`);
  };

  const courtPrices = courts.filter(c => c.isActive && c.pricePerHour).map(c => c.pricePerHour);
  const minPrice = courtPrices.length > 0 ? Math.min(...courtPrices, venue?.pricePerHour || Infinity) : (venue?.pricePerHour || 0);
  const maxPrice = courtPrices.length > 0 ? Math.max(...courtPrices, venue?.pricePerHour || 0) : (venue?.pricePerHour || 0);
  const hasPriceRange = minPrice !== maxPrice && minPrice > 0 && maxPrice > 0;

  if (!venue) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/venues" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors w-fit">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Jelajah Lapangan
      </Link>

      {/* Gallery */}
      <div className="grid grid-cols-4 gap-2 mb-8 rounded-2xl overflow-hidden h-72 sm:h-96 bg-green-100">
        <div className="col-span-3 overflow-hidden">
          <img src={venue.gallery?.[activeImg] || venue.imageUrl || venue.image} alt={venue.name} className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-rows-3 gap-2">
          {venue.gallery?.slice(0, 3).map((img: string, i: number) => (
            <div key={i} onClick={() => setActiveImg(i)}
              className={cx("overflow-hidden cursor-pointer transition-all", activeImg === i ? "ring-2 ring-[#16A34A]" : "opacity-70 hover:opacity-100")}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-7">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4 text-[#16A34A]" />
                {venue.location || venue.address ? `${venue.location || venue.address}, ` : ''}{venue.city}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Stars rating={venue.rating || 0} size="md" />
                <span className="text-gray-700 text-sm font-semibold">{venue.rating || 0}</span>
                <span className="text-gray-400 text-sm">({venue.reviewCount || venue.reviews || venue.reviewsCount || 0} reviews)</span>
                <span className={cx("text-xs font-bold px-2.5 py-1 rounded-full", venue.type === "Indoor" ? "bg-green-100 text-[#16A34A]" : "bg-yellow-100 text-yellow-700")}>{venue.type}</span>
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> Jam Buka: {venue.openTime === "00:00" && (venue.closeTime === "24:00" || venue.closeTime === "00:00") ? "⚡ 24 Jam Non-Stop" : `${venue.openTime || "07:00"} - ${venue.closeTime || "23:00"}`}
                </span>
              </div>
            </div>
            <button onClick={toggleFavorite} className={cx("w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
              liked ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-gray-200 text-gray-400 hover:border-red-200"
            )}>
              <Heart className="w-5 h-5" fill={liked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-3">Tentang Venue Ini</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{venue.description || "Tidak ada deskripsi tersedia."}</p>
          </div>

          {/* Courts Overview */}
          {courts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#16A34A]" /> Pilihan Lapangan ({courts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courts.map((court: any) => (
                  <div
                    key={court.id}
                    onClick={() => {
                      if (court.isActive) {
                        setSelectedCourtId(court.id);
                      }
                    }}
                    className={cx(
                      "p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between",
                      selectedCourtId === court.id
                        ? "border-[#16A34A] bg-green-50/50 ring-1 ring-[#16A34A]"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{court.name}</h3>
                        <span className={cx(
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                          court.courtType?.includes("Rumput") ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        )}>
                          {court.courtType || "Vinyl"}
                        </span>
                      </div>
                      {court.description && (
                        <p className="text-xs text-gray-500 mt-1">{court.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#16A34A] text-sm">
                        {formatPrice(court.pricePerHour ?? venue.pricePerHour)}
                      </span>
                      <span className="text-[11px] text-gray-400 block">/jam</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facilities */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Fasilitas Tersedia</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {(() => {
                const uniqueFacilities: any[] = Array.from(
                  new Map(
                    (venue.facilities || [])
                      .filter((f: string) => FACILITY_MAP[f])
                      .map((f: string) => {
                        const item = FACILITY_MAP[f];
                        return [item.label, { key: f, ...item }];
                      })
                  ).values()
                );
                return uniqueFacilities.map(({ key, label, Icon }) => (
                  <div key={key} className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-xl">
                    <Icon className="w-5 h-5 text-[#16A34A]" />
                    <span className="text-gray-700 text-xs font-medium text-center">{label}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Ulasan Pengguna</h2>
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-gray-900">{venue.rating || 0}</span>
                <span className="text-gray-400 text-sm">/ 5</span>
              </div>
            </div>
            <div className="space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada ulasan untuk venue ini.</p>
              ) : reviews.map((r: any) => (
                <div key={r.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {r.user?.fullName?.substring(0, 2).toUpperCase() || r.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.user?.fullName || r.user?.name}</p>
                      <div className="flex items-center gap-2">
                        <Stars rating={r.rating} />
                        <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clean Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-white rounded-2xl border border-gray-100 shadow-xl p-6 space-y-6">
            {/* Price Header */}
            <div className="text-center pb-5 border-b border-gray-100">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tarif Sewa</p>
              <div className="mt-1">
                <p className="text-3xl font-extrabold text-[#16A34A]">
                  {hasPriceRange
                    ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                    : formatPrice(minPrice || venue.pricePerHour || 0)}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  per jam bermain {hasPriceRange ? '(berdasarkan jenis lapangan & jam)' : ''}
                </p>
              </div>
            </div>

            {/* Quick Venue Overview */}
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-[#16A34A]" /> Jam Buka
                </span>
                <span className="font-bold text-gray-900">
                  {venue.openTime || "07:00"} - {venue.closeTime || "23:00"} WIB
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="flex items-center gap-2 font-medium">
                  <Building2 className="w-4 h-4 text-[#16A34A]" /> Tipe Arena
                </span>
                <span className="font-bold text-gray-900">
                  {venue.type || "Indoor"}
                </span>
              </div>

              {courts.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="flex items-center gap-2 font-medium">
                    <Award className="w-4 h-4 text-[#16A34A]" /> Pilihan Lapangan
                  </span>
                  <span className="font-bold text-gray-900">
                    {courts.filter((c: any) => c.isActive).length} Lapangan Aktif
                  </span>
                </div>
              )}
            </div>

            {/* Benefit Highlights */}
            <div className="p-4 bg-green-50/70 rounded-xl border border-green-100 space-y-2.5">
              <p className="text-xs font-bold text-green-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#16A34A]" /> Keuntungan Booking di Lapang.in:
              </p>
              <ul className="text-xs text-green-800 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>Pilih jadwal, lapangan & durasi bermain secara leluasa</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>Konfirmasi instan & slot langsung terkunci resmi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>Pembayaran aman otomatis (QRIS, VA, E-Wallet, Kartu)</span>
                </li>
              </ul>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2 pt-1">
              <GreenButton 
                onClick={() => handleBookNow()} 
                className="w-full py-4 text-base font-bold shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 group hover:shadow-green-600/40 transition-all"
              >
                <span>Booking Lapangan Sekarang</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GreenButton>
              <p className="text-center text-[11px] text-gray-400">
                Pilih lapangan, tanggal & jam bermain di sesi booking
              </p>
            </div>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-1.5 text-center text-gray-400 text-[11px] pt-2 border-t border-gray-100">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span>Garansi transaksi aman & resmi Lapang.in</span>
            </div>
          </div>
        </div>
      </div>

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function VenueDetailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Memuat detail venue...</div>}>
      <VenueDetailContent />
    </Suspense>
  );
}
