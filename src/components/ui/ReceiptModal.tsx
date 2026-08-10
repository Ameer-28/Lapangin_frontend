"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, CheckCircle, Calendar, Clock, CreditCard, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/data";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function ReceiptModal({ isOpen, onClose, booking }: ReceiptModalProps) {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const bookingCode = booking.bookingCode || `#${String(booking.id).substring(0, 8)}`;
  const venueName = booking.venue?.name || booking.venueName || "Futsal Venue";
  const venueCity = booking.venue?.city || booking.city || "Malang";
  const userName = booking.user?.fullName || booking.user?.email || booking.userName || "Customer";
  const userEmail = booking.user?.email || "";
  const dateStr = booking.date ? new Date(booking.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-";
  const startTime = booking.startTime || "-";
  const duration = booking.durationHours || 1;
  
  // End time calculation
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = isNaN(startHour) ? "" : `${(startHour + duration).toString().padStart(2, '0')}:00`;
  const timeRangeStr = endHour ? `${startTime} - ${endHour} (${duration} jam)` : startTime;

  const subtotal = booking.subtotal ?? (booking.total ? booking.total - 5000 : 0);
  const discount = booking.discount ?? 0;
  const serviceFee = booking.serviceFee ?? 5000;
  const total = booking.total ?? booking.totalPrice ?? 0;
  const paymentMethod = booking.paymentMethod ? String(booking.paymentMethod).toUpperCase() : "E-WALLET / QRIS";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:w-full print:max-w-none"
        >
          {/* Header Bar */}
          <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between print:bg-white print:text-black print:p-0 print:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#16A34A] rounded-xl flex items-center justify-center font-bold text-white text-base print:border print:border-black print:text-black print:bg-transparent">
                L
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Lapang.in</h3>
                <p className="text-[10px] text-yellow-400 font-semibold tracking-wider uppercase print:text-gray-600">Official Booking Receipt</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-5 space-y-5 print:p-0">
            {/* Status & Code */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Booking Code</span>
                <p className="text-lg font-extrabold text-gray-900 tracking-tight">{bookingCode}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-extrabold rounded-full border border-green-200">
                  <CheckCircle className="w-3.5 h-3.5" /> LUNAS / PAID
                </span>
                <p className="text-[10px] text-gray-400 mt-1">Struk Resmi Lapang.in</p>
              </div>
            </div>

            {/* Customer & Venue Info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-2xl print:bg-transparent print:border print:border-gray-200">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Pemesan</p>
                <p className="font-bold text-gray-900 mt-0.5 truncate">{userName}</p>
                {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Venue</p>
                <p className="font-bold text-gray-900 mt-0.5 truncate">{venueName}</p>
                <p className="text-[11px] text-gray-500">{venueCity}</p>
              </div>
            </div>

            {/* Schedule details */}
            <div className="space-y-2 text-xs border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500"><Calendar className="w-3.5 h-3.5 text-[#16A34A]" /> Tanggal Main</span>
                <span className="font-bold text-gray-900">{dateStr}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500"><Clock className="w-3.5 h-3.5 text-[#16A34A]" /> Jam & Durasi</span>
                <span className="font-bold text-gray-900">{timeRangeStr}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500"><CreditCard className="w-3.5 h-3.5 text-[#16A34A]" /> Metode Bayar</span>
                <span className="font-bold text-gray-900">{paymentMethod}</span>
              </div>
            </div>

            {/* Price breakdown table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Sewa Lapangan ({duration} jam)</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Diskon Promo</span>
                  <span className="font-medium">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan</span>
                <span className="font-medium text-gray-900">{formatPrice(serviceFee)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-gray-900 text-base border-t-2 border-dashed border-gray-200 pt-3 mt-2">
                <span>Total Bayar</span>
                <span className="text-[#16A34A]">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Stamp & Notice */}
            <div className="flex items-center gap-2 bg-green-50/70 p-3 rounded-xl border border-green-100 text-[11px] text-green-800">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Pembayaran terverifikasi oleh sistem Lapang.in.</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-100 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 bg-[#16A34A] text-white font-semibold rounded-xl text-xs hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / Save PDF
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
