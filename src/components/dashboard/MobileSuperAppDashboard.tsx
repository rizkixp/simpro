"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { formatRupiah } from "@/lib/utils";
import { Siswa } from "@/types/school";
import MobileStudentProfileModal from "@/components/dashboard/MobileStudentProfileModal";
import MobileBukuPesanDrawer from "@/components/dashboard/MobileBukuPesanDrawer";
import MobileGaleriModal from "@/components/dashboard/MobileGaleriModal";
import {
  School,
  Bell,
  Calendar,
  FileText,
  Award,
  DollarSign,
  UserCheck,
  Megaphone,
  CalendarDays,
  Image as ImageIcon,
  MoreHorizontal,
  ChevronRight,
  CreditCard,
  Bus,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function MobileSuperAppDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    siswaList,
    presensiList,
    sppList,
    tabunganList,
    pengumumanList,
    profile,
  } = useSchoolData();

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPesanOpen, setIsPesanOpen] = useState(false);
  const [isGaleriOpen, setIsGaleriOpen] = useState(false);

  // Dynamic greeting based on user role
  const greetingTitle = useMemo(() => {
    if (!user) return "Ayah Bunda";
    if (user.role === "guru") return `Ustadz ${user.name.split(" ")[0]}`;
    if (user.role === "admin") return "Administrator";
    if (user.role === "siswa") return user.name.split(" ")[0];
    return "Ayah Bunda";
  }, [user]);

  // Current active student
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

  // Total Tagihan SPP
  const displayTotalTagihan = useMemo(() => {
    const studentSpp = (sppList || []).filter(
      (s) => s?.siswaId === currentSiswa?.id && s?.status !== "Lunas"
    );
    if (studentSpp.length > 0) {
      return studentSpp.reduce((acc, curr) => acc + (curr?.nominal || 0), 0);
    }
    return 350000; // Sesuai mockup UI Kits (Rp 350.000)
  }, [sppList, currentSiswa]);

  // Haptic feedback
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  const handleOpenDrawer = () => {
    triggerHaptic();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-mobile-drawer"));
    }
  };

  // 9-Grid Modules matching Education Mobile UI Kits Screen 3 exactly
  const gridMenuItems = [
    {
      label: "Jadwal",
      href: "/dashboard/jadwal",
      icon: Calendar,
      bg: "bg-[#fff7ed] dark:bg-amber-950/40",
      border: "border-[#ffedd5] dark:border-amber-800/50",
      color: "text-[#f97316]",
    },
    {
      label: "Tugas",
      href: "/dashboard/lms",
      icon: FileText,
      bg: "bg-[#eff6ff] dark:bg-blue-950/40",
      border: "border-[#dbeafe] dark:border-blue-800/50",
      color: "text-[#3b82f6]",
    },
    {
      label: "Nilai",
      href: "/dashboard/nilai",
      icon: Award,
      bg: "bg-[#fefce8] dark:bg-yellow-950/40",
      border: "border-[#fef9c3] dark:border-yellow-800/50",
      color: "text-[#eab308]",
    },
    {
      label: "Keuangan",
      href: "/dashboard/spp-transportasi",
      icon: DollarSign,
      bg: "bg-[#f0fdf4] dark:bg-emerald-950/40",
      border: "border-[#dcfce7] dark:border-emerald-800/50",
      color: "text-[#16a34a]",
    },
    {
      label: "Absensi",
      href: "/dashboard/presensi",
      icon: UserCheck,
      bg: "bg-[#f0f9ff] dark:bg-sky-950/40",
      border: "border-[#e0f2fe] dark:border-sky-800/50",
      color: "text-[#0284c7]",
    },
    {
      label: "Pengumuman",
      href: "/dashboard/pengumuman",
      icon: Megaphone,
      bg: "bg-[#faf5ff] dark:bg-purple-950/40",
      border: "border-[#f3e8ff] dark:border-purple-800/50",
      color: "text-[#9333ea]",
    },
    {
      label: "Kalender",
      href: "/dashboard/jadwal",
      icon: CalendarDays,
      bg: "bg-[#eef2ff] dark:bg-indigo-950/40",
      border: "border-[#e0e7ff] dark:border-indigo-800/50",
      color: "text-[#4f46e5]",
    },
    {
      label: "Galeri",
      action: "galeri",
      icon: ImageIcon,
      bg: "bg-[#fff1f2] dark:bg-rose-950/40",
      border: "border-[#ffe4e6] dark:border-rose-800/50",
      color: "text-[#e11d48]",
    },
    {
      label: "Lainnya",
      action: "drawer",
      icon: MoreHorizontal,
      bg: "bg-[#f0fdfa] dark:bg-teal-950/40",
      border: "border-[#ccfbf1] dark:border-teal-800/50",
      color: "text-[#0d9488]",
    },
  ];

  return (
    <div className="lg:hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 pb-28 min-h-screen bg-[#ffffff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-5 pt-4 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP BAR: School Badge, Greeting & Notification Bell                   */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between mb-4.5">
        <div className="flex items-center gap-3">
          {/* Circular Green School Badge */}
          <div className="w-11 h-11 rounded-full bg-[#f0fdf4] dark:bg-emerald-950/80 border border-[#bbf7d0] dark:border-emerald-800 text-[#056839] dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
            <School className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Assalamu'alaikum {greetingTitle}
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
              Selamat datang di aplikasi sekolah
            </p>
          </div>
        </div>

        {/* Notification Bell with Red Badge (1) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsPesanOpen(true);
          }}
          className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Pesan & Notifikasi"
          aria-label="Notifikasi Sekolah"
        >
          <Bell className="w-5 h-5 stroke-[2]" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
            1
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO CARD BANNER: Islamic Students Banner (Forest Emerald Green)      */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#056839] via-[#047857] to-[#065f46] text-white p-4.5 sm:p-5 shadow-sm shadow-emerald-950/15 mb-6">
        {/* Subtle decorative curved ambient Islamic backdrop arches */}
        <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-emerald-400/15 blur-lg pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Left Title & Subtitle */}
          <div className="flex-1 pr-2">
            <h2 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight">
              Membentuk<br />Generasi Qur'ani
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium mt-1 leading-snug">
              Cerdas dan Berakhlak Mulia
            </p>
          </div>

          {/* Right SVG Illustration: Two Smiling Islamic Students with Qur'an */}
          <div className="w-32 h-24 sm:w-36 sm:h-28 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 160 120"
              className="w-full h-full drop-shadow-sm"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Soft cloud backdrop */}
              <ellipse cx="80" cy="95" rx="70" ry="22" fill="#04522d" opacity="0.4" />

              {/* Girl with white hijab (Left) */}
              <g transform="translate(25, 10)">
                {/* Hijab Drape */}
                <path
                  d="M15 45 C10 65 5 80 5 95 C25 98 45 98 60 95 C60 80 55 65 50 45 Z"
                  fill="#F8FAFC"
                />
                {/* Face */}
                <ellipse cx="32" cy="48" rx="14" ry="16" fill="#FDE68A" />
                {/* Hijab Inner Frame */}
                <path
                  d="M18 42 C18 25 46 25 46 42 C46 54 44 60 32 60 C20 60 18 54 18 42 Z"
                  fill="#FFFFFF"
                />
                <ellipse cx="32" cy="46" rx="11" ry="12" fill="#FCD34D" />
                {/* Eyes */}
                <circle cx="28" cy="44" r="1.8" fill="#1E293B" />
                <circle cx="36" cy="44" r="1.8" fill="#1E293B" />
                {/* Smile & Cheeks */}
                <ellipse cx="25" cy="48" rx="2" ry="1" fill="#F472B6" opacity="0.6" />
                <ellipse cx="39" cy="48" rx="2" ry="1" fill="#F472B6" opacity="0.6" />
                <path d="M30 49 Q32 52 34 49" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              {/* Boy with white peci (Right) */}
              <g transform="translate(75, 12)">
                {/* Body / Koko shirt */}
                <path d="M12 55 L4 95 C20 98 40 98 56 95 L48 55 Z" fill="#E2E8F0" />
                {/* Face */}
                <ellipse cx="30" cy="46" rx="13" ry="15" fill="#FCD34D" />
                {/* Hair under peci */}
                <path d="M17 38 Q30 36 43 38" stroke="#1E293B" strokeWidth="2" />
                {/* White Peci */}
                <path
                  d="M16 38 C16 26 44 26 44 38 Z"
                  fill="#FFFFFF"
                  stroke="#E2E8F0"
                  strokeWidth="1.5"
                />
                {/* Eyes */}
                <circle cx="26" cy="44" r="1.8" fill="#1E293B" />
                <circle cx="34" cy="44" r="1.8" fill="#1E293B" />
                {/* Smile & Cheeks */}
                <ellipse cx="23" cy="48" rx="2" ry="1" fill="#F472B6" opacity="0.6" />
                <ellipse cx="37" cy="48" rx="2" ry="1" fill="#F472B6" opacity="0.6" />
                <path d="M28 49 Q30 52 32 49" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              {/* Open Green Al-Qur'an Book in front of both */}
              <g transform="translate(50, 72)">
                {/* Left Page */}
                <path
                  d="M30 18 C20 12 8 14 0 16 L2 35 C10 33 22 31 30 37 Z"
                  fill="#10B981"
                  stroke="#047857"
                  strokeWidth="1.5"
                />
                {/* Right Page */}
                <path
                  d="M30 18 C40 12 52 14 60 16 L58 35 C50 33 38 31 30 37 Z"
                  fill="#059669"
                  stroke="#047857"
                  strokeWidth="1.5"
                />
                {/* Book Spine */}
                <path d="M30 18 L30 37" stroke="#FBBF24" strokeWidth="2" />
                {/* Gold Book Lines */}
                <path d="M6 22 Q16 20 25 24" stroke="#FDE68A" strokeWidth="1" strokeLinecap="round" />
                <path d="M6 26 Q16 24 25 28" stroke="#FDE68A" strokeWidth="1" strokeLinecap="round" />
                <path d="M35 24 Q44 20 54 22" stroke="#FDE68A" strokeWidth="1" strokeLinecap="round" />
                <path d="M35 28 Q44 24 54 26" stroke="#FDE68A" strokeWidth="1" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 9-GRID MENU (3x3): Icon pastel seragam persis sesuai Education UI Kits */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-5 mb-8">
        {gridMenuItems.map((item, idx) => {
          const IconComponent = item.icon;
          const isDrawer = item.action === "drawer";
          const isGaleri = item.action === "galeri";

          if (isDrawer) {
            return (
              <button
                key={`menu-${idx}`}
                type="button"
                onClick={handleOpenDrawer}
                className="flex flex-col items-center justify-center text-center group active:scale-95 transition-transform"
              >
                <div
                  className={`w-15 h-15 sm:w-16 sm:h-16 rounded-[22px] ${item.bg} ${item.border} ${item.color} flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <IconComponent className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          if (isGaleri) {
            return (
              <button
                key={`menu-${idx}`}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsGaleriOpen(true);
                }}
                className="flex flex-col items-center justify-center text-center group active:scale-95 transition-transform"
              >
                <div
                  className={`w-15 h-15 sm:w-16 sm:h-16 rounded-[22px] ${item.bg} ${item.border} ${item.color} flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <IconComponent className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={`menu-${idx}`}
              href={item.href || "/dashboard"}
              onClick={triggerHaptic}
              className="flex flex-col items-center justify-center text-center group active:scale-95 transition-transform"
            >
              <div
                className={`w-15 h-15 sm:w-16 sm:h-16 rounded-[22px] ${item.bg} ${item.border} ${item.color} flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform`}
              >
                <IconComponent className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. FEED SECTION: Ringkasan Tagihan Keuangan (Screen 6 Preview)            */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Tagihan Terkini
          </span>
          <Link
            href="/dashboard/spp-transportasi"
            className="text-[11px] font-bold text-[#056839] hover:underline flex items-center gap-0.5"
          >
            <span>Rincian</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card Keuangan sesuai Screen 6 */}
        <div className="p-4 rounded-[22px] bg-slate-50/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Tagihan</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatRupiah(displayTotalTagihan).replace(",00", "")}
            </p>
          </div>
          <Link
            href="/dashboard/spp-transportasi"
            onClick={triggerHaptic}
            className="px-4 py-2.5 rounded-xl bg-[#056839] hover:bg-[#04522d] text-white text-xs font-bold shadow-xs active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <span>Bayar Sekarang</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FEED SECTION: Tugas & Agenda Terkini (Screen 9 & 10 Preview)          */}
      {/* ========================================================================= */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Tugas & Agenda Santri
          </span>
          <Link
            href="/dashboard/lms"
            className="text-[11px] font-bold text-[#056839] hover:underline flex items-center gap-0.5"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Item 1: Tugas Bahasa Indonesia */}
        <Link
          href="/dashboard/lms"
          onClick={triggerHaptic}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3 active:scale-98 transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              Bahasa Indonesia
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Membuat rangkuman cerita &bull; Batas: 25 September
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </Link>

        {/* Item 2: Pengumuman STS */}
        <Link
          href="/dashboard/pengumuman"
          onClick={triggerHaptic}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3 active:scale-98 transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#056839] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              Pelaksanaan Sumatif Tengah Semester
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Agenda Kurikulum Merdeka &bull; 24 September 2026
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODALS: Profil Siswa, Pesan / Buku Penghubung, Galeri                 */}
      {/* ========================================================================= */}
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

      <MobileGaleriModal
        isOpen={isGaleriOpen}
        onClose={() => setIsGaleriOpen(false)}
      />
    </div>
  );
}
