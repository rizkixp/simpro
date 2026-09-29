"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, LogIn } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isCleaning: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isCleaning: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isCleaning: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught component error:", error, errorInfo);
  }

  private handleReload = async () => {
    this.setState({ isCleaning: true });
    if (typeof window !== "undefined") {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {}

      window.location.replace(window.location.pathname + "?_r=" + Date.now());
    }
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  private handleRelogin = () => {
    if (typeof window !== "undefined") {
      document.cookie = "sim_session=; path=/; max-age=0;";
      localStorage.removeItem("sim_auth_user");
      window.location.href = "/login?logout=true";
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 dark:border-emerald-950 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              {this.props.fallbackTitle || "Tampilan Sedang Diperbarui"}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {this.props.fallbackMessage ||
                "Terjadi jeda saat sinkronisasi data tampilan. Silakan muat ulang halaman untuk melanjutkan."}
            </p>

            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                disabled={this.state.isCleaning}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${this.state.isCleaning ? "animate-spin" : ""}`} />
                <span>{this.state.isCleaning ? "Membersihkan..." : "Muat Ulang Halaman"}</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Halaman Dashboard</span>
              </button>

              <button
                type="button"
                onClick={this.handleRelogin}
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

    return this.props.children;
  }
}
