"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, PenLine, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function AdminVenues() {
  const [venues, setVenues] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchVenues();
  }, []);

  const editingVenue = venues.find(v => v.id === editId);

  useEffect(() => {
    if (editingVenue) {
      setImageUrl(editingVenue.imageUrl || editingVenue.image || "");
    } else {
      setImageUrl("");
    }
  }, [editId, showAdd]);

  const fetchVenues = async () => {
    try {
      const res = await api.get("/admin/venues");
      const raw = res.data;
      setVenues(Array.isArray(raw) ? raw : (raw?.data || []));
    } catch (error) {
      console.error("Failed to load venues", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = venues.filter(v =>
    (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = async (id: any, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/venues/${id}/status`, { isActive: !currentStatus });
      setVenues(vs => vs.map(v => v.id === id ? { ...v, isActive: !currentStatus } : v));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const deleteVenue = async (id: any) => {
    if (confirm("Are you sure you want to delete this venue?")) {
      try {
        await api.delete(`/admin/venues/${id}`);
        setVenues(vs => vs.filter(v => v.id !== id));
      } catch (error) {
        console.error("Failed to delete venue", error);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size should not exceed 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setImageUrl(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const rawData = Object.fromEntries(formData);
    
    const payload = {
      name: String(rawData.name || "").trim(),
      owner: String(rawData.owner || "").trim(),
      city: String(rawData.city || "").trim(),
      location: String(rawData.location || "").trim(),
      pricePerHour: Number(rawData.pricePerHour) || 0,
      type: (rawData.type === "Outdoor" ? "Outdoor" : "Indoor") as "Indoor" | "Outdoor",
      imageUrl: imageUrl || String(rawData.imageUrl || "").trim() || undefined,
    };

    try {
      if (editId) {
        await api.patch(`/admin/venues/${editId}`, payload);
      } else {
        await api.post(`/admin/venues`, payload);
      }
      setShowAdd(false);
      setEditId(null);
      setImageUrl("");
      fetchVenues();
    } catch (error: any) {
      console.error("Failed to save venue", error);
      alert(error.response?.data?.message || "Failed to save venue");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search venues…"
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all w-64"
          />
        </div>
        <button onClick={() => { setEditId(null); setImageUrl(""); setShowAdd(true); }}
          className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#15803d] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Venue
        </button>
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editId !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-10">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAdd(false); setEditId(null); setImageUrl(""); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">{editId !== null ? "Edit Venue" : "Add New Venue"}</h2>
              <button onClick={() => { setShowAdd(false); setEditId(null); setImageUrl(""); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["name", "Venue Name", "Arena Pro Futsal", "text", editingVenue?.name],
                  ["owner", "Owner", "PT Sportindo", "text", editingVenue?.owner],
                  ["city", "City", "Jakarta Selatan", "text", editingVenue?.city],
                  ["location", "Address / Location", "Jl. Sudirman No. 45", "text", editingVenue?.location],
                  ["pricePerHour", "Price / Hour", "150000", "number", editingVenue?.pricePerHour],
                ].map(([name, label, ph, type, defaultVal]) => (
                  <div key={name as string} className={name === "location" || name === "name" ? "col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label as string}</label>
                    <input
                      name={name as string}
                      type={type as string}
                      placeholder={ph as string}
                      defaultValue={defaultVal as string | number | undefined}
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                ))}
                
                {/* Photo Upload & Preview Section */}
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Venue Photo</label>
                  
                  {imageUrl && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-2">
                      <img src={imageUrl} alt="Venue preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-[#16A34A] border border-green-200 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
                      📷 Upload Photo File
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                  
                  <div className="mt-2">
                    <label className="block text-[11px] text-gray-400 mb-1">Or paste Image URL:</label>
                    <input
                      name="imageUrl"
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
                  <select
                    name="type"
                    defaultValue={editingVenue?.type || "Indoor"}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A]"
                  >
                    <option value="Indoor" className="text-gray-900 bg-white">Indoor</option>
                    <option value="Outdoor" className="text-gray-900 bg-white">Outdoor</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowAdd(false); setEditId(null); setImageUrl(""); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-semibold hover:bg-[#15803d]">
                  {editId !== null ? "Save Changes" : "Add Venue"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Venue","Owner","City","Type","Price/hr","Bookings","Revenue","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 overflow-hidden shrink-0">
                        <img src={v.imageUrl || v.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop"} alt={v.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{v.owner || "PT Sportindo"}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{v.city}</td>
                  <td className="px-4 py-4">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", v.type === "Indoor" ? "bg-green-100 text-[#16A34A]" : "bg-yellow-100 text-yellow-700")}>{v.type}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatPrice(v.pricePerHour || v.price || 0)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{v.totalBookings || 0}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#16A34A] whitespace-nowrap">{formatPrice(v.revenue || 0)}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleActive(v.id, v.isActive)}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                        v.isActive ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", v.isActive ? "bg-green-500" : "bg-gray-400")} />
                      {v.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditId(v.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <PenLine className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteVenue(v.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {venues.length} venues</p>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:border-gray-300"><ChevronLeft className="w-3.5 h-3.5 text-gray-400" /></button>
            <button className="w-7 h-7 rounded-lg bg-[#16A34A] text-white text-xs font-bold">1</button>
            <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:border-gray-300"><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
