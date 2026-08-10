import {
  SunMedium, ShieldCheck, Lock, Droplets, Compass, Coffee, Users, Car, Wifi
} from "lucide-react";
import React from "react";

export const FACILITY_MAP: Record<string, { label: string; Icon: React.FC<{ className?: string }> }> = {
  lighting:   { label: "Lampu Sorot",        Icon: SunMedium },
  safety_net: { label: "Jaring & Skor",      Icon: ShieldCheck },
  locker:     { label: "Ruang Ganti & Loker",Icon: Lock },
  shower:     { label: "Shower & Toilet",    Icon: Droplets },
  mosque:     { label: "Musholla",           Icon: Compass },
  cafeteria:  { label: "Kantin",             Icon: Coffee },
  tribune:    { label: "Tribun",             Icon: Users },
  parking:    { label: "Parkir",             Icon: Car },
  wifi:       { label: "WiFi & Listrik",     Icon: Wifi },
  // Backward compatibility aliases
  ac:         { label: "WiFi & Listrik",     Icon: Wifi },
  canteen:    { label: "Kantin",             Icon: Coffee },
  musholla:   { label: "Musholla",           Icon: Compass },
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
