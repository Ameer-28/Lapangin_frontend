"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, Award, Tag, 
  CheckCircle, Minus, Plus, CreditCard, Building2, QrCode, 
  Wallet, Check, Download 
} from "lucide-react";
import api from "@/lib/api";
import { formatPrice, MONTHS, getDaysInMonth, getFirstDayOfMonth } from "@/lib/data";
import { GreenButton } from "@/components/ui/GreenButton";
import { cn } from "@/lib/utils";

export default function BookingPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueId = searchParams.get("venueId");

  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selDate, setSelDate] = useState(today.getDate());
  
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);

  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [method, setMethod] = useState<string>("card");
  const [step, setStep] = useState<"booking" | "payment" | "success">("booking");
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  useEffect(() => {
    if (!venueId) return;
    const fetchVenue = async () => {
      try {
        const res = await api.get(`/venues/${venueId}`);
        setVenue(res.data.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [venueId]);

  useEffect(() => {
    if (!venueId) return;
    const fetchSlots = async () => {
      try {
        const d = String(selDate).padStart(2, '0');
        const m = String(month + 1).padStart(2, '0');
        const res = await api.get(`/venues/${venueId}/time-slots?date=${year}-${m}-${d}`);
        const raw = res.data;
        setTimeSlots(Array.isArray(raw) ? raw : (raw?.data || []));
      } catch (err) {
        console.error(err);
      }
    };
    fetchSlots();
  }, [venueId, selDate, month, year]);

  if (loading || !venue) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const price = venue.pricePerHour || venue.price || 0;
  const subtotal = price * duration;
  const discountAmount = subtotal * discountPercent;
  const serviceFee = 5000;
  const total = subtotal - discountAmount + serviceFee;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleApplyPromo = async () => {
    try {
      const res = await api.post("/promo-codes/validate", { code: promo });
      setPromoApplied(true);
      setDiscountPercent((res.data.discount || res.data.discountPct || 0) / 100);
    } catch (err) {
      alert("Invalid promo code");
      setPromoApplied(false);
      setDiscountPercent(0);
    }
  };

  const loadSnapScript = (isProdServer?: boolean, key?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const clientKey = key || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "Mid-client-wGTEfERQ2q9RTPQN";
      const isProd = isProdServer !== undefined
        ? isProdServer
        : (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" || !clientKey.startsWith("SB-"));

      const targetSnapUrl = isProd
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

      const existingScript = document.querySelector('script[src*="snap/snap.js"]');
      if (existingScript) {
        const currentSrc = existingScript.getAttribute("src") || "";
        if (currentSrc === targetSnapUrl && (window as any).snap) {
          return resolve(true);
        }
        existingScript.remove();
        delete (window as any).snap;
      }

      const script = document.createElement("script");
      script.src = targetSnapUrl;
      script.setAttribute("data-client-key", clientKey);
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleConfirmPay = async () => {
    if (!selTime) {
      alert("Please select a time slot");
      return;
    }
    try {
      const d = String(selDate).padStart(2, '0');
      const m = String(month + 1).padStart(2, '0');
      const res = await api.post("/bookings", {
        venueId: venueId,
        date: `${year}-${m}-${d}`,
        startTime: selTime,
        durationHours: duration,
        paymentMethod: method,
        promoCode: promoApplied ? promo : undefined
      });

      const booking = res.data.data || res.data;

      try {
        const snapRes = await api.post("/payments/create-snap-token", {
          bookingId: booking.id
        });
        const snapData = snapRes.data;
        const snapToken = snapData?.snapToken || snapData?.token;
        const isProdServer = snapData?.isProduction;
        const serverClientKey = snapData?.clientKey;

        // Dynamically load the EXACT matching Midtrans SDK for this token
        await loadSnapScript(isProdServer, serverClientKey);

        if (typeof window !== "undefined" && (window as any).snap && snapToken) {
          (window as any).snap.pay(snapToken, {
            onSuccess: function (result: any) {
              setBookingSuccessData(booking);
              setStep("success");
            },
            onPending: function (result: any) {
              setBookingSuccessData(booking);
              setStep("success");
            },
            onError: function (result: any) {
              alert("Payment failed: " + (result?.status_message || "Transaction error"));
              setBookingSuccessData(booking);
              setStep("success");
            },
            onClose: function () {
              setBookingSuccessData(booking);
              setStep("success");
            }
          });
        } else if (snapRes.data?.redirectUrl) {
          window.location.href = snapRes.data.redirectUrl;
        } else {
          setBookingSuccessData(booking);
          setStep("success");
        }
      } catch (snapErr: any) {
        console.error("Midtrans Snap error:", snapErr);
        let errMsg = snapErr.response?.data?.message || snapErr.message || "Payment gateway credential error";
        if (errMsg.includes("Unauthorized") || errMsg.includes("401") || errMsg.includes("client or server key")) {
          errMsg = "Midtrans credentials on server need verification (401 Unauthorized). Booking created as pending.";
        }
        alert("Payment Gateway: " + errMsg);
        setBookingSuccessData(booking);
        setStep("success");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create booking");
      console.error(err);
    }
  };

  const methods = [
    { id: "card",     label: "Credit / Debit Card", Icon: CreditCard,  desc: "Visa, Mastercard, JCB" },
    { id: "bank",     label: "Bank Transfer",        Icon: Building2,   desc: "BCA, Mandiri, BNI, BRI" },
    { id: "qris",     label: "QRIS",                 Icon: QrCode,      desc: "Scan with any e-wallet app" },
    { id: "ewallet",  label: "E-Wallet",              Icon: Wallet,      desc: "GoPay, OVO, DANA, ShopeePay" },
  ];

  if (step === "success" && bookingSuccessData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 mb-6">Your futsal session has been successfully booked.</p>

          <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Booking Code</span><span className="font-bold text-gray-900">{bookingSuccessData.bookingCode || bookingSuccessData.id || "BK-NEW"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Venue</span><span className="font-semibold text-gray-800">{venue.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-800">{bookingSuccessData.date ? new Date(bookingSuccessData.date).toLocaleDateString() : `${selDate}/${month+1}/${year}`}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Time</span><span className="font-semibold text-gray-800">{bookingSuccessData.startTime || selTime}</span></div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-3"><span className="text-gray-500 font-semibold font-medium">Total Paid</span><span className="font-bold text-[#16A34A] text-base">{formatPrice(bookingSuccessData.total || bookingSuccessData.totalPrice || total)}</span></div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors">
              <Download className="w-4 h-4" /> Receipt
            </button>
            <GreenButton onClick={() => router.push("/history")} className="flex-1 py-3 text-sm">My Bookings</GreenButton>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleNextStep = () => {
    if (step === "booking") setStep("payment");
  };

  return (
    <div>
      <button onClick={() => { if (step === "payment") setStep("booking"); else router.back(); }} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back {step === "payment" ? "to Booking" : "to Venue"}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{step === "booking" ? "Book Your Session" : "Payment"}</h1>
      {step === "booking" && <p className="text-gray-500 text-sm mb-8">{venue.name} · {venue.city}</p>}

      {step === "booking" && (
        <div className="flex items-center gap-2 mb-8">
          {["Select Date & Time","Duration","Confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", i === 0 ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-400")}>{i + 1}</div>
              <span className={cn("text-sm font-medium hidden sm:block", i === 0 ? "text-[#16A34A]" : "text-gray-400")}>{s}</span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === "booking" ? (
            <>
              {/* Calendar */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900">Select Date</h2>
                  <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center">{MONTHS[month]} {year}</span>
                    <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const isPast = year === today.getFullYear() && month === today.getMonth() && d < today.getDate();
                    const isSelected = d === selDate && year === today.getFullYear() && month === today.getMonth();
                    const isToday = d === today.getDate() && year === today.getFullYear() && month === today.getMonth();
                    return (
                      <button key={d} disabled={isPast} onClick={() => setSelDate(d)}
                        className={cn("aspect-square rounded-xl text-sm font-medium transition-all flex items-center justify-center",
                          isPast    ? "text-gray-200 cursor-not-allowed" :
                          isSelected ? "bg-[#16A34A] text-white shadow-md" :
                          isToday   ? "bg-green-50 text-[#16A34A] border border-[#16A34A]" :
                                      "text-gray-700 hover:bg-green-50 hover:text-[#16A34A]"
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4">Select Start Time</h2>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {timeSlots.length === 0 ? (
                    <div className="col-span-4 sm:col-span-8 text-sm text-gray-500">No time slots available for this date.</div>
                  ) : (
                    timeSlots.map(slot => {
                      const slotTime = slot.startTime || slot.time;
                      const booked = slot.isBooked ?? !slot.isAvailable;
                      const selected = selTime === slotTime;
                      return (
                        <button key={slotTime} disabled={booked} onClick={() => setSelTime(selected ? null : slotTime)}
                          className={cn("py-2.5 rounded-xl text-xs font-semibold transition-all",
                            booked   ? "bg-gray-100 text-gray-300 cursor-not-allowed" :
                            selected ? "bg-[#16A34A] text-white shadow-md" :
                                       "bg-green-50 text-[#16A34A] hover:bg-[#16A34A] hover:text-white"
                          )}
                        >
                          {slotTime}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4">Duration</h2>
                <div className="flex items-center gap-4">
                  <button onClick={() => setDuration(d => Math.max(1, d - 1))} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-2xl font-bold text-gray-900 min-w-[60px] text-center">{duration}h</span>
                  <button onClick={() => setDuration(d => Math.min(4, d + 1))} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-gray-400 text-sm ml-2">Max 4 hours per booking</span>
                </div>
                <div className="flex gap-3 mt-4">
                  {[1,2,3,4].map(h => (
                    <button key={h} onClick={() => setDuration(h)}
                      className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        duration === h ? "bg-[#16A34A] text-white" : "bg-gray-50 text-gray-600 hover:bg-green-50"
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4">Promo Code</h2>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} placeholder="e.g. FUTSAL10"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    className="px-5 py-3 bg-[#16A34A] text-white rounded-xl text-sm font-semibold hover:bg-[#15803d] transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && (
                  <div className="mt-3 flex items-center gap-2 text-[#16A34A] text-sm">
                    <CheckCircle className="w-4 h-4" /> {discountPercent * 100}% discount applied!
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Select Payment Method</h2>
              <div className="space-y-3">
                {methods.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                      method === m.id ? "border-[#16A34A] bg-green-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", method === m.id ? "bg-[#16A34A]" : "bg-gray-100")}>
                      <m.Icon className={cn("w-5 h-5", method === m.id ? "text-white" : "text-gray-500")} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{m.desc}</p>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      method === m.id ? "border-[#16A34A] bg-[#16A34A]" : "border-gray-300"
                    )}>
                      {method === m.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-white rounded-2xl border border-gray-100 shadow-lg p-6 space-y-5">
            <h2 className="font-bold text-gray-900">Booking Summary</h2>

            <div className="flex gap-3">
              <div className="w-16 h-14 rounded-xl bg-green-100 overflow-hidden shrink-0">
                <img src={venue.imageUrl || venue.image || "https://images.unsplash.com/photo-1574629810360-7efbb192563a?auto=format&fit=crop&q=80"} alt={venue.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{venue.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{venue.city}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-[#16A34A]" />
                {MONTHS[month]} {selDate}, {year}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-[#16A34A]" />
                {selTime ? selTime : "Not selected"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="w-4 h-4 text-[#16A34A]" />
                {duration} hour{duration > 1 ? "s" : ""}
              </div>
            </div>

            <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>{formatPrice(price)} × {duration}h</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Promo {promo}</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Service Fee</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2.5">
                <span>Total</span>
                <span className="text-[#16A34A]">{formatPrice(total)}</span>
              </div>
            </div>

            {step === "booking" ? (
              <GreenButton onClick={handleNextStep} className="w-full py-4 text-base">
                Continue to Payment
              </GreenButton>
            ) : (
              <GreenButton onClick={handleConfirmPay} className="w-full py-4 text-base">
                Confirm & Pay
              </GreenButton>
            )}

            <p className="text-center text-gray-400 text-xs">Free cancellation · Secure payment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
