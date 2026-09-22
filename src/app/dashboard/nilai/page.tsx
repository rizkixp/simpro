"use client";

import React, { useState, useEffect } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope, isClassMatch } from "@/hooks/useTeacherScope";
import { NilaiSiswa, Siswa, JenisRapor } from "@/types/school";
import {
  calculateGrade,
  calculateMidGrade,
  calculateSemesterGrade,
  formatDateIndo,
} from "@/lib/utils";
import {
  Award,
  Search,
  Plus,
  Printer,
  Edit2,
  FileText,
  X,
  GraduationCap,
  Sparkles,
  Shield,
  BookOpen,
  CheckCircle2,
  Calculator,
  Layers,
  Calendar,
  ChevronRight,
  TrendingUp,
  Zap,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Download,
  Users,
  ChevronLeft,
  MessageCircle,
  Share2,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  UserX,
  Eraser,
} from "lucide-react";

export default function NilaiManagementPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const {
    nilaiList,
    saveNilai,
    bulkSaveNilai,
    deleteNilai,
    deleteNilaiBySiswa,
    deleteSiswa,
    siswaList,
    mapelList,
    profile,
    kelasList,
    guruList,
  } = useSchoolData();

  // Notification feedback state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete modal states
  const [deletingNilai, setDeletingNilai] = useState<NilaiSiswa | null>(null);
  const [deletingAllSiswa, setDeletingAllSiswa] = useState<{
    id: string;
    nama: string;
    kelas: string;
    count: number;
  } | null>(null);
  const [deletingSiswaTarget, setDeletingSiswaTarget] = useState<Siswa | null>(null);
  const [isManageDeleteModalOpen, setIsManageDeleteModalOpen] = useState(false);
  const [manageSiswaId, setManageSiswaId] = useState<string>("");

  // Active Rapor Tab: 4 tabs (STS Ganjil, SAS Ganjil, STS Genap, SAS Genap) + Semua Rekap
  type ActiveRaporTabType = "sts-ganjil" | "sas-ganjil" | "sts-genap" | "sas-genap" | "semua";
  const [activeRaporTab, setActiveRaporTab] = useState<ActiveRaporTabType>("sts-ganjil");

  // Derived active assessment mode & semester
  const isTengah = activeRaporTab === "sts-ganjil" || activeRaporTab === "sts-genap";
  const activeSemester: "Ganjil" | "Genap" =
    activeRaporTab === "sts-genap" || activeRaporTab === "sas-genap" ? "Genap" : "Ganjil";
  const activeAssessmentType: JenisRapor = isTengah ? "tengah" : "akhir";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedMapel, setSelectedMapel] = useState("Semua");

  // Single Input / Edit Modal State
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bulk Input Modal State (Dual-Mode: Per-Kelas / Rombel vs Per-Siswa)
  type BulkInputMode = "per-kelas" | "per-siswa";
  type BulkAssessmentTab = "sts-ganjil" | "sas-ganjil" | "sts-genap" | "sas-genap";
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputMode, setBulkInputMode] = useState<BulkInputMode>("per-kelas");
  const [bulkAssessmentTab, setBulkAssessmentTab] = useState<BulkAssessmentTab>("sts-ganjil");

  // Selection for Per-Kelas mode (1 Mapel, Seluruh Siswa di Rombel)
  const [bulkSelectedKelas, setBulkSelectedKelas] = useState<string>("");
  const [bulkSelectedMapel, setBulkSelectedMapel] = useState<string>("");

  // Rows for Per-Kelas mode
  const [bulkClassRows, setBulkClassRows] = useState<
    {
      siswaId: string;
      siswaNama: string;
      nisn: string;
      kelas: string;
      kkm: number;
      tugas: number; // UH
      uts: number; // Mid / STS
      uas: number; // UAS / SAS
      catatan: string;
      existingId?: string;
    }[]
  >([]);

  // Selection & Rows for Per-Siswa mode (1 Siswa, Seluruh Mapel)
  const [bulkSiswaId, setBulkSiswaId] = useState<string>("");
  const [bulkSemester, setBulkSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [bulkRows, setBulkRows] = useState<
    {
      mapel: string;
      kkm: number;
      tugas: number; // UH
      uts: number; // Mid / PTS
      uas: number; // UAS / PAS
      catatanMid: string;
      catatan: string;
      existingId?: string;
    }[]
  >([]);

  // Quick fill toolbar states
  const [quickFillSts, setQuickFillSts] = useState<number>(80);
  const [quickFillValues, setQuickFillValues] = useState({
    tugas: 80,
    uts: 80,
    uas: 85,
  });

  // Derived helpers for Bulk Modal
  const bulkIsTengah = bulkAssessmentTab === "sts-ganjil" || bulkAssessmentTab === "sts-genap";
  const bulkActiveSemester: "Ganjil" | "Genap" =
    bulkAssessmentTab === "sts-genap" || bulkAssessmentTab === "sas-genap" ? "Genap" : "Ganjil";

  // E-Rapor Modal Print Preview (Single Student)
  const [raporSiswa, setRaporSiswa] = useState<Siswa | null>(null);
  const [raporPrintType, setRaporPrintType] = useState<JenisRapor>("tengah");
  const [raporPrintSemester, setRaporPrintSemester] = useState<"Ganjil" | "Genap">("Ganjil");

  // E-Rapor Batch (Seluruh Siswa Rombel) Modal State
  const [isBatchRaporOpen, setIsBatchRaporOpen] = useState(false);
  const [batchRaporType, setBatchRaporType] = useState<JenisRapor>("tengah");
  const [batchRaporSemester, setBatchRaporSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [batchRaporViewMode, setBatchRaporViewMode] = useState<"bundel" | "leger">("bundel");
  const [batchSelectedKelas, setBatchSelectedKelas] = useState<string>("Semua");

  // WhatsApp Share State
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waTargetSiswa, setWaTargetSiswa] = useState<Siswa | null>(null);
  const [waRaporType, setWaRaporType] = useState<JenisRapor>("tengah");
  const [waRaporSemester, setWaRaporSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [isCopiedWa, setIsCopiedWa] = useState(false);

  // Single Form State for Grade Input / Editing
  const [formData, setFormData] = useState({
    siswaId: "",
    mapel: "Matematika",
    semester: "Ganjil" as "Ganjil" | "Genap",
    tugas: 80, // Ulangan Harian (UH)
    uts: 80, // Ujian Mid / PTS
    uas: 85, // Ujian Akhir / PAS
    catatanMid: "Sangat antusias dan aktif dalam pembelajaran tengah semester.",
    catatan: "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
  });

  const canEdit = user?.role === "admin" || user?.role === "guru";

  const baseSiswaList = teacherScope.isTeacher
    ? teacherScope.filterByClass(siswaList)
    : siswaList;

  const baseNilaiList = teacherScope.isTeacher
    ? teacherScope.filterBySubject(teacherScope.filterByClass(nilaiList))
    : nilaiList;

  // Grade resolution helpers with automatic calculation fallback
  const getStudentMid = (n: NilaiSiswa) => {
    // Nilai STS murni 100% dari Ujian STS (uts)
    const examScore = typeof n.uts === "number" ? n.uts : (typeof n.nilaiMid === "number" ? n.nilaiMid : 0);
    const calc = calculateMidGrade(examScore);
    return {
      nilaiMid: examScore,
      predikatMid: calc.predikatMid,
      catatanMid: n.catatanMid || n.catatan || "Mengikuti pembelajaran dengan baik.",
    };
  };

  const getStudentAkhir = (n: NilaiSiswa) => {
    if (typeof n.nilaiAkhir === "number" && n.predikat) {
      return {
        nilaiAkhir: n.nilaiAkhir,
        predikat: n.predikat,
        catatan: n.catatan || "Capaian kompetensi tuntas dengan baik.",
      };
    }
    const calc = calculateSemesterGrade(n.tugas, n.uts, n.uas);
    return {
      nilaiAkhir: calc.nilaiAkhir,
      predikat: calc.predikat,
      catatan: n.catatan || "Capaian kompetensi tuntas dengan baik.",
    };
  };

  // Filtered nilai based on search, selected filters, and active tab semester
  const filteredNilai = baseNilaiList.filter((n) => {
    const matchSearch =
      n.siswaNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nisn.includes(searchTerm) ||
      n.mapel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas =
      teacherScope.isTeacher
        ? (teacherScope.assignedClass ? isClassMatch(n.kelas, teacherScope.assignedClass) : true)
        : selectedKelas === "Semua" || isClassMatch(n.kelas, selectedKelas);
    const matchMapel =
      selectedMapel === "Semua" ||
      n.mapel.toLowerCase() === selectedMapel.toLowerCase();
    const matchSemester =
      activeRaporTab === "semua"
        ? true
        : (n.semester || "Ganjil").toLowerCase() === activeSemester.toLowerCase();

    return matchSearch && matchKelas && matchMapel && matchSemester;
  });

  // Daftar Siswa Terfilter untuk Tabel Utama (menampilkan seluruh siswa dengan kondisi default jika belum ada nilai)
  const filteredSiswa = baseSiswaList.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas =
      teacherScope.isTeacher
        ? (teacherScope.assignedClass ? isClassMatch(s.kelas, teacherScope.assignedClass) : true)
        : selectedKelas === "Semua" || isClassMatch(s.kelas, selectedKelas);
    return matchSearch && matchKelas;
  });

  const siswaWithGrades = filteredSiswa.filter((s) => {
    const records = nilaiList.filter(
      (n) =>
        n.siswaId === s.id &&
        (activeRaporTab === "semua"
          ? true
          : (n.semester || "Ganjil").toLowerCase() === activeSemester.toLowerCase()) &&
        (selectedMapel === "Semua"
          ? true
          : n.mapel.toLowerCase() === selectedMapel.toLowerCase())
    );
    return records.length > 0;
  });

  const getPredikatFromScore = (score: number): "A" | "B" | "C" | "D" => {
    if (score >= 88) return "A";
    if (score >= 75) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  // KPI Statistics calculations
  const statsMidScores = filteredNilai.map((n) => getStudentMid(n).nilaiMid);
  const avgMidScore =
    statsMidScores.length > 0
      ? Math.round(statsMidScores.reduce((a, b) => a + b, 0) / statsMidScores.length)
      : 0;

  const statsAkhirScores = filteredNilai.map((n) => getStudentAkhir(n).nilaiAkhir);
  const avgAkhirScore =
    statsAkhirScores.length > 0
      ? Math.round(statsAkhirScores.reduce((a, b) => a + b, 0) / statsAkhirScores.length)
      : 0;

  const tuntasCount = filteredNilai.filter((n) => {
    if (isTengah) return getStudentMid(n).nilaiMid >= 75;
    return getStudentAkhir(n).nilaiAkhir >= 75;
  }).length;

  const tuntasPercent =
    filteredNilai.length > 0 ? Math.round((tuntasCount / filteredNilai.length) * 100) : 0;

  // Single Input Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    const defaultSiswa = baseSiswaList[0] || siswaList[0];
    const defaultMapel = teacherScope.isTeacher
      ? teacherScope.scopedMapelList[0]?.nama || "Matematika"
      : mapelList[0]?.nama || "Matematika";
    setFormData({
      siswaId: defaultSiswa?.id || "",
      mapel: defaultMapel,
      semester: activeSemester,
      tugas: 82,
      uts: 80,
      uas: 85,
      catatanMid: "Menunjukkan pemahaman materi tengah semester yang baik dan aktif berdiskusi.",
      catatan: "Pertahankan ketekunan belajar dan tingkatkan literasi mandiri.",
    });
    setIsInputModalOpen(true);
  };

  const handleOpenEdit = (n: NilaiSiswa) => {
    setEditingId(n.id);
    const mid = getStudentMid(n);
    const akhir = getStudentAkhir(n);
    setFormData({
      siswaId: n.siswaId,
      mapel: n.mapel,
      semester: n.semester || activeSemester,
      tugas: n.tugas,
      uts: n.uts,
      uas: n.uas,
      catatanMid: mid.catatanMid,
      catatan: akhir.catatan,
    });
    setIsInputModalOpen(true);
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherScope.isTeacher && !teacherScope.isSubjectAccessible(formData.mapel)) {
      return;
    }
    const siswa =
      baseSiswaList.find((s) => s.id === formData.siswaId) ||
      siswaList.find((s) => s.id === formData.siswaId);
    if (!siswa) return;

    // Kalkulasi nilai tengah semester (STS): 100% Nilai Ujian STS
    const { nilaiMid, predikatMid } = calculateMidGrade(
      Number(formData.uts)
    );

    // Kalkulasi nilai akhir semester (PAS): 30% UH + 30% Mid + 40% UAS
    const { nilaiAkhir, predikat } = calculateSemesterGrade(
      Number(formData.tugas),
      Number(formData.uts),
      Number(formData.uas)
    );

    const targetSemester = formData.semester || activeSemester;

    saveNilai({
      id: editingId || undefined,
      siswaId: siswa.id,
      siswaNama: siswa.nama,
      nisn: siswa.nisn,
      kelas: siswa.kelas,
      mapel: formData.mapel,
      semester: targetSemester,
      tahunAjaran: profile.tahunAjaranAktif,
      tugas: Number(formData.tugas),
      uts: Number(formData.uts),
      uas: Number(formData.uas),
      nilaiMid,
      predikatMid,
      catatanMid: formData.catatanMid,
      nilaiAkhir,
      predikat,
      catatan: formData.catatan,
    });

    setIsInputModalOpen(false);
    setNotification({
      type: "success",
      message: editingId
        ? `Nilai mata pelajaran "${formData.mapel}" (${targetSemester}) untuk ${siswa.nama} berhasil diperbarui.`
        : `Nilai mata pelajaran "${formData.mapel}" (${targetSemester}) untuk ${siswa.nama} berhasil disimpan.`,
    });
  };

  // =========================================================================
  // Bulk Input Handlers (Dual-Mode: Per-Kelas / Rombel vs Per-Siswa)
  // =========================================================================

  // Inisialisasi baris Mode Per-Kelas (1 Mapel, Seluruh Siswa di Kelas)
  const initBulkClassRows = (
    targetKelas: string,
    targetMapel: string,
    tab: BulkAssessmentTab = bulkAssessmentTab
  ) => {
    const sem: "Ganjil" | "Genap" =
      tab === "sts-genap" || tab === "sas-genap" ? "Genap" : "Ganjil";

    const classStudents = baseSiswaList.filter(
      (s) => isClassMatch(s.kelas, targetKelas)
    );

    const mapelObj = mapelList.find(
      (m) => m.nama.toLowerCase() === targetMapel.toLowerCase()
    );
    const kkm = mapelObj?.kkm || 75;

    const rows = classStudents.map((s) => {
      const existing = nilaiList.find(
        (n) =>
          n.siswaId === s.id &&
          n.mapel.toLowerCase() === targetMapel.toLowerCase() &&
          (n.semester || "Ganjil").toLowerCase() === sem.toLowerCase()
      );

      if (existing) {
        return {
          siswaId: s.id,
          siswaNama: s.nama,
          nisn: s.nisn,
          kelas: s.kelas,
          kkm,
          tugas: typeof existing.tugas === "number" ? existing.tugas : 80,
          uts: typeof existing.uts === "number" ? existing.uts : 80,
          uas: typeof existing.uas === "number" ? existing.uas : 80,
          catatan: existing.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
          existingId: existing.id,
        };
      }

      return {
        siswaId: s.id,
        siswaNama: s.nama,
        nisn: s.nisn,
        kelas: s.kelas,
        kkm,
        tugas: 80,
        uts: 80,
        uas: 80,
        catatan: "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
      };
    });

    setBulkClassRows(rows);
  };

  // Inisialisasi baris Mode Per-Siswa (1 Siswa, Seluruh Mapel)
  const initBulkRowsForStudent = (
    targetSiswaId: string,
    sem: "Ganjil" | "Genap" = bulkActiveSemester
  ) => {
    const targetSiswa =
      baseSiswaList.find((s) => s.id === targetSiswaId) ||
      siswaList.find((s) => s.id === targetSiswaId);
    if (!targetSiswa) return;

    // Filter mapel jika akun merupakan guru mata pelajaran (fallback ke mapelList jika guru kelas / umum)
    const subjects = (teacherScope.isTeacher && teacherScope.scopedMapelList.length > 0
      ? teacherScope.scopedMapelList
      : mapelList) || mapelList;
    const finalSubjects = subjects.length > 0 ? subjects : mapelList;

    const existingStudentNilai = nilaiList.filter(
      (n) => n.siswaId === targetSiswaId && (n.semester || "Ganjil").toLowerCase() === sem.toLowerCase()
    );

    const rows = finalSubjects.map((m) => {
      const existing = existingStudentNilai.find(
        (n) => n.mapel.toLowerCase() === m.nama.toLowerCase()
      );
      if (existing) {
        return {
          mapel: m.nama,
          kkm: m.kkm,
          tugas: typeof existing.tugas === "number" ? existing.tugas : 82,
          uts: typeof existing.uts === "number" ? existing.uts : 80,
          uas: typeof existing.uas === "number" ? existing.uas : 85,
          catatanMid: "",
          catatan: existing.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
          existingId: existing.id,
        };
      }
      return {
        mapel: m.nama,
        kkm: m.kkm,
        tugas: 82,
        uts: 80,
        uas: 85,
        catatanMid: "",
        catatan: "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
      };
    });

    setBulkRows(rows);
  };

  // Handler pergantian siswa (Mode Per-Siswa)
  const handleBulkSiswaChange = (newSiswaId: string) => {
    setBulkSiswaId(newSiswaId);
    initBulkRowsForStudent(newSiswaId, bulkSemester);
  };

  // Handler pergantian kelas (Mode Per-Kelas)
  const handleBulkClassChange = (newKelas: string) => {
    setBulkSelectedKelas(newKelas);
    initBulkClassRows(newKelas, bulkSelectedMapel, bulkAssessmentTab);
  };

  // Handler pergantian mapel (Mode Per-Kelas)
  const handleBulkMapelChange = (newMapel: string) => {
    setBulkSelectedMapel(newMapel);
    initBulkClassRows(bulkSelectedKelas, newMapel, bulkAssessmentTab);
  };

  // Handler navigasi 4 Jenis Penilaian di dalam modal
  const handleSwitchBulkAssessment = (newTab: BulkAssessmentTab) => {
    setBulkAssessmentTab(newTab);
    const newSem: "Ganjil" | "Genap" =
      newTab === "sts-genap" || newTab === "sas-genap" ? "Genap" : "Ganjil";
    setBulkSemester(newSem);
    if (bulkInputMode === "per-kelas") {
      initBulkClassRows(bulkSelectedKelas, bulkSelectedMapel, newTab);
    } else {
      initBulkRowsForStudent(bulkSiswaId, newSem);
    }
  };

  // Handler input field baris Per-Siswa
  const handleBulkRowChange = (
    index: number,
    field: "tugas" | "uts" | "uas" | "catatanMid" | "catatan",
    value: string | number
  ) => {
    const updated = [...bulkRows];
    updated[index] = {
      ...updated[index],
      [field]: typeof value === "number" ? Math.max(0, Math.min(100, value)) : value,
    };
    setBulkRows(updated);
  };

  // Handler input field baris Per-Kelas
  const handleBulkClassRowChange = (
    index: number,
    field: "tugas" | "uts" | "uas" | "catatan",
    value: string | number
  ) => {
    setBulkClassRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: typeof value === "number" ? Math.max(0, Math.min(100, value)) : value,
      };
      return updated;
    });
  };

  // Handler Buka Modal Bulk Input
  const handleOpenBulkAdd = (
    preselectedSiswaId?: string,
    forcedMode?: "per-kelas" | "per-siswa"
  ) => {
    // Tentukan tab penilaian awal sesuai tab aktif di halaman
    const initialTab: BulkAssessmentTab =
      activeRaporTab === "sas-ganjil"
        ? "sas-ganjil"
        : activeRaporTab === "sts-genap"
        ? "sts-genap"
        : activeRaporTab === "sas-genap"
        ? "sas-genap"
        : "sts-ganjil";
    setBulkAssessmentTab(initialTab);

    const initialSem: "Ganjil" | "Genap" =
      initialTab === "sts-genap" || initialTab === "sas-genap" ? "Genap" : "Ganjil";
    setBulkSemester(initialSem);

    // Tentukan kelas & mapel awal
    const availableKelas = teacherScope.isTeacher && teacherScope.assignedClass
      ? [teacherScope.assignedClass]
      : Array.from(new Set(baseSiswaList.map((s) => s.kelas))).filter(Boolean);
    const initialKelas =
      selectedKelas !== "Semua" && availableKelas.includes(selectedKelas)
        ? selectedKelas
        : availableKelas[0] || (kelasList[0]?.nama || "");
    setBulkSelectedKelas(initialKelas);

    const availableMapel = teacherScope.isTeacher && teacherScope.scopedMapelList.length > 0
      ? teacherScope.scopedMapelList.map((m) => m.nama)
      : mapelList.map((m) => m.nama);
    const initialMapel =
      selectedMapel !== "Semua" && availableMapel.includes(selectedMapel)
        ? selectedMapel
        : availableMapel[0] || (mapelList[0]?.nama || "Matematika");
    setBulkSelectedMapel(initialMapel);

    // Tentukan mode awal (jika dipanggil dari tombol baris siswa, mode per-siswa; jika dari header, mode per-kelas)
    const mode = forcedMode || (preselectedSiswaId ? "per-siswa" : "per-kelas");
    setBulkInputMode(mode);

    const targetId = preselectedSiswaId || baseSiswaList[0]?.id || siswaList[0]?.id || "";
    setBulkSiswaId(targetId);

    // Inisialisasi baris data
    initBulkClassRows(initialKelas, initialMapel, initialTab);
    if (targetId) {
      initBulkRowsForStudent(targetId, initialSem);
    }

    setIsBulkModalOpen(true);
  };

  // Quick-Fill untuk Mode Per-Kelas
  const handleApplyQuickFillClass = () => {
    if (bulkIsTengah) {
      setBulkClassRows((prev) =>
        prev.map((r) => ({
          ...r,
          uts: quickFillSts,
        }))
      );
    } else {
      setBulkClassRows((prev) =>
        prev.map((r) => ({
          ...r,
          tugas: quickFillValues.tugas,
          uts: quickFillValues.uts,
          uas: quickFillValues.uas,
        }))
      );
    }
  };

  // Quick-Fill untuk Mode Per-Siswa
  const handleApplyQuickFillStudent = () => {
    if (bulkIsTengah) {
      setBulkRows((prev) =>
        prev.map((r) => ({
          ...r,
          uts: quickFillSts,
        }))
      );
    } else {
      setBulkRows((prev) =>
        prev.map((r) => ({
          ...r,
          tugas: quickFillValues.tugas,
          uts: quickFillValues.uts,
          uas: quickFillValues.uas,
        }))
      );
    }
  };

  // Simpan data Mode Per-Kelas (1 Mapel, Seluruh Siswa di Rombel)
  const handleSaveBulkClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (bulkClassRows.length === 0) return;

    const itemsToSave = bulkClassRows.map((row) => {
      const { nilaiMid, predikatMid } = calculateMidGrade(Number(row.uts) || 0);
      const { nilaiAkhir, predikat } = calculateSemesterGrade(
        Number(row.tugas) || 0,
        Number(row.uts) || 0,
        Number(row.uas) || 0
      );

      return {
        id: row.existingId,
        siswaId: row.siswaId,
        siswaNama: row.siswaNama,
        nisn: row.nisn,
        kelas: row.kelas,
        mapel: bulkSelectedMapel,
        semester: bulkActiveSemester,
        tahunAjaran: profile.tahunAjaranAktif,
        tugas: Number(row.tugas) || 0,
        uts: Number(row.uts) || 0,
        uas: Number(row.uas) || 0,
        nilaiMid,
        predikatMid,
        catatanMid: "", // Catatan perkembangan dihilangkan untuk STS!
        nilaiAkhir,
        predikat,
        catatan: row.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
      };
    });

    bulkSaveNilai(itemsToSave);
    setIsBulkModalOpen(false);
    setNotification({
      type: "success",
      message: `Nilai ${bulkIsTengah ? "STS" : "SAS"} mapel "${bulkSelectedMapel}" Kelas ${bulkSelectedKelas} (${itemsToSave.length} siswa) Semester ${bulkActiveSemester} berhasil disimpan.`,
    });
  };

  // Simpan data Mode Per-Siswa (1 Siswa, Seluruh Mapel)
  const handleSaveBulkStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const siswa =
      baseSiswaList.find((s) => s.id === bulkSiswaId) ||
      siswaList.find((s) => s.id === bulkSiswaId);
    if (!siswa) return;

    const itemsToSave = bulkRows.map((row) => {
      const { nilaiMid, predikatMid } = calculateMidGrade(Number(row.uts) || 0);
      const { nilaiAkhir, predikat } = calculateSemesterGrade(
        Number(row.tugas) || 0,
        Number(row.uts) || 0,
        Number(row.uas) || 0
      );

      return {
        id: row.existingId,
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
        mapel: row.mapel,
        semester: bulkActiveSemester,
        tahunAjaran: profile.tahunAjaranAktif,
        tugas: Number(row.tugas) || 0,
        uts: Number(row.uts) || 0,
        uas: Number(row.uas) || 0,
        nilaiMid,
        predikatMid,
        catatanMid: "", // Catatan perkembangan dihilangkan untuk STS!
        nilaiAkhir,
        predikat,
        catatan: row.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
      };
    });

    bulkSaveNilai(itemsToSave);
    setIsBulkModalOpen(false);
    setNotification({
      type: "success",
      message: `Nilai ${bulkIsTengah ? "STS" : "SAS"} seluruh mata pelajaran (${itemsToSave.length} mapel) untuk ${siswa.nama} Semester ${bulkActiveSemester} berhasil disimpan.`,
    });
  };

  // Dispatcher Simpan Utama
  const handleSaveBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkInputMode === "per-kelas") {
      handleSaveBulkClass();
    } else {
      handleSaveBulkStudent();
    }
  };

  // Delete Handlers
  const handleConfirmDeleteSingle = () => {
    if (!deletingNilai) return;
    const { id, mapel, siswaNama } = deletingNilai;
    deleteNilai(id);
    setDeletingNilai(null);
    setNotification({
      type: "success",
      message: `Data nilai mata pelajaran "${mapel}" untuk ${siswaNama} berhasil dihapus.`,
    });
  };

  const handleConfirmDeleteAllBySiswa = () => {
    if (!deletingAllSiswa) return;
    const { id, nama, count } = deletingAllSiswa;
    deleteNilaiBySiswa(id);
    setDeletingAllSiswa(null);
    if (isBulkModalOpen) {
      setIsBulkModalOpen(false);
    }
    setNotification({
      type: "success",
      message: `Seluruh data nilai (${count} mapel) untuk ${nama} berhasil dihapus dari sistem.`,
    });
  };

  const handleConfirmDeleteSiswa = () => {
    if (!deletingSiswaTarget) return;
    const { id, nama } = deletingSiswaTarget;
    // Hapus seluruh nilai siswa terlebih dahulu
    deleteNilaiBySiswa(id);
    // Hapus rekaman data siswa dari sistem
    deleteSiswa(id);

    if (raporSiswa?.id === id) {
      setRaporSiswa(null);
    }
    if (bulkSiswaId === id) {
      setIsBulkModalOpen(false);
    }
    if (manageSiswaId === id) {
      setManageSiswaId("");
    }
    setDeletingSiswaTarget(null);
    setNotification({
      type: "success",
      message: `Data siswa "${nama}" beserta seluruh rekaman nilainya berhasil dihapus dari sistem.`,
    });
  };

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // E-Rapor Print Modal Handlers
  const handleOpenRapor = (siswa: Siswa, type?: JenisRapor, sem?: "Ganjil" | "Genap") => {
    setRaporSiswa(siswa);
    setRaporPrintType(type || activeAssessmentType);
    setRaporPrintSemester(sem || activeSemester);
  };

  // Single Student Navigation in Modal
  const currentSiswaIndex = raporSiswa
    ? baseSiswaList.findIndex((s) => s.id === raporSiswa.id)
    : -1;

  const handlePrevSiswa = () => {
    if (currentSiswaIndex > 0) {
      setRaporSiswa(baseSiswaList[currentSiswaIndex - 1]);
    }
  };

  const handleNextSiswa = () => {
    if (currentSiswaIndex >= 0 && currentSiswaIndex < baseSiswaList.length - 1) {
      setRaporSiswa(baseSiswaList[currentSiswaIndex + 1]);
    }
  };

  // Direct Print & PDF Filename Handler
  const handlePrintReport = (docTitle: string) => {
    const prevTitle = typeof document !== "undefined" ? document.title : "";
    if (typeof document !== "undefined") {
      document.title = docTitle.replace(/[/\\?%*:|"<>]/g, "_");
    }
    window.print();
    setTimeout(() => {
      if (typeof document !== "undefined") {
        document.title = prevTitle;
      }
    }, 1500);
  };

  // Format clean international phone number for WhatsApp (e.g. 0812... -> 62812...)
  const formatWhatsAppPhone = (phone?: string): string => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    } else if (!clean.startsWith("62")) {
      clean = "62" + clean;
    }
    return clean;
  };

  // Generate official Islamic formatted WhatsApp message for student report
  const generateRaporWhatsAppText = (siswa: Siswa, type: JenisRapor, sem: "Ganjil" | "Genap" = waRaporSemester) => {
    const records = nilaiList.filter(
      (n) => n.siswaId === siswa.id && (n.semester || "Ganjil").toLowerCase() === sem.toLowerCase()
    );
    const isMid = type === "tengah";
    const typeLabel = isMid ? "Sumatif Tengah Semester (STS)" : "Akhir Semester (PAS)";
    const avgScore =
      records.length > 0
        ? Math.round(
            records.reduce(
              (acc, curr) =>
                acc + (isMid ? getStudentMid(curr).nilaiMid : getStudentAkhir(curr).nilaiAkhir),
              0
            ) / records.length
          )
        : 0;
    const generalPredicate =
      avgScore >= 88 ? "A (Sangat Baik)" : avgScore >= 75 ? "B (Baik)" : "C (Cukup)";

    let msg = `*LAPORAN HASIL BELAJAR PESERTA DIDIK*\n`;
    msg += `*${(profile.namaSekolah || "SDI SMART SCHOOL").toUpperCase()}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `_Assalamu'alaikum Warahmatullahi Wabarakatuh_\n\n`;
    msg += `Yth. Bapak/Ibu Wali dari Ananda:\n`;
    msg += `👤 *Nama:* ${siswa.nama}\n`;
    msg += `🆔 *NISN:* ${siswa.nisn}\n`;
    msg += `🏫 *Kelas:* ${siswa.kelas}\n`;
    msg += `📅 *Periode:* Rapor ${typeLabel} (Semester ${sem} - TA ${profile.tahunAjaranAktif})\n\n`;
    msg += `Alhamdulillah, berikut ringkasan capaian kompetensi belajar ananda:\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (records.length === 0) {
      msg += `_(Data nilai mata pelajaran Semester ${sem} belum diinputkan)_\n`;
    } else {
      records.forEach((r, i) => {
        const score = isMid ? getStudentMid(r).nilaiMid : getStudentAkhir(r).nilaiAkhir;
        const pred = isMid ? getStudentMid(r).predikatMid : getStudentAkhir(r).predikat;
        const note = isMid ? "" : getStudentAkhir(r).catatan;
        msg += `${i + 1}. *${r.mapel}*: ${score} (${pred})\n`;
        if (!isMid && note && note !== "-") {
          msg += `   _Catatan:_ "${note}"\n`;
        }
      });
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📊 *Rata-rata Nilai:* ${avgScore} / 100\n`;
    msg += `🌟 *Predikat Umum:* ${generalPredicate}\n\n`;

    msg += `Terima kasih atas kerjasama dan bimbingan Ayah/Bunda di rumah. Semoga ananda senantiasa bersemangat menuntut ilmu dan berakhlak mulia.\n\n`;
    msg += `_Wassalamu'alaikum Warahmatullahi Wabarakatuh_\n\n`;
    msg += `*Wali Kelas & Manajemen Sekolah*\n`;
    msg += `${profile.namaSekolah}\n`;
    msg += `Telp: ${profile.telepon || "-"}`;

    return msg;
  };

  const handleOpenWhatsAppModal = (siswa: Siswa, type?: JenisRapor, sem?: "Ganjil" | "Genap") => {
    setWaTargetSiswa(siswa);
    setWaRaporType(type || activeAssessmentType);
    setWaRaporSemester(sem || activeSemester);
    setIsCopiedWa(false);
    setIsWaModalOpen(true);
  };

  // Nilai records for selected rapor siswa filtered by chosen print semester
  const studentNilaiRecords = raporSiswa
    ? nilaiList.filter(
        (n) =>
          n.siswaId === raporSiswa.id &&
          (n.semester || "Ganjil").toLowerCase() === (raporPrintSemester || "Ganjil").toLowerCase()
      )
    : [];

  const studentMidAverage =
    studentNilaiRecords.length > 0
      ? Math.round(
          studentNilaiRecords.reduce((acc, curr) => acc + getStudentMid(curr).nilaiMid, 0) /
            studentNilaiRecords.length
        )
      : 0;

  const studentAkhirAverage =
    studentNilaiRecords.length > 0
      ? Math.round(
          studentNilaiRecords.reduce((acc, curr) => acc + getStudentAkhir(curr).nilaiAkhir, 0) /
            studentNilaiRecords.length
        )
      : 0;

  // Students included in Batch Rapor
  const batchStudents = baseSiswaList.filter((s) => {
    if (teacherScope.isTeacher && teacherScope.assignedClass) {
      return isClassMatch(s.kelas, teacherScope.assignedClass);
    }
    if (batchSelectedKelas === "Semua") return true;
    return isClassMatch(s.kelas, batchSelectedKelas);
  });

  // Live preview calculations for single form modal
  const liveMid = calculateMidGrade(Number(formData.uts) || 0);
  const liveAkhir = calculateSemesterGrade(
    Number(formData.tugas) || 0,
    Number(formData.uts) || 0,
    Number(formData.uas) || 0
  );

  // Selected student obj in bulk modal (Mode Per-Siswa)
  const selectedBulkStudent = siswaList.find((s) => s.id === bulkSiswaId);

  // Bulk modal stats (Mode Per-Siswa)
  const bulkAvgMid =
    bulkRows.length > 0
      ? Math.round(
          bulkRows.reduce(
            (acc, r) => acc + calculateMidGrade(Number(r.uts) || 0).nilaiMid,
            0
          ) / bulkRows.length
        )
      : 0;

  const bulkAvgAkhir =
    bulkRows.length > 0
      ? Math.round(
          bulkRows.reduce(
            (acc, r) =>
              acc +
              calculateSemesterGrade(Number(r.tugas) || 0, Number(r.uts) || 0, Number(r.uas) || 0).nilaiAkhir,
            0
          ) / bulkRows.length
        )
      : 0;

  const bulkStudentTuntasCount = bulkRows.filter(
    (r) => (Number(r.uts) || 0) >= (r.kkm || 75)
  ).length;

  // Bulk modal stats (Mode Per-Kelas)
  const bulkClassAvgMid =
    bulkClassRows.length > 0
      ? Math.round(
          bulkClassRows.reduce(
            (acc, r) => acc + calculateMidGrade(Number(r.uts) || 0).nilaiMid,
            0
          ) / bulkClassRows.length
        )
      : 0;

  const bulkClassAvgAkhir =
    bulkClassRows.length > 0
      ? Math.round(
          bulkClassRows.reduce(
            (acc, r) =>
              acc +
              calculateSemesterGrade(Number(r.tugas) || 0, Number(r.uts) || 0, Number(r.uas) || 0).nilaiAkhir,
            0
          ) / bulkClassRows.length
        )
      : 0;

  const bulkClassTuntasCount = bulkClassRows.filter(
    (r) => (Number(r.uts) || 0) >= (r.kkm || 75)
  ).length;
  const bulkClassRemedialCount = bulkClassRows.length - bulkClassTuntasCount;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 max-w-md ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
              : "bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 cursor-pointer ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="h-7 w-7 text-amber-500" />
            <span>Penilaian & E-Rapor Digital</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen penilaian multi-rapor (Rapor Tengah Semester & Rapor Akhir Semester), input bulk seluruh mapel per siswa, dan cetak lembar resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Cetak / Ekspor Rapor Seluruh Siswa */}
          <button
            onClick={() => {
              setBatchRaporViewMode("bundel");
              setBatchRaporType(isTengah ? "tengah" : "akhir");
              setBatchRaporSemester(activeSemester);
              setBatchSelectedKelas(selectedKelas !== "Semua" ? selectedKelas : "Semua");
              setIsBatchRaporOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Rapor Seluruh Siswa (PDF & Print)</span>
          </button>

          {/* Tombol Leger Nilai Rombel */}
          <button
            onClick={() => {
              setBatchRaporViewMode("leger");
              setBatchRaporType(isTengah ? "tengah" : "akhir");
              setBatchRaporSemester(activeSemester);
              setBatchSelectedKelas(selectedKelas !== "Semua" ? selectedKelas : "Semua");
              setIsBatchRaporOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Leger Nilai Rombel</span>
          </button>


        </div>
      </div>

      {/* Teacher Homeroom Banner */}
      {teacherScope.isTeacher && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Mode Penilaian & E-Rapor: Kelas {teacherScope.assignedClass}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {teacherScope.teacherName}
                </span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Mata Pelajaran Diampu: <strong>{teacherScope.assignedSubjects.length > 4 ? `Semua Mata Pelajaran (${teacherScope.assignedSubjects.length} Mapel)` : teacherScope.assignedSubjects.join(", ")}</strong> &bull; Peserta didik binaan: <strong>{teacherScope.assignedClass}</strong> ({baseSiswaList.length} siswa).
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-700/50 self-start sm:self-center shrink-0">
            Akses Terkunci: {teacherScope.assignedClass} &bull; {teacherScope.assignedSubjects.length > 4 ? "Semua Mapel" : teacherScope.assignedSubjects.join(", ")}
          </span>
        </div>
      )}

      {/* Rapor Type Switcher Tabs - 4 Tabs: STS Ganjil, SAS Ganjil, STS Genap, SAS Genap + Rekap */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
        {/* Tab 1: STS Ganjil */}
        <button
          onClick={() => setActiveRaporTab("sts-ganjil")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeRaporTab === "sts-ganjil"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Sumatif Tengah Semester (STS) Ganjil</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeRaporTab === "sts-ganjil"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
            }`}
          >
            100% Ujian STS
          </span>
        </button>

        {/* Tab 2: SAS Ganjil */}
        <button
          onClick={() => setActiveRaporTab("sas-ganjil")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeRaporTab === "sas-ganjil"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Sumatif Akhir Semester (SAS) Ganjil</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeRaporTab === "sas-ganjil"
                ? "bg-white/20 text-white"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            }`}
          >
            30% UH + 30% Mid + 40% UAS
          </span>
        </button>

        {/* Tab 3: STS Genap */}
        <button
          onClick={() => setActiveRaporTab("sts-genap")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeRaporTab === "sts-genap"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Sumatif Tengah Semester (STS) Genap</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeRaporTab === "sts-genap"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
            }`}
          >
            100% Ujian STS
          </span>
        </button>

        {/* Tab 4: SAS Genap */}
        <button
          onClick={() => setActiveRaporTab("sas-genap")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeRaporTab === "sas-genap"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Sumatif Akhir Semester (SAS) Genap</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeRaporTab === "sas-genap"
                ? "bg-white/20 text-white"
                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
            }`}
          >
            30% UH + 30% Mid + 40% UAS
          </span>
        </button>

        {/* Tab 5: Rekap Komponen Lengkap */}
        <button
          onClick={() => setActiveRaporTab("semua")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeRaporTab === "semua"
              ? "bg-slate-800 text-white dark:bg-slate-700 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Rekap Komponen Lengkap</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">
              {isTengah
                ? `Rata-Rata Sumatif Tengah Semester (STS) ${activeSemester}`
                : activeRaporTab === "semua"
                ? "Rata-Rata Nilai Keseluruhan"
                : `Rata-Rata Sumatif Akhir Semester (SAS) ${activeSemester}`}
            </p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {isTengah
                ? avgMidScore
                : activeRaporTab === "semua"
                ? Math.round((avgMidScore + avgAkhirScore) / 2 || 0)
                : avgAkhirScore}
            </p>
            <span className="text-[10px] text-slate-500">
              Target KKM Standar: &ge; 75
            </span>
          </div>
          <div
            className={`p-3 rounded-xl ${
              isTengah
                ? "bg-amber-500/10 text-amber-600"
                : "bg-blue-500/10 text-blue-600"
            }`}
          >
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">
              Ketuntasan Belajar ({isTengah ? `STS ${activeSemester}` : activeRaporTab === "semua" ? "Semua" : `SAS ${activeSemester}`})
            </p>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {tuntasPercent}%
            </p>
            <span className="text-[10px] text-slate-500">
              {tuntasCount} dari {filteredNilai.length} entri tuntas ({siswaWithGrades.length} dari {filteredSiswa.length} siswa)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Komposisi Perhitungan Rapor</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
              {isTengah
                ? `100% Nilai Ujian STS (Semester ${activeSemester})`
                : activeRaporTab === "semua"
                ? "Semua Komponen (UH, Mid, UAS)"
                : `30% UH + 30% Mid + 40% UAS (Semester ${activeSemester})`}
            </p>
            <span className="text-[10px] text-slate-500">
              Otomatis & sesuai panduan e-rapor
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
            <Calculator className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, NISN, atau mapel..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {teacherScope.isTeacher ? (
            <div className="px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
              <span>Kelas: {teacherScope.assignedClass}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">(Wali)</span>
            </div>
          ) : (
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
          )}

          <select
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {teacherScope.isTeacher ? (
              teacherScope.scopedMapelList.length > 1 ? (
                <>
                  <option value="Semua">
                    Semua Mapel Diampu ({teacherScope.scopedMapelList.length})
                  </option>
                  {teacherScope.scopedMapelList.map((m) => (
                    <option key={m.id} value={m.nama}>
                      {m.nama} (Diampu)
                    </option>
                  ))}
                </>
              ) : (
                teacherScope.scopedMapelList.map((m) => (
                  <option key={m.id} value="Semua">
                    {m.nama} (Mapel Diampu)
                  </option>
                ))
              )
            ) : (
              <>
                <option value="Semua">Semua Mata Pelajaran</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.nama}>
                    {m.nama}
                  </option>
                ))}
              </>
            )}
          </select>

          <span className="text-xs text-slate-500 ml-auto md:ml-2">
            Total Siswa: <strong>{filteredSiswa.length}</strong>
            {siswaWithGrades.length < filteredSiswa.length ? (
              <span className="ml-1 text-slate-400">({siswaWithGrades.length} dinilai)</span>
            ) : (
              <span className="ml-1 text-emerald-600 font-semibold">(Semua dinilai)</span>
            )}
          </span>
        </div>
      </div>

      {/* Nilai Table: Menampilkan Seluruh Siswa (Default Belum Diisi jika belum ada nilai) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              {selectedMapel === "Semua" ? (
                isTengah ? (
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center w-24">Kelas</th>
                    <th className="px-4 py-3.5 text-center">Status Pengisian Nilai</th>
                    <th className="px-4 py-3.5 text-center bg-amber-500/5 dark:bg-amber-500/10">
                      Rata-Rata STS ({activeSemester})
                    </th>
                    <th className="px-3 py-3.5 text-center">Predikat</th>
                    <th className="px-4 py-3.5 text-center">Ketuntasan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                ) : activeRaporTab !== "semua" ? (
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center w-24">Kelas</th>
                    <th className="px-4 py-3.5 text-center">Status Pengisian Nilai</th>
                    <th className="px-4 py-3.5 text-center bg-blue-500/5 dark:bg-blue-500/10">
                      Rata-Rata SAS ({activeSemester})
                    </th>
                    <th className="px-3 py-3.5 text-center">Predikat Umum</th>
                    <th className="px-4 py-3.5 text-center">Ketuntasan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center w-24">Kelas</th>
                    <th className="px-4 py-3.5 text-center">Status Pengisian Nilai</th>
                    <th className="px-3 py-3.5 text-center bg-amber-500/5 font-bold">Rata-Rata STS</th>
                    <th className="px-3 py-3.5 text-center bg-blue-500/5 font-bold">Rata-Rata SAS</th>
                    <th className="px-3 py-3.5 text-center">Predikat Umum</th>
                    <th className="px-4 py-3.5 text-center">Ketuntasan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                )
              ) : (
                isTengah ? (
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center w-24">Kelas</th>
                    <th className="px-4 py-3.5">Mata Pelajaran</th>
                    <th className="px-4 py-3.5 text-center bg-amber-500/5 dark:bg-amber-500/10">
                      Nilai Ujian STS ({activeSemester})
                    </th>
                    <th className="px-3 py-3.5 text-center">Predikat</th>
                    <th className="px-4 py-3.5 text-center">Status Ketuntasan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                ) : activeRaporTab !== "semua" ? (
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center w-24">Kelas</th>
                    <th className="px-4 py-3.5">Mata Pelajaran</th>
                    <th className="px-3 py-3.5 text-center">Harian (UH)</th>
                    <th className="px-3 py-3.5 text-center">Ujian Mid</th>
                    <th className="px-3 py-3.5 text-center">Ujian Akhir (SAS)</th>
                    <th className="px-4 py-3.5 text-center bg-blue-500/5 dark:bg-blue-500/10">
                      Nilai Akhir Rapor
                    </th>
                    <th className="px-3 py-3.5 text-center">Predikat</th>
                    <th className="px-4 py-3.5 text-center">Status Ketuntasan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center w-24">Kelas</th>
                    <th className="px-4 py-3.5">Mata Pelajaran</th>
                    <th className="px-2 py-3.5 text-center">UH</th>
                    <th className="px-2 py-3.5 text-center">Mid (STS)</th>
                    <th className="px-2 py-3.5 text-center">UAS (SAS)</th>
                    <th className="px-3 py-3.5 text-center bg-blue-500/5 font-bold">Nilai Akhir</th>
                    <th className="px-3 py-3.5 text-center">Predikat</th>
                    <th className="px-4 py-3.5 text-center">Status Ketuntasan</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                )
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada peserta didik yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((s, index) => {
                  const studentRecords = nilaiList.filter(
                    (n) =>
                      n.siswaId === s.id &&
                      (activeRaporTab === "semua"
                        ? true
                        : (n.semester || "Ganjil").toLowerCase() === activeSemester.toLowerCase())
                  );

                  const totalMapelCount = teacherScope.isTeacher
                    ? Math.max(1, teacherScope.scopedMapelList.length)
                    : Math.max(1, mapelList.length);

                  const filledCount = studentRecords.length;
                  const hasGrades = filledCount > 0;

                  // Single subject record if filtered by mapel
                  const singleRecord = selectedMapel !== "Semua"
                    ? studentRecords.find((n) => n.mapel.toLowerCase() === selectedMapel.toLowerCase())
                    : null;

                  // Averages for STS & SAS
                  const midScores = studentRecords.map((n) => getStudentMid(n).nilaiMid);
                  const avgMid = midScores.length > 0
                    ? Math.round(midScores.reduce((a, b) => a + b, 0) / midScores.length)
                    : 0;

                  const akhirScores = studentRecords.map((n) => getStudentAkhir(n).nilaiAkhir);
                  const avgAkhir = akhirScores.length > 0
                    ? Math.round(akhirScores.reduce((a, b) => a + b, 0) / akhirScores.length)
                    : 0;

                  const predikatMid = hasGrades ? calculateMidGrade(avgMid).predikatMid : "-";
                  const predikatAkhir = hasGrades ? getPredikatFromScore(avgAkhir) : "-";

                  // Render Baris: Mode Semua Mapel (Ringkasan Siswa)
                  if (selectedMapel === "Semua") {
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">
                          {index + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                              {s.nama.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                                {s.nama}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                NISN: {s.nisn}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {s.kelas}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {!hasGrades ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>0 / {totalMapelCount} Mapel (Belum Diisi)</span>
                            </span>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 ${
                                filledCount >= totalMapelCount
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  filledCount >= totalMapelCount ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              ></span>
                              <span>
                                {filledCount} / {totalMapelCount} Mapel {filledCount >= totalMapelCount ? "(Lengkap)" : ""}
                              </span>
                            </span>
                          )}
                        </td>

                        {/* Skor & Predikat */}
                        {isTengah ? (
                          <>
                            <td className="px-4 py-3.5 text-center bg-amber-500/5 dark:bg-amber-500/10">
                              {hasGrades ? (
                                <span className="font-bold text-sm text-amber-600 dark:text-amber-400 font-mono">
                                  {avgMid}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {hasGrades ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    predikatMid === "A"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                      : predikatMid === "B"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                  }`}
                                >
                                  {predikatMid}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {hasGrades ? (
                                avgMid >= 75 ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                    Tuntas (&ge; 75)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                    Remedial (&lt; 75)
                                  </span>
                                )
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  Belum Dinilai
                                </span>
                              )}
                            </td>
                          </>
                        ) : activeRaporTab !== "semua" ? (
                          <>
                            <td className="px-4 py-3.5 text-center bg-blue-500/5 dark:bg-blue-500/10">
                              {hasGrades ? (
                                <span className="font-bold text-sm text-blue-600 dark:text-blue-400 font-mono">
                                  {avgAkhir}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {hasGrades ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    predikatAkhir === "A"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                      : predikatAkhir === "B"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                  }`}
                                >
                                  {predikatAkhir}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {hasGrades ? (
                                avgAkhir >= 75 ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                    Tuntas (&ge; 75)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                    Remedial (&lt; 75)
                                  </span>
                                )
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  Belum Dinilai
                                </span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3.5 text-center bg-amber-500/5">
                              {hasGrades ? (
                                <span className="font-bold text-xs text-amber-600 dark:text-amber-400 font-mono">
                                  {avgMid} ({predikatMid})
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center bg-blue-500/5">
                              {hasGrades ? (
                                <span className="font-bold text-xs text-blue-600 dark:text-blue-400 font-mono">
                                  {avgAkhir} ({predikatAkhir})
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              {hasGrades ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    predikatAkhir === "A"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                      : predikatAkhir === "B"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                  }`}
                                >
                                  {predikatAkhir}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {hasGrades ? (
                                avgAkhir >= 75 ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                    Tuntas
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                    Remedial
                                  </span>
                                )
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  Belum Dinilai
                                </span>
                              )}
                            </td>
                          </>
                        )}

                        {/* Kolom Aksi: Edit Nilai, Hapus, Cetak Rapor */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEdit && (
                              <>
                                {/* Tombol Input / Edit Nilai */}
                                <button
                                  onClick={() => handleOpenBulkAdd(s.id, "per-siswa")}
                                  title={hasGrades ? `Edit Seluruh Nilai (${filledCount} Mapel)` : `Input Nilai Siswa Ini`}
                                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                    hasGrades
                                      ? isTengah
                                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700"
                                  }`}
                                >
                                  <Zap className={`h-3.5 w-3.5 ${hasGrades ? "fill-white" : "fill-amber-500"}`} />
                                  <span>{hasGrades ? "Edit Nilai" : "Input Nilai"}</span>
                                </button>

                                {/* Tombol Hapus */}
                                {hasGrades ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeletingAllSiswa({
                                        id: s.id,
                                        nama: s.nama,
                                        kelas: s.kelas,
                                        count: filledCount,
                                      })
                                    }
                                    title={`Hapus Seluruh Nilai ${s.nama} (${filledCount} Mapel)`}
                                    className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingSiswaTarget(s)}
                                    title={`Hapus Data Siswa ${s.nama}`}
                                    className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <UserX className="h-3.5 w-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* Tombol Cetak Rapor */}
                            <button
                              onClick={() => handleOpenRapor(s, isTengah ? "tengah" : "akhir", activeSemester)}
                              title={`Cetak E-Rapor ${isTengah ? "STS" : "SAS"} untuk ${s.nama}`}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Cetak Rapor</span>
                            </button>

                            {/* Tombol WhatsApp */}
                            <button
                              onClick={() => handleOpenWhatsAppModal(s, isTengah ? "tengah" : "akhir", activeSemester)}
                              title="Kirim Ringkasan Nilai via WhatsApp ke Wali"
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center cursor-pointer"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Render Baris: Mode Mata Pelajaran Tertentu
                  const mapelObj = mapelList.find(
                    (m) => m.nama.toLowerCase() === selectedMapel.toLowerCase()
                  );
                  const kkm = mapelObj?.kkm || 75;
                  const mid = singleRecord ? getStudentMid(singleRecord) : null;
                  const akhir = singleRecord ? getStudentAkhir(singleRecord) : null;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {s.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                              {s.nama}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              NISN: {s.nisn}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {s.kelas}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                          {selectedMapel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          KKM: {kkm}
                        </span>
                      </td>

                      {/* Nilai Columns */}
                      {isTengah ? (
                        <>
                          <td className="px-4 py-3.5 text-center bg-amber-500/5 dark:bg-amber-500/10">
                            {mid ? (
                              <span className="font-bold text-sm text-amber-600 dark:text-amber-400 font-mono">
                                {mid.nilaiMid}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            {mid ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  mid.predikatMid === "A"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                    : mid.predikatMid === "B"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                }`}
                              >
                                {mid.predikatMid}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {mid ? (
                              mid.nilaiMid >= kkm ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                  Tuntas (KKM {kkm})
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                  Remedial (KKM {kkm})
                                </span>
                              )
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Belum Diisi
                              </span>
                            )}
                          </td>
                        </>
                      ) : activeRaporTab !== "semua" ? (
                        <>
                          <td className="px-3 py-3.5 text-center font-mono font-medium text-xs">
                            {singleRecord ? singleRecord.tugas : "-"}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-medium text-xs">
                            {singleRecord ? singleRecord.uts : "-"}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-medium text-xs">
                            {singleRecord ? singleRecord.uas : "-"}
                          </td>
                          <td className="px-4 py-3.5 text-center bg-blue-500/5 dark:bg-blue-500/10">
                            {akhir ? (
                              <span className="font-bold text-sm text-blue-600 dark:text-blue-400 font-mono">
                                {akhir.nilaiAkhir}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            {akhir ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  akhir.predikat === "A"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                    : akhir.predikat === "B"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                }`}
                              >
                                {akhir.predikat}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {akhir ? (
                              akhir.nilaiAkhir >= kkm ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                  Tuntas (KKM {kkm})
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                  Remedial (KKM {kkm})
                                </span>
                              )
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Belum Diisi
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-3.5 text-center font-mono text-xs">
                            {singleRecord ? singleRecord.tugas : "-"}
                          </td>
                          <td className="px-2 py-3.5 text-center font-mono text-xs">
                            {singleRecord ? singleRecord.uts : "-"}
                          </td>
                          <td className="px-2 py-3.5 text-center font-mono text-xs">
                            {singleRecord ? singleRecord.uas : "-"}
                          </td>
                          <td className="px-3 py-3.5 text-center bg-blue-500/5 font-mono font-bold text-xs text-blue-600">
                            {akhir ? akhir.nilaiAkhir : "-"}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            {akhir ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {akhir.predikat}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {akhir ? (
                              akhir.nilaiAkhir >= kkm ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                  Tuntas
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                  Remedial
                                </span>
                              )
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Belum Diisi
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <>
                              {/* Tombol Input / Edit Nilai */}
                              <button
                                onClick={() => {
                                  if (singleRecord) {
                                    handleOpenEdit(singleRecord);
                                  } else {
                                    handleOpenBulkAdd(s.id, "per-siswa");
                                  }
                                }}
                                title={singleRecord ? `Edit Nilai ${selectedMapel}` : `Input Nilai ${selectedMapel} untuk ${s.nama}`}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                  singleRecord
                                    ? isTengah
                                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700"
                                }`}
                              >
                                <Zap className={`h-3.5 w-3.5 ${singleRecord ? "fill-white" : "fill-amber-500"}`} />
                                <span>{singleRecord ? "Edit Nilai" : "Input Nilai"}</span>
                              </button>

                              {/* Tombol Hapus */}
                              {singleRecord ? (
                                <button
                                  type="button"
                                  onClick={() => setDeletingNilai(singleRecord)}
                                  title={`Hapus Nilai ${selectedMapel} untuk ${s.nama}`}
                                  className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus</span>
                                </button>
                              ) : hasGrades ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeletingAllSiswa({
                                      id: s.id,
                                      nama: s.nama,
                                      kelas: s.kelas,
                                      count: filledCount,
                                    })
                                  }
                                  title={`Hapus Seluruh Nilai ${s.nama} (${filledCount} Mapel)`}
                                  className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingSiswaTarget(s)}
                                  title={`Hapus Siswa ${s.nama} dari Sistem`}
                                  className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Tombol Cetak Rapor */}
                          <button
                            onClick={() => handleOpenRapor(s, isTengah ? "tengah" : "akhir", activeSemester)}
                            title={`Cetak E-Rapor ${isTengah ? "STS" : "SAS"} untuk ${s.nama}`}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak Rapor</span>
                          </button>

                          {/* Tombol WhatsApp */}
                          <button
                            onClick={() => handleOpenWhatsAppModal(s, isTengah ? "tengah" : "akhir", activeSemester)}
                            title="Kirim Ringkasan Nilai via WhatsApp ke Wali"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center cursor-pointer"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
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

      {/* ========================================================= */}
      {/* MODAL 1: INPUT BULK NILAI SISWA (SELURUH MAPEL SEKALIGUS) */}
      {/* ========================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 1: INPUT BULK NILAI SISWA (DUAL-MODE: PER-KELAS & PER-SISWA)         */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 relative my-auto max-h-[94vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 sm:px-7 py-4 shrink-0 bg-white dark:bg-slate-900">
              <div className="pr-4">
                <div className="flex items-center gap-2 text-amber-500 mb-0.5">
                  <Zap className="h-4 w-4 fill-amber-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Input Nilai Massal &bull; Multi-Penilaian &amp; Dual-Mode
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Input Bulk Nilai &mdash; {bulkInputMode === "per-kelas" ? `Per Rombel (${bulkSelectedKelas || "Pilih Kelas"})` : `Per Siswa (${selectedBulkStudent?.nama || "Pilih Siswa"})`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {bulkIsTengah
                    ? "Mode Sumatif Tengah Semester (STS): Hanya menginput Nilai Ujian STS (100%) tanpa catatan perkembangan."
                    : "Mode Sumatif Akhir Semester (SAS): Menginput Harian (UH 30%), STS (30%), SAS (40%), dan Catatan Capaian Belajar."}
                </p>
              </div>

              {/* Action Buttons di Header: Input Satuan, Tombol Simpan Cepat, & Tombol Tutup */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    handleOpenAdd();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                >
                  Input Satuan &rarr;
                </button>

                {/* Tombol Simpan di Atas Header */}
                <button
                  type="button"
                  onClick={(e) => handleSaveBulk(e)}
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    bulkIsTengah
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Nilai {bulkIsTengah ? "STS" : "SAS"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBulk} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-4 text-xs min-h-0">
              {/* Bagian Kontrol Atas: 4 Tab Penilaian & Mode Pengisian */}
              <div className="space-y-3 shrink-0">
                {/* 1. Baris 4 Jenis Penilaian */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Jenis Penilaian:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {/* STS Ganjil */}
                      <button
                        type="button"
                        onClick={() => handleSwitchBulkAssessment("sts-ganjil")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          bulkAssessmentTab === "sts-ganjil"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>STS Ganjil</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          bulkAssessmentTab === "sts-ganjil" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}>
                          100% STS
                        </span>
                      </button>

                      {/* SAS Ganjil */}
                      <button
                        type="button"
                        onClick={() => handleSwitchBulkAssessment("sas-ganjil")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          bulkAssessmentTab === "sas-ganjil"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
                        }`}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>SAS Ganjil</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          bulkAssessmentTab === "sas-ganjil" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          30:30:40
                        </span>
                      </button>

                      {/* STS Genap */}
                      <button
                        type="button"
                        onClick={() => handleSwitchBulkAssessment("sts-genap")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          bulkAssessmentTab === "sts-genap"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>STS Genap</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          bulkAssessmentTab === "sts-genap" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}>
                          100% STS
                        </span>
                      </button>

                      {/* SAS Genap */}
                      <button
                        type="button"
                        onClick={() => handleSwitchBulkAssessment("sas-genap")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          bulkAssessmentTab === "sas-genap"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700"
                        }`}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>SAS Genap</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          bulkAssessmentTab === "sas-genap" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                        }`}>
                          30:30:40
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Switcher Mode Pengisian (Per-Kelas vs Per-Siswa) */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Alur Pengisian:
                    </span>
                    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setBulkInputMode("per-kelas");
                          initBulkClassRows(bulkSelectedKelas, bulkSelectedMapel, bulkAssessmentTab);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          bulkInputMode === "per-kelas"
                            ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Mode Per-Kelas (Rombel)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Guru Mapel
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBulkInputMode("per-siswa");
                          initBulkRowsForStudent(bulkSiswaId, bulkActiveSemester);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          bulkInputMode === "per-siswa"
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Mode Per-Siswa (Semua Mapel)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Wali Kelas
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Selector Target Berdasarkan Mode */}
                {bulkInputMode === "per-kelas" ? (
                  /* Target: Pilih Kelas & Mata Pelajaran */
                  <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-full sm:w-1/3">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-amber-600" />
                        <span>Pilih Rombel / Kelas *</span>
                      </label>
                      <select
                        required
                        value={bulkSelectedKelas}
                        onChange={(e) => handleBulkClassChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                      >
                        {Array.from(new Set(baseSiswaList.map((s) => s.kelas)))
                          .filter(Boolean)
                          .map((k) => (
                            <option key={k} value={k}>
                              Kelas {k} ({baseSiswaList.filter((s) => s.kelas === k).length} siswa)
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-1/3">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-amber-600" />
                        <span>Pilih Mata Pelajaran *</span>
                      </label>
                      <select
                        required
                        value={bulkSelectedMapel}
                        onChange={(e) => handleBulkMapelChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                      >
                        {(teacherScope.isTeacher && teacherScope.scopedMapelList.length > 0
                          ? teacherScope.scopedMapelList
                          : mapelList
                        ).map((m) => (
                          <option key={m.id} value={m.nama}>
                            {m.nama} (KKM: {m.kkm})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:ml-auto flex items-center gap-3">
                      <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                        <span className="text-slate-400 block text-[10px]">KKM Mapel:</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm">
                          {mapelList.find((m) => m.nama.toLowerCase() === bulkSelectedMapel.toLowerCase())?.kkm || 75}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                        <span className="text-slate-400 block text-[10px]">Siswa di Kelas:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono text-sm">
                          {bulkClassRows.length} Siswa
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Target: Pilih Siswa (Mode Per-Siswa) */
                  <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="w-full md:w-1/2">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <span>Pilih Peserta Didik Target *</span>
                      </label>
                      <select
                        required
                        value={bulkSiswaId}
                        onChange={(e) => handleBulkSiswaChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        {baseSiswaList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} &bull; Kelas {s.kelas} &bull; NISN: {s.nisn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBulkStudent && (
                      <div className="flex flex-wrap items-center gap-3 md:ml-auto">
                        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow">
                            {selectedBulkStudent.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {selectedBulkStudent.nama}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Kelas <strong>{selectedBulkStudent.kelas}</strong> &bull; NISN:{" "}
                              <span className="font-mono">{selectedBulkStudent.nisn}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Quick-Fill Toolbar Adaptif */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                      {bulkIsTengah
                        ? "Opsi Cepat Nilai STS (Terapkan Massal):"
                        : "Opsi Cepat Nilai SAS (Terapkan Massal):"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {bulkIsTengah ? (
                      /* Quick-Fill STS: Hanya 1 Nilai STS */
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                          Nilai STS:
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quickFillSts}
                          onChange={(e) => setQuickFillSts(Number(e.target.value))}
                          className="w-14 text-center font-mono font-extrabold bg-transparent outline-none text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                    ) : (
                      /* Quick-Fill SAS: UH, STS, UAS */
                      <>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] text-slate-400 font-medium">UH:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={quickFillValues.tugas}
                            onChange={(e) =>
                              setQuickFillValues({
                                ...quickFillValues,
                                tugas: Number(e.target.value),
                              })
                            }
                            className="w-11 text-center font-mono font-bold bg-transparent outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] text-slate-400 font-medium">STS:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={quickFillValues.uts}
                            onChange={(e) =>
                              setQuickFillValues({
                                ...quickFillValues,
                                uts: Number(e.target.value),
                              })
                            }
                            className="w-11 text-center font-mono font-bold bg-transparent outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] text-slate-400 font-medium">SAS:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={quickFillValues.uas}
                            onChange={(e) =>
                              setQuickFillValues({
                                ...quickFillValues,
                                uas: Number(e.target.value),
                              })
                            }
                            className="w-11 text-center font-mono font-bold bg-transparent outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={
                        bulkInputMode === "per-kelas"
                          ? handleApplyQuickFillClass
                          : handleApplyQuickFillStudent
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      <span>Terapkan ke Semua {bulkInputMode === "per-kelas" ? "Siswa" : "Mapel"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (bulkInputMode === "per-kelas") {
                          initBulkClassRows(bulkSelectedKelas, bulkSelectedMapel, bulkAssessmentTab);
                        } else {
                          initBulkRowsForStudent(bulkSiswaId, bulkActiveSemester);
                        }
                      }}
                      title="Muat Ulang Nilai Tersimpan"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabel Input Massal */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-[220px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    {bulkInputMode === "per-kelas" ? (
                      /* Header Tabel Mode Per-Kelas */
                      bulkIsTengah ? (
                        /* Mode Per-Kelas & STS: No, NISN, Siswa, Nilai STS, Predikat, Ketuntasan, Aksi */
                        <tr>
                          <th className="px-3 py-2.5 text-center w-10">No</th>
                          <th className="px-3 py-2.5 w-28">NISN</th>
                          <th className="px-4 py-2.5">Nama Peserta Didik</th>
                          <th className="px-3 py-2.5 text-center w-32 bg-amber-500/10">
                            Nilai Ujian STS (0-100)
                          </th>
                          <th className="px-3 py-2.5 text-center w-24">Predikat STS</th>
                          <th className="px-4 py-2.5 text-center w-36">Status Ketuntasan</th>
                          <th className="px-3 py-2.5 text-center w-14">Aksi</th>
                        </tr>
                      ) : (
                        /* Mode Per-Kelas & SAS: No, NISN, Siswa, UH, STS, SAS, Akhir, Predikat, Catatan, Aksi */
                        <tr>
                          <th className="px-3 py-2.5 text-center w-8">No</th>
                          <th className="px-3 py-2.5 w-24">NISN</th>
                          <th className="px-4 py-2.5">Nama Peserta Didik</th>
                          <th className="px-2 py-2.5 text-center w-20">UH (30%)</th>
                          <th className="px-2 py-2.5 text-center w-20">STS (30%)</th>
                          <th className="px-2 py-2.5 text-center w-20">SAS (40%)</th>
                          <th className="px-2 py-2.5 text-center w-24 bg-blue-500/10">Nilai Akhir</th>
                          <th className="px-2 py-2.5 text-center w-16">Predikat</th>
                          <th className="px-3 py-2.5">Catatan Capaian Belajar</th>
                          <th className="px-2 py-2.5 text-center w-12">Aksi</th>
                        </tr>
                      )
                    ) : (
                      /* Header Tabel Mode Per-Siswa */
                      bulkIsTengah ? (
                        /* Mode Per-Siswa & STS: No, Mapel & KKM, Nilai STS, Predikat, Ketuntasan, Aksi */
                        <tr>
                          <th className="px-3 py-2.5 text-center w-10">No</th>
                          <th className="px-4 py-2.5">Mata Pelajaran &amp; KKM</th>
                          <th className="px-3 py-2.5 text-center w-36 bg-amber-500/10">
                            Nilai Ujian STS (0-100)
                          </th>
                          <th className="px-3 py-2.5 text-center w-24">Predikat STS</th>
                          <th className="px-4 py-2.5 text-center w-36">Status Ketuntasan</th>
                          <th className="px-3 py-2.5 text-center w-14">Aksi</th>
                        </tr>
                      ) : (
                        /* Mode Per-Siswa & SAS: No, Mapel & KKM, UH, STS, SAS, Akhir, Predikat, Catatan, Aksi */
                        <tr>
                          <th className="px-3 py-2.5 text-center w-8">No</th>
                          <th className="px-4 py-2.5">Mata Pelajaran &amp; KKM</th>
                          <th className="px-2 py-2.5 text-center w-20">UH (30%)</th>
                          <th className="px-2 py-2.5 text-center w-20">STS (30%)</th>
                          <th className="px-2 py-2.5 text-center w-20">SAS (40%)</th>
                          <th className="px-2 py-2.5 text-center w-24 bg-blue-500/10">Nilai Akhir</th>
                          <th className="px-2 py-2.5 text-center w-16">Predikat</th>
                          <th className="px-3 py-2.5">Catatan Capaian Belajar</th>
                          <th className="px-2 py-2.5 text-center w-12">Aksi</th>
                        </tr>
                      )
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {bulkInputMode === "per-kelas" ? (
                      /* ========================================= */
                      /* BARIS DATA: MODE PER-KELAS                */
                      /* ========================================= */
                      bulkClassRows.length === 0 ? (
                        <tr>
                          <td colSpan={bulkIsTengah ? 7 : 10} className="px-4 py-8 text-center text-slate-400">
                            Tidak ada peserta didik di kelas ini.
                          </td>
                        </tr>
                      ) : (
                        bulkClassRows.map((row, idx) => {
                          const rowMid = calculateMidGrade(Number(row.uts) || 0);
                          const rowAkhir = calculateSemesterGrade(
                            Number(row.tugas) || 0,
                            Number(row.uts) || 0,
                            Number(row.uas) || 0
                          );
                          const isTuntas = (Number(row.uts) || 0) >= row.kkm;

                          if (bulkIsTengah) {
                            /* Baris STS Mode Per-Kelas */
                            return (
                              <tr key={row.siswaId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{row.nisn}</td>
                                <td className="px-4 py-2">
                                  <span className="font-bold text-slate-900 dark:text-white block">
                                    {row.siswaNama}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {row.existingId ? "• Nilai tersimpan di database" : "• Belum tersimpan"}
                                  </span>
                                </td>

                                {/* Nilai Ujian STS Input */}
                                <td className="px-3 py-2 text-center bg-amber-500/5 dark:bg-amber-500/10">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    value={row.uts}
                                    onChange={(e) =>
                                      handleBulkClassRowChange(idx, "uts", Number(e.target.value))
                                    }
                                    className="w-20 px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono text-center font-extrabold text-amber-700 dark:text-amber-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                                  />
                                </td>

                                {/* Predikat STS Live */}
                                <td className="px-3 py-2 text-center">
                                  <span
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                      rowMid.predikatMid === "A"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                        : rowMid.predikatMid === "B"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                    }`}
                                  >
                                    Predikat {rowMid.predikatMid}
                                  </span>
                                </td>

                                {/* Ketuntasan KKM Live */}
                                <td className="px-4 py-2 text-center">
                                  {isTuntas ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                      Tuntas (KKM {row.kkm})
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                      Remedial (KKM {row.kkm})
                                    </span>
                                  )}
                                </td>

                                {/* Aksi Hapus Nilai Tersimpan */}
                                <td className="px-3 py-2 text-center">
                                  {row.existingId && canEdit ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const item = nilaiList.find((n) => n.id === row.existingId);
                                        if (item) setDeletingNilai(item);
                                      }}
                                      title="Hapus rekaman nilai siswa ini"
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          }

                          /* Baris SAS Mode Per-Kelas */
                          return (
                            <tr key={row.siswaId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{row.nisn}</td>
                              <td className="px-4 py-2">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {row.siswaNama}
                                </span>
                              </td>

                              {/* UH Input */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  required
                                  value={row.tugas}
                                  onChange={(e) =>
                                    handleBulkClassRowChange(idx, "tugas", Number(e.target.value))
                                  }
                                  className="w-16 px-1.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>

                              {/* STS Input */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  required
                                  value={row.uts}
                                  onChange={(e) =>
                                    handleBulkClassRowChange(idx, "uts", Number(e.target.value))
                                  }
                                  className="w-16 px-1.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>

                              {/* SAS Input */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  required
                                  value={row.uas}
                                  onChange={(e) =>
                                    handleBulkClassRowChange(idx, "uas", Number(e.target.value))
                                  }
                                  className="w-16 px-1.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>

                              {/* Live Nilai Akhir */}
                              <td className="px-2 py-2 text-center bg-blue-500/5 dark:bg-blue-500/10 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                                {rowAkhir.nilaiAkhir}
                              </td>

                              {/* Live Predikat */}
                              <td className="px-2 py-2 text-center">
                                <span
                                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    rowAkhir.predikat === "A"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : rowAkhir.predikat === "B"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {rowAkhir.predikat}
                                </span>
                              </td>

                              {/* Catatan Capaian Belajar */}
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.catatan}
                                  onChange={(e) =>
                                    handleBulkClassRowChange(idx, "catatan", e.target.value)
                                  }
                                  placeholder="Catatan capaian siswa..."
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-xs outline-none focus:border-blue-500"
                                />
                              </td>

                              <td className="px-2 py-2 text-center">
                                {row.existingId && canEdit ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const item = nilaiList.find((n) => n.id === row.existingId);
                                      if (item) setDeletingNilai(item);
                                    }}
                                    title="Hapus rekaman nilai ini"
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )
                    ) : (
                      /* ========================================= */
                      /* BARIS DATA: MODE PER-SISWA                */
                      /* ========================================= */
                      bulkRows.length === 0 ? (
                        <tr>
                          <td colSpan={bulkIsTengah ? 6 : 10} className="px-4 py-8 text-center text-slate-400">
                            Tidak ada mata pelajaran yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        bulkRows.map((row, idx) => {
                          const rowMid = calculateMidGrade(Number(row.uts) || 0);
                          const rowAkhir = calculateSemesterGrade(
                            Number(row.tugas) || 0,
                            Number(row.uts) || 0,
                            Number(row.uas) || 0
                          );
                          const isTuntas = (Number(row.uts) || 0) >= row.kkm;

                          if (bulkIsTengah) {
                            /* Baris STS Mode Per-Siswa */
                            return (
                              <tr key={row.mapel} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="px-4 py-2">
                                  <span className="font-bold text-slate-900 dark:text-white block">
                                    {row.mapel}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    KKM: {row.kkm} {row.existingId ? "• Sudah ada nilai" : "• Belum diinput"}
                                  </span>
                                </td>

                                {/* Nilai Ujian STS Input */}
                                <td className="px-3 py-2 text-center bg-amber-500/5 dark:bg-amber-500/10">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    value={row.uts}
                                    onChange={(e) =>
                                      handleBulkRowChange(idx, "uts", Number(e.target.value))
                                    }
                                    className="w-20 px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono text-center font-extrabold text-amber-700 dark:text-amber-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                                  />
                                </td>

                                {/* Live Predikat */}
                                <td className="px-3 py-2 text-center">
                                  <span
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                      rowMid.predikatMid === "A"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                        : rowMid.predikatMid === "B"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                    }`}
                                  >
                                    Predikat {rowMid.predikatMid}
                                  </span>
                                </td>

                                {/* Live Ketuntasan KKM */}
                                <td className="px-4 py-2 text-center">
                                  {isTuntas ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                      Tuntas (KKM {row.kkm})
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                      Remedial (KKM {row.kkm})
                                    </span>
                                  )}
                                </td>

                                {/* Aksi Hapus Baris */}
                                <td className="px-3 py-2 text-center">
                                  {row.existingId && canEdit ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const item = nilaiList.find((n) => n.id === row.existingId);
                                        if (item) setDeletingNilai(item);
                                      }}
                                      title="Hapus rekaman nilai mapel ini"
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          }

                          /* Baris SAS Mode Per-Siswa */
                          return (
                            <tr key={row.mapel} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="px-4 py-2">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {row.mapel}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  KKM: {row.kkm} {row.existingId ? "• Sudah ada nilai" : "• Belum diinput"}
                                </span>
                              </td>

                              {/* UH */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  required
                                  value={row.tugas}
                                  onChange={(e) =>
                                    handleBulkRowChange(idx, "tugas", Number(e.target.value))
                                  }
                                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </td>

                              {/* STS */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  required
                                  value={row.uts}
                                  onChange={(e) =>
                                    handleBulkRowChange(idx, "uts", Number(e.target.value))
                                  }
                                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </td>

                              {/* SAS */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  required
                                  value={row.uas}
                                  onChange={(e) =>
                                    handleBulkRowChange(idx, "uas", Number(e.target.value))
                                  }
                                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </td>

                              {/* Live SAS Preview */}
                              <td className="px-2 py-2 text-center bg-blue-500/5 dark:bg-blue-500/10 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                                {rowAkhir.nilaiAkhir}
                              </td>

                              {/* Live Predikat */}
                              <td className="px-2 py-2 text-center">
                                <span
                                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    rowAkhir.predikat === "A"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : rowAkhir.predikat === "B"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {rowAkhir.predikat}
                                </span>
                              </td>

                              {/* Catatan Capaian Belajar */}
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.catatan}
                                  onChange={(e) =>
                                    handleBulkRowChange(idx, "catatan", e.target.value)
                                  }
                                  placeholder="Catatan capaian siswa..."
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-xs outline-none focus:border-amber-500"
                                />
                              </td>

                              <td className="px-2 py-2 text-center">
                                {row.existingId && canEdit ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const item = nilaiList.find((n) => n.id === row.existingId);
                                      if (item) setDeletingNilai(item);
                                    }}
                                    title="Hapus rekaman nilai mapel ini"
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                </table>
              </div>
              {/* Tutup Scrollable Content Area */}
              </div>

              {/* Step 4: Pinned Sticky Bottom Footer: Ringkasan Rata-Rata & Tombol Simpan Utama */}
              <div className="px-5 sm:px-7 py-3.5 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-20 shadow-lg">
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  {bulkInputMode === "per-kelas" ? (
                    bulkIsTengah ? (
                      /* Stats Per-Kelas STS */
                      <>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Rata-Rata STS Kelas:</span>
                          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                            {bulkClassAvgMid}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({bulkClassAvgMid >= 88 ? "Sangat Baik" : bulkClassAvgMid >= 75 ? "Baik" : "Cukup"})
                          </span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                        <div>
                          <span className="text-slate-400 text-[11px] block">Ketuntasan KKM:</span>
                          <span className="text-emerald-600 font-bold">{bulkClassTuntasCount} Tuntas</span>
                          <span className="text-slate-400 mx-1">&bull;</span>
                          <span className="text-rose-600 font-bold">{bulkClassRemedialCount} Remedial</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                        <div className="hidden sm:block">
                          <span className="text-slate-400 text-[11px] block">Total Siswa:</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {bulkClassRows.length} Siswa (Kelas {bulkSelectedKelas})
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Stats Per-Kelas SAS */
                      <>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Rata-Rata Akhir SAS:</span>
                          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                            {bulkClassAvgAkhir}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({bulkClassAvgAkhir >= 88 ? "Sangat Baik" : bulkClassAvgAkhir >= 75 ? "Baik" : "Cukup"})
                          </span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                        <div className="hidden sm:block">
                          <span className="text-slate-400 text-[11px] block">Total Siswa:</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {bulkClassRows.length} Siswa (Kelas {bulkSelectedKelas})
                          </span>
                        </div>
                      </>
                    )
                  ) : (
                    /* Stats Per-Siswa */
                    bulkIsTengah ? (
                      <>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Rata-Rata STS Siswa:</span>
                          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                            {bulkAvgMid}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({bulkAvgMid >= 88 ? "Sangat Baik" : bulkAvgMid >= 75 ? "Baik" : "Cukup"})
                          </span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                        <div>
                          <span className="text-slate-400 text-[11px] block">Ketuntasan Mapel:</span>
                          <span className="text-emerald-600 font-bold">{bulkStudentTuntasCount} Tuntas</span>
                          <span className="text-slate-400 mx-1">&bull;</span>
                          <span className="text-rose-600 font-bold">{bulkRows.length - bulkStudentTuntasCount} Remedial</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                        <div className="hidden sm:block">
                          <span className="text-slate-400 text-[11px] block">Total Mapel:</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {bulkRows.length} Mata Pelajaran
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Rata-Rata PAS Siswa:</span>
                          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                            {bulkAvgAkhir}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({bulkAvgAkhir >= 88 ? "Sangat Baik" : bulkAvgAkhir >= 75 ? "Baik" : "Cukup"})
                          </span>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                        <div className="hidden sm:block">
                          <span className="text-slate-400 text-[11px] block">Total Mapel:</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {bulkRows.length} Mata Pelajaran
                          </span>
                        </div>
                      </>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                      bulkIsTengah
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {bulkInputMode === "per-kelas"
                        ? `Simpan Nilai ${bulkIsTengah ? "STS" : "SAS"} (${bulkClassRows.length} Siswa)`
                        : `Simpan Nilai ${bulkIsTengah ? "STS" : "SAS"} (${bulkRows.length} Mapel)`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INPUT / EDIT SATUAN NILAI SISWA                  */}
      {/* ========================================================= */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-6">
            <button
              onClick={() => setIsInputModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between pr-8 mb-2">
              <div className="flex items-center gap-2 text-amber-500">
                <Calculator className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Input Satuan Mapel</span>
              </div>
              <div className="flex items-center gap-2">
                {!editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsInputModalOpen(false);
                      handleOpenBulkAdd(formData.siswaId);
                    }}
                    className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                  >
                    <Zap className="h-3.5 w-3.5 fill-amber-500" />
                    <span>Mode Bulk &rarr;</span>
                  </button>
                )}
                <button
                  type="submit"
                  form="singleForm"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Simpan Nilai</span>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? "Perbarui Rekaman Nilai Siswa" : "Input Nilai Komponen Siswa"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Nilai otomatis diproses untuk <strong>Rapor Tengah Semester (100% Ujian STS)</strong> dan <strong>Rapor Akhir Semester (30% UH + 30% Mid + 40% UAS)</strong>.
            </p>

            <form id="singleForm" onSubmit={handleSaveSingle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Siswa *
                </label>
                <select
                  required
                  disabled={Boolean(editingId)}
                  value={formData.siswaId}
                  onChange={(e) => setFormData({ ...formData, siswaId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {baseSiswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={formData.mapel}
                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {(teacherScope.isTeacher ? teacherScope.scopedMapelList : mapelList).map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama} (KKM: {m.kkm})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester *
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value as "Ganjil" | "Genap" })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              {/* Komponen Nilai Inputs */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Komponen Isian Penilaian Siswa (0 - 100)</span>
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Ulangan Harian (UH)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formData.tugas}
                      onChange={(e) => setFormData({ ...formData, tugas: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center font-bold"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">PAS 30% (Khusus Rapor Akhir)</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Ujian Mid (STS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formData.uts}
                      onChange={(e) => setFormData({ ...formData, uts: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center font-bold"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">STS 100% &bull; PAS 30%</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Ujian Akhir (PAS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={formData.uas}
                      onChange={(e) => setFormData({ ...formData, uas: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center font-bold"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">PAS 40%</span>
                  </div>
                </div>

                {/* Live Preview Calculation Cards */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      Sumatif Tengah Sem. (STS)
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-extrabold font-mono text-amber-700 dark:text-amber-200">
                        {liveMid.nilaiMid}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        Predikat {liveMid.predikatMid}
                      </span>
                    </div>
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                      100% Ujian STS ({formData.uts})
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300">
                      Rapor Akhir Sem. (PAS)
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-extrabold font-mono text-blue-700 dark:text-blue-200">
                        {liveAkhir.nilaiAkhir}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                        Predikat {liveAkhir.predikat}
                      </span>
                    </div>
                    <p className="text-[9px] text-blue-600 dark:text-blue-400 mt-0.5">
                      30% ({formData.tugas}) + 30% ({formData.uts}) + 40% ({formData.uas})
                    </p>
                  </div>
                </div>
              </div>

              {!isTengah && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Perkembangan (Sumatif Tengah Semester / STS)
                  </label>
                  <input
                    type="text"
                    value={formData.catatanMid}
                    onChange={(e) => setFormData({ ...formData, catatanMid: e.target.value })}
                    placeholder="Catatan keaktifan dan perkembangan belajar..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Capaian Kompetensi (Rapor Akhir Semester / PAS)
                </label>
                <textarea
                  rows={2}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Deskripsi pencapaian kompetensi akhir siswa..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                {editingId && canEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      const itemToDelete = nilaiList.find((n) => n.id === editingId);
                      if (itemToDelete) {
                        setIsInputModalOpen(false);
                        setDeletingNilai(itemToDelete);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Hapus Nilai Ini</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInputModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{editingId ? "Perbarui Rekaman Nilai" : "Simpan Nilai Siswa"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: E-RAPOR DIGITAL SIAP CETAK (MULTI-RAPOR)        */}
      {/* ========================================================= */}
      {raporSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative my-8">
            {/* Action Bar (No Print) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-6 no-print">
              {/* Type Switcher & Student Stepper in Print Modal */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Stepper Prev/Next */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={handlePrevSiswa}
                    disabled={currentSiswaIndex <= 0}
                    title="Siswa Sebelumnya"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-bold px-2 text-slate-700">
                    {currentSiswaIndex + 1} / {baseSiswaList.length}
                  </span>
                  <button
                    onClick={handleNextSiswa}
                    disabled={currentSiswaIndex >= baseSiswaList.length - 1}
                    title="Siswa Berikutnya"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Switcher Semester */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setRaporPrintSemester("Ganjil")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      raporPrintSemester === "Ganjil"
                        ? "bg-slate-800 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ganjil
                  </button>
                  <button
                    onClick={() => setRaporPrintSemester("Genap")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      raporPrintSemester === "Genap"
                        ? "bg-slate-800 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Genap
                  </button>
                </div>

                {/* Switcher STS / SAS */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setRaporPrintType("tengah")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      raporPrintType === "tengah"
                        ? "bg-amber-500 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Rapor STS</span>
                  </button>
                  <button
                    onClick={() => setRaporPrintType("akhir")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      raporPrintType === "akhir"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Rapor SAS</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons (Direct Print & PDF Export) */}
              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = raporSiswa.id;
                        setRaporSiswa(null);
                        handleOpenBulkAdd(targetId);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                      title="Edit nilai seluruh mata pelajaran untuk siswa ini"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit Nilai Siswa</span>
                    </button>

                    {nilaiList.filter((n) => n.siswaId === raporSiswa.id).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const count = nilaiList.filter((n) => n.siswaId === raporSiswa.id).length;
                          setDeletingAllSiswa({
                            id: raporSiswa.id,
                            nama: raporSiswa.nama,
                            kelas: raporSiswa.kelas,
                            count,
                          });
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Hapus seluruh rekaman nilai untuk siswa ini"
                      >
                        <Eraser className="h-4 w-4" />
                        <span>Hapus Seluruh Nilai</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeletingSiswaTarget(raporSiswa)}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                      title="Hapus siswa ini dan seluruh rekaman nilainya dari sistem"
                    >
                      <UserX className="h-4 w-4" />
                      <span>Hapus Siswa</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handlePrintReport(
                      `Rapor_${raporPrintType.toUpperCase()}_${raporSiswa.nama}_${raporSiswa.kelas}`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  title="Cetak langsung menggunakan dialog print peramban"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Langsung</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handlePrintReport(
                      `Rapor_${raporPrintType.toUpperCase()}_${raporSiswa.nama}_${raporSiswa.kelas}`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                  title="Simpan dokumen sebagai file PDF beresolusi tinggi"
                >
                  <Download className="h-4 w-4" />
                  <span>Simpan / Ekspor PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppModal(raporSiswa)}
                  className="px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-green-600/20 transition-all cursor-pointer"
                  title="Kirim ringkasan laporan hasil belajar langsung ke WhatsApp orang tua"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Kirim WA Wali</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRaporSiswa(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Official School Letterhead (Kop Surat) */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                    {profile.namaSekolah}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    NPSN: {profile.npsn} &bull; Akreditasi: {profile.akreditasi}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
                {profile.alamat} &bull; Telp: {profile.telepon} &bull; Website: {profile.website}
              </p>
            </div>

            {/* Report Title & Type Info */}
            <div className="text-center mb-5">
              <h3 className="text-base font-extrabold underline tracking-wider uppercase text-slate-900">
                {raporPrintType === "tengah"
                  ? "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)"
                  : "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)"}
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Tahun Ajaran {profile.tahunAjaranAktif} &bull; Semester {raporPrintSemester || profile.semesterAktif}
              </p>
              {raporPrintType === "akhir" && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] text-slate-700 font-medium print:hidden">
                  Komposisi Penilaian SAS: 30% Nilai Harian + 30% Ujian Mid + 40% Ujian Akhir Semester
                </div>
              )}
            </div>

            {/* Student & Class Info Box */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-500">Nama Peserta Didik: <strong className="text-slate-900">{raporSiswa.nama}</strong></p>
                <p className="text-slate-500 mt-1">NISN: <strong className="text-slate-900 font-mono">{raporSiswa.nisn}</strong></p>
              </div>
              <div>
                <p className="text-slate-500">Kelas: <strong className="text-slate-900">{raporSiswa.kelas}</strong></p>
                <p className="text-slate-500 mt-1">Status Kesiswaan: <strong className="text-slate-900">{raporSiswa.status}</strong></p>
              </div>
            </div>

            {/* Table of Grades */}
            {raporPrintType === "tengah" ? (
              // Table for Rapor Tengah Semester (PTS)
              <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-3 py-2">Mata Pelajaran</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-16">KKM</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-24 bg-amber-50">Nilai Ujian STS</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-16">Predikat</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {studentNilaiRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 px-3 py-6 text-center text-slate-400">
                        Belum ada nilai mata pelajaran yang diinputkan untuk siswa ini.
                      </td>
                    </tr>
                  ) : (
                    studentNilaiRecords.map((item, idx) => {
                      const mid = getStudentMid(item);
                      const mapelObj = mapelList.find(
                        (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                      );
                      const kkm = mapelObj?.kkm || 75;
                      const isTuntas = mid.nilaiMid >= kkm;

                      return (
                        <tr key={item.id}>
                          <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 px-3 py-2 font-semibold">{item.mapel}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{kkm}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-bold text-amber-700 bg-amber-50/50 font-mono">
                            {mid.nilaiMid}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                            {mid.predikatMid}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center font-bold text-xs">
                            {isTuntas ? (
                              <span className="text-emerald-700">Tuntas</span>
                            ) : (
                              <span className="text-rose-700">Remedial</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={3} className="border border-slate-300 px-3 py-2 text-right">
                      Rata-Rata Nilai Sumatif Tengah Semester (STS):
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-bold text-amber-800 text-sm font-mono bg-amber-50">
                      {studentMidAverage}
                    </td>
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-slate-600">
                      Predikat Umum:{" "}
                      <strong>
                        {studentMidAverage >= 88
                          ? "A (Sangat Baik)"
                          : studentMidAverage >= 75
                          ? "B (Baik)"
                          : "C (Cukup)"}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              // Table for Rapor Akhir Semester (PAS)
              <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-slate-300 px-3 py-2">Mata Pelajaran</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-14">KKM</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-20">Harian (30%)</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-20">Mid (30%)</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-20">UAS (40%)</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-20 bg-blue-50">Nilai Akhir</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-16">Predikat</th>
                    <th className="border border-slate-300 px-3 py-2">Catatan Capaian Kompetensi</th>
                  </tr>
                </thead>
                <tbody>
                  {studentNilaiRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-slate-300 px-3 py-6 text-center text-slate-400">
                        Belum ada nilai mata pelajaran yang diinputkan untuk siswa ini.
                      </td>
                    </tr>
                  ) : (
                    studentNilaiRecords.map((item, idx) => {
                      const akhir = getStudentAkhir(item);
                      const mapelObj = mapelList.find(
                        (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                      );
                      const kkm = mapelObj?.kkm || 75;

                      return (
                        <tr key={item.id}>
                          <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 px-3 py-2 font-semibold">{item.mapel}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{kkm}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{item.tugas}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{item.uts}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{item.uas}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-bold text-blue-700 bg-blue-50/50 font-mono">
                            {akhir.nilaiAkhir}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                            {akhir.predikat}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-slate-600 text-[11px]">
                            {akhir.catatan || "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={6} className="border border-slate-300 px-3 py-2 text-right">
                      Rata-Rata Nilai Akhir Semester (PAS):
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-bold text-blue-800 text-sm font-mono bg-blue-50">
                      {studentAkhirAverage}
                    </td>
                    <td colSpan={2} className="border border-slate-300 px-3 py-2 text-slate-600">
                      Predikat Umum:{" "}
                      <strong>
                        {studentAkhirAverage >= 88
                          ? "A (Sangat Baik)"
                          : studentAkhirAverage >= 75
                          ? "B (Baik)"
                          : "C (Cukup)"}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Signature Area */}
            {(() => {
              const matchedKelasObj = kelasList.find(
                (k) => isClassMatch(k.nama, raporSiswa.kelas)
              );
              const matchedWaliGuru = matchedKelasObj
                ? guruList.find((g) => g.id === matchedKelasObj.waliKelasId)
                : null;
              const waliNama =
                (matchedWaliGuru?.nama
                  ? `${matchedWaliGuru.nama}, ${matchedWaliGuru.gelar || ""}`.trim()
                  : null) ||
                matchedKelasObj?.waliKelasNama ||
                (teacherScope.isTeacher ? teacherScope.teacherName : "Wali Kelas");
              const waliNip = matchedWaliGuru?.nip || "198506122010012015";

              return (
                <div className="grid grid-cols-2 text-center text-xs pt-6 border-t border-slate-200">
                  <div>
                    <p className="text-slate-500">Mengetahui,</p>
                    <p className="text-slate-500">Wali Kelas {raporSiswa.kelas},</p>
                    <div className="h-16" />
                    <p className="font-bold underline">{waliNama}</p>
                    <p className="text-[10px] text-slate-400">NIP: {waliNip}</p>
                  </div>

                  <div>
                    <p className="text-slate-500">Jakarta, {formatDateIndo(new Date().toISOString().split("T")[0])}</p>
                    <p className="text-slate-500">Kepala Sekolah,</p>
                    <div className="h-14" />
                    <p className="font-bold underline">{profile.kepalaSekolah}</p>
                    <p className="text-[10px] text-slate-400">NIP: 197204151998031002</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: E-RAPOR SELURUH SISWA (BUNDEL RAPOR & LEGER NILAI) */}
      {/* ========================================================= */}
      {isBatchRaporOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-6xl bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl relative my-6 max-h-[95vh] overflow-y-auto print:m-0 print:p-0 print:max-w-none print:shadow-none print:rounded-none print:max-h-none">
            {/* Action Bar (No Print) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6 no-print">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1.5">
                  <Printer className="h-3.5 w-3.5" />
                  <span>Modul Cetak / Ekspor Rapor Seluruh Siswa</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>E-Rapor Rombel: {batchSelectedKelas === "Semua" ? "Seluruh Siswa" : `Kelas ${batchSelectedKelas}`}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {batchStudents.length} Siswa
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih mode cetak: Bundel Rapor Lembar Individu (multi-halaman) atau Buku Leger Nilai Komprehensif.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Mode Selector: Bundel vs Leger */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setBatchRaporViewMode("bundel")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      batchRaporViewMode === "bundel"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Bundel Rapor ({batchStudents.length} Lembar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchRaporViewMode("leger")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      batchRaporViewMode === "leger"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Buku Leger Nilai</span>
                  </button>
                </div>

                {/* Switcher Semester */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setBatchRaporSemester("Ganjil")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      batchRaporSemester === "Ganjil"
                        ? "bg-slate-800 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ganjil
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchRaporSemester("Genap")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      batchRaporSemester === "Genap"
                        ? "bg-slate-800 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Genap
                  </button>
                </div>

                {/* Switcher STS / SAS */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setBatchRaporType("tengah")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      batchRaporType === "tengah"
                        ? "bg-amber-500 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Rapor STS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchRaporType("akhir")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      batchRaporType === "akhir"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Rapor SAS</span>
                  </button>
                </div>

                {/* Filter Kelas jika bukan guru terkunci */}
                {!teacherScope.isTeacher && (
                  <select
                    value={batchSelectedKelas}
                    onChange={(e) => setBatchSelectedKelas(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="Semua">Semua Kelas ({baseSiswaList.length} Siswa)</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama} ({baseSiswaList.filter((s) => s.kelas.toLowerCase() === k.nama.toLowerCase()).length} Siswa)
                      </option>
                    ))}
                  </select>
                )}

                {/* Tombol Cetak Langsung */}
                <button
                  type="button"
                  onClick={() =>
                    handlePrintReport(
                      batchRaporViewMode === "bundel"
                        ? `Bundel_Rapor_${batchRaporType.toUpperCase()}_Kelas_${batchSelectedKelas}`
                        : `Buku_Leger_Nilai_${batchRaporType.toUpperCase()}_Kelas_${batchSelectedKelas}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  title="Cetak langsung menggunakan printer atau dialog cetak"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Langsung</span>
                </button>

                {/* Tombol Simpan PDF */}
                <button
                  type="button"
                  onClick={() =>
                    handlePrintReport(
                      batchRaporViewMode === "bundel"
                        ? `Bundel_Rapor_${batchRaporType.toUpperCase()}_Kelas_${batchSelectedKelas}`
                        : `Buku_Leger_Nilai_${batchRaporType.toUpperCase()}_Kelas_${batchSelectedKelas}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer transition-all"
                  title="Simpan dokumen sebagai satu berkas PDF"
                >
                  <Download className="h-4 w-4" />
                  <span>Simpan / Ekspor PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBatchRaporOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* KONTEN 1: MODE BUNDEL LEMBAR RAPOR PER SISWA (MULTI-PAGE) */}
            {/* ========================================================= */}
            {batchRaporViewMode === "bundel" && (
              <div className="space-y-12 print:space-y-0">
                {batchStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Tidak ada siswa yang ditemukan untuk kelas yang dipilih.
                  </div>
                ) : (
                  batchStudents.map((siswa) => {
                    const studentRecords = nilaiList.filter(
                      (n) =>
                        n.siswaId === siswa.id &&
                        (n.semester || "Ganjil").toLowerCase() === (batchRaporSemester || "Ganjil").toLowerCase()
                    );
                    const midAvg =
                      studentRecords.length > 0
                        ? Math.round(
                            studentRecords.reduce(
                              (acc, curr) => acc + getStudentMid(curr).nilaiMid,
                              0
                            ) / studentRecords.length
                          )
                        : 0;
                    const akhirAvg =
                      studentRecords.length > 0
                        ? Math.round(
                            studentRecords.reduce(
                              (acc, curr) => acc + getStudentAkhir(curr).nilaiAkhir,
                              0
                            ) / studentRecords.length
                          )
                        : 0;

                    const matchedKelasObj = kelasList.find(
                      (k) => isClassMatch(k.nama, siswa.kelas)
                    );
                    const matchedWaliGuru = matchedKelasObj
                      ? guruList.find((g) => g.id === matchedKelasObj.waliKelasId)
                      : null;
                    const waliNama =
                      (matchedWaliGuru?.nama
                        ? `${matchedWaliGuru.nama}, ${matchedWaliGuru.gelar || ""}`.trim()
                        : null) ||
                      matchedKelasObj?.waliKelasNama ||
                      (teacherScope.isTeacher ? teacherScope.teacherName : "Wali Kelas");
                    const waliNip = matchedWaliGuru?.nip || "198506122010012015";

                    return (
                      <div
                        key={siswa.id}
                        style={{ pageBreakAfter: "always", breakAfter: "page" }}
                        className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white print:border-none print:p-0 print:m-0"
                      >
                        {/* Kop Surat */}
                        <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                              <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                              <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                                {profile.namaSekolah}
                              </h2>
                              <p className="text-[11px] text-slate-600 font-medium">
                                NPSN: {profile.npsn} &bull; Akreditasi: {profile.akreditasi}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 max-w-xl mx-auto">
                            {profile.alamat} &bull; Telp: {profile.telepon} &bull; Website: {profile.website}
                          </p>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-4">
                          <h3 className="text-sm font-extrabold underline tracking-wider uppercase text-slate-900">
                            {batchRaporType === "tengah"
                              ? "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)"
                              : "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)"}
                          </h3>
                          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                            Tahun Ajaran {profile.tahunAjaranAktif} &bull; Semester {batchRaporSemester || profile.semesterAktif}
                          </p>
                        </div>

                        {/* Student Info Box */}
                        <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 print:bg-slate-50">
                          <div>
                            <p className="text-slate-500">Nama Peserta Didik: <strong className="text-slate-900">{siswa.nama}</strong></p>
                            <p className="text-slate-500 mt-0.5">NISN: <strong className="text-slate-900 font-mono">{siswa.nisn}</strong></p>
                          </div>
                          <div>
                            <p className="text-slate-500">Kelas: <strong className="text-slate-900">{siswa.kelas}</strong></p>
                            <p className="text-slate-500 mt-0.5">Status: <strong className="text-slate-900">{siswa.status}</strong></p>
                          </div>
                        </div>

                        {/* Table of Grades */}
                        {batchRaporType === "tengah" ? (
                          <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-5">
                            <thead>
                              <tr className="bg-slate-100 text-slate-800 font-bold text-[11px]">
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-8">No</th>
                                <th className="border border-slate-300 px-2 py-1.5">Mata Pelajaran</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-12">KKM</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-20 bg-amber-50">Nilai Ujian STS</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-14">Predikat</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-20">Keterangan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentRecords.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="border border-slate-300 px-3 py-4 text-center text-slate-400">
                                    Belum ada nilai yang diinputkan untuk siswa ini.
                                  </td>
                                </tr>
                              ) : (
                                studentRecords.map((item, idx) => {
                                  const mid = getStudentMid(item);
                                  const mapelObj = mapelList.find(
                                    (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                  );
                                  const kkm = mapelObj?.kkm || 75;
                                  const isTuntas = mid.nilaiMid >= kkm;

                                  return (
                                    <tr key={item.id} className="text-[11px]">
                                      <td className="border border-slate-300 px-2 py-1.5 text-center">{idx + 1}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 font-semibold">{item.mapel}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{kkm}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-amber-800 bg-amber-50/50 font-mono">
                                        {mid.nilaiMid}
                                      </td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                                        {mid.predikatMid}
                                      </td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-[10px]">
                                        {isTuntas ? (
                                          <span className="text-emerald-700">Tuntas</span>
                                        ) : (
                                          <span className="text-rose-700">Remedial</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-semibold text-[11px]">
                                <td colSpan={3} className="border border-slate-300 px-3 py-1.5 text-right">
                                  Rata-Rata Nilai Rapor STS:
                                </td>
                                <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-amber-800 font-mono bg-amber-50">
                                  {midAvg}
                                </td>
                                <td colSpan={2} className="border border-slate-300 px-3 py-1.5 text-slate-600">
                                  Predikat:{" "}
                                  <strong>
                                    {midAvg >= 88 ? "A (Sangat Baik)" : midAvg >= 75 ? "B (Baik)" : "C (Cukup)"}
                                  </strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        ) : (
                          <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-5">
                            <thead>
                              <tr className="bg-slate-100 text-slate-800 font-bold text-[11px]">
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-8">No</th>
                                <th className="border border-slate-300 px-2 py-1.5">Mata Pelajaran</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-12">KKM</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-16">UH (30%)</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-16">Mid (30%)</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-16">UAS (40%)</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-16 bg-blue-50">Nilai Akhir</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-14">Predikat</th>
                                <th className="border border-slate-300 px-2 py-1.5">Catatan Capaian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentRecords.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="border border-slate-300 px-3 py-4 text-center text-slate-400">
                                    Belum ada nilai yang diinputkan untuk siswa ini.
                                  </td>
                                </tr>
                              ) : (
                                studentRecords.map((item, idx) => {
                                  const akhir = getStudentAkhir(item);
                                  const mapelObj = mapelList.find(
                                    (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                  );
                                  const kkm = mapelObj?.kkm || 75;

                                  return (
                                    <tr key={item.id} className="text-[11px]">
                                      <td className="border border-slate-300 px-2 py-1.5 text-center">{idx + 1}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 font-semibold">{item.mapel}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{kkm}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{item.tugas}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{item.uts}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{item.uas}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-blue-800 bg-blue-50/50 font-mono">
                                        {akhir.nilaiAkhir}
                                      </td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                                        {akhir.predikat}
                                      </td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-slate-600 text-[10px]">
                                        {akhir.catatan || "-"}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-semibold text-[11px]">
                                <td colSpan={6} className="border border-slate-300 px-3 py-1.5 text-right">
                                  Rata-Rata Nilai Rapor Akhir Semester (PAS):
                                </td>
                                <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-blue-800 font-mono bg-blue-50">
                                  {akhirAvg}
                                </td>
                                <td colSpan={2} className="border border-slate-300 px-3 py-1.5 text-slate-600">
                                  Predikat:{" "}
                                  <strong>
                                    {akhirAvg >= 88 ? "A (Sangat Baik)" : akhirAvg >= 75 ? "B (Baik)" : "C (Cukup)"}
                                  </strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        )}

                        {/* Signature Area */}
                        <div className="grid grid-cols-2 text-center text-xs pt-4 border-t border-slate-200">
                          <div>
                            <p className="text-slate-500">Mengetahui,</p>
                            <p className="text-slate-500">Wali Kelas {siswa.kelas},</p>
                            <div className="h-14" />
                            <p className="font-bold underline">{waliNama}</p>
                            <p className="text-[10px] text-slate-400">NIP: {waliNip}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Jakarta, {formatDateIndo(new Date().toISOString().split("T")[0])}</p>
                            <p className="text-slate-500">Kepala Sekolah,</p>
                            <div className="h-12" />
                            <p className="font-bold underline">{profile.kepalaSekolah}</p>
                            <p className="text-[10px] text-slate-400">NIP: 197204151998031002</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* KONTEN 2: MODE BUKU LEGER NILAI ROMBEL (TABEL REKAP)      */}
            {/* ========================================================= */}
            {batchRaporViewMode === "leger" && (
              <div className="space-y-6">
                {/* Kop Surat Leger */}
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                  <h2 className="text-lg font-black uppercase text-slate-900">
                    {profile.namaSekolah}
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    NPSN: {profile.npsn} &bull; Akreditasi: {profile.akreditasi} &bull; {profile.alamat}
                  </p>
                  <h3 className="text-base font-extrabold uppercase mt-2 text-indigo-950">
                    BUKU LEGER NILAI HASIL BELAJAR {batchRaporType === "tengah" ? "SUMATIF TENGAH SEMESTER (STS)" : "SUMATIF AKHIR SEMESTER (SAS)"}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Kelas: <strong>{batchSelectedKelas === "Semua" ? "Semua Kelas" : batchSelectedKelas}</strong> &bull; Semester: <strong>{batchRaporSemester || profile.semesterAktif}</strong> &bull; Tahun Ajaran: <strong>{profile.tahunAjaranAktif}</strong>
                  </p>
                </div>

                {/* Tabel Leger Nilai Komprehensif */}
                {(() => {
                  const rankedStudents = batchStudents
                    .map((s) => {
                      const records = nilaiList.filter(
                        (n) =>
                          n.siswaId === s.id &&
                          (n.semester || "Ganjil").toLowerCase() === (batchRaporSemester || "Ganjil").toLowerCase()
                      );
                      let total = 0;
                      let count = 0;
                      const scoresByMapel: Record<string, number> = {};

                      mapelList.forEach((m) => {
                        const rec = records.find(
                          (r) => r.mapel.toLowerCase() === m.nama.toLowerCase()
                        );
                        if (rec) {
                          const val =
                            batchRaporType === "tengah"
                              ? getStudentMid(rec).nilaiMid
                              : getStudentAkhir(rec).nilaiAkhir;
                          scoresByMapel[m.nama] = val;
                          total += val;
                          count++;
                        } else {
                          scoresByMapel[m.nama] = 0;
                        }
                      });

                      const avg = count > 0 ? Math.round(total / count) : 0;
                      return {
                        ...s,
                        scoresByMapel,
                        totalScore: total,
                        avgScore: avg,
                      };
                    })
                    .sort((a, b) => b.avgScore - a.avgScore);

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 font-bold text-[11px]">
                            <th className="border border-slate-300 px-2 py-2 text-center w-9">No</th>
                            <th className="border border-slate-300 px-2 py-2 text-center w-24">NISN</th>
                            <th className="border border-slate-300 px-3 py-2 min-w-[160px]">Nama Peserta Didik</th>
                            <th className="border border-slate-300 px-2 py-2 text-center w-14">Kelas</th>
                            {mapelList.map((m) => (
                              <th
                                key={m.id}
                                className="border border-slate-300 px-2 py-2 text-center min-w-[65px]"
                                title={`${m.nama} (KKM: ${m.kkm || 75})`}
                              >
                                <span className="block truncate max-w-[70px]">{m.nama}</span>
                                <span className="text-[9px] font-normal text-slate-500">KKM {m.kkm || 75}</span>
                              </th>
                            ))}
                            <th className="border border-slate-300 px-2 py-2 text-center bg-slate-200 w-16">Total</th>
                            <th className="border border-slate-300 px-2 py-2 text-center bg-amber-100 w-14">Rata2</th>
                            <th className="border border-slate-300 px-2 py-2 text-center bg-emerald-100 w-12">Rank</th>
                            <th className="border border-slate-300 px-2 py-2 text-center w-20">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {rankedStudents.length === 0 ? (
                            <tr>
                              <td colSpan={mapelList.length + 8} className="text-center py-6 text-slate-400">
                                Tidak ada data siswa untuk ditampilkan.
                              </td>
                            </tr>
                          ) : (
                            rankedStudents.map((s, idx) => (
                              <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-[10px] text-slate-600">{s.nisn}</td>
                                <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">{s.nama}</td>
                                <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-600">{s.kelas}</td>
                                {mapelList.map((m) => {
                                  const val = s.scoresByMapel[m.nama];
                                  const isTuntas = val >= (m.kkm || 75);
                                  return (
                                    <td
                                      key={m.id}
                                      className={`border border-slate-300 px-2 py-1.5 text-center font-mono ${
                                        val === 0
                                          ? "text-slate-300"
                                          : isTuntas
                                          ? "text-slate-800 font-semibold"
                                          : "text-rose-600 font-bold bg-rose-50"
                                      }`}
                                    >
                                      {val > 0 ? val : "-"}
                                    </td>
                                  );
                                })}
                                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-bold bg-slate-100 text-slate-900">{s.totalScore}</td>
                                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-black text-amber-900 bg-amber-50">{s.avgScore}</td>
                                <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-emerald-800 bg-emerald-50">#{idx + 1}</td>
                                <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.avgScore >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                    {s.avgScore >= 75 ? "Tuntas" : "Remidial"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* Tanda Tangan Leger */}
                <div className="grid grid-cols-2 text-center text-xs pt-6 border-t border-slate-200">
                  <div>
                    <p className="text-slate-500">Mengetahui,</p>
                    <p className="font-bold">Kepala Sekolah</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{profile.kepalaSekolah}</p>
                    <p className="text-[10px] text-slate-400">NIP. 197204151998031002</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Jakarta, {formatDateIndo(new Date().toISOString().split("T")[0])}</p>
                    <p className="font-bold">Wali Kelas {batchSelectedKelas === "Semua" ? "" : batchSelectedKelas}</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{teacherScope.teacherName || user?.name || "Wali Kelas"}</p>
                    <p className="text-[10px] text-slate-400">Guru Pembina / Wali Kelas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: PRATINJAU & PENGIRIMAN WHATSAPP WALI SANTRI     */}
      {/* ========================================================= */}
      {isWaModalOpen && waTargetSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto no-print">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-6">
            <button
              onClick={() => setIsWaModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div className="h-11 w-11 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center shadow-sm">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Kirim Laporan Rapor via WhatsApp</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300">
                    Official Gateway
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Kirimkan ringkasan hasil belajar ananda langsung ke nomor WhatsApp wali santri secara santun dan terstruktur.
                </p>
              </div>
            </div>

            {/* Student & Guardian Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Siswa Penerima:</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{waTargetSiswa.nama}</p>
                <p className="text-slate-500">
                  Kelas <strong>{waTargetSiswa.kelas}</strong> &bull; NISN: <span className="font-mono">{waTargetSiswa.nisn}</span>
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-[11px]">Wali Santri & Kontak:</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {waTargetSiswa.namaWali || "Bapak/Ibu Orang Tua"}
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span>📞 {waTargetSiswa.noHpWali || "Nomor Belum Terdaftar"}</span>
                </p>
              </div>
            </div>

            {/* Option Switcher (Semester & STS vs SAS) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Periode & Format Rapor:
              </span>
              <div className="flex items-center gap-2">
                {/* Semester Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setWaRaporSemester("Ganjil")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      waRaporSemester === "Ganjil"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Ganjil
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaRaporSemester("Genap")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      waRaporSemester === "Genap"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Genap
                  </button>
                </div>

                {/* STS vs SAS */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setWaRaporType("tengah")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      waRaporType === "tengah"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Rapor STS
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaRaporType("akhir")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      waRaporType === "akhir"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Rapor SAS
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Text Preview (WhatsApp Bubble Aesthetic) */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-[#f0f9f3] dark:bg-slate-800/90 p-4 mb-5 max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 shadow-inner">
              <pre className="whitespace-pre-wrap font-sans">
                {generateRaporWhatsAppText(waTargetSiswa, waRaporType, waRaporSemester)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const text = generateRaporWhatsAppText(waTargetSiswa, waRaporType, waRaporSemester);
                  navigator.clipboard.writeText(text);
                  setIsCopiedWa(true);
                  setTimeout(() => setIsCopiedWa(false), 2500);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isCopiedWa ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-bold">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Salin Format Pesan</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Tutup
                </button>

                <a
                  href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(
                    waTargetSiswa.noHpWali
                  )}&text=${encodeURIComponent(
                    generateRaporWhatsAppText(waTargetSiswa, waRaporType, waRaporSemester)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-600/30 transition-all cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Buka Chat WhatsApp</span>
                  <Share2 className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: KONFIRMASI HAPUS NILAI MAPEL SATUAN             */}
      {/* ========================================================= */}
      {deletingNilai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Konfirmasi Hapus Nilai
                </h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data nilai mata pelajaran{" "}
              <strong className="text-slate-900 dark:text-white">{deletingNilai.mapel}</strong> untuk siswa:
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">{deletingNilai.siswaNama}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  {deletingNilai.kelas}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-[11px]">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">UH</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{deletingNilai.tugas}</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Mid (STS)</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{deletingNilai.uts}</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">UAS (PAS)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{deletingNilai.uas}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingNilai(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>Ya, Hapus Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: KONFIRMASI HAPUS SELURUH NILAI SISWA            */}
      {/* ========================================================= */}
      {deletingAllSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Seluruh Nilai Siswa
                </h3>
                <p className="text-xs text-slate-500">Pembersihan massal data penilaian</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus <strong>seluruh data nilai ({deletingAllSiswa.count} mata pelajaran)</strong> yang tersimpan untuk siswa ini?
            </p>

            <div className="bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 mb-5">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{deletingAllSiswa.nama}</p>
              <p className="text-xs text-slate-500 mt-1">
                Kelas <strong>{deletingAllSiswa.kelas}</strong> &bull; Total Mapel Terhapus: <strong className="text-rose-600">{deletingAllSiswa.count} Mapel</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingAllSiswa(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllBySiswa}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus Semua Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: KONFIRMASI HAPUS SISWA BESERTA SELURUH NILAI     */}
      {/* ========================================================= */}
      {deletingSiswaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/80 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Data & Nama Siswa
                </h3>
                <p className="text-xs text-rose-500 font-semibold">Tindakan permanen dan tidak dapat diurungkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus nama siswa ini dari sistem? Tindakan ini akan <strong>menghapus data profil siswa sekaligus seluruh rekaman nilai ({nilaiList.filter((n) => n.siswaId === deletingSiswaTarget.id).length} mapel)</strong> yang telah dibuat.
            </p>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 dark:border-rose-900/60">
                <span className="text-slate-500 dark:text-slate-400">Nama Lengkap:</span>
                <span className="font-bold text-slate-900 dark:text-white">{deletingSiswaTarget.nama}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 dark:border-rose-900/60">
                <span className="text-slate-500 dark:text-slate-400">Kelas / Rombel:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{deletingSiswaTarget.kelas}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 dark:border-rose-900/60">
                <span className="text-slate-500 dark:text-slate-400">NISN:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{deletingSiswaTarget.nisn}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-slate-400">Nilai Ikut Terhapus:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {nilaiList.filter((n) => n.siswaId === deletingSiswaTarget.id).length} Mata Pelajaran
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingSiswaTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSiswa}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <UserX className="h-4 w-4" />
                <span>Ya, Hapus Siswa & Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 9: PENGELOLA CEPAT HAPUS SISWA / NILAI              */}
      {/* ========================================================= */}
      {isManageDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Kelola & Hapus Siswa / Nilai
                  </h3>
                  <p className="text-xs text-slate-500">Pilih peserta didik untuk menghapus rekaman nilai atau data siswa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageDeleteModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selector Siswa */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span>Pilih Nama Siswa Target:</span>
                </label>
                <select
                  value={manageSiswaId}
                  onChange={(e) => setManageSiswaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                >
                  <option value="" disabled>-- Pilih Siswa --</option>
                  {baseSiswaList.map((s) => {
                    const count = nilaiList.filter((n) => n.siswaId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.nama} &bull; Kelas {s.kelas} ({count} Nilai Tersimpan)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Detail Siswa Terpilih */}
              {(() => {
                const targetSiswa = baseSiswaList.find((s) => s.id === manageSiswaId) || siswaList.find((s) => s.id === manageSiswaId);
                if (!targetSiswa) return (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    Silakan pilih siswa pada daftar di atas.
                  </div>
                );

                const targetNilai = nilaiList.filter((n) => n.siswaId === targetSiswa.id);

                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow">
                          {targetSiswa.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{targetSiswa.nama}</p>
                          <p className="text-[11px] text-slate-500">
                            Kelas <strong>{targetSiswa.kelas}</strong> &bull; NISN: <span className="font-mono">{targetSiswa.nisn}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Total Nilai Tersimpan:</span>
                        <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                          targetNilai.length > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}>
                          {targetNilai.length} Mata Pelajaran
                        </span>
                      </div>
                    </div>

                    {/* Action Cards */}
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Pilih Opsi Tindakan:
                      </p>

                      {/* Opsi 1: Hapus Nilai Saja */}
                      <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Eraser className="h-4 w-4 text-amber-600" />
                            <span>Hapus Seluruh Nilai Siswa Ini</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Menghapus seluruh rekaman nilai ({targetNilai.length} mapel), nama siswa tetap tersimpan di sekolah.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={targetNilai.length === 0}
                          onClick={() => {
                            setIsManageDeleteModalOpen(false);
                            setDeletingAllSiswa({
                              id: targetSiswa.id,
                              nama: targetSiswa.nama,
                              kelas: targetSiswa.kelas,
                              count: targetNilai.length,
                            });
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow transition-all shrink-0 cursor-pointer"
                        >
                          Hapus Nilai
                        </button>
                      </div>

                      {/* Opsi 2: Hapus Data & Nama Siswa */}
                      <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                            <UserX className="h-4 w-4 text-rose-600" />
                            <span>Hapus Siswa & Seluruh Nilai</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Menghapus permanen profil siswa beserta seluruh rekaman nilai yang pernah dibuat.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsManageDeleteModalOpen(false);
                            setDeletingSiswaTarget(targetSiswa);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-all shrink-0 cursor-pointer"
                        >
                          Hapus Siswa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
