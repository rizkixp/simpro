"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { formatRupiah } from "@/lib/utils";
import {
  ArrowLeft,
  Receipt,
  Bus,
  BookOpen,
  PiggyBank,
  CheckCircle2,
  Clock,
  ChevronRight,
  CreditCard,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  QrCode,
} from "lucide-react";

interface MobileKeuanganViewProps {
  onPayNow?: () => void;
  onBack?: () => void;
}

export default function MobileKeuanganView({
  onPayNow,
  onBack,
}: MobileKeuanganViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    siswaList,
    tabunganList,
    transaksiSPPTransportList,
    pesertaTransportList,
    profile,
  } = useSchoolData();

  // 3 Tabs matching Screen 6: Tagihan | Tabungan | Riwayat
  const [activeTab, setActiveTab] = useState<"tagihan" | "tabungan" | "riwayat">("tagihan");

  // Haptic feedback
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  // Student info (defaults to Ahmad Fauzan)
  const currentSiswa = useMemo(() => {
    const childNameFromUser =
      user?.phone ||
      user?.name?.replace(/^(wali murid|wali santri|wali|orang tua|ayah|bunda|ibu|abi|umi)\s+/i, "").trim() ||
      "Ahmad Fauzan";

    return (
      (siswaList || []).find(
        (s) =>
          (user?.nisnOrNip && s?.nisn === user.nisnOrNip) ||
          (user?.phone && s?.nama && s.nama.toLowerCase().includes(user.phone.toLowerCase())) ||
          (s?.nama && s.nama.toLowerCase().includes("ahmad"))
      ) || {
        id: "sis-default",
        nama: user?.role === "ortu" ? childNameFromUser : "Ahmad Fauzan",
        kelas: user?.kelas || "Kelas 3 Al Farabi",
        nisn: user?.nisnOrNip || "20230015",
      }
    );
  }, [siswaList, user]);

  // Tagihan items matching Screen 6 of UI Kit
  const tagihanItems = [
    {
      id: "tag-1",
      title: "SPP Bulan September 2026",
      subtitle: "Jatuh tempo: 10 Sep 2026",
      nominal: 250000,
      status: "Belum Lunas",
      icon: Receipt,
      iconBg: "bg-emerald-100 text-[#056839]",
    },
    {
      id: "tag-2",
      title: "Transportasi / Antar Jemput",
      subtitle: "Jatuh tempo: 10 Sep 2026",
      nominal: 75000,
      status: "Belum Lunas",
      icon: Bus,
      iconBg: "bg-sky-100 text-sky-700",
    },
    {
      id: "tag-3",
      title: "Paket Buku & Modul Tematik",
      subtitle: "Jatuh tempo: 15 Sep 2026",
      nominal: 25000,
      status: "Belum Lunas",
      icon: BookOpen,
      iconBg: "bg-purple-100 text-purple-700",
    },
  ];

  const totalTagihanNominal = tagihanItems.reduce((acc, curr) => acc + curr.nominal, 0);

  // Tabungan summary & list
  const tabunganBalance = 1250000;
  const tabunganMutasi = [
    {
      id: "mut-1",
      tanggal: "24 Sep 2026",
      keterangan: "Setoran Tabungan Mingguan",
      jenis: "masuk",
      nominal: 50000,
      saldo: 1250000,
    },
    {
      id: "mut-2",
      tanggal: "17 Sep 2026",
      keterangan: "Setoran Tabungan Rutin",
      jenis: "masuk",
      nominal: 100000,
      saldo: 1200000,
    },
    {
      id: "mut-3",
      tanggal: "10 Sep 2026",
      keterangan: "Penarikan Uang Saku Ekstrakurikuler",
      jenis: "keluar",
      nominal: 25000,
      saldo: 1100000,
    },
    {
      id: "mut-4",
      tanggal: "01 Sep 2026",
      keterangan: "Setoran Awal Bulan",
      jenis: "masuk",
      nominal: 150000,
      saldo: 1125000,
    },
  ];

  // Riwayat Pembayaran matching Screen 6
  const riwayatList = [
    {
      id: "rw-1",
      noKuitansi: "KW-202608-0142",
      judul: "SPP Bulan Agustus 2026",
      tanggal: "10 Agu 2026",
      nominal: 250000,
      metode: "Transfer Bank",
      status: "Lunas",
    },
    {
      id: "rw-2",
      noKuitansi: "KW-202608-0143",
      judul: "Transportasi Agustus 2026",
      tanggal: "10 Agu 2026",
      nominal: 75000,
      metode: "Autodebet Tabungan",
      status: "Lunas",
    },
    {
      id: "rw-3",
      noKuitansi: "KW-202607-0098",
      judul: "SPP Bulan Juli 2026",
      tanggal: "08 Jul 2026",
      nominal: 250000,
      metode: "Kasir Tunai",
      status: "Lunas",
    },
  ];

  const handleBack = () => {
    triggerHaptic();
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8faf9] dark:bg-slate-950 pb-28 text-slate-800 dark:text-slate-100">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Keuangan
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentSiswa.nama} • {currentSiswa.kelas}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-[#056839] dark:text-emerald-400 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Resmi</span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Segmented 3-Pill Tabs: Tagihan | Tabungan | Riwayat */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab("tagihan");
            }}
            className={`py-2 rounded-xl text-center transition-all ${
              activeTab === "tagihan"
                ? "bg-[#056839] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            Tagihan
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab("tabungan");
            }}
            className={`py-2 rounded-xl text-center transition-all ${
              activeTab === "tabungan"
                ? "bg-[#056839] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            Tabungan
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab("riwayat");
            }}
            className={`py-2 rounded-xl text-center transition-all ${
              activeTab === "riwayat"
                ? "bg-[#056839] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            Riwayat
          </button>
        </div>

        {/* TAB 1: TAGIHAN */}
        {activeTab === "tagihan" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Hero Card: Total Tagihan */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-emerald-200/70 dark:border-emerald-800/60 p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-emerald-200/30 dark:bg-emerald-700/10 pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Total Tagihan Bulan Ini
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold">
                    3 Item Belum Lunas
                  </span>
                </div>

                <div className="text-3xl font-extrabold text-[#056839] dark:text-emerald-300 tracking-tight">
                  {formatRupiah(totalTagihanNominal)}
                </div>

                <div className="pt-1 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Jatuh tempo: 10 September 2026
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      if (onPayNow) {
                        onPayNow();
                      } else {
                        alert("Membuka jalur pembayaran...");
                      }
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#056839] hover:bg-[#047857] text-white text-xs font-bold shadow-md shadow-emerald-900/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bayar Sekarang</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section Rincian Tagihan */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Rincian Tagihan
                </h2>
                <span className="text-[11px] text-slate-400">Semester Ganjil</span>
              </div>

              <div className="space-y-2.5">
                {tagihanItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {formatRupiah(item.nominal)}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[9px] font-bold">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <span>
                Pembayaran melalui Bank Transfer, Tunai, atau Autodebet Tabungan akan otomatis tercatat seketika tanpa perlu kirim struk fisik.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: TABUNGAN */}
        {activeTab === "tabungan" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Hero Card Tabungan */}
            <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-purple-950/30 border border-rose-200/70 dark:border-rose-900/50 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Saldo Tabungan Santri
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>

              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatRupiah(tabunganBalance)}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert("Silakan setor tabungan melalui kasir tata usaha sekolah atau transfer rekening sekolah.")}
                  className="flex-1 py-2.5 rounded-xl bg-[#056839] hover:bg-[#047857] text-white text-xs font-bold text-center active:scale-95 transition-transform"
                >
                  + Setor Tabungan
                </button>
                <button
                  type="button"
                  onClick={() => alert("Pengajuan penarikan tabungan dapat dilakukan melalui wali kelas.")}
                  className="flex-1 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold text-center active:scale-95 transition-transform"
                >
                  Tarik Tabungan
                </button>
              </div>
            </div>

            {/* Riwayat Mutasi Tabungan */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">
                Riwayat Mutasi Terakhir
              </h2>

              <div className="space-y-2">
                {tabunganMutasi.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          m.jenis === "masuk"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {m.jenis === "masuk" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.keterangan}
                        </p>
                        <p className="text-[10px] text-slate-400">{m.tanggal}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-extrabold ${
                          m.jenis === "masuk"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {m.jenis === "masuk" ? "+" : "-"}
                        {formatRupiah(m.nominal)}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Saldo: {formatRupiah(m.saldo)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RIWAYAT */}
        {activeTab === "riwayat" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Kuitansi Pembayaran Lunas
              </h2>
              <span className="text-[11px] text-slate-400">Tahun Ajaran 2025/2026</span>
            </div>

            <div className="space-y-2.5">
              {riwayatList.map((rw) => (
                <div
                  key={rw.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {rw.noKuitansi}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#056839] dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{rw.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {rw.judul}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {rw.tanggal} • {rw.metode}
                      </p>
                    </div>
                    <div className="text-sm font-extrabold text-[#056839] dark:text-emerald-400">
                      {formatRupiah(rw.nominal)}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Bukti bayar digital</span>
                    <button
                      type="button"
                      onClick={() => alert(`Kuitansi ${rw.noKuitansi} siap dicetak atau diunduh sebagai PDF.`)}
                      className="text-xs font-semibold text-[#056839] dark:text-emerald-400 flex items-center gap-1 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Kuitansi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
