"use client";

import React, { useState, useMemo } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  TahfidzRecord,
  JenisSetoranTahfidz,
  PredikatKelancaran,
  SurahJuz30Info,
} from "@/types/school";
import { SURAH_JUZ_30 } from "@/lib/mock-data";
import {
  BookOpen,
  Award,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
  Star,
  Clock,
  Filter,
  TrendingUp,
  Bookmark,
  Check,
  FileSpreadsheet,
} from "lucide-react";

export default function TahfidzPage() {
  const { user } = useAuth();
  const {
    tahfidzList,
    addTahfidzRecord,
    deleteTahfidzRecord,
    siswaList,
    kelasList,
    profile,
  } = useSchoolData();

  const [activeTab, setActiveTab] = useState<"jurnal" | "peta" | "cetak">("jurnal");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStudentForTracker, setSelectedStudentForTracker] = useState<string>(
    siswaList[0]?.id || "sis-001"
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [formSiswaId, setFormSiswaId] = useState<string>(siswaList[0]?.id || "");
  const [formTanggal, setFormTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formJenis, setFormJenis] = useState<JenisSetoranTahfidz>("Ziyadah (Hafalan Baru)");
  const [formJuz, setFormJuz] = useState<number>(30);
  const [formSurah, setFormSurah] = useState<string>("An-Naba'");
  const [formAyatMulai, setFormAyatMulai] = useState<number>(1);
  const [formAyatSelesai, setFormAyatSelesai] = useState<number>(10);
  const [formKelancaran, setFormKelancaran] = useState<PredikatKelancaran>("Mutqin (Sangat Lancar)");
  const [formNilaiMakhraj, setFormNilaiMakhraj] = useState<number>(90);
  const [formNilaiTajwid, setFormNilaiTajwid] = useState<number>(90);
  const [formCatatan, setFormCatatan] = useState<string>("");
  const [formUstadz, setFormUstadz] = useState<string>(
    user?.name || "Ustadz Ahmad Fauzi, Lc., S.Pd.I."
  );

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Filtered Jurnal
  const filteredRecords = useMemo(() => {
    return tahfidzList.filter((r) => {
      const matchKelas = selectedKelas === "all" || r.kelas === selectedKelas;
      const matchJenis = filterJenis === "all" || r.jenisSetoran === filterJenis;
      const matchSearch =
        searchQuery.trim() === "" ||
        r.siswaNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.surah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.nisn && r.nisn.includes(searchQuery));
      return matchKelas && matchJenis && matchSearch;
    });
  }, [tahfidzList, selectedKelas, filterJenis, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalSetoran = tahfidzList.length;
    const uniqueStudents = new Set(tahfidzList.map((r) => r.siswaId)).size;
    const mutqinCount = tahfidzList.filter((r) => r.kelancaran.includes("Mutqin")).length;
    const avgTajwid =
      totalSetoran > 0
        ? Math.round(tahfidzList.reduce((acc, c) => acc + c.nilaiTajwid, 0) / totalSetoran)
        : 0;
    return { totalSetoran, uniqueStudents, mutqinCount, avgTajwid };
  }, [tahfidzList]);

  // Tracker for Selected Student
  const studentTrackerData = useMemo(() => {
    const targetStudent = siswaList.find((s) => s.id === selectedStudentForTracker) || siswaList[0];
    const studentRecords = tahfidzList.filter((r) => r.siswaId === targetStudent?.id);

    const surahStatusMap: Record<string, { mutqin: boolean; highestTajwid: number; lastDate: string }> = {};
    studentRecords.forEach((r) => {
      const existing = surahStatusMap[r.surah];
      const isMutqin = r.kelancaran.includes("Mutqin") || r.kelancaran.includes("Jayyid Jiddan");
      if (!existing) {
        surahStatusMap[r.surah] = {
          mutqin: isMutqin,
          highestTajwid: r.nilaiTajwid,
          lastDate: r.tanggal,
        };
      } else {
        if (isMutqin) existing.mutqin = true;
        if (r.nilaiTajwid > existing.highestTajwid) existing.highestTajwid = r.nilaiTajwid;
      }
    });

    const mutqinSurahs = Object.keys(surahStatusMap).filter((s) => surahStatusMap[s].mutqin);
    const progressPercent = Math.round((mutqinSurahs.length / SURAH_JUZ_30.length) * 100);

    return {
      student: targetStudent,
      studentRecords,
      surahStatusMap,
      mutqinSurahsCount: mutqinSurahs.length,
      progressPercent,
    };
  }, [tahfidzList, selectedStudentForTracker, siswaList]);

  // Handle Submit Form
  const handleSubmitSetoran = (e: React.FormEvent) => {
    e.preventDefault();
    const student = siswaList.find((s) => s.id === formSiswaId);
    if (!student) return;

    addTahfidzRecord({
      siswaId: student.id,
      siswaNama: student.nama,
      nisn: student.nisn || "",
      kelas: student.kelas,
      tanggal: formTanggal,
      jenisSetoran: formJenis,
      juz: formJuz,
      surah: formSurah,
      ayatMulai: Number(formAyatMulai),
      ayatSelesai: Number(formAyatSelesai),
      kelancaran: formKelancaran,
      nilaiMakhraj: Number(formNilaiMakhraj),
      nilaiTajwid: Number(formNilaiTajwid),
      catatanUstadz: formCatatan.trim() || undefined,
      ustadzPengampu: formUstadz,
      ustadzId: user?.id,
    });

    setIsModalOpen(false);
    showNotification(`Setoran hafalan ${student.nama} (Surah ${formSurah}) berhasil disimpan!`);
  };

  const getKelancaranBadge = (k: PredikatKelancaran) => {
    if (k.includes("Mutqin")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    }
    if (k.includes("Jayyid Jiddan") || k.includes("Jayyid")) {
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    }
    if (k.includes("Maqbul")) {
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    }
    return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#063a2a] via-[#094d37] to-[#0a5e43] text-white p-6 sm:p-8 shadow-xl border border-emerald-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-300/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Program Unggulan Qur'ani SD Islam</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span>Jurnal Tahfidz & Tahsin Al-Qur'an</span>
              <span className="font-arabic text-xl sm:text-2xl font-normal text-emerald-200">القرآن الكريم</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Pencatatan setoran ziyadah & muraja'ah santri, pemantauan kelulusan 37 Surah Juz 30, evaluasi tajwid makharijul huruf, serta cetak lembar syahadah resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Setoran Baru</span>
            </button>

            <button
              onClick={() => setActiveTab("cetak")}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Lembar Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Total Setoran Tercatat</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>{stats.totalSetoran}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Ziyadah & Muraja'ah</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Santri Aktif Menyetor</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span>{stats.uniqueStudents}</span>
          </div>
          <span className="text-[10px] text-slate-400">Dari {siswaList.length} Santri Terdaftar</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Setoran Mutqin (Lancar)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span>{stats.mutqinCount}</span>
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">Predikat Sangat Lancar</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Rata-rata Nilai Tajwid</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span>{stats.avgTajwid} / 100</span>
          </div>
          <span className="text-[10px] text-purple-600 font-semibold">Makhraj & Tartil</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab("jurnal")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "jurnal"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Jurnal Setoran Harian</span>
        </button>

        <button
          onClick={() => setActiveTab("peta")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "peta"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Peta Capaian Juz 30 (37 Surah)</span>
        </button>

        <button
          onClick={() => setActiveTab("cetak")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "cetak"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Kartu Setoran & Syahadah</span>
        </button>
      </div>

      {/* TAB 1: JURNAL SETORAN */}
      {activeTab === "jurnal" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari santri, surah, atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>

              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">Semua Jenis Setoran</option>
                <option value="Ziyadah (Hafalan Baru)">Ziyadah (Hafalan Baru)</option>
                <option value="Muraja'ah (Mengulang)">Muraja'ah (Mengulang)</option>
                <option value="Ujian Tasmi'">Ujian Tasmi'</option>
                <option value="Tahsin (Iqra/Tilawati)">Tahsin (Iqra/Tilawati)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Santri & Kelas</th>
                    <th className="py-3 px-4">Surah & Ayat</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Kelancaran</th>
                    <th className="py-3 px-4">Nilai</th>
                    <th className="py-3 px-4">Ustadz & Evaluasi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Belum ada catatan setoran tahfidz yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {r.tanggal}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {r.siswaNama}
                          </div>
                          <div className="text-[11px] text-slate-400">{r.kelas} • NISN: {r.nisn}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">
                            {r.surah}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Ayat {r.ayatMulai} - {r.ayatSelesai} (Juz {r.juz})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {r.jenisSetoran.split(" ")[0]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getKelancaranBadge(
                              r.kelancaran
                            )}`}
                          >
                            {r.kelancaran}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-800 dark:text-slate-200 font-semibold">
                            Tajwid: <span className="text-emerald-600 font-bold">{r.nilaiTajwid}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">Makhraj: {r.nilaiMakhraj}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                            {r.ustadzPengampu}
                          </div>
                          {r.catatanUstadz && (
                            <p className="text-[11px] text-slate-400 italic line-clamp-2">
                              "{r.catatanUstadz}"
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Hapus catatan setoran ${r.siswaNama} - Surah ${r.surah}?`)) {
                                deleteTahfidzRecord(r.id);
                                showNotification("Catatan setoran berhasil dihapus.");
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Hapus setoran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* TAB 2: PETA CAPAIAN JUZ 30 */}
      {activeTab === "peta" && (
        <div className="space-y-6">
          {/* Student Selector Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pilih Santri untuk Memantau Progres Hafalan
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisasi kelulusan 37 Surah di Juz 30 (Al-Qur'an Al-Karim)
                </p>
              </div>

              <select
                value={selectedStudentForTracker}
                onChange={(e) => setSelectedStudentForTracker(e.target.value)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas})
                  </option>
                ))}
              </select>
            </div>

            {/* Student Progress Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/40 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/10 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
                  Capaian Juz 30 Santri
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {studentTrackerData.student?.nama}
                </div>
                <div className="text-xs text-slate-500">
                  {studentTrackerData.student?.kelas} • Telah menguasai{" "}
                  <b className="text-emerald-700 dark:text-emerald-300 font-bold">
                    {studentTrackerData.mutqinSurahsCount}
                  </b>{" "}
                  dari 37 Surah Juz 30
                </div>
              </div>

              <div className="w-full md:w-64 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Progres Kelulusan</span>
                  <span className="text-emerald-600">{studentTrackerData.progressPercent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${studentTrackerData.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid 37 Surahs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {SURAH_JUZ_30.map((surah) => {
              const status = studentTrackerData.surahStatusMap[surah.namaLatin];
              const isMutqin = status?.mutqin;

              return (
                <div
                  key={surah.nomorSurah}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isMutqin
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm"
                      : status
                      ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{surah.nomorSurah}
                    </span>
                    {isMutqin ? (
                      <span className="p-1 rounded-full bg-emerald-600 text-white shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : status ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        Ziyadah
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                    )}
                  </div>

                  <div className="mt-2 font-arabic text-lg font-bold text-right text-emerald-900 dark:text-emerald-300">
                    {surah.namaArab}
                  </div>

                  <div className="mt-1">
                    <div className="font-bold text-xs text-slate-800 dark:text-white truncate">
                      {surah.namaLatin}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {surah.jumlahAyat} Ayat • {surah.arti}
                    </div>
                  </div>

                  {status && (
                    <div className="mt-2 pt-2 border-t border-inherit text-[10px] flex justify-between items-center text-slate-500">
                      <span>Nilai: <b className="text-emerald-600">{status.highestTajwid}</b></span>
                      <span>{status.lastDate.split("-").slice(1).join("/")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LEMBAR CETAK */}
      {activeTab === "cetak" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pilih Santri:</span>
              <select
                value={selectedStudentForTracker}
                onChange={(e) => setSelectedStudentForTracker(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Rapor Tahfidz (Print / PDF)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const XLSX = await import("xlsx");
                    if (!studentTrackerData.student) return;
                    const s = studentTrackerData.student;
                    const rows: (string | number)[][] = [
                      [profile.namaSekolah.toUpperCase()],
                      [`NPSN: ${profile.npsn} • Akreditasi: ${profile.akreditasi}`],
                      [`${profile.alamat} • Telp: ${profile.telepon}`],
                      [""],
                      ["LEMBAR MUTABA'AH & SYAHADAH HAFALAN AL-QUR'AN (RAPOR TAHFIDZ)"],
                      [`Tahun Ajaran: ${profile.tahunAjaranAktif} • Semester: ${profile.semesterAktif}`],
                      [""],
                      ["Nama Santri", `: ${s.nama}`, "", "Kelas / Rombel", `: ${s.kelas}`],
                      ["NISN", `: ${s.nisn || "-"}`, "", "Target Capaian", ": Juz 30 (Al-Qur'an Al-Karim)"],
                      [""],
                      ["No", "Tanggal", "Surah", "Ayat", "Kelancaran", "Nilai Tajwid", "Ustadz Pengampu"],
                    ];

                    if (studentTrackerData.studentRecords.length === 0) {
                      rows.push(["-", "Belum ada catatan setoran untuk santri ini", "-", "-", "-", "-", "-"]);
                    } else {
                      studentTrackerData.studentRecords.forEach((rec, i) => {
                        rows.push([
                          i + 1,
                          rec.tanggal,
                          `Surah ${rec.surah}`,
                          `${rec.ayatMulai} - ${rec.ayatSelesai}`,
                          rec.kelancaran,
                          rec.nilaiTajwid,
                          rec.ustadzPengampu,
                        ]);
                      });
                    }

                    rows.push([""]);
                    rows.push(["", "", "", "", "Mengetahui,"]);
                    rows.push(["Koordinator Tahfidz Al-Qur'an", "", "", "", `Kepala Sekolah ${profile.namaSekolah}`]);
                    rows.push([""]);
                    rows.push([""]);
                    rows.push(["Ustadz Ahmad Fauzi, Lc.", "", "", "", profile.kepalaSekolah]);
                    rows.push(["NIP. 199004082015042008", "", "", "", `NPSN. ${profile.npsn}`]);

                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    ws["!cols"] = [
                      { wch: 6 },
                      { wch: 14 },
                      { wch: 24 },
                      { wch: 14 },
                      { wch: 16 },
                      { wch: 14 },
                      { wch: 28 },
                    ];
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Rapor Tahfidz");
                    const fileName = `Rapor_Tahfidz_${s.nama.replace(/[/\\?%*:|"<>]/g, "_")}_${s.kelas.replace(/[/\\?%*:|"<>]/g, "_")}.xlsx`;
                    XLSX.writeFile(wb, fileName);
                  } catch (err: any) {
                    alert(`Gagal mengekspor Rapor Tahfidz: ${err?.message || err}`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all flex items-center gap-2 cursor-pointer"
                title="Ekspor lembar rapor tahfidz santri ini ke file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Printable Sheet */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-lg max-w-3xl mx-auto space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none">
            {/* Kop Surat */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase text-slate-900">
                {profile.namaSekolah}
              </h2>
              <p className="text-xs text-slate-600">
                NPSN: {profile.npsn} • Akreditasi: {profile.akreditasi}
              </p>
              <p className="text-xs text-slate-500 italic">
                {profile.alamat} • Telp: {profile.telepon}
              </p>
              <div className="pt-2">
                <span className="px-4 py-1 rounded-full bg-slate-100 text-slate-900 font-extrabold text-xs uppercase tracking-wider border border-slate-300">
                  LEMBAR MUTABA'AH & SYAHADAH HAFALAN AL-QUR'AN
                </span>
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Nama Santri:</span>
                <p className="font-bold text-sm text-slate-900">{studentTrackerData.student?.nama}</p>
                <span className="text-slate-500">NISN:</span>
                <p className="font-mono font-semibold">{studentTrackerData.student?.nisn || "-"}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Kelas / Rombel:</span>
                <p className="font-bold text-sm text-slate-900">{studentTrackerData.student?.kelas}</p>
                <span className="text-slate-500">Target Capaian:</span>
                <p className="font-semibold text-emerald-700">Juz 30 (Al-Qur'an Al-Karim)</p>
              </div>
            </div>

            {/* Table of Records */}
            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                  <th className="py-2 px-3 border-r border-slate-300">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Tanggal</th>
                  <th className="py-2 px-3 border-r border-slate-300">Surah & Ayat</th>
                  <th className="py-2 px-3 border-r border-slate-300">Kelancaran</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nilai Tajwid</th>
                  <th className="py-2 px-3">Ustadz Pengampu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentTrackerData.studentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">
                      Belum ada catatan setoran untuk santri ini.
                    </td>
                  </tr>
                ) : (
                  studentTrackerData.studentRecords.map((rec, i) => (
                    <tr key={rec.id}>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-mono">{i + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-300">{rec.tanggal}</td>
                      <td className="py-2 px-3 border-r border-slate-300 font-semibold">
                        Surah {rec.surah} ({rec.ayatMulai}-{rec.ayatSelesai})
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">{rec.kelancaran}</td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">{rec.nilaiTajwid}</td>
                      <td className="py-2 px-3">{rec.ustadzPengampu}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Signature Box */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-semibold text-slate-800">Koordinator Tahfidz Al-Qur'an</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Ustadz Ahmad Fauzi, Lc.</p>
                <p className="text-[10px] text-slate-400">NIP. 199004082015042008</p>
              </div>

              <div>
                <p className="text-slate-500">Jakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="font-semibold text-slate-800">Kepala Sekolah SD Islam</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">{profile.kepalaSekolah}</p>
                <p className="text-[10px] text-slate-400">NPSN. {profile.npsn}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INPUT SETORAN BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Catat Setoran Hafalan Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">Simpan ke jurnal tahfidz & cloud database</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitSetoran} className="space-y-4 text-xs">
              {/* Pilih Santri */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Santri
                </label>
                <select
                  value={formSiswaId}
                  onChange={(e) => setFormSiswaId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Jenis Setoran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jenis Setoran
                  </label>
                  <select
                    value={formJenis}
                    onChange={(e) => setFormJenis(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Ziyadah (Hafalan Baru)">Ziyadah (Hafalan Baru)</option>
                    <option value="Muraja'ah (Mengulang)">Muraja'ah (Mengulang)</option>
                    <option value="Ujian Tasmi'">Ujian Tasmi'</option>
                    <option value="Tahsin (Iqra/Tilawati)">Tahsin (Iqra/Tilawati)</option>
                  </select>
                </div>
              </div>

              {/* Surah & Rentang Ayat */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Surah
                  </label>
                  <select
                    value={formSurah}
                    onChange={(e) => setFormSurah(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {SURAH_JUZ_30.map((s) => (
                      <option key={s.nomorSurah} value={s.namaLatin}>
                        {s.nomorSurah}. {s.namaLatin}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Ayat Mulai
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formAyatMulai}
                    onChange={(e) => setFormAyatMulai(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Ayat Selesai
                  </label>
                  <input
                    type="number"
                    min={formAyatMulai}
                    value={formAyatSelesai}
                    onChange={(e) => setFormAyatSelesai(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Kelancaran & Nilai */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kelancaran
                  </label>
                  <select
                    value={formKelancaran}
                    onChange={(e) => setFormKelancaran(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Mutqin (Sangat Lancar)">Mutqin (Sangat Lancar)</option>
                    <option value="Jayyid Jiddan (Lancar Sekali)">Jayyid Jiddan (Lancar Sekali)</option>
                    <option value="Jayyid (Lancar)">Jayyid (Lancar)</option>
                    <option value="Maqbul (Cukup)">Maqbul (Cukup)</option>
                    <option value="Dhaif (Perlu Diulang)">Dhaif (Perlu Diulang)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nilai Makhraj (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formNilaiMakhraj}
                    onChange={(e) => setFormNilaiMakhraj(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nilai Tajwid (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formNilaiTajwid}
                    onChange={(e) => setFormNilaiTajwid(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Catatan Ustadz */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Evaluasi Ustadz
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Perhatikan hukum mad dan ikhfa'..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Ustadz Pengampu */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ustadz / Asatidz Pengampu
                </label>
                <input
                  type="text"
                  value={formUstadz}
                  onChange={(e) => setFormUstadz(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20"
                >
                  Simpan Catatan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
