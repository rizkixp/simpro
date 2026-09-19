"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Kelas, Siswa } from "@/types/school";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  LayoutGrid,
  List,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Printer,
} from "lucide-react";

export default function KelasManagementPage() {
  const { user } = useAuth();
  const { kelasList, addKelas, updateKelas, deleteKelas, guruList, addGuru, siswaList, jadwalList } =
    useSchoolData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTingkat, setSelectedTingkat] = useState("Semua");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);

  // Wali Kelas Input Mode State
  const [waliInputMode, setWaliInputMode] = useState<"manual" | "select">("manual");
  const [manualNip, setManualNip] = useState("");
  const [autoRegisterGuru, setAutoRegisterGuru] = useState(true);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingKelas, setDeletingKelas] = useState<Kelas | null>(null);
  const [targetTransferKelas, setTargetTransferKelas] = useState("");

  const [selectedDetailKelas, setSelectedDetailKelas] = useState<Kelas | null>(null);
  const [detailSearchTerm, setDetailSearchTerm] = useState("");

  // Toast / Feedback state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    tingkat: "X",
    waliKelasId: "",
    waliKelasNama: "",
    kapasitas: 36,
    ruangan: "",
  });

  const canManage = user?.role === "admin" || user?.role === "guru";

  // Enrolled count helper
  const getEnrolledCount = (namaKelas: string) => {
    return siswaList.filter((s) => s.kelas === namaKelas).length;
  };

  // Distinct tingkat list for filter
  const tingkatOptions = Array.from(new Set(kelasList.map((k) => k.tingkat))).sort();

  // Filtered classes
  const filteredKelas = kelasList.filter((k) => {
    const matchSearch =
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.waliKelasNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTingkat = selectedTingkat === "Semua" || k.tingkat === selectedTingkat;
    return matchSearch && matchTingkat;
  });

  // KPI Calculations
  const totalRombel = kelasList.length;
  const totalKapasitas = kelasList.reduce((acc, curr) => acc + (curr.kapasitas || 0), 0);
  const totalSiswaAktif = siswaList.length;
  const persentaseKeterisian =
    totalKapasitas > 0 ? Math.round((totalSiswaAktif / totalKapasitas) * 100) : 0;

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    setEditingKelas(null);
    setWaliInputMode("manual");
    setManualNip("");
    setAutoRegisterGuru(true);
    setFormData({
      nama: "",
      tingkat: "X",
      waliKelasId: "",
      waliKelasNama: "",
      kapasitas: 36,
      ruangan: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (kelas: Kelas) => {
    setEditingKelas(kelas);
    const existingGuru = guruList.find((g) => g.id === kelas.waliKelasId);
    setManualNip(existingGuru?.nip || "");
    setAutoRegisterGuru(false);
    setWaliInputMode(kelas.waliKelasId && existingGuru ? "select" : "manual");
    setFormData({
      nama: kelas.nama,
      tingkat: kelas.tingkat,
      waliKelasId: kelas.waliKelasId,
      waliKelasNama: kelas.waliKelasNama,
      kapasitas: kelas.kapasitas,
      ruangan: kelas.ruangan,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      showNotification("Nama kelas tidak boleh kosong!", "error");
      return;
    }

    // Resolve final wali kelas data based on mode
    let finalWaliId = formData.waliKelasId;
    let finalWaliNama = formData.waliKelasNama.trim();

    if (waliInputMode === "select") {
      if (formData.waliKelasId) {
        const g = guruList.find((item) => item.id === formData.waliKelasId);
        if (g) {
          finalWaliNama = `${g.nama}${g.gelar ? `, ${g.gelar}` : ""}`;
        }
      } else {
        finalWaliNama = "Belum Ditentukan";
      }
    } else {
      // Manual input mode
      if (finalWaliNama && finalWaliNama !== "Belum Ditentukan") {
        // Check if teacher with same name already exists in guruList
        const existingGuru = guruList.find(
          (g) => g.nama.toLowerCase() === finalWaliNama.toLowerCase()
        );
        if (existingGuru) {
          finalWaliId = existingGuru.id;
          finalWaliNama = `${existingGuru.nama}${existingGuru.gelar ? `, ${existingGuru.gelar}` : ""}`;
        } else if (autoRegisterGuru) {
          // Auto-register this teacher into Guru & Staf
          const newGuruId = `gur-${Date.now()}`;
          finalWaliId = newGuruId;
          addGuru({
            nama: finalWaliNama,
            nip: manualNip.trim() || `198${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
            gelar: "",
            jenisKelamin: "L",
            mataPelajaran: ["Umum"],
            kelasWali: formData.nama.trim(),
            pendidikanTerakhir: "S1 Pendidikan",
            statusKepegawaian: "PNS",
            email: `${finalWaliNama.toLowerCase().replace(/[^a-z0-9]/g, "")}@sekolah.id`,
            noHp: "0812-3456-7890",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalWaliNama)}`,
          });
        } else {
          finalWaliId = "";
        }
      } else {
        finalWaliId = "";
        finalWaliNama = "Belum Ditentukan";
      }
    }

    if (editingKelas) {
      // Check duplicate name if changed
      if (
        formData.nama !== editingKelas.nama &&
        kelasList.some((k) => k.id !== editingKelas.id && k.nama.toLowerCase() === formData.nama.toLowerCase())
      ) {
        showNotification(`Nama kelas "${formData.nama}" sudah digunakan!`, "error");
        return;
      }

      // Auto-infer tingkat from class name if not explicitly set
      const inferredTingkat = (() => {
        if (editingKelas && editingKelas.tingkat) return editingKelas.tingkat;
        const clean = formData.nama.trim().toUpperCase();
        if (clean.startsWith("XII")) return "XII";
        if (clean.startsWith("XI")) return "XI";
        if (clean.startsWith("X")) return "X";
        if (clean.startsWith("9")) return "9";
        if (clean.startsWith("8")) return "8";
        if (clean.startsWith("7")) return "7";
        return clean.split(/[\s-_]+/)[0] || "Reguler";
      })();

      updateKelas(editingKelas.id, {
        nama: formData.nama.trim(),
        tingkat: inferredTingkat,
        waliKelasId: finalWaliId,
        waliKelasNama: finalWaliNama,
        kapasitas: Number(formData.kapasitas),
        ruangan: formData.ruangan.trim(),
      });
      showNotification(`Data kelas "${formData.nama}" berhasil diperbarui!`);
    } else {
      // Check duplicate name
      if (kelasList.some((k) => k.nama.toLowerCase() === formData.nama.toLowerCase())) {
        showNotification(`Nama kelas "${formData.nama}" sudah ada!`, "error");
        return;
      }

      // Auto-infer tingkat from class name
      const inferredTingkat = (() => {
        const clean = formData.nama.trim().toUpperCase();
        if (clean.startsWith("XII")) return "XII";
        if (clean.startsWith("XI")) return "XI";
        if (clean.startsWith("X")) return "X";
        if (clean.startsWith("9")) return "9";
        if (clean.startsWith("8")) return "8";
        if (clean.startsWith("7")) return "7";
        return clean.split(/[\s-_]+/)[0] || "Reguler";
      })();

      addKelas({
        nama: formData.nama.trim(),
        tingkat: inferredTingkat,
        waliKelasId: finalWaliId,
        waliKelasNama: finalWaliNama,
        kapasitas: Number(formData.kapasitas),
        ruangan: formData.ruangan.trim(),
      });
      showNotification(
        `Kelas baru "${formData.nama}" dengan wali kelas "${finalWaliNama}" berhasil ditambahkan!`
      );
    }

    setIsFormOpen(false);
  };

  // Handlers for Delete
  const handleOpenDelete = (kelas: Kelas) => {
    setDeletingKelas(kelas);
    // Suggest first other class as transfer target
    const otherKelas = kelasList.find((k) => k.id !== kelas.id);
    setTargetTransferKelas(otherKelas ? otherKelas.nama : "Belum Ditentukan");
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingKelas) return;

    const enrolledStudents = getEnrolledCount(deletingKelas.nama);
    deleteKelas(deletingKelas.id, targetTransferKelas);

    if (enrolledStudents > 0) {
      showNotification(
        `Kelas "${deletingKelas.nama}" dihapus. Sebanyak ${enrolledStudents} siswa telah dialihkan ke "${targetTransferKelas}".`
      );
    } else {
      showNotification(`Kelas "${deletingKelas.nama}" berhasil dihapus.`);
    }

    setIsDeleteOpen(false);
    setDeletingKelas(null);
  };

  // Students in selected detail class
  const detailStudents = selectedDetailKelas
    ? siswaList.filter(
        (s) =>
          s.kelas === selectedDetailKelas.nama &&
          (s.nama.toLowerCase().includes(detailSearchTerm.toLowerCase()) ||
            s.nisn.includes(detailSearchTerm))
      )
    : [];

  if (user?.role === "guru") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Akses Tidak Tersedia untuk Guru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Menu Data Kelas dikhususkan untuk Administrator sekolah. Pada mode peran Guru, Anda dapat langsung mengelola kegiatan pembelajaran, presensi, dan e-rapor pada kelas binaan Anda.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            Kembali ke Dashboard Utama
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl transition-all duration-300 border ${
            notification.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-600/20"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-1">
            <Building2 className="w-4 h-4" />
            <span>Manajemen Rombongan Belajar</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Data Kelas & Ruangan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pengaturan rombongan belajar, kapasitas ruang kelas, penugasan wali kelas, serta distribusi siswa.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm hover:shadow active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Rombel
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalRombel} <span className="text-xs font-normal text-slate-400">Kelas</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              T.A. 2024/2025 Aktif
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Kuota Murid
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalKapasitas} <span className="text-xs font-normal text-slate-400">Murid</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Rata-rata {totalRombel ? Math.round(totalKapasitas / totalRombel) : 0} siswa/rombel
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Siswa Terdistribusi
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalSiswaAktif} <span className="text-xs font-normal text-slate-400">Siswa</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Terdaftar di database
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tingkat Keterisian
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {persentaseKeterisian}%
            </div>
            <div className="w-24 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(persentaseKeterisian, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas atau wali kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Filter Tingkat */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
              Tingkat:
            </span>
            <select
              value={selectedTingkat}
              onChange={(e) => setSelectedTingkat(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-slate-300"
            >
              <option value="Semua">Semua Tingkat</option>
              {tingkatOptions.map((t) => (
                <option key={t} value={t}>
                  Tingkat {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl self-end md:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kartu Grid</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabel Detail</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredKelas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Tidak ada kelas yang ditemukan
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedTingkat !== "Semua"
              ? "Coba sesuaikan kata kunci pencarian atau filter tingkat yang dipilih."
              : "Belum ada rombongan belajar yang terdaftar. Klik tombol 'Tambah Kelas Baru' untuk mulai."}
          </p>
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kelas Baru</span>
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKelas.map((kelas) => {
            const enrolled = getEnrolledCount(kelas.nama);
            const kapasitas = kelas.kapasitas || 36;
            const percentage = Math.round((enrolled / kapasitas) * 100);
            const isFull = enrolled >= kapasitas;

            // Find assigned guru details for photo
            const waliGuru = guruList.find((g) => g.id === kelas.waliKelasId);

            return (
              <div
                key={kelas.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          Tingkat {kelas.tingkat}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {kelas.id}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {kelas.nama}
                      </h3>
                    </div>
                  </div>

                  {/* Wali Kelas Section */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Wali Kelas</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          waliGuru?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            kelas.waliKelasNama || "Guru"
                          )}`
                        }
                        alt={kelas.waliKelasNama}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-white"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {kelas.waliKelasNama || "Belum Ditentukan"}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {waliGuru?.nip ? `NIP: ${waliGuru.nip}` : "Wali Rombel Aktif"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kapasitas & Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Jumlah Murid
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {enrolled} / {kapasitas} Murid ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? "bg-rose-500"
                            : percentage >= 80
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span
                        className={
                          isFull
                            ? "text-rose-600 dark:text-rose-400 font-semibold"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {isFull ? "Penuh (0 kuota)" : `Tersedia ${kapasitas - enrolled} kursi`}
                      </span>
                      <span className="text-slate-400">
                        {jadwalList.filter((j) => j.kelas === kelas.nama).length} Jam Mapel
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedDetailKelas(kelas);
                      setDetailSearchTerm("");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Lihat Siswa ({enrolled})</span>
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(kelas)}
                        title="Edit Kelas"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(kelas)}
                        title="Hapus Kelas"
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Nama Kelas</th>
                  <th className="py-3.5 px-4">Tingkat</th>
                  <th className="py-3.5 px-4">Wali Kelas</th>
                  <th className="py-3.5 px-4 text-center">Jumlah Murid</th>
                  <th className="py-3.5 px-4">Status Kuota</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredKelas.map((kelas) => {
                  const enrolled = getEnrolledCount(kelas.nama);
                  const kapasitas = kelas.kapasitas || 36;
                  const isFull = enrolled >= kapasitas;
                  const waliGuru = guruList.find((g) => g.id === kelas.waliKelasId);

                  return (
                    <tr
                      key={kelas.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-500" />
                          <span>{kelas.nama}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {kelas.tingkat}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              waliGuru?.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                kelas.waliKelasNama || "Guru"
                              )}`
                            }
                            alt={kelas.waliKelasNama}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {kelas.waliKelasNama || "Belum Ditentukan"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        <span className="text-slate-900 dark:text-white font-bold">{enrolled}</span>
                        <span className="text-slate-400 text-xs"> / {kapasitas}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isFull
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                          }`}
                        >
                          {isFull ? "Penuh" : `Tersedia ${kapasitas - enrolled}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedDetailKelas(kelas);
                              setDetailSearchTerm("");
                            }}
                            title="Lihat Daftar Siswa"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(kelas)}
                                title="Edit Kelas"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(kelas)}
                                title="Hapus Kelas"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT KELAS                                */}
      {/* ========================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Building2 className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingKelas ? `Edit Data Kelas: ${editingKelas.nama}` : "Tambah Rombel Kelas Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Nama Kelas */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nama Kelas / Rombel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X MIPA 1, XI IPS 2, 7A"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
                />
                {editingKelas && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    * Catatan: Mengubah nama kelas akan otomatis memperbarui data siswa, jadwal KBM, dan absensi yang terafiliasi.
                  </p>
                )}
              </div>

              {/* Jumlah Murid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Jumlah Murid <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  placeholder="Contoh: 32 atau 36"
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({ ...formData, kapasitas: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Daya tampung / target jumlah murid pada rombel kelas ini.
                </p>
              </div>

              {/* Wali Kelas */}
              <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    <span>Penugasan Wali Kelas</span>
                  </label>
                  <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 text-xs font-medium self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setWaliInputMode("manual")}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        waliInputMode === "manual"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      ✍️ Input Nama Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaliInputMode("select")}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        waliInputMode === "select"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      📋 Pilih dari Daftar Guru
                    </button>
                  </div>
                </div>

                {waliInputMode === "manual" ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Nama Lengkap & Gelar Wali Kelas
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd. / Budi Santoso, S.Kom."
                        value={formData.waliKelasNama}
                        onChange={(e) => setFormData({ ...formData, waliKelasNama: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Ketik langsung nama wali kelas yang bertugas untuk rombel ini.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          NIP / NUPTK (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 198503152010011002"
                          value={manualNip}
                          onChange={(e) => setManualNip(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder-slate-400"
                        />
                      </div>
                      <div className="flex items-center sm:pt-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={autoRegisterGuru}
                            onChange={(e) => setAutoRegisterGuru(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Daftarkan juga ke direktori Guru & Staf</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <select
                      value={formData.waliKelasId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const found = guruList.find((g) => g.id === selectedId);
                        setFormData({
                          ...formData,
                          waliKelasId: selectedId,
                          waliKelasNama: found ? `${found.nama}${found.gelar ? `, ${found.gelar}` : ""}` : "",
                        });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
                    >
                      <option value="">— Belum Ditentukan —</option>
                      {guruList.map((guru) => (
                        <option key={guru.id} value={guru.id}>
                          {guru.nama}{guru.gelar ? `, ${guru.gelar}` : ""} {guru.nip ? `(NIP: ${guru.nip})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Nama belum ada di daftar dewan guru?</span>
                      <button
                        type="button"
                        onClick={() => setWaliInputMode("manual")}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Ketik nama wali kelas manual &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm hover:shadow"
                >
                  {editingKelas ? "Simpan Perubahan" : "Tambahkan Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI HAPUS KELAS                             */}
      {/* ========================================================= */}
      {isDeleteOpen && deletingKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
              Hapus Kelas {deletingKelas.nama}?
            </h3>

            {(() => {
              const enrolledCount = getEnrolledCount(deletingKelas.nama);
              const otherClasses = kelasList.filter((k) => k.id !== deletingKelas.id);

              return (
                <div className="space-y-4">
                  {enrolledCount > 0 ? (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Perhatian: Terdapat {enrolledCount} Siswa Aktif!</span>
                      </div>
                      <p>
                        Kelas ini saat ini menampung <strong>{enrolledCount} siswa</strong>. Silakan pilih kelas tujuan pengalihan siswa:
                      </p>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Alihkan Siswa Ke:
                        </label>
                        <select
                          value={targetTransferKelas}
                          onChange={(e) => setTargetTransferKelas(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-800 dark:text-slate-200"
                        >
                          {otherClasses.map((k) => (
                            <option key={k.id} value={k.nama}>
                              {k.nama} (Kapasitas: {getEnrolledCount(k.nama)}/{k.kapasitas})
                            </option>
                          ))}
                          <option value="Belum Ditentukan">Belum Ditentukan (Unassigned)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                      Kelas ini tidak memiliki siswa terdaftar. Jadwal pelajaran terkait juga akan dibersihkan. Tindakan ini tidak dapat dibatalkan.
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteOpen(false);
                        setDeletingKelas(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
                    >
                      Ya, Hapus Kelas
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL SISWA DI KELAS                             */}
      {/* ========================================================= */}
      {selectedDetailKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Daftar Siswa Rombel {selectedDetailKelas.nama}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Wali: {selectedDetailKelas.waliKelasNama || "-"}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailKelas(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter inside modal */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari siswa di kelas ini..."
                  value={detailSearchTerm}
                  onChange={(e) => setDetailSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total: <strong>{detailStudents.length}</strong> dari{" "}
                <strong>{selectedDetailKelas.kapasitas}</strong> kursi
              </div>
            </div>

            {/* Table of Enrolled Students */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailStudents.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {detailSearchTerm
                      ? "Tidak ada siswa yang cocok dengan pencarian."
                      : `Belum ada siswa yang ditempatkan di kelas ${selectedDetailKelas.nama}.`}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">NISN</th>
                      <th className="py-2.5 px-3 text-center">L/P</th>
                      <th className="py-2.5 px-3">Wali Murid</th>
                      <th className="py-2.5 px-3">No. HP Wali</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {detailStudents.map((siswa, idx) => (
                      <tr key={siswa.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <img
                            src={
                              siswa.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                siswa.nama
                              )}`
                            }
                            alt={siswa.nama}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{siswa.nama}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{siswa.nisn}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              siswa.jenisKelamin === "L"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                                : "bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400"
                            }`}
                          >
                            {siswa.jenisKelamin}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{siswa.namaWali || "-"}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {siswa.noHpWali || "-"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            {siswa.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Roster Kelas</span>
              </button>
              <button
                onClick={() => setSelectedDetailKelas(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
