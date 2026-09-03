"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ChevronLeft, MapPin, Heart, Clock, Star, 
  Calendar as CalendarIcon, AlertTriangle, CheckCircle2, Shield, Award
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

  const todayStr = new Date().toISOString().split("T")[0];
  const paramDate = searchParams.get("date");
  const paramTime = searchParams.get("time");
  const paramCourt = searchParams.get("courtId");

  const [venue, setVenue] = useState<any>(null);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(paramCourt || "");
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  
  // Date & Slot Selection
  const [selectedDate, setSelectedDate] = useState<string>(paramDate || todayStr);
  const [selSlot, setSelSlot] = useState<string | null>(paramTime || null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

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

  useEffect(() => {
    if (id && selectedDate && selectedCourtId) {
      fetchTimeSlots(selectedDate, selectedCourtId);
    }
  }, [id, selectedDate, selectedCourtId]);

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

  const fetchTimeSlots = async (dateStr: string, courtIdStr?: string) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/venues/${id}/slots`, {
        params: { 
          date: dateStr,
          ...(courtIdStr ? { courtId: courtIdStr } : {})
        }
      });
      const raw = res.data;
      const slotList = Array.isArray(raw) ? raw : (raw?.data || []);
      setSlots(slotList);
    } catch (err) {
      console.error("Failed to load time slots", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
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

  // Helper date pills: today, tomorrow, day after
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const currentCourt = courts.find(c => c.id === selectedCourtId) || courts[0];
  const activeCourtPrice = currentCourt?.pricePerHour ?? (venue?.pricePerHour || venue?.price || 0);

  const handleBookNow = () => {
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

    const q = new URLSearchParams();
    q.set("venueId", venue.id);
    if (selectedCourtId) {
      q.set("courtId", selectedCourtId);
    }
    q.set("date", selectedDate);
    if (selSlot) {
      q.set("time", selSlot);
    }

    router.push(`/bookings/new?${q.toString()}`);
  };

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
                        setSelSlot(null);
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

        {/* Right Column: Interactive Court, Date & Slot Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-white rounded-2xl border border-gray-100 shadow-xl p-6 space-y-5">
            {/* Price Header */}
            <div className="text-center pb-4 border-b border-gray-100">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tarif Sewa</p>
              {(() => {
                const availablePrices = slots.filter((s: any) => !s.isBooked && s.price).map((s: any) => s.price);
                const minP = availablePrices.length > 0 ? Math.min(...availablePrices) : activeCourtPrice;
                const maxP = availablePrices.length > 0 ? Math.max(...availablePrices) : activeCourtPrice;
                const hasRange = minP !== maxP;

                return (
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] mt-1">
                      {hasRange ? `${formatPrice(minP)} - ${formatPrice(maxP)}` : formatPrice(activeCourtPrice)}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      per jam bermain {hasRange ? '(tarif dinamis/peak)' : ''}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Court Selection */}
            {courts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#16A34A]" /> Pilih Lapangan
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {courts.filter(c => c.isActive).length} aktif
                  </span>
                </div>

                <div className="space-y-1.5">
                  {courts.map((court: any) => {
                    const isSelected = selectedCourtId === court.id;
                    const courtPrice = court.pricePerHour ?? venue.pricePerHour;
                    return (
                      <button
                        key={court.id}
                        type="button"
                        disabled={!court.isActive}
                        onClick={() => {
                          setSelectedCourtId(court.id);
                          setSelSlot(null);
                        }}
                        className={cx(
                          "w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                          !court.isActive
                            ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                            : isSelected
                              ? "bg-green-50 border-[#16A34A] ring-1 ring-[#16A34A] shadow-sm"
                              : "bg-gray-50/70 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={cx("text-xs font-bold", isSelected ? "text-green-900" : "text-gray-900")}>
                              {court.name}
                            </span>
                            <span className={cx(
                              "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                              court.courtType?.includes("Rumput") ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            )}>
                              {court.courtType || "Vinyl"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-[#16A34A]">{formatPrice(courtPrice)}</span>
                          <span className="text-[9px] text-gray-400 block">/jam</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#16A34A]" /> Pilih Tanggal
                </label>
                <span className="text-[11px] text-[#16A34A] font-semibold">
                  {new Date(selectedDate).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </div>

              {/* Quick Date Pills */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                {[
                  { label: "Hari Ini", val: todayStr },
                  { label: "Besok", val: tomorrowStr },
                  { label: "Lusa", val: dayAfterStr },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setSelectedDate(p.val);
                      setSelSlot(null);
                    }}
                    className={cx(
                      "py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center",
                      selectedDate === p.val
                        ? "bg-[#16A34A] text-white border-[#16A34A] shadow-sm shadow-green-600/20"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Picker */}
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={e => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setSelSlot(null);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#16A34A] focus:bg-white transition-all"
              />
            </div>

            {/* Time Slot Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#16A34A]" /> Ketersediaan Slot
                </label>
                {loadingSlots ? (
                  <span className="text-[11px] text-gray-400">Memeriksa slot...</span>
                ) : (
                  <span className="text-[11px] text-gray-500 font-medium">
                    {slots.filter(s => !s.isBooked).length} slot tersedia
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
                {loadingSlots ? (
                  <div className="col-span-3 py-6 text-center text-xs text-gray-400">
                    Memuat jadwal lapangan...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="col-span-3 py-6 text-center text-xs text-gray-400">
                    Tidak ada jadwal operasional pada tanggal ini.
                  </div>
                ) : (
                  slots.map((s: any) => {
                    const isSelected = selSlot === s.startTime;
                    const isUnavailable = s.isBooked;

                    return (
                      <button
                        key={s.id || s.startTime}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => setSelSlot(s.startTime)}
                        title={s.isClosed ? `Tutup: ${s.closureReason || 'Operasional'}` : isUnavailable ? 'Sudah dibooking' : `${s.pricingRule ? s.pricingRule + ': ' : ''}${formatPrice(s.price || activeCourtPrice)}`}
                        className={cx(
                          "py-2 px-1.5 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center",
                          isUnavailable
                            ? "bg-red-50 text-red-400 border-red-100 cursor-not-allowed line-through opacity-70"
                            : isSelected
                              ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-green-600/30 scale-[1.02]"
                              : "bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50/50"
                        )}
                      >
                        <span>{s.startTime}</span>
                        {!isUnavailable && s.price && (
                          <span className={cx(
                            "text-[9px] font-bold mt-0.5",
                            isSelected ? "text-green-100" : s.pricingRule ? "text-purple-600" : "text-gray-400"
                          )}>
                            {Math.round(s.price / 1000)}k
                            {s.pricingRule && <span className="ml-0.5 font-normal">★</span>}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Slot Status Legend */}
              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 px-1">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-white border border-gray-300" />
                  <span>Tersedia</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-[#16A34A]" />
                  <span>Dipilih</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-purple-600 font-bold text-[9px]">★</span>
                  <span>Tarif Khusus</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-red-100 border border-red-200" />
                  <span>Penuh</span>
                </div>
              </div>
            </div>

            {/* Booking Summary Box */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Lapangan:</span>
                <span className="font-semibold text-gray-900">
                  {currentCourt?.name || 'Lapangan 1 (Utama)'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tanggal:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Jam:</span>
                <span className={cx("font-bold", selSlot ? "text-[#16A34A]" : "text-amber-600")}>
                  {selSlot ? `${selSlot} WIB` : "Belum dipilih"}
                </span>
              </div>
              {selSlot && (() => {
                const slotObj = slots.find((s: any) => s.startTime === selSlot);
                const slotPrice = slotObj?.price ?? activeCourtPrice;
                return (
                  <div className="flex justify-between text-gray-600 border-t border-gray-200/50 pt-1.5">
                    <span>Estimasi Tarif:</span>
                    <span className="font-bold text-[#16A34A]">
                      {formatPrice(slotPrice)}
                      {slotObj?.pricingRule && (
                        <span className="ml-1 text-[10px] text-purple-700 font-semibold bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                          {slotObj.pricingRule}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Action Button */}
            <GreenButton 
              onClick={handleBookNow} 
              className="w-full py-3.5 text-sm font-bold shadow-lg shadow-green-600/30"
            >
              {selSlot ? `Lanjut Booking (${selSlot})` : "Pilih Slot & Lanjut Booking"}
            </GreenButton>

            <div className="flex items-center justify-center gap-1.5 text-center text-gray-400 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span>Garansi transaksi aman & konfirmasi instan</span>
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
