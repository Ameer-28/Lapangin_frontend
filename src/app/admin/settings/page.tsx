"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const DEFAULT_SETTINGS: Record<string, { key: string; label: string; value: string; type: "text" | "toggle" | "select"; options?: string[] }[]> = {
  general: [
    { key: "site_name", label: "Site Name", value: "Lapang.in", type: "text" },
    { key: "site_description", label: "Site Description", value: "Futsal Field Booking Platform", type: "text" },
    { key: "contact_email", label: "Contact Email", value: "admin@lapang.in", type: "text" },
    { key: "contact_phone", label: "Contact Phone", value: "+62 812-3456-7890", type: "text" },
    { key: "currency", label: "Currency", value: "IDR", type: "text" },
    { key: "timezone", label: "Timezone", value: "Asia/Jakarta", type: "text" },
  ],
  payment: [
    { key: "payment_gateway", label: "Payment Gateway", value: "Midtrans", type: "text" },
    { key: "midtrans_mode", label: "Midtrans Mode", value: "Sandbox", type: "select", options: ["Sandbox", "Production"] },
    { key: "service_fee", label: "Service Fee (Rp)", value: "5000", type: "text" },
    { key: "auto_cancel_minutes", label: "Auto Cancel (minutes)", value: "30", type: "text" },
    { key: "refund_policy", label: "Refund Policy", value: "No refund after booking confirmed", type: "text" },
  ],
  notification: [
    { key: "email_enabled", label: "Email Notifications", value: "true", type: "toggle" },
    { key: "booking_alerts", label: "Booking Alerts", value: "true", type: "toggle" },
    { key: "cancellation_alerts", label: "Cancellation Alerts", value: "true", type: "toggle" },
    { key: "payment_alerts", label: "Payment Alerts", value: "true", type: "toggle" },
    { key: "daily_report", label: "Daily Report Email", value: "false", type: "toggle" },
    { key: "low_availability_warning", label: "Low Availability Warning", value: "true", type: "toggle" },
  ],
  security: [
    { key: "max_login_attempts", label: "Max Login Attempts", value: "5", type: "text" },
    { key: "session_timeout", label: "Session Timeout (hours)", value: "24", type: "text" },
    { key: "password_min_length", label: "Password Min Length", value: "8", type: "text" },
    { key: "two_factor_auth", label: "Two-Factor Authentication", value: "false", type: "toggle" },
    { key: "rate_limiting", label: "API Rate Limiting", value: "true", type: "toggle" },
  ],
};

import { PopupModal, PopupType } from "@/components/ui/PopupModal";

export default function AdminSettings() {
  const [localSettings, setLocalSettings] = useState<Record<string, Record<string, string>>>({});
  const [dbSettings, setDbSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/admin/settings");
      const raw = res.data;
      const items = Array.isArray(raw) ? raw : (raw?.data || []);
      setDbSettings(items);

      // Merge DB settings into defaults
      const merged: Record<string, Record<string, string>> = {};
      for (const [cat, fields] of Object.entries(DEFAULT_SETTINGS)) {
        merged[cat] = {};
        for (const field of fields) {
          const dbMatch = items.find((s: any) => s.key === field.key);
          merged[cat][field.key] = dbMatch ? dbMatch.value : field.value;
        }
      }
      setLocalSettings(merged);
    } catch (error) {
      console.error("Failed to load settings", error);
      // Use defaults
      const merged: Record<string, Record<string, string>> = {};
      for (const [cat, fields] of Object.entries(DEFAULT_SETTINGS)) {
        merged[cat] = {};
        for (const field of fields) {
          merged[cat][field.key] = field.value;
        }
      }
      setLocalSettings(merged);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "payment", label: "Payment" },
    { id: "notification", label: "Notifications" },
    { id: "security", label: "Security" },
  ];

  const updateSetting = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tabSettings = localSettings[activeTab] || {};
      const toSave = Object.entries(tabSettings).map(([key, value]) => {
        const existing = dbSettings.find(s => s.key === key);
        return { key, value, id: existing?.id, category: activeTab };
      });

      await Promise.all(
        toSave.map(s => {
          if (s.id) {
            return api.patch(`/admin/settings/${s.id}`, { value: s.value });
          } else {
            return api.post(`/admin/settings`, { key: s.key, value: s.value, category: s.category }).catch(() => {});
          }
        })
      );
      setPopup({
        isOpen: true,
        type: "success",
        title: "Pengaturan Disimpan",
        message: "Perubahan sistem berhasil disimpan ke database."
      });
      fetchSettings();
    } catch (error) {
      console.error("Failed to save settings", error);
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Menyimpan",
        message: "Terjadi kesalahan saat menyimpan pengaturan sistem."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const currentFields = DEFAULT_SETTINGS[activeTab] || [];

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === t.id ? "bg-[#16A34A] text-white shadow" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{tabs.find(t => t.id === activeTab)?.label} Settings</h2>
            <p className="text-gray-400 text-sm mt-0.5">Manage your {activeTab} configuration</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchSettings}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803d] disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {currentFields.map(field => (
            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="text-sm font-semibold text-gray-700 sm:w-52 shrink-0">
                {field.label}
              </label>
              {field.type === "toggle" ? (
                <button
                  onClick={() => updateSetting(field.key, (localSettings[activeTab]?.[field.key] || field.value) === "true" ? "false" : "true")}
                  className={cn(
                    "relative w-12 h-7 rounded-full transition-colors",
                    (localSettings[activeTab]?.[field.key] || field.value) === "true" ? "bg-[#16A34A]" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform",
                    (localSettings[activeTab]?.[field.key] || field.value) === "true" ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              ) : field.type === "select" ? (
                <select
                  value={localSettings[activeTab]?.[field.key] || field.value}
                  onChange={e => updateSetting(field.key, e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all"
                >
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={localSettings[activeTab]?.[field.key] || field.value}
                  onChange={e => updateSetting(field.key, e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
