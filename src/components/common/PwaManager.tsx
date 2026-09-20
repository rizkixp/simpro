"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi, Download, Smartphone } from "lucide-react";

// Global interface extension for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function PwaManager() {
  const [isOffline, setIsOffline] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SDI Smart PWA: Service Worker aktif:", registration.scope);
          })
          .catch((error) => {
            console.warn("SDI Smart PWA: Pendaftaran Service Worker gagal:", error);
          });
      });
    }

    // 2. Capture BeforeInstallPrompt for Android & Chrome/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("pwa-install-ready"));
      console.log("SDI Smart PWA: Install prompt siap.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 3. Online/Offline Network Status Listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    // Initial check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300">Mode Offline Aktif</p>
            <p className="text-[11px] text-slate-300 truncate">
              Koneksi internet terputus. Data tetap tersimpan di memori lokal PWA.
            </p>
          </div>
        </div>
      )}

      {/* Back Online Toast */}
      {showOnlineToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-emerald-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-300">Terhubung Kembali</p>
            <p className="text-[11px] text-emerald-100">
              Koneksi internet aktif. Sinkronisasi data cloud siap dilanjutkan.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Hook to trigger PWA Installation anywhere in the app
export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed PWA)
    const checkIsStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandaloneMode);
    };

    checkIsStandalone();

    // Check if iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // Check if beforeinstallprompt is already available
    if (window.__pwaInstallPrompt) {
      setCanInstall(true);
    }

    const onReady = () => setCanInstall(true);
    window.addEventListener("pwa-install-ready", onReady);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setCanInstall(false);
      window.__pwaInstallPrompt = null;
    });

    return () => {
      window.removeEventListener("pwa-install-ready", onReady);
    };
  }, []);

  const promptInstall = async () => {
    if (window.__pwaInstallPrompt) {
      try {
        await window.__pwaInstallPrompt.prompt();
        const choice = await window.__pwaInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          console.log("Pengguna menyetujui instalasi PWA SDI Smart");
          setIsInstalled(true);
        }
        window.__pwaInstallPrompt = null;
        setCanInstall(false);
      } catch (err) {
        console.error("Gagal memanggil prompt instalasi:", err);
      }
    }
  };

  return { canInstall, isInstalled, isIos, promptInstall };
}
