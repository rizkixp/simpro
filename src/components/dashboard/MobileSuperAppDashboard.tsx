"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { Siswa } from "@/types/school";
import MobileStudentProfileModal from "@/components/dashboard/MobileStudentProfileModal";
import MobileBukuPesanDrawer from "@/components/dashboard/MobileBukuPesanDrawer";
import MobileGaleriModal from "@/components/dashboard/MobileGaleriModal";
import MobileSchoolStoriesModal, { DEFAULT_STORIES, SchoolStory } from "@/components/dashboard/MobileSchoolStoriesModal";
import MobileStreakDetailModal from "@/components/dashboard/MobileStreakDetailModal";
import MobileChildSwitcherModal, { ChildAccount, DEFAULT_CHILDREN } from "@/components/dashboard/MobileChildSwitcherModal";
import MobileSkeletonDashboard from "@/components/dashboard/MobileSkeletonDashboard";
import {
  Search,
  ChevronRight,
  ChevronDown,
  ArrowDown,
  RefreshCw,
  Sparkles,
  MessageCircle,
  X,
  Check,
  CalendarCheck2,
  BookOpenCheck,
  BookOpen,
  HeartHandshake,
  Bus,
  Wallet,
  PiggyBank,
  Award,
  CalendarDays,
  Clock,
  ShieldCheck,
  Flame,
  Star,
  CheckCircle2,
  ArrowUpRight,
  AlertCircle,
  Bell,
  Sun,
  Moon,
  Compass,
} from "lucide-react";

interface MobileSuperAppDashboardProps {
  forceShow?: boolean;
}

