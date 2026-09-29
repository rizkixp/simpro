"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { Siswa } from "@/types/school";
import MobileStudentProfileModal from "@/components/dashboard/MobileStudentProfileModal";
import MobileBukuPesanDrawer from "@/components/dashboard/MobileBukuPesanDrawer";
import MobileGaleriModal from "@/components/dashboard/MobileGaleriModal";
import {
  Search,
  ChevronRight,
  ArrowDown,
  Sparkles,
  MessageCircle,
  X,
  Check,
} from "lucide-react";

interface MobileSuperAppDashboardProps {
  forceShow?: boolean;
}

export default function MobileSuperAppDashboard({ forceShow = false }: MobileSuperAppDashboardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { siswaList, profile } = useSchoolData();

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPesanOpen, setIsPesanOpen] = useState(false);
  const [isGaleriOpen, setIsGaleriOpen] = useState(false);
  const [isTemanBelajarOpen, setIsTemanBelajarOpen] = useState(false);
  const [activeMascot, setActiveMascot] = useState<"robo" | "dino" | "kucing" | "bintang">("robo");
  const [searchQuery, setSearchQuery] = useState("");

  // Current active student
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
          (user?.phone && s?.nama && s.nama.toLowerCase().includes(user.phone.toLowerCase())) ||
          (s?.nama && s.nama.toLowerCase().includes("ahmad"))
      ) ||
      (user?.role === "ortu" ? fallbackStudent : (siswaList && siswaList[0]) || fallbackStudent)
    );
  }, [siswaList, user]);

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

  const handleSearchTrigger = () => {
    triggerHaptic();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    }
  };

  return (
    <div
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

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: TEAL-TO-PURPLE GRADIENT WITH LEVEL 8 & MASCOT CARD         */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#179BAE] via-[#2F80ED] to-[#7952B3] text-white px-4 pt-3 pb-8 rounded-b-[28px] shadow-sm relative">
        {/* Gamified Profile & Companion Bar matching Reference Image */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between border border-white/20 shadow-xs">
          {/* Left: Avatar, Level 8, XP & Coins */}
          <div
            onClick={() => {
              triggerHaptic();
              setIsProfileOpen(true);
            }}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          >
            {/* Circular Avatar with Purple & White Ring */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-purple-400 via-indigo-300 to-white shadow-xs">
                <img
                  src={
                    currentSiswa.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentSiswa.nama}`
                  }
                  alt={currentSiswa.nama}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
            </div>

            {/* Level & Pills */}
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight text-white drop-shadow-xs">
                Level 8
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* XP Pill */}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#10B981] text-white text-[9.5px] font-black shadow-xs">
                  <span className="text-[8px] font-black">XP</span>
                  <span>4rb</span>
                </span>
                {/* Coin Pill */}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#F59E0B] text-amber-950 text-[9.5px] font-black shadow-xs">
                  <span className="text-[10px]">🪙</span>
                  <span className="text-white font-black">6rb</span>
                </span>
              </div>
            </div>
          </div>

          {/* Thin Vertical Divider Line */}
          <div className="w-px h-8 bg-white/25 mx-1" />

          {/* Right: Pilih Teman Belajar Mascot */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setIsTemanBelajarOpen(true);
            }}
            className="flex items-center gap-2 text-left active:scale-95 transition-transform cursor-pointer pl-1 min-w-0"
          >
            {/* Mascot Hatching Egg Icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 p-0.5 flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white/40">
              {/* Egg shell with cute hatching mascot */}
              <svg viewBox="0 0 36 36" className="w-7 h-7" fill="none">
                {/* Egg bottom shell */}
                <path
                  d="M18 32C24.6274 32 30 26.6274 30 20C30 18.5 28.5 17 26.5 17.5L23.5 19.5L20.5 17.5L18 19.5L15.5 17.5L12.5 19.5L9.5 17.5C7.5 17 6 18.5 6 20C6 26.6274 11.3726 32 18 32Z"
                  fill="#E9D5FF"
                />
                {/* Creature Head */}
                <circle cx="18" cy="15" r="9" fill="#FBBF24" />
                {/* Cute Eyes */}
                <circle cx="15" cy="14" r="1.5" fill="#1E293B" />
                <circle cx="21" cy="14" r="1.5" fill="#1E293B" />
                <circle cx="15.5" cy="13.5" r="0.5" fill="white" />
                <circle cx="21.5" cy="13.5" r="0.5" fill="white" />
                {/* Blush */}
                <ellipse cx="13" cy="16.5" rx="1.5" ry="0.8" fill="#F87171" opacity="0.8" />
                <ellipse cx="23" cy="16.5" rx="1.5" ry="0.8" fill="#F87171" opacity="0.8" />
                {/* Top Egg Shell Cap */}
                <path
                  d="M18 4C14.5 4 11.5 6.5 10 10L13 11.5L15.5 9.5L18 11.5L20.5 9.5L23 11.5L26 10C24.5 6.5 21.5 4 18 4Z"
                  fill="#E9D5FF"
                />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-white truncate max-w-[100px]">
              Pilih Teman Belaj...
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROMINENT PILL SEARCH BAR ("Trigonometri")                              */}
      {/* ========================================================================= */}
      <div className="px-4 -mt-4 relative z-20">
        <button
          type="button"
          onClick={handleSearchTrigger}
          className="w-full bg-white dark:bg-slate-900 rounded-full py-3 px-4 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 text-left active:scale-[0.98] transition-transform cursor-pointer"
        >
          <Search className="w-5 h-5 text-slate-800 dark:text-slate-200 stroke-[2.2] shrink-0 ml-0.5" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {searchQuery || "Trigonometri"}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. CARD "ruangbelajar" (Mata Pelajaran Utama)                              */}
      {/* ========================================================================= */}
      <div className="px-4 mt-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          {/* Header Title: ruangbelajar by Ruangguru */}
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              ruang
            </span>
            <span className="text-xl font-bold italic text-[#F34D52] font-serif">
              belajar
            </span>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans block -mt-1 mb-3">
            by {profile?.appName || "Ruangguru"}
          </span>

          {/* 4 App Subject Icons (Matematika, Bahasa Indonesia, IPAS, Semua Pelajaran) */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* 1. Matematika */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#64B5F6] to-[#1E88E5] p-2.5 flex items-center justify-center shadow-md shadow-blue-500/20">
                {/* Calculator vector matching screenshot */}
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  {/* Calculator Body */}
                  <rect x="6" y="4" width="28" height="32" rx="6" fill="white" />
                  {/* Screen */}
                  <rect x="10" y="8" width="20" height="7" rx="2" fill="#E3F2FD" />
                  <circle cx="26" cy="11.5" r="1.2" fill="#1E88E5" />
                  {/* 4 Calculator Buttons */}
                  <rect x="10" y="18" width="8" height="6" rx="2" fill="#BBDEFB" />
                  <rect x="22" y="18" width="8" height="6" rx="2" fill="#BBDEFB" />
                  <rect x="10" y="26" width="8" height="6" rx="2" fill="#BBDEFB" />
                  <rect x="22" y="26" width="8" height="6" rx="2" fill="#1E88E5" />
                  {/* Math Symbols: + and = */}
                  <path d="M14 20V22M13 21H15" stroke="#1E88E5" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M25 28.5H27M25 30H27" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Matematika
              </span>
            </Link>

            {/* 2. Bahasa Indonesia */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#EF5350] to-[#E53935] p-2.5 flex items-center justify-center shadow-md shadow-red-500/20">
                {/* Indonesian Book & Flag medallion vector */}
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  {/* Open Book */}
                  <path
                    d="M8 12C8 9.79086 9.79086 8 12 8H28C30.2091 8 32 9.79086 32 12V30C32 31.1046 31.1046 32 30 32H12C9.79086 32 8 30.2091 8 28V12Z"
                    fill="white"
                  />
                  {/* Book Pages Shadow */}
                  <path d="M12 9H28V31H12C10.5 31 9.5 30 9.5 28.5V11.5C9.5 10 10.5 9 12 9Z" fill="#FFF5F5" />
                  {/* Indonesian Flag Roundel Medallion */}
                  <circle cx="20" cy="18" r="7" fill="#E53935" />
                  <path d="M13 18C13 21.866 16.134 25 20 25C23.866 25 27 21.866 27 18H13Z" fill="white" />
                  <circle cx="20" cy="18" r="7" stroke="#FFCDD2" strokeWidth="1" />
                  {/* Gold Bookmark Ribbon */}
                  <path d="M20 25V33L22.5 31L25 33V25H20Z" fill="#FBBF24" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Bahasa Indonesia
              </span>
            </Link>

            {/* 3. IPAS */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#4DD0E1] to-[#00ACC1] p-2.5 flex items-center justify-center shadow-md shadow-cyan-500/20">
                {/* Plant sprout on globe vector */}
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  {/* Earth / Water Base */}
                  <rect x="6" y="8" width="28" height="24" rx="5" fill="white" />
                  <ellipse cx="20" cy="27" rx="10" ry="3.5" fill="#E0F7FA" />
                  {/* Sprout Stem */}
                  <path d="M20 27V14" stroke="#00897B" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Leaves */}
                  <path
                    d="M20 21C16 21 14 18 14 15C17 15 20 17 20 21Z"
                    fill="#4CAF50"
                  />
                  <path
                    d="M20 17C24 17 26 14 26 11C23 11 20 13 20 17Z"
                    fill="#81C784"
                  />
                  <circle cx="20" cy="13" r="2" fill="#FFB74D" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                IPAS
              </span>
            </Link>

            {/* 4. Semua Pelajaran */}
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#ECEFF1] dark:bg-slate-800 p-2.5 flex items-center justify-center border border-slate-200/80 dark:border-slate-700">
                {/* 4 Rounded Squares Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-400 dark:bg-slate-500" />
                  <div className="w-3.5 h-3.5 rounded bg-slate-400 dark:bg-slate-500" />
                  <div className="w-3.5 h-3.5 rounded bg-slate-400 dark:bg-slate-500" />
                  <div className="w-3.5 h-3.5 rounded bg-slate-400 dark:bg-slate-500" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Semua Pelajaran
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HORIZONTAL ACTION CHIPS (Laporan Belajar [BARU!] & Drill Soal)         */}
      {/* ========================================================================= */}
      <div className="px-4 mt-3 flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {/* Chip 1: Laporan Belajar */}
        <Link
          href="/dashboard/nilai"
          onClick={triggerHaptic}
          className="flex-1 min-w-[155px] bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-2 active:scale-95 transition-transform"
        >
          {/* Chart icon */}
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#10B981" strokeWidth="2.5" />
              <path d="M12 7V12L15.5 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white block truncate leading-tight">
              Laporan Belajar
            </span>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full bg-[#E53935] text-white font-black text-[8px] uppercase tracking-wide">
              BARU!
            </span>
          </div>
        </Link>

        {/* Chip 2: Drill Soal */}
        <Link
          href="/dashboard/lms"
          onClick={triggerHaptic}
          className="flex-1 min-w-[145px] bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-2.5 active:scale-95 transition-transform"
        >
          {/* Dumbbell icon */}
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" stroke="none">
              <path d="M6 5H4C3.45 5 3 5.45 3 6V18C3 18.55 3.45 19 4 19H6C6.55 19 7 18.55 7 18V6C7 5.45 6.55 5 6 5ZM9 8H7V16H9C9.55 16 10 15.55 10 15V9C10 8.45 9.55 8 9 8ZM20 5H18C17.45 5 17 5.45 17 6V18C17 18.55 17.45 19 18 19H20C20.55 19 21 18.55 21 18V6C21 5.45 20.55 5 20 5ZM17 8H15C14.45 8 14 8.45 14 9V15C14 15.55 14.45 16 15 16H17V8ZM14 11H10V13H14V11Z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
            Drill Soal
          </span>
        </Link>

        {/* Chip 3: Bank Soal */}
        <Link
          href="/dashboard/lms"
          onClick={triggerHaptic}
          className="bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-2 shrink-0 active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center shrink-0 text-amber-600">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M19 4H10L8 2H4C2.9 2 2 2.9 2 4V18C2 19.1 2.9 20 4 20H19C20.1 20 21 19.1 21 18V6C21 4.9 20.1 4 19 4Z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
            Bank Soal
          </span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 5. SECTION "Wajib kamu coba" (INTERACTIVE FEATURE GRID)                   */}
      {/* ========================================================================= */}
      <div className="px-4 mt-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Wajib kamu coba
            </h2>
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="text-xs font-bold text-[#00A5B5] hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          {/* 4-Column Grid of Circular Icons */}
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {/* 1. Tryout */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#38BDF8] to-[#0284C7] p-2.5 flex items-center justify-center shadow-sm">
                {/* Clipboard checklist & clock */}
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                  <rect x="7" y="6" width="18" height="22" rx="3" fill="white" />
                  <rect x="11" y="4" width="10" height="4" rx="1.5" fill="#0284C7" />
                  {/* Checklist lines */}
                  <circle cx="11.5" cy="13" r="1.5" fill="#38BDF8" />
                  <line x1="15" y1="13" x2="21" y2="13" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="11.5" cy="18" r="1.5" fill="#38BDF8" />
                  <line x1="15" y1="18" x2="21" y2="18" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Clock badge */}
                  <circle cx="21" cy="23" r="4.5" fill="#0369A1" />
                  <path d="M21 21V23L22.5 24" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Tryout
              </span>
            </Link>

            {/* 2. Kalananti Coding */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform relative"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#60A5FA] to-[#2563EB] p-2 flex items-center justify-center shadow-sm">
                {/* Robot coder */}
                <svg viewBox="0 0 36 36" className="w-full h-full" fill="none">
                  {/* Robot Head */}
                  <rect x="8" y="9" width="20" height="17" rx="5" fill="white" />
                  {/* Antenna */}
                  <circle cx="18" cy="6" r="2" fill="#FBBF24" />
                  <line x1="18" y1="7" x2="18" y2="9" stroke="white" strokeWidth="1.5" />
                  {/* Eyes / Screen */}
                  <rect x="11" y="13" width="14" height="6" rx="2" fill="#1E3A8A" />
                  <circle cx="14.5" cy="16" r="1.2" fill="#60A5FA" />
                  <circle cx="21.5" cy="16" r="1.2" fill="#60A5FA" />
                  {/* Code Tag badge */}
                  <text x="14" y="24" fill="#2563EB" fontSize="6" fontWeight="bold">&lt;/&gt;</text>
                </svg>
              </div>
              {/* Ribbon FREE TRIAL */}
              <span className="absolute top-10 px-1.5 py-0.2 rounded bg-[#FF6D00] text-white text-[7.5px] font-black tracking-tighter uppercase shadow-xs">
                FREE TRIAL
              </span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-tight">
                Kalananti Coding
              </span>
            </Link>

            {/* 3. Brain Academy Online */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform relative"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#2DD4BF] to-[#0D9488] p-2 flex items-center justify-center shadow-sm">
                {/* Geometric Brain Speech Bubble */}
                <svg viewBox="0 0 36 36" className="w-full h-full" fill="none">
                  <path
                    d="M18 7C12.4772 7 8 11.2533 8 16.5C8 19.3496 9.38769 21.8909 11.5855 23.5702L10 28L15.313 25.6843C16.1682 25.8895 17.0673 26 18 26C23.5228 26 28 21.7467 28 16.5C28 11.2533 23.5228 7 18 7Z"
                    fill="white"
                  />
                  {/* Brain fold lines */}
                  <path d="M14 13C15 11 17 11 18 13C19 11 21 11 22 13" stroke="#0D9488" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M13 17C14.5 15.5 16.5 15.5 18 17C19.5 15.5 21.5 15.5 23 17" stroke="#0D9488" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M15 21C16 19.5 17.5 19.5 18 21C18.5 19.5 20 19.5 21 21" stroke="#0D9488" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              {/* Ribbon FREE TRIAL */}
              <span className="absolute top-10 px-1.5 py-0.2 rounded bg-[#FF6D00] text-white text-[7.5px] font-black tracking-tighter uppercase shadow-xs">
                FREE TRIAL
              </span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-tight">
                Brain Academy
              </span>
            </Link>

            {/* 4. Math Champs */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#059669] to-[#047857] p-2.5 flex items-center justify-center shadow-sm">
                {/* 4 Colorful arithmetic tiles: = - + x */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-blue-400 text-white font-bold text-[9px] flex items-center justify-center leading-none">=</div>
                  <div className="w-3.5 h-3.5 rounded bg-rose-400 text-white font-bold text-[9px] flex items-center justify-center leading-none">×</div>
                  <div className="w-3.5 h-3.5 rounded bg-amber-400 text-white font-bold text-[9px] flex items-center justify-center leading-none">-</div>
                  <div className="w-3.5 h-3.5 rounded bg-emerald-400 text-white font-bold text-[9px] flex items-center justify-center leading-none">+</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Math Champs
              </span>
            </Link>

            {/* 5. Memory Academy */}
            <Link
              href="/dashboard/tahfidz"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#7E22CE] p-2.5 flex items-center justify-center shadow-sm">
                {/* 3D Prism / Mind Icon */}
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                  <path d="M16 6L25 22H7L16 6Z" fill="white" />
                  <path d="M16 6L7 22H16V6Z" fill="#E9D5FF" />
                  <polygon points="16,11 21,21 16,21" fill="#7E22CE" opacity="0.4" />
                  <circle cx="16" cy="18" r="2.5" fill="#FBBF24" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Memory Academy
              </span>
            </Link>

            {/* 6. Sempoa */}
            <Link
              href="/dashboard/lms"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#FDE68A] to-[#F59E0B] p-2 flex items-center justify-center shadow-sm">
                {/* Abacus frame & beads */}
                <div className="w-8 h-8 rounded-lg bg-[#78350F] p-1 flex flex-col justify-between shadow-xs">
                  <div className="flex justify-around items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                  </div>
                  <div className="w-full h-0.5 bg-amber-900" />
                  <div className="flex justify-around items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Sempoa
              </span>
            </Link>

            {/* 7. Tahfidz Qur'an */}
            <Link
              href="/dashboard/tahfidz"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#10B981] to-[#047857] p-2.5 flex items-center justify-center shadow-sm">
                {/* Quran Book */}
                <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM18 19H6C5.4 19 5 18.6 5 18V6C5 5.4 5.4 5 6 5H18C18.6 5 19 5.4 19 6V18C19 18.6 18.6 19 18 19Z" />
                  <circle cx="12" cy="12" r="3.5" fill="#FBBF24" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Tahfidz Qur'an
              </span>
            </Link>

            {/* 8. Mutaba'ah */}
            <Link
              href="/dashboard/mutabaah"
              onClick={triggerHaptic}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#FB7185] to-[#E11D48] p-2.5 flex items-center justify-center shadow-sm">
                {/* Prayer Hands & Heart */}
                <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-tight">
                Mutaba'ah
              </span>
            </Link>
          </div>

          {/* Center Orange Button: Lihat Fitur Lainnya ⬇ */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF5400] hover:from-[#FF6A00] hover:to-[#E64A00] text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 mx-auto active:scale-95 transition-transform cursor-pointer"
            >
              <span>Lihat Fitur Lainnya</span>
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. FLOATING BUBBLE: "KONSULTASI BELAJAR" 💬 (Exactly like Reference)       */}
      {/* ========================================================================= */}
      <div className="fixed bottom-20 right-3 z-30">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsPesanOpen(true);
          }}
          className="group relative flex items-center bg-gradient-to-r from-[#1E88E5] via-[#0284C7] to-[#0052CC] text-white pl-3.5 pr-2.5 py-1.5 rounded-full shadow-xl shadow-blue-600/30 border-2 border-white dark:border-slate-800 active:scale-95 transition-all cursor-pointer"
        >
          <div className="flex flex-col text-left leading-none mr-2">
            <span className="text-[10px] font-black italic tracking-tight font-sans drop-shadow-xs">
              KONSULTASI
            </span>
            <span className="text-[12px] font-black italic tracking-tight font-sans text-cyan-200 drop-shadow-xs">
              BELAJAR
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-cyan-400 text-blue-900 flex items-center justify-center shadow-xs">
            <MessageCircle className="w-4 h-4 fill-white text-white" />
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 7. SECTION "Program seru di Ruangguru" (Horizontal Cards)                 */}
      {/* ========================================================================= */}
      <div className="mt-6 px-4 pb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Program seru di {profile?.appName || "Ruangguru"}
          </h2>
          <Link
            href="/dashboard/pengumuman"
            onClick={triggerHaptic}
            className="text-xs font-bold text-[#00A5B5] hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        {/* Carousel Cards */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {/* Card 1: PPDB & Beasiswa */}
          <div className="w-[270px] shrink-0 rounded-3xl bg-gradient-to-br from-[#179BAE] to-[#2F80ED] text-white p-4 shadow-sm flex flex-col justify-between min-h-[145px]">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase">
                Akademik
              </span>
              <h3 className="text-base font-extrabold tracking-tight mt-1.5 leading-snug">
                PPDB & Beasiswa Prestasi
              </h3>
              <p className="text-xs text-white/90 mt-1 line-clamp-2">
                Pendaftaran santri baru dan program beasiswa tahfidz telah dibuka!
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-cyan-100 font-semibold text-[11px]">Tahun Ajaran 2026/2027</span>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#179BAE] font-bold text-[10px] shadow-xs">
                Daftar
              </span>
            </div>
          </div>

          {/* Card 2: Brain Academy Bootcamp */}
          <div className="w-[270px] shrink-0 rounded-3xl bg-gradient-to-br from-[#FF7A00] to-[#FF3B30] text-white p-4 shadow-sm flex flex-col justify-between min-h-[145px]">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase">
                Kompetisi
              </span>
              <h3 className="text-base font-extrabold tracking-tight mt-1.5 leading-snug">
                Olimpiade Sains & Math
              </h3>
              <p className="text-xs text-white/90 mt-1 line-clamp-2">
                Ikuti tryout simulasi akbar nasional dengan ratusan hadiah seru.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-amber-100 font-semibold text-[11px]">Gratis Pendaftaran</span>
              <span className="px-2.5 py-1 rounded-full bg-white text-orange-600 font-bold text-[10px] shadow-xs">
                Ikuti
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. MODAL TEMAN BELAJAR PICKER                                             */}
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
              Pilih karakter pendamping belajar yang siap menyemangati belajarmu setiap hari:
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { id: "robo", name: "Robo Dira", desc: "Sahabat Cerdas", color: "from-purple-500 to-indigo-500" },
                { id: "dino", name: "Dino Rex", desc: "Petualang Sains", color: "from-emerald-500 to-teal-500" },
                { id: "kucing", name: "Mimi Cat", desc: "Penyayang & Ceria", color: "from-amber-400 to-orange-500" },
                { id: "bintang", name: "Starry", desc: "Bintang Juara", color: "from-blue-400 to-cyan-500" },
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
                      ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20"
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
      {/* 8.5 BOTTOM NAVIGATION BAR (SIMULASI SMARTPHONE DESKTOP)                   */}
      {/* ========================================================================= */}
      {forceShow && (
        <div className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-2 -mx-0">
          <div className="grid grid-cols-4 h-14 text-center">
            {/* 1. Home */}
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center gap-0.5 text-[#00A5B5] font-bold"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span className="text-[10px] font-bold">Home</span>
            </Link>

            {/* 2. Brain Academy */}
            <Link
              href="/dashboard/lms"
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 font-medium"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[10px] truncate max-w-[64px]">Brain Acade...</span>
            </Link>

            {/* 3. Pembelian */}
            <Link
              href="/dashboard/spp-transportasi"
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 font-medium"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="text-[10px]">Pembelian</span>
            </Link>

            {/* 4. Lainnya */}
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 font-medium cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
              <span className="text-[10px]">Lainnya</span>
            </button>
          </div>
          {/* Home indicator bar */}
          <div className="w-28 h-1 bg-slate-400/60 dark:bg-slate-600 rounded-full mx-auto my-1" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODALS PRESERVED                                                       */}
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
