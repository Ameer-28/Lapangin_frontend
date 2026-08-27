"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, User, Lock, Bell, LogOut, Edit3, Eye, EyeOff, Award 
} from "lucide-react";
import api from "@/lib/api";
import { GreenButton } from "@/components/ui/GreenButton";
import { cn } from "@/lib/utils";

import { PopupModal, PopupType } from "@/components/ui/PopupModal";

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "password" | "notifications">("info");
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
  }>({ isOpen: false, message: "" });

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: ""
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPw, setShowPw] = useState(false);

  const [notifications, setNotifications] = useState({
    bookingReminder: true,
    promoOffers: false,
    newVenues: true,
    emailUpdates: true,
  });

  useEffect(() => {
    // 1. Instant populate from localStorage so form is never blank
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        setUser(localUser);
        setAvatarUrl(localUser.avatarUrl || "");
        setFormData({
          fullName: localUser.fullName || localUser.name || localUser.email?.split('@')[0] || "",
          email: localUser.email || "",
          phone: localUser.phone || "",
          city: localUser.city || ""
        });
      } catch (_) {}
    }

    // 2. Fetch fresh data from backend
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        const userData = res.data?.data || res.data;
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          setAvatarUrl(userData.avatarUrl || "");
          setFormData({
            fullName: userData.fullName || userData.name || userData.email?.split('@')[0] || "",
            email: userData.email || "",
            phone: userData.phone || "",
            city: userData.city || ""
          });
          if (userData.notifications) {
            setNotifications(userData.notifications);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile in profile page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
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

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setAvatarUrl(compressedDataUrl);

        api.patch("/users/me", { avatarUrl: compressedDataUrl })
          .then(() => {
            setUser((prev: any) => ({ ...prev, avatarUrl: compressedDataUrl }));
            setPopup({
              isOpen: true,
              type: "success",
              title: "Foto Profil Diperbarui",
              message: "Foto profil Anda berhasil diunggah dan diperbarui!"
            });
          })
          .catch((err: any) => {
            console.error("Failed to save avatar", err);
            setPopup({
              isOpen: true,
              type: "error",
              title: "Gagal Mengunggah Foto",
              message: err.response?.data?.message || "Terjadi kesalahan saat menyimpan foto profil."
            });
          })
          .finally(() => {
            setUploadingAvatar(false);
          });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInfo = async () => {
    try {
      const res = await api.patch("/users/me", {
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        avatarUrl: avatarUrl || undefined,
      });
      const updatedUser = res.data?.data || res.data || {
        ...user,
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        avatarUrl: avatarUrl || user?.avatarUrl,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setPopup({
        isOpen: true,
        type: "success",
        title: "Profil Diperbarui",
        message: "Data profil Anda berhasil disimpan."
      });
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Mengubah Profil",
        message: err.response?.data?.message || "Gagal memperbarui informasi profil."
      });
      console.error(err);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPopup({
        isOpen: true,
        type: "warning",
        title: "Password Tidak Cocok",
        message: "Password baru dan konfirmasi password tidak sama."
      });
      return;
    }
    try {
      await api.patch("/users/me/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPopup({
        isOpen: true,
        type: "success",
        title: "Password Diperbarui",
        message: "Password Anda telah berhasil diubah."
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: "error",
        title: "Gagal Mengubah Password",
        message: err.response?.data?.message || "Password lama salah atau tidak memenuhi kriteria."
      });
      console.error(err);
    }
  };

  const toggleNotification = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await api.patch("/users/me/notifications", updated);
    } catch (err) {
      console.error("Failed to update notification settings", err);
      // Revert on fail
      setNotifications(notifications);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const initials = formData.fullName
    ? formData.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center mb-4">
            <div className="relative w-20 h-20 mx-auto mb-4">
              {avatarUrl || user?.avatarUrl ? (
                <img
                  src={avatarUrl || user?.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#16A34A] shadow-md"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-full flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#16A34A] rounded-full flex items-center justify-center hover:bg-[#15803d] transition-colors cursor-pointer shadow-md">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
              </label>
            </div>
            <div className="space-y-1.5 mb-4">
              <p className="font-bold text-gray-900 text-base leading-tight break-words">
                {formData.fullName || user?.fullName || "Player"}
              </p>
              <p className="text-gray-400 text-xs break-all px-2 leading-relaxed">
                {formData.email || user?.email}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-green-50 text-[#16A34A] px-3.5 py-1 rounded-full text-xs font-semibold">
              <Award className="w-3.5 h-3.5" /> Member
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {([
              { id: "info",          label: "Personal Info",    Icon: User },
              { id: "password",      label: "Change Password",  Icon: Lock },
              { id: "notifications", label: "Notifications",    Icon: Bell },
            ] as const).map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn("w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-b border-gray-50 last:border-0",
                  tab === id ? "bg-green-50 text-[#16A34A]" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="w-4.5 h-4.5" /> {label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4.5 h-4.5" /> Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {tab === "info" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 text-lg">Personal Information</h2>
                <button className="flex items-center gap-1.5 text-[#16A34A] text-sm font-semibold hover:underline">
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-1.5 uppercase tracking-wide">Email</label>
                  <input value={formData.email} readOnly
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-1.5 uppercase tracking-wide">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-1.5 uppercase tracking-wide">City</label>
                  <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all"
                  />
                </div>
              </div>
              <GreenButton onClick={handleSaveInfo} className="mt-6 px-8 py-3 text-sm">Save Changes</GreenButton>
            </div>
          )}

          {tab === "password" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="font-bold text-gray-900 text-lg mb-6">Change Password</h2>
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Current Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} placeholder="••••••••"
                      value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all pr-12"
                    />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                      value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all pr-12"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} placeholder="Re-enter new password"
                      value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 transition-all pr-12"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-blue-700 text-sm">
                  Password must be at least 8 characters with a mix of letters and numbers.
                </div>
                <GreenButton onClick={handleUpdatePassword} className="px-8 py-3 text-sm">Update Password</GreenButton>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="font-bold text-gray-900 text-lg mb-6">Notification Settings</h2>
              <div className="space-y-5">
                {([
                  { key: "bookingReminder", label: "Booking Reminders",      desc: "Get notified 2 hours before your session" },
                  { key: "promoOffers",     label: "Promotional Offers",     desc: "Exclusive deals and discount codes" },
                  { key: "newVenues",       label: "New Venues Near You",    desc: "When new fields open in your area" },
                  { key: "emailUpdates",    label: "Email Updates",          desc: "Booking confirmations and receipts" },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-4 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button onClick={() => toggleNotification(key as any)} className={cn("relative w-12 h-6 rounded-full transition-colors", notifications[key as keyof typeof notifications] ? "bg-[#16A34A]" : "bg-gray-200")}>
                      <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform", notifications[key as keyof typeof notifications] ? "translate-x-6" : "translate-x-0")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
