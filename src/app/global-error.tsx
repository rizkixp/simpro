"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    console.error("[NextGlobalError] Root level exception:", error);

    // Auto-recovery for ChunkLoadError or stale Service Worker cache
    if (typeof window !== "undefined") {
      const errMsg = error?.message || "";
      const isChunkOrVersionError =
        error?.name === "ChunkLoadError" ||
        errMsg.includes("Loading chunk") ||
        errMsg.includes("Failed to fetch") ||
        errMsg.includes("dynamically imported module") ||
        errMsg.includes("Unexpected token '<'");

      const lastAutoReset = sessionStorage.getItem("simpro_auto_reset_timestamp");
      const now = Date.now();

      // Only attempt automatic silent purge once per 30 seconds to strictly prevent infinite reload loops
      if (isChunkOrVersionError && (!lastAutoReset || now - parseInt(lastAutoReset, 10) > 30000)) {
        sessionStorage.setItem("simpro_auto_reset_timestamp", now.toString());
        handlePurgeAndReload();
      }
    }
  }, [error]);

  const handlePurgeAndReload = async () => {
    setIsCleaning(true);
    if (typeof window !== "undefined") {
      try {
        // 1. Unregister all Service Workers
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
        }

        // 2. Clear all browser CacheStorage
        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        }
      } catch (err) {
        console.warn("[GlobalError] Cache clearing warning:", err);
      }

      // 3. Force clean reload bypassing browser cache
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.set("_v", Date.now().toString());
      window.location.replace(cleanUrl.toString());
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleGoLogin = () => {
    if (typeof window !== "undefined") {
      document.cookie = "sim_session=; path=/; max-age=0;";
      localStorage.removeItem("sim_auth_user");
      window.location.href = "/login?logout=true";
    }
  };

  return (
    <html lang="id">
      <body className="h-full bg-slate-50 font-sans antialiased text-slate-900">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 flex items-center justify-center p-4 selection:bg-emerald-700 selection:text-white">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 text-center flex flex-col items-center">
            {/* Warning Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1.5">
              Pembaruan Tampilan Sistem
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Aplikasi mendeteksi pembaruan versi atau data tampilan perlu disegarkan. Klik tombol di bawah untuk membersihkan cache dan memuat versi terbaru.
            </p>

            {/* Action Buttons */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={handlePurgeAndReload}
                disabled={isCleaning}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCleaning ? "animate-spin" : ""}`} />
                <span>{isCleaning ? "Membersihkan Cache..." : "Bersihkan Cache & Muat Ulang"}</span>
              </button>

              <button
                type="button"
                onClick={handleGoHome}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Halaman Utama</span>
              </button>

              <button
                type="button"
                onClick={handleGoLogin}
                className="w-full py-2 px-3 text-[11px] text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset Sesi & Masuk Ulang</span>
              </button>
            </div>

            {/* Collapsible Technical Error Details for Debugging */}
            <div className="w-full mt-6 pt-4 border-t border-slate-100 text-left">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  <span>Detail Teknis Masalah</span>
                </span>
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showDetails && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono break-all max-h-36 overflow-y-auto leading-relaxed">
                  <p className="font-semibold text-rose-600 mb-1">
                    {error?.name || "Exception"}: {error?.message || "Tidak ada rincian pesan error"}
                  </p>
                  {error?.digest && (
                    <p className="text-[10px] text-slate-400">Digest: {error.digest}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
