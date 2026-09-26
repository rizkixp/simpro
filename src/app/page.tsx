"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Users,
  Calendar,
  Award,
  School,
  BookOpen,
  Sparkles,
  Wallet,
  BookMarked,
  LayoutDashboard,
  LogIn,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const { profile } = useSchoolData();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const appName = profile?.appName || "SIM SD Islam Smart School";
  const appTagline = profile?.appTagline || profile?.namaSekolah || "Sistem Informasi Manajemen Sekolah Islam Terpadu";
  const appLogoUrl = profile?.appLogoUrl;
  const appIconPreset = profile?.appIconPreset || "graduation";

  const heroBadge = profile?.landingHeroBadge || "Portal Resmi Madrasah & Sekolah Islam Terpadu";
  const heroTitle = profile?.landingHeroTitle || "Transformasi Digital Pendidikan yang Cerdas, Efisien & Berakhlak";
  const heroSubtitle =
    profile?.landingHeroSubtitle ||
    "Kelola seluruh ekosistem madrasah dari administrasi santri, pendidik, absensi digital, e-rapor Kurikulum Merdeka, setoran tahfidz, hingga SPP terpadu.";
  const ctaText = profile?.landingCtaText || "Buka Portal & Form Login";
  const showDemoButton = profile?.landingShowDemoButton !== false;
  const footerText = profile?.landingFooterText || `${appName} - ${appTagline}. All rights reserved.`;

  const handleDemoClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
      return;
    }
    setIsDemoLoading(true);
    try {
      await login("admin@sekolah.id", "admin", "admin123");
      router.push("/dashboard");
    } catch {
      router.push("/login");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0f172a] text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Islamic Ambient Glows */}
      <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 -mt-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 -ml-24 w-96 h-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 -mr-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      {/* ================= TOP NAVIGATION ================= */}
      <header className="relative z-10 px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
            {appLogoUrl ? (
              <img src={appLogoUrl} alt={appName} className="h-full w-full object-cover rounded-[14px]" />
            ) : (
              <div className="text-white">
                {appIconPreset === "school" && <School className="h-6 w-6" />}
                {appIconPreset === "book" && <BookOpen className="h-6 w-6" />}
                {appIconPreset === "shield" && <ShieldCheck className="h-6 w-6" />}
                {appIconPreset === "sparkles" && <Sparkles className="h-6 w-6" />}
                {(!appIconPreset || appIconPreset === "graduation") && <GraduationCap className="h-6 w-6" />}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight flex items-center gap-2">
              {appName}
            </h1>
            <p className="text-xs text-emerald-200/80 truncate max-w-[200px] sm:max-w-md">{appTagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-emerald-200 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {user.name} ({user.role})
              </span>
              <Link
                href="/dashboard"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Ke Dashboard</span>
              </Link>
              <button
                onClick={() => logout()}
                title="Keluar Akun"
                className="p-2 sm:py-2.5 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs sm:text-sm transition-all flex items-center"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 border border-emerald-400/30"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk ke Sistem</span>
            </Link>
          )}
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 sm:py-16 flex-1 flex flex-col justify-center items-center text-center">
        {heroBadge && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-500/30 text-emerald-200 text-xs font-semibold mb-6 shadow-inner animate-in fade-in slide-in-from-top-3 duration-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{heroBadge}</span>
          </div>
        )}

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          {heroTitle}
        </h2>

        <p className="mt-5 text-emerald-100/90 text-sm sm:text-base lg:text-lg max-w-2xl font-normal leading-relaxed">
          {heroSubtitle}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/login"
            className="px-7 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5 border border-emerald-300/30"
          >
            <span>{ctaText}</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          {showDemoButton && (
            <button
              onClick={handleDemoClick}
              disabled={isDemoLoading}
              className="px-7 sm:px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm sm:text-base border border-white/15 backdrop-blur-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>{isDemoLoading ? "Membuka Demo..." : "Lihat Demo Dashboard"}</span>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </button>
          )}
        </div>

        {/* Value Highlights Pill Strip */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-xs text-emerald-200/90 font-medium">
          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            E-Rapor Kurikulum Merdeka
          </span>
          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Monitoring Tahfidz & Mutaba'ah
          </span>
          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            SPP & Tabungan Digital
          </span>
          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Multi-Platform PWA Offline
          </span>
        </div>

        {/* ================= 6 FEATURE CARDS GRID ================= */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full text-left">
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="h-11 w-11 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-4 border border-blue-400/20">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Database Kesiswaan & Asatidz</h3>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Manajemen master data santri, asatidz, kelas, dan data keluarga dengan pencarian instan dan ekspor data resmi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4 border border-emerald-400/20">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Presensi Digital & Smart QR</h3>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Pencatatan kehadiran harian siswa dan pegawai otomatis dengan notifikasi WhatsApp gateway ke orang tua santri.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="h-11 w-11 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-4 border border-amber-400/20">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Penilaian & E-Rapor Merdeka</h3>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Kalkulasi otomatis bobot formatif, sumatif, capaian pembelajaran (TP), dan cetak lembar rapor resmi berstandar Kemendikbud.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="h-11 w-11 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-4 border border-teal-400/20">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Keuangan, SPP & Tabungan</h3>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Monitoring pembayaran SPP, transportasi antar jemput, buku tabungan santri, kasbon pegawai, dan cetak kuitansi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="h-11 w-11 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-4 border border-purple-400/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">LMS & Pembelajaran Daring</h3>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Distribusi materi modul ajar, tugas online, bank soal, kuis interaktif, dan forum diskusi antar asatidz dan santri.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="h-11 w-11 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center mb-4 border border-rose-400/20">
              <BookMarked className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Tahfidz Qur'an & Mutaba'ah</h3>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Pencatatan setoran hafalan surah Juz 30, mutaba'ah ibadah yaumiyah sholat 5 waktu, dzikir, dan amalan sunnah santri.
            </p>
          </div>
        </div>

        {/* Islamic Hadits Quotation Banner */}
        <div className="mt-12 w-full max-w-2xl p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-emerald-500/30 text-xs sm:text-sm text-emerald-100/90 leading-relaxed italic backdrop-blur-md">
          &ldquo;Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.&rdquo;
          <div className="mt-2 font-semibold not-italic text-amber-300 text-xs">— HR. Muslim No. 2699</div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 px-6 py-6 border-t border-white/10 text-center text-xs text-emerald-200/70 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <p>&copy; {new Date().getFullYear()} {footerText}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          Bank-Grade Security (PCI-DSS) • Terintegrasi Cloud Supabase
        </p>
      </footer>
    </div>
  );
}
