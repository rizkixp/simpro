"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Building,
  Smartphone,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { TagihanSiswa, SchoolProfile } from "@/types/school";

interface OnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagihan: TagihanSiswa | null;
  schoolProfile?: SchoolProfile;
  onSuccessPayment?: (tagihanId: string, paymentMethod: string, noKuitansi: string) => void;
}

declare global {
  interface Window {
    snap?: any;
  }
}

export function OnlinePaymentModal({
  isOpen,
  onClose,
  tagihan,
  schoolProfile,
  onSuccessPayment,
}: OnlinePaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [kuitansiNumber, setKuitansiNumber] = useState<string>("");
  const [viewMode, setViewMode] = useState<"snap" | "qris_static">("snap");

  // Load Midtrans Snap.js script when modal opens
  useEffect(() => {
    if (!isOpen || !schoolProfile?.midtransClientKey) return;

    const isProd = schoolProfile.midtransIsProduction;
    const snapUrl = isProd
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const scriptId = "midtrans-snap-script";
    let existingScript = document.getElementById(scriptId) as HTMLScriptElement;

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = snapUrl;
      script.setAttribute("data-client-key", schoolProfile.midtransClientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen, schoolProfile]);

  if (!isOpen || !tagihan) return null;

  const handlePayWithMidtrans = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/payment/create-snap-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagihanId: tagihan.id,
          grossAmount: tagihan.nominal,
          siswaNama: tagihan.siswaNama,
          siswaKelas: tagihan.kelas,
          judul: tagihan.judul,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.token) {
        // Jika server key belum diatur, arahkan ke QRIS manual / statis
        if (data.message?.includes("belum dikonfigurasi")) {
          setViewMode("qris_static");
          setIsLoading(false);
          return;
        }
        throw new Error(data.message || "Gagal membuat sesi pembayaran Midtrans");
      }

      if (window.snap) {
        window.snap.pay(data.token, {
          onSuccess: (result: any) => {
            const noKwt = `KWT-${Date.now().toString().slice(-6)}`;
            setKuitansiNumber(noKwt);
            setIsSuccess(true);
            if (onSuccessPayment) {
              onSuccessPayment(tagihan.id, `Midtrans (${result.payment_type || "QRIS"})`, noKwt);
            }
          },
          onPending: () => {
            setErrorMsg("Pembayaran sedang diproses / menunggu transfer. Silakan periksa status di m-Banking Anda.");
          },
          onError: (result: any) => {
            setErrorMsg(`Pembayaran gagal: ${result.status_message || "Terjadi kesalahan sistem"}`);
          },
          onClose: () => {
            // Dialog ditutup oleh pengguna
          },
        });
      } else {
        // Fallback buka redirect url jika snap script belum siap
        if (data.redirectUrl) {
          window.open(data.redirectUrl, "_blank");
        } else {
          throw new Error("SDK Midtrans Snap belum siap. Silakan refresh halaman.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses pembayaran online.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualQrisConfirm = () => {
    const noKwt = `KWT-QRS-${Date.now().toString().slice(-6)}`;
    setKuitansiNumber(noKwt);
    setIsSuccess(true);
    if (onSuccessPayment) {
      onSuccessPayment(tagihan.id, "QRIS Sekolah", noKwt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 modal-bottom-sheet">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
          <div className="w-10 h-1 rounded-full bg-white/40" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Pembayaran Tagihan Online
              </h3>
              <p className="text-[11px] text-emerald-100">
                {schoolProfile?.namaSekolah || "Portal Keuangan Sekolah"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pembayaran Berhasil!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tagihan ananda <strong className="text-slate-800 dark:text-slate-200">{tagihan.siswaNama}</strong> telah resmi dilunasi.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs inline-block">
                <span className="text-slate-400 block text-[10px]">Nomor Kuitansi Resmi:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {kuitansiNumber}
                </span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Tutup & Kembali
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Rincian Tagihan */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Santri / Siswa:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {tagihan.siswaNama} ({tagihan.kelas})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Item Tagihan:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {tagihan.judul}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {tagihan.kategori}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total Tagihan:
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatRupiah(tagihan.nominal)}
                  </span>
                </div>
              </div>

              {/* Supported Payment Channels */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Metode Pembayaran Online yang Didukung:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>QRIS Nasional</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>VA BSI Syariah</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1">
                    <Smartphone className="w-4 h-4 text-sky-600" />
                    <span>GoPay / OVO</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>Mandiri / BRI VA</span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* View Mode Switching: Midtrans vs Direct QRIS */}
              {viewMode === "snap" ? (
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePayWithMidtrans}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                    <span>
                      {isLoading ? "Menyiapkan Pembayaran..." : "Bayar Sekarang (QRIS & Virtual Account)"}
                    </span>
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("qris_static")}
                      className="text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 underline cursor-pointer"
                    >
                      Atau gunakan QRIS Manual Sekolah
                    </button>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Terenkripsi 256-bit SSL
                    </span>
                  </div>
                </div>
              ) : (
                /* Mode QRIS Manual / Alternatif */
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    Scan Barcode QRIS Resmi Sekolah
                  </span>
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
                    {schoolProfile?.qrisManualImageUrl ? (
                      <img
                        src={schoolProfile.qrisManualImageUrl}
                        alt="QRIS Sekolah"
                        className="w-48 h-48 object-contain mx-auto"
                      />
                    ) : (
                      /* QR Code placeholder generator */
                      <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center p-3 text-slate-700">
                        <QrCode className="w-24 h-24 text-slate-800 mb-2" />
                        <span className="text-[10px] font-bold">QRIS NASIONAL</span>
                        <span className="text-[9px] text-slate-500">{schoolProfile?.namaSekolah || "SDI Smart School"}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Buka aplikasi BCA Mobile, Livin, BRImo, BSI Mobile, GoPay, ShopeePay, atau OVO, lalu scan barcode di atas sebesar <strong className="text-emerald-700 dark:text-emerald-400">{formatRupiah(tagihan.nominal)}</strong>.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleManualQrisConfirm}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      Konfirmasi Sudah Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("snap")}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                    >
                      Kembali ke Midtrans
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
