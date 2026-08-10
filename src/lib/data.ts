import {
  SunMedium, ShieldCheck, Lock, Droplets, Compass, Coffee, Users, Car, Wifi
} from "lucide-react";
import React from "react";

export const FACILITY_MAP: Record<string, { label: string; Icon: React.FC<{ className?: string }> }> = {
  lighting:   { label: "Pencahayaan Lampu Sorot",         Icon: SunMedium },
  safety_net: { label: "Jaring Pengaman & Papan Skor",   Icon: ShieldCheck },
  locker:     { label: "Ruang Ganti & Loker Storage",    Icon: Lock },
  shower:     { label: "Kamar Mandi, Shower & Toilet",   Icon: Droplets },
  mosque:     { label: "Musholla & Tempat Wudhu",        Icon: Compass },
  cafeteria:  { label: "Kantin & Mini Cafe",             Icon: Coffee },
  tribune:    { label: "Tribun & Area Duduk Penonton",   Icon: Users },
  parking:    { label: "Area Parkir Motor & Mobil",      Icon: Car },
  wifi:       { label: "Akses WiFi & Colokan Listrik",   Icon: Wifi },
  // Backward compatibility aliases
  ac:         { label: "Akses WiFi & Colokan Listrik",   Icon: Wifi },
  canteen:    { label: "Kantin & Mini Cafe",             Icon: Coffee },
  musholla:   { label: "Musholla & Tempat Wudhu",        Icon: Compass },
};

export const MONTHS = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];

export function formatPrice(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
