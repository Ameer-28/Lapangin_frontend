"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function GreenButton({ 
  children, 
  onClick, 
  className = "", 
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode; 
  onClick?: React.MouseEventHandler<HTMLButtonElement>; 
  className?: string; 
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-[#16A34A] hover:bg-[#15803d] active:bg-[#166534] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
