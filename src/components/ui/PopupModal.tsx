"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PopupType = "info" | "success" | "warning" | "error" | "confirm";

export interface PopupModalProps {
  isOpen: boolean;
  type?: PopupType;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export function PopupModal({
  isOpen,
  type = "info",
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Batal",
  onClose,
  onConfirm,
}: PopupModalProps) {
  if (!isOpen) return null;

  const defaultTitles: Record<PopupType, string> = {
    info: "Informasi",
    success: "Berhasil!",
    warning: "Perhatian",
    error: "Terjadi Kesalahan",
    confirm: "Konfirmasi Tindakan",
  };

  const modalTitle = title || defaultTitles[type];

  const iconMap = {
    info: <Info className="w-8 h-8 text-blue-500" />,
    success: <CheckCircle2 className="w-8 h-8 text-green-500" />,
    warning: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
    error: <XCircle className="w-8 h-8 text-red-500" />,
    confirm: <HelpCircle className="w-8 h-8 text-[#16A34A]" />,
  };

  const bgIconMap = {
    info: "bg-blue-50",
    success: "bg-green-50",
    warning: "bg-yellow-50",
    error: "bg-red-50",
    confirm: "bg-green-50",
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Badge */}
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
              bgIconMap[type]
            )}
          >
            {iconMap[type]}
          </div>

          {/* Title & Message */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{modalTitle}</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {type === "confirm" ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-5 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-colors text-sm"
                >
                  {confirmLabel}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-6 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-colors text-sm"
              >
                {confirmLabel}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
