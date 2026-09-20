"use client";

import React, { useState } from "react";
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from "lucide-react";
import { usePwaInstall } from "./PwaManager";

export default function InstallPwaButton() {
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed as PWA standalone, no need to show install button
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (canInstall) {
      promptInstall();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Pasang aplikasi SDI Smart School di HP atau Komputer Anda"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer border border-emerald-400/30 group"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Pasang Aplikasi</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* Manual Installation Guide Modal (for iOS or browsers waiting for prompt) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#064e3b] to-emerald-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl">
                  🕌
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Pasang SDI Smart School</h3>
                  <p className="text-xs text-emerald-200">Aplikasi Android & iOS Tanpa Play Store</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm">
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                Aplikasi ini mendukung <strong>PWA (Progressive Web App)</strong>. Anda dapat memasangnya langsung di layar utama smartphone dengan cara:
              </p>

              {isIos ? (
                /* iOS Safari Instructions */
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-xs">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span>Petunjuk untuk iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 list-decimal pl-4">
                    <li className="flex items-start gap-2">
                      <span>1.</span>
                      <span>
                        Klik tombol <strong>Bagikan / Share</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> ikon kotak berpanah atas) di bilah bawah Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>2.</span>
                      <span>
                        Gulir menu ke bawah lalu pilih <strong>"Tambah ke Layar Utama"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" /> <em>Add to Home Screen</em>).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>3.</span>
                      <span>Klik tombol <strong>Tambah</strong> di pojok kanan atas. Selesai!</span>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Android / Chrome Instructions */
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Petunjuk untuk Android / Chrome:</span>
                  </div>
                  <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal pl-4">
                    <li>Klik menu <strong>titik 3 (⋮)</strong> di pojok kanan atas browser Google Chrome.</li>
                    <li>Pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                    <li>Konfirmasi <strong>"Instal"</strong>. Ikon SDI Smart School akan langsung muncul di menu HP Anda!</li>
                  </ol>
                </div>
              )}

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Hemat Kuota & Memori</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bisa Akses Offline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Buka Layar Penuh (App)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Update Otomatis</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-[#064e3b] text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
