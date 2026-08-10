import {
  Car, Droplets, Lock, Wifi, Coffee, Users, Wind
} from "lucide-react";
import React from "react";

export const FACILITY_MAP: Record<string, { label: string; Icon: React.FC<{ className?: string }> }> = {
  parking:   { label: "Parking",    Icon: Car },
  shower:    { label: "Shower",     Icon: Droplets },
  locker:    { label: "Locker",     Icon: Lock },
  wifi:      { label: "Free WiFi",  Icon: Wifi },
  cafeteria: { label: "Cafeteria",  Icon: Coffee },
  tribune:   { label: "Tribune",    Icon: Users },
  ac:        { label: "AC Lounge",  Icon: Wind },
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