export default function MobileSuperAppDashboard({ forceShow = false }: MobileSuperAppDashboardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    siswaList,
    profile,
    presensiList,
    sppList,
    tahfidzList,
    mutabaahList,
    jadwalList,
    nilaiList,
    syncWithSupabase,
    isSyncing,
  } = useSchoolData();

  // Pull-to-Refresh Gesture State
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const pullStartYRef = useRef(0);
  const hasVibratedThresholdRef = useRef(false);

  // Haptic feedback
  const triggerHaptic = (pattern?: number | number[] | React.SyntheticEvent) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        if (typeof pattern === "number" || Array.isArray(pattern)) {
          navigator.vibrate(pattern);
        } else {
          navigator.vibrate(10);
        }
      } catch {}
    }
  };

  const handleFeedTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.scrollY <= 2) {
      pullStartYRef.current = e.touches[0].clientY;
      hasVibratedThresholdRef.current = false;
      setIsPulling(true);
    }
  };

  const handleFeedTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - pullStartYRef.current;
    if (delta > 0) {
      const damped = Math.min(Math.pow(delta, 0.8) * 2.2, 85);
      setPullY(damped);
      if (damped > 60 && !hasVibratedThresholdRef.current) {
        hasVibratedThresholdRef.current = true;
        triggerHaptic(15);
      } else if (damped <= 60 && hasVibratedThresholdRef.current) {
        hasVibratedThresholdRef.current = false;
      }
    }
  };

  const handleFeedTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullY > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(48);
      triggerHaptic([15, 35, 20]);

      try {
        if (syncWithSupabase) {
          await syncWithSupabase();
        }
      } catch {}

      await new Promise((r) => setTimeout(r, 850));

      setIsRefreshing(false);
      setPullY(0);
      setShowRefreshToast(true);
      setTimeout(() => setShowRefreshToast(false), 2200);
    } else {
      setPullY(0);
    }
  };

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPesanOpen, setIsPesanOpen] = useState(false);
  const [isGaleriOpen, setIsGaleriOpen] = useState(false);
  const [isTemanBelajarOpen, setIsTemanBelajarOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isChildSwitcherOpen, setIsChildSwitcherOpen] = useState(false);
  const [activeMascot, setActiveMascot] = useState<"robo" | "dino" | "kucing" | "bintang">("robo");
  const [searchQuery, setSearchQuery] = useState("");

  // Active child for Multi-Child Switcher (persisted in sessionStorage)
  const [activeChild, setActiveChild] = useState<ChildAccount>(() => {
    if (typeof window !== "undefined") {
      const storedId = sessionStorage.getItem("sim_active_child_id");
      const found = DEFAULT_CHILDREN.find((c) => c.id === storedId || c.nisn === storedId);
      if (found) return found;
    }
    return DEFAULT_CHILDREN[0];
  });

  const handleSelectChild = (child: ChildAccount) => {
    setActiveChild(child);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sim_active_child_id", child.id);
    }
  };

  // Stories state
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Time-aware greeting & context
  const [timeContext, setTimeContext] = useState<"pagi" | "siang" | "sore" | "malam">("pagi");
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTimeStr(`${hour.toString().padStart(2, "0")}:${minutes} WIB`);

      if (hour >= 4 && hour < 11) {
        setTimeContext("pagi");
      } else if (hour >= 11 && hour < 15) {
        setTimeContext("siang");
      } else if (hour >= 15 && hour < 18) {
        setTimeContext("sore");
      } else {
        setTimeContext("malam");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Current active student mapped to activeChild
  const currentSiswa = useMemo(() => {
    const fallbackStudent: Siswa = {
      id: activeChild.id,
      nisn: activeChild.nisn,
      nama: activeChild.nama,
      kelas: activeChild.kelas.startsWith("Kelas") ? activeChild.kelas : `Kelas ${activeChild.kelas}`,
      jenisKelamin: activeChild.jenisKelamin,
      tanggalLahir: "2016-01-12",
      tempatLahir: "Medan",
      alamat: "Jl. Melati No. 10, Medan",
      status: "Aktif" as const,
      avatar: activeChild.avatar,
      namaWali: user?.role === "ortu" ? user.name : "Bapak Rizki F., Ibu Sari",
      noHpWali: "0812-3456-7890",
    };

    return (
      (siswaList || []).find(
        (s) =>
          (activeChild.nisn && s?.nisn === activeChild.nisn) ||
          (activeChild.nama && s?.nama && s.nama.toLowerCase().includes(activeChild.nama.toLowerCase()))
      ) || fallbackStudent
    );
  }, [siswaList, user, activeChild]);

  // Check presensi hari ini
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayPresensi = useMemo(() => {
    return (presensiList || []).find(
      (p) => p.siswaId === currentSiswa.id && p.tanggal === todayStr
    );
  }, [presensiList, currentSiswa.id, todayStr]);

  const handleOpenDrawer = () => {
    triggerHaptic();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-mobile-drawer"));
    }
  };

  const handleSearchTrigger = () => {
    triggerHaptic();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    }
  };

  const handleOpenStory = (index: number) => {
    triggerHaptic();
    setSelectedStoryIndex(index);
    setIsStoryOpen(true);
  };

  return (
    <div
      onTouchStart={handleFeedTouchStart}
      onTouchMove={handleFeedTouchMove}
      onTouchEnd={handleFeedTouchEnd}
      className={`${
        forceShow
          ? "block max-w-md mx-auto my-4 shadow-2xl rounded-[40px] overflow-hidden border-[8px] border-slate-900 ring-1 ring-slate-800"
          : "lg:hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6"
      } pb-28 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 select-none relative font-sans`}
    >
      {/* Simulated Phone Top Speaker (Desktop Preview Mode) */}
      {forceShow && (
        <div className="w-28 h-4 bg-slate-900 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
      )}

      {/* Pull-To-Refresh Visual Elastic Indicator */}
      <div
        className="w-full flex items-center justify-center overflow-hidden transition-all duration-150 select-none"
        style={{
          height: isRefreshing ? "48px" : `${pullY}px`,
          opacity: pullY > 12 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-800 text-white shadow-md text-xs font-bold border border-emerald-600/50">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
              <span>Menyegarkan data SDI Smart...</span>
            </>
          ) : pullY > 60 ? (
            <>
              <ArrowDown className="w-3.5 h-3.5 text-amber-300 rotate-180 transition-transform" />
              <span>Lepaskan untuk menyegarkan</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-3.5 h-3.5 text-emerald-200" />
              <span>Tarik untuk menyegarkan...</span>
            </>
          )}
        </div>
      </div>

      {/* Floating Refresh Success Toast */}
      {showRefreshToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-800 text-white text-xs font-bold shadow-2xl border border-emerald-500/80 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>✓ Data SDI Smart berhasil disinkronkan</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: ISLAMIC MODERN ROYAL GRADIENT (EMERALD & TEAL)             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#0f766e] text-white px-4 pt-3.5 pb-8 rounded-b-[32px] shadow-sm relative overflow-hidden">
        {/* Subtle Islamic arabesque radial dots */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_0)] bg-[size:18px_18px] pointer-events-none" />

        {/* Profile & Gamification Companion Bar */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between border border-white/20 shadow-xs">
          {/* Left: Avatar, Name, Class & Level */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Circular Avatar with Gold & Emerald Ring */}
            <div
              onClick={() => {
                triggerHaptic();
                setIsProfileOpen(true);
              }}
              title="Buka profil santri"
              className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-emerald-300 to-white shadow-xs">
                <img
                  src={
                    currentSiswa.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentSiswa.nama}`
                  }
                  alt={currentSiswa.nama}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
            </div>

            {/* Student Name (Clickable Multi-Child Switcher) & Badges */}
            <div className="flex flex-col min-w-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsChildSwitcherOpen(true);
                }}
                title="Beralih akun santri"
                className="flex items-center gap-1 text-left cursor-pointer group active:scale-95 transition-transform"
              >
                <span className="text-xs font-black tracking-tight text-white truncate max-w-[115px] drop-shadow-xs group-hover:text-amber-200">
                  {currentSiswa.nama}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/80 group-hover:text-amber-200 shrink-0" />
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[8.5px] font-bold shrink-0">
                  {currentSiswa.kelas?.replace(/kelas/i, "").trim() || "3 Al-Farabi"}
                </span>
              </button>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Streak Pill - Clickable to open Habit Modal */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setIsStreakModalOpen(true);
                  }}
                  title="Lihat rincian habit istiqomah santri"
                  className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[9.5px] font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  <span>{activeChild.streak} Hari</span>
                </button>
                {/* XP Pill */}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/80 text-white text-[9.5px] font-bold">
                  <span>⭐ 4.2k</span>
                </span>
              </div>
            </div>
          </div>

          {/* Thin Vertical Divider Line */}
          <div className="w-px h-8 bg-white/20 mx-1 shrink-0" />

          {/* Right: Companion Mascot Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setIsTemanBelajarOpen(true);
            }}
            className="flex items-center gap-1.5 text-left active:scale-95 transition-transform cursor-pointer pl-1 shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white/30 text-base">
              {activeMascot === "robo" && "🐣"}
              {activeMascot === "dino" && "🦖"}
              {activeMascot === "kucing" && "🐱"}
              {activeMascot === "bintang" && "⭐"}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-100 leading-tight">
                Teman Belajar
              </span>
              <span className="text-[9px] font-medium text-white/80 leading-tight">
                {activeMascot === "robo"
                  ? "Robo Dira"
                  : activeMascot === "dino"
                  ? "Dino Rex"
                  : activeMascot === "kucing"
                  ? "Mimi Cat"
                  : "Starry"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROMINENT SEARCH BAR (CTRL+K SPOTLIGHT SEARCH)                         */}
      {/* ========================================================================= */}
      <div className="px-4 -mt-4 relative z-20">
        <button
          type="button"
          onClick={handleSearchTrigger}
          className="w-full bg-white dark:bg-slate-900 rounded-full py-3 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-200/90 dark:border-slate-800 flex items-center justify-between text-left active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.4] shrink-0 ml-0.5" />
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
              Cari jadwal, materi LMS, hafalan Qur'an...
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. SCHOOL STORIES TRAY (CERITA & DOKUMENTASI SEKOLAH KELAS DUNIA)          */}
      {/* ========================================================================= */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Kilas Info Sekolah
            </h3>
          </div>
          <button
            type="button"
            onClick={() => handleOpenStory(0)}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Buka Cerita
          </button>
        </div>

        {/* Horizontal Story Circles Tray */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 pt-0.5">
          {DEFAULT_STORIES.map((story, idx) => (
            <button
              key={story.id}
              type="button"
              onClick={() => handleOpenStory(idx)}
              className="flex flex-col items-center gap-1 shrink-0 active:scale-90 transition-transform cursor-pointer"
            >
              {/* Story Ring with Gradient Border */}
              <div className="w-14 h-14 rounded-full p-[2.2px] bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-400 shadow-sm flex items-center justify-center">
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${story.bgGradient} flex items-center justify-center text-white font-bold text-lg p-1 text-center`}>
                  {idx === 0 && "🌱"}
                  {idx === 1 && "🕌"}
                  {idx === 2 && "🏆"}
                  {idx === 3 && "🍱"}
                  {idx === 4 && "🚌"}
                  {idx === 5 && "📝"}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center truncate max-w-[58px] leading-tight">
                {story.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TIME-AWARE SMART HERO CARD (DINAMIS PAGI/SIANG/SORE/MALAM)              */}
      {/* ========================================================================= */}
      <div className="px-4 mt-3.5">
        <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
          {/* Subtle Arabesque pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />

          {/* Header Row: Time Greeting & Live Clock */}
          <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-white/15">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
                {timeContext === "pagi" && <Sun className="w-4 h-4" />}
                {timeContext === "siang" && <Sun className="w-4 h-4 text-amber-400" />}
                {timeContext === "sore" && <Compass className="w-4 h-4 text-orange-400" />}
                {timeContext === "malam" && <Moon className="w-4 h-4 text-cyan-300" />}
              </div>
              <div>
                <span className="text-xs font-black tracking-tight text-white">
                  {timeContext === "pagi" && "Pagi Barakah, Ananda!"}
                  {timeContext === "siang" && "Semangat Siang, Ananda!"}
                  {timeContext === "sore" && "Waktu Kepulangan Santri"}
                  {timeContext === "malam" && "Malam Tenang & Murojaah"}
                </span>
                <span className="text-[10px] text-emerald-200 block -mt-0.5">
                  Tahun Ajaran 1447 H / 2026 M
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-tight text-emerald-100">
              {currentTimeStr}
            </span>
          </div>

          {/* Time Context Specific Content */}
          <div className="relative z-10 pt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {timeContext === "pagi" && (
                <>
                  <p className="text-xs font-bold text-white leading-snug">
                    {todayPresensi?.status === "Hadir"
                      ? "✓ Presensi Masuk Tuntas (Tepat Waktu)"
                      : "Presensi Pagi & Sholat Dhuha"}
                  </p>
                  <p className="text-[11px] text-emerald-200 mt-0.5 line-clamp-1">
                    {todayPresensi?.status === "Hadir"
                      ? `Tercatat pada ${todayPresensi.waktuMasuk || "07:05 WIB"} • Selamat belajar!`
                      : "Bel masuk 07:15 WIB • Awali dengan Sholat Dhuha 4 rakaat"}
                  </p>
                </>
              )}

              {timeContext === "siang" && (
                <>
                  <p className="text-xs font-bold text-white leading-snug">
                    Sholat Dzuhur Berjamaah & Istirahat
                  </p>
                  <p className="text-[11px] text-emerald-200 mt-0.5 line-clamp-1">
                    Masjid Al-Ikhlas • Menu Catering Sehat telah disajikan di Dining Hall
                  </p>
                </>
              )}

              {timeContext === "sore" && (
                <>
                  <p className="text-xs font-bold text-white leading-snug">
                    Penjemputan & Armada Bus Sekolah
                  </p>
                  <p className="text-[11px] text-emerald-200 mt-0.5 line-clamp-1">
                    Jam pulang 15:30 WIB • Bus Rute A siap di lobby penjemputan
                  </p>
                </>
              )}

              {timeContext === "malam" && (
                <>
                  <p className="text-xs font-bold text-white leading-snug">
                    Mutaba'ah Maghrib-Isya & Murojaah
                  </p>
                  <p className="text-[11px] text-emerald-200 mt-0.5 line-clamp-1">
                    Persiapkan hafalan Surat An-Naba & cek tugas di LMS Cendekia
                  </p>
                </>
              )}
            </div>

            <Link
              href={
                timeContext === "pagi"
                  ? "/dashboard/presensi"
                  : timeContext === "malam"
                  ? "/dashboard/mutabaah"
                  : "/dashboard/jadwal"
              }
              onClick={triggerHaptic}
              className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-sm hover:bg-emerald-50 active:scale-95 transition-all shrink-0 flex items-center gap-1"
            >
              <span>Buka</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODERN BENTO GRID: FITUR UTAMA & AKADEMIK                              */}
      {/* ========================================================================= */}
      <div className="px-4 mt-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Akademi & Layanan Cendekia
          </h2>
          <span className="text-[11px] font-bold text-slate-500">
            Terintegrasi
          </span>
        </div>

        {/* Bento Grid: 2 Cols */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1 (Large Bento Col-Span-2): LMS & Tugas Belajar Digital */}
          <Link
            href="/dashboard/lms"
            onClick={triggerHaptic}
            className="col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 active:scale-[0.99] transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <BookOpenCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
                    SmartClass LMS & E-Tugas
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Kurikulum Merdeka SDI Smart
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/50">
                84% Tuntas
              </span>
            </div>

            {/* Subject Chips */}
            <div className="grid grid-cols-4 gap-1.5 text-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <span className="block text-[14px]">📐</span>
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300">Matematika</span>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <span className="block text-[14px]">📖</span>
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300">PAI & Fiqih</span>
              </div>
              <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40">
                <span className="block text-[14px]">🔬</span>
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300">IPAS Sains</span>
              </div>
              <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                <span className="block text-[14px]">🌍</span>
                <span className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300">B. Inggris</span>
              </div>
            </div>
          </Link>

          {/* Card 2: Jurnal Tahfidz Qur'an */}
          <Link
            href="/dashboard/tahfidz"
            onClick={triggerHaptic}
            className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 shadow-sm border border-slate-200/80 dark:border-slate-800 active:scale-95 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold mb-2">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                Tahfidz Qur'an
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Surat An-Naba: Ayat 1-20
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Juz 30 (92%)</span>
              <span className="text-slate-400">Mutqin ✓</span>
            </div>
          </Link>

          {/* Card 3: Mutaba'ah Ibadah Yaumiyah */}
          <Link
            href="/dashboard/mutabaah"
            onClick={triggerHaptic}
            className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 shadow-sm border border-slate-200/80 dark:border-slate-800 active:scale-95 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold mb-2">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                Mutaba'ah Ibadah
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Sholat 5 Waktu & Dhuha
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
              <span className="font-bold text-rose-600 dark:text-rose-400">5/6 Tuntas</span>
              <span className="text-slate-400">Hari ini</span>
            </div>
          </Link>

          {/* Card 4 (Col-Span-2): SPP & Transportasi Bus */}
          <Link
            href="/dashboard/spp-transportasi"
            onClick={triggerHaptic}
            className="col-span-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 dark:from-emerald-950/40 dark:to-slate-900 rounded-3xl p-3.5 border border-emerald-200/60 dark:border-emerald-800/40 active:scale-[0.99] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  SPP & Transportasi Sekolah
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Status: Lunas (Bulan Berjalan) • Tidak ada tunggakan
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold shadow-xs shrink-0">
              Rincian
            </span>
          </Link>

          {/* Card 5: Jadwal Pembelajaran */}
          <Link
            href="/dashboard/jadwal"
            onClick={triggerHaptic}
            className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 shadow-sm border border-slate-200/80 dark:border-slate-800 active:scale-95 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold mb-2">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                Jadwal Hari Ini
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                4 Mapel Pembelajaran
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">07:15 - 15:30</span>
              <span className="text-slate-400">Aktif</span>
            </div>
          </Link>

          {/* Card 6: E-Rapor & Prestasi */}
          <Link
            href="/dashboard/nilai"
            onClick={triggerHaptic}
            className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 shadow-sm border border-slate-200/80 dark:border-slate-800 active:scale-95 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold mb-2">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
                E-Rapor & Prestasi
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Rata-rata: 91.4 (Sangat Baik)
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
              <span className="font-bold text-amber-600 dark:text-amber-400">Peringkat 2</span>
              <span className="text-slate-400">Semester 1</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. QUICK ACTIONS GRID (8 MODUL LAYANAN MANDIRI)                            */}
      {/* ========================================================================= */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Layanan Utama Santri
            </h2>
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Semua Menu
            </button>
          </div>

          {/* 4-Columns x 2-Rows Grid */}
          <div className="grid grid-cols-4 gap-y-3.5 gap-x-2 text-center">
            {/* 1. Presensi */}
            <Link
              href="/dashboard/presensi"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                Presensi
              </span>
            </Link>

            {/* 2. LMS Digital */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                LMS Belajar
              </span>
            </Link>

            {/* 3. Tahfidz */}
            <Link
              href="/dashboard/tahfidz"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                Tahfidz
              </span>
            </Link>

            {/* 4. Mutaba'ah */}
            <Link
              href="/dashboard/mutabaah"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                Mutaba'ah
              </span>
            </Link>

            {/* 5. SPP & Bus */}
            <Link
              href="/dashboard/spp-transportasi"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Bus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                SPP & Bus
              </span>
            </Link>

            {/* 6. Jadwal */}
            <Link
              href="/dashboard/jadwal"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                Jadwal
              </span>
            </Link>

            {/* 7. E-Rapor */}
            <Link
              href="/dashboard/nilai"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                E-Rapor
              </span>
            </Link>

            {/* 8. Tabungan Santri */}
            <Link
              href="/dashboard/tabungan"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lime-500 to-green-600 text-white flex items-center justify-center shadow-xs">
                <PiggyBank className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                Tabungan
              </span>
            </Link>
          </div>

          {/* Center Button: Lihat Semua 16 Layanan ⬇ */}
          <div className="mt-4 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 mx-auto active:scale-95 transition-all cursor-pointer"
            >
              <span>Buka Seluruh Modul (16 Layanan)</span>
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. CAROUSEL PROGRAM & PRESTASI SEKOLAH                                    */}
      {/* ========================================================================= */}
      <div className="mt-5 px-4 pb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Program & Prestasi SDI Cendekia
          </h2>
          <Link
            href="/dashboard/pengumuman"
            onClick={triggerHaptic}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        {/* Carousel Cards */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {/* Card 1: PPDB & Beasiswa */}
          <div className="w-[270px] shrink-0 rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white p-4 shadow-sm flex flex-col justify-between min-h-[145px]">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase">
                Akademik
              </span>
              <h3 className="text-sm font-extrabold tracking-tight mt-1.5 leading-snug">
                PPDB & Beasiswa Tahfidz
              </h3>
              <p className="text-xs text-white/80 mt-1 line-clamp-2">
                Pendaftaran santri baru dan program beasiswa penghafal Al-Qur'an telah dibuka!
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-emerald-200 font-semibold text-[11px]">T.A 2026/2027</span>
              <Link
                href="/dashboard/pengumuman"
                onClick={triggerHaptic}
                className="px-2.5 py-1 rounded-full bg-white text-emerald-900 font-bold text-[10px] shadow-xs"
              >
                Informasi
              </Link>
            </div>
          </div>

          {/* Card 2: Olimpiade Sains & Tahfidz */}
          <div className="w-[270px] shrink-0 rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 text-white p-4 shadow-sm flex flex-col justify-between min-h-[145px]">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase">
                Kompetisi
              </span>
              <h3 className="text-sm font-extrabold tracking-tight mt-1.5 leading-snug">
                Olimpiade Sains & MHQ Nasional
              </h3>
              <p className="text-xs text-white/80 mt-1 line-clamp-2">
                Kontingen santri SDI Smart siap berkompetisi dalam Olimpiade Sains Islam Terpadu.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-amber-200 font-semibold text-[11px]">Dukungan Santri</span>
              <Link
                href="/dashboard/pengumuman"
                onClick={triggerHaptic}
                className="px-2.5 py-1 rounded-full bg-white text-amber-900 font-bold text-[10px] shadow-xs"
              >
                Lihat Detail
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. FLOATING SPEED-DIAL: "KONSULTASI WALI KELAS" 💬                         */}
      {/* ========================================================================= */}
      <div className="fixed bottom-20 right-3 z-30">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsPesanOpen(true);
          }}
          className="group relative flex items-center bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white pl-3.5 pr-2.5 py-2 rounded-full shadow-xl shadow-emerald-700/30 border-2 border-white dark:border-slate-800 active:scale-95 transition-all cursor-pointer"
        >
          <div className="flex flex-col text-left leading-none mr-2">
            <span className="text-[9px] font-black tracking-tight font-sans drop-shadow-xs">
              KONSULTASI
            </span>
            <span className="text-[11px] font-black tracking-tight font-sans text-amber-200 drop-shadow-xs">
              WALI KELAS
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-xs">
            <MessageCircle className="w-4 h-4 fill-current" />
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 9. MODAL TEMAN BELAJAR PICKER                                             */}
      {/* ========================================================================= */}
      {isTemanBelajarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsTemanBelajarOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Pilih Teman Belajar
              </h3>
              <button
                type="button"
                onClick={() => setIsTemanBelajarOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Pilih karakter pendamping belajar yang siap menyemangati ananda setiap hari:
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { id: "robo", name: "Robo Dira", desc: "Sahabat Cerdas", color: "from-emerald-500 to-teal-500" },
                { id: "dino", name: "Dino Rex", desc: "Petualang Sains", color: "from-blue-500 to-indigo-500" },
                { id: "kucing", name: "Mimi Cat", desc: "Penyayang & Ceria", color: "from-amber-400 to-orange-500" },
                { id: "bintang", name: "Starry", desc: "Bintang Juara", color: "from-purple-500 to-pink-500" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveMascot(m.id as any);
                    setIsTemanBelajarOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    activeMascot === m.id
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${m.color} text-white flex items-center justify-center text-xl shadow-xs`}>
                    {m.id === "robo" && "🐣"}
                    {m.id === "dino" && "🦖"}
                    {m.id === "kucing" && "🐱"}
                    {m.id === "bintang" && "⭐"}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {m.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL SCHOOL STORIES VIEWER                                           */}
      {/* ========================================================================= */}
      <MobileSchoolStoriesModal
        isOpen={isStoryOpen}
        initialIndex={selectedStoryIndex}
        onClose={() => setIsStoryOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 11. MODALS (PROFILE, PESAN, GALERI) PRESERVED                             */}
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

      {/* ========================================================================= */}
      {/* 12. MODAL STREAK & HABIT DETAIL (WORLD-CLASS GAMIFICATION)                */}
      {/* ========================================================================= */}
      <MobileStreakDetailModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        siswa={currentSiswa}
        streakDays={activeChild.streak}
      />

      {/* ========================================================================= */}
      {/* 13. MODAL MULTI-CHILD SWITCHER (SATU AKUN BANYAK SANTRI)                  */}
      {/* ========================================================================= */}
      <MobileChildSwitcherModal
        isOpen={isChildSwitcherOpen}
        onClose={() => setIsChildSwitcherOpen(false)}
        activeChildId={activeChild.id}
        onSelectChild={handleSelectChild}
      />
    </div>
  );
}
