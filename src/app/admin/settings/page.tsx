"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/admin/settings");
      const raw = res.data;
      setSettings(Array.isArray(raw) ? raw : (raw?.data || []));
    } catch (error) {
      console.error("Failed to load settings", error);
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

  const filteredSettings = settings.filter(s => s.category === activeTab);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = settings.filter(s => s.category === activeTab);
      await Promise.all(
        toSave.map(s => api.patch(`/admin/settings/${s.id}`, { value: s.value }))
      );
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

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

        {filteredSettings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-semibold">No settings configured for this category yet.</p>
            <p className="text-sm mt-1">Settings will appear here once configured in the database.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredSettings.map(s => (
              <div key={s.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <label className="text-sm font-semibold text-gray-700 sm:w-48 shrink-0">
                  {s.key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </label>
                <input
                  value={s.value}
                  onChange={e => updateSetting(s.key, e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
