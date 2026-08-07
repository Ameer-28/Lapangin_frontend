"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function GreenButton({ 
  children, 
  onClick, 
  className = "", 
  type = "button" 
}: {
  children: React.ReactNode; 
  onClick?: React.MouseEventHandler<HTMLButtonElement>; 
  className?: string; 
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn("bg-[#16A34A] hover:bg-[#15803d] active:bg-[#166534] text-white font-semibold rounded-xl transition-colors", className)}
    >
      {children}
    </button>
  );
}
