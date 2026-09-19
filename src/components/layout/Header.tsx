"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/school";
import { Menu, Bell, Shield, UserCheck, BookOpen, HeartHandshake, Wallet, Sparkles } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const { user, switchRole, switchUser, userList } = useAuth();

  const roleConfigs: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { role: "admin", label: "Admin", icon: <Shield className="h-3.5 w-3.5" />, color: "bg-[#064e3b] text-white" },
    { role: "guru", label: "Asatidz / Guru", icon: <UserCheck className="h-3.5 w-3.5" />, color: "bg-emerald-600 text-white" },
    { role: "bendahara", label: "Bendahara", icon: <Wallet className="h-3.5 w-3.5" />, color: "bg-amber-600 text-white" },
    { role: "siswa", label: "Siswa", icon: <BookOpen className="h-3.5 w-3.5" />, color: "bg-teal-700 text-white" },
    { role: "ortu", label: "Wali Murid", icon: <HeartHandshake className="h-3.5 w-3.5" />, color: "bg-emerald-700 text-white" },
  ];

  const teacherUsers = userList.filter((u) => u.role === "guru");

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 dark:border-emerald-900/30 px-4 sm:px-8 flex items-center justify-between shadow-xs no-print">
      {/* Left section: Hamburger, Title & Hijri Date */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-xl text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
            SIM SD Islam Smart School
          </h1>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Kurikulum Merdeka & Pendidikan Karakter Qur'ani</p>
        </div>

        {/* Islamic Hijri Chip */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Tahun 1447 H • SDI Cendekia</span>
        </div>
      </div>

      {/* Right section: Instant Role Simulator & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Guru Homeroom Class Quick Switcher */}
        {user?.role === "guru" && teacherUsers.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hidden md:inline">
              Wali:
            </span>
            <select
              value={user.id}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-emerald-900 dark:text-emerald-200 font-semibold text-xs border-none outline-none cursor-pointer py-0.5"
              title="Ganti guru / wali kelas binaan untuk verifikasi hak akses kelas"
            >
              {teacherUsers.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                >
                  {t.kelas ? `${t.kelas} (${t.name.split(",")[0]})` : t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Role Quick Selector / Simulator for testing different views */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-semibold text-slate-400 pl-2 pr-1 hidden md:inline">
            Peran:
          </span>
          {roleConfigs.map((r) => {
            const isSelected = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => {
                  switchRole(r.role);
                  if (r.role === "bendahara") {
                    router.push("/dashboard/spp-transportasi");
                  }
                }}
                title={`Beralih ke mode ${r.label}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? `${r.color} shadow-sm font-semibold`
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {r.icon}
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            aria-label="Lihat notifikasi pengumuman"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>
        </div>

        {/* Profile Avatar Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200 dark:sm:border-slate-700">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
            alt={user?.name || "Avatar"}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight truncate max-w-[130px]">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
