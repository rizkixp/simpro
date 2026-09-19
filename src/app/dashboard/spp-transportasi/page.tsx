"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  BulanSPP,
  LIST_BULAN_SPP,
  MetodePembayaranTagihan,
  RecordSPPTransportTahunAjaran,
  TransaksiSPPTransport,
} from "@/types/school";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  Bus,
  CreditCard,
  Search,
  Plus,
  Zap,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Users,
  Wallet,
  Coins,
  Receipt,
  FileSpreadsheet,
  ShieldAlert,
  Calendar,
  Building2,
  ChevronRight,
  TrendingUp,
  Check,
  Ban,
  Settings2,
  CheckSquare,
  Square,
  BadgeCheck,
  Car,
  FileCheck,
  PiggyBank,
  QrCode,
} from "lucide-react";

export default function SPPTransportasiPage() {
  const { user } = useAuth();
  const {
    profile,
    siswaList,
    kelasList,
    tabunganList,
    pesertaTransportList,
    sppTransportRecords,
    transaksiSPPTransportList,
    updatePesertaTransport,
    bayarSPPTransport,
    bulkBayarSPPTransportDariTabungan,
    getStudentSPPTransportRecord,
  } = useSchoolData();

  // Selected Academic Year
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(
    profile.tahunAjaranAktif || "2025/2026"
  );
  const daftarTahunAjaran = ["2024/2025", "2025/2026", "2026/2027"];

  // Navigation Tabs: "kartu" | "matriks" | "transport" | "riwayat"
  const [activeTab, setActiveTab] = useState<"kartu" | "matriks" | "transport" | "riwayat">("kartu");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [filterTransportOnly, setFilterTransportOnly] = useState(false);
  const [matriksViewMode, setMatriksViewMode] = useState<"all" | "spp" | "transport">("all");

  // Expanded student in Tab 1
  const [expandedSiswaId, setExpandedSiswaId] = useState<string | null>(null);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBulkAutodebetModalOpen, setIsBulkAutodebetModalOpen] = useState(false);
  const [selectedRecordForPrint, setSelectedRecordForPrint] = useState<RecordSPPTransportTahunAjaran | null>(null);
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState<TransaksiSPPTransport | null>(null);
  const [selectedKelasForClassPrint, setSelectedKelasForClassPrint] = useState<string | null>(null);

  // Bulk Autodebet Modal State
  const [bulkAutodebetKelas, setBulkAutodebetKelas] = useState<string>(kelasList[0]?.nama || "Kelas 1");
  const [bulkAutodebetBulan, setBulkAutodebetBulan] = useState<BulanSPP>("Juli");
  const [bulkAutodebetJenis, setBulkAutodebetJenis] = useState<"SPP" | "Transportasi" | "Paket Keduanya">("SPP");
  const [bulkAutodebetFeedback, setBulkAutodebetFeedback] = useState<{
    successCount: number;
    skippedCount: number;
    insufficientCount: number;
    totalAmount: number;
    insufficientNames: string[];
  } | null>(null);
  const [autodebetAlert, setAutodebetAlert] = useState<string | null>(null);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState<{
    siswaId: string;
    jenis: "SPP" | "Transportasi" | "Paket Keduanya";
    bulanSelected: BulanSPP[];
    metodePembayaran: MetodePembayaranTagihan;
    tanggalBayar: string;
    keterangan: string;
  }>({
    siswaId: siswaList[0]?.id || "",
    jenis: "Paket Keduanya",
    bulanSelected: ["Juli"],
    metodePembayaran: "Transfer Bank",
    tanggalBayar: new Date().toISOString().split("T")[0],
    keterangan: "",
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const canManage = user?.role === "admin" || user?.role === "bendahara";

  // Filter students based on role, search, and class
  const filteredSiswa = siswaList.filter((s) => {
    // If student/parent role, only show themselves
    if (user?.role === "siswa" || user?.role === "ortu") {
      const matchMe = s.nisn === user?.nisnOrNip || s.nama.toLowerCase().includes("ahmad rizky");
      if (!matchMe) return false;
    }

    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = selectedKelas === "Semua" || s.kelas === selectedKelas;

    const transportCfg = pesertaTransportList.find((t) => t.siswaId === s.id);
    const matchTransport = !filterTransportOnly || (transportCfg && transportCfg.isAktif);

    return matchSearch && matchKelas && matchTransport;
  });

  // Calculate Overview Metrics for the Selected Academic Year
  const yearRecords = siswaList.map((s) => getStudentSPPTransportRecord(s.id, selectedTahunAjaran));

  let totalTargetSPP = 0;
  let totalTargetTransport = 0;
  let totalRealisasi = 0;
  let totalTunggakan = 0;

  yearRecords.forEach((rec) => {
    (Object.keys(rec.bulan) as BulanSPP[]).forEach((b) => {
      const item = rec.bulan[b];
      // SPP (Rp 100.000 / month)
      totalTargetSPP += item.sppNominal;
      if (item.sppStatus === "Lunas") {
        totalRealisasi += item.sppNominal;
      } else {
        totalTunggakan += item.sppNominal;
      }

      // Transport
      if (item.isTransport) {
        totalTargetTransport += item.transportNominal;
        if (item.transportStatus === "Lunas") {
          totalRealisasi += item.transportNominal;
        } else {
          totalTunggakan += item.transportNominal;
        }
      }
    });
  });

  const grandTotalTarget = totalTargetSPP + totalTargetTransport;
  const persentaseLunas =
    grandTotalTarget > 0 ? Math.round((totalRealisasi / grandTotalTarget) * 100) : 0;
  const totalPesertaTransport = pesertaTransportList.filter((t) => t.isAktif).length;

  // Personalized Student Passbook (for Siswa / Ortu)
  const currentStudent =
    siswaList.find(
      (s) => s.nisn === user?.nisnOrNip || s.nama.toLowerCase().includes("ahmad rizky")
    ) || siswaList[0];
  const currentStudentRecord = currentStudent
    ? getStudentSPPTransportRecord(currentStudent.id, selectedTahunAjaran)
    : null;

  // Open Payment Modal (with optional preferred method and month)
  const handleOpenPayment = (
    siswaId?: string,
    preferredMethod?: MetodePembayaranTagihan,
    preferredMonth?: BulanSPP
  ) => {
    const targetId = siswaId || siswaList[0]?.id || "";
    const transportCfg = pesertaTransportList.find((t) => t.siswaId === targetId);
    const isTrans = transportCfg ? transportCfg.isAktif : false;

    // Find first unpaid month for this student
    const rec = getStudentSPPTransportRecord(targetId, selectedTahunAjaran);
    const unpaidSPPMonth = LIST_BULAN_SPP.find((b) => rec.bulan[b.bulan]?.sppStatus !== "Lunas");
    const defaultMonth: BulanSPP[] = preferredMonth
      ? [preferredMonth]
      : unpaidSPPMonth
      ? [unpaidSPPMonth.bulan]
      : ["Juli"];

    // Check student savings balance
    const studentTab = tabunganList.find((t) => t.siswaId === targetId);
    const studentSaldo = studentTab ? studentTab.saldo : 0;
    const defaultMethod: MetodePembayaranTagihan =
      preferredMethod || (studentSaldo >= 100000 ? "Potong Tabungan Siswa" : "Transfer Bank");

    setPaymentForm({
      siswaId: targetId,
      jenis: isTrans ? "Paket Keduanya" : "SPP",
      bulanSelected: defaultMonth,
      metodePembayaran: defaultMethod,
      tanggalBayar: new Date().toISOString().split("T")[0],
      keterangan: "",
    });
    setPaymentError(null);
    setPaymentSuccessMsg(null);
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentForm.bulanSelected.length === 0) {
      setPaymentError("Pilih minimal 1 bulan pembayaran.");
      return;
    }

    // Validate savings balance if "Potong Tabungan Siswa"
    if (paymentForm.metodePembayaran === "Potong Tabungan Siswa") {
      const targetTrans = pesertaTransportList.find((t) => t.siswaId === paymentForm.siswaId);
      const monthlyRate =
        paymentForm.jenis === "SPP"
          ? 100000
          : paymentForm.jenis === "Transportasi"
          ? targetTrans?.biayaBulanan || 100000
          : 100000 + (targetTrans?.biayaBulanan || 100000);
      const totalBiaya = paymentForm.bulanSelected.length * monthlyRate;

      const studentTab = tabunganList.find((t) => t.siswaId === paymentForm.siswaId);
      const studentSaldo = studentTab ? studentTab.saldo : 0;

      if (studentSaldo < totalBiaya) {
        setPaymentError(
          `Saldo tabungan siswa (${formatRupiah(studentSaldo)}) tidak mencukupi untuk tagihan sebesar ${formatRupiah(
            totalBiaya
          )}! Silakan lakukan setoran tabungan terlebih dahulu atau pilih metode pembayaran lain.`
        );
        return;
      }
    }

    const res = bayarSPPTransport({
      siswaId: paymentForm.siswaId,
      tahunAjaran: selectedTahunAjaran,
      jenis: paymentForm.jenis,
      bulan: paymentForm.bulanSelected,
      metodePembayaran: paymentForm.metodePembayaran,
      tanggalBayar: paymentForm.tanggalBayar,
      petugas: user?.name || "Petugas Administrasi",
      keterangan: paymentForm.keterangan,
    });

    if (!res.success) {
      setPaymentError(res.message || "Gagal memproses pembayaran");
    } else {
      setPaymentSuccessMsg(res.message || "Pembayaran berhasil disimpan!");
      setTimeout(() => {
        setIsPaymentModalOpen(false);
      }, 900);
    }
  };

  // Handle Execute Bulk Autodebet from Tabungan
  const handleExecuteBulkAutodebet = () => {
    const res = bulkBayarSPPTransportDariTabungan({
      kelas: bulkAutodebetKelas,
      tahunAjaran: selectedTahunAjaran,
      bulan: bulkAutodebetBulan,
      jenis: bulkAutodebetJenis,
      petugas: user?.name || "Autodebet Kas Rombel",
    });

    setBulkAutodebetFeedback(res);
    if (res.successCount > 0) {
      setAutodebetAlert(
        `⚡ Berhasil memproses autodebet tabungan untuk ${res.successCount} siswa (Total: ${formatRupiah(
          res.totalAmount
        )})!`
      );
    }
  };

  // Quick Select Months for Modal
  const handleSelectAllMonths = () => {
    setPaymentForm((prev) => ({
      ...prev,
      bulanSelected: LIST_BULAN_SPP.map((b) => b.bulan),
    }));
  };

  const handleSelectSemesterGanjil = () => {
    setPaymentForm((prev) => ({
      ...prev,
      bulanSelected: LIST_BULAN_SPP.filter((b) => b.semester === "Ganjil").map((b) => b.bulan),
    }));
  };

  const handleSelectSemesterGenap = () => {
    setPaymentForm((prev) => ({
      ...prev,
      bulanSelected: LIST_BULAN_SPP.filter((b) => b.semester === "Genap").map((b) => b.bulan),
    }));
  };

  const toggleMonthSelection = (b: BulanSPP) => {
    setPaymentForm((prev) => {
      const exists = prev.bulanSelected.includes(b);
      return {
        ...prev,
        bulanSelected: exists
          ? prev.bulanSelected.filter((item) => item !== b)
          : [...prev.bulanSelected, b],
      };
    });
  };

  // Filtered transactions for Tab 4
  const filteredTransaksi = transaksiSPPTransportList.filter((t) => {
    const matchYear = t.tahunAjaran === selectedTahunAjaran;
    const matchSearch =
      t.siswaNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nisn.includes(searchTerm) ||
      t.noKuitansi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchYear && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 text-[11px] font-extrabold tracking-wide uppercase">
              Modul Keuangan Khusus
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              <span>SPP Rp 100.000 / Bulan Tetap</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 flex items-center gap-2.5">
            <Bus className="h-7 w-7 text-indigo-600" />
            <span>Tagihan SPP & Transportasi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Sistem administrasi terpadu iuran bulanan SPP wajib sekolah dan biaya langganan antar-jemput
            transportasi peserta didik disajikan per tahun ajaran.
          </p>
        </div>

        {/* Action Controls & Tahun Ajaran Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector Tahun Ajaran */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Tahun Ajaran:</span>
            <select
              value={selectedTahunAjaran}
              onChange={(e) => setSelectedTahunAjaran(e.target.value)}
              className="text-xs font-bold bg-transparent text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer"
            >
              {daftarTahunAjaran.map((th) => (
                <option key={th} value={th} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {th} {th === profile.tahunAjaranAktif ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <>
              <button
                onClick={() => setSelectedKelasForClassPrint(selectedKelas === "Semua" ? kelasList[0]?.nama || "Kelas 1" : selectedKelas)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Rekap Rombel</span>
              </button>

              <button
                onClick={() => {
                  setBulkAutodebetFeedback(null);
                  setIsBulkAutodebetModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5"
              >
                <PiggyBank className="h-4 w-4 text-white" />
                <span>⚡ Autodebet 1 Rombel</span>
              </button>

              <button
                onClick={() => handleOpenPayment()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                <span>⚡ Bayar Cepat SPP & Transport</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Autodebet Feedback Alert */}
      {autodebetAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between no-print animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{autodebetAlert}</span>
          </div>
          <button
            onClick={() => setAutodebetAlert(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards (Tahun Ajaran Terpilih) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Card 1: Target SPP 1 Tahun */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Target SPP {selectedTahunAjaran}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalTargetSPP)}
            </p>
            <p className="text-[11px] text-indigo-600 mt-1 font-medium flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <span>{siswaList.length} Siswa &bull; Rp 100k &times; 12 Bln</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Target Transportasi */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Target Transportasi {selectedTahunAjaran}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalTargetTransport)}
            </p>
            <p className="text-[11px] text-blue-600 mt-1 font-medium flex items-center gap-1">
              <Bus className="h-3 w-3" />
              <span>{totalPesertaTransport} dari {siswaList.length} Siswa Langganan</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Car className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Realisasi Penerimaan Kas */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Realisasi Terkumpul</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(totalRealisasi)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${persentaseLunas}%` }} />
              </div>
              <span className="text-[11px] font-bold text-emerald-600">{persentaseLunas}% Lunas</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Sisa Tunggakan Belum Bayar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Sisa Tunggakan Tahun Ini</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatRupiah(totalTunggakan)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Dari total target {formatRupiah(grandTotalTarget)}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Personalized Student Passbook (for Siswa / Ortu) */}
      {(user?.role === "siswa" || user?.role === "ortu") && currentStudentRecord && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 mb-3 border border-white/10">
                <FileCheck className="h-3.5 w-3.5 text-amber-300" />
                <span>Kartu Administrasi SPP & Transportasi &bull; TA {selectedTahunAjaran}</span>
              </div>
              <h2 className="text-2xl font-bold">{currentStudent.nama}</h2>
              <p className="text-xs text-indigo-200/80 mt-1">
                NISN: {currentStudent.nisn} &bull; Rombel: {currentStudent.kelas} &bull;{" "}
                {pesertaTransportList.find((t) => t.siswaId === currentStudent.id)?.isAktif ? (
                  <span className="text-amber-300 font-semibold">🚌 Berlangganan Antar-Jemput</span>
                ) : (
                  <span className="text-slate-300">Bukan Peserta Transport</span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-right">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-left">
                <span className="text-[11px] text-indigo-200 block">Status Pelunasan SPP:</span>
                <span className="text-xl font-bold text-amber-300">
                  {Object.values(currentStudentRecord.bulan).filter((b) => b.sppStatus === "Lunas").length} / 12 Bulan Lunas
                </span>
              </div>
              <button
                onClick={() => setSelectedRecordForPrint(currentStudentRecord)}
                className="px-4 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4 text-indigo-600" />
                <span>Cetak Kartu SPP Saya</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("kartu")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "kartu"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Kartu Pembayaran Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab("matriks")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "matriks"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Matriks Grid 12 Bulan</span>
          </button>

          {canManage && (
            <button
              onClick={() => setActiveTab("transport")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === "transport"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Bus className="h-3.5 w-3.5" />
              <span>Kelola Peserta Transport</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                {totalPesertaTransport} Siswa
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("riwayat")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "riwayat"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Riwayat Transaksi</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
              {filteredTransaksi.length}
            </span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa, NISN..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Semua">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.nama}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KARTU PEMBAYARAN SISWA                                             */}
      {/* ========================================================================= */}
      {activeTab === "kartu" && (
        <div className="space-y-4">
          {/* Sub Filters: Pill Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                <span>Kelas:</span>
              </span>
              <button
                onClick={() => setSelectedKelas("Semua")}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedKelas === "Semua"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
              >
                Semua
              </button>
              {kelasList.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedKelas(k.nama)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    selectedKelas === k.nama
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {k.nama}
                </button>
              ))}
            </div>

            {/* Checkbox Filter Transport Only */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterTransportOnly}
                onChange={(e) => setFilterTransportOnly(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Hanya Siswa Peserta Transportasi</span>
            </label>
          </div>

          {/* Student Cards List */}
          <div className="space-y-3">
            {filteredSiswa.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p>Tidak ada data siswa yang cocok dengan kriteria pencarian.</p>
              </div>
            ) : (
              filteredSiswa.map((siswa) => {
                const rec = getStudentSPPTransportRecord(siswa.id, selectedTahunAjaran);
                const transportCfg = pesertaTransportList.find((t) => t.siswaId === siswa.id);
                const isTransportActive = transportCfg ? transportCfg.isAktif : false;
                const ruteName = transportCfg?.rute || "Rute Jemputan Reguler";

                // Tabungan balance for this student
                const studentTab = tabunganList.find((t) => t.siswaId === siswa.id);
                const studentSaldo = studentTab ? studentTab.saldo : 0;

                // Count paid months
                const sppPaidCount = Object.values(rec.bulan).filter((b) => b.sppStatus === "Lunas").length;
                const transportPaidCount = isTransportActive
                  ? Object.values(rec.bulan).filter((b) => b.transportStatus === "Lunas").length
                  : 0;

                // Sum totals for this student in this academic year
                const totalTargetStudent =
                  12 * 100000 + (isTransportActive ? 12 * (transportCfg?.biayaBulanan || 100000) : 0);
                const totalTerbayarStudent =
                  sppPaidCount * 100000 +
                  (isTransportActive ? transportPaidCount * (transportCfg?.biayaBulanan || 100000) : 0);
                const totalTunggakanStudent = totalTargetStudent - totalTerbayarStudent;

                const isExpanded = expandedSiswaId === siswa.id;

                return (
                  <div
                    key={siswa.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Student info */}
                      <div className="flex items-center gap-3.5">
                        <img
                          src={siswa.avatar}
                          alt={siswa.nama}
                          className="h-12 w-12 rounded-2xl bg-slate-100 object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                              {siswa.nama}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {siswa.kelas}
                            </span>
                            {isTransportActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                                <Bus className="h-3 w-3" />
                                <span>Peserta Transport ({formatRupiah(transportCfg?.biayaBulanan || 100000)}/bln)</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800">
                                Non-Transport
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            NISN: <span className="font-mono">{siswa.nisn}</span> &bull; TA:{" "}
                            <strong className="text-slate-700 dark:text-slate-300">{selectedTahunAjaran}</strong>
                            {isTransportActive && ` &bull; ${ruteName}`}
                          </p>
                          {/* Saldo Tabungan Siswa Badge */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                studentSaldo >= 100000
                                  ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <PiggyBank className="h-3 w-3 text-teal-600 shrink-0" />
                              <span>Saldo Tabungan: {formatRupiah(studentSaldo)}</span>
                            </span>
                            {studentSaldo >= 100000 && totalTunggakanStudent > 0 && (
                              <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Bisa autodebet tabungan</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: SPP & Transport Progress Indicators */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">SPP (Rp 100k)</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                            {sppPaidCount} / 12 Bulan
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            {Math.round((sppPaidCount / 12) * 100)}% Lunas
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Transport</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                            {isTransportActive ? `${transportPaidCount} / 12 Bulan` : "Tidak Ikut"}
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold">
                            {isTransportActive ? `${Math.round((transportPaidCount / 12) * 100)}% Lunas` : "Rp 0"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Terbayar</span>
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {formatRupiah(totalTerbayarStudent)}
                          </span>
                          <span className="text-[10px] text-slate-400">Telah Disetor</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Sisa Tagihan</span>
                          <span className="font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                            {formatRupiah(totalTunggakanStudent)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {totalTunggakanStudent === 0 ? "Lunas Penuh" : "Menunggak"}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center flex-wrap">
                        <button
                          onClick={() => setExpandedSiswaId(isExpanded ? null : siswa.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <span>{isExpanded ? "Tutup" : "12 Bulan"}</span>
                        </button>

                        <button
                          onClick={() => setSelectedRecordForPrint(rec)}
                          title="Cetak Kartu SPP & Transport 1 Tahun Ajaran"
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-500" />
                          <span>Kartu SPP</span>
                        </button>

                        {canManage && (
                          <>
                            {totalTunggakanStudent > 0 && studentSaldo >= 100000 && (
                              <button
                                onClick={() => handleOpenPayment(siswa.id, "Potong Tabungan Siswa")}
                                title={`Potong langsung dari saldo tabungan ${siswa.nama} (Saldo: ${formatRupiah(studentSaldo)})`}
                                className="px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <PiggyBank className="h-3.5 w-3.5 text-teal-600" />
                                <span>Potong Tabungan</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenPayment(siswa.id)}
                              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Bayar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expandable 12-Month Matrix View */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Rincian Status 12 Bulan Pembayaran ({selectedTahunAjaran}):</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {LIST_BULAN_SPP.map((item) => {
                            const detail = rec.bulan[item.bulan];
                            const isSPPLunas = detail.sppStatus === "Lunas";
                            const isTransLunas = detail.transportStatus === "Lunas";

                            return (
                              <div
                                key={item.bulan}
                                className={`p-2.5 rounded-2xl border text-xs transition-all ${
                                  isSPPLunas && (!isTransportActive || isTransLunas)
                                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-1">
                                  <span>{item.bulan}</span>
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    Sem. {item.semester}
                                  </span>
                                </div>

                                {/* SPP status */}
                                <div className="flex items-center justify-between text-[11px] mt-1">
                                  <span className="text-slate-500">SPP (100k):</span>
                                  {isSPPLunas ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                      <Check className="h-3 w-3" /> Lunas
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 font-semibold text-[10px]">Belum</span>
                                  )}
                                </div>

                                {/* Transport status */}
                                <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                                  <span className="text-slate-500">Transport:</span>
                                  {!isTransportActive ? (
                                    <span className="text-slate-400 text-[10px]">Bukan Peserta</span>
                                  ) : isTransLunas ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                      <Check className="h-3 w-3" /> Lunas
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 font-semibold text-[10px]">Belum</span>
                                  )}
                                </div>

                                {isSPPLunas && detail.sppTanggalBayar && (
                                  <p className="text-[9px] text-slate-400 mt-1.5 font-mono truncate">
                                    Tgl: {formatDateIndo(detail.sppTanggalBayar)}
                                  </p>
                                )}

                                {(!isSPPLunas || (isTransportActive && !isTransLunas)) && canManage && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenPayment(
                                        siswa.id,
                                        studentSaldo >= 100000 ? "Potong Tabungan Siswa" : "Transfer Bank",
                                        item.bulan
                                      )
                                    }
                                    className="w-full mt-2 py-1 px-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                                  >
                                    {studentSaldo >= 100000 ? (
                                      <>
                                        <PiggyBank className="h-3 w-3 text-teal-600" />
                                        <span>Potong Tabungan</span>
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="h-3 w-3" />
                                        <span>Bayar Bulan Ini</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATRIKS GRID 12 BULAN ROMBEL (BUKU KAS BULANAN)                     */}
      {/* ========================================================================= */}
      {activeTab === "matriks" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
          {/* Header Controls for Matrix */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Matriks Grid 12 Bulan Pembayaran &bull; Tahun Ajaran {selectedTahunAjaran}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Memantau status kelulusan pembayaran bulanan seluruh siswa dalam bentuk buku kas rombel.
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setMatriksViewMode("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  matriksViewMode === "all" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Semua Komponen
              </button>
              <button
                onClick={() => setMatriksViewMode("spp")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  matriksViewMode === "spp" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
              >
                SPP Saja (Rp 100k)
              </button>
              <button
                onClick={() => setMatriksViewMode("transport")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  matriksViewMode === "transport" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Transportasi Saja
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="px-3 py-3 w-10 text-center sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">No</th>
                  <th className="px-4 py-3 min-w-[160px] sticky left-10 bg-slate-50 dark:bg-slate-800 z-10">Nama Siswa</th>
                  <th className="px-3 py-3 text-center">Kelas</th>
                  <th className="px-3 py-3 text-center">Transport</th>
                  {LIST_BULAN_SPP.map((b) => (
                    <th key={b.bulan} className="px-2 py-3 text-center min-w-[70px]">
                      {b.bulan.slice(0, 3)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right">Lunas</th>
                  <th className="px-3 py-3 text-right">Tunggakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSiswa.map((siswa, idx) => {
                  const rec = getStudentSPPTransportRecord(siswa.id, selectedTahunAjaran);
                  const transportCfg = pesertaTransportList.find((t) => t.siswaId === siswa.id);
                  const isTrans = transportCfg ? transportCfg.isAktif : false;

                  const sppPaidCount = Object.values(rec.bulan).filter((b) => b.sppStatus === "Lunas").length;
                  const transPaidCount = isTrans
                    ? Object.values(rec.bulan).filter((b) => b.transportStatus === "Lunas").length
                    : 0;

                  const studentTotalTarget =
                    12 * 100000 + (isTrans ? 12 * (transportCfg?.biayaBulanan || 100000) : 0);
                  const studentTotalTerbayar =
                    sppPaidCount * 100000 + (isTrans ? transPaidCount * (transportCfg?.biayaBulanan || 100000) : 0);
                  const studentTunggakan = studentTotalTarget - studentTotalTerbayar;

                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5 text-center text-slate-400 sticky left-0 bg-white dark:bg-slate-900">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white sticky left-10 bg-white dark:bg-slate-900 truncate max-w-[180px]">
                        {siswa.nama}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-[11px]">
                        {siswa.kelas}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isTrans ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* 12 Months Grid Columns */}
                      {LIST_BULAN_SPP.map((b) => {
                        const detail = rec.bulan[b.bulan];
                        const sppLunas = detail.sppStatus === "Lunas";
                        const transLunas = detail.transportStatus === "Lunas";

                        if (matriksViewMode === "spp") {
                          return (
                            <td key={b.bulan} className="px-2 py-2 text-center">
                              {sppLunas ? (
                                <span className="inline-block p-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                                  ✓ 100k
                                </span>
                              ) : (
                                <span className="inline-block p-1 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 text-[10px] font-semibold">
                                  Belum
                                </span>
                              )}
                            </td>
                          );
                        }

                        if (matriksViewMode === "transport") {
                          return (
                            <td key={b.bulan} className="px-2 py-2 text-center">
                              {!isTrans ? (
                                <span className="text-slate-300 dark:text-slate-600 text-[10px]">-</span>
                              ) : transLunas ? (
                                <span className="inline-block p-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                                  ✓ Lunas
                                </span>
                              ) : (
                                <span className="inline-block p-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold">
                                  Belum
                                </span>
                              )}
                            </td>
                          );
                        }

                        // Combined Mode
                        const fullyPaid = sppLunas && (!isTrans || transLunas);
                        return (
                          <td key={b.bulan} className="px-2 py-2 text-center">
                            {fullyPaid ? (
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                                ✓ Lunas
                              </span>
                            ) : sppLunas ? (
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold">
                                SPP Saja
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-rose-600 text-[10px] font-medium">
                                Belum
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Lunas & Tunggakan */}
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 text-xs">
                        {formatRupiah(studentTotalTerbayar)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-600 text-xs">
                        {studentTunggakan > 0 ? formatRupiah(studentTunggakan) : <span className="text-emerald-600 font-normal">Lunas</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KELOLA PESERTA TRANSPORTASI                                        */}
      {/* ========================================================================= */}
      {activeTab === "transport" && canManage && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Pengaturan Pendaftaran Fasilitas Transportasi (Antar-Jemput)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hanya siswa yang berstatus <strong>Aktif Berlangganan</strong> yang dikenakan tagihan transportasi.
                  Siswa lainnya bebas tagihan transportasi (Rp 0).
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-500 block">Total Peserta Aktif:</span>
              <strong className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                {totalPesertaTransport} dari {siswaList.length} Siswa
              </strong>
            </div>
          </div>

          {/* Table of Transport Subscription */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Nama Siswa</th>
                    <th className="px-4 py-3.5">Kelas</th>
                    <th className="px-4 py-3.5">Status Langganan</th>
                    <th className="px-5 py-3.5">Rute Antar-Jemput</th>
                    <th className="px-5 py-3.5 text-right">Tarif Bulanan (Rp)</th>
                    <th className="px-4 py-3.5 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSiswa.map((siswa, idx) => {
                    const transportCfg = pesertaTransportList.find((t) => t.siswaId === siswa.id);
                    const isAktif = transportCfg ? transportCfg.isAktif : false;
                    const rute = transportCfg?.rute || "Rute 1 - Kebayoran & Fatmawati";
                    const biaya = transportCfg?.biayaBulanan || 100000;

                    return (
                      <tr key={siswa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                          {siswa.nama}
                          <span className="block text-[10px] text-slate-400 font-mono">{siswa.nisn}</span>
                        </td>
                        <td className="px-4 py-3">{siswa.kelas}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => updatePesertaTransport(siswa.id, !isAktif, biaya, rute)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isAktif
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {isAktif ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Ban className="h-3.5 w-3.5" />}
                            <span>{isAktif ? "Aktif Berlangganan" : "Tidak Berlangganan"}</span>
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          {isAktif ? (
                            <input
                              type="text"
                              value={rute}
                              onChange={(e) => updatePesertaTransport(siswa.id, true, biaya, e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 w-56"
                            />
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Bukan peserta transport</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold">
                          {isAktif ? (
                            <input
                              type="number"
                              min="0"
                              step="10000"
                              value={biaya}
                              onChange={(e) => updatePesertaTransport(siswa.id, true, Number(e.target.value), rute)}
                              className="w-28 px-2 py-1 text-right text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-slate-400">Rp 0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => updatePesertaTransport(siswa.id, !isAktif, biaya, rute)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                          >
                            {isAktif ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RIWAYAT TRANSAKSI & MUTASI KAS                                     */}
      {/* ========================================================================= */}
      {activeTab === "riwayat" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">No. Kuitansi</th>
                  <th className="px-4 py-3.5">Nama Siswa</th>
                  <th className="px-4 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Komponen</th>
                  <th className="px-4 py-3.5">Bulan Dibayar</th>
                  <th className="px-4 py-3.5 text-right font-bold">Total Disetor</th>
                  <th className="px-4 py-3.5">Metode Bayar</th>
                  <th className="px-4 py-3.5">Petugas</th>
                  <th className="px-4 py-3.5 text-center">Kuitansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransaksi.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-10 text-center text-slate-400">
                      Belum ada transaksi pembayaran SPP / Transportasi untuk tahun ajaran {selectedTahunAjaran}.
                    </td>
                  </tr>
                ) : (
                  filteredTransaksi.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        {formatDateIndo(trx.tanggalBayar)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                        {trx.noKuitansi}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {trx.siswaNama}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">{trx.kelas}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trx.jenis === "Paket Keduanya"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : trx.jenis === "Transportasi"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {trx.jenis}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        {trx.bulan.join(", ")}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(trx.totalNominal)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {trx.metodePembayaran}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">{trx.petugas}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedTrxForReceipt(trx)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-indigo-600 font-semibold text-xs flex items-center justify-center gap-1 mx-auto"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PEMBAYARAN SPP & TRANSPORTASI                                    */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-8">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                Tahun Ajaran: {selectedTahunAjaran}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Formulir Pembayaran SPP & Transportasi
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              SPP bulanan ditetapkan sebesar <strong>Rp 100.000 / bulan</strong>. Transportasi hanya ditagihkan
              apabila siswa terdaftar aktif langganan antar-jemput.
            </p>

            {paymentError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {paymentSuccessMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
              {/* Target Siswa */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Siswa Target *
                </label>
                <select
                  required
                  value={paymentForm.siswaId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const transCfg = pesertaTransportList.find((t) => t.siswaId === sId);
                    setPaymentForm({
                      ...paymentForm,
                      siswaId: sId,
                      jenis: transCfg?.isAktif ? paymentForm.jenis : "SPP",
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {siswaList.map((s) => {
                    const isTrans = pesertaTransportList.find((t) => t.siswaId === s.id)?.isAktif;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas} - {s.nisn}) {isTrans ? "🚌 [Peserta Transport]" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Komponen yang Dibayar */}
              {(() => {
                const targetTrans = pesertaTransportList.find((t) => t.siswaId === paymentForm.siswaId);
                const isTargetTransActive = targetTrans ? targetTrans.isAktif : false;

                return (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pilih Komponen Pembayaran *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, jenis: "SPP" })}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          paymentForm.jenis === "SPP"
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <CreditCard className="h-4 w-4 mx-auto mb-1 text-indigo-600" />
                        <span className="block font-bold">SPP Saja</span>
                        <span className="text-[10px] text-slate-400">Rp 100.000 / bln</span>
                      </button>

                      <button
                        type="button"
                        disabled={!isTargetTransActive}
                        onClick={() => setPaymentForm({ ...paymentForm, jenis: "Transportasi" })}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          !isTargetTransActive
                            ? "opacity-40 cursor-not-allowed border-slate-200"
                            : paymentForm.jenis === "Transportasi"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-sm"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <Bus className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <span className="block font-bold">Transportasi Saja</span>
                        <span className="text-[10px] text-slate-400">
                          {isTargetTransActive ? `${formatRupiah(targetTrans?.biayaBulanan || 100000)}/bln` : "Bukan Peserta"}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={!isTargetTransActive}
                        onClick={() => setPaymentForm({ ...paymentForm, jenis: "Paket Keduanya" })}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          !isTargetTransActive
                            ? "opacity-40 cursor-not-allowed border-slate-200"
                            : paymentForm.jenis === "Paket Keduanya"
                            ? "border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold shadow-sm"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <Zap className="h-4 w-4 mx-auto mb-1 text-amber-500 fill-amber-500" />
                        <span className="block font-bold">Paket Keduanya</span>
                        <span className="text-[10px] text-slate-400">
                          {isTargetTransActive
                            ? `${formatRupiah(100000 + (targetTrans?.biayaBulanan || 100000))}/bln`
                            : "Bukan Peserta"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Month Selector Tool */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Bulan Pembayaran ({paymentForm.bulanSelected.length} Bulan Dipilih) *
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllMonths}
                      className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold"
                    >
                      ⚡ Lunas 1 Tahun (12 Bln)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectSemesterGanjil}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      Sem. Ganjil (6 Bln)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectSemesterGenap}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      Sem. Genap (6 Bln)
                    </button>
                  </div>
                </div>

                {/* 12 Months Pill Grid */}
                {(() => {
                  const targetRec = getStudentSPPTransportRecord(paymentForm.siswaId, selectedTahunAjaran);
                  const transCfg = pesertaTransportList.find((t) => t.siswaId === paymentForm.siswaId);
                  const isTrans = transCfg ? transCfg.isAktif : false;

                  return (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {LIST_BULAN_SPP.map((item) => {
                        const isSelected = paymentForm.bulanSelected.includes(item.bulan);
                        const detail = targetRec.bulan[item.bulan];
                        const isAlreadyPaid =
                          paymentForm.jenis === "SPP"
                            ? detail.sppStatus === "Lunas"
                            : paymentForm.jenis === "Transportasi"
                            ? detail.transportStatus === "Lunas"
                            : detail.sppStatus === "Lunas" && (!isTrans || detail.transportStatus === "Lunas");

                        return (
                          <button
                            type="button"
                            key={item.bulan}
                            onClick={() => toggleMonthSelection(item.bulan)}
                            className={`p-2.5 rounded-2xl border text-center transition-all relative ${
                              isAlreadyPaid
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-default"
                                : isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="block font-bold text-xs">{item.bulan}</span>
                            <span className="text-[10px] opacity-80 block">
                              {isAlreadyPaid ? "✓ Lunas" : isSelected ? "Dipilih" : "Belum Bayar"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Total Calculation Banner & Tanggal Transaksi & Metode Pembayaran */}
              {(() => {
                const targetTrans = pesertaTransportList.find((t) => t.siswaId === paymentForm.siswaId);
                const isTargetTransActive = targetTrans ? targetTrans.isAktif : false;
                const monthlyRate =
                  paymentForm.jenis === "SPP"
                    ? 100000
                    : paymentForm.jenis === "Transportasi"
                    ? targetTrans?.biayaBulanan || 100000
                    : 100000 + (targetTrans?.biayaBulanan || 100000);
                const totalBiaya = paymentForm.bulanSelected.length * monthlyRate;

                const studentTab = tabunganList.find((t) => t.siswaId === paymentForm.siswaId);
                const tabSaldo = studentTab ? studentTab.saldo : 0;
                const isSavingsSufficient = tabSaldo >= totalBiaya;
                const sisaSaldo = tabSaldo - totalBiaya;

                return (
                  <div className="space-y-4">
                    {/* Calculation Summary */}
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-indigo-700 dark:text-indigo-300 block">
                          Total Nominal yang Harus Disetor:
                        </span>
                        <span className="text-2xl font-extrabold font-mono text-indigo-900 dark:text-indigo-100">
                          {formatRupiah(totalBiaya)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 text-right">
                        {paymentForm.bulanSelected.length} Bulan &bull; {paymentForm.jenis}
                      </span>
                    </div>

                    {/* Tanggal Transaksi */}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Tanggal Transaksi *</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentForm.tanggalBayar}
                        onChange={(e) => setPaymentForm({ ...paymentForm, tanggalBayar: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    {/* Metode Pembayaran Options */}
                    <div className="space-y-2.5">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Pilih Metode Pembayaran *
                      </label>

                      {/* Prominent Potong Saldo Tabungan Card */}
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentForm({ ...paymentForm, metodePembayaran: "Potong Tabungan Siswa" })
                        }
                        className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                          paymentForm.metodePembayaran === "Potong Tabungan Siswa"
                            ? "border-teal-500 bg-teal-50/80 dark:bg-teal-950/50 ring-2 ring-teal-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <PiggyBank className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                Potong Saldo Tabungan Siswa
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 text-[10px] font-bold">
                                ⚡ Autodebet Instan
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Saldo Tabungan Tersedia:{" "}
                              <strong className="font-mono text-teal-700 dark:text-teal-400">
                                {formatRupiah(tabSaldo)}
                              </strong>
                            </p>

                            {isSavingsSufficient ? (
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  Saldo mencukupi! Sisa saldo setelah bayar:{" "}
                                  <strong>{formatRupiah(sisaSaldo)}</strong>
                                </span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  Saldo tabungan kurang Rp {(totalBiaya - tabSaldo).toLocaleString("id-ID")}.
                                  Perlu setoran tabungan.
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-1">
                          <input
                            type="radio"
                            name="metode_pembayaran_spp_radio"
                            checked={paymentForm.metodePembayaran === "Potong Tabungan Siswa"}
                            onChange={() =>
                              setPaymentForm({
                                ...paymentForm,
                                metodePembayaran: "Potong Tabungan Siswa",
                              })
                            }
                            className="h-4 w-4 text-teal-600"
                          />
                        </div>
                      </button>

                      {/* Other Standard Channels */}
                      <p className="text-[11px] font-semibold text-slate-400 pt-1">
                        Atau Gunakan Kanal Pembayaran Lain:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: "Transfer Bank", label: "Transfer Bank", icon: Building2, desc: "BCA / Mandiri / BNI" },
                          { id: "QRIS", label: "QRIS", icon: QrCode, desc: "GoPay / OVO / Dana" },
                          { id: "Tunai", label: "Tunai", icon: Wallet, desc: "Loket Tata Usaha" },
                        ].map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() =>
                              setPaymentForm({
                                ...paymentForm,
                                metodePembayaran: m.id as MetodePembayaranTagihan,
                              })
                            }
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                              paymentForm.metodePembayaran === m.id
                                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20"
                                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <m.icon className="h-4 w-4 text-indigo-600 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold">{m.label}</p>
                                <p className="text-[10px] text-slate-400">{m.desc}</p>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="metode_pembayaran_spp_radio"
                              checked={paymentForm.metodePembayaran === m.id}
                              onChange={() =>
                                setPaymentForm({
                                  ...paymentForm,
                                  metodePembayaran: m.id as MetodePembayaranTagihan,
                                })
                              }
                              className="h-3.5 w-3.5 text-indigo-600"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Proses Pembayaran Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CETAK KARTU SPP & TRANSPORTASI 1 TAHUN AJARAN                    */}
      {/* ========================================================================= */}
      {selectedRecordForPrint && (() => {
        const studentObj = siswaList.find((s) => s.id === selectedRecordForPrint.siswaId);
        const transportCfg = pesertaTransportList.find((t) => t.siswaId === selectedRecordForPrint.siswaId);
        const isTrans = transportCfg ? transportCfg.isAktif : false;
        const ruteName = transportCfg?.rute || "Rute Jemputan Reguler";

        const sppPaid = Object.values(selectedRecordForPrint.bulan).filter((b) => b.sppStatus === "Lunas").length;
        const transPaid = isTrans
          ? Object.values(selectedRecordForPrint.bulan).filter((b) => b.transportStatus === "Lunas").length
          : 0;

        const totalTagihan = 12 * 100000 + (isTrans ? 12 * (transportCfg?.biayaBulanan || 100000) : 0);
        const totalTerbayar = sppPaid * 100000 + (isTrans ? transPaid * (transportCfg?.biayaBulanan || 100000) : 0);
        const totalSisa = totalTagihan - totalTerbayar;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8">
              <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
                <span className="text-xs font-semibold text-slate-500">
                  Pratinjau Kartu SPP & Transportasi Resmi 1 Tahun Ajaran
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Cetak Kartu SPP</span>
                  </button>
                  <button
                    onClick={() => setSelectedRecordForPrint(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex items-center justify-center gap-2.5 mb-1.5">
                  <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                    <Bus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base uppercase leading-tight text-slate-900">
                      {profile.namaSekolah}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      NPSN: {profile.npsn} &bull; Akreditasi: {profile.akreditasi}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
                  {profile.alamat} &bull; Telp: {profile.telepon} &bull; Website: {profile.website}
                </p>
              </div>

              {/* Title */}
              <div className="text-center mb-5">
                <h4 className="text-sm font-extrabold underline uppercase tracking-wider text-slate-900">
                  KARTU BUKTI PEMBAYARAN SPP & TRANSPORTASI SISWA
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Tahun Ajaran: <strong>{selectedRecordForPrint.tahunAjaran}</strong>
                </p>
              </div>

              {/* Bio Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-5">
                <div>
                  <span className="text-slate-500 block">Nama Peserta Didik:</span>
                  <strong className="text-slate-900 font-bold">{selectedRecordForPrint.siswaNama}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">NISN / Kelas:</span>
                  <strong className="text-slate-900 font-mono">{selectedRecordForPrint.nisn} ({selectedRecordForPrint.kelas})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Transportasi:</span>
                  <strong className={isTrans ? "text-blue-700 font-bold" : "text-slate-600"}>
                    {isTrans ? `Berlangganan (${ruteName})` : "Bukan Peserta"}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Tarif SPP Bulanan:</span>
                  <strong className="text-emerald-700 font-mono">Rp 100.000 / Bulan</strong>
                </div>
              </div>

              {/* Table 12 Months */}
              <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-5">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-8">No</th>
                    <th className="border border-slate-300 px-3 py-2 w-28">Bulan (TA)</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-24">SPP (Rp)</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">Status SPP</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-24">Transport (Rp)</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28">Status Transport</th>
                    <th className="border border-slate-300 px-3 py-2 w-24">Tgl Bayar</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-20">Paraf Kasir</th>
                  </tr>
                </thead>
                <tbody>
                  {LIST_BULAN_SPP.map((b, idx) => {
                    const detail = selectedRecordForPrint.bulan[b.bulan];
                    const isSPPLunas = detail.sppStatus === "Lunas";
                    const isTransLunas = detail.transportStatus === "Lunas";

                    return (
                      <tr key={b.bulan}>
                        <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-900">
                          {b.bulan} <span className="text-[10px] text-slate-400 font-normal">({b.semester})</span>
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">100.000</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center">
                          {isSPPLunas ? (
                            <span className="font-bold text-emerald-700">Lunas</span>
                          ) : (
                            <span className="text-slate-400">Belum</span>
                          )}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">
                          {isTrans ? (transportCfg?.biayaBulanan || 100000).toLocaleString("id-ID") : "0"}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center">
                          {!isTrans ? (
                            <span className="text-slate-400 text-[10px]">-</span>
                          ) : isTransLunas ? (
                            <span className="font-bold text-blue-700">Lunas</span>
                          ) : (
                            <span className="text-slate-400">Belum</span>
                          )}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 font-mono text-[10px] text-slate-600">
                          {detail.sppTanggalBayar ? formatDateIndo(detail.sppTanggalBayar) : "-"}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center text-[10px] text-slate-400">
                          {isSPPLunas ? "TTD" : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right">
                      Total Setoran 1 Tahun:
                    </td>
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 font-mono text-emerald-800">
                      Terbayar: {formatRupiah(totalTerbayar)}
                    </td>
                    <td colSpan={4} className="border border-slate-300 px-3 py-2 text-right font-mono">
                      Sisa Tunggakan:{" "}
                      <strong className={totalSisa > 0 ? "text-amber-700" : "text-emerald-700"}>
                        {totalSisa > 0 ? formatRupiah(totalSisa) : "LUNAS SEPENUHNYA"}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <p className="text-slate-500">Mengetahui, Orang Tua / Wali,</p>
                  <div className="h-14" />
                  <p className="font-bold underline">{studentObj?.namaWali || "Orang Tua Siswa"}</p>
                </div>
                <div>
                  <p className="text-slate-500">
                    Jakarta, {formatDateIndo(new Date().toISOString().split("T")[0])}
                  </p>
                  <p className="text-slate-500">Bendahara / Bagian Keuangan,</p>
                  <div className="h-14" />
                  <p className="font-bold underline">{user?.name || "Petugas Bendahara"}</p>
                  <p className="text-[10px] text-slate-400">NIP: 198506122010012015</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 3: CETAK STRUK / KUITANSI PEMBAYARAN                                */}
      {/* ========================================================================= */}
      {selectedTrxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b pb-3 mb-4 no-print">
              <span className="text-xs font-semibold text-slate-500">Bukti Kuitansi Pembayaran</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setSelectedTrxForReceipt(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Letterhead Minimal */}
            <div className="text-center border-b pb-3 mb-4">
              <h4 className="font-extrabold text-sm uppercase text-slate-900">{profile.namaSekolah}</h4>
              <p className="text-[10px] text-slate-500">{profile.alamat} &bull; Telp: {profile.telepon}</p>
              <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-700 underline mt-2">
                KUITANSI BUKTI PEMBAYARAN RESMI
              </h5>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">No: {selectedTrxForReceipt.noKuitansi}</p>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Telah Terima Dari:</span>
                <strong className="text-slate-900">{selectedTrxForReceipt.siswaNama}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">NISN / Kelas:</span>
                <span className="font-mono">{selectedTrxForReceipt.nisn} ({selectedTrxForReceipt.kelas})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tahun Ajaran:</span>
                <strong>{selectedTrxForReceipt.tahunAjaran}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Komponen Pembayaran:</span>
                <span className="font-semibold text-indigo-600">{selectedTrxForReceipt.jenis}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Untuk Bulan:</span>
                <span className="font-bold text-slate-900">{selectedTrxForReceipt.bulan.join(", ")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Metode Pembayaran:</span>
                <span>{selectedTrxForReceipt.metodePembayaran}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tanggal Transaksi:</span>
                <span>{formatDateIndo(selectedTrxForReceipt.tanggalBayar)}</span>
              </div>
            </div>

            {/* Nominal Box */}
            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-center mb-5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Jumlah Pembayaran</span>
              <strong className="text-xl font-extrabold font-mono text-emerald-700">
                {formatRupiah(selectedTrxForReceipt.totalNominal)}
              </strong>
            </div>

            {/* Signature */}
            <div className="text-right text-xs pt-2">
              <p className="text-slate-500">Petugas Penerima,</p>
              <div className="h-12" />
              <p className="font-bold underline">{selectedTrxForReceipt.petugas}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: BULK AUTODEBET 1 ROMBEL DARI SALDO TABUNGAN                      */}
      {/* ========================================================================= */}
      {isBulkAutodebetModalOpen && (() => {
        const targetStudents = siswaList.filter(
          (s) =>
            bulkAutodebetKelas === "Semua" ||
            s.kelas.toLowerCase() === bulkAutodebetKelas.toLowerCase()
        );

        let totalReadyNominal = 0;
        let countReady = 0;
        let countInsufficient = 0;
        let countAlreadyPaid = 0;

        const studentRows = targetStudents.map((s) => {
          const rec = getStudentSPPTransportRecord(s.id, selectedTahunAjaran);
          const detail = rec.bulan[bulkAutodebetBulan];
          const transCfg = pesertaTransportList.find((t) => t.siswaId === s.id);
          const isTrans = transCfg ? transCfg.isAktif : false;

          const needsSPP =
            (bulkAutodebetJenis === "SPP" || bulkAutodebetJenis === "Paket Keduanya") &&
            detail.sppStatus !== "Lunas";
          const needsTrans =
            (bulkAutodebetJenis === "Transportasi" || bulkAutodebetJenis === "Paket Keduanya") &&
            isTrans &&
            detail.transportStatus !== "Lunas";

          const isAlreadyPaid = !needsSPP && !needsTrans;

          let requiredNominal = 0;
          if (needsSPP) requiredNominal += detail.sppNominal;
          if (needsTrans) requiredNominal += detail.transportNominal;

          const studentTab = tabunganList.find((t) => t.siswaId === s.id);
          const studentSaldo = studentTab ? studentTab.saldo : 0;
          const isSufficient = !isAlreadyPaid && studentSaldo >= requiredNominal;
          const isInsufficient = !isAlreadyPaid && studentSaldo < requiredNominal;

          if (isAlreadyPaid) {
            countAlreadyPaid++;
          } else if (isSufficient) {
            countReady++;
            totalReadyNominal += requiredNominal;
          } else if (isInsufficient) {
            countInsufficient++;
          }

          return {
            ...s,
            isTrans,
            transBiaya: transCfg?.biayaBulanan || 100000,
            needsSPP,
            needsTrans,
            isAlreadyPaid,
            requiredNominal,
            studentSaldo,
            isSufficient,
            isInsufficient,
          };
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-8 max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Autodebet Tagihan Rombel dari Saldo Tabungan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Potong iuran SPP & transport bulanan secara serentak langsung dari rekening tabungan siswa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBulkAutodebetModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Settings Controls */}
              <div className="py-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                {/* Kelas Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Rombel Kelas:
                  </label>
                  <select
                    value={bulkAutodebetKelas}
                    onChange={(e) => setBulkAutodebetKelas(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    <option value="Semua">Semua Rombel</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama} ({k.jumlahSiswa} Siswa)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bulan Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Bulan Tagihan:
                  </label>
                  <select
                    value={bulkAutodebetBulan}
                    onChange={(e) => setBulkAutodebetBulan(e.target.value as BulanSPP)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    {LIST_BULAN_SPP.map((b) => (
                      <option key={b.bulan} value={b.bulan}>
                        {b.bulan} (Sem. {b.semester})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Komponen Tagihan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Komponen Tagihan:
                  </label>
                  <select
                    value={bulkAutodebetJenis}
                    onChange={(e) =>
                      setBulkAutodebetJenis(
                        e.target.value as "SPP" | "Transportasi" | "Paket Keduanya"
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    <option value="SPP">SPP Saja (Rp 100.000)</option>
                    <option value="Transportasi">Transportasi Saja</option>
                    <option value="Paket Keduanya">Paket SPP & Transportasi</option>
                  </select>
                </div>
              </div>

              {/* Execution Feedback Result if any */}
              {bulkAutodebetFeedback && (
                <div className="mt-3 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs shrink-0">
                  <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-200 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                    <span>Autodebet Berhasil Dijalankan!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-teal-200/60 dark:border-teal-800/60 font-semibold">
                    <span className="text-teal-700 dark:text-teal-300">
                      Sukses Terpotong: <strong>{bulkAutodebetFeedback.successCount} Siswa</strong>
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                      Total: {formatRupiah(bulkAutodebetFeedback.totalAmount)}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400">
                      Saldo Kurang: <strong>{bulkAutodebetFeedback.insufficientCount} Siswa</strong>
                    </span>
                  </div>
                  {bulkAutodebetFeedback.insufficientNames.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-teal-200/60 dark:border-teal-800/60 text-[11px] text-slate-600 dark:text-slate-300">
                      <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">
                        Daftar siswa dengan saldo tabungan tidak cukup (dilewati):
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 font-mono">
                        {bulkAutodebetFeedback.insufficientNames.map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Metric Counters */}
              <div className="grid grid-cols-4 gap-2.5 py-3 shrink-0">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Siswa</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {targetStudents.length}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Siap Terdebet</span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {countReady} Siswa
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono block">
                    {formatRupiah(totalReadyNominal)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-600 block">Saldo Kurang</span>
                  <span className="text-lg font-extrabold text-rose-700 dark:text-rose-300">
                    {countInsufficient} Siswa
                  </span>
                  <span className="text-[10px] text-rose-500 block">Perlu Setoran</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sudah Lunas</span>
                  <span className="text-lg font-bold text-slate-600 dark:text-slate-300">
                    {countAlreadyPaid} Siswa
                  </span>
                  <span className="text-[10px] text-slate-400 block">Dilewati</span>
                </div>
              </div>

              {/* Student Preview Table */}
              <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl my-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 z-10 text-[11px]">
                    <tr>
                      <th className="px-3 py-2.5">Siswa</th>
                      <th className="px-3 py-2.5">Tagihan {bulkAutodebetBulan}</th>
                      <th className="px-3 py-2.5">Saldo Tabungan</th>
                      <th className="px-3 py-2.5 text-right">Status Autodebet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          Tidak ada siswa dalam rombel ini.
                        </td>
                      </tr>
                    ) : (
                      studentRows.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {s.nama}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {s.kelas} &bull; NISN: {s.nisn}
                              {s.isTrans && " &bull; 🚌 Transport"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {s.isAlreadyPaid ? (
                              <span className="text-slate-400 font-normal">Rp 0 (Sudah Lunas)</span>
                            ) : (
                              formatRupiah(s.requiredNominal)
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            <span className="font-bold text-teal-700 dark:text-teal-400">
                              {formatRupiah(s.studentSaldo)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {s.isAlreadyPaid ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                ✓ Sudah Lunas
                              </span>
                            ) : s.isSufficient ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Siap Terdebet</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 inline-flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>Saldo Kurang</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500">
                  {countReady > 0
                    ? `${countReady} siswa siap dipotong total ${formatRupiah(totalReadyNominal)}.`
                    : "Tidak ada siswa yang siap dipotong autodebet."}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkAutodebetModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    disabled={countReady === 0}
                    onClick={handleExecuteBulkAutodebet}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all ${
                      countReady > 0
                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30 cursor-pointer transform hover:-translate-y-0.5"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <PiggyBank className="h-4 w-4" />
                    <span>⚡ Eksekusi Autodebet Sekarang ({countReady})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedKelasForClassPrint && (() => {
        const targetStudents = siswaList.filter(
          (s) => s.kelas.toLowerCase() === selectedKelasForClassPrint.toLowerCase()
        );

        let totalTargetClass = 0;
        let totalTerbayarClass = 0;

        const classData = targetStudents.map((s) => {
          const rec = getStudentSPPTransportRecord(s.id, selectedTahunAjaran);
          const transCfg = pesertaTransportList.find((t) => t.siswaId === s.id);
          const isTrans = transCfg ? transCfg.isAktif : false;

          const sppPaid = Object.values(rec.bulan).filter((b) => b.sppStatus === "Lunas").length;
          const transPaid = isTrans
            ? Object.values(rec.bulan).filter((b) => b.transportStatus === "Lunas").length
            : 0;

          const studentTarget =
            12 * 100000 + (isTrans ? 12 * (transCfg?.biayaBulanan || 100000) : 0);
          const studentPaid =
            sppPaid * 100000 + (isTrans ? transPaid * (transCfg?.biayaBulanan || 100000) : 0);
          const studentTunggakan = studentTarget - studentPaid;

          totalTargetClass += studentTarget;
          totalTerbayarClass += studentPaid;

          return {
            ...s,
            isTrans,
            sppPaid,
            transPaid,
            studentTarget,
            studentPaid,
            studentTunggakan,
          };
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8">
              <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
                <span className="text-xs font-semibold text-slate-500">
                  Pratinjau Rekapitulasi Kas SPP & Transportasi Rombel
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Cetak Laporan Rombel</span>
                  </button>
                  <button
                    onClick={() => setSelectedKelasForClassPrint(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                <h3 className="font-extrabold text-base uppercase leading-tight text-slate-900">
                  {profile.namaSekolah}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  NPSN: {profile.npsn} &bull; Akreditasi: {profile.akreditasi}
                </p>
                <p className="text-[11px] text-slate-500 max-w-xl mx-auto mt-0.5">
                  {profile.alamat} &bull; Telp: {profile.telepon}
                </p>
              </div>

              {/* Title */}
              <div className="text-center mb-5">
                <h4 className="text-sm font-extrabold underline uppercase tracking-wider text-slate-900">
                  REKAPITULASI PEMBAYARAN SPP & TRANSPORTASI KELAS
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Rombel: <strong>{selectedKelasForClassPrint}</strong> &bull; Tahun Ajaran: <strong>{selectedTahunAjaran}</strong>
                </p>
              </div>

              {/* Table */}
              <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-3 py-2">Nama Siswa</th>
                    <th className="border border-slate-300 px-3 py-2 font-mono w-28">NISN</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">SPP Lunas</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28">Transport Lunas</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-32">Total Terbayar</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-32">Sisa Tunggakan</th>
                  </tr>
                </thead>
                <tbody>
                  {classData.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="border border-slate-300 px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">{s.nama}</td>
                      <td className="border border-slate-300 px-3 py-2 font-mono text-slate-600">{s.nisn}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-800">
                        {s.sppPaid} / 12 Bln
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        {s.isTrans ? `${s.transPaid} / 12 Bln` : <span className="text-slate-400 text-[10px]">Non-Transport</span>}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(s.studentPaid)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold text-amber-600">
                        {s.studentTunggakan > 0 ? formatRupiah(s.studentTunggakan) : <span className="text-emerald-700 font-normal">Lunas</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
                    <td colSpan={5} className="border border-slate-300 px-3 py-2 text-right">
                      Total Rombel {selectedKelasForClassPrint}:
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono text-emerald-800 font-extrabold">
                      {formatRupiah(totalTerbayarClass)}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono text-amber-800 font-extrabold">
                      {formatRupiah(totalTargetClass - totalTerbayarClass)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <p className="text-slate-500">Wali Kelas {selectedKelasForClassPrint},</p>
                  <div className="h-14" />
                  <p className="font-bold underline">Wali Kelas</p>
                  <p className="text-[10px] text-slate-400">NIP: 198506122010012015</p>
                </div>
                <div>
                  <p className="text-slate-500">
                    Jakarta, {formatDateIndo(new Date().toISOString().split("T")[0])}
                  </p>
                  <p className="text-slate-500">Kepala Sekolah,</p>
                  <div className="h-14" />
                  <p className="font-bold underline">{profile.kepalaSekolah}</p>
                  <p className="text-[10px] text-slate-400">NIP: 197204151998031002</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
