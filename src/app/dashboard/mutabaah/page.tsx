"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import {
  MutabaahRecord,
  MutabaahShalatWajib,
  MutabaahIbadahSunnah,
  MutabaahAkhlakKarakter,
  Siswa,
} from "@/types/school";
import {
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Star,
  Award,
  Save,
  Check,
  Search,
  Users,
  Flame,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Eye,
  X,
  Shield,
} from "lucide-react";

export default function MutabaahPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const {
    mutabaahList,
    addOrUpdateMutabaahRecord,
    verifyMutabaahRecord,
    siswaList,
    kelasList,
  } = useSchoolData();

  // Active view tab: list (default) | input | evaluasi
  const [activeTab, setActiveTab] = useState<"list" | "input" | "evaluasi">("list");

  // Filter & scope states
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Class list options (combining kelasList and distinct classes in siswaList)
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    kelasList.forEach((k) => {
      if (k.nama && k.nama.trim()) classSet.add(k.nama.trim());
    });
    siswaList.forEach((s) => {
      if (s.kelas && s.kelas.trim()) classSet.add(s.kelas.trim());
    });
    return Array.from(classSet).sort();
  }, [kelasList, siswaList]);

  // Default selected class: teacherScope assigned class if teacher, else "Semua"
  const defaultKelas = useMemo(() => {
    if (teacherScope.isTeacher && teacherScope.assignedClass) {
      return teacherScope.assignedClass;
    }
    return "Semua";
  }, [teacherScope]);

  const [selectedKelas, setSelectedKelas] = useState<string>(defaultKelas);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sudah" | "belum" | "bintang">("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal State for quick input / editing mutaba'ah per student
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSiswa, setModalSiswa] = useState<Siswa | null>(null);

  // Detail Modal State
  const [detailSiswaData, setDetailSiswaData] = useState<{
    siswa: Siswa;
    record?: MutabaahRecord;
  } | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Base list of students filtered by scope & selected class
  const classStudents = useMemo(() => {
    let base = siswaList;
    if (teacherScope.isTeacher && teacherScope.assignedClass) {
      base = siswaList.filter(
        (s) => s.kelas?.trim().toLowerCase() === teacherScope.assignedClass!.trim().toLowerCase()
      );
      return base;
    }

    if (selectedKelas === "Semua") {
      return base;
    }

    return base.filter(
      (s) => s.kelas?.trim().toLowerCase() === selectedKelas.trim().toLowerCase()
    );
  }, [siswaList, selectedKelas, teacherScope]);

  // Selected student for standalone checklist tab
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(
    classStudents[0]?.id || siswaList[0]?.id || "sis-001"
  );

  // Keep selectedSiswaId valid when class students change
  useEffect(() => {
    if (classStudents.length > 0) {
      const exists = classStudents.some((s) => s.id === selectedSiswaId);
      if (!exists) {
        setSelectedSiswaId(classStudents[0].id);
      }
    }
  }, [classStudents, selectedSiswaId]);

  // Helper to find mutabaah record for any student on the chosen date
  const getStudentRecord = (siswaId: string): MutabaahRecord | undefined => {
    return mutabaahList.find(
      (m) => m.siswaId === siswaId && m.tanggal === selectedDate
    );
  };

  // KPI Metrics for selected class on selectedDate
  const metrics = useMemo(() => {
    const total = classStudents.length;
    let sudahCount = 0;
    let bintangCount = 0;
    let totalScore = 0;

    classStudents.forEach((s) => {
      const rec = getStudentRecord(s.id);
      if (rec) {
        sudahCount++;
        totalScore += rec.skorKebaikan;
        if (rec.statusVerifikasi.includes("Bintang")) {
          bintangCount++;
        }
      }
    });

    const belumCount = Math.max(0, total - sudahCount);
    const avgScore = sudahCount > 0 ? Math.round(totalScore / sudahCount) : 0;
    const completionRate = total > 0 ? Math.round((sudahCount / total) * 100) : 0;

    return {
      total,
      sudahCount,
      belumCount,
      bintangCount,
      avgScore,
      completionRate,
    };
  }, [classStudents, mutabaahList, selectedDate]);

  // Displayed students for the table/list (applying search and status filter)
  const displayedStudents = useMemo(() => {
    return classStudents.filter((s) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        (s.kelas && s.kelas.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Status filter
      const rec = getStudentRecord(s.id);
      if (statusFilter === "sudah") return !!rec;
      if (statusFilter === "belum") return !rec;
      if (statusFilter === "bintang") return rec?.statusVerifikasi.includes("Bintang");

      return true;
    });
  }, [classStudents, searchQuery, statusFilter, mutabaahList, selectedDate]);

  // Form State for standalone checklist (Tab 2) or Modal
  const currentRecord = useMemo(() => {
    return getStudentRecord(selectedSiswaId);
  }, [mutabaahList, selectedSiswaId, selectedDate]);

  const [shalat, setShalat] = useState<MutabaahShalatWajib>({
    subuh: "Berjamaah di Masjid",
    dzuhur: "Berjamaah di Masjid/Sekolah",
    ashar: "Berjamaah di Masjid",
    maghrib: "Berjamaah di Masjid",
    isya: "Berjamaah di Masjid",
  });

  const [sunnah, setSunnah] = useState<MutabaahIbadahSunnah>({
    shalatDhuha: true,
    qiyamulLail: false,
    rawatib: true,
    tilawahQuran: true,
    jumlahHalamanTilawah: 2,
    dzikirPagiPetang: true,
    puasaSunnah: false,
    infaqShadaqah: true,
  });

  const [akhlak, setAkhlak] = useState<MutabaahAkhlakKarakter>({
    birrulWalidain: true,
    merapikanTempatTidur: true,
    belajarMandiri: true,
    adabMakanMinum: true,
  });

  const [catatanOrtu, setCatatanOrtu] = useState<string>("");
  const [catatanGuruForm, setCatatanGuruForm] = useState<string>("");

  // Sync form when selected student or date changes
  useEffect(() => {
    if (currentRecord) {
      setShalat(currentRecord.shalatWajib);
      setSunnah(currentRecord.ibadahSunnah);
      setAkhlak(currentRecord.akhlakKarakter);
      setCatatanOrtu(currentRecord.catatanOrangTua || "");
      setCatatanGuruForm(currentRecord.catatanGuru || "");
    } else {
      setShalat({
        subuh: "Munfarid Tepat Waktu",
        dzuhur: "Berjamaah di Masjid/Sekolah",
        ashar: "Munfarid Tepat Waktu",
        maghrib: "Berjamaah di Masjid",
        isya: "Munfarid Tepat Waktu",
      });
      setSunnah({
        shalatDhuha: false,
        qiyamulLail: false,
        rawatib: false,
        tilawahQuran: true,
        jumlahHalamanTilawah: 1,
        dzikirPagiPetang: true,
        puasaSunnah: false,
        infaqShadaqah: false,
      });
      setAkhlak({
        birrulWalidain: true,
        merapikanTempatTidur: true,
        belajarMandiri: true,
        adabMakanMinum: true,
      });
      setCatatanOrtu("");
      setCatatanGuruForm("");
    }
  }, [currentRecord, selectedSiswaId, selectedDate]);

  // Score calculation
  const calculateScoreFromState = (
    sShalat: MutabaahShalatWajib,
    sSunnah: MutabaahIbadahSunnah,
    sAkhlak: MutabaahAkhlakKarakter
  ) => {
    let score = 0;
    const shalatScore = (val: string) => {
      if (val.includes("Berjamaah")) return 12;
      if (val.includes("Tepat Waktu")) return 10;
      if (val.includes("Masbuq")) return 7;
      return 0;
    };
    score += shalatScore(sShalat.subuh);
    score += shalatScore(sShalat.dzuhur);
    score += shalatScore(sShalat.ashar);
    score += shalatScore(sShalat.maghrib);
    score += shalatScore(sShalat.isya);

    if (sSunnah.shalatDhuha) score += 5;
    if (sSunnah.qiyamulLail) score += 6;
    if (sSunnah.rawatib) score += 4;
    if (sSunnah.tilawahQuran) score += 5;
    if (sSunnah.dzikirPagiPetang) score += 4;
    if (sSunnah.puasaSunnah) score += 6;
    if (sSunnah.infaqShadaqah) score += 4;

    if (sAkhlak.birrulWalidain) score += 4;
    if (sAkhlak.merapikanTempatTidur) score += 2;
    if (sAkhlak.belajarMandiri) score += 2;
    if (sAkhlak.adabMakanMinum) score += 2;

    return Math.min(100, score);
  };

  const calculatedScore = useMemo(() => {
    return calculateScoreFromState(shalat, sunnah, akhlak);
  }, [shalat, sunnah, akhlak]);

  // Handle Save Standalone Form
  const handleSaveMutabaah = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const student = siswaList.find((s) => s.id === selectedSiswaId);
    if (!student) return;

    addOrUpdateMutabaahRecord({
      siswaId: student.id,
      siswaNama: student.nama,
      nisn: student.nisn || "",
      kelas: student.kelas,
      tanggal: selectedDate,
      shalatWajib: shalat,
      ibadahSunnah: sunnah,
      akhlakKarakter: akhlak,
      catatanOrangTua: catatanOrtu.trim() || undefined,
      skorKebaikan: calculatedScore,
      statusVerifikasi: currentRecord?.statusVerifikasi || "Menunggu Verifikasi",
      catatanGuru: catatanGuruForm.trim() || currentRecord?.catatanGuru,
      verifiedByGuru: currentRecord?.verifiedByGuru,
    });

    showNotification(
      `Mutaba'ah harian ${student.nama} (${student.kelas}) berhasil disimpan! (Skor: ${calculatedScore})`
    );
  };

  // Quick Teacher Verify
  const handleVerify = (recordId: string, withStar: boolean) => {
    const guruNama = user?.name || "Ustadz Pembina";
    const status = withStar ? "Diberi Bintang Kebaikan" : "Terverifikasi Guru";
    const catatan = withStar
      ? "Barakallahu fiik, terus istiqamah menjaga shalat dan birrul walidain! ⭐⭐⭐"
      : "Alhamdulillah sudah diperiksa dan disetujui.";
    verifyMutabaahRecord(recordId, guruNama, catatan, status);
    showNotification(
      withStar
        ? "Berhasil diverifikasi dengan Bintang Kebaikan! ⭐"
        : "Mutaba'ah berhasil diverifikasi."
    );
  };

  // Open Modal to Input/Edit for a specific student
  const handleOpenInputModal = (siswa: Siswa) => {
    setSelectedSiswaId(siswa.id);
    setModalSiswa(siswa);
    setIsModalOpen(true);
  };

  // Navigate next/previous student in class
  const handleNextStudent = () => {
    const currentIndex = classStudents.findIndex((s) => s.id === selectedSiswaId);
    if (currentIndex >= 0 && currentIndex < classStudents.length - 1) {
      setSelectedSiswaId(classStudents[currentIndex + 1].id);
    }
  };

  const handlePrevStudent = () => {
    const currentIndex = classStudents.findIndex((s) => s.id === selectedSiswaId);
    if (currentIndex > 0) {
      setSelectedSiswaId(classStudents[currentIndex - 1].id);
    }
  };

  const currentStudentIndex = classStudents.findIndex((s) => s.id === selectedSiswaId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-emerald-400/40">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c3d2e] via-[#11523f] to-[#156951] text-white p-6 sm:p-8 shadow-xl border border-emerald-700/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-300/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buku Penghubung Ibadah Yaumiyah Digital</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span>Mutaba'ah Ibadah Santri</span>
              <span className="font-arabic text-xl sm:text-2xl font-normal text-emerald-200">
                متابعة العبادة
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Monitoring pembiasaan shalat 5 waktu berjamaah, ibadah sunnah harian, membaca
              Al-Qur'an, dan adab birrul walidain santri berbasis rombel kelas secara terpadu.
            </p>
          </div>

          {/* Quick Filter Control Box (Kelas & Tanggal) */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Class Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-emerald-200 font-semibold block flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Pilihan Kelas:
              </label>
              {teacherScope.isTeacher && teacherScope.assignedClass ? (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-400/40 text-emerald-200 font-bold text-xs">
                  {teacherScope.assignedClass}
                </div>
              ) : (
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  <option value="Semua">Semua Kelas ({siswaList.length} Siswa)</option>
                  {availableClasses.map((cls) => {
                    const count = siswaList.filter(
                      (s) => s.kelas?.trim().toLowerCase() === cls.toLowerCase()
                    ).length;
                    return (
                      <option key={cls} value={cls}>
                        {cls} ({count} Siswa)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Date Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-emerald-200 font-semibold block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Ibadah:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Homeroom Scope Banner if applicable */}
      {teacherScope.isTeacher && teacherScope.assignedClass && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                <span>Wali Kelas: {teacherScope.assignedClass}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 font-bold">
                  {teacherScope.teacherName}
                </span>
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Menampilkan daftar siswa dan mutaba'ah untuk rombel binaan Anda ({classStudents.length} santri).
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-300 dark:border-emerald-700">
            Akses Rombel Terkunci
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "list"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Siswa & Rekap Kelas ({classStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("input")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "input"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Formulir Checklist Mandiri</span>
        </button>

        <button
          onClick={() => setActiveTab("evaluasi")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "evaluasi"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Grafik & Konsistensi Santri</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR SISWA & REKAP KELAS (PRIMARY REQUESTED VIEW)                */}
      {/* ========================================================================= */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* Summary KPI Cards for the Selected Class */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Siswa */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Total Santri di Kelas
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {metrics.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {selectedKelas === "Semua" ? "Seluruh Rombel" : selectedKelas}
              </div>
            </div>

            {/* Sudah Mengisi */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Mengisi
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {metrics.sudahCount}{" "}
                <span className="text-xs font-semibold text-emerald-500">
                  ({metrics.completionRate}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tercatat tanggal {selectedDate}</div>
            </div>

            {/* Belum Mengisi */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Belum Mengisi
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {metrics.belumCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Menunggu input wali / santri</div>
            </div>

            {/* Rata-rata Skor */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 shadow-xs">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block uppercase tracking-wider">
                Rata-rata Skor
              </span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {metrics.avgScore}{" "}
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Indeks kebaikan harian</div>
            </div>

            {/* Bintang Kebaikan */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> Bintang Guru
              </span>
              <div className="text-2xl font-black text-amber-500 mt-1">
                {metrics.bintangCount}{" "}
                <span className="text-xs font-semibold text-slate-400">Santri</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Apresiasi istiqamah</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama santri atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                {[
                  { key: "all", label: "Semua" },
                  { key: "sudah", label: "Sudah Isi" },
                  { key: "belum", label: "Belum Isi" },
                  { key: "bintang", label: "Bintang ⭐" },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      statusFilter === st.key
                        ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium self-end md:self-center">
              Menampilkan <b>{displayedStudents.length}</b> dari {classStudents.length} siswa
            </div>
          </div>

          {/* Student Table & Other Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Nama Siswa & NISN</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Status Input</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Shalat Fardhu 5 Waktu</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Amalan Sunnah & Tilawah</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Karakter & Akhlak</th>
                    <th className="py-3.5 px-4 text-center min-w-[100px]">Skor</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Status Verifikasi</th>
                    <th className="py-3.5 px-4 text-center min-w-[150px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-sm">Tidak ada santri yang sesuai filter.</p>
                          <p className="text-xs">
                            Coba ubah kata kunci pencarian atau pilih filter kelas lainnya.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((siswa, idx) => {
                      const record = getStudentRecord(siswa.id);
                      const isFilled = !!record;

                      return (
                        <tr
                          key={siswa.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* 1. No */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* 2. Nama Siswa & Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {siswa.nama.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{siswa.nama}</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      siswa.jenisKelamin === "L"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                        : "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
                                    }`}
                                  >
                                    {siswa.jenisKelamin}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {siswa.kelas} • NISN: {siswa.nisn || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Status Input */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isFilled ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Sudah Mengisi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Belum Mengisi</span>
                              </span>
                            )}
                          </td>

                          {/* 4. Shalat Fardhu 5 Waktu */}
                          <td className="py-3.5 px-4">
                            {record ? (
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    { name: "Subuh", val: record.shalatWajib.subuh },
                                    { name: "Dzuhur", val: record.shalatWajib.dzuhur },
                                    { name: "Ashar", val: record.shalatWajib.ashar },
                                    { name: "Maghrib", val: record.shalatWajib.maghrib },
                                    { name: "Isya", val: record.shalatWajib.isya },
                                  ].map((sh) => (
                                    <span
                                      key={sh.name}
                                      title={`${sh.name}: ${sh.val}`}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                        sh.val.includes("Berjamaah")
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                                          : sh.val.includes("Tepat Waktu")
                                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300"
                                          : sh.val.includes("Masbuq")
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-rose-50 text-rose-700 border-rose-200"
                                      }`}
                                    >
                                      {sh.name}: {sh.val.split(" ")[0]}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 5. Amalan Sunnah & Tilawah */}
                          <td className="py-3.5 px-4">
                            {record ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {record.ibadahSunnah.shalatDhuha && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                    Dhuha
                                  </span>
                                )}
                                {record.ibadahSunnah.tilawahQuran && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                    Tilawah ({record.ibadahSunnah.jumlahHalamanTilawah || 1} Hal)
                                  </span>
                                )}
                                {record.ibadahSunnah.dzikirPagiPetang && (
                                  <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                                    Dzikir
                                  </span>
                                )}
                                {record.ibadahSunnah.qiyamulLail && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                                    Tahajjud
                                  </span>
                                )}
                                {record.ibadahSunnah.infaqShadaqah && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                    Infaq
                                  </span>
                                )}
                                {record.ibadahSunnah.puasaSunnah && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                                    Puasa
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 6. Akhlak Karakter */}
                          <td className="py-3.5 px-4">
                            {record ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {record.akhlakKarakter.birrulWalidain && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                    Bantu Ortu
                                  </span>
                                )}
                                {record.akhlakKarakter.merapikanTempatTidur && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                    Rapikan Kasur
                                  </span>
                                )}
                                {record.akhlakKarakter.belajarMandiri && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-medium">
                                    Belajar Mandiri
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 7. Skor Kebaikan */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {record ? (
                              <div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  {record.skorKebaikan}
                                </span>
                                <span className="text-[10px] text-slate-400 block">/ 100</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </td>

                          {/* 8. Status Verifikasi */}
                          <td className="py-3.5 px-4">
                            {record ? (
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    record.statusVerifikasi.includes("Bintang")
                                      ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                      : record.statusVerifikasi.includes("Guru")
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {record.statusVerifikasi.includes("Bintang") && (
                                    <Star className="w-3 h-3 fill-amber-500 shrink-0" />
                                  )}
                                  {record.statusVerifikasi}
                                </span>
                                {record.catatanOrangTua && (
                                  <p className="text-[10px] text-slate-400 truncate max-w-[140px]" title={record.catatanOrangTua}>
                                    Ortu: "{record.catatanOrangTua}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 9. Aksi */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Input or Edit Mutaba'ah */}
                              <button
                                type="button"
                                onClick={() => handleOpenInputModal(siswa)}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs ${
                                  isFilled
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                                title={isFilled ? "Edit Mutaba'ah" : "Input Mutaba'ah Hari Ini"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{isFilled ? "Edit" : "Input"}</span>
                              </button>

                              {/* Star Verify button if filled and not starred */}
                              {isFilled && !record.statusVerifikasi.includes("Bintang") && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(record.id, true)}
                                  className="p-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] shadow-xs"
                                  title="Verifikasi & Beri Bintang Kebaikan ⭐"
                                >
                                  <Star className="w-3.5 h-3.5 fill-slate-950" />
                                </button>
                              )}

                              {/* View Detail button */}
                              {isFilled && (
                                <button
                                  type="button"
                                  onClick={() => setDetailSiswaData({ siswa, record })}
                                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                  title="Lihat Detail Lengkap"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FORMULIR CHECKLIST MANDIRI (STANDALONE INPUT VIEW)                 */}
      {/* ========================================================================= */}
      {activeTab === "input" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student & Class Selector Bar */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    Santri yang Sedang Dinilai:
                  </span>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                    <span>{siswaList.find((s) => s.id === selectedSiswaId)?.nama}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {siswaList.find((s) => s.id === selectedSiswaId)?.kelas}
                    </span>
                  </div>
                </div>

                {/* Quick Prev / Next Student in Class */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentStudentIndex <= 0}
                    onClick={handlePrevStudent}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                    title="Siswa Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-500 px-1">
                    {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1} / {classStudents.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentStudentIndex >= classStudents.length - 1}
                    onClick={handleNextStudent}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                    title="Siswa Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Filter Class */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Filter Rombel Kelas:
                  </label>
                  <select
                    value={selectedKelas}
                    onChange={(e) => setSelectedKelas(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {availableClasses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Student within Class */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Pilih Nama Siswa:
                  </label>
                  <select
                    value={selectedSiswaId}
                    onChange={(e) => setSelectedSiswaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {classStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveMutabaah} className="space-y-6">
              {/* Bagian 1: Shalat Fardhu 5 Waktu */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>1. Shalat Fardhu 5 Waktu</span>
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                    Target Utama Berjamaah
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "subuh", label: "Shalat Subuh", icon: Sunrise, color: "text-amber-500" },
                    { key: "dzuhur", label: "Shalat Dzuhur", icon: Sun, color: "text-amber-600" },
                    { key: "ashar", label: "Shalat Ashar", icon: Sunset, color: "text-orange-500" },
                    { key: "maghrib", label: "Shalat Maghrib", icon: Sunset, color: "text-indigo-500" },
                    { key: "isya", label: "Shalat Isya", icon: Moon, color: "text-blue-500" },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div
                      key={key}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Berjamaah di Masjid",
                          "Munfarid Tepat Waktu",
                          "Masbuq/Terlambat",
                          "Tidak Shalat",
                        ].map((option) => (
                          <button
                            type="button"
                            key={option}
                            onClick={() => setShalat((prev) => ({ ...prev, [key]: option }))}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              (shalat as any)[key] === option
                                ? option.includes("Berjamaah")
                                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                                  : option.includes("Tepat Waktu")
                                  ? "bg-blue-600 text-white shadow-xs font-bold"
                                  : option.includes("Masbuq")
                                  ? "bg-amber-600 text-white font-bold"
                                  : "bg-rose-600 text-white font-bold"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {option.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagian 2: Ibadah Sunnah */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>2. Amalan & Ibadah Sunnah</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Pahala Tambahan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "shalatDhuha", label: "Shalat Dhuha (Pagi)" },
                    { key: "qiyamulLail", label: "Qiyamul Lail / Tahajjud" },
                    { key: "rawatib", label: "Shalat Sunnah Rawatib" },
                    { key: "tilawahQuran", label: "Tadarus Al-Qur'an / Iqra" },
                    { key: "dzikirPagiPetang", label: "Al-Ma'tsurat / Dzikir Pagi-Petang" },
                    { key: "puasaSunnah", label: "Puasa Sunnah (Senin/Kamis)" },
                    { key: "infaqShadaqah", label: "Infaq / Sedekah Subuh" },
                  ].map(({ key, label }) => {
                    const isChecked = (sunnah as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() =>
                          setSunnah((prev) => ({ ...prev, [key]: !isChecked }))
                        }
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {label}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isChecked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {sunnah.tilawahQuran && (
                  <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Jumlah Halaman / Lembar Tilawah Hari Ini:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={sunnah.jumlahHalamanTilawah || 1}
                      onChange={(e) =>
                        setSunnah((prev) => ({
                          ...prev,
                          jumlahHalamanTilawah: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Bagian 3: Akhlak & Karakter Di Rumah */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                    <span>3. Akhlak & Birrul Walidain (Di Rumah)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Karakter Mulia</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "birrulWalidain", label: "Membantu Ayah / Bunda di Rumah" },
                    { key: "merapikanTempatTidur", label: "Merapikan Kamar & Kasur Sendiri" },
                    { key: "belajarMandiri", label: "Mengulang Pelajaran & PR Mandiri" },
                    { key: "adabMakanMinum", label: "Adab Makan (Duduk & Baca Basmalah)" },
                  ].map(({ key, label }) => {
                    const isChecked = (akhlak as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() =>
                          setAkhlak((prev) => ({ ...prev, [key]: !isChecked }))
                        }
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {label}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isChecked
                              ? "bg-rose-600 border-rose-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Orang Tua & Guru */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Pesan & Catatan Orang Tua untuk Guru Kelas (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={catatanOrtu}
                    onChange={(e) => setCatatanOrtu(e.target.value)}
                    placeholder="Contoh: Ananda hari ini sangat antusias shalat subuh di masjid..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Umpan Balik / Catatan Guru Pembina
                  </label>
                  <input
                    type="text"
                    value={catatanGuruForm}
                    onChange={(e) => setCatatanGuruForm(e.target.value)}
                    placeholder="Contoh: Barakallahu fiik, terus istiqamah..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Mutaba'ah Hari Ini</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary Card (Live Score Meter & Status) */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Skor Kebaikan Hari Ini
                </span>
                <span className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </span>
              </div>

              <div className="text-center py-3">
                <div className="text-5xl font-black text-slate-900 dark:text-white">
                  {calculatedScore}
                </div>
                <div className="text-xs text-slate-400 mt-1">Dari Maksimal 100 Poin</div>
                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      calculatedScore >= 90
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : calculatedScore >= 75
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {calculatedScore >= 90
                      ? "Mumtaz! (Luar Biasa) ⭐"
                      : calculatedScore >= 75
                      ? "Jayyid Jiddan (Sangat Baik)"
                      : "Jayyid (Cukup Baik)"}
                  </span>
                </div>
              </div>

              {/* Status Verifikasi Guru */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Status Verifikasi Asatidz:
                </span>
                <div className="flex items-center gap-2">
                  {currentRecord?.statusVerifikasi.includes("Bintang") ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Star className="w-4 h-4 fill-amber-500" /> Diberi Bintang Kebaikan
                    </span>
                  ) : currentRecord?.statusVerifikasi.includes("Guru") ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Terverifikasi Guru
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Clock className="w-4 h-4" /> Menunggu Verifikasi
                    </span>
                  )}
                </div>

                {currentRecord?.catatanGuru && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                    "{currentRecord.catatanGuru}" — <b>{currentRecord.verifiedByGuru}</b>
                  </p>
                )}

                {/* Teacher verify button */}
                {currentRecord && !currentRecord.statusVerifikasi.includes("Bintang") && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleVerify(currentRecord.id, true)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Verifikasi & Beri Bintang ⭐</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GRAFIK & KONSISTENSI SANTRI                                       */}
      {/* ========================================================================= */}
      {activeTab === "evaluasi" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Konsistensi Shalat Berjamaah
              </span>
              <div className="text-3xl font-black text-emerald-600">88.2%</div>
              <p className="text-xs text-slate-500">
                Santri yang istiqamah shalat subuh dan maghrib berjamaah pekan ini.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Rata-rata Tilawah Santri
              </span>
              <div className="text-3xl font-black text-blue-600">2.6 Halaman / Hari</div>
              <p className="text-xs text-slate-500">
                Target capaian khatam Al-Qur'an dan kelancaran membaca santri.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Predikat Bintang Kebaikan
              </span>
              <div className="text-3xl font-black text-amber-500">
                {mutabaahList.filter((m) => m.statusVerifikasi.includes("Bintang")).length} Santri
              </div>
              <p className="text-xs text-slate-500">
                Santri penerima apresiasi bintang akhlak dan ibadah dari ustadz.
              </p>
            </div>
          </div>

          {/* Leaderboard Istiqamah */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Santri Paling Istiqamah Menjaga Ibadah Yaumiyah ({selectedKelas})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {classStudents.slice(0, 3).map((siswa, idx) => (
                <div
                  key={siswa.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-sm shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {siswa.nama}
                    </div>
                    <div className="text-[11px] text-slate-400">{siswa.kelas}</div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                      Skor Rata-rata: {98 - idx * 4} Poin ⭐
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT / EDIT MUTABA'AH LANGSUNG DARI TABEL                         */}
      {/* ========================================================================= */}
      {isModalOpen && modalSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {modalSiswa.nama.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm">{modalSiswa.nama}</div>
                  <div className="text-xs text-emerald-200 flex items-center gap-2">
                    <span>{modalSiswa.kelas}</span>
                    <span>•</span>
                    <span>Tanggal: {selectedDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-xl bg-white/20 text-white font-black text-xs">
                  Skor: {calculatedScore} / 100
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Shalat Fardhu 5 Waktu */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>1. Shalat Fardhu 5 Waktu</span>
                </h4>

                <div className="space-y-2">
                  {[
                    { key: "subuh", label: "Shalat Subuh" },
                    { key: "dzuhur", label: "Shalat Dzuhur" },
                    { key: "ashar", label: "Shalat Ashar" },
                    { key: "maghrib", label: "Shalat Maghrib" },
                    { key: "isya", label: "Shalat Isya" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {label}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          "Berjamaah di Masjid",
                          "Munfarid Tepat Waktu",
                          "Masbuq/Terlambat",
                          "Tidak Shalat",
                        ].map((option) => (
                          <button
                            type="button"
                            key={option}
                            onClick={() => setShalat((prev) => ({ ...prev, [key]: option }))}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              (shalat as any)[key] === option
                                ? option.includes("Berjamaah")
                                  ? "bg-emerald-600 text-white font-bold"
                                  : option.includes("Tepat Waktu")
                                  ? "bg-blue-600 text-white font-bold"
                                  : option.includes("Masbuq")
                                  ? "bg-amber-600 text-white font-bold"
                                  : "bg-rose-600 text-white font-bold"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {option.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amalan Sunnah */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>2. Amalan Sunnah Harian</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "shalatDhuha", label: "Shalat Dhuha" },
                    { key: "qiyamulLail", label: "Tahajjud / Qiyam" },
                    { key: "rawatib", label: "Sunnah Rawatib" },
                    { key: "tilawahQuran", label: "Tilawah Al-Qur'an" },
                    { key: "dzikirPagiPetang", label: "Dzikir Pagi-Petang" },
                    { key: "puasaSunnah", label: "Puasa Sunnah" },
                    { key: "infaqShadaqah", label: "Infaq / Sedekah" },
                  ].map(({ key, label }) => {
                    const isChecked = (sunnah as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() => setSunnah((prev) => ({ ...prev, [key]: !isChecked }))}
                        className={`cursor-pointer p-2.5 rounded-xl border flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200 font-bold"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span>{label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Akhlak & Birrul Walidain */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>3. Akhlak & Birrul Walidain</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "birrulWalidain", label: "Membantu Orang Tua" },
                    { key: "merapikanTempatTidur", label: "Rapikan Kasur Sendiri" },
                    { key: "belajarMandiri", label: "Belajar Mandiri di Rumah" },
                    { key: "adabMakanMinum", label: "Adab Makan & Minum" },
                  ].map(({ key, label }) => {
                    const isChecked = (akhlak as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() => setAkhlak((prev) => ({ ...prev, [key]: !isChecked }))}
                        className={`cursor-pointer p-2.5 rounded-xl border flex items-center justify-between ${
                          isChecked
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200 font-bold"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span>{label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Orang Tua & Guru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                    Catatan Wali Santri / Ortu:
                  </label>
                  <textarea
                    rows={2}
                    value={catatanOrtu}
                    onChange={(e) => setCatatanOrtu(e.target.value)}
                    placeholder="Catatan dari rumah..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                    Catatan Guru / Pembina:
                  </label>
                  <textarea
                    rows={2}
                    value={catatanGuruForm}
                    onChange={(e) => setCatatanGuruForm(e.target.value)}
                    placeholder="Komentar guru..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={(e) => {
                  handleSaveMutabaah(e);
                  setIsModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Mutaba'ah ({calculatedScore} Poin)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL LENGKAP CATATAN MUTABA'AH SANTRI                            */}
      {/* ========================================================================= */}
      {detailSiswaData && detailSiswaData.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Lembar Mutaba'ah Harian</h3>
                <p className="text-xs text-emerald-200">
                  {detailSiswaData.siswa.nama} ({detailSiswaData.siswa.kelas}) • {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setDetailSiswaData(null)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  Skor Kebaikan Harian:
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                  {detailSiswaData.record.skorKebaikan} / 100
                </span>
              </div>

              {/* Shalat 5 Waktu */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 dark:text-white">Shalat Fardhu:</h5>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Subuh: <b>{detailSiswaData.record.shalatWajib.subuh}</b></div>
                  <div>Dzuhur: <b>{detailSiswaData.record.shalatWajib.dzuhur}</b></div>
                  <div>Ashar: <b>{detailSiswaData.record.shalatWajib.ashar}</b></div>
                  <div>Maghrib: <b>{detailSiswaData.record.shalatWajib.maghrib}</b></div>
                  <div>Isya: <b>{detailSiswaData.record.shalatWajib.isya}</b></div>
                </div>
              </div>

              {/* Catatan */}
              {detailSiswaData.record.catatanOrangTua && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Catatan Orang Tua:</span>
                  <p className="italic text-slate-600 dark:text-slate-300">
                    "{detailSiswaData.record.catatanOrangTua}"
                  </p>
                </div>
              )}

              {detailSiswaData.record.catatanGuru && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                  <span className="font-bold text-amber-800 block mb-0.5">Verifikasi & Catatan Guru:</span>
                  <p className="italic text-amber-700 dark:text-amber-300">
                    "{detailSiswaData.record.catatanGuru}" — <b>{detailSiswaData.record.verifiedByGuru}</b>
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setDetailSiswaData(null)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
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
