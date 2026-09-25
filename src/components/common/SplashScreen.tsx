"use client";

import React, { useState, useEffect } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function SplashScreen() {
  const { profile } = useSchoolData();
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Periksa apakah pengguna baru pertama kali membuka aplikasi pada sesi ini
    const hasShown = sessionStorage.getItem("sim_splash_shown");
    if (!hasShown) {
      setIsVisible(true);

      // Durasi tampil splash screen resmi (1.4 detik) sebelum transisi keluar
      const timer = setTimeout(() => {
        setIsFading(true);
        // Hapus elemen setelah animasi fade-out selesai
        const removeTimer = setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem("sim_splash_shown", "true");
        }, 600);

        return () => clearTimeout(removeTimer);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  const appName = profile?.appName || "SIM SD Islam Smart School";
  const appTagline = profile?.appTagline || profile?.namaSekolah || "Sistem Informasi Manajemen Sekolah Islam Terpadu";
  const logoUrl = profile?.appLogoUrl || "/icons/icon.svg";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] text-white p-6 sm:p-10 select-none transition-all duration-600 ease-out ${
        isFading ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Decorative Motif */}
      <div className="absolute inset-0 bg-islamic-pattern opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      {/* Top Header Placeholder (Keeps layout centered) */}
      <div className="relative z-10 w-full flex justify-center pt-4">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-emerald-100 shadow-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Bismillah • Membangun Generasi Qur'ani</span>
        </span>
      </div>

      {/* Center Branding & Logo */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-4">
        {/* Glowing Logo Icon */}
        <div className="relative mb-6">
          {/* Animated Ambient Glow Ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-amber-400/40 via-emerald-400/30 to-teal-400/40 blur-xl animate-pulse" />
          
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-amber-300/40 p-2.5 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              src={logoUrl}
              alt={appName}
              className="h-full w-full object-contain filter drop-shadow-lg"
            />
          </div>
        </div>

        {/* School / App Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          {appName}
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
          {appTagline}
        </p>

        {/* Animated Loading Dots Indicator ala Android Material 3 */}
        <div className="mt-8 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-teal-200 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* Bottom Footer: Security & Industrial Standard */}
      <div className="relative z-10 w-full flex flex-col items-center pb-2 text-center">
        <p className="text-[11px] text-emerald-200/80 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
          Bank-Grade Security (PCI-DSS) • Terintegrasi Cloud
        </p>
        <span className="text-[10px] text-emerald-300/50 mt-1">
          v1.0.0 Pro • Standar Industri Pendidikan
        </span>
      </div>
    </div>
  );
}
