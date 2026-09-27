"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, LogIn } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NextAppError] Client-side exception caught by error.tsx:", error);
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  const handleRelogin = () => {
    if (typeof window !== "undefined") {
      document.cookie = "sim_session=; path=/; max-age=0;";
      localStorage.removeItem("sim_auth_user");
      window.location.href = "/login?logout=true";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 dark:border-emerald-950 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
          Tampilan Sedang Diperbarui
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Terjadi jeda saat sinkronisasi data tampilan. Silakan muat ulang halaman untuk memperbarui sesi Anda.
        </p>

        <div className="w-full space-y-2.5">
          <button
            type="button"
            onClick={() => (typeof reset === "function" ? reset() : handleReload())}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang Tampilan</span>
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ke Halaman Dashboard</span>
          </button>

          <button
            type="button"
            onClick={handleRelogin}
            className="w-full py-2 px-3 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3 h-3" />
            <span>Masuk Ulang Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
