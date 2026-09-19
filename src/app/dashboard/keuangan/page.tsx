"use client";

import React, { useState } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { TagihanSiswa, KategoriTagihan, MetodePembayaranTagihan, JenisTagihan } from "@/types/school";
import { formatRupiah, formatDateIndo, getStatusBadgeClass } from "@/lib/utils";
import {
  Wallet,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  X,
  CreditCard,
  QrCode,
  Building2,
  GraduationCap,
  Plus,
  Zap,
  PiggyBank,
  ArrowRight,
  Filter,
  Layers,
  FileText,
  BadgePercent,
  Users,
  Tags,
  Edit2,
  Trash2,
  Settings,
  ShieldAlert,
} from "lucide-react";

export default function KeuanganTagihanPage() {
  const { user } = useAuth();
  const {
    sppList,
    addTagihan,
    bulkAddTagihan,
    bayarSPP,
    bayarTagihanDariTabungan,
    bulkBayarTagihanDariTabungan,
    tabunganList,
    siswaList,
    kelasList,
    profile,
    jenisTagihanList,
    addJenisTagihan,
    updateJenisTagihan,
    deleteJenisTagihan,
  } = useSchoolData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("Semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");

  // Modals
  const [payingItem, setPayingItem] = useState<TagihanSiswa | null>(null);
  const [selectedMetode, setSelectedMetode] = useState<MetodePembayaranTagihan>("Potong Tabungan Siswa");
  const [receiptItem, setReceiptItem] = useState<TagihanSiswa | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [autodebetFeedback, setAutodebetFeedback] = useState<string | null>(null);

  // Modals for Jenis Tagihan (Billing Categories)
  const [isJenisTagihanModalOpen, setIsJenisTagihanModalOpen] = useState(false);
  const [isFormJenisModalOpen, setIsFormJenisModalOpen] = useState(false);
  const [editingJenisTagihan, setEditingJenisTagihan] = useState<JenisTagihan | null>(null);
  const [isDeleteJenisModalOpen, setIsDeleteJenisModalOpen] = useState(false);
  const [deletingJenisTagihan, setDeletingJenisTagihan] = useState<JenisTagihan | null>(null);
  const [fallbackDeleteKategori, setFallbackDeleteKategori] = useState("Lainnya");

  // Form State for Jenis Tagihan
  const [jenisFormData, setJenisFormData] = useState({
    nama: "",
    kode: "",
    nominalDefault: 100000,
    keterangan: "",
    warnaBadge: "blue",
  });

  // Form Buat Tagihan
  const [createType, setCreateType] = useState<"single" | "bulk">("bulk");
  const [formData, setFormData] = useState({
    siswaId: siswaList[0]?.id || "",
    kelas: kelasList[0]?.nama || "X MIPA 1",
    judul: "Iuran Kegiatan Outing Class",
    kategori: (jenisTagihanList[0]?.nama || "SPP") as KategoriTagihan,
    nominal: 150000,
    jatuhTempo: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    keterangan: "Biaya transportasi, tiket edukasi & makan siang",
  });

  const canManage = user?.role === "admin" || user?.role === "guru" || user?.role === "bendahara";

  // Dynamic Kategori List from Master Jenis Tagihan
  const kategoriList: string[] = [
    "Semua",
    ...jenisTagihanList.map((j) => j.nama),
  ];

  const filteredTagihan = sppList.filter((item) => {
    const matchSearch =
      item.siswaNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nisn.includes(searchTerm) ||
      item.judul.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKategori = selectedKategori === "Semua" || item.kategori === selectedKategori;
    const matchStatus = selectedStatus === "Semua" || item.status === selectedStatus;
    const matchKelas = selectedKelas === "Semua" || item.kelas === selectedKelas;
    return matchSearch && matchKategori && matchStatus && matchKelas;
  });

  // Metrics
  const totalTagihan = sppList.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalLunas = sppList
    .filter((s) => s.status === "Lunas")
    .reduce((acc, curr) => acc + curr.nominal, 0);
  const totalMenunggak = sppList
    .filter((s) => s.status !== "Lunas")
    .reduce((acc, curr) => acc + curr.nominal, 0);
  const totalViaTabungan = sppList
    .filter((s) => s.status === "Lunas" && s.metodePembayaran === "Potong Tabungan Siswa")
    .reduce((acc, curr) => acc + curr.nominal, 0);

  // Handle Create Bill
  const handleCreateTagihan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || formData.nominal <= 0) return;

    if (createType === "bulk") {
      bulkAddTagihan(
        formData.kelas,
        formData.judul,
        formData.kategori,
        Number(formData.nominal),
        formData.jatuhTempo,
        formData.keterangan
      );
      alert(`Tagihan "${formData.judul}" berhasil diterbitkan untuk seluruh siswa kelas ${formData.kelas}!`);
    } else {
      const targetSiswa = siswaList.find((s) => s.id === formData.siswaId);
      if (!targetSiswa) return;

      addTagihan({
        siswaId: targetSiswa.id,
        siswaNama: targetSiswa.nama,
        nisn: targetSiswa.nisn,
        kelas: targetSiswa.kelas,
        judul: formData.judul,
        kategori: formData.kategori,
        nominal: Number(formData.nominal),
        jatuhTempo: formData.jatuhTempo,
        status: "Belum Lunas",
        keterangan: formData.keterangan,
      });
      alert(`Tagihan "${formData.judul}" berhasil diterbitkan untuk ${targetSiswa.nama}!`);
    }

    setIsCreateModalOpen(false);
  };

  // Pay bill
  const handleConfirmPay = () => {
    if (!payingItem) return;

    if (selectedMetode === "Potong Tabungan Siswa") {
      const res = bayarTagihanDariTabungan(payingItem.id, user?.name || "Petugas Tata Usaha");
      if (!res.success) {
        alert(res.message || "Gagal memotong saldo tabungan siswa.");
        return;
      }
    } else {
      bayarSPP(payingItem.id, selectedMetode);
    }

    const updated: TagihanSiswa = {
      ...payingItem,
      status: "Lunas",
      tanggalBayar: new Date().toISOString().split("T")[0],
      metodePembayaran: selectedMetode,
      noKuitansi: `KW-${selectedMetode === "Potong Tabungan Siswa" ? "TB-" : ""}${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
    };

    setPayingItem(null);
    setReceiptItem(updated);
  };

  // Direct 1-Click Pay from Tabungan
  const handlePayDirectFromSavings = (item: TagihanSiswa) => {
    const res = bayarTagihanDariTabungan(item.id, user?.name || "Petugas Tata Usaha");
    if (!res.success) {
      alert(res.message);
    } else {
      alert(`Tagihan "${item.judul}" sebesar ${formatRupiah(item.nominal)} berhasil dilunasi dari Tabungan ${item.siswaNama}!`);
    }
  };

  // Bulk Autodebet
  const handleBulkAutodebet = () => {
    if (confirm("Proses autodebet otomatis untuk semua tagihan tertunda yang saldo tabungannya mencukupi?")) {
      const result = bulkBayarTagihanDariTabungan(selectedKelas === "Semua" ? undefined : selectedKelas);
      setAutodebetFeedback(
        `Berhasil memproses autodebet! ${result.successCount} tagihan berhasil dilunasi otomatis dari tabungan siswa.`
      );
      setTimeout(() => setAutodebetFeedback(null), 6000);
    }
  };

  // Handlers for Jenis Tagihan (Billing Categories)
  const handleOpenAddJenis = () => {
    setEditingJenisTagihan(null);
    setJenisFormData({
      nama: "",
      kode: "",
      nominalDefault: 100000,
      keterangan: "",
      warnaBadge: "blue",
    });
    setIsFormJenisModalOpen(true);
  };

  const handleOpenEditJenis = (jt: JenisTagihan) => {
    setEditingJenisTagihan(jt);
    setJenisFormData({
      nama: jt.nama,
      kode: jt.kode,
      nominalDefault: jt.nominalDefault || 0,
      keterangan: jt.keterangan || "",
      warnaBadge: jt.warnaBadge || "blue",
    });
    setIsFormJenisModalOpen(true);
  };

  const handleSaveJenisTagihan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisFormData.nama.trim()) {
      alert("Nama jenis tagihan tidak boleh kosong!");
      return;
    }

    if (editingJenisTagihan) {
      if (
        jenisFormData.nama.trim().toLowerCase() !== editingJenisTagihan.nama.toLowerCase() &&
        jenisTagihanList.some(
          (j) =>
            j.id !== editingJenisTagihan.id &&
            j.nama.toLowerCase() === jenisFormData.nama.trim().toLowerCase()
        )
      ) {
        alert(`Jenis tagihan dengan nama "${jenisFormData.nama}" sudah ada!`);
        return;
      }

      updateJenisTagihan(editingJenisTagihan.id, {
        nama: jenisFormData.nama.trim(),
        kode: jenisFormData.kode.trim().toUpperCase() || jenisFormData.nama.trim().slice(0, 3).toUpperCase(),
        nominalDefault: Number(jenisFormData.nominalDefault),
        keterangan: jenisFormData.keterangan.trim(),
        warnaBadge: jenisFormData.warnaBadge,
      });
      setAutodebetFeedback(`Jenis tagihan "${jenisFormData.nama}" berhasil diperbarui!`);
    } else {
      if (
        jenisTagihanList.some(
          (j) => j.nama.toLowerCase() === jenisFormData.nama.trim().toLowerCase()
        )
      ) {
        alert(`Jenis tagihan dengan nama "${jenisFormData.nama}" sudah ada!`);
        return;
      }

      addJenisTagihan({
        nama: jenisFormData.nama.trim(),
        kode: jenisFormData.kode.trim().toUpperCase() || jenisFormData.nama.trim().slice(0, 3).toUpperCase(),
        nominalDefault: Number(jenisFormData.nominalDefault),
        keterangan: jenisFormData.keterangan.trim(),
        warnaBadge: jenisFormData.warnaBadge,
      });
      setAutodebetFeedback(`Jenis tagihan baru "${jenisFormData.nama}" berhasil ditambahkan!`);
    }

    setIsFormJenisModalOpen(false);
    setEditingJenisTagihan(null);
    setTimeout(() => setAutodebetFeedback(null), 5000);
  };

  const handleOpenDeleteJenis = (jt: JenisTagihan) => {
    setDeletingJenisTagihan(jt);
    const otherJt = jenisTagihanList.find((j) => j.id !== jt.id);
    setFallbackDeleteKategori(otherJt ? otherJt.nama : "Lainnya");
    setIsDeleteJenisModalOpen(true);
  };

  const handleConfirmDeleteJenis = () => {
    if (!deletingJenisTagihan) return;
    const billCount = sppList.filter((s) => s.kategori === deletingJenisTagihan.nama).length;
    deleteJenisTagihan(deletingJenisTagihan.id, fallbackDeleteKategori);

    if (billCount > 0) {
      setAutodebetFeedback(
        `Jenis tagihan "${deletingJenisTagihan.nama}" dihapus. Sebanyak ${billCount} tagihan dialihkan ke kategori "${fallbackDeleteKategori}".`
      );
    } else {
      setAutodebetFeedback(`Jenis tagihan "${deletingJenisTagihan.nama}" berhasil dihapus.`);
    }

    setIsDeleteJenisModalOpen(false);
    setDeletingJenisTagihan(null);
    setTimeout(() => setAutodebetFeedback(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="h-7 w-7 text-emerald-600" />
            <span>Sistem Tagihan & Keuangan Sekolah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan tagihan terpadu (SPP, Gedung, Seragam, Modul, Study Tour) dengan integrasi <strong>Autodebet Tabungan Siswa</strong>.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Kelola Jenis Tagihan Button */}
            <button
              onClick={() => setIsJenisTagihanModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Tags className="h-4 w-4 text-indigo-500" />
              <span>Kelola Jenis Tagihan ({jenisTagihanList.length})</span>
            </button>

            {/* Bulk Autodebet from Savings button */}
            <button
              onClick={handleBulkAutodebet}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
              <span>⚡ Autodebet dari Tabungan</span>
            </button>

            {/* Create New Bill Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Tagihan Baru</span>
            </button>
          </div>
        )}
      </div>

      {autodebetFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{autodebetFeedback}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Tagihan Terbit</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalTagihan)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{sppList.length} total tagihan</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Penerimaan Lunas</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(totalLunas)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Kas sekolah terverifikasi</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Sisa Tagihan Tertunda</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatRupiah(totalMenunggak)}
            </p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Belum terbayar</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pelunasan via Tabungan</p>
            <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
              {formatRupiah(totalViaTabungan)}
            </p>
            <p className="text-[11px] text-teal-600 mt-1 font-medium flex items-center gap-1">
              <PiggyBank className="h-3.5 w-3.5" />
              <span>Autodebet sukses</span>
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
            <PiggyBank className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {kategoriList.map((kat) => (
          <button
            key={kat}
            onClick={() => setSelectedKategori(kat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              selectedKategori === kat
                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari siswa, NISN, atau judul tagihan..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="Semua">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.nama}>
                {k.nama}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Belum Lunas">Belum Lunas</option>
            <option value="Jatuh Tempo">Jatuh Tempo</option>
          </select>

          <span className="text-xs text-slate-500 ml-auto md:ml-2">
            Total: <strong>{filteredTagihan.length}</strong> item
          </span>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Nama Siswa</th>
                <th className="px-4 py-3.5">Kelas</th>
                <th className="px-4 py-3.5">Rincian Tagihan</th>
                <th className="px-4 py-3.5">Nominal</th>
                <th className="px-4 py-3.5">Jatuh Tempo</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Metode Bayar</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTagihan.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada catatan tagihan pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredTagihan.map((item) => {
                  const studentTab = tabunganList.find((t) => t.siswaId === item.siswaId);
                  const studentSaldo = studentTab ? studentTab.saldo : 0;
                  const canPayWithSavings = item.status !== "Lunas" && studentSaldo >= item.nominal;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {item.siswaNama}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          NISN: {item.nisn}
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              studentSaldo >= item.nominal
                                ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            <PiggyBank className="h-3 w-3 text-teal-600 shrink-0" />
                            <span>Saldo Tabungan: {formatRupiah(studentSaldo)}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{item.kelas}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                            {item.kategori}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {item.judul}
                        </span>
                        {item.keterangan && (
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {item.keterangan}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {item.jatuhTempo ? formatDateIndo(item.jatuhTempo) : "-"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.status === "Lunas" ? (
                          <div>
                            <span
                              className={`text-[11px] font-bold block ${
                                item.metodePembayaran === "Potong Tabungan Siswa"
                                  ? "text-teal-600 dark:text-teal-400 flex items-center gap-1"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {item.metodePembayaran === "Potong Tabungan Siswa" && (
                                <PiggyBank className="h-3.5 w-3.5" />
                              )}
                              {item.metodePembayaran}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDateIndo(item.tanggalBayar || "")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {item.status === "Lunas" ? (
                          <button
                            onClick={() => setReceiptItem(item)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Kuitansi</span>
                          </button>
                        ) : (
                          <>
                            {/* Fast Direct Autodebet Button if savings balance is sufficient */}
                            {canPayWithSavings && canManage && (
                              <button
                                onClick={() => handlePayDirectFromSavings(item)}
                                title={`Potong langsung dari saldo tabungan ${item.siswaNama} (Saldo: ${formatRupiah(studentSaldo)})`}
                                className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs inline-flex items-center gap-1 transition-all"
                              >
                                <PiggyBank className="h-3.5 w-3.5 text-teal-600" />
                                <span>Potong Tabungan</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setPayingItem(item);
                                setSelectedMetode(canPayWithSavings ? "Potong Tabungan Siswa" : "Virtual Account");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Bayar</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BUAT TAGIHAN BARU (TUNGGAL ATAU 1 KELAS SEKALIGUS)               */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Penerbitan Tagihan Sekolah Baru
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Terbitkan tagihan SPP, seragam, buku, kegiatan, atau biaya lainnya ke siswa.
            </p>

            <form onSubmit={handleCreateTagihan} className="space-y-4 text-xs">
              {/* Target Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Penerbitan Tagihan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateType("bulk")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      createType === "bulk"
                        ? "bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Seluruh Siswa 1 Kelas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateType("single")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      createType === "single"
                        ? "bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Hanya 1 Siswa Tertentu</span>
                  </button>
                </div>
              </div>

              {createType === "bulk" ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Rombel Kelas Penerima:
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama} ({k.jumlahSiswa} Siswa)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Siswa:
                  </label>
                  <select
                    value={formData.siswaId}
                    onChange={(e) => setFormData({ ...formData, siswaId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {siswaList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas} - {s.nisn})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Kategori / Jenis Tagihan *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsJenisTagihanModalOpen(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Kelola Jenis</span>
                    </button>
                  </div>
                  <select
                    value={formData.kategori}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const foundJt = jenisTagihanList.find((j) => j.nama === selectedVal);
                      setFormData({
                        ...formData,
                        kategori: selectedVal as KategoriTagihan,
                        nominal: foundJt?.nominalDefault || formData.nominal,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {jenisTagihanList.map((jt) => (
                      <option key={jt.id} value={jt.nama}>
                        {jt.nama} {jt.kode ? `(${jt.kode})` : ""} {jt.nominalDefault ? `- ${formatRupiah(jt.nominalDefault)}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Tagihan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Tagihan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Modul Semester Ganjil TA 2025/2026"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batas Akhir (Jatuh Tempo) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.jatuhTempo}
                  onChange={(e) => setFormData({ ...formData, jatuhTempo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Rincian Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Keterangan mengenai item tagihan..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Terbitkan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BAYAR TAGIHAN (DENGAN PILIHAN UTAMA: POTONG TABUNGAN SISWA)     */}
      {/* ========================================================================= */}
      {payingItem && (() => {
        const studentTab = tabunganList.find((t) => t.siswaId === payingItem.siswaId);
        const studentSaldo = studentTab ? studentTab.saldo : 0;
        const isSavingsSufficient = studentSaldo >= payingItem.nominal;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setPayingItem(null)}
                className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Pelunasan Tagihan Sekolah
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Pilih metode pelunasan langsung menggunakan saldo tabungan atau kanal pembayaran bank.
              </p>

              {/* Bill Details Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Siswa:</span>
                  <strong className="text-slate-900 dark:text-white">{payingItem.siswaNama}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Judul Tagihan:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{payingItem.judul}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-medium text-blue-600">{payingItem.kategori}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-sm font-bold text-slate-900 dark:text-white">
                  <span>Nominal yang Harus Dibayar:</span>
                  <span className="text-emerald-600 font-mono">{formatRupiah(payingItem.nominal)}</span>
                </div>
              </div>

              {/* TABUNGAN SISWA AUTODEBET OPTION (HIGHLIGHTED) */}
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Metode Pembayaran Pilihan:
                </label>

                {/* Savings Autodebet Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMetode("Potong Tabungan Siswa")}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                    selectedMetode === "Potong Tabungan Siswa"
                      ? "border-teal-500 bg-teal-50/80 dark:bg-teal-950/50 ring-2 ring-teal-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                      <PiggyBank className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Potong dari Tabungan Siswa
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                          Autodebet Instan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Saldo Tabungan Tersedia:{" "}
                        <strong className="font-mono text-teal-700 dark:text-teal-400">
                          {formatRupiah(studentSaldo)}
                        </strong>
                      </p>

                      {isSavingsSufficient ? (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Saldo mencukupi! Sisa saldo setelah bayar: {formatRupiah(studentSaldo - payingItem.nominal)}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Saldo tabungan kurang Rp {(payingItem.nominal - studentSaldo).toLocaleString("id-ID")}.</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-1">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMetode === "Potong Tabungan Siswa"}
                      onChange={() => setSelectedMetode("Potong Tabungan Siswa")}
                      className="h-4 w-4 text-teal-600"
                    />
                  </div>
                </button>
              </div>

              {/* Other Payment Methods */}
              <div className="space-y-2 mb-6">
                <p className="text-[11px] font-semibold text-slate-400">Atau Pilih Kanal Lainnya:</p>
                {[
                  { id: "Virtual Account", icon: Building2, desc: "BCA / Mandiri / BNI / BRI VA" },
                  { id: "QRIS", icon: QrCode, desc: "Scan instan via GoPay, OVO, Dana, QRIS" },
                  { id: "Transfer Bank", icon: CreditCard, desc: "Transfer manual ke Bendahara Sekolah" },
                  { id: "Tunai", icon: Wallet, desc: "Bayar tunai di loket tata usaha" },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedMetode(m.id as any)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedMetode === m.id
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100"
                        : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <m.icon className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{m.id}</p>
                        <p className="text-[10px] text-slate-400">{m.desc}</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMetode === m.id}
                      onChange={() => setSelectedMetode(m.id as any)}
                      className="h-4 w-4 text-emerald-600"
                    />
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedMetode === "Potong Tabungan Siswa" && !isSavingsSufficient}
                  onClick={handleConfirmPay}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {selectedMetode === "Potong Tabungan Siswa"
                      ? "Potong Saldo & Lunasi Sekarang"
                      : "Konfirmasi Pembayaran"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 3: KUITANSI RESMI PEMBAYARAN TAGIHAN                                 */}
      {/* ========================================================================= */}
      {receiptItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
              <span className="text-xs font-semibold text-slate-500">
                Kuitansi Sah Pembayaran Tagihan Sekolah
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Kuitansi</span>
                </button>
                <button
                  onClick={() => setReceiptItem(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Receipt Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-center gap-2.5 mb-1.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-sm uppercase leading-tight">{profile.namaSekolah}</h3>
                  <p className="text-[10px] text-slate-500">NPSN: {profile.npsn} • Status Terakreditasi A</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">{profile.alamat}</p>
            </div>

            {/* Receipt Title */}
            <div className="text-center mb-6">
              <h4 className="text-base font-bold underline">
                BUKTI PEMBAYARAN RESMI ({receiptItem.kategori.toUpperCase()})
              </h4>
              <p className="text-xs font-mono text-slate-500 mt-1">
                No. Kuitansi: <strong className="text-slate-900">{receiptItem.noKuitansi || "KW-202609-001"}</strong>
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Telah Diterima Dari:</span>
                <strong className="text-slate-900">{receiptItem.siswaNama}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">NISN / Kelas:</span>
                <span className="font-mono">{receiptItem.nisn} / {receiptItem.kelas}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Uraian Pembayaran:</span>
                <strong className="text-slate-900">{receiptItem.judul}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Kanal Pembayaran:</span>
                <span className="font-bold text-teal-700 flex items-center gap-1">
                  {receiptItem.metodePembayaran === "Potong Tabungan Siswa" && (
                    <PiggyBank className="h-3.5 w-3.5" />
                  )}
                  {receiptItem.metodePembayaran}
                </span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold text-slate-900">
                <span>Jumlah Lunas:</span>
                <span className="text-emerald-700 font-mono">{formatRupiah(receiptItem.nominal)}</span>
              </div>
            </div>

            {/* Signature */}
            <div className="flex justify-between items-end text-xs pt-4 border-t border-slate-200">
              <div className="text-[11px] text-slate-500">
                <p>Status: <strong className="text-emerald-700">LUNAS / VALID</strong></p>
                <p className="mt-0.5">Waktu Bayar: {formatDateIndo(receiptItem.tanggalBayar || "")}</p>
                <p className="text-[10px] text-slate-400 mt-2 italic">*Kuitansi digital ini diakui sebagai tanda bukti bayar sah.</p>
              </div>

              <div className="text-center">
                <p className="text-slate-500">Bendahara / Kasir Sekolah,</p>
                <div className="h-14" />
                <p className="font-bold underline">Hj. Maryati, S.E.</p>
                <p className="text-[10px] text-slate-400">NIP: 198005122005012003</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KELOLA MASTER JENIS TAGIHAN                       */}
      {/* ========================================================= */}
      {isJenisTagihanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Master Jenis & Kategori Tagihan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tambah jenis iuran baru, ubah nominal bawaan, atau hapus kategori tagihan sekolah.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsJenisTagihanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subheader / Action Bar */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total <strong>{jenisTagihanList.length}</strong> jenis tagihan terdaftar
              </div>
              <button
                onClick={handleOpenAddJenis}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm hover:shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jenis Tagihan Baru</span>
              </button>
            </div>

            {/* Table of Categories */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Nama Jenis Tagihan</th>
                      <th className="py-3 px-3">Kode</th>
                      <th className="py-3 px-4">Nominal Bawaan</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-3 text-center">Tagihan Terbit</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {jenisTagihanList.map((jt) => {
                      const billCount = sppList.filter((s) => s.kategori === jt.nama).length;
                      return (
                        <tr
                          key={jt.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20 transition"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span>{jt.nama}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {jt.kode || "-"}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-200">
                            {jt.nominalDefault ? formatRupiah(jt.nominalDefault) : "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {jt.keterangan || "-"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {billCount} tagihan
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditJenis(jt)}
                                title="Edit Jenis Tagihan"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteJenis(jt)}
                                title="Hapus Jenis Tagihan"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end">
              <button
                onClick={() => setIsJenisTagihanModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FORM TAMBAH / EDIT JENIS TAGIHAN                  */}
      {/* ========================================================= */}
      {isFormJenisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Tags className="w-4 h-4" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingJenisTagihan
                    ? `Edit Jenis: ${editingJenisTagihan.nama}`
                    : "Tambah Jenis Tagihan Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormJenisModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJenisTagihan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nama Jenis Tagihan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Infaq Musholla, Ekstrakurikuler Robotik"
                  value={jenisFormData.nama}
                  onChange={(e) =>
                    setJenisFormData({ ...jenisFormData, nama: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
                />
                {editingJenisTagihan && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    * Catatan: Mengubah nama jenis tagihan akan otomatis memperbarui seluruh tagihan terbit terkait.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Kode Singkatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: INF, EKS"
                    maxLength={6}
                    value={jenisFormData.kode}
                    onChange={(e) =>
                      setJenisFormData({
                        ...jenisFormData,
                        kode: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Nominal Default (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Contoh: 150000"
                    value={jenisFormData.nominalDefault}
                    onChange={(e) =>
                      setJenisFormData({
                        ...jenisFormData,
                        nominalDefault: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Keterangan / Penjelasan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat mengenai peruntukan jenis tagihan ini..."
                  value={jenisFormData.keterangan}
                  onChange={(e) =>
                    setJenisFormData({
                      ...jenisFormData,
                      keterangan: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormJenisModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm hover:shadow"
                >
                  {editingJenisTagihan ? "Simpan Perubahan" : "Tambahkan Jenis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI HAPUS JENIS TAGIHAN                     */}
      {/* ========================================================= */}
      {isDeleteJenisModalOpen && deletingJenisTagihan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
              Hapus Jenis Tagihan "{deletingJenisTagihan.nama}"?
            </h3>

            {(() => {
              const billCount = sppList.filter(
                (s) => s.kategori === deletingJenisTagihan.nama
              ).length;
              const remainingCategories = jenisTagihanList.filter(
                (j) => j.id !== deletingJenisTagihan.id
              );

              return (
                <div className="space-y-4">
                  {billCount > 0 ? (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Perhatian: Digunakan oleh {billCount} Tagihan!</span>
                      </div>
                      <p>
                        Jenis tagihan ini saat ini masih digunakan oleh{" "}
                        <strong>{billCount} lembar tagihan</strong>. Silakan pilih kategori pengalihan:
                      </p>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Alihkan Tagihan Terkait Ke:
                        </label>
                        <select
                          value={fallbackDeleteKategori}
                          onChange={(e) => setFallbackDeleteKategori(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-800 dark:text-slate-200"
                        >
                          {remainingCategories.map((j) => (
                            <option key={j.id} value={j.nama}>
                              {j.nama}
                            </option>
                          ))}
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                      Jenis tagihan ini belum digunakan oleh tagihan manapun. Tindakan ini akan menghapus opsi jenis tagihan ini dari sistem.
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteJenisModalOpen(false);
                        setDeletingJenisTagihan(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteJenis}
                      className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
                    >
                      Ya, Hapus Jenis
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
