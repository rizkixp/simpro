"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { Siswa } from "@/types/school";
import MobileStudentProfileModal from "@/components/dashboard/MobileStudentProfileModal";
import MobileBukuPesanDrawer from "@/components/dashboard/MobileBukuPesanDrawer";
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
  MessageSquare,
  User as UserIcon,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { profile, siswaList } = useSchoolData();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPesanOpen, setIsPesanOpen] = useState(false);

  if (!user) return null;

  const currentRole = (user.role || "siswa").toLowerCase();
  const safePathname = pathname || "";

  // Haptic feedback saat tab ditekan di smartphone Android
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  // Current active student for Profile modal
  const currentSiswa = useMemo(() => {
    const childNameFromUser =
      user?.phone ||
      user?.name?.replace(/^(wali murid|wali santri|wali|orang tua|ayah|bunda|ibu|abi|umi)\s+/i, "").trim() ||
      "Ahmad Rafif";

    const fallbackStudent: Siswa = {
      id: "sis-default",
      nisn: user?.nisnOrNip || "20230015",
      nama: user?.role === "ortu" ? childNameFromUser : user?.name || "Ahmad Rafif",
      kelas: user?.kelas || "3 - Al Farabi",
      jenisKelamin: "L" as const,
      tanggalLahir: "2016-01-12",
      tempatLahir: "Medan",
      alamat: "Jl. Melati No. 10, Medan",
      status: "Aktif" as const,
      avatar:
        user?.avatar ||
        "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
      namaWali: user?.role === "ortu" ? user.name : "Bapak Rizki F., Ibu Sari",
      noHpWali: "0812-3456-7890",
    };

    return (
      (siswaList || []).find(
        (s) =>
          (user?.nisnOrNip && s?.nisn === user.nisnOrNip) ||
          (user?.phone && s?.nama && s.nama.toLowerCase() === user.phone.toLowerCase()) ||
          (user?.phone && s?.nama && s.nama.toLowerCase().includes(user.phone.toLowerCase())) ||
          (user?.role !== "ortu" && s?.nama && s.nama.toLowerCase().includes("ahmad"))
      ) ||
      (user?.role === "ortu" ? fallbackStudent : (siswaList && siswaList[0]) || fallbackStudent)
    );
  }, [siswaList, user]);

  // Buka drawer saat event open-mobile-drawer dipicu
  useEffect(() => {
    const handleOpenDrawer = () => setIsDrawerOpen(true);
    window.addEventListener("open-mobile-drawer", handleOpenDrawer);
    return () => window.removeEventListener("open-mobile-drawer", handleOpenDrawer);
  }, []);

  // Navigasi Utama Bawah Mobile (4 Tab Sesuai Education Mobile UI Kits Screen 3)
  // [Beranda, Jadwal, Pesan, Profil]
  const primaryNavItems = [
    {
      label: "Beranda",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: safePathname === "/dashboard",
    },
    {
      label: "Jadwal",
      href: "/dashboard/jadwal",
      icon: CalendarDays,
      isActive: safePathname === "/dashboard/jadwal",
    },
    {
      label: "Pesan",
      action: "pesan",
      icon: MessageSquare,
      isActive: false,
    },
    {
      label: "Profil",
      action: "profil",
      icon: UserIcon,
      isActive: safePathname === "/dashboard/pengaturan",
    },
  ];

  // Daftar Semua Modul Lengkap untuk Bottom Sheet Drawer
  const allModules = [
    { label: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Data Siswa", href: "/dashboard/siswa", icon: Users, roles: ["admin", "guru"] },
    { label: "Data Rombel & Kelas", href: "/dashboard/kelas", icon: Building2, roles: ["admin", "guru"] },
    { label: "Guru & Tenaga Pendidik", href: "/dashboard/guru", icon: GraduationCap, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Jadwal Pembelajaran", href: "/dashboard/jadwal", icon: CalendarDays, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Presensi & Kehadiran", href: "/dashboard/presensi", icon: CalendarCheck2, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "LMS & Tugas Digital", href: "/dashboard/lms", icon: BookOpenCheck, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Jurnal Tahfidz Qur'an", href: "/dashboard/tahfidz", icon: BookOpen, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Mutaba'ah Ibadah Harian", href: "/dashboard/mutabaah", icon: HeartHandshake, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "E-Rapor & Nilai Siswa", href: "/dashboard/nilai", icon: Award, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "SPP & Transportasi Bus", href: "/dashboard/spp-transportasi", icon: Bus, roles: ["admin", "siswa", "ortu", "bendahara"] },
    { label: "Buku Kas & Tagihan Lainnya", href: "/dashboard/keuangan", icon: Wallet, roles: ["admin", "bendahara"] },
    { label: "Tabungan Santri", href: "/dashboard/tabungan", icon: PiggyBank, roles: ["admin", "siswa", "ortu", "bendahara"] },
    { label: "Papan Pengumuman", href: "/dashboard/pengumuman", icon: Bell, roles: ["admin", "guru", "siswa", "ortu"] },
    { label: "Manajemen Pengguna", href: "/dashboard/pengguna", icon: ShieldCheck, roles: ["admin"] },
    { label: "Pengaturan & Profil Lembaga", href: "/dashboard/pengaturan", icon: Settings, roles: ["admin"] },
  ];

  const filteredModules = allModules.filter((m) => m.roles.includes(currentRole));

  return (
    <>
      {/* 1. NATIVE BOTTOM NAVIGATION BAR (4 Tab Simetris ala Education Mobile UI Kits) */}
      <nav
        aria-label="Navigasi Aplikasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] no-print pb-[max(env(safe-area-inset-bottom),0.35rem)]"
      >
        <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-2">
          {primaryNavItems.map((item, idx) => {
            const IconComponent = item.icon;

            if (item.action) {
              return (
                <button
                  key={`nav-${idx}`}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    if (item.action === "profil-siswa" || item.action === "profil") {
                      setIsProfileOpen(true);
                    } else if (item.action === "pesan") {
                      setIsPesanOpen(true);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform cursor-pointer ${
                    item.isActive
                      ? "text-[#056839] dark:text-emerald-400 font-bold"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  <div
                    className={`p-1.5 px-3 rounded-full transition-all ${
                      item.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/70 text-[#056839] dark:text-emerald-400 font-bold shadow-xs"
                        : ""
                    }`}
                  >
                    <IconComponent className="h-5 w-5 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold leading-none">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={`nav-${idx}`}
                href={item.href!}
                onClick={triggerHaptic}
                className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform ${
                  item.isActive
                    ? "text-[#056839] dark:text-emerald-400 font-bold"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                <div
                  className={`p-1.5 px-3 rounded-full transition-all ${
                    item.isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/70 text-[#056839] dark:text-emerald-400 font-bold shadow-xs"
                      : ""
                  }`}
                >
                  <IconComponent className="h-5 w-5 stroke-[2]" />
                </div>
                <span className="text-[10px] font-bold leading-none truncate max-w-[64px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 2. BOTTOM SHEET DRAWER: "Lainnya / Semua Modul" */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 overflow-hidden animate-slideUp"
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
                  setIsDrawerOpen(false);
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
                  );
                }}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Pencarian Cepat Menu / Data (Ctrl+K)...</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-slate-900 font-mono text-slate-400 border border-slate-200 dark:border-slate-700">
                  ⌘K
                </span>
              </button>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Semua Fitur & Modul Aplikasi
                </p>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4">
                  {filteredModules.map((item, idx) => {
                    const isModActive = safePathname === item.href || (item.href !== "/dashboard" && safePathname.startsWith(item.href + "/"));
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
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[#056839] dark:text-emerald-300 font-bold"
                            : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-xs">
                          <ModIcon className="w-4 h-4 text-[#056839] dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] leading-tight line-clamp-2">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Logout Option in Sheet */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                    window.location.href = "/login?logout=true";
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Aplikasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODALS TRIGGERED FROM BOTTOM NAV */}
      <MobileStudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        siswa={currentSiswa}
        user={user}
      />

      <MobileBukuPesanDrawer
        isOpen={isPesanOpen}
        onClose={() => setIsPesanOpen(false)}
        user={user}
      />
    </>
  );
}
