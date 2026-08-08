"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Clock, Search, Zap, Shield, TrendingUp, ArrowRight, Heart } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GreenButton } from "@/components/ui/GreenButton";
import { Stars } from "@/components/ui/Stars";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const TESTIMONIALS = [
  { name: "Rizki Pratama", initials: "RP", role: "Regular Player", rating: 5, text: "Lapang.in made it so easy to find and book courts near me. The real-time availability feature saved me so many wasted trips!" },
  { name: "Siti Nurhaliza", initials: "SN", role: "Team Captain", rating: 5, text: "As a team captain, I love how simple it is to coordinate bookings for the whole squad. Scheduling 10 players has never been this painless." },
  { name: "Budi Santoso", initials: "BS", role: "Futsal Enthusiast", rating: 5, text: "Best futsal booking app in Indonesia! Great selection of venues, transparent pricing, and seamless payment options every time." },
];

const MOCK_VENUES = [
  { id: 1, name: "Arena Pro Futsal", city: "Jakarta Selatan", rating: 4.9, reviews: 248, price: 150000, type: "Indoor", image: "https://images.unsplash.com/photo-1559369064-c4d65141e408?w=600&h=400&fit=crop&auto=format" },
  { id: 2, name: "GreenField Futsal", city: "Jakarta Barat", rating: 4.7, reviews: 183, price: 120000, type: "Outdoor", image: "https://images.unsplash.com/photo-1762025721967-76b6280f8e04?w=600&h=400&fit=crop&auto=format" },
  { id: 3, name: "SportZone Premium", city: "Bandung", rating: 4.8, reviews: 312, price: 180000, type: "Indoor", image: "https://images.unsplash.com/photo-1763775468707-573c7cd6b0da?w=600&h=400&fit=crop&auto=format" },
];

const TIME_SLOTS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];

export default function LandingPage() {
  const [loc, setLoc]  = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venues, setVenues] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await api.get("/venues");
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
        setVenues(list.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch venues for landing page", err);
      }
    };
    fetchVenues();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-[#0a1a0a]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1768861171882-9bbfed55b6f9?w=1920&h=1080&fit=crop&auto=format')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#071810]/95 via-[#0F172A]/85 to-[#16A34A]/25" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#F8FAFC] to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 w-full">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#16A34A]/20 border border-[#16A34A]/40 text-[#4ADE80] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" /> Real-time Availability
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] mb-6 tracking-tight">
              Book Your Futsal Field{" "}
              <span className="text-[#4ADE80]">Anytime,</span>{" "}
              <span className="text-[#FACC15]">Anywhere</span>
            </h1>

            <p className="text-gray-300 text-lg sm:text-xl mb-10 max-w-2xl leading-relaxed">
              Discover and book premium futsal fields near you. Instant confirmation, secure payments, and live slot tracking.
            </p>

            {/* Search */}
            <div className="bg-white rounded-2xl p-3 shadow-2xl border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#16A34A]" />
                  <input
                    value={loc}
                    onChange={e => setLoc(e.target.value)}
                    placeholder="City or venue"
                    className="w-full pl-10 pr-3 py-3.5 bg-gray-50 rounded-xl text-sm placeholder-gray-400 text-gray-800 outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#16A34A]" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-3.5 bg-gray-50 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#16A34A]" />
                  <select
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full pl-10 pr-3 py-3.5 bg-gray-50 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-200 appearance-none"
                  >
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <GreenButton onClick={() => router.push(`/venues?search=${loc}`)} className="mt-2 w-full py-3.5 flex items-center justify-center gap-2 text-base">
                <Search className="w-5 h-5" /> Search Available Fields
              </GreenButton>
            </div>

            <div className="flex items-center gap-10 mt-9">
              {[["500+","Venues"],["50K+","Bookings"],["4.9★","Rating"]].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-bold text-white">{v}</div>
                  <div className="text-gray-400 text-sm">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Venues */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Venues</h2>
            <p className="text-gray-500 mt-1">Top-rated futsal fields loved by players</p>
          </div>
          <Link href="/venues" className="hidden sm:flex items-center gap-1.5 text-[#16A34A] font-semibold text-sm hover:gap-2.5 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => router.push(`/venues/${v.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 cursor-pointer group transition-all duration-300"
            >
              <div className="relative h-48 bg-green-100 overflow-hidden">
                <img src={v.imageUrl || v.image || "https://images.unsplash.com/photo-1574629810360-7efbb192563a?auto=format&fit=crop&q=80"} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3">
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", v.type === "Indoor" ? "bg-[#16A34A] text-white" : "bg-[#FACC15] text-gray-900")}>{v.type}</span>
                </div>
                <button onClick={e => e.stopPropagation()} className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <Heart className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-base mb-1">{v.name}</h3>
                <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {v.city}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Stars rating={v.rating || 0} />
                    <span className="text-gray-400 text-xs">({v.reviewCount ?? v.reviews ?? 0})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#16A34A] text-sm">{formatPrice(v.pricePerHour || v.price || 0)}</span>
                    <span className="text-gray-400 text-xs">/hr</span>
                  </div>
                </div>
                <GreenButton onClick={() => router.push(`/venues/${v.id}`)} className="mt-4 w-full py-2.5 text-sm">Book Now</GreenButton>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#0F172A] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Why Choose Lapang.in?</h2>
            <p className="text-gray-400">Everything you need for a perfect futsal experience</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icon: Zap,      title: "Easy Booking",             desc: "Book your preferred court in under 2 minutes — simple, fast, and completely hassle-free.", color: "#FACC15" },
              { Icon: Shield,   title: "Secure Payment",           desc: "Multiple payment methods with bank-grade security. Your transactions are always protected.", color: "#4ADE80" },
              { Icon: TrendingUp, title: "Real-time Availability", desc: "See live slot availability instantly. No more phone calls or showing up to a full court.", color: "#60A5FA" },
            ].map(({ Icon, title, desc, color }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${color}20` }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What Players Say</h2>
          <p className="text-gray-500">Join thousands of happy futsal enthusiasts</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
              <Stars rating={t.rating} size="md" />
              <p className="text-gray-600 mt-4 mb-6 leading-relaxed text-sm flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">{t.initials}</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-4 sm:mx-8 lg:mx-20 mb-20">
        <div className="relative bg-[#16A34A] rounded-3xl overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1716745559715-282bb61e3012?w=1200&h=400&fit=crop&auto=format')" }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-10 sm:p-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ready to Play?</h2>
              <p className="text-green-100">Join 50,000+ players already on Lapang.in</p>
            </div>
            <Link href="/register" className="shrink-0 bg-white text-[#16A34A] font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors text-sm sm:text-base">
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
