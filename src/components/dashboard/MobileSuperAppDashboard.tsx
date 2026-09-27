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
  Eye,
  EyeOff,
  Copy,
  Check,
  CreditCard,
  Wallet,
  QrCode,
  Award,
  CalendarDays,
  FileText,
  CheckCircle2,
  PiggyBank,
  Megaphone,
  LayoutGrid,
  ChevronRight,
  Receipt,
  Headphones,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Image as ImageIcon,
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

  // BRImo Features: Show / Hide Balance & Copy Account
  const [showBalance, setShowBalance] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // Dynamic Time Greeting (Selamat Pagi / Siang / Sore / Malam)
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, []);

  // Display user name
  const greetingName = useMemo(() => {
    if (!user) return "Ayah Bunda";
    if (user.role === "guru") return `Ustadz ${user.name.split(" ")[0]}`;
    if (user.role === "admin") return "Admin SDI";
    if (user.role === "siswa") return user.name.split(" ")[0];
    return user.name.split(" ")[0] || "Ayah Bunda";
  }, [user]);

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

  const schoolName = profile?.namaSekolah || "SD Islam Baitun Naim";

  // Haptic feedback
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  const handleCopyRekening = () => {
    triggerHaptic();
    const accountNum = currentSiswa.nisn || "20230015";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(accountNum);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  const handleOpenDrawer = () => {
    triggerHaptic();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-mobile-drawer"));
    }
  };

  // BRImo 8 Favorite Features Grid (2 Rows x 4 Columns)
  const brimoFavoriteMenus = [
    {
      label: "Tagihan SPP",
      href: "/dashboard/spp-transportasi",
      icon: Receipt,
      gradient: "from-[#00529C] to-[#003B73]",
      shadow: "shadow-blue-900/20",
    },
    {
      label: "Jadwal",
      href: "/dashboard/jadwal",
      icon: CalendarDays,
      gradient: "from-[#0284c7] to-[#0369a1]",
      shadow: "shadow-sky-900/20",
    },
    {
      label: "Presensi",
      href: "/dashboard/presensi",
      icon: CheckCircle2,
      gradient: "from-[#10b981] to-[#059669]",
      shadow: "shadow-emerald-900/20",
    },
    {
      label: "Tugas LMS",
      href: "/dashboard/lms",
      icon: FileText,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      shadow: "shadow-purple-900/20",
    },
    {
      label: "E-Rapor",
      href: "/dashboard/nilai",
      icon: Award,
      gradient: "from-[#f59e0b] to-[#d97706]",
      shadow: "shadow-amber-900/20",
    },
    {
      label: "Tabungan",
      href: "/dashboard/tabungan",
      icon: PiggyBank,
      gradient: "from-[#f43f5e] to-[#e11d48]",
      shadow: "shadow-rose-900/20",
    },
    {
      label: "Pengumuman",
      href: "/dashboard/pengumuman",
      icon: Megaphone,
      gradient: "from-[#6366f1] to-[#4f46e5]",
      shadow: "shadow-indigo-900/20",
    },
    {
      label: "Semua",
      action: "drawer",
      icon: LayoutGrid,
      gradient: "from-[#002D59] to-[#001F3F]",
      shadow: "shadow-slate-900/20",
    },
  ];

  // Tabungan & Tagihan Balance
  const tabunganNominal = 1250000;
  const tagihanNominal = 350000;

  // Recent Financial Activities (BRImo Mutasi)
  const recentActivities = [
    {
      id: "act-1",
      title: "Setoran Tabungan Santri",
      kategori: "Tabungan Rutin",
      date: "24 Sep 2026, 09:15 WIB",
      nominal: 50000,
      isIncome: true,
    },
    {
      id: "act-2",
      title: "Pembayaran SPP Agustus 2026",
      kategori: "SPP Bulanan",
      date: "10 Agu 2026, 14:20 WIB",
      nominal: 250000,
      isIncome: false,
    },
    {
      id: "act-3",
      title: "Antar Jemput Bus Agustus 2026",
      kategori: "Transportasi",
      date: "10 Agu 2026, 14:22 WIB",
      nominal: 75000,
      isIncome: false,
    },
  ];

  return (
    <div className="lg:hidden -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 pb-28 min-h-screen bg-[#F4F7FB] dark:bg-slate-950 text-slate-800 dark:text-slate-100 select-none">
      {/* ========================================================================= */}
      {/* 1. BRImo VIBRANT ROYAL BLUE HEADER                                        */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-b from-[#00529C] via-[#005BA6] to-[#004B8D] text-white px-5 pt-5 pb-16 relative overflow-hidden shadow-md">
        {/* Subtle Decorative Geometric Circles & Waves */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-36 h-36 rounded-full bg-sky-400/10 blur-lg pointer-events-none" />

        {/* Top Action Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsProfileOpen(true);
              }}
              className="w-11 h-11 rounded-full overflow-hidden p-0.5 bg-white/20 backdrop-blur-xs ring-2 ring-white/60 active:scale-95 transition-transform shrink-0"
            >
              <img
                src={
                  currentSiswa.avatar ||
                  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80"
                }
                alt={currentSiswa.nama}
                className="w-full h-full rounded-full object-cover"
              />
            </button>

            <div>
              <p className="text-xs text-blue-100 font-medium leading-tight">
                {timeGreeting},
              </p>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold text-white leading-tight tracking-tight">
                  {greetingName}
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[10px] text-blue-200/80 mt-0.5">
                {currentSiswa.nama} • {currentSiswa.kelas}
              </p>
            </div>
          </div>

          {/* Right Action Icons: Help Center & Notification Bell */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsPesanOpen(true);
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
              title="Pusat Bantuan / Buku Penghubung"
            >
              <Headphones className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsPesanOpen(true);
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white relative active:scale-95 transition-all cursor-pointer"
              title="Notifikasi Sekolah"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F37021] ring-2 ring-[#00529C]" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 -mt-10 relative z-20">
        {/* ========================================================================= */}
        {/* 2. THE SIGNATURE BRImo FLOATING BALANCE CARD ("REKENING UTAMA")           */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-lg shadow-blue-950/8 border border-slate-100 dark:border-slate-800 space-y-4">
          {/* Card Top: Saldo Title & Eye Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Saldo Rekening Tabungan
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setShowBalance(!showBalance);
                  }}
                  className="text-slate-400 hover:text-[#00529C] transition-colors p-0.5"
                  title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
                >
                  {showBalance ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Balance Nominal */}
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {showBalance ? formatRupiah(tabunganNominal) : "Rp ••••••••"}
              </div>
            </div>

            {/* School / Account Badge */}
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-[#00529C] dark:text-blue-300 text-[10px] font-bold inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#00529C]" />
                <span>Akun Santri</span>
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                {schoolName}
              </p>
            </div>
          </div>

          {/* Account Number (NISN / Virtual Account) with Salin Button */}
          <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">No. Rekening:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                1089-{currentSiswa.nisn || "20230015"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyRekening}
              className="text-[#00529C] dark:text-blue-400 font-bold flex items-center gap-1 hover:underline active:scale-95 transition-transform"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          {/* 4 Iconic BRImo Circular Action Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            {/* Action 1: Bayar SPP */}
            <Link
              href="/dashboard/spp-transportasi"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00529C] text-white flex items-center justify-center shadow-md shadow-blue-900/20 group-active:scale-90 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                Bayar SPP
              </span>
            </Link>

            {/* Action 2: Setor Tabungan */}
            <Link
              href="/dashboard/tabungan"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00529C] text-white flex items-center justify-center shadow-md shadow-blue-900/20 group-active:scale-90 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                Setor Saldo
              </span>
            </Link>

            {/* Action 3: Scan Presensi */}
            <Link
              href="/dashboard/presensi"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00529C] text-white flex items-center justify-center shadow-md shadow-blue-900/20 group-active:scale-90 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                Presensi QR
              </span>
            </Link>

            {/* Action 4: E-Rapor */}
            <Link
              href="/dashboard/nilai"
              onClick={triggerHaptic}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00529C] text-white flex items-center justify-center shadow-md shadow-blue-900/20 group-active:scale-90 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                E-Rapor
              </span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BRImo REMINDER / BILL BANNER ("TAGIHAN AKTIF")                         */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/15 border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F37021] text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-900/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F37021]">
                  Pengingat Tagihan
                </span>
                <span className="text-[10px] text-slate-400">&bull; 10 Sep 2026</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                SPP & Administrasi: {formatRupiah(tagihanNominal)}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/spp-transportasi"
            onClick={triggerHaptic}
            className="px-3.5 py-1.5 rounded-full bg-[#00529C] hover:bg-[#003B73] text-white text-xs font-bold shrink-0 shadow-sm active:scale-95 transition-transform"
          >
            Bayar
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 4. BRImo "FITUR FAVORIT" (2 ROWS X 4 COLS = 8 MAIN APPS)                  */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Fitur Favorit
            </h2>
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="text-xs font-bold text-[#00529C] dark:text-blue-400 hover:underline"
            >
              Atur Menu
            </button>
          </div>

          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {brimoFavoriteMenus.map((item, idx) => {
              const Icon = item.icon;

              if (item.action === "drawer") {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={handleOpenDrawer}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div
                      className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-md ${item.shadow} group-active:scale-90 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate w-full px-0.5">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={idx}
                  href={item.href!}
                  onClick={triggerHaptic}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-md ${item.shadow} group-active:scale-90 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate w-full px-0.5">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. BRImo "CATATAN KEUANGAN & MUTASI" (RECENT TRANSACTIONS)                 */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Catatan Keuangan & Mutasi
            </h2>
            <Link
              href="/dashboard/spp-transportasi"
              onClick={triggerHaptic}
              className="text-xs font-bold text-[#00529C] dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      act.isIncome
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-blue-100 text-[#00529C] dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {act.isIncome ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {act.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{act.date}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-xs font-extrabold ${
                      act.isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {act.isIncome ? "+" : "-"}
                    {formatRupiah(act.nominal)}
                  </p>
                  <span className="text-[9px] text-slate-400 font-medium">Berhasil</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. BRImo "PROMO & INFORMASI SEKOLAH" (HORIZONTAL CAROUSEL)                */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Informasi & Kegiatan Sekolah
            </h2>
            <Link
              href="/dashboard/pengumuman"
              onClick={triggerHaptic}
              className="text-xs font-bold text-[#00529C] dark:text-blue-400 hover:underline"
            >
              Semua Info
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {/* Card 1 */}
            <div className="w-72 shrink-0 rounded-3xl bg-gradient-to-br from-[#00529C] to-[#002D59] text-white p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-1 relative z-10">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-blue-100 text-[10px] font-bold">
                  Akademik
                </span>
                <h3 className="text-sm font-bold leading-snug">
                  Pelaksanaan Sumatif Tengah Semester (STS)
                </h3>
                <p className="text-[11px] text-blue-100/80">
                  Mulai 20 September 2026. Persiapkan ananda dengan belajar tekun.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between text-[11px] text-blue-200">
                <span>Wali Kelas 3 Al Farabi</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="w-72 shrink-0 rounded-3xl bg-gradient-to-br from-[#F37021] to-[#C8530C] text-white p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-1 relative z-10">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-orange-100 text-[10px] font-bold">
                  Ekstrakurikuler
                </span>
                <h3 className="text-sm font-bold leading-snug">
                  Latihan Panahan & Robotik Santri
                </h3>
                <p className="text-[11px] text-orange-100/80">
                  Jadwal setiap hari Sabtu pukul 08:00 WIB di lapangan sekolah.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between text-[11px] text-orange-200">
                <span>Koordinator Ekskul</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Profile Santri */}
      <MobileStudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        siswa={currentSiswa}
        user={user}
      />

      {/* Drawer Buku Pesan / Penghubung */}
      <MobileBukuPesanDrawer
        isOpen={isPesanOpen}
        onClose={() => setIsPesanOpen(false)}
        user={user}
      />

      {/* Modal Galeri Foto */}
      <MobileGaleriModal
        isOpen={isGaleriOpen}
        onClose={() => setIsGaleriOpen(false)}
      />
    </div>
  );
}
