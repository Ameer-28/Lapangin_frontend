"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Shield, Ban, Trash2, UserCheck, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

import { PopupModal, PopupType } from "@/components/ui/PopupModal";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get("/admin/users?limit=1000"),
        api.get("/admin/users/stats"),
      ]);
      const raw = usersRes.data;
      setUsers(Array.isArray(raw) ? raw : (raw?.data || []));
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const res = await api.patch(`/admin/users/${id}/status`);
      setUsers(us => us.map(u => u.id === id ? { ...u, status: res.data.status } : u));
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  const deleteUser = async (id: string) => {
    setPopup({
      isOpen: true,
      type: "confirm",
      title: "Hapus Pengguna?",
      message: "Apakah Anda yakin ingin menghapus pengguna ini secara permanen?",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          setUsers(us => us.filter(u => u.id !== id));
          setPopup({
            isOpen: true,
            type: "success",
            title: "Pengguna Dihapus",
            message: "Pengguna telah berhasil dihapus dari sistem."
          });
        } catch (error) {
          console.error("Failed to delete user", error);
          setPopup({
            isOpen: true,
            type: "error",
            title: "Gagal Menghapus",
            message: "Gagal menghapus pengguna dari database."
          });
        }
      }
    });
  };

  const filtered = users.filter(u => {
    const matchF = filter === "all" || u.status === filter || (filter === "admin" && u.role === "admin");
    const name = u.fullName || u.name || "";
    const email = u.email || "";
    const phone = u.phone || "";
    const matchS = name.toLowerCase().includes(search.toLowerCase()) ||
                   email.toLowerCase().includes(search.toLowerCase()) ||
                   phone.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const counts = {
    all: users.length,
    active: users.filter(u => u.status === "active").length,
    suspended: users.filter(u => u.status === "suspended").length,
    admin: users.filter(u => u.role === "admin").length,
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: stats?.total ?? users.length, color: "text-gray-900" },
          { label: "Active", value: stats?.active ?? counts.active, color: "text-green-600" },
          { label: "Suspended", value: stats?.suspended ?? counts.suspended, color: "text-red-500" },
          { label: "Admins", value: counts.admin, color: "text-yellow-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-gray-500 text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "suspended", "admin"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === t ? "bg-[#16A34A] text-white shadow" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Email", "Phone", "Role", "City", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => {
                const name = u.fullName || u.name || "User";
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#16A34A] to-[#22C55E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px] truncate">{u.email}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {u.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {u.phone}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full",
                        u.role === "admin" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{u.city || "-"}</td>
                    <td className="px-4 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full",
                        u.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", u.status === "active" ? "bg-green-500" : "bg-red-500")} />
                        {u.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleStatus(u.id)}
                          className={cn("p-1.5 rounded-lg transition-colors",
                            u.status === "active"
                              ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                          )}
                          title={u.status === "active" ? "Suspend" : "Activate"}
                        >
                          {u.status === "active" ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteUser(u.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {users.length} users</p>
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
