"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Heart, Award, Clock, Star, Check } from "lucide-react";
import { GreenButton } from "@/components/ui/GreenButton";
import { Stars } from "@/components/ui/Stars";
import { formatPrice, FACILITY_MAP } from "@/lib/data";
import { cn as cx } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";
import { PopupModal, PopupType } from "@/components/ui/PopupModal";

const TIME_SLOTS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];

export default function VenueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [venue, setVenue] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [selSlot, setSelSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
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
    fetchTimeSlots();
  }, [id]);

  const fetchVenue = async () => {
    try {
      const res = await api.get(`/venues/${id}`);
      setVenue(res.data.data || res.data);
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

  const fetchTimeSlots = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/venues/${id}/time-slots`, {
        params: { date: today }
      });
      const raw = res.data;
      setBookedSlots(Array.isArray(raw) ? raw : (raw?.bookedSlots || raw?.data?.bookedSlots || raw?.data || []));
    } catch (err) {
      console.error(err);
    }
  };

  const checkFavorite = async () => {
    try {
      const res = await api.get(`/favorites/${id}/check`);
      setLiked(res.data?.isFavorite || res.data?.data?.isFavorite || false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async () => {
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

  if (!venue) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div>
      <Link href="/venues" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors w-fit">
        <ChevronLeft className="w-4 h-4" /> Back to Browse
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
        {/* Left */}
        <div className="lg:col-span-2 space-y-7">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1"><MapPin className="w-4 h-4 text-[#16A34A]" />{venue.location || venue.address ? `${venue.location || venue.address}, ` : ''}{venue.city}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Stars rating={venue.rating || 0} size="md" />
                <span className="text-gray-700 text-sm font-semibold">{venue.rating || 0}</span>
                <span className="text-gray-400 text-sm">({venue.reviewCount || venue.reviews || venue.reviewsCount || 0} reviews)</span>
                <span className={cx("text-xs font-bold px-2.5 py-1 rounded-full", venue.type === "Indoor" ? "bg-green-100 text-[#16A34A]" : "bg-yellow-100 text-yellow-700")}>{venue.type}</span>
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> Jam Buka: {venue.openTime || "07:00"} - {venue.closeTime || "23:00"}
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
            <h2 className="font-bold text-gray-900 mb-3">About this venue</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{venue.description || "No description provided."}</p>
          </div>

          {/* Facilities */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Facilities</h2>
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
              <h2 className="font-bold text-gray-900">Reviews</h2>
              <div className="flex items-center gap-1.5"><Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /><span className="font-bold text-gray-900">{venue.rating || 0}</span><span className="text-gray-400 text-sm">/ 5</span></div>
            </div>
            <div className="space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              ) : reviews.map((r: any) => (
                <div key={r.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-full flex items-center justify-center text-white text-xs font-bold">{r.user?.fullName?.substring(0, 2).toUpperCase() || r.user?.name?.substring(0, 2).toUpperCase() || 'U'}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.user?.fullName || r.user?.name}</p>
                      <div className="flex items-center gap-2"><Stars rating={r.rating} /><span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Booking card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
            <div className="text-center mb-5 pb-5 border-b border-gray-50">
              <p className="text-gray-400 text-sm">Starting from</p>
              <p className="text-3xl font-bold text-[#16A34A] mt-1">{formatPrice(venue.pricePerHour || venue.price || 0)}</p>
              <p className="text-gray-400 text-sm">per hour</p>
            </div>
            <div className="border-b border-gray-50 mb-5" />
            <GreenButton 
              onClick={() => {
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
                const today = new Date().toISOString().split('T')[0];
                router.push(`/bookings/new?venueId=${venue.id}&date=${today}`);
              }} 
              className="w-full py-4 text-base"
            >
              Book Now
            </GreenButton>
            <p className="text-center text-gray-400 text-xs mt-3">Free cancellation up to 2 hours before</p>
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
