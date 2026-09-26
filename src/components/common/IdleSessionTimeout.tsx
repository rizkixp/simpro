"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Clock, LogOut, RefreshCw } from "lucide-react";

// Standar Bank-Grade OJK & PCI-DSS: 15 Menit Inaktivitas
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Menit
const WARNING_BEFORE_MS = 60 * 1000;    // Peringatan 60 detik sebelum logout
const WARNING_THRESHOLD_MS = IDLE_TIMEOUT_MS - WARNING_BEFORE_MS; // 14 Menit
const STORAGE_KEY = "sim_session_last_active";

export default function IdleSessionTimeout() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const lastRecordedActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Rekam aktivitas pengguna (Throttled per 5 detik untuk efisiensi CPU)
  const recordActivity = useCallback(() => {
    if (!user || isLoggingOutRef.current) return;

    const now = Date.now();
    if (now - lastRecordedActivityRef.current > 5000) {
      lastRecordedActivityRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {}
      // Jika peringatan sempat muncul namun user kembali aktif
      if (showWarning) {
        setShowWarning(false);
      }
    }
  }, [user, showWarning]);

  // Eksekusi Logout Otomatis
  const handleAutoLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      localStorage.removeItem(STORAGE_KEY);
      await logout();
    } catch (err) {
      console.warn("Gagal logout otomatis:", err);
    } finally {
      window.location.href = "/login?reason=timeout&logout=true";
    }
  }, [logout]);

  // Reset Sesi Manual (Tombol "Lanjutkan Sesi")
  const handleExtendSession = () => {
    const now = Date.now();
    lastRecordedActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {}
    setShowWarning(false);
    setSecondsRemaining(60);
  };

  // Logout Manual (Tombol "Keluar Sekarang")
  const handleManualLogout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      localStorage.removeItem(STORAGE_KEY);
      await logout();
    } finally {
      window.location.href = "/login?logout=true";
    }
  };

  useEffect(() => {
    if (!user) return;

    // Inisialisasi waktu aktivitas saat komponen terpasang
    const initialTime = Date.now();
    lastRecordedActivityRef.current = initialTime;
    try {
      localStorage.setItem(STORAGE_KEY, String(initialTime));
    } catch {}

    // Event listener deteksi interaksi manusia
    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];

    const handleEvent = () => recordActivity();

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleEvent, { passive: true });
    });

    // Sinkronisasi lintas tab (Cross-tab activity synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = Number(e.newValue);
        if (!isNaN(remoteTime)) {
          lastRecordedActivityRef.current = remoteTime;
          const elapsed = Date.now() - remoteTime;
          if (elapsed < WARNING_THRESHOLD_MS && showWarning) {
            setShowWarning(false);
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Interval pengawas setiap 1 detik
    const timerInterval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const storedTimeStr = localStorage.getItem(STORAGE_KEY);
      const lastActive = storedTimeStr ? Number(storedTimeStr) : lastRecordedActivityRef.current;
      const now = Date.now();
      const elapsed = now - (isNaN(lastActive) ? now : lastActive);

      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Waktu habis: Jalankan logout otomatis
        handleAutoLogout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        // Masuk fase peringatan (60 detik terakhir)
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleEvent);
      });
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, recordActivity, handleAutoLogout, showWarning]);

  if (!user || !showWarning) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-timeout-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200 dark:border-amber-900/60 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-rose-400/10 blur-2xl pointer-events-none" />

        {/* Shield Warning Icon */}
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <ShieldAlert className="h-9 w-9 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md">
            !
          </span>
        </div>

        {/* Badge PCI-DSS & OJK Standard */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-3 uppercase tracking-wider">
          <Clock className="h-3 w-3" /> Proteksi Keamanan Sesi Bank-Grade
        </span>

        {/* Title & Description */}
        <h3
          id="idle-timeout-title"
          className="text-xl font-bold text-slate-900 dark:text-white tracking-tight"
        >
          Sesi Anda Akan Segera Berakhir
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
          Sistem mendeteksi tidak ada aktivitas selama 14 menit. Demi menjaga kerahasiaan data sekolah dan keuangan, akun akan otomatis keluar dalam:
        </p>

        {/* Big Countdown Timer */}
        <div className="my-5 flex items-center justify-center">
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 border-2 border-amber-300 dark:border-amber-700/60 shadow-inner flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
            <span className="font-mono text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              detik
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleManualLogout}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Sekarang</span>
          </button>

          <button
            type="button"
            onClick={handleExtendSession}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Lanjutkan Sesi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
