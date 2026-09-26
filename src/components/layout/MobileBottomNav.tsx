"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import {
  LayoutDashboard,
  CalendarCheck2,
  BookOpen,
  HeartHandshake,
  Award,
  Bus,
  Wallet,
  PiggyBank,
  BookOpenCheck,
  Users,
  Building2,
  GraduationCap,
  CalendarDays,
  Bell,
  ShieldCheck,
  Settings,
  Grid,
  X,
  LogOut,
  Sparkles,
  ChevronRight,
  Shield,
  Search,
  UserCheck,
  QrCode,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { profile } = useSchoolData();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!user) return null;

  const currentRole = user.role;

  // Haptic feedback saat tab ditekan di smartphone Android
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  // Buka drawer saat event open-mobile-drawer dipicu
  useEffect(() => {
    const handleOpenDrawer = () => setIsDrawerOpen(true);
    window.addEventListener("open-mobile-drawer", handleOpenDrawer);
    return () => window.removeEventListener("open-mobile-drawer", handleOpenDrawer);
  }, []);

  // Navigasi Utama Bawah Bergaya Super-App BRImo (5 Tombol dengan Center Floating FAB)
  const getPrimaryNav = () => {
    switch (currentRole) {
      case "siswa":
        return [
          { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
          { label: "SPP Kas", href: "/dashboard/spp-transportasi", icon: Bus },
          { label: "Scan QR", href: "/dashboard/presensi", icon: QrCode, isFab: true },
          { label: "Tahfidz", href: "/dashboard/tahfidz", icon: BookOpen },
          { label: "Menu", action: "drawer", icon: Grid },
        ];
      case "ortu":
        return [
          { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
          { label: "SPP & Bus", href: "/dashboard/spp-transportasi", icon: Bus },
          { label: "Scan QR", href: "/dashboard/presensi", icon: QrCode, isFab: true },
          { label: "Tahfidz", href: "/dashboard/tahfidz", icon: BookOpen },
          { label: "Menu", action: "drawer", icon: Grid },
        ];
      case "guru":
        return [
          { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
          { label: "E-Rapor", href: "/dashboard/nilai", icon: Award },
          { label: "Scan QR", href: "/dashboard/presensi", icon: QrCode, isFab: true },
          { label: "LMS", href: "/dashboard/lms", icon: BookOpenCheck },
          { label: "Menu", action: "drawer", icon: Grid },
        ];
      case "bendahara":
        return [
          { label: "Beranda", href: "/dashboard/spp-transportasi", icon: Bus },
          { label: "Buku Kas", href: "/dashboard/keuangan", icon: Wallet },
          { label: "Scan QR", href: "/dashboard/presensi", icon: QrCode, isFab: true },
          { label: "Tabungan", href: "/dashboard/tabungan", icon: PiggyBank },
          { label: "Menu", action: "drawer", icon: Grid },
        ];
      case "admin":
      default:
        return [
          { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
          { label: "Siswa", href: "/dashboard/siswa", icon: Users },
          { label: "Scan QR", href: "/dashboard/presensi", icon: QrCode, isFab: true },
          { label: "E-Rapor", href: "/dashboard/nilai", icon: Award },
          { label: "Semua", action: "drawer", icon: Grid },
        ];
    }
  };

  // Daftar Semua Modul Lengkap untuk Bottom Sheet Drawer
  const allModules = [
    { label: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Data Siswa", href: "/dashboard/siswa", icon: Users, roles: ["admin"] },
    { label: "Data Rombel & Kelas", href: "/dashboard/kelas", icon: Building2, roles: ["admin"] },
    { label: "Guru & Tenaga Pendidik", href: "/dashboard/guru", icon: GraduationCap, roles: ["admin", "siswa", "ortu"] },
    { label: "Jadwal Pembelajaran", href: "/dashboard/jadwal", icon: CalendarDays, roles: ["admin"] },
    { label: "Presensi & Scan Barcode", href: "/dashboard/presensi", icon: CalendarCheck2, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "LMS & Tugas Digital", href: "/dashboard/lms", icon: BookOpenCheck, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Jurnal Tahfidz Qur'an", href: "/dashboard/tahfidz", icon: BookOpen, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Mutaba'ah Ibadah Harian", href: "/dashboard/mutabaah", icon: HeartHandshake, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "E-Rapor & Nilai Siswa", href: "/dashboard/nilai", icon: Award, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "SPP & Transportasi Bus", href: "/dashboard/spp-transportasi", icon: Bus, roles: ["admin", "siswa", "ortu", "bendahara"] },
    { label: "Buku Kas & Tagihan Lainnya", href: "/dashboard/keuangan", icon: Wallet, roles: ["admin", "siswa", "ortu", "bendahara"] },
    { label: "Tabungan Santri", href: "/dashboard/tabungan", icon: PiggyBank, roles: ["admin", "siswa", "ortu", "bendahara"] },
    { label: "Papan Pengumuman", href: "/dashboard/pengumuman", icon: Bell, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Manajemen Pengguna", href: "/dashboard/pengguna", icon: ShieldCheck, roles: ["admin"] },
    { label: "Pengaturan & Profil Lembaga", href: "/dashboard/pengaturan", icon: Settings, roles: ["admin", "bendahara"] },
  ];

  const filteredModules = allModules.filter((m) => m.roles.includes(currentRole));
  const primaryNavItems = getPrimaryNav();

  return (
    <>
      {/* 1. NATIVE BOTTOM NAVIGATION BAR (Fixed at bottom on Mobile) */}
      <nav
        aria-label="Navigasi Aplikasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] no-print pb-[max(env(safe-area-inset-bottom),0.35rem)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1">
          {primaryNavItems.map((item, idx) => {
            const isDrawerBtn = item.action === "drawer";
            const isActive = !isDrawerBtn && item.href && (
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/")
            );

            const IconComponent = item.icon;

            // CENTER FLOATING ACTION BUTTON (ala BRImo QRIS Button)
            if ("isFab" in item && item.isFab) {
              return (
                <div key={`nav-${idx}`} className="relative -top-5 flex flex-col items-center justify-center">
                  <Link
                    href={item.href!}
                    onClick={triggerHaptic}
                    className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#064e3b] via-emerald-600 to-teal-500 p-0.5 shadow-lg shadow-emerald-700/40 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer group"
                    title="Scan QR / Barcode Presensi"
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#042d22] via-[#064e3b] to-emerald-600 flex flex-col items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-[7.5px] font-black tracking-tighter text-amber-300 uppercase leading-none mt-0.5">
                        QRIS
                      </span>
                    </div>
                  </Link>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                    Scan QR
                  </span>
                </div>
              );
            }

            if (isDrawerBtn) {
              return (
                <button
                  key={`nav-${idx}`}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setIsDrawerOpen(true);
                  }}
                  className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-90 transition-transform cursor-pointer"
                >
                  <div className={`p-1 rounded-xl transition-all ${isDrawerOpen ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : ""}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={`nav-${idx}`}
                href={item.href!}
                onClick={triggerHaptic}
                className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform ${
                  isActive
                    ? "text-emerald-700 dark:text-emerald-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                }`}
              >
                <div
                  className={`p-1.5 px-3 rounded-full transition-all ${
                    isActive
                      ? "bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs"
                      : ""
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <span className="text-[10px] leading-none truncate max-w-[64px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 2. BOTTOM SHEET DRAWER: "Lainnya / Semua Modul" ala Android Sheet */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Sheet Header: User Card & Close Button */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 rounded-2xl object-cover ring-2 ring-emerald-500/30"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {profile?.appName || "SIM SDI Smart"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sheet Body: All App Modules Grid */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Quick Search Spotlight Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsDrawerOpen(false);
                  window.dispatchEvent(new CustomEvent("open-command-palette"));
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 font-semibold text-xs shadow-xs active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Pencarian Universal</span>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-normal">Cari siswa, guru, modul & aksi cepat</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-[10px] font-bold shadow-2xs">
                  Buka
                </span>
              </button>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Semua Fitur & Modul Aplikasi
                </p>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4">
                  {filteredModules.map((item, idx) => {
                    const isModActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                    const ModIcon = item.icon;

                    return (
                      <Link
                        key={`mod-${idx}`}
                        href={item.href}
                        onClick={() => {
                          triggerHaptic();
                          setIsDrawerOpen(false);
                        }}
                        className={`p-2.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-90 ${
                          isModActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold"
                            : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${isModActive ? "bg-emerald-600 text-white shadow-sm" : "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400"}`}>
                          <ModIcon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] leading-tight line-clamp-2">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href="/dashboard/pengaturan"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 p-2"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Pengaturan Akun</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    setIsDrawerOpen(false);
                    await logout();
                    window.location.href = "/login?logout=true";
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
