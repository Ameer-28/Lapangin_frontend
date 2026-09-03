"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Check, Heart, MapPin } from "lucide-react";
import { GreenButton } from "@/components/ui/GreenButton";
import { Stars } from "@/components/ui/Stars";
import { formatPrice } from "@/lib/data";
import { cn as cx } from "@/lib/utils";
import api from "@/lib/api";

export default function BrowseFieldsPage() {
  const router = useRouter();
  
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(250000);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [venues, setVenues] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchVenues();
  }, [query, typeFilter, minPrice, maxPrice, minRating]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchVenues = async () => {
    try {
      const params: any = { limit: 50 };
      if (query.trim()) params.search = query.trim();
      if (typeFilter.length === 1) params.type = typeFilter[0];
      if (minRating > 0) params.minRating = minRating;
      if (maxPrice > 0) params.maxPrice = maxPrice;

      const res = await api.get(`/venues`, { params });
      const raw = res.data;
      setVenues(Array.isArray(raw) ? raw : (raw?.data || []));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data.data?.map((f: any) => f.venueId) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (venueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (favorites.includes(venueId)) {
        await api.delete(`/favorites/${venueId}`);
        setFavorites(favorites.filter(id => id !== venueId));
      } else {
        await api.post(`/favorites/${venueId}`);
        setFavorites([...favorites, venueId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleType = (t: string) =>
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Fields</h1>
          <p className="text-gray-500 text-sm mt-1">{venues.length} venues available</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or city..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all text-gray-900 placeholder-gray-400"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={cx("flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
            showFilters ? "bg-[#16A34A] text-white border-[#16A34A]" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="w-full md:w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Field Type</h3>
              <div className="space-y-2">
                {["Indoor","Outdoor"].map(t => (
                  <label key={t} className="flex items-center gap-2.5 cursor-pointer">
                    <div onClick={() => toggleType(t)}
                      className={cx("w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                        typeFilter.includes(t) ? "bg-[#16A34A] border-[#16A34A]" : "border-gray-300"
                      )}
                    >
                      {typeFilter.includes(t) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-gray-700 text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Min. Rating</h3>
              <div className="space-y-1">
                {[0, 4.0, 4.5, 4.7, 4.9].map(r => (
                  <button key={r} onClick={() => setMinRating(r)}
                    className={cx("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      minRating === r ? "bg-green-50 text-[#16A34A] font-medium" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {r === 0 ? "All ratings" : `${r}+ stars`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Max Price / hr</h3>
              <input type="range" min={50000} max={250000} step={10000} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#16A34A]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Rp 50K</span>
                <span className="font-semibold text-[#16A34A]">{formatPrice(maxPrice)}</span>
              </div>
            </div>

            <button onClick={() => { setTypeFilter([]); setMinRating(0); setMaxPrice(250000); setQuery(""); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {venues.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No venues found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {venues.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/venues/${v.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg cursor-pointer group transition-all duration-300"
                >
                  <div className="relative h-44 bg-green-100 overflow-hidden">
                    <img src={v.imageUrl || v.image || v.gallery?.[0] || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop"} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={cx("text-xs font-bold px-2.5 py-1 rounded-full", v.type === "Indoor" ? "bg-[#16A34A] text-white" : "bg-[#FACC15] text-gray-900")}>{v.type}</span>
                      {v.isActive === false && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-800/80 text-gray-300">Inactive</span>}
                    </div>
                    <button onClick={e => toggleFavorite(v.id, e)} className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="w-4 h-4 text-gray-400" fill={favorites.includes(v.id) ? "#ef4444" : "none"} stroke={favorites.includes(v.id) ? "#ef4444" : "currentColor"} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 mb-1">{v.name}</p>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-3"><MapPin className="w-3.5 h-3.5" />{v.city || v.location}</div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5"><Stars rating={v.rating || 0} /><span className="text-gray-400 text-xs">({v.reviewCount || v.reviews || 0})</span></div>
                      <div><span className="font-bold text-[#16A34A] text-sm">{formatPrice(v.pricePerHour || v.price || 0)}</span><span className="text-gray-400 text-xs">/hr</span></div>
                    </div>
                    <GreenButton onClick={(e: any) => { e.stopPropagation(); router.push(`/venues/${v.id}`); }} className={cx("w-full py-2.5 text-sm", v.isActive === false && "opacity-50 cursor-not-allowed")} >
                      {v.isActive !== false ? "Book Now" : "Unavailable"}
                    </GreenButton>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
