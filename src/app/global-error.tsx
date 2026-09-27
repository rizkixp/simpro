"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NextGlobalError] Root level exception:", error);
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <html lang="id">
      <body className="h-full bg-slate-50 font-sans antialiased text-slate-900">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1.5">
              Sistem Sedang Memuat Ulang
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Aplikasi mendeteksi pembaruan versi. Silakan muat ulang halaman untuk mendapatkan versi terbaru.
            </p>

            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={() => (typeof reset === "function" ? reset() : handleReload())}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Aplikasi</span>
              </button>

              <button
                type="button"
                onClick={handleGoHome}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Halaman Utama</span>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
