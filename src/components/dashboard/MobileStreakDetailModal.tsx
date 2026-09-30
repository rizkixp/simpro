"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Flame,
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  Share2,
  Trophy,
  Heart,
  ChevronRight,
} from "lucide-react";
import { Siswa } from "@/types/school";

interface MobileStreakDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa?: Siswa | null;
  streakDays?: number;
}

export default function MobileStreakDetailModal({
  isOpen,
  onClose,
  siswa,
  streakDays = 14,
}: MobileStreakDetailModalProps) {
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Drag-to-Dismiss state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);

  if (!isOpen) return null;

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartYRef.current;
    if (delta > 0) {
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      triggerHaptic(10);
      onClose();
    }
    setDragY(0);
  };

  const handleCelebrate = () => {
    triggerHaptic([20, 50, 20, 50, 40]);
    setHasCelebrated(true);

    if (typeof window !== "undefined") {
      import("canvas-confetti").then((module) => {
        const confetti = module.default || module;
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#f59e0b", "#3b82f6", "#f43f5e", "#8b5cf6"],
        });
      });
    }
  };

  const daysOfWeek = [
    { day: "Sen", date: "24", done: true },
    { day: "Sel", date: "25", done: true },
    { day: "Rab", date: "26", done: true },
    { day: "Kam", date: "27", done: true },
    { day: "Jum", date: "28", done: true },
    { day: "Sab", date: "29", done: true },
    { day: "Min", date: "30", done: true, isToday: true },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-slideUp"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        {/* 1. Header with Touch Gestures */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex items-center justify-between px-5 pt-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 cursor-grab select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                Streak Istiqomah Santri
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {siswa?.nama || "Ahmad Fauzan"} • {siswa?.kelas || "Kelas 3 Al-Farabi"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Big Flame Streak Hero */}
          <div className="relative rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 text-white text-center shadow-lg overflow-hidden">
            {/* Radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_0,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Flame Badge */}
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-4xl shadow-inner animate-bounce">
                🔥
              </div>

              <div className="mt-3">
                <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm">
                  {streakDays}
                </span>
                <span className="text-xl font-bold ml-1.5 opacity-95">Hari</span>
              </div>

              <p className="text-xs font-semibold text-amber-100 mt-1 max-w-xs leading-relaxed">
                Alhamdulillah! Ananda istiqomah menjalankan Sholat 5 Waktu, Dhuha, & hadir tepat waktu selama {streakDays} hari berturut-turut!
              </p>

              {/* Record Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-white text-[11px] font-bold mt-3 border border-white/20">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Rekor Terpanjang: 21 Hari</span>
              </div>
            </div>
          </div>

          {/* Weekly Habit Calendar */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pekan Ini (24 - 30 September 2026)
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                100% Tuntas ✓
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {daysOfWeek.map((d, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                    d.isToday
                      ? "bg-gradient-to-b from-orange-500 to-amber-500 text-white shadow-sm ring-2 ring-orange-400/40"
                      : d.done
                      ? "bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-80">{d.day}</span>
                  <div className="text-sm">
                    {d.done ? "🔥" : "⚪"}
                  </div>
                  <span className="text-[10px] font-bold">{d.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Breakdown Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white px-1">
              Rincian Disiplin Santri
            </h4>

            {/* Item 1 */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  🕌
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                    Sholat 5 Waktu & Dhuha
                  </h5>
                  <p className="text-[10px] text-slate-500">Mutaba'ah Yaumiyah konsisten</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                {streakDays} Hari
              </span>
            </div>

            {/* Item 2 */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                  📖
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                    Murojaah Tahfidz Qur'an
                  </h5>
                  <p className="text-[10px] text-slate-500">Setoran hafalan Juz 30 harian</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-black">
                12 Hari
              </span>
            </div>

            {/* Item 3 */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  ⏱️
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                    Presensi Tepat Waktu
                  </h5>
                  <p className="text-[10px] text-slate-500">Hadir sebelum bel 07:15 WIB</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black">
                18 Hari
              </span>
            </div>
          </div>

          {/* Lencana Milestone / Badges */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                Pencapaian Istiqomah
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mt-3">
              {/* Badge 1 */}
              <div className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200/60 shadow-xs flex flex-col items-center">
                <span className="text-xl">🥉</span>
                <span className="text-[10px] font-bold text-slate-800 dark:text-white mt-1">
                  7 Hari
                </span>
                <span className="text-[8.5px] text-emerald-600 font-bold">Terbuka ✓</span>
              </div>

              {/* Badge 2 */}
              <div className="p-2 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-950/60 dark:to-slate-800 border border-amber-300 shadow-xs flex flex-col items-center ring-1 ring-amber-400">
                <span className="text-xl">🥈</span>
                <span className="text-[10px] font-bold text-amber-950 dark:text-amber-200 mt-1">
                  14 Hari
                </span>
                <span className="text-[8.5px] text-orange-600 font-bold">Hari Ini! 🎉</span>
              </div>

              {/* Badge 3 */}
              <div className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 opacity-60 flex flex-col items-center">
                <span className="text-xl">🥇</span>
                <span className="text-[10px] font-bold text-slate-500 mt-1">
                  30 Hari
                </span>
                <span className="text-[8.5px] text-slate-400">Sisa 16 hari</span>
              </div>
            </div>
          </div>

          {/* Islamic Hadits Quote Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed italic">
            "Amalan yang paling dicintai oleh Allah Ta'ala adalah amalan yang kontinu (istiqomah) walaupun sedikit."
            <span className="block font-bold not-italic text-[10px] text-amber-800 dark:text-amber-300 mt-1">
              — HR. Bukhari & Muslim
            </span>
          </div>
        </div>

        {/* 3. Footer Celebrate Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex gap-2.5">
          <button
            type="button"
            onClick={handleCelebrate}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{hasCelebrated ? "Rayakan Lagi! 🎊" : "Rayakan Pencapaian 14 Hari! 🎉"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
