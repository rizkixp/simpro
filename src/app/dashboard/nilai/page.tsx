"use client";

import React, { useState, useEffect } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
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

  // Active Rapor Tab: "tengah" (PTS) | "akhir" (PAS) | "semua"
  const [activeRaporTab, setActiveRaporTab] = useState<"tengah" | "akhir" | "semua">("tengah");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedMapel, setSelectedMapel] = useState("Semua");

  // Single Input / Edit Modal State
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bulk Input Modal State (All Subjects for One Student)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSiswaId, setBulkSiswaId] = useState<string>("");
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
  const [quickFillValues, setQuickFillValues] = useState({
    tugas: 80,
    uts: 80,
    uas: 85,
  });

  // E-Rapor Modal Print Preview (Single Student)
  const [raporSiswa, setRaporSiswa] = useState<Siswa | null>(null);
  const [raporPrintType, setRaporPrintType] = useState<JenisRapor>("tengah");

  // E-Rapor Batch (Seluruh Siswa Rombel) Modal State
  const [isBatchRaporOpen, setIsBatchRaporOpen] = useState(false);
  const [batchRaporType, setBatchRaporType] = useState<JenisRapor>("tengah");
  const [batchRaporViewMode, setBatchRaporViewMode] = useState<"bundel" | "leger">("bundel");
  const [batchSelectedKelas, setBatchSelectedKelas] = useState<string>("Semua");

  // WhatsApp Share State
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waTargetSiswa, setWaTargetSiswa] = useState<Siswa | null>(null);
  const [isCopiedWa, setIsCopiedWa] = useState(false);

  // Single Form State for Grade Input / Editing
  const [formData, setFormData] = useState({
    siswaId: "",
    mapel: "Matematika",
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
    if (typeof n.nilaiMid === "number" && n.predikatMid) {
      return {
        nilaiMid: n.nilaiMid,
        predikatMid: n.predikatMid,
        catatanMid: n.catatanMid || n.catatan || "Mengikuti pembelajaran dengan baik.",
      };
    }
    const calc = calculateMidGrade(n.tugas, n.uts);
    return {
      nilaiMid: calc.nilaiMid,
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

  // Filtered nilai based on search and selected filters
  const filteredNilai = baseNilaiList.filter((n) => {
    const matchSearch =
      n.siswaNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nisn.includes(searchTerm) ||
      n.mapel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas =
      teacherScope.isTeacher
        ? true
        : selectedKelas === "Semua" || n.kelas === selectedKelas;
    const matchMapel =
      selectedMapel === "Semua" ||
      n.mapel.toLowerCase() === selectedMapel.toLowerCase();
    return matchSearch && matchKelas && matchMapel;
  });

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
    if (activeRaporTab === "tengah") return getStudentMid(n).nilaiMid >= 75;
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

    // Kalkulasi nilai tengah semester (PTS): 50% UH + 50% Mid
    const { nilaiMid, predikatMid } = calculateMidGrade(
      Number(formData.tugas),
      Number(formData.uts)
    );

    // Kalkulasi nilai akhir semester (PAS): 30% UH + 30% Mid + 40% UAS
    const { nilaiAkhir, predikat } = calculateSemesterGrade(
      Number(formData.tugas),
      Number(formData.uts),
      Number(formData.uas)
    );

    saveNilai({
      id: editingId || undefined,
      siswaId: siswa.id,
      siswaNama: siswa.nama,
      nisn: siswa.nisn,
      kelas: siswa.kelas,
      mapel: formData.mapel,
      semester: profile.semesterAktif,
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
        ? `Nilai mata pelajaran "${formData.mapel}" untuk ${siswa.nama} berhasil diperbarui.`
        : `Nilai mata pelajaran "${formData.mapel}" untuk ${siswa.nama} berhasil disimpan.`,
    });
  };

  // Bulk Input Handlers (All Subjects for One Student)
  const initBulkRowsForStudent = (targetSiswaId: string) => {
    const targetSiswa = siswaList.find((s) => s.id === targetSiswaId);
    if (!targetSiswa) return;

    // Subjects to show
    const subjects = mapelList;

    const existingStudentNilai = nilaiList.filter((n) => n.siswaId === targetSiswaId);

    const rows = subjects.map((m) => {
      const existing = existingStudentNilai.find(
        (n) => n.mapel.toLowerCase() === m.nama.toLowerCase()
      );
      if (existing) {
        return {
          mapel: m.nama,
          kkm: m.kkm,
          tugas: existing.tugas,
          uts: existing.uts,
          uas: existing.uas,
          catatanMid: existing.catatanMid || "Pemahaman materi tengah semester tuntas dengan baik.",
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
        catatanMid: "Pemahaman materi tengah semester tuntas dengan baik.",
        catatan: "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
      };
    });

    setBulkRows(rows);
  };

  const handleBulkSiswaChange = (newSiswaId: string) => {
    setBulkSiswaId(newSiswaId);
    initBulkRowsForStudent(newSiswaId);
  };

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

  const handleOpenBulkAdd = (preselectedSiswaId?: string) => {
    const targetId = preselectedSiswaId || baseSiswaList[0]?.id || siswaList[0]?.id || "";
    setBulkSiswaId(targetId);
    initBulkRowsForStudent(targetId);
    setIsBulkModalOpen(true);
  };

  const handleApplyQuickFill = () => {
    setBulkRows((prev) =>
      prev.map((r) => ({
        ...r,
        tugas: quickFillValues.tugas,
        uts: quickFillValues.uts,
        uas: quickFillValues.uas,
      }))
    );
  };

  const handleSaveBulk = (e: React.FormEvent) => {
    e.preventDefault();
    const siswa =
      baseSiswaList.find((s) => s.id === bulkSiswaId) ||
      siswaList.find((s) => s.id === bulkSiswaId);
    if (!siswa) return;

    const itemsToSave = bulkRows.map((row) => {
      const { nilaiMid, predikatMid } = calculateMidGrade(Number(row.tugas), Number(row.uts));
      const { nilaiAkhir, predikat } = calculateSemesterGrade(
        Number(row.tugas),
        Number(row.uts),
        Number(row.uas)
      );

      return {
        id: row.existingId,
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
        mapel: row.mapel,
        semester: profile.semesterAktif,
        tahunAjaran: profile.tahunAjaranAktif,
        tugas: Number(row.tugas),
        uts: Number(row.uts),
        uas: Number(row.uas),
        nilaiMid,
        predikatMid,
        catatanMid: row.catatanMid,
        nilaiAkhir,
        predikat,
        catatan: row.catatan,
      };
    });

    bulkSaveNilai(itemsToSave);
    setIsBulkModalOpen(false);
    setNotification({
      type: "success",
      message: `Nilai seluruh mata pelajaran (${itemsToSave.length} mapel) untuk ${siswa.nama} berhasil disimpan.`,
    });
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

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // E-Rapor Print Modal Handlers
  const handleOpenRapor = (siswa: Siswa, type?: JenisRapor) => {
    setRaporSiswa(siswa);
    setRaporPrintType(type || (activeRaporTab === "akhir" ? "akhir" : "tengah"));
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
  const generateRaporWhatsAppText = (siswa: Siswa, type: JenisRapor) => {
    const records = nilaiList.filter((n) => n.siswaId === siswa.id);
    const isTengah = type === "tengah";
    const typeLabel = isTengah ? "Tengah Semester (PTS)" : "Akhir Semester (PAS)";
    const avgScore =
      records.length > 0
        ? Math.round(
            records.reduce(
              (acc, curr) =>
                acc + (isTengah ? getStudentMid(curr).nilaiMid : getStudentAkhir(curr).nilaiAkhir),
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
    msg += `📅 *Periode:* Rapor ${typeLabel} (TA ${profile.tahunAjaranAktif})\n\n`;
    msg += `Alhamdulillah, berikut ringkasan capaian kompetensi belajar ananda:\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (records.length === 0) {
      msg += `_(Data nilai mata pelajaran belum diinputkan)_\n`;
    } else {
      records.forEach((r, i) => {
        const score = isTengah ? getStudentMid(r).nilaiMid : getStudentAkhir(r).nilaiAkhir;
        const pred = isTengah ? getStudentMid(r).predikatMid : getStudentAkhir(r).predikat;
        const note = isTengah ? getStudentMid(r).catatanMid : getStudentAkhir(r).catatan;
        msg += `${i + 1}. *${r.mapel}*: ${score} (${pred})\n`;
        if (note && note !== "-") {
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

  const handleOpenWhatsAppModal = (siswa: Siswa) => {
    setWaTargetSiswa(siswa);
    setIsCopiedWa(false);
    setIsWaModalOpen(true);
  };

  // Nilai records for selected rapor siswa
  const studentNilaiRecords = raporSiswa
    ? nilaiList.filter((n) => n.siswaId === raporSiswa.id)
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
      return s.kelas.toLowerCase() === teacherScope.assignedClass.toLowerCase();
    }
    if (batchSelectedKelas === "Semua") return true;
    return s.kelas.toLowerCase() === batchSelectedKelas.toLowerCase();
  });

  // Live preview calculations for single form modal
  const liveMid = calculateMidGrade(Number(formData.tugas) || 0, Number(formData.uts) || 0);
  const liveAkhir = calculateSemesterGrade(
    Number(formData.tugas) || 0,
    Number(formData.uts) || 0,
    Number(formData.uas) || 0
  );

  // Selected student obj in bulk modal
  const selectedBulkStudent = siswaList.find((s) => s.id === bulkSiswaId);

  // Bulk modal stats
  const bulkAvgMid =
    bulkRows.length > 0
      ? Math.round(
          bulkRows.reduce(
            (acc, r) => acc + calculateMidGrade(Number(r.tugas), Number(r.uts)).nilaiMid,
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
              calculateSemesterGrade(Number(r.tugas), Number(r.uts), Number(r.uas)).nilaiAkhir,
            0
          ) / bulkRows.length
        )
      : 0;

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
              setBatchRaporType(activeRaporTab === "akhir" ? "akhir" : "tengah");
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
              setBatchRaporType(activeRaporTab === "akhir" ? "akhir" : "tengah");
              setBatchSelectedKelas(selectedKelas !== "Semua" ? selectedKelas : "Semua");
              setIsBatchRaporOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Leger Nilai Rombel</span>
          </button>

          {canEdit && (
            <>
              {/* Tombol Input Bulk Nilai (Seluruh Mapel) */}
              <button
                onClick={() => handleOpenBulkAdd()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Zap className="h-4 w-4 fill-white" />
                <span>Input Bulk Nilai</span>
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                  Semua Mapel
                </span>
              </button>

              {/* Tombol Input Satuan */}
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Input Satuan</span>
              </button>
            </>
          )}
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
                Mata Pelajaran Diampu: <strong>{teacherScope.assignedSubjects.join(", ")}</strong> &bull; Peserta didik binaan: <strong>{teacherScope.assignedClass}</strong> ({baseSiswaList.length} siswa).
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-700/50 self-start sm:self-center shrink-0">
            Akses Terkunci: {teacherScope.assignedClass} &bull; {teacherScope.assignedSubjects.join(", ")}
          </span>
        </div>
      )}

      {/* Rapor Type Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
        <button
          onClick={() => setActiveRaporTab("tengah")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeRaporTab === "tengah"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Rapor Tengah Semester (PTS)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeRaporTab === "tengah"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
            }`}
          >
            50% UH + 50% Mid
          </span>
        </button>

        <button
          onClick={() => setActiveRaporTab("akhir")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeRaporTab === "akhir"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Rapor Akhir Semester (PAS)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeRaporTab === "akhir"
                ? "bg-white/20 text-white"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            }`}
          >
            30% UH + 30% Mid + 40% UAS
          </span>
        </button>

        <button
          onClick={() => setActiveRaporTab("semua")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
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
              {activeRaporTab === "tengah"
                ? "Rata-Rata Rapor Tengah Semester"
                : activeRaporTab === "akhir"
                ? "Rata-Rata Rapor Akhir Semester"
                : "Rata-Rata Nilai Keseluruhan"}
            </p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {activeRaporTab === "tengah"
                ? avgMidScore
                : activeRaporTab === "akhir"
                ? avgAkhirScore
                : Math.round((avgMidScore + avgAkhirScore) / 2 || 0)}
            </p>
            <span className="text-[10px] text-slate-500">
              Target KKM Standar: &ge; 75
            </span>
          </div>
          <div
            className={`p-3 rounded-xl ${
              activeRaporTab === "tengah"
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
              Ketuntasan Belajar ({activeRaporTab === "tengah" ? "PTS" : "PAS"})
            </p>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {tuntasPercent}%
            </p>
            <span className="text-[10px] text-slate-500">
              {tuntasCount} dari {filteredNilai.length} entri tuntas
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
              {activeRaporTab === "tengah"
                ? "50% UH + 50% Ujian Mid (PTS)"
                : activeRaporTab === "akhir"
                ? "30% UH + 30% Mid + 40% UAS"
                : "Semua Komponen (UH, Mid, UAS)"}
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
            Total Nilai: <strong>{filteredNilai.length}</strong>
          </span>
        </div>
      </div>

      {/* Nilai Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              {activeRaporTab === "tengah" ? (
                <tr>
                  <th className="px-5 py-3.5">Nama Siswa</th>
                  <th className="px-3 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Mata Pelajaran</th>
                  <th className="px-3 py-3.5 text-center">
                    Ulangan Harian (UH) <span className="text-amber-600 font-bold">(50%)</span>
                  </th>
                  <th className="px-3 py-3.5 text-center">
                    Ujian Mid (PTS) <span className="text-amber-600 font-bold">(50%)</span>
                  </th>
                  <th className="px-4 py-3.5 text-center bg-amber-500/5 dark:bg-amber-500/10">
                    Nilai Rapor PTS
                  </th>
                  <th className="px-3 py-3.5 text-center">Predikat</th>
                  <th className="px-4 py-3.5">Catatan Perkembangan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              ) : activeRaporTab === "akhir" ? (
                <tr>
                  <th className="px-5 py-3.5">Nama Siswa</th>
                  <th className="px-3 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Mata Pelajaran</th>
                  <th className="px-3 py-3.5 text-center">
                    Harian (UH) <span className="text-blue-600 font-bold">(30%)</span>
                  </th>
                  <th className="px-3 py-3.5 text-center">
                    Ujian Mid <span className="text-blue-600 font-bold">(30%)</span>
                  </th>
                  <th className="px-3 py-3.5 text-center">
                    Ujian Akhir (PAS) <span className="text-blue-600 font-bold">(40%)</span>
                  </th>
                  <th className="px-4 py-3.5 text-center bg-blue-500/5 dark:bg-blue-500/10">
                    Nilai Akhir Rapor
                  </th>
                  <th className="px-3 py-3.5 text-center">Predikat</th>
                  <th className="px-4 py-3.5">Catatan Capaian</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-3.5">Nama Siswa</th>
                  <th className="px-3 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Mata Pelajaran</th>
                  <th className="px-2 py-3.5 text-center">UH</th>
                  <th className="px-2 py-3.5 text-center">Mid (PTS)</th>
                  <th className="px-3 py-3.5 text-center bg-amber-500/5 font-bold">Rapor PTS</th>
                  <th className="px-2 py-3.5 text-center">UAS</th>
                  <th className="px-3 py-3.5 text-center bg-blue-500/5 font-bold">Rapor PAS</th>
                  <th className="px-3 py-3.5 text-center">Predikat Akhir</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNilai.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-slate-400">
                    Belum ada rekaman nilai pada kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredNilai.map((n) => {
                  const siswaObj = siswaList.find((s) => s.id === n.siswaId);
                  const mid = getStudentMid(n);
                  const akhir = getStudentAkhir(n);

                  if (activeRaporTab === "tengah") {
                    return (
                      <tr key={n.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {n.siswaNama}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">NISN: {n.nisn}</span>
                        </td>
                        <td className="px-3 py-3.5">{n.kelas}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                          {n.mapel}
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono font-medium">{n.tugas}</td>
                        <td className="px-3 py-3.5 text-center font-mono font-medium">{n.uts}</td>
                        <td className="px-4 py-3.5 text-center bg-amber-500/5 dark:bg-amber-500/10">
                          <span className="font-bold text-sm text-amber-600 dark:text-amber-400 font-mono">
                            {mid.nilaiMid}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
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
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {mid.catatanMid}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenBulkAdd(n.siswaId)}
                                title="Input / Edit Seluruh Mapel Siswa Ini"
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                              >
                                <Zap className="h-3 w-3 fill-amber-500" />
                                <span>Bulk Mapel</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(n)}
                                title="Edit Nilai Mapel Ini"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingNilai(n)}
                                title="Hapus Nilai Mapel Ini"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {siswaObj && (
                            <>
                              <button
                                onClick={() => handleOpenRapor(siswaObj, "tengah")}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium text-xs hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Rapor PTS</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRaporPrintType("tengah");
                                  handleOpenWhatsAppModal(siswaObj);
                                }}
                                title="Kirim Rapor PTS via WhatsApp ke Wali"
                                className="p-1 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors inline-flex items-center cursor-pointer"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  if (activeRaporTab === "akhir") {
                    return (
                      <tr key={n.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {n.siswaNama}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">NISN: {n.nisn}</span>
                        </td>
                        <td className="px-3 py-3.5">{n.kelas}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                          {n.mapel}
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono font-medium">{n.tugas}</td>
                        <td className="px-3 py-3.5 text-center font-mono font-medium">{n.uts}</td>
                        <td className="px-3 py-3.5 text-center font-mono font-medium">{n.uas}</td>
                        <td className="px-4 py-3.5 text-center bg-blue-500/5 dark:bg-blue-500/10">
                          <span className="font-bold text-sm text-blue-600 dark:text-blue-400 font-mono">
                            {akhir.nilaiAkhir}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
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
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {akhir.catatan}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenBulkAdd(n.siswaId)}
                                title="Input / Edit Seluruh Mapel Siswa Ini"
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Zap className="h-3 w-3 fill-blue-500" />
                                <span>Bulk Mapel</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(n)}
                                title="Edit Nilai Mapel Ini"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingNilai(n)}
                                title="Hapus Nilai Mapel Ini"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {siswaObj && (
                            <>
                              <button
                                onClick={() => handleOpenRapor(siswaObj, "akhir")}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium text-xs hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Rapor PAS</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRaporPrintType("akhir");
                                  handleOpenWhatsAppModal(siswaObj);
                                }}
                                title="Kirim Rapor PAS via WhatsApp ke Wali"
                                className="p-1 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors inline-flex items-center cursor-pointer"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  // Rekap Lengkap
                  return (
                    <tr key={n.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {n.siswaNama}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">NISN: {n.nisn}</span>
                      </td>
                      <td className="px-3 py-3.5">{n.kelas}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                        {n.mapel}
                      </td>
                      <td className="px-2 py-3.5 text-center font-mono text-xs">{n.tugas}</td>
                      <td className="px-2 py-3.5 text-center font-mono text-xs">{n.uts}</td>
                      <td className="px-3 py-3.5 text-center bg-amber-500/5 font-mono font-bold text-amber-600">
                        {mid.nilaiMid} ({mid.predikatMid})
                      </td>
                      <td className="px-2 py-3.5 text-center font-mono text-xs">{n.uas}</td>
                      <td className="px-3 py-3.5 text-center bg-blue-500/5 font-mono font-bold text-blue-600">
                        {akhir.nilaiAkhir} ({akhir.predikat})
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {akhir.predikat}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenBulkAdd(n.siswaId)}
                              title="Input / Edit Seluruh Mapel Siswa Ini"
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Zap className="h-3 w-3 fill-amber-500" />
                              <span>Bulk</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(n)}
                              title="Edit Nilai"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingNilai(n)}
                              title="Hapus Nilai Mapel Ini"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {siswaObj && (
                          <>
                            <button
                              onClick={() => handleOpenRapor(siswaObj, "akhir")}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-medium text-xs hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Cetak</span>
                            </button>
                            <button
                              onClick={() => {
                                setRaporPrintType("akhir");
                                handleOpenWhatsAppModal(siswaObj);
                              }}
                              title="Kirim Rapor via WhatsApp ke Wali"
                              className="p-1 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors inline-flex items-center"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
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

      {/* ========================================================= */}
      {/* MODAL 1: INPUT BULK NILAI SISWA (SELURUH MAPEL SEKALIGUS) */}
      {/* ========================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-6">
            <button
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Zap className="h-5 w-5 fill-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Input Nilai Cepat (Bulk Mode)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Input Nilai Seluruh Mata Pelajaran (1 Siswa)
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan nilai Ulangan Harian, Ujian Mid (PTS), dan Ujian Akhir (PAS) untuk semua mata pelajaran sekaligus.
                </p>
              </div>

              {/* Mode Switcher Button */}
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  handleOpenAdd();
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-center"
              >
                Ganti ke Input Per Mapel &rarr;
              </button>
            </div>

            <form onSubmit={handleSaveBulk} className="space-y-4 text-xs">
              {/* Step 1: Pilih Siswa */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                    <span>Pilih Peserta Didik Target *</span>
                  </label>
                  <select
                    required
                    value={bulkSiswaId}
                    onChange={(e) => handleBulkSiswaChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
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
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow">
                        {selectedBulkStudent.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{selectedBulkStudent.nama}</p>
                        <p className="text-[11px] text-slate-500">
                          Kelas <strong>{selectedBulkStudent.kelas}</strong> &bull; NISN: <span className="font-mono">{selectedBulkStudent.nisn}</span>
                        </p>
                      </div>
                    </div>
                    {nilaiList.filter((n) => n.siswaId === selectedBulkStudent.id).length > 0 && canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          const count = nilaiList.filter((n) => n.siswaId === selectedBulkStudent.id).length;
                          setDeletingAllSiswa({
                            id: selectedBulkStudent.id,
                            nama: selectedBulkStudent.nama,
                            kelas: selectedBulkStudent.kelas,
                            count,
                          });
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        title="Hapus seluruh rekaman nilai tersimpan untuk siswa ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Nilai Siswa Ini</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Fitur Isi Cepat Massal (Quick-Fill Toolbar) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Opsi Nilai Cepat (Terapkan ke Semua Mapel):
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium">UH:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={quickFillValues.tugas}
                      onChange={(e) =>
                        setQuickFillValues({ ...quickFillValues, tugas: Number(e.target.value) })
                      }
                      className="w-12 text-center font-mono font-bold bg-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium">Mid:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={quickFillValues.uts}
                      onChange={(e) =>
                        setQuickFillValues({ ...quickFillValues, uts: Number(e.target.value) })
                      }
                      className="w-12 text-center font-mono font-bold bg-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium">UAS:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={quickFillValues.uas}
                      onChange={(e) =>
                        setQuickFillValues({ ...quickFillValues, uas: Number(e.target.value) })
                      }
                      className="w-12 text-center font-mono font-bold bg-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyQuickFill}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Zap className="h-3.5 w-3.5 fill-white" />
                    <span>Terapkan ke Semua</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => initBulkRowsForStudent(bulkSiswaId)}
                    title="Muat Ulang Nilai Tersimpan"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-slate-500"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Step 3: Tabel Seluruh Mata Pelajaran */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-8">No</th>
                      <th className="px-4 py-2.5">Mata Pelajaran & KKM</th>
                      <th className="px-2 py-2.5 text-center w-24">UH (Harian)</th>
                      <th className="px-2 py-2.5 text-center w-24">Mid (PTS)</th>
                      <th className="px-2 py-2.5 text-center w-24 bg-amber-500/10">Rapor PTS</th>
                      <th className="px-2 py-2.5 text-center w-24">UAS (Akhir)</th>
                      <th className="px-2 py-2.5 text-center w-24 bg-blue-500/10">Rapor PAS</th>
                      <th className="px-3 py-2.5">Catatan Capaian Belajar</th>
                      <th className="px-2 py-2.5 text-center w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {bulkRows.map((row, idx) => {
                      const rowMid = calculateMidGrade(Number(row.tugas) || 0, Number(row.uts) || 0);
                      const rowAkhir = calculateSemesterGrade(
                        Number(row.tugas) || 0,
                        Number(row.uts) || 0,
                        Number(row.uas) || 0
                      );

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

                          {/* Ulangan Harian Input */}
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
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </td>

                          {/* Ujian Mid Input */}
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
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </td>

                          {/* Live PTS Preview */}
                          <td className="px-2 py-2 text-center bg-amber-500/5 dark:bg-amber-500/10 font-mono">
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">
                              {rowMid.nilaiMid}
                            </span>
                            <span
                              className={`ml-1 px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                rowMid.predikatMid === "A"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rowMid.predikatMid === "B"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {rowMid.predikatMid}
                            </span>
                          </td>

                          {/* Ujian UAS Input */}
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
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </td>

                          {/* Live PAS Preview */}
                          <td className="px-2 py-2 text-center bg-blue-500/5 dark:bg-blue-500/10 font-mono">
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">
                              {rowAkhir.nilaiAkhir}
                            </span>
                            <span
                              className={`ml-1 px-1.5 py-0.2 text-[9px] font-bold rounded ${
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

                          {/* Catatan */}
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

                          {/* Aksi Hapus Baris */}
                          <td className="px-2 py-2 text-center">
                            {row.existingId && canEdit ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const item = nilaiList.find((n) => n.id === row.existingId);
                                  if (item) {
                                    setDeletingNilai(item);
                                  }
                                }}
                                title="Hapus rekaman nilai mapel ini"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Step 4: Ringkasan Rata-Rata & Tombol Simpan */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Rata-Rata PTS Siswa:</span>
                    <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      {bulkAvgMid}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      ({bulkAvgMid >= 88 ? "Sangat Baik" : bulkAvgMid >= 75 ? "Baik" : "Cukup"})
                    </span>
                  </div>

                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

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
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-amber-500/20 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan Nilai Seluruh Mapel ({bulkRows.length} Mapel)</span>
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
                  <span>Buka Mode Bulk &rarr;</span>
                </button>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? "Perbarui Rekaman Nilai Siswa" : "Input Nilai Komponen Siswa"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Nilai otomatis diproses untuk <strong>Rapor Tengah Semester (50% UH + 50% Mid)</strong> dan <strong>Rapor Akhir Semester (30% UH + 30% Mid + 40% UAS)</strong>.
            </p>

            <form onSubmit={handleSaveSingle} className="space-y-4 text-xs">
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
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">PTS 50% &bull; PAS 30%</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Ujian Mid (PTS)
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
                    <span className="text-[10px] text-slate-400 block mt-0.5 text-center">PTS 50% &bull; PAS 30%</span>
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
                      Rapor Tengah Sem. (PTS)
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
                      50% ({formData.tugas}) + 50% ({formData.uts})
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

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Perkembangan (Rapor Tengah Semester / PTS)
                </label>
                <input
                  type="text"
                  value={formData.catatanMid}
                  onChange={(e) => setFormData({ ...formData, catatanMid: e.target.value })}
                  placeholder="Catatan keaktifan dan perkembangan belajar..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

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

                {/* Switcher PTS / PAS */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setRaporPrintType("tengah")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      raporPrintType === "tengah"
                        ? "bg-amber-500 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Rapor PTS</span>
                  </button>
                  <button
                    onClick={() => setRaporPrintType("akhir")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      raporPrintType === "akhir"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Rapor PAS</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons (Direct Print & PDF Export) */}
              <div className="flex items-center gap-2">
                {canEdit && (
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
                  ? "LAPORAN PENILAIAN HASIL BELAJAR TENGAH SEMESTER (PTS)"
                  : "LAPORAN CAPAIAN HASIL BELAJAR AKHIR SEMESTER (PAS)"}
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Tahun Ajaran {profile.tahunAjaranAktif} &bull; Semester {profile.semesterAktif}
              </p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] text-slate-700 font-medium">
                {raporPrintType === "tengah"
                  ? "Komposisi Penilaian PTS: 50% Nilai Ulangan Harian (UH) + 50% Nilai Ujian Mid (PTS)"
                  : "Komposisi Penilaian PAS: 30% Nilai Harian + 30% Ujian Mid + 40% Ujian Akhir Semester"}
              </div>
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
                    <th className="border border-slate-300 px-2 py-2 text-center w-24">Ulangan Harian (50%)</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-24">Ujian Mid (50%)</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-20 bg-amber-50">Nilai PTS</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-16">Predikat</th>
                    <th className="border border-slate-300 px-3 py-2">Catatan Perkembangan Belajar</th>
                  </tr>
                </thead>
                <tbody>
                  {studentNilaiRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-slate-300 px-3 py-6 text-center text-slate-400">
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

                      return (
                        <tr key={item.id}>
                          <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 px-3 py-2 font-semibold">{item.mapel}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{kkm}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{item.tugas}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono">{item.uts}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-bold text-amber-700 bg-amber-50/50 font-mono">
                            {mid.nilaiMid}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                            {mid.predikatMid}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-slate-600 text-[11px]">
                            {mid.catatanMid || "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={5} className="border border-slate-300 px-3 py-2 text-right">
                      Rata-Rata Nilai Rapor Tengah Semester (PTS):
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
                (k) => k.nama.toLowerCase() === raporSiswa.kelas.toLowerCase()
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
                <div className="grid grid-cols-3 text-center text-xs pt-6 border-t border-slate-200">
                  <div>
                    <p className="text-slate-500">Orang Tua / Wali Murid,</p>
                    <div className="h-16" />
                    <p className="font-bold underline">{raporSiswa.namaWali}</p>
                  </div>

                  <div>
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

                {/* Switcher PTS / PAS */}
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
                    <span>Rapor PTS</span>
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
                    <span>Rapor PAS</span>
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
                    const studentRecords = nilaiList.filter((n) => n.siswaId === siswa.id);
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
                      (k) => k.nama.toLowerCase() === siswa.kelas.toLowerCase()
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
                              ? "LAPORAN PENILAIAN HASIL BELAJAR TENGAH SEMESTER (PTS)"
                              : "LAPORAN CAPAIAN HASIL BELAJAR AKHIR SEMESTER (PAS)"}
                          </h3>
                          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                            Tahun Ajaran {profile.tahunAjaranAktif} &bull; Semester {profile.semesterAktif}
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
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-20">UH (50%)</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-20">Mid (50%)</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-16 bg-amber-50">Nilai PTS</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-14">Predikat</th>
                                <th className="border border-slate-300 px-2 py-1.5">Catatan Perkembangan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentRecords.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="border border-slate-300 px-3 py-4 text-center text-slate-400">
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

                                  return (
                                    <tr key={item.id} className="text-[11px]">
                                      <td className="border border-slate-300 px-2 py-1.5 text-center">{idx + 1}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 font-semibold">{item.mapel}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{kkm}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{item.tugas}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{item.uts}</td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-amber-800 bg-amber-50/50 font-mono">
                                        {mid.nilaiMid}
                                      </td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                                        {mid.predikatMid}
                                      </td>
                                      <td className="border border-slate-300 px-2 py-1.5 text-slate-600 text-[10px]">
                                        {mid.catatanMid || "-"}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-semibold text-[11px]">
                                <td colSpan={5} className="border border-slate-300 px-3 py-1.5 text-right">
                                  Rata-Rata Nilai Rapor PTS:
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
                        <div className="grid grid-cols-3 text-center text-xs pt-4 border-t border-slate-200">
                          <div>
                            <p className="text-slate-500">Orang Tua / Wali Murid,</p>
                            <div className="h-14" />
                            <p className="font-bold underline">{siswa.namaWali}</p>
                          </div>
                          <div>
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
                    BUKU LEGER NILAI HASIL BELAJAR {batchRaporType === "tengah" ? "TENGAH SEMESTER (PTS)" : "AKHIR SEMESTER (PAS)"}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Kelas: <strong>{batchSelectedKelas === "Semua" ? "Semua Kelas" : batchSelectedKelas}</strong> &bull; Semester: <strong>{profile.semesterAktif}</strong> &bull; Tahun Ajaran: <strong>{profile.tahunAjaranAktif}</strong>
                  </p>
                </div>

                {/* Tabel Leger Nilai Komprehensif */}
                {(() => {
                  const rankedStudents = batchStudents
                    .map((s) => {
                      const records = nilaiList.filter((n) => n.siswaId === s.id);
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

            {/* Option Switcher (PTS vs PAS) */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Format Laporan Rapor:
              </span>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRaporPrintType("tengah")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    raporPrintType === "tengah"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  Rapor PTS
                </button>
                <button
                  type="button"
                  onClick={() => setRaporPrintType("akhir")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    raporPrintType === "akhir"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  Rapor PAS
                </button>
              </div>
            </div>

            {/* WhatsApp Text Preview (WhatsApp Bubble Aesthetic) */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-[#f0f9f3] dark:bg-slate-800/90 p-4 mb-5 max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 shadow-inner">
              <pre className="whitespace-pre-wrap font-sans">
                {generateRaporWhatsAppText(waTargetSiswa, raporPrintType)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const text = generateRaporWhatsAppText(waTargetSiswa, raporPrintType);
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
                    generateRaporWhatsAppText(waTargetSiswa, raporPrintType)
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
                  <span className="text-[10px] text-slate-400 block font-sans">Mid (PTS)</span>
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
    </div>
  );
}
