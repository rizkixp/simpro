"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { TabunganSiswa, TransaksiTabungan } from "@/types/school";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  PiggyBank,
  Search,
  Plus,
  Minus,
  Zap,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
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
  GraduationCap,
  Trash2,
} from "lucide-react";

export default function TabunganSiswaPage() {
  const { user } = useAuth();
  const {
    tabunganList,
    transaksiTabunganList,
    siswaList,
    kelasList,
    setorTabungan,
    tarikTabungan,
    bulkSetorTabungan,
    clearAllTabungan,
    profile,
    guruList,
  } = useSchoolData();

  // Active Tab: "saldo" | "kelas" | "mutasi"
  const [activeTab, setActiveTab] = useState<"saldo" | "kelas" | "mutasi">("saldo");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");

  // Modal States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [singleType, setSingleType] = useState<"Setor" | "Tarik">("Setor");
  const [selectedTabunganForDetail, setSelectedTabunganForDetail] = useState<TabunganSiswa | null>(null);
  const [receiptTrx, setReceiptTrx] = useState<TransaksiTabungan | null>(null);
  const [selectedKelasForPrint, setSelectedKelasForPrint] = useState<string | null>(null);

  // Single Form State with Date Option
  const [singleForm, setSingleForm] = useState({
    siswaId: "",
    nominal: 20000,
    keterangan: "",
    tanggal: new Date().toISOString().split("T")[0],
  });
  const [singleError, setSingleError] = useState<string | null>(null);

  // Bulk Form State with Date Option
  const [bulkKelas, setBulkKelas] = useState<string>(kelasList[0]?.nama || "Kelas 1");
  const [bulkDate, setBulkDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [bulkNotes, setBulkNotes] = useState("Setoran tabungan rutin siswa");
  const [bulkEntries, setBulkEntries] = useState<
    { siswaId: string; nama: string; nisn: string; included: boolean; nominal: number }[]
  >([]);

  const canManage = user?.role === "admin" || user?.role === "bendahara";

  // Filtered Tabungan List (Daftar Saldo)
  const filteredTabungan = tabunganList.filter((t) => {
    const matchSearch =
      t.siswaNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nisn.includes(searchTerm) ||
      t.kelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = selectedKelas === "Semua" || t.kelas === selectedKelas;
    return matchSearch && matchKelas;
  });

  // Filtered Transactions
  const filteredMutasi = transaksiTabunganList.filter((m) => {
    const matchSearch =
      m.siswaNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nisn.includes(searchTerm) ||
      m.kelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = selectedKelas === "Semua" || m.kelas === selectedKelas;
    return matchSearch && matchKelas;
  });

  // Overall Metrics
  const totalSaldoKas = tabunganList.reduce((acc, curr) => acc + curr.saldo, 0);
  const totalPenabungAktif = tabunganList.filter((t) => t.saldo > 0).length;
  const persentasePenabung =
    siswaList.length > 0 ? Math.round((totalPenabungAktif / siswaList.length) * 100) : 0;
  const avgTabungan =
    totalPenabungAktif > 0 ? Math.round(totalSaldoKas / totalPenabungAktif) : 0;

  // Selected Class Specific Metrics (for the quick banner in "saldo" tab)
  const selectedClassStudents =
    selectedKelas === "Semua"
      ? siswaList
      : siswaList.filter((s) => s.kelas.toLowerCase() === selectedKelas.toLowerCase());
  const selectedClassTabungan =
    selectedKelas === "Semua"
      ? tabunganList
      : tabunganList.filter((t) => t.kelas.toLowerCase() === selectedKelas.toLowerCase());
  const selectedClassSaldo = selectedClassTabungan.reduce((acc, curr) => acc + curr.saldo, 0);
  const selectedClassActiveSavers = selectedClassTabungan.filter((t) => t.saldo > 0).length;
  const selectedClassPercent =
    selectedClassStudents.length > 0
      ? Math.round((selectedClassActiveSavers / selectedClassStudents.length) * 100)
      : 0;

  // Per-Class Aggregated Statistics Data (for "kelas" tab)
  const perClassSummary = kelasList.map((k) => {
    const classSiswa = siswaList.filter((s) => s.kelas.toLowerCase() === k.nama.toLowerCase());
    const classTabs = tabunganList.filter((t) => t.kelas.toLowerCase() === k.nama.toLowerCase());
    const saldoTotal = classTabs.reduce((acc, curr) => acc + curr.saldo, 0);
    const penabungAktif = classTabs.filter((t) => t.saldo > 0).length;
    const persentase = classSiswa.length > 0 ? Math.round((penabungAktif / classSiswa.length) * 100) : 0;
    const rataRata = penabungAktif > 0 ? Math.round(saldoTotal / penabungAktif) : 0;

    // Wali Kelas info
    const matchedWaliGuru = guruList.find((g) => g.id === k.waliKelasId);
    const waliNama =
      (matchedWaliGuru?.nama ? `${matchedWaliGuru.nama}, ${matchedWaliGuru.gelar || ""}`.trim() : null) ||
      k.waliKelasNama ||
      "Wali Kelas";

    return {
      id: k.id,
      nama: k.nama,
      waliNama,
      totalSiswa: classSiswa.length,
      penabungAktif,
      persentase,
      saldoTotal,
      rataRata,
    };
  });

  // Student Specific View (for student / ortu login)
  const currentSiswa =
    siswaList.find(
      (s) => s.nisn === user?.nisnOrNip || s.nama.toLowerCase().includes("ahmad rizky")
    ) || siswaList[0];
  const currentStudentTabungan =
    tabunganList.find((t) => t.siswaId === currentSiswa.id) || {
      id: "tab-temp",
      siswaId: currentSiswa.id,
      siswaNama: currentSiswa.nama,
      nisn: currentSiswa.nisn,
      kelas: currentSiswa.kelas,
      saldo: 0,
      terakhirUpdate: "-",
    };
  const currentStudentMutasi = transaksiTabunganList.filter(
    (m) => m.siswaId === currentSiswa.id
  );

  // Open Single Modal
  const handleOpenSingle = (type: "Setor" | "Tarik", preselectedSiswaId?: string) => {
    setSingleType(type);
    setSingleError(null);
    setSingleForm({
      siswaId: preselectedSiswaId || siswaList[0]?.id || "",
      nominal: type === "Setor" ? 20000 : 10000,
      keterangan: type === "Setor" ? "Setoran tunai tabungan" : "Penarikan saldo tabungan",
      tanggal: new Date().toISOString().split("T")[0],
    });
    setIsSingleModalOpen(true);
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);

    if (singleForm.nominal <= 0) {
      setSingleError("Nominal transaksi harus lebih dari Rp 0");
      return;
    }

    if (singleType === "Setor") {
      setorTabungan(
        singleForm.siswaId,
        Number(singleForm.nominal),
        singleForm.keterangan,
        user?.name || "Petugas Tata Usaha",
        singleForm.tanggal
      );
      setIsSingleModalOpen(false);
    } else {
      const res = tarikTabungan(
        singleForm.siswaId,
        Number(singleForm.nominal),
        singleForm.keterangan,
        user?.name || "Petugas Tata Usaha",
        singleForm.tanggal
      );
      if (!res.success) {
        setSingleError(res.message || "Gagal melakukan penarikan");
      } else {
        setIsSingleModalOpen(false);
      }
    }
  };

  // Open Bulk Modal with date and optional target class
  const handleOpenBulk = (targetKelas?: string) => {
    const selectedK = targetKelas || bulkKelas || kelasList[0]?.nama || "Kelas 1";
    setBulkKelas(selectedK);
    setBulkDate(new Date().toISOString().split("T")[0]);
    const classStudents = siswaList.filter(
      (s) => s.kelas.toLowerCase() === selectedK.toLowerCase()
    );
    setBulkEntries(
      classStudents.map((s) => ({
        siswaId: s.id,
        nama: s.nama,
        nisn: s.nisn,
        included: true,
        nominal: 10000, // Default 10rb
      }))
    );
    setIsBulkModalOpen(true);
  };

  const handleBulkKelasChange = (newKelas: string) => {
    setBulkKelas(newKelas);
    const classStudents = siswaList.filter(
      (s) => s.kelas.toLowerCase() === newKelas.toLowerCase()
    );
    setBulkEntries(
      classStudents.map((s) => ({
        siswaId: s.id,
        nama: s.nama,
        nisn: s.nisn,
        included: true,
        nominal: 10000,
      }))
    );
  };

  const handleSetAllBulkNominal = (nominal: number) => {
    setBulkEntries((prev) =>
      prev.map((item) => (item.included ? { ...item, nominal } : item))
    );
  };

  const handleToggleSelectAll = (check: boolean) => {
    setBulkEntries((prev) => prev.map((item) => ({ ...item, included: check })));
  };

  const handleSaveBulk = () => {
    const itemsToSave = bulkEntries
      .filter((item) => item.included && item.nominal > 0)
      .map((item) => ({
        siswaId: item.siswaId,
        nominal: item.nominal,
        keterangan: `${bulkNotes} (${bulkKelas})`,
      }));

    if (itemsToSave.length === 0) {
      alert("Pilih minimal 1 siswa dengan nominal setoran lebih dari Rp 0");
      return;
    }

    bulkSetorTabungan(itemsToSave, user?.name || "Dewan Guru", bulkDate);
    setIsBulkModalOpen(false);
    alert(
      `Berhasil mencatat setoran tabungan tanggal ${formatDateIndo(bulkDate)} untuk ${
        itemsToSave.length
      } siswa kelas ${bulkKelas}!`
    );
  };

  // Calculate bulk summary
  const totalBulkJumlah = bulkEntries
    .filter((e) => e.included)
    .reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const totalBulkSiswa = bulkEntries.filter((e) => e.included && e.nominal > 0).length;

  // Print Class Passbook Record
  const handleOpenPrintKelas = (namaKelas: string) => {
    setSelectedKelasForPrint(namaKelas);
  };

  const handleClearTabungan = async () => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus seluruh data tabungan siswa dan riwayat mutasi? Seluruh saldo tabungan akan dikosongkan."
      )
    ) {
      await clearAllTabungan();
      alert("Seluruh data tabungan siswa dan mutasi berhasil dihapus!");
    }
  };

  // Guard: Restrict Guru from viewing or accessing Tabungan Siswa
  if (user?.role === "guru") {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Akses Tabungan Siswa Dibatasi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Menu Tabungan Siswa tidak ditampilkan untuk akun dengan mode peran Guru. Pencatatan transaksi dan rekapitulasi kas tabungan dikelola langsung oleh Administrator atau Bagian Keuangan & Tata Usaha Sekolah.
          </p>
          <div className="pt-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <PiggyBank className="h-7 w-7 text-emerald-600" />
            <span>Tabungan Siswa & Kas Kesiswaan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Program gemar menabung digital sekolah, pemantauan tabungan per rombel kelas, serta fitur setoran massal cepat dengan pilihan tanggal.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenSingle("Tarik")}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <Minus className="h-4 w-4 text-amber-500" />
              <span>Tarik Tabungan</span>
            </button>

            <button
              onClick={() => handleOpenSingle("Setor")}
              className="px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 text-emerald-600" />
              <span>Setor Tunggal</span>
            </button>

            {/* Main Requested Feature: BULK MENABUNG */}
            <button
              onClick={() => handleOpenBulk()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
              <span>⚡ Bulk Menabung Cepat</span>
            </button>

            {/* Hapus Semua Data Tabungan Button */}
            <button
              onClick={handleClearTabungan}
              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Hapus seluruh data tabungan siswa dan riwayat transaksi"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Hapus Data Demo</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Kas Tabungan</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalSaldoKas)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <Coins className="h-3 w-3" />
              <span>Saldo aktif seluruh siswa</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <PiggyBank className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Partisipasi Menabung</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {persentasePenabung}% Siswa
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalPenabungAktif} dari {siswaList.length} siswa memiliki saldo
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Rata-Rata Saldo / Siswa</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(avgTabungan)}
            </p>
            <p className="text-[11px] text-blue-600 mt-1 font-medium">Berdasarkan penabung aktif</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Riwayat Mutasi</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {transaksiTabunganList.length} Transaksi
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Tercatat di sistem buku besar</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Receipt className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Student / Parent Personalized Passbook Card */}
      {(user?.role === "siswa" || user?.role === "ortu") && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-200 mb-3 border border-white/10">
                <PiggyBank className="h-3.5 w-3.5 text-amber-300" />
                <span>Buku Tabungan Digital Siswa</span>
              </div>
              <h2 className="text-2xl font-bold">{currentSiswa.nama}</h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                NISN: {currentSiswa.nisn} &bull; Kelas: {currentSiswa.kelas}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-200/80 block">Saldo Tabungan Saat Ini:</span>
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300 tracking-tight">
                {formatRupiah(currentStudentTabungan.saldo)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Saldo, Tabungan Per Kelas, Mutasi) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("saldo")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "saldo"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Daftar Saldo Siswa</span>
          </button>

          {/* New Tab Option: Tabungan Per Kelas */}
          <button
            onClick={() => setActiveTab("kelas")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "kelas"
                ? "bg-emerald-600 text-white shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Tabungan Per Kelas</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === "kelas" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
            >
              {kelasList.length} Rombel
            </span>
          </button>

          <button
            onClick={() => setActiveTab("mutasi")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "mutasi"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Riwayat Mutasi Setor/Tarik</span>
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa, NISN, atau kelas..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
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
      {/* TAB 1: DAFTAR SALDO SISWA (DILENGKAPI PILIHAN FILTER PER KELAS CEPAT)     */}
      {/* ========================================================================= */}
      {activeTab === "saldo" && (
        <div className="space-y-4">
          {/* Opsi Seleksi Kelas Cepat (Pill Buttons) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Pilih Kelas:</span>
            </span>
            <button
              onClick={() => setSelectedKelas("Semua")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedKelas === "Semua"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              Semua Kelas
            </button>
            {kelasList.map((k) => (
              <button
                key={k.id}
                onClick={() => setSelectedKelas(k.nama)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedKelas === k.nama
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                {k.nama}
              </button>
            ))}
          </div>

          {/* Banner Informasi Kelas Terpilih */}
          {selectedKelas !== "Semua" && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Data Tabungan: {selectedKelas}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-semibold">
                      {selectedClassActiveSavers} dari {selectedClassStudents.length} Siswa Menabung ({selectedClassPercent}%)
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Total Kas Rombel: <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-xs">{formatRupiah(selectedClassSaldo)}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenBulk(selectedKelas)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  <span>Bulk Setor {selectedKelas}</span>
                </button>
                <button
                  onClick={() => handleOpenPrintKelas(selectedKelas)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cetak Rekap Kelas</span>
                </button>
              </div>
            </div>
          )}

          {/* Table Saldo Siswa */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Nama Siswa</th>
                    <th className="px-4 py-3.5">NISN</th>
                    <th className="px-4 py-3.5">Kelas</th>
                    <th className="px-4 py-3.5 text-right">Saldo Tabungan</th>
                    <th className="px-4 py-3.5">Terakhir Update</th>
                    <th className="px-5 py-3.5 text-right">Aksi Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTabungan.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        Tidak ada data tabungan yang cocok dengan filter kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTabungan.map((tab) => (
                      <tr
                        key={tab.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {tab.siswaNama}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">{tab.nisn}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                            {tab.kelas}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-bold font-mono text-sm text-emerald-700 dark:text-emerald-400">
                            {formatRupiah(tab.saldo)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">
                          {formatDateIndo(tab.terakhirUpdate)}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedTabunganForDetail(tab)}
                            title="Lihat Buku Tabungan & Mutasi"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Receipt className="h-3.5 w-3.5 text-slate-500" />
                            <span>Buku Tabungan</span>
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenSingle("Setor", tab.siswaId)}
                                title="Setor Tabungan"
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenSingle("Tarik", tab.siswaId)}
                                title="Tarik Tabungan"
                                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TAMPILAN TABUNGAN PER KELAS (REKAPITULASI ROMBEL LENGKAP)          */}
      {/* ========================================================================= */}
      {activeTab === "kelas" && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Rekapitulasi Saldo Kas Tabungan Seluruh Kelas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pantau total perolehan saldo, persentase partisipasi murid menabung, serta lakukan setoran massal langsung per rombel.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Total Tabungan Sekolah:</span>
              <span className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                {formatRupiah(totalSaldoKas)}
              </span>
            </div>
          </div>

          {/* Cards Grid Per Kelas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
            {perClassSummary.map((cls) => (
              <div
                key={cls.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      {cls.nama}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {cls.totalSiswa} Siswa
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Wali: {cls.waliNama}
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Total Kas Kelas:</span>
                      <span className="font-extrabold font-mono text-base text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(cls.saldoTotal)}
                      </span>
                    </div>

                    {/* Progress Bar Partisipasi */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>Penabung Aktif:</span>
                        <strong>{cls.penabungAktif} / {cls.totalSiswa} Siswa ({cls.persentase}%)</strong>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cls.persentase >= 75
                              ? "bg-emerald-500"
                              : cls.persentase >= 40
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${cls.persentase}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => {
                      setSelectedKelas(cls.nama);
                      setActiveTab("saldo");
                    }}
                    title="Lihat Daftar Saldo Siswa Kelas Ini"
                    className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Users className="h-3 w-3" />
                    <span>Siswa</span>
                  </button>

                  <button
                    onClick={() => handleOpenBulk(cls.nama)}
                    title="Setor Cepat Seluruh Siswa Kelas Ini"
                    className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 text-[11px] shadow-sm"
                  >
                    <Zap className="h-3 w-3 text-amber-300 fill-amber-300" />
                    <span>Bulk</span>
                  </button>

                  <button
                    onClick={() => handleOpenPrintKelas(cls.nama)}
                    title="Cetak Lembar Rekapitulasi Rombel"
                    className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tabel Perbandingan Rombel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Tabel Komparasi Tabungan Antar Rombel Kelas
              </h4>
              <span className="text-xs text-slate-400">Total {kelasList.length} Rombel</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Nama Kelas / Rombel</th>
                    <th className="px-5 py-3.5">Wali Kelas</th>
                    <th className="px-4 py-3.5 text-center">Total Siswa</th>
                    <th className="px-4 py-3.5 text-center">Penabung Aktif</th>
                    <th className="px-4 py-3.5 text-center">% Partisipasi</th>
                    <th className="px-5 py-3.5 text-right font-bold">Total Saldo Kas</th>
                    <th className="px-5 py-3.5 text-right">Rata-Rata / Siswa</th>
                    <th className="px-5 py-3.5 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {perClassSummary.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{item.nama}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.waliNama}</td>
                      <td className="px-4 py-3 text-center font-mono">{item.totalSiswa}</td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {item.penabungAktif}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.persentase >= 75
                              ? "bg-emerald-100 text-emerald-800"
                              : item.persentase >= 40
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.persentase}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(item.saldoTotal)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-500">
                        {formatRupiah(item.rataRata)}
                      </td>
                      <td className="px-5 py-3 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedKelas(item.nama);
                            setActiveTab("saldo");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => handleOpenBulk(item.nama)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Bulk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={6} className="px-5 py-3 text-right text-slate-700 dark:text-slate-200">
                      Total Seluruh Kas Tabungan Sekolah:
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-800 dark:text-emerald-300 text-sm font-extrabold">
                      {formatRupiah(totalSaldoKas)}
                    </td>
                    <td colSpan={2} className="px-5 py-3 text-slate-500 text-[11px]">
                      {totalPenabungAktif} Siswa Penabung Aktif
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RIWAYAT MUTASI TRANSAKSI                                           */}
      {/* ========================================================================= */}
      {activeTab === "mutasi" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">No. Referensi</th>
                  <th className="px-4 py-3.5">Nama Siswa</th>
                  <th className="px-4 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Tipe</th>
                  <th className="px-4 py-3.5 text-right">Nominal</th>
                  <th className="px-4 py-3.5 text-right">Saldo Akhir</th>
                  <th className="px-4 py-3.5">Keterangan</th>
                  <th className="px-4 py-3.5">Petugas</th>
                  <th className="px-4 py-3.5 text-center">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMutasi.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-10 text-center text-slate-400">
                      Belum ada catatan mutasi transaksi tabungan.
                    </td>
                  </tr>
                ) : (
                  filteredMutasi.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        {formatDateIndo(m.tanggal)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                        {m.noReferensi || "-"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {m.siswaNama}
                      </td>
                      <td className="px-4 py-3.5">{m.kelas}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            m.tipe === "Setor"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                          }`}
                        >
                          {m.tipe === "Setor" ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {m.tipe}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-bold ${
                          m.tipe === "Setor"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {m.tipe === "Setor" ? "+" : "-"}
                        {formatRupiah(m.nominal)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(m.saldoAkhir)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">{m.keterangan}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">{m.petugas}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setReceiptTrx(m)}
                          title="Cetak Bukti Transaksi"
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Printer className="h-3.5 w-3.5" />
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
      {/* MODAL 1: FITUR BULK MENABUNG (DENGAN OPSI PILIHAN TANGGAL)                 */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] flex flex-col justify-between my-6">
            <div>
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                    <Zap className="h-5 w-5 text-amber-300 fill-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      ⚡ Input Tabungan Siswa Cepat (Bulk Menabung)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Entri setoran tabungan siswa satu kelas sekaligus dalam satu layar dengan pilihan tanggal fleksibel.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bulk Settings Bar (PILIH KELAS, PILIHAN TANGGAL, KETERANGAN, PRESET) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Pilih Kelas */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Pilih Kelas / Rombel:
                    </label>
                    <select
                      value={bulkKelas}
                      onChange={(e) => handleBulkKelasChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    >
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.nama}>
                          {k.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. OPSI PILIHAN TANGGAL SETORAN BULK (USER REQUEST) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tanggal Transaksi *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-mono"
                    />
                  </div>

                  {/* 3. Keterangan Transaksi */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Keterangan Transaksi:
                    </label>
                    <input
                      type="text"
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      placeholder="Keterangan setoran"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                      Set Nominal Cepat:
                    </span>
                    {[5000, 10000, 20000, 50000].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => handleSetAllBulkNominal(amt)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold transition-colors"
                      >
                        +{amt / 1000}k
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSetAllBulkNominal(0)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Reset (0)
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Tanggal Transaksi: <strong>{formatDateIndo(bulkDate)}</strong>
                  </span>
                </div>
              </div>

              {/* Table of Students for Fast Bulk Entry */}
              <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={bulkEntries.length > 0 && bulkEntries.every((e) => e.included)}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="px-4 py-2.5">Nama Siswa</th>
                      <th className="px-4 py-2.5">NISN</th>
                      <th className="px-4 py-2.5 text-right">Saldo Saat Ini</th>
                      <th className="px-4 py-2.5 text-right w-44">Nominal Setor (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {bulkEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Tidak ada siswa di kelas {bulkKelas}.
                        </td>
                      </tr>
                    ) : (
                      bulkEntries.map((item, idx) => {
                        const curTab = tabunganList.find((t) => t.siswaId === item.siswaId);
                        const curSaldo = curTab ? curTab.saldo : 0;
                        return (
                          <tr
                            key={item.siswaId}
                            className={`transition-colors ${
                              item.included
                                ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                : "bg-slate-50 dark:bg-slate-950 opacity-40"
                            }`}
                          >
                            <td className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.included}
                                onChange={(e) => {
                                  const updated = [...bulkEntries];
                                  updated[idx].included = e.target.checked;
                                  setBulkEntries(updated);
                                }}
                                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">
                              {item.nama}
                            </td>
                            <td className="px-4 py-2 font-mono text-slate-400">{item.nisn}</td>
                            <td className="px-4 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                              {formatRupiah(curSaldo)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                disabled={!item.included}
                                value={item.nominal}
                                onChange={(e) => {
                                  const updated = [...bulkEntries];
                                  updated[idx].nominal = Number(e.target.value);
                                  setBulkEntries(updated);
                                }}
                                className="w-36 px-3 py-1 text-xs text-right font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bulk Footer Summary & Action */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-slate-500">Siswa Menabung:</span>{" "}
                  <strong className="text-emerald-700 dark:text-emerald-300 text-sm">
                    {totalBulkSiswa} Siswa
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-slate-500">Total Uang Masuk:</span>{" "}
                  <strong className="text-emerald-700 dark:text-emerald-300 text-sm font-mono">
                    {formatRupiah(totalBulkJumlah)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulk}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Seluruh Tabungan ({totalBulkSiswa} Siswa)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SETOR / TARIK TUNGGAL (DILENGKAPI PILIHAN TANGGAL)               */}
      {/* ========================================================================= */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setIsSingleModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Transaksi {singleType} Tabungan
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {singleType === "Setor"
                ? "Mencatat setoran tunai tabungan peserta didik ke kas sekolah."
                : "Mencatat penarikan dana tabungan oleh siswa atau wali murid."}
            </p>

            {singleError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSingle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Siswa *
                </label>
                <select
                  required
                  value={singleForm.siswaId}
                  onChange={(e) => setSingleForm({ ...singleForm, siswaId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tanggal Transaksi *</span>
                </label>
                <input
                  type="date"
                  required
                  value={singleForm.tanggal}
                  onChange={(e) => setSingleForm({ ...singleForm, tanggal: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal {singleType} (Rp) *
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={singleForm.nominal}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, nominal: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-base font-bold"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[10000, 20000, 50000, 100000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setSingleForm({ ...singleForm, nominal: amt })}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                    >
                      {amt / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  value={singleForm.keterangan}
                  onChange={(e) => setSingleForm({ ...singleForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Setoran uang jajan"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${
                    singleType === "Setor"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                  }`}
                >
                  Konfirmasi {singleType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BUKU TABUNGAN & CETAK REKENING KORAN SISWA                      */}
      {/* ========================================================================= */}
      {selectedTabunganForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
              <span className="text-xs font-semibold text-slate-500">
                Buku Tabungan Digital & Lembar Rekap Transaksi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Buku Tabungan</span>
                </button>
                <button
                  onClick={() => setSelectedTabunganForDetail(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Passbook Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-center gap-2.5 mb-1.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <PiggyBank className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-sm uppercase leading-tight">
                    {profile.namaSekolah}
                  </h3>
                  <p className="text-[10px] text-slate-500">Unit Simpan Pinjam & Tabungan Siswa</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">{profile.alamat}</p>
            </div>

            {/* Student Info in Passbook */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 mb-6">
              <div>
                <p className="text-slate-500">Nama Pemilik Rekening:</p>
                <p className="text-sm font-bold text-slate-900">{selectedTabunganForDetail.siswaNama}</p>
                <p className="text-slate-500 mt-1">
                  NISN: <span className="font-mono font-bold text-slate-900">{selectedTabunganForDetail.nisn}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Kelas / Rombel: <strong>{selectedTabunganForDetail.kelas}</strong></p>
                <p className="text-xs text-slate-500 mt-1">Saldo Akhir:</p>
                <p className="text-2xl font-extrabold font-mono text-emerald-800">
                  {formatRupiah(selectedTabunganForDetail.saldo)}
                </p>
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Mutasi Buku Tabungan
              </h4>
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-3 py-2">Tanggal</th>
                    <th className="border border-slate-300 px-3 py-2">Keterangan</th>
                    <th className="border border-slate-300 px-3 py-2 text-right">Setor (+)</th>
                    <th className="border border-slate-300 px-3 py-2 text-right">Tarik (-)</th>
                    <th className="border border-slate-300 px-3 py-2 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiTabunganList
                    .filter((m) => m.siswaId === selectedTabunganForDetail.siswaId)
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="border border-slate-300 px-3 py-1.5">{item.tanggal}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-[11px]">
                          {item.keterangan}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono text-emerald-700">
                          {item.tipe === "Setor" ? formatRupiah(item.nominal) : "-"}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono text-amber-700">
                          {item.tipe === "Tarik" ? formatRupiah(item.nominal) : "-"}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.saldoAkhir)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 text-center text-xs pt-6 border-t border-slate-200">
              <div>
                <p className="text-slate-500">Pemilik Tabungan / Orang Tua,</p>
                <div className="h-16" />
                <p className="font-bold underline">{selectedTabunganForDetail.siswaNama}</p>
              </div>
              <div>
                <p className="text-slate-500">
                  Jakarta, {formatDateIndo(new Date().toISOString().split("T")[0])}
                </p>
                <p className="text-slate-500">Petugas Tata Usaha / Keuangan,</p>
                <div className="h-14" />
                <p className="font-bold underline">{user?.name || "Bendahara Tabungan"}</p>
                <p className="text-[10px] text-slate-400">NIP: 198506122010012015</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CETAK REKAPITULASI TABUNGAN PER KELAS                            */}
      {/* ========================================================================= */}
      {selectedKelasForPrint && (() => {
        const targetStudents = siswaList.filter(
          (s) => s.kelas.toLowerCase() === selectedKelasForPrint.toLowerCase()
        );
        const targetClassObj = kelasList.find(
          (k) => k.nama.toLowerCase() === selectedKelasForPrint.toLowerCase()
        );
        const targetWaliGuru = targetClassObj
          ? guruList.find((g) => g.id === targetClassObj.waliKelasId)
          : null;
        const waliNama =
          (targetWaliGuru?.nama ? `${targetWaliGuru.nama}, ${targetWaliGuru.gelar || ""}`.trim() : null) ||
          targetClassObj?.waliKelasNama ||
          "Wali Kelas";
        const waliNip = targetWaliGuru?.nip || "198506122010012015";

        const totalKelasSaldo = targetStudents.reduce((acc, curr) => {
          const tab = tabunganList.find((t) => t.siswaId === curr.id);
          return acc + (tab ? tab.saldo : 0);
        }, 0);

        const totalPenabung = targetStudents.filter((s) => {
          const tab = tabunganList.find((t) => t.siswaId === s.id);
          return tab && tab.saldo > 0;
        }).length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8">
              <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
                <span className="text-xs font-semibold text-slate-500">
                  Pratinjau Lembar Rekapitulasi Kas Tabungan Kelas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Cetak Rekap Rombel</span>
                  </button>
                  <button
                    onClick={() => setSelectedKelasForPrint(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex items-center justify-center gap-2.5 mb-1.5">
                  <div className="h-11 w-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                    <PiggyBank className="h-6 w-6" />
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
                  LEMBAR REKAPITULASI BUKU KAS TABUNGAN SISWA
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Rombongan Belajar: <strong>{selectedKelasForPrint}</strong> &bull; Tahun Ajaran {profile.tahunAjaranAktif}
                </p>
              </div>

              {/* Class Info Box */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-5">
                <div>
                  <span className="text-slate-500 block">Wali Kelas:</span>
                  <strong className="text-slate-900">{waliNama}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Jumlah Siswa:</span>
                  <strong className="text-slate-900">{targetStudents.length} Siswa ({totalPenabung} Aktif Menabung)</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Total Kas Rombel:</span>
                  <strong className="text-emerald-700 font-mono text-sm">{formatRupiah(totalKelasSaldo)}</strong>
                </div>
              </div>

              {/* Table of Students in Class */}
              <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-3 py-2">Nama Siswa</th>
                    <th className="border border-slate-300 px-3 py-2 font-mono w-28">NISN</th>
                    <th className="border border-slate-300 px-3 py-2 text-right w-36">Saldo Tabungan</th>
                    <th className="border border-slate-300 px-3 py-2 w-28">Terakhir Setor</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {targetStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 px-3 py-6 text-center text-slate-400">
                        Tidak ada siswa terdaftar pada rombel ini.
                      </td>
                    </tr>
                  ) : (
                    targetStudents.map((s, idx) => {
                      const tab = tabunganList.find((t) => t.siswaId === s.id);
                      const saldo = tab ? tab.saldo : 0;
                      const tgl = tab?.terakhirUpdate || "-";

                      return (
                        <tr key={s.id}>
                          <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">
                            {s.nama}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 font-mono text-slate-600">
                            {s.nisn}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(saldo)}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-slate-600 text-[11px]">
                            {tgl !== "-" ? formatDateIndo(tgl) : "-"}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center">
                            {saldo > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] text-slate-400">
                                Saldo Rp 0
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
                    <td colSpan={3} className="border border-slate-300 px-3 py-2 text-right text-slate-800">
                      Total Kas Tabungan {selectedKelasForPrint}:
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-mono text-emerald-800 text-sm font-extrabold">
                      {formatRupiah(totalKelasSaldo)}
                    </td>
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-slate-500 text-[11px]">
                      Partisipasi: {totalPenabung} dari {targetStudents.length} Siswa
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-xs pt-6 border-t border-slate-200">
                <div>
                  <p className="text-slate-500">Wali Kelas {selectedKelasForPrint},</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{waliNama}</p>
                  <p className="text-[10px] text-slate-400">NIP: {waliNip}</p>
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

      {/* ========================================================================= */}
      {/* MODAL 5: RECEIPT STRUK TRANSAKSI                                          */}
      {/* ========================================================================= */}
      {receiptTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 relative font-mono text-xs">
            <button
              onClick={() => setReceiptTrx(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 no-print"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h3 className="font-bold text-sm uppercase">{profile.namaSekolah}</h3>
              <p className="text-[10px] text-slate-500">BUKTI TRANSAKSI TABUNGAN</p>
              <p className="text-[9px] text-slate-400 font-mono mt-1">{receiptTrx.noReferensi}</p>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{formatDateIndo(receiptTrx.tanggal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Siswa:</span>
                <span className="font-bold">{receiptTrx.siswaNama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelas:</span>
                <span>{receiptTrx.kelas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis:</span>
                <span className="font-bold uppercase text-emerald-700">{receiptTrx.tipe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan:</span>
                <span className="text-right truncate max-w-[160px]">{receiptTrx.keterangan}</span>
              </div>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-4">
              <div className="flex justify-between text-sm font-bold">
                <span>NOMINAL:</span>
                <span className="text-emerald-700">{formatRupiah(receiptTrx.nominal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-bold">
                <span>SALDO AKHIR:</span>
                <span>{formatRupiah(receiptTrx.saldoAkhir)}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mb-4">
              <p>Petugas: {receiptTrx.petugas}</p>
              <p className="mt-1">Terima kasih atas budaya gemar menabung.</p>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 text-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
