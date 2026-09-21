"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { GraduationCap, ArrowRight, ShieldCheck, Users, Calendar, Award, School, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { profile } = useSchoolData();

  const appName = profile?.appName || "SIM Sekolah PRO";
  const appTagline = profile?.appTagline || "Sistem Informasi Manajemen Sekolah Terpadu";
  const appLogoUrl = profile?.appLogoUrl;
  const appIconPreset = profile?.appIconPreset || "graduation";

  const heroBadge = profile?.landingHeroBadge || "Platform Manajemen Sekolah Generasi Terbaru #1";
  const heroTitle = profile?.landingHeroTitle || "Transformasi Digital Pendidikan yang Cerdas, Efisien & Terpadu";
  const heroSubtitle = profile?.landingHeroSubtitle || "Kelola seluruh ekosistem sekolah dari administrasi siswa, tenaga pendidik, absensi digital, e-rapor, hingga tagihan SPP dalam satu platform modern berkecepatan tinggi.";
  const ctaText = profile?.landingCtaText || "Buka Portal & Form Login";
  const showDemoButton = profile?.landingShowDemoButton !== false;
  const footerText = profile?.landingFooterText || `${appName} - ${appTagline}. All rights reserved.`;

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === "bendahara") {
          router.push("/dashboard/spp-transportasi");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20 overflow-hidden shrink-0">
            {appLogoUrl ? (
              <img src={appLogoUrl} alt={appName} className="h-full w-full object-cover" />
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
            <h1 className="font-bold text-lg tracking-tight text-white leading-tight">
              {appName}
            </h1>
            <p className="text-xs text-slate-400">{appTagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <span>Masuk Sistem</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center">
        {heroBadge && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {heroBadge}
          </div>
        )}

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          {heroTitle}
        </h2>

        <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
          {heroSubtitle}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-3"
          >
            <span>{ctaText}</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          {showDemoButton && (
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/10 backdrop-blur-md transition-all"
            >
              Lihat Demo Dashboard Langsung
            </Link>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-white">Database Siswa & Guru</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Manajemen master data kesiswaan dan kepegawaian dengan pencarian instan dan ekspor data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-white">Presensi & Jadwal Kelas</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Pencatatan kehadiran harian otomatis dan visualisasi jadwal pelajaran per kelas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-white">Penilaian & E-Rapor</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Kalkulasi otomatis bobot tugas, UTS, dan UAS dengan format cetak rapor resmi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-white">Keuangan & SPP Siswa</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Tracking status pembayaran SPP, cetak kuitansi resmi, dan monitoring tagihan menunggak.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-white/10 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} {footerText}
      </footer>
    </div>
  );
}
