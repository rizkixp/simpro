"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Guru } from "@/types/school";
import { INITIAL_GURU } from "@/lib/mock-data";
import { getStatusBadgeClass } from "@/lib/utils";
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Phone,
  Mail,
  BookOpen,
  LayoutGrid,
  List,
  RotateCcw,
  CheckCircle,
  Download,
  Award,
} from "lucide-react";

export default function GuruManagementPage() {
  const { user } = useAuth();
  const { guruList, addGuru, updateGuru, deleteGuru, kelasList } = useSchoolData();

  // Safe fallback to INITIAL_GURU if guruList is empty
  const allGuru = useMemo(() => {
    return guruList && guruList.length > 0 ? guruList : INITIAL_GURU;
  }, [guruList]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    gelar: "",
    jenisKelamin: "L" as "L" | "P",
    mataPelajaran: "",
    kelasWali: "",
    pendidikanTerakhir: "S1 Pendidikan",
    statusKepegawaian: "PNS" as "PNS" | "Tetap Yayasan" | "Honorer",
    email: "",
    noHp: "",
  });

  const canEdit = user?.role === "admin";

  const filteredGuru = useMemo(() => {
    return allGuru.filter((g) => {
      const nama = g.nama || "";
      const nip = g.nip || "";
      const mapelList = Array.isArray(g.mataPelajaran)
        ? g.mataPelajaran
        : typeof g.mataPelajaran === "string" && g.mataPelajaran
        ? [g.mataPelajaran]
        : [];

      const matchSearch =
        nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapelList.some((m) => String(m || "").toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        selectedStatus === "Semua" ||
        (g.statusKepegawaian && g.statusKepegawaian.toLowerCase() === selectedStatus.toLowerCase());

      return matchSearch && matchStatus;
    });
  }, [allGuru, searchTerm, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nip: `198${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
      nama: "",
      gelar: "S.Pd., M.Pd.",
      jenisKelamin: "L",
      mataPelajaran: "",
      kelasWali: "",
      pendidikanTerakhir: "S2 Pendidikan",
      statusKepegawaian: "PNS",
      email: "",
      noHp: "0812-",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (guru: Guru) => {
    setEditingId(guru.id);
    const mapelStr = Array.isArray(guru.mataPelajaran)
      ? guru.mataPelajaran.join(", ")
      : String(guru.mataPelajaran || "");
    setFormData({
      nip: guru.nip || "",
      nama: guru.nama || "",
      gelar: guru.gelar || "",
      jenisKelamin: guru.jenisKelamin || "L",
      mataPelajaran: mapelStr,
      kelasWali: guru.kelasWali || "",
      pendidikanTerakhir: guru.pendidikanTerakhir || "S1 Pendidikan",
      statusKepegawaian: guru.statusKepegawaian || "PNS",
      email: guru.email || "",
      noHp: guru.noHp || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nip) return;

    const existingMapel = editingId ? allGuru.find((g) => g.id === editingId)?.mataPelajaran : undefined;
    const mapelArray = formData.mataPelajaran
      ? formData.mataPelajaran.split(",").map((s) => s.trim()).filter(Boolean)
      : (existingMapel && existingMapel.length > 0 ? existingMapel : ["Umum"]);

    if (editingId) {
      updateGuru(editingId, {
        ...formData,
        mataPelajaran: mapelArray,
      });
      setNotice({
        type: "success",
        text: `Data guru ${formData.nama} berhasil diperbarui!`,
      });
    } else {
      addGuru({
        ...formData,
        mataPelajaran: mapelArray,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.nama)}`,
      });
      setNotice({
        type: "success",
        text: `Tenaga pendidik ${formData.nama} berhasil ditambahkan!`,
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data guru ${nama}?`)) {
      deleteGuru(id);
      setNotice({
        type: "success",
        text: `Data guru ${nama} berhasil dihapus.`,
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ["NIP,Nama Lengkap,Gelar,Jenis Kelamin,Mata Pelajaran,Wali Kelas,Pendidikan Terakhir,Status Kepegawaian,Email,No HP"];
    const rows = filteredGuru.map((g) => {
      const mapel = Array.isArray(g.mataPelajaran) ? g.mataPelajaran.join("; ") : String(g.mataPelajaran || "");
      return `"${g.nip}","${g.nama}","${g.gelar || ""}","${g.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}","${mapel}","${g.kelasWali || "-"}","${g.pendidikanTerakhir || ""}","${g.statusKepegawaian || ""}","${g.email || ""}","${g.noHp || ""}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data-guru-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user?.role === "guru") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Akses Tidak Tersedia untuk Guru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Menu direktori Guru & Staf tidak ditampilkan pada mode peran Guru. Anda dapat mengakses jadwal mengajar, presensi siswa, dan penilaian e-rapor kelas binaan Anda.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-emerald-600" />
            <span>Direktori Tenaga Pendidik & Staf</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar dewan guru pengampu mata pelajaran, NIP resmi, status kepegawaian, dan wali kelas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tenaga Pendidik</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              {notice.text}
            </span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama guru, NIP, atau mapel..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Status Kepegawaian</option>
            <option value="PNS">PNS</option>
            <option value="Tetap Yayasan">Tetap Yayasan</option>
            <option value="Honorer">Honorer</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Tampilan Tabel"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <span className="text-xs text-slate-500 ml-auto sm:ml-2">
            Total: <strong>{filteredGuru.length}</strong> guru
          </span>
        </div>
      </div>

      {/* Content: Empty State */}
      {filteredGuru.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
            Tidak ada data guru yang cocok
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm
              ? `Tidak ditemukan tenaga pendidik dengan kata kunci "${searchTerm}".`
              : "Belum ada tenaga pendidik pada filter status ini."}
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("Semua");
            }}
            className="mt-4 px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-200 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Tampilkan Semua Guru</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGuru.map((guru) => {
            const mapelList = Array.isArray(guru.mataPelajaran)
              ? guru.mataPelajaran
              : typeof guru.mataPelajaran === "string" && guru.mataPelajaran
              ? [guru.mataPelajaran]
              : ["Umum"];
            const avatarUrl =
              guru.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guru.nama || "Guru")}`;
            const cleanPhone = (guru.noHp || "").replace(/[^0-9]/g, "");

            return (
              <div
                key={guru.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt={guru.nama || "Guru"}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-sm"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {guru.nama}
                        </h3>
                        {guru.gelar && (
                          <p className="text-[11px] text-emerald-600 font-semibold">{guru.gelar}</p>
                        )}
                        <p className="text-[10px] font-mono text-slate-400">NIP: {guru.nip || "-"}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(guru.statusKepegawaian)}`}>
                      {guru.statusKepegawaian || "PNS"}
                    </span>
                  </div>

                  {/* Subject Badges */}
                  <div className="mb-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span>Mata Pelajaran:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {mapelList.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Extra Info */}
                  <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {guru.kelasWali && (
                      <p className="flex items-center justify-between">
                        <span>Wali Kelas:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400">{guru.kelasWali}</strong>
                      </p>
                    )}
                    <p className="flex items-center justify-between">
                      <span>Pendidikan:</span>
                      <span className="text-slate-700 dark:text-slate-300">{guru.pendidikanTerakhir || "-"}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {cleanPhone ? (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-emerald-600 flex items-center gap-1"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                    {guru.email ? (
                      <a
                        href={`mailto:${guru.email}`}
                        className="hover:text-blue-600 flex items-center gap-1"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email</span>
                      </a>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedGuru(guru)}
                      title="Lihat Detail Guru"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(guru)}
                          title="Edit Data"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(guru.id, guru.nama)}
                          title="Hapus Data"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Foto & Tenaga Pendidik</th>
                  <th className="px-4 py-3.5">NIP</th>
                  <th className="px-4 py-3.5">Mata Pelajaran</th>
                  <th className="px-4 py-3.5">Wali Kelas</th>
                  <th className="px-4 py-3.5">Pendidikan</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredGuru.map((guru) => {
                  const mapelList = Array.isArray(guru.mataPelajaran)
                    ? guru.mataPelajaran
                    : typeof guru.mataPelajaran === "string" && guru.mataPelajaran
                    ? [guru.mataPelajaran]
                    : ["Umum"];
                  const avatarUrl =
                    guru.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guru.nama || "Guru")}`;

                  return (
                    <tr key={guru.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img
                          src={avatarUrl}
                          alt={guru.nama || "Guru"}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {guru.nama}
                          </span>
                          {guru.gelar && (
                            <span className="text-[11px] text-slate-400 ml-1.5">{guru.gelar}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{guru.nip || "-"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {mapelList.map((m, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {guru.kelasWali || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{guru.pendidikanTerakhir || "-"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(guru.statusKepegawaian)}`}>
                          {guru.statusKepegawaian || "PNS"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => setSelectedGuru(guru)}
                          title="Lihat Profil"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(guru)}
                              title="Edit Data"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(guru.id, guru.nama)}
                              title="Hapus Data"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail Guru */}
      {selectedGuru && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedGuru(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img
                src={
                  selectedGuru.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedGuru.nama || "Guru")}`
                }
                alt={selectedGuru.nama}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-md"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedGuru.nama}{selectedGuru.gelar ? `, ${selectedGuru.gelar}` : ""}
                </h3>
                <p className="text-xs text-slate-500">
                  NIP: <span className="font-mono font-semibold">{selectedGuru.nip || "-"}</span>
                </p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(selectedGuru.statusKepegawaian)}`}>
                  Status: {selectedGuru.statusKepegawaian || "PNS"}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Mata Pelajaran:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                  {Array.isArray(selectedGuru.mataPelajaran)
                    ? selectedGuru.mataPelajaran.join(", ")
                    : selectedGuru.mataPelajaran || "Umum"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Tugas Wali Kelas:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {selectedGuru.kelasWali || "Tidak menjadi wali kelas"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Pendidikan Terakhir:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedGuru.pendidikanTerakhir || "-"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Email Resmi:</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {selectedGuru.email || "-"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Nomor Telepon / WhatsApp:</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  {selectedGuru.noHp || "-"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedGuru(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit Guru */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingId ? "Perbarui Data Guru" : "Tambah Tenaga Pendidik Baru"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {editingId
                ? "Perbarui rincian data kepegawaian tenaga pendidik."
                : "Lengkapi informasi kepegawaian tenaga pendidik baru."}
            </p>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP / No. Induk Pendidik *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Guru *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gelar Akademik
                  </label>
                  <input
                    type="text"
                    value={formData.gelar}
                    onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: S.Pd., M.Si."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={formData.statusKepegawaian}
                    onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PNS">PNS</option>
                    <option value="Tetap Yayasan">Tetap Yayasan</option>
                    <option value="Honorer">Honorer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tugas Wali Kelas (Opsional)
                  </label>
                  <select
                    value={formData.kelasWali}
                    onChange={(e) => setFormData({ ...formData, kelasWali: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Bukan Wali Kelas</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pendidikan Terakhir
                  </label>
                  <input
                    type="text"
                    value={formData.pendidikanTerakhir}
                    onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="S2 Pendidikan Matematika - ITB"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Resmi Sekolah
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="nama@sekolah.id"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder="0813-xxxx-xxxx"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Tenaga Pendidik"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

