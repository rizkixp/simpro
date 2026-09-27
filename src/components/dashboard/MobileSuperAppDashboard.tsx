"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { formatRupiah } from "@/lib/utils";
import {
  Menu,
  ChevronRight,
  Camera,
  BookOpen,
  Clock,
  Sparkles,
  CreditCard,
  PiggyBank,
  HeartHandshake,
  CheckCircle2,
  X,
  ArrowRight,
  CalendarCheck2,
  Award,
  Bell,
} from "lucide-react";

export default function MobileSuperAppDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    siswaList,
    presensiList,
    sppList,
    tabunganList,
    tahfidzList,
    mutabaahList,
  } = useSchoolData();

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [photoStep, setPhotoStep] = useState<"ready" | "capturing" | "done">("ready");

  // Nama Pengguna / Santri
  const firstName = useMemo(() => {
    if (!user?.name) return "Santri";
    const clean = user.name.replace(/^(wali murid|wali santri|wali|orang tua|ayah|bunda|ibu|abi|umi)\s+/i, "").trim();
    return clean.split(" ")[0] || "Santri";
  }, [user]);

  // Data santri aktif
  const currentSiswa = useMemo(() => {
    const childNameFromUser =
      user?.phone ||
      user?.name?.replace(/^(wali murid|wali santri|wali|orang tua|ayah|bunda|ibu|abi|umi)\s+/i, "").trim() ||
      "Santri Terdaftar";

    const fallbackStudent = {
      id: "sis-default",
      nisn: user?.nisnOrNip || "0012345678",
      nama: user?.role === "ortu" ? childNameFromUser : user?.name || "Ahmad Rizky Pratama",
      kelas: user?.kelas || "1A",
      jenisKelamin: "L" as const,
      status: "Aktif" as const,
      avatar:
        user?.avatar ||
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      namaWali: user?.role === "ortu" ? user.name : "Wali Santri",
      noHpWali: "0812-3456-7890",
    };

    return (
      (siswaList || []).find(
        (s) =>
          (user?.nisnOrNip && s.nisn === user.nisnOrNip) ||
          (user?.phone && s.nama.toLowerCase() === user.phone.toLowerCase()) ||
          (user?.phone && s.nama.toLowerCase().includes(user.phone.toLowerCase())) ||
          (user?.role !== "ortu" && s.nama.toLowerCase().includes("ahmad rizky"))
      ) ||
      (user?.role === "ortu" ? fallbackStudent : (siswaList && siswaList[0]) || fallbackStudent)
    );
  }, [siswaList, user]);

  // Status Tabungan & SPP
  const displaySaldo = useMemo(() => {
    if (user?.role === "ortu" || user?.role === "siswa") {
      const studentTabungan = tabunganList.find((t) => t.siswaId === currentSiswa?.id);
      return studentTabungan ? studentTabungan.saldo : 1450000;
    }
    const totalTabungan = tabunganList.reduce((acc, curr) => acc + (curr.saldo || 0), 0);
    return totalTabungan || 24850000;
  }, [tabunganList, user, currentSiswa]);

  const sppStatus = useMemo(() => {
    if (user?.role === "ortu" || user?.role === "siswa") {
      const studentSpp = sppList.filter((s) => s.siswaId === currentSiswa?.id);
      const hasUnpaid = studentSpp.some((s) => s.status === "Belum Lunas" || s.status === "Jatuh Tempo");
      return hasUnpaid ? "Tagihan SPP Belum Lunas" : "SPP Lunas Bulan Ini";
    }
    return "Status SPP Terkelola";
  }, [sppList, user, currentSiswa]);

  // Haptic feedback ringan
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

  const handleCaptureAction = () => {
    triggerHaptic();
    setPhotoStep("capturing");
    setTimeout(() => {
      setPhotoStep("done");
      setTimeout(() => {
        setIsCameraModalOpen(false);
        setPhotoStep("ready");
      }, 1400);
    }, 1200);
  };

  return (
    <div className="lg:hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 pb-28 min-h-screen bg-[#fcfdff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-5 pt-5 select-none">
      {/* 1. TOP HEADER: Hamburger Menu */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleOpenDrawer}
          className="p-1 text-slate-900 dark:text-white hover:opacity-75 active:scale-95 transition-transform cursor-pointer"
          aria-label="Buka Menu"
        >
          {/* Hamburger icon with 3 bold lines matching the design */}
          <div className="w-6 h-5 flex flex-col justify-between py-0.5">
            <span className="w-6 h-1 bg-slate-900 dark:bg-white rounded-full" />
            <span className="w-6 h-1 bg-slate-900 dark:bg-white rounded-full" />
            <span className="w-6 h-1 bg-slate-900 dark:bg-white rounded-full" />
          </div>
        </button>

        <Link
          href="/dashboard/pengumuman"
          onClick={triggerHaptic}
          className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifikasi"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
        </Link>
      </div>

      {/* 2. GREETING TITLE: Welcome, [Name]! */}
      <div className="mb-5">
        <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Welcome,{firstName}!
        </h1>
      </div>

      {/* 3. CARD 1: Congratulations! Streak Banner (Pastel Yellow / Peach) */}
      <Link
        href="/dashboard/mutabaah"
        onClick={triggerHaptic}
        className="block mb-5 relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#ffeab3] via-[#ffdf8a] to-[#ffd470] dark:from-amber-400 dark:to-amber-500 p-4 sm:p-5 shadow-sm active:scale-[0.98] transition-all group"
      >
        {/* Subtle decorative background circles */}
        <div className="absolute top-2 right-14 w-12 h-12 rounded-full bg-white/20 blur-xs pointer-events-none" />
        <div className="absolute -bottom-4 left-24 w-16 h-16 rounded-full bg-amber-300/30 blur-sm pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight">
              Congratulations!
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-800/90 mt-0.5">
              You have been streak for <span className="font-black text-slate-950 text-sm sm:text-base">7</span> days
            </p>
          </div>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-800 shrink-0 group-hover:translate-x-0.5 transition-transform">
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </Link>

      {/* 4. CARD 2: Hero Mascot Card - "Check Your Steps" (Pastel Sky Blue) */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#bde7ff] via-[#cceeff] to-[#aee1fc] p-6 shadow-sm border border-sky-200/50 flex flex-col items-center justify-center text-center">
        {/* Subtle background marine elements (bubbles & bottle silhouette) */}
        <div className="absolute top-8 left-6 w-8 h-8 rounded-full bg-white/40 blur-2xs pointer-events-none" />
        <div className="absolute top-28 left-8 w-4 h-4 rounded-full bg-white/50 blur-2xs pointer-events-none" />
        <div className="absolute top-14 right-8 w-6 h-14 rounded-full bg-white/20 -rotate-45 pointer-events-none" />
        <div className="absolute bottom-16 right-6 w-9 h-9 rounded-full bg-white/35 blur-2xs pointer-events-none" />

        {/* Mascot: Adorable Blue Dolphin with Lifebuoy Float */}
        <div className="relative z-10 my-1">
          <svg
            viewBox="0 0 200 200"
            className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-sm select-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Water splashes at bottom */}
            <path d="M70 170 C60 160 50 165 45 172 C55 175 65 174 70 170 Z" fill="#E0F2FE" opacity="0.9" />
            <path d="M130 170 C140 160 150 165 155 172 C145 175 135 174 130 170 Z" fill="#E0F2FE" opacity="0.9" />
            <path d="M85 178 C95 182 105 182 115 178 C110 185 90 185 85 178 Z" fill="#BAE6FD" />

            {/* Dolphin tail below swim ring */}
            <path
              d="M92 160 C90 172 82 178 78 184 C88 182 98 175 100 170 C102 175 112 182 122 184 C118 178 110 172 108 160 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Left Flipper / Waving Hand */}
            <path
              d="M60 115 C45 105 32 90 40 80 C48 78 60 92 68 108 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Right Flipper */}
            <path
              d="M140 115 C155 120 168 135 160 142 C152 144 142 132 135 122 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Dolphin Body / Head */}
            <path
              d="M100 35 C65 35 55 65 58 110 C60 140 75 155 100 155 C125 155 140 140 142 110 C145 65 135 35 100 35 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="2.5"
            />

            {/* Dorsal Fin on top back */}
            <path
              d="M96 35 C98 20 108 12 118 15 C116 25 108 32 104 36 Z"
              fill="#0EA5E9"
              stroke="#0284C7"
              strokeWidth="2"
            />

            {/* White Belly & Chin */}
            <path
              d="M100 65 C80 65 72 85 74 125 C75 145 88 152 100 152 C112 152 125 145 126 125 C128 85 120 65 100 65 Z"
              fill="#F0F9FF"
            />

            {/* Swim Ring (Red & White striped Lifebuoy) */}
            <ellipse cx="100" cy="142" rx="44" ry="16" fill="#EF4444" stroke="#B91C1C" strokeWidth="2.5" />
            {/* White stripes on swim ring */}
            <path d="M72 136 C74 133 79 133 82 137 L79 149 C76 150 71 149 70 146 Z" fill="#FFFFFF" />
            <path d="M118 137 C121 133 126 133 128 136 L130 146 C129 149 124 150 121 149 Z" fill="#FFFFFF" />
            <path d="M96 128 C98 127 102 127 104 128 L104 158 C102 158 98 158 96 158 Z" fill="#FFFFFF" />

            {/* Cute Dolphin Cheeks */}
            <ellipse cx="74" cy="98" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.85" />
            <ellipse cx="126" cy="98" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.85" />

            {/* Big Happy Eyes */}
            <ellipse cx="80" cy="80" rx="9" ry="12" fill="#0F172A" />
            <ellipse cx="78" cy="76" rx="4" ry="5.5" fill="#FFFFFF" />
            <circle cx="83" cy="84" r="2" fill="#FFFFFF" />

            <ellipse cx="120" cy="80" rx="9" ry="12" fill="#0F172A" />
            <ellipse cx="118" cy="76" rx="4" ry="5.5" fill="#FFFFFF" />
            <circle cx="123" cy="84" r="2" fill="#FFFFFF" />

            {/* Snout / Open Smile */}
            <path d="M82 94 C90 106 110 106 118 94 C115 116 85 116 82 94 Z" fill="#0F172A" />
            {/* Tongue */}
            <path d="M88 102 C94 112 106 112 112 102 C108 114 92 114 88 102 Z" fill="#F472B6" />
          </svg>
        </div>

        {/* Title: Check Your Steps */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 mb-3">
          Check Your Steps
        </h2>

        {/* Big Dark Navy / Indigo Circular Camera Action Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsCameraModalOpen(true);
          }}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#1b1747] hover:bg-[#141038] shadow-xl shadow-indigo-950/25 ring-4 ring-white/60 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
          title="Buka Kamera Aktivitas"
          aria-label="Buka Kamera Presensi dan Aktivitas"
        >
          <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2]" />
        </button>
      </div>

      {/* 5. CARDS 3 & 4: Two Bento Cards - "Practice" & "History" */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 mt-4">
        {/* Left Card: Practice (Pastel Pink) */}
        <Link
          href="/dashboard/lms"
          onClick={triggerHaptic}
          className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#ffd5e5] via-[#ffc6dc] to-[#ffb6d3] p-5 shadow-xs flex flex-col items-center justify-center text-center group active:scale-95 transition-all cursor-pointer"
        >
          {/* Subtle math watermark on bottom left */}
          <span className="absolute bottom-1 left-2 text-2xl font-serif font-black text-pink-400/30 select-none pointer-events-none">
            √x
          </span>

          <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center mb-2.5 text-pink-600 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6 stroke-[2.2]" />
          </div>

          <span className="text-sm font-black text-[#9d174d] tracking-tight">
            Practice
          </span>
        </Link>

        {/* Right Card: History (Pastel Purple / Lavender) */}
        <Link
          href="/dashboard/nilai"
          onClick={triggerHaptic}
          className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#dfd8fd] via-[#d5cafc] to-[#c7bafc] p-5 shadow-xs flex flex-col items-center justify-center text-center group active:scale-95 transition-all cursor-pointer"
        >
          {/* Subtle geometry watermark on bottom left */}
          <span className="absolute bottom-1 left-3 text-xl font-black text-purple-400/30 select-none pointer-events-none">
            📐
          </span>

          <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center mb-2.5 text-purple-600 group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>

          <span className="text-sm font-black text-[#5b21b6] tracking-tight">
            History
          </span>
        </Link>
      </div>

      {/* 6. SECONDARY EDUCATION SHORTCUTS (SPP, Tahfidz, Tabungan) */}
      <div className="mt-6 pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Menu Sekolah
          </span>
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
          >
            <span>Semua Modul</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Shortcut 1: SPP */}
          <Link
            href="/dashboard/spp-transportasi"
            onClick={triggerHaptic}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col items-center text-center active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-1.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">SPP & Bus</span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate w-full mt-0.5">
              {sppStatus.includes("Lunas") ? "Lunas ✓" : "Cek Tagihan"}
            </span>
          </Link>

          {/* Shortcut 2: Tahfidz */}
          <Link
            href="/dashboard/tahfidz"
            onClick={triggerHaptic}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col items-center text-center active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center mb-1.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Tahfidz</span>
            <span className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold truncate w-full mt-0.5">
              Juz 30
            </span>
          </Link>

          {/* Shortcut 3: Tabungan */}
          <Link
            href="/dashboard/tabungan"
            onClick={triggerHaptic}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col items-center text-center active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-1.5">
              <PiggyBank className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Tabungan</span>
            <span className="text-[9px] text-amber-700 dark:text-amber-400 font-semibold truncate w-full mt-0.5 font-mono">
              {formatRupiah(displaySaldo).replace(",00", "")}
            </span>
          </Link>
        </div>
      </div>

      {/* 7. INTERACTIVE CAMERA CHECK-IN MODAL (When tapping the center camera button) */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-[#1b1747] dark:text-indigo-300 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Check Your Steps
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Dokumentasikan aktivitas belajar, mutaba&apos;ah mandiri, atau ambil presensi kehadiran harian ananda.
            </p>

            {photoStep === "ready" && (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCaptureAction}
                  className="w-full py-3 px-4 rounded-2xl bg-[#1b1747] hover:bg-[#141038] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto Kehadiran / Aktivitas</span>
                </button>

                <Link
                  href="/dashboard/presensi"
                  onClick={() => setIsCameraModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-200 font-semibold text-xs flex items-center justify-center gap-2 border border-sky-200 dark:border-sky-800"
                >
                  <CalendarCheck2 className="w-4 h-4" />
                  <span>Buka Halaman Presensi Lengkap</span>
                </Link>

                <Link
                  href="/dashboard/mutabaah"
                  onClick={() => setIsCameraModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-pink-50 dark:bg-pink-950 text-pink-800 dark:text-pink-200 font-semibold text-xs flex items-center justify-center gap-2 border border-pink-200 dark:border-pink-800"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Isi Mutaba&apos;ah Yaumiyah Mandiri</span>
                </Link>
              </div>
            )}

            {photoStep === "capturing" && (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mengambil foto & mencatat langkah santri...
                </p>
              </div>
            )}

            {photoStep === "done" && (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Alhamdulillah! Langkah & Ibadah Berhasil Dicatat!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
