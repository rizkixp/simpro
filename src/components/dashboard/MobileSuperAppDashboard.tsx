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
  Bell,
  CalendarDays,
  FileText,
  User,
  CheckCircle2,
  PiggyBank,
  Megaphone,
  Image as ImageIcon,
  LayoutGrid,
  ChevronRight,
  Receipt,
  BookOpen,
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

  // Current active student - defaults to "Ahmad Fauzan" from reference UI
  const currentSiswa = useMemo(() => {
    const childNameFromUser =
      user?.phone ||
      user?.name?.replace(/^(wali murid|wali santri|wali|orang tua|ayah|bunda|ibu|abi|umi)\s+/i, "").trim() ||
      "Ahmad Fauzan";

    const fallbackStudent: Siswa = {
      id: "sis-default",
      nisn: user?.nisnOrNip || "20230015",
      nama: user?.role === "ortu" ? childNameFromUser : "Ahmad Fauzan",
      kelas: user?.kelas || "Kelas 3 Al Farabi",
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

  const schoolName = profile?.namaSekolah || "SD Islam Baitun Naim";

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

  // 9-Grid Menu: [Jadwal, Tugas, Nilai, Absensi, Tagihan, Tabungan, Pengumuman, Galeri, Lainnya]
  // Colors and icons matched 1:1 with reference screenshot
  const gridMenuItems = [
    {
      label: "Jadwal",
      href: "/dashboard/jadwal",
      icon: CalendarDays,
      bg: "bg-[#e0f2fe] dark:bg-sky-950/50",
      color: "text-[#0284c7]",
    },
    {
      label: "Tugas",
      href: "/dashboard/lms",
      icon: FileText,
      bg: "bg-[#dcfce7] dark:bg-emerald-950/50",
      color: "text-[#059669]",
    },
    {
      label: "Nilai",
      href: "/dashboard/nilai",
      icon: User,
      bg: "bg-[#ffedd5] dark:bg-orange-950/50",
      color: "text-[#ea580c]",
    },
    {
      label: "Absensi",
      href: "/dashboard/presensi",
      icon: CheckCircle2,
      bg: "bg-[#dcfce7] dark:bg-emerald-950/50",
      color: "text-[#16a34a]",
    },
    {
      label: "Tagihan",
      href: "/dashboard/spp-transportasi",
      icon: Receipt,
      bg: "bg-[#fef9c3] dark:bg-yellow-950/50",
      color: "text-[#d97706]",
    },
    {
      label: "Tabungan",
      href: "/dashboard/tabungan",
      icon: PiggyBank,
      bg: "bg-[#ffe4e6] dark:bg-rose-950/50",
      color: "text-[#e11d48]",
    },
    {
      label: "Pengumuman",
      href: "/dashboard/pengumuman",
      icon: Megaphone,
      bg: "bg-[#e0e7ff] dark:bg-indigo-950/50",
      color: "text-[#2563eb]",
    },
    {
      label: "Galeri",
      action: "galeri",
      icon: ImageIcon,
      bg: "bg-[#f3e8ff] dark:bg-purple-950/50",
      color: "text-[#7c3aed]",
    },
    {
      label: "Lainnya",
      action: "drawer",
      icon: LayoutGrid,
      bg: "bg-[#f1f5f9] dark:bg-slate-800/80",
      color: "text-[#334155] dark:text-slate-300",
    },
  ];

  return (
    <div className="lg:hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 pb-28 min-h-screen bg-[#ffffff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-5 pt-4 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP BAR: Mother in Hijab Avatar, Sapaan & Bell with Red Badge "3"     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Circular Hijab Mother Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden p-0.5 bg-slate-100 dark:bg-slate-800 shadow-xs shrink-0 border border-slate-200/80 dark:border-slate-700">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full rounded-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="#E2E8F0" />
              {/* Soft Cream Hijab Background */}
              <ellipse cx="50" cy="55" rx="36" ry="42" fill="#EADBC8" />
              {/* Shoulders / Blouse */}
              <path d="M12 96 C14 75 35 70 50 70 C65 70 86 75 88 96 Z" fill="#DAC0A3" />
              {/* Inner Face Oval */}
              <ellipse cx="50" cy="46" rx="20" ry="24" fill="#FDE68A" />
              {/* Inner Hijab Frame */}
              <path
                d="M30 42 C30 20 70 20 70 42 C70 60 65 66 50 66 C35 66 30 60 30 42 Z"
                fill="#F8F0E5"
              />
              <ellipse cx="50" cy="47" rx="16" ry="18" fill="#FCD34D" />
              {/* Eyes */}
              <ellipse cx="43" cy="45" rx="2.5" ry="3" fill="#1E293B" />
              <ellipse cx="57" cy="45" rx="2.5" ry="3" fill="#1E293B" />
              <circle cx="44" cy="44" r="0.8" fill="#FFFFFF" />
              <circle cx="58" cy="44" r="0.8" fill="#FFFFFF" />
              {/* Cheeks */}
              <ellipse cx="39" cy="50" rx="3" ry="1.5" fill="#F472B6" opacity="0.6" />
              <ellipse cx="61" cy="50" rx="3" ry="1.5" fill="#F472B6" opacity="0.6" />
              {/* Gentle Smile */}
              <path d="M46 52 Q50 56 54 52" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
              Assalamu'alaikum
            </p>
            <h1 className="text-lg font-black text-[#0f172a] dark:text-white leading-tight">
              {greetingTitle}
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
              Selamat datang di aplikasi sekolah
            </p>
          </div>
        </div>

        {/* Notification Bell with Red Badge "3" */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsPesanOpen(true);
          }}
          className="relative p-2 rounded-full text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Pesan & Notifikasi"
          aria-label="Notifikasi Sekolah"
        >
          <Bell className="w-6 h-6 stroke-[2]" />
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
            3
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO STUDENT CARD: Pastel Mint Green Card with 3D Boy Student Avatar  */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#dcfce7]/70 via-[#f0fdf4] to-[#d1fae5]/60 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/40 border border-emerald-200/70 dark:border-emerald-800/40 p-4 shadow-xs mb-6">
        <div className="flex items-center gap-4">
          {/* 3D Student Character Avatar (Boy with backpack) */}
          <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-emerald-100 dark:border-emerald-800 shrink-0 flex items-center justify-center p-1">
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Soft warm background */}
              <rect width="120" height="120" rx="16" fill="#F0FDF4" />

              {/* Blue Backpack behind */}
              <ellipse cx="60" cy="85" rx="38" ry="30" fill="#3B82F6" />
              <path d="M28 85 L28 115 L92 115 L92 85 Z" fill="#2563EB" />

              {/* White Polo Shirt / Green Uniform Vest */}
              <path d="M30 82 L38 120 L82 120 L90 82 Z" fill="#FFFFFF" />
              {/* Green Vest / Straps */}
              <path d="M30 82 L38 120 L48 120 L42 82 Z" fill="#059669" />
              <path d="M90 82 L82 120 L72 120 L78 82 Z" fill="#059669" />
              {/* Collar & Tie/Badge */}
              <path d="M48 80 L60 92 L72 80 Z" fill="#E2E8F0" />
              <circle cx="60" cy="100" r="2.5" fill="#F59E0B" />

              {/* Neck */}
              <rect x="52" y="70" width="16" height="15" fill="#FCD34D" rx="4" />

              {/* Ears */}
              <ellipse cx="32" cy="50" rx="6" ry="8" fill="#FCD34D" />
              <ellipse cx="88" cy="50" rx="6" ry="8" fill="#FCD34D" />

              {/* Boy Head / Face */}
              <ellipse cx="60" cy="50" rx="28" ry="30" fill="#FDE68A" />

              {/* Hair (Short neat brown/black 3D hair) */}
              <path
                d="M32 44 C30 20 50 12 60 12 C72 12 90 20 88 44 C84 35 78 30 70 32 C62 30 54 28 46 34 C40 32 34 38 32 44 Z"
                fill="#271C19"
              />
              <path d="M32 40 C34 32 42 26 50 28 C45 32 40 38 36 44 Z" fill="#3E2723" />

              {/* Big Sparkling Eyes */}
              <ellipse cx="48" cy="48" rx="5" ry="6.5" fill="#1E293B" />
              <ellipse cx="72" cy="48" rx="5" ry="6.5" fill="#1E293B" />
              <circle cx="49.5" cy="46" r="2" fill="#FFFFFF" />
              <circle cx="73.5" cy="46" r="2" fill="#FFFFFF" />
              <circle cx="47" cy="50" r="1" fill="#FFFFFF" />
              <circle cx="71" cy="50" r="1" fill="#FFFFFF" />

              {/* Eyebrows */}
              <path d="M43 40 Q48 37 53 40" stroke="#271C19" strokeWidth="2" strokeLinecap="round" />
              <path d="M67 40 Q72 37 77 40" stroke="#271C19" strokeWidth="2" strokeLinecap="round" />

              {/* Rosy Cheeks */}
              <ellipse cx="40" cy="56" rx="4" ry="2.5" fill="#F472B6" opacity="0.65" />
              <ellipse cx="80" cy="56" rx="4" ry="2.5" fill="#F472B6" opacity="0.65" />

              {/* Friendly Nose & Happy Smile */}
              <path d="M59 52 Q60 55 61 52" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M50 58 Q60 70 70 58"
                fill="#991B1B"
                stroke="#1E293B"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M54 60 Q60 66 66 60" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Student Info & Lihat Profil Button */}
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white leading-tight truncate">
              {currentSiswa?.nama || "Ahmad Fauzan"}
            </h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 truncate">
              {currentSiswa?.kelas?.startsWith("Kelas") ? currentSiswa.kelas : `Kelas ${currentSiswa?.kelas || "3 Al Farabi"}`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {schoolName}
            </p>

            {/* Dark Green Pill Button: "Lihat Profil" */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsProfileOpen(true);
              }}
              className="mt-2.5 px-4 py-1.5 rounded-full bg-[#056839] hover:bg-[#04522d] text-white text-xs font-bold shadow-xs active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer"
            >
              Lihat Profil
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 9-GRID MENU (3x3): Icon Pastel Seragam Sesuai Mockup Referensi        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 mb-7">
        {gridMenuItems.map((item, idx) => {
          const IconComponent = item.icon;
          const isDrawer = item.action === "drawer";
          const isGaleri = item.action === "galeri";

          if (isDrawer) {
            return (
              <button
                key={`grid-${idx}`}
                type="button"
                onClick={handleOpenDrawer}
                className="flex flex-col items-center justify-center text-center group active:scale-95 transition-transform"
              >
                <div
                  className={`w-15 h-15 sm:w-16 sm:h-16 rounded-[22px] ${item.bg} ${item.color} flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform`}
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
                key={`grid-${idx}`}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsGaleriOpen(true);
                }}
                className="flex flex-col items-center justify-center text-center group active:scale-95 transition-transform"
              >
                <div
                  className={`w-15 h-15 sm:w-16 sm:h-16 rounded-[22px] ${item.bg} ${item.color} flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform`}
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
              key={`grid-${idx}`}
              href={item.href || "/dashboard"}
              onClick={triggerHaptic}
              className="flex flex-col items-center justify-center text-center group active:scale-95 transition-transform"
            >
              <div
                className={`w-15 h-15 sm:w-16 sm:h-16 rounded-[22px] ${item.bg} ${item.color} flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform`}
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
      {/* 4. SECTION: Pengumuman Terbaru Sesuai Mockup Referensi                    */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-[#0f172a] dark:text-white mb-3">
          Pengumuman Terbaru
        </h3>

        {/* Card Pengumuman: Pelaksanaan Sumatif Tengah Semester */}
        <Link
          href="/dashboard/pengumuman"
          onClick={triggerHaptic}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5 active:scale-98 transition-transform group"
        >
          {/* Soft Purple Book / Announcement Icon */}
          <div className="w-12 h-12 rounded-2xl bg-[#e0e7ff] text-[#4f46e5] flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-white leading-snug group-hover:text-[#056839] transition-colors">
              Pelaksanaan Sumatif Tengah Semester
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
              20 Sep 2026
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS: Profil Siswa, Pesan / Buku Penghubung, Galeri                 */}
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
