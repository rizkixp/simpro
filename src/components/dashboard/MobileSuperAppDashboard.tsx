"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { formatRupiah } from "@/lib/utils";
import {
  Bell,
  Headphones,
  Eye,
  EyeOff,
  ArrowRight,
  CreditCard,
  Clock,
  BookCheck,
  PiggyBank,
  Search,
  Calendar,
  FileText,
  Bus,
  HeartHandshake,
  BookOpen,
  Receipt,
  QrCode,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Phone,
  Wallet,
  GraduationCap,
} from "lucide-react";

export default function MobileSuperAppDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    siswaList,
    profile,
    presensiList,
    sppList,
    tabunganList,
    tahfidzList,
    pengumumanList,
  } = useSchoolData();

  const [showBalance, setShowBalance] = useState(false);
  const [greeting, setGreeting] = useState("Selamat Datang");

  // Determine dynamic greeting based on current local time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 11) {
      setGreeting("Selamat Pagi");
    } else if (hour >= 11 && hour < 15) {
      setGreeting("Selamat Siang");
    } else if (hour >= 15 && hour < 18) {
      setGreeting("Selamat Sore");
    } else {
      setGreeting("Selamat Malam");
    }
  }, []);

  // Student specific data (if role is siswa or ortu)
  const currentSiswa = useMemo(() => {
    return (
      siswaList.find(
        (s) =>
          (user?.nisnOrNip && s.nisn === user.nisnOrNip) ||
          s.nama.toLowerCase().includes("ahmad rizky")
      ) || siswaList[0]
    );
  }, [siswaList, user]);

  // Compute student tabungan balance or school general balance
  const displaySaldo = useMemo(() => {
    if (user?.role === "ortu" || user?.role === "siswa") {
      const studentTabungan = tabunganList.find(
        (t) => t.siswaId === currentSiswa?.id
      );
      return studentTabungan ? studentTabungan.saldo : 1450000;
    }
    // Admin / Bendahara view
    const totalTabungan = tabunganList.reduce((acc, curr) => acc + (curr.saldo || 0), 0);
    return totalTabungan || 24850000;
  }, [tabunganList, user, currentSiswa]);

  // Compute student SPP status
  const sppStatus = useMemo(() => {
    if (user?.role === "ortu" || user?.role === "siswa") {
      const studentSpp = sppList.filter((s) => s.siswaId === currentSiswa?.id);
      const hasUnpaid = studentSpp.some((s) => s.status === "Belum Lunas" || s.status === "Jatuh Tempo");
      return hasUnpaid ? "Tagihan SPP: Menunggak (Rp 350.000)" : "Status SPP: Lunas Bulan Ini";
    }
    return "Status Kas & SPP: Terkelola Baik";
  }, [sppList, user, currentSiswa]);

  // Check today's attendance for student
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayPresensi = useMemo(() => {
    return presensiList.find(
      (p) => p.siswaId === currentSiswa?.id && p.tanggal === todayStr
    );
  }, [presensiList, currentSiswa, todayStr]);

  // Trigger haptic vibration on touch
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="lg:hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 pb-24 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* 1. TOP HEADER: Dusk / Islamic Twilight Cityscape with Greeting & Actions */}
      <div className="relative pt-6 pb-14 px-5 bg-gradient-to-b from-[#031d16] via-[#064e3b] to-[#0a5c46] text-white overflow-hidden shadow-lg">
        {/* Ambient Glow & Sunset Cityscape Silhouettes */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400 via-emerald-600 to-transparent" />
        <div className="absolute -bottom-6 -right-6 w-44 h-44 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          {/* Logo & Greeting */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-500 p-0.5 shadow-md shrink-0">
              <div className="h-full w-full rounded-[14px] bg-[#04241b] flex items-center justify-center overflow-hidden">
                {profile?.appLogoUrl ? (
                  <img src={profile.appLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-black text-xs text-amber-300">SDI</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-emerald-200/90 font-medium leading-none">
                {greeting},
              </p>
              <h2 className="text-base font-extrabold tracking-tight text-white mt-1 leading-tight truncate max-w-[170px]">
                {user?.name?.split(" ")[0] || "Wali Santri"}
              </h2>
            </div>
          </div>

          {/* Right Header Icons (Bell & Help Center CS) */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/pengumuman"
              onClick={triggerHaptic}
              className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white backdrop-blur-md"
              title="Notifikasi & Pengumuman"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#064e3b] animate-pulse" />
            </Link>

            <a
              href="https://wa.me/6285711223344?text=Halo%20Admin%20Sekolah,%20saya%20membutuhkan%20bantuan%20terkait%20aplikasi."
              target="_blank"
              rel="noopener noreferrer"
              onClick={triggerHaptic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white backdrop-blur-md text-xs font-semibold"
              title="Pusat Bantuan WhatsApp TU"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px]">Bantuan</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. HERO FLOATING CARD: Overlapping White Card with Embedded Emerald Card & 4 Quick Actions */}
      <div className="px-4 -mt-9 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl shadow-slate-900/10 border border-slate-100 dark:border-slate-800">
          {/* Top Embedded Card: Gradient Emerald (Balance & SPP status) */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-[#042d22] via-[#064e3b] to-[#085f47] text-white shadow-md border border-emerald-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-200/90 font-medium">
                {user?.role === "ortu" || user?.role === "siswa"
                  ? "Saldo Tabungan Santri"
                  : "Total Kas Operasional"}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setShowBalance(!showBalance);
                }}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
                title={showBalance ? "Sembunyikan Saldo" : "Lihat Saldo"}
              >
                {showBalance ? (
                  <EyeOff className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Eye className="w-4 h-4 text-emerald-300" />
                )}
              </button>
            </div>

            {/* Nominal Display */}
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                {showBalance ? formatRupiah(displaySaldo) : "Rp ••••••••••"}
              </span>
            </div>

            {/* Bottom Status Row inside Card */}
            <Link
              href="/dashboard/spp-transportasi"
              onClick={triggerHaptic}
              className="mt-3.5 pt-2.5 border-t border-emerald-700/60 flex items-center justify-between text-xs text-emerald-100/90 hover:text-white group"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="truncate font-medium">{sppStatus}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>

          {/* Bottom 4 Quick Action Buttons (Transfer, SPP, Presensi, Tahfidz) */}
          <div className="grid grid-cols-4 gap-2 pt-4 text-center">
            {/* Action 1: Bayar SPP */}
            <Link
              href="/dashboard/spp-transportasi"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-2xs group-hover:bg-emerald-100 transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full">
                Bayar SPP
              </span>
            </Link>

            {/* Action 2: Presensi Siswa */}
            <Link
              href="/dashboard/presensi"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-700 dark:text-blue-300 shadow-2xs group-hover:bg-blue-100 transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full">
                Presensi
              </span>
            </Link>

            {/* Action 3: Tahfidz Qur'an */}
            <Link
              href="/dashboard/tahfidz"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center text-teal-700 dark:text-teal-300 shadow-2xs group-hover:bg-teal-100 transition-colors">
                <BookCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full">
                Tahfidz
              </span>
            </Link>

            {/* Action 4: Tabungan Santri */}
            <Link
              href="/dashboard/tabungan"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-2xs group-hover:bg-amber-100 transition-colors">
                <PiggyBank className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full">
                Tabungan
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. PROMOTIONAL / MADRASAH ANNOUNCEMENT CAROUSEL BANNER */}
      <div className="px-4 mt-4">
        <Link
          href="/dashboard/pengumuman"
          onClick={triggerHaptic}
          className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-4 text-white shadow-md active:scale-98 transition-all"
        >
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
                Agenda Madrasah
              </span>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight mt-1 truncate">
                Ujian PTS & Khotmil Qur&apos;an Santri
              </h3>
              <p className="text-[11px] text-amber-100/90 truncate mt-0.5">
                Cek jadwal ujian dan setoran tahfidz semester ini
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white text-amber-800 font-bold text-xs shrink-0 shadow-sm flex items-center gap-1">
              <span>Buka</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      </div>

      {/* 4. SEARCH BAR (Triggers Universal Command Center Ctrl+K) */}
      <div className="px-4 mt-4">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            window.dispatchEvent(new CustomEvent("open-command-palette"));
          }}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs shadow-xs active:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Cari fitur, siswa, nilai, modul...
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Ctrl K
          </span>
        </button>
      </div>

      {/* 5. 8-GRID SERVICE MENU (4x2 Pastel Squircle Cards) */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Layanan Akademik & Santri
          </h3>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            8 Layanan
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {/* Item 1: Presensi Barcode */}
          <Link
            href="/dashboard/presensi"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs relative">
              <Calendar className="w-6 h-6" />
              {todayPresensi && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              Presensi
            </span>
          </Link>

          {/* Item 2: E-Rapor & Nilai */}
          <Link
            href="/dashboard/nilai"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              E-Rapor
            </span>
          </Link>

          {/* Item 3: Bus Jemputan */}
          <Link
            href="/dashboard/spp-transportasi"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/70 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <Bus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              Bus Sekolah
            </span>
          </Link>

          {/* Item 4: Mutaba'ah Ibadah */}
          <Link
            href="/dashboard/mutabaah"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/70 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              Mutaba&apos;ah
            </span>
          </Link>

          {/* Item 5: E-Learning LMS */}
          <Link
            href="/dashboard/lms"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              LMS Tugas
            </span>
          </Link>

          {/* Item 6: Kuitansi Kas */}
          <Link
            href="/dashboard/spp-transportasi"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/70 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              Kuitansi
            </span>
          </Link>

          {/* Item 7: Smart ID Card */}
          <Link
            href="/dashboard/siswa"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-800/70 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              Kartu Santri
            </span>
          </Link>

          {/* Item 8: Semua Modul Drawer */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              window.dispatchEvent(new CustomEvent("open-mobile-drawer"));
            }}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              Semua Menu
            </span>
          </button>
        </div>
      </div>

      {/* 6. RECENT MUTATION & ACTIVITY SNIPPET */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Aktivitas Terkini Ananda
          </h3>
          <Link
            href="/dashboard/presensi"
            onClick={triggerHaptic}
            className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5"
          >
            <span>Selengkapnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
          {/* Activity 1: Presensi Hari Ini */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                  Presensi Kedatangan Madrasah
                </p>
                <p className="text-[11px] text-slate-400">
                  {todayPresensi ? `Hadir pukul ${todayPresensi.waktuMasuk || "06:55"} WIB` : "Belum ada rekaman tap hari ini"}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
              {todayPresensi ? "Hadir" : "Belum Tap"}
            </span>
          </div>

          {/* Activity 2: Setoran Tahfidz */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                <BookCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                  Setoran Ziyadah Hafalan
                </p>
                <p className="text-[11px] text-slate-400">
                  Surah An-Naba&apos; (Ayat 1-20) • Mutqin
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 shrink-0">
              A (Mumtaz)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
