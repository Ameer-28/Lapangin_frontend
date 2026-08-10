"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, PenLine, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PopupModal, PopupType } from "@/components/ui/PopupModal";

export default function AdminVenues() {
  const [venues, setVenues] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    fetchVenues();
  }, []);

  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const editingVenue = venues.find(v => v.id === editId);

  useEffect(() => {
    if (editingVenue) {
      setImageUrl(editingVenue.imageUrl || editingVenue.image || "");
      setSelectedFacilities(editingVenue.facilities || ["parking", "shower", "locker", "wifi", "cafeteria"]);
    } else {
      setImageUrl("");
      setSelectedFacilities(["parking", "shower", "locker", "wifi", "cafeteria"]);
    }
  }, [editId, showAdd]);

  const fetchVenues = async () => {
    try {
      const res = await api.get("/admin/venues?limit=1000");
      const raw = res.data;
      setVenues(Array.isArray(raw) ? raw : (raw?.items || raw?.data || []));
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
    setPopup({
      isOpen: true,
      type: "confirm",
      title: "Hapus Venue?",
      message: "Apakah Anda yakin ingin menghapus venue ini? Semua jadwal terkait akan ikut terhapus.",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/venues/${id}`);
          setVenues(vs => vs.filter(v => v.id !== id));
          setPopup({
            isOpen: true,
            type: "success",
            title: "Venue Dihapus",
            message: "Data venue telah berhasil dihapus dari sistem."
          });
        } catch (error) {
          console.error("Failed to delete venue", error);
          setPopup({
            isOpen: true,
            type: "error",
            title: "Gagal Menghapus",
            message: "Gagal menghapus venue dari database."
          });
        }
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPopup({
        isOpen: true,
        type: "warning",
        title: "Ukuran File Terlalu Besar",
        message: "Ukuran file foto tidak boleh melebihi 10MB."
      });
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
      openTime: String(rawData.openTime || "07:00").trim(),
      closeTime: String(rawData.closeTime || "23:00").trim(),
      type: (rawData.type === "Outdoor" ? "Outdoor" : "Indoor") as "Indoor" | "Outdoor",
      description: String(rawData.description || "").trim() || undefined,
      facilities: selectedFacilities,
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
      setPopup({
        isOpen: true,
        type: "success",
        title: "Venue Disimpan",
        message: editId ? "Data venue berhasil diperbarui." : "Venue baru berhasil ditambahkan."
      });
    } catch (error: any) {
      console.error("Failed to save venue", error);
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Menyimpan",
        message: error.response?.data?.message || "Gagal menyimpan data venue."
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Venues", value: venues.length, color: "text-gray-900" },
          { label: "Active Venues", value: venues.filter(v => v.isActive).length, color: "text-green-600" },
          { label: "Indoor", value: venues.filter(v => v.type === "Indoor").length, color: "text-blue-600" },
          { label: "Outdoor", value: venues.filter(v => v.type === "Outdoor").length, color: "text-yellow-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-gray-500 text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search venue by name or city…"
            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all w-full sm:w-72"
          />
        </div>
        <button onClick={() => { setEditId(null); setImageUrl(""); setShowAdd(true); }}
          className="flex items-center justify-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#15803d] transition-colors shadow-sm"
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
                  ["openTime", "Jam Buka", "07:00", "text", editingVenue?.openTime || "07:00"],
                  ["closeTime", "Jam Tutup", "23:00", "text", editingVenue?.closeTime || "23:00"],
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

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About Venue (Description)</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Tuliskan deskripsi lengkap tempat futsal..."
                    defaultValue={editingVenue?.description || ""}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Facilities</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { id: "parking", label: "Parking" },
                      { id: "shower", label: "Shower" },
                      { id: "locker", label: "Locker" },
                      { id: "wifi", label: "Free WiFi" },
                      { id: "cafeteria", label: "Cafeteria" },
                      { id: "tribune", label: "Tribune" },
                      { id: "ac", label: "AC Lounge" },
                    ].map(f => {
                      const active = selectedFacilities.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelectedFacilities(prev =>
                              prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id]
                            );
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                            active
                              ? "bg-[#16A34A] text-white border-[#16A34A] shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                          )}
                        >
                          {active ? "✓ " : "+ "} {f.label}
                        </button>
                      );
                    })}
                  </div>
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
        <div className="w-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Venue", "Owner", "City", "Jam Buka", "Type", "Price/hr", "Bookings", "Revenue", "Status", "Actions"].map(h => (
                  <th key={h} className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-green-100 overflow-hidden shrink-0">
                        <img src={v.imageUrl || v.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop"} alt={v.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-semibold text-gray-900 text-xs max-w-[130px] truncate" title={v.name}>{v.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-500 max-w-[120px] truncate" title={v.owner || ""}>{v.owner || "-"}</td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{v.city}</td>
                  <td className="px-3 py-3 font-medium text-gray-700 whitespace-nowrap">{v.openTime || "07:00"} - {v.closeTime || "23:00"}</td>
                  <td className="px-3 py-3">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", v.type === "Indoor" ? "bg-green-100 text-[#16A34A]" : "bg-yellow-100 text-yellow-700")}>{v.type}</span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">{formatPrice(v.pricePerHour || v.price || 0)}</td>
                  <td className="px-3 py-3 text-gray-600 text-center">{v.totalBookings || 0}</td>
                  <td className="px-3 py-3 font-semibold text-[#16A34A] whitespace-nowrap">{formatPrice(v.revenue || 0)}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleActive(v.id, v.isActive)}
                      className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-colors",
                        v.isActive ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full", v.isActive ? "bg-green-500" : "bg-gray-400")} />
                      {v.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => setEditId(v.id)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <PenLine className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteVenue(v.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
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
      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
        onConfirm={popup.onConfirm}
      />
    </div>
  );
}
