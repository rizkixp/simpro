"use client";

import React, { useState, useRef } from "react";
import {
  ChevronLeft,
  Settings,
  CreditCard,
  Calendar,
  User as UserIcon,
  MapPin,
  Users,
  Award,
  BookOpen,
  Phone,
  Heart,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Siswa, User } from "@/types/school";

interface MobileStudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa?: Partial<Siswa> | Siswa | null;
  user?: User | null;
}

export default function MobileStudentProfileModal({
  isOpen,
  onClose,
  siswa,
  user,
}: MobileStudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "data" | "prestasi">("profil");

  // Drag-to-Dismiss state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);

  if (!isOpen) return null;

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
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(10); } catch {}
      }
      onClose();
    }
    setDragY(0);
  };

  const displayName = siswa?.nama || "Ahmad Fauzan";
  const displayKelas = siswa?.kelas
    ? siswa.kelas.startsWith("Kelas")
      ? siswa.kelas
      : `Kelas ${siswa.kelas}`
    : "Kelas 3 Al Farabi";
  const displayNis = siswa?.nisn || "20230015";
  const displayTtl = "Medan, 12 Januari 2016";
  const displayGender = siswa?.jenisKelamin === "P" ? "Perempuan" : "Laki-laki";
  const displayAlamat = "Jl. Melati No. 10, Medan";
  const displayOrtu =
    siswa?.namaWali || (user?.role === "ortu" ? user.name : "Bapak Rizki F., Ibu Sari");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-slideUp"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on top */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        {/* 1. Header Bar with Touch Gestures */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 cursor-grab select-none"
        >
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1.5 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Profil Siswa
          </h2>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard/pengaturan";
              }
            }}
            className="p-1.5 -mr-1.5 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Pengaturan"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-6 space-y-6">
          {/* 2. Avatar & Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3.5">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-sky-200 to-sky-400 shadow-md">
                <img
                  src={
                    siswa?.avatar ||
                    "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80"
                  }
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {displayName}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {displayKelas}
            </p>
          </div>

          {/* 3. Segmented Tabs (Profil, Data, Prestasi) */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab("profil")}
              className={`py-2 rounded-xl transition-all ${
                activeTab === "profil"
                  ? "bg-[#056839] text-white shadow-xs"
                  : "hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={`py-2 rounded-xl transition-all ${
                activeTab === "data"
                  ? "bg-[#056839] text-white shadow-xs"
                  : "hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("prestasi")}
              className={`py-2 rounded-xl transition-all ${
                activeTab === "prestasi"
                  ? "bg-[#056839] text-white shadow-xs"
                  : "hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Prestasi
            </button>
          </div>

          {/* 4. Tab 1: Profil (Exactly matching Screen 4) */}
          {activeTab === "profil" && (
            <div className="space-y-3.5">
              {/* Row 1: NIS */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">NIS</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {displayNis}
                  </p>
                </div>
              </div>

              {/* Row 2: TTL */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Tempat, Tanggal Lahir
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {displayTtl}
                  </p>
                </div>
              </div>

              {/* Row 3: Jenis Kelamin */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Jenis Kelamin
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {displayGender}
                  </p>
                </div>
              </div>

              {/* Row 4: Alamat */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Alamat</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {displayAlamat}
                  </p>
                </div>
              </div>

              {/* Row 5: Nama Orang Tua */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Nama Orang Tua
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {displayOrtu}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Tab 2: Data Akademik & Kesehatan */}
          {activeTab === "data" && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-xs space-y-2">
                <p className="font-bold text-emerald-800 dark:text-emerald-300">
                  Status Administrasi
                </p>
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Status Santri:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Aktif Terdaftar
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Tahun Masuk:</span>
                  <span className="font-semibold">2023/2024</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Wali Kelas:</span>
                  <span className="font-semibold">Ustadzah Siti Nurhaliza, M.Si.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Informasi Kesehatan
                </p>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Golongan Darah:</span>
                  <span className="font-bold">O Positive</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Riwayat Alergi:</span>
                  <span className="font-semibold">Tidak Ada</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. Tab 3: Prestasi & Hafalan */}
          {activeTab === "prestasi" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Juara 1 Tahfidz Qur'an Juz 30
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Festival Syiar Islam Madrasah 2026
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                    Santri Teladan Sholat Berjamaah
                  </p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400">
                    Predikat Mumtaz Mutaba'ah Harian
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close footer button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#056839] hover:bg-[#04522d] text-white text-xs font-bold transition-all shadow-md active:scale-98"
          >
            Tutup Profil
          </button>
        </div>
      </div>
    </div>
  );
}
