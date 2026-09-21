"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  CalendarCheck2,
  CalendarDays,
  Award,
  Wallet,
  PiggyBank,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  Sparkles,
  Bus,
  BookOpenCheck,
  BookOpen,
  HeartHandshake,
  School,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { profile } = useSchoolData();

  const appName = profile?.appName || "SIM Sekolah PRO";
  const appTagline = profile?.appTagline || profile?.namaSekolah || "SD Islam Smart School";
  const appLogoUrl = profile?.appLogoUrl;
  const appIconPreset = profile?.appIconPreset || "graduation";

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "Data Siswa",
      href: "/dashboard/siswa",
      icon: Users,
      roles: ["admin", "guru"],
    },
    {
      title: "Data Kelas",
      href: "/dashboard/kelas",
      icon: Building2,
      roles: ["admin"],
    },
    {
      title: "Guru & Staf",
      href: "/dashboard/guru",
      icon: GraduationCap,
      roles: ["admin", "siswa", "ortu"],
    },
    {
      title: "Jadwal Pelajaran",
      href: "/dashboard/jadwal",
      icon: CalendarDays,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "Presensi Harian",
      href: "/dashboard/presensi",
      icon: CalendarCheck2,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "LMS Pembelajaran",
      href: "/dashboard/lms",
      icon: BookOpenCheck,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "Jurnal Tahfidz & Quran",
      href: "/dashboard/tahfidz",
      icon: BookOpen,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "Mutaba'ah Ibadah",
      href: "/dashboard/mutabaah",
      icon: HeartHandshake,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "Nilai & E-Rapor",
      href: "/dashboard/nilai",
      icon: Award,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "SPP & Transportasi",
      href: "/dashboard/spp-transportasi",
      icon: Bus,
      roles: ["admin", "siswa", "ortu", "bendahara"],
    },
    {
      title: "Kas & Tagihan Lainnya",
      href: "/dashboard/keuangan",
      icon: Wallet,
      roles: ["admin", "siswa", "ortu", "bendahara"],
    },
    {
      title: "Tabungan Siswa",
      href: "/dashboard/tabungan",
      icon: PiggyBank,
      roles: ["admin", "siswa", "ortu", "bendahara"],
    },
    {
      title: "Pengumuman",
      href: "/dashboard/pengumuman",
      icon: Bell,
      roles: ["admin", "guru", "siswa", "ortu"],
    },
    {
      title: "Manajemen Pengguna",
      href: "/dashboard/pengguna",
      icon: ShieldCheck,
      roles: ["admin"],
    },
    {
      title: "Pengaturan Profil",
      href: "/dashboard/pengaturan",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const currentRole = user?.role || "admin";
  const filteredNavItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#06241b] text-white flex flex-col justify-between border-r border-emerald-900/50 shadow-2xl shadow-emerald-950/40 transition-transform duration-300 ease-in-out lg:translate-x-0 no-print ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Branding */}
        <div>
          <div className="h-20 px-6 py-5 flex items-center justify-between border-b border-emerald-900/50 bg-[#041d16]/70">
            <Link
              href={user?.role === "bendahara" ? "/dashboard/spp-transportasi" : "/dashboard"}
              className="flex items-center gap-3 group"
            >
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/50 border border-emerald-400/30 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                {appLogoUrl ? (
                  <img
                    src={appLogoUrl}
                    alt={appName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-white">
                    {appIconPreset === "school" && <School className="h-6 w-6" />}
                    {appIconPreset === "book" && <BookOpen className="h-6 w-6" />}
                    {appIconPreset === "shield" && <ShieldCheck className="h-6 w-6" />}
                    {appIconPreset === "sparkles" && <Sparkles className="h-6 w-6" />}
                    {(!appIconPreset || appIconPreset === "graduation") && <GraduationCap className="h-6 w-6" />}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-base tracking-tight text-white block truncate leading-tight">
                  {appName}
                </span>
                <p className="text-[11px] text-emerald-300/80 truncate max-w-[150px] mt-0.5">
                  {appTagline}
                </p>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Role Banner */}
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-[#093527]/70 border border-emerald-800/40 flex items-center gap-3 backdrop-blur-sm">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={user?.name || "User"}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/60 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Pengguna"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-emerald-200 font-medium capitalize truncate">
                  {user?.role === "admin"
                    ? "Administrator"
                    : user?.role === "guru"
                    ? user?.kelas ? `Wali ${user.kelas}` : "Dewan Asatidz"
                    : user?.role === "bendahara"
                    ? "Bendahara Sekolah"
                    : user?.role === "siswa"
                    ? "Siswa Aktif"
                    : "Wali Murid"}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
              Menu Utama SDI
            </p>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold shadow-md shadow-emerald-950/40 border-l-4 border-amber-400"
                      : "text-emerald-100/75 hover:text-white hover:bg-emerald-900/40"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-300" : "text-emerald-400/80"}`} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Quick Switcher & Logout */}
        <div className="p-4 border-t border-emerald-900/50 bg-[#041d16]/70">
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-[11px] text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>TA: <strong>2025/2026 M</strong></span>
            </div>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/30">1447 H</span>
          </div>

          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/50 border border-rose-900/30 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Sesi (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
