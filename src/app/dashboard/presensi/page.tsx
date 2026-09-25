"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope, isClassMatch } from "@/hooks/useTeacherScope";
import { StatusKehadiran, PresensiRecord, MetodePresensi } from "@/types/school";
import Pagination from "@/components/common/Pagination";
import {
  CalendarCheck2,
  Check,
  Clock,
  AlertCircle,
  XCircle,
  Sparkles,
  Search,
  Users,
  RotateCcw,
  Shield,
  Camera,
  Barcode,
  QrCode,
  Printer,
  Settings,
  Download,
  Smartphone,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  UserX,
  History,
  Calendar,
  X,
  FileText,
  UploadCloud,
} from "lucide-react";

// Modal Components with dynamic lazy-loading for zero initial bundle bloat
const DigitalAttendanceScanner = dynamic(
  () => import("@/components/presensi/DigitalAttendanceScanner"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Menyiapkan Kamera & Scanner Digital...</p>
        </div>
      </div>
    ),
  }
);
const ImportPresensiExcelModal = dynamic(
  () => import("@/components/presensi/ImportPresensiExcelModal"),
  { ssr: false }
);
import KartuPelajarGeneratorModal from "@/components/presensi/KartuPelajarGeneratorModal";
import FaceRegistrationModal from "@/components/presensi/FaceRegistrationModal";
import AttendanceSettingsModal, {
  getAttendanceSettings,
  AttendanceSettings,
} from "@/components/presensi/AttendanceSettingsModal";

export default function PresensiPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const {
    siswaList,
    presensiList,
    updatePresensi,
    batchUpdatePresensi,
    resetPresensiSiswa,
    clearAllPresensiSiswa,
    resetPresensiKelas,
    kelasList,
    profile,
    updateSiswa,
  } = useSchoolData();

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCardGeneratorOpen, setIsCardGeneratorOpen] = useState(false);
  const [isFaceRegOpen, setIsFaceRegOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);

  // Reset Attendance Modal & Toast States
  const [studentToReset, setStudentToReset] = useState<any | null>(null);
  const [studentResetMode, setStudentResetMode] = useState<"tanggal" | "semua">("tanggal");
  const [isBulkResetConfirmOpen, setIsBulkResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student Absence History Modal States
  const [historyStudent, setHistoryStudent] = useState<any | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"absen_saja" | "semua" | "Sakit" | "Izin" | "Alpa" | "Hadir">("absen_saja");

  // Pure student list without mock fallback
  const allStudents = useMemo(() => {
    return siswaList || [];
  }, [siswaList]);

  // Default to "Semua" so all students are visible immediately
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("Semua");
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const canEdit = !user || user.role === "admin" || user.role === "guru" || (user.role as string) === "wali_kelas" || (user.role as string) === "kepala_sekolah";

  // Find attendance record for selected date
  const getStudentRecord = (siswaId: string): PresensiRecord | undefined => {
    return presensiList.find(
      (p) => p.siswaId === siswaId && p.tanggal === selectedDate
    );
  };

  // Status map for selected date: returns actual status if recorded, or undefined if not yet marked
  const getStudentStatus = (siswaId: string): StatusKehadiran | undefined => {
    const record = getStudentRecord(siswaId);
    return record?.status;
  };

  // Today map for scanner to avoid duplicates
  const todayPresensiMap = useMemo(() => {
    const map: Record<
      string,
      { status: StatusKehadiran; waktuMasuk?: string; waktuPulang?: string }
    > = {};
    presensiList
      .filter((p) => p.tanggal === todayStr)
      .forEach((p) => {
        map[p.siswaId] = {
          status: p.status,
          waktuMasuk: p.waktuMasuk,
          waktuPulang: p.waktuPulang,
        };
      });
    return map;
  }, [presensiList, todayStr]);

  // Base list filtered by class
  const classStudents = useMemo(() => {
    if (teacherScope.isTeacher) {
      return teacherScope.filterByAssignedClass(allStudents);
    }
    if (selectedKelas === "Semua") return allStudents;
    return allStudents.filter((s) => isClassMatch(s.kelas, selectedKelas));
  }, [allStudents, selectedKelas, teacherScope]);

  // Metrics based on classStudents
  const totalInScope = classStudents.length;
  const hadirCount = classStudents.filter((s) => getStudentStatus(s.id) === "Hadir").length;
  const sakitCount = classStudents.filter((s) => getStudentStatus(s.id) === "Sakit").length;
  const izinCount = classStudents.filter((s) => getStudentStatus(s.id) === "Izin").length;
  const alpaCount = classStudents.filter((s) => getStudentStatus(s.id) === "Alpa").length;
  const belumAbsenCount = classStudents.filter((s) => !getStudentRecord(s.id)).length;
  const hadirPercentage = totalInScope > 0 ? Math.round((hadirCount / totalInScope) * 100) : 0;

  // Digital attendance metrics: on-time vs late
  const tepatWaktuCount = classStudents.filter((s) => {
    const rec = getStudentRecord(s.id);
    return rec && rec.status === "Hadir" && rec.waktuMasuk && !rec.terlambat;
  }).length;

  const terlambatCount = classStudents.filter((s) => {
    const rec = getStudentRecord(s.id);
    return rec && rec.status === "Hadir" && rec.terlambat;
  }).length;

  // Final filtered list for display (search + status filter)
  const displayedStudents = useMemo(() => {
    return classStudents.filter((s) => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.kelas && s.kelas.toLowerCase().includes(q));

      // Status filter
      const st = getStudentStatus(s.id);
      const matchStatus =
        selectedStatusFilter === "Semua" ||
        (selectedStatusFilter === "Belum Absen" ? !st : st === selectedStatusFilter);

      return matchSearch && matchStatus;
    });
  }, [classStudents, searchQuery, selectedStatusFilter, presensiList, selectedDate]);

  // Paginasi Presensi Siswa
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatusFilter, selectedKelas, selectedDate]);

  const paginatedStudents = useMemo(() => {
    if (pageSize <= 0 || pageSize >= displayedStudents.length) return displayedStudents;
    const start = (currentPage - 1) * pageSize;
    return displayedStudents.slice(start, start + pageSize);
  }, [displayedStudents, currentPage, pageSize]);

  const handleSetAllHadir = () => {
    if (!canEdit) return;
    classStudents.forEach((s) => {
      updatePresensi(s.id, "Hadir", undefined, selectedDate);
    });
    showToast(`Semua siswa (${classStudents.length}) ditandai Hadir.`);
  };

  const handleConfirmResetStudent = () => {
    if (!studentToReset) return;
    if (studentResetMode === "semua") {
      clearAllPresensiSiswa(studentToReset.id);
      showToast(`Seluruh riwayat presensi ${studentToReset.nama} telah dikosongkan 100%.`);
    } else {
      resetPresensiSiswa(studentToReset.id, selectedDate);
      showToast(`Presensi ${studentToReset.nama} tanggal ${selectedDate} telah dikosongkan 100%.`);
    }
    setStudentToReset(null);
  };

  const handleQuickEmptyStudent = (siswaId: string, nama: string) => {
    resetPresensiSiswa(siswaId, selectedDate);
    showToast(`Presensi ${nama} tanggal ${selectedDate} telah dikosongkan 100%.`);
  };

  const handleConfirmResetClass = () => {
    resetPresensiKelas(selectedKelas, selectedDate);
    showToast(
      `Absensi kelas ${selectedKelas === "Semua" ? "semua rombel" : selectedKelas} (${selectedDate}) berhasil di-reset.`
    );
    setIsBulkResetConfirmOpen(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const resetFilters = () => {
    setSelectedKelas("Semua");
    setSearchQuery("");
    setSelectedStatusFilter("Semua");
  };

  // Export attendance to Excel
  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const dataToExport = classStudents.map((s, idx) => {
      const rec = getStudentRecord(s.id);
      return {
        No: idx + 1,
        Nama: s.nama,
        NISN: s.nisn,
        Kelas: s.kelas,
        Status: rec ? rec.status : "Belum Absen",
        "Waktu Masuk": rec?.waktuMasuk || "-",
        "Waktu Pulang": rec?.waktuPulang || "-",
        "Metode Absensi": rec?.metode ? rec.metode.toUpperCase() : rec ? "MANUAL" : "-",
        Keterangan: rec?.terlambat
          ? "Terlambat"
          : rec?.waktuMasuk
          ? "Tepat Waktu"
          : rec?.keterangan || (rec ? "Manual" : "Belum Absen"),
        Tanggal: selectedDate,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi Digital");
    XLSX.writeFile(wb, `Rekap_Presensi_${selectedKelas}_${selectedDate}.xlsx`);
  };

  // Quick WhatsApp notification
  const handleSendWA = (s: typeof classStudents[0], rec?: PresensiRecord) => {
    const parentPhone = s.noHpWali?.replace(/[^0-9]/g, "");
    const formattedPhone = parentPhone
      ? parentPhone.startsWith("0")
        ? "62" + parentPhone.slice(1)
        : parentPhone
      : "";

    const schoolTitle = profile?.namaSekolah || "Sekolah";
    const status = rec?.status || "Belum Absen";
    const waktu = rec?.waktuMasuk ? `${rec.waktuMasuk} WIB` : "Belum Ada Catatan Jam Masuk";
    const note = rec?.terlambat ? "Terlambat" : rec?.waktuMasuk ? "Tepat Waktu" : "";

    const msg =
      `*PEMBERITAHUAN KEHADIRAN SISWA*\n` +
      `*${schoolTitle}*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Diberitahukan kepada Bapak/Ibu Wali Murid, bahwa:\n\n` +
      `👤 *Nama:* ${s.nama}\n` +
      `🔢 *NISN:* ${s.nisn}\n` +
      `🏫 *Kelas:* ${s.kelas}\n` +
      `📅 *Tanggal:* ${selectedDate}\n` +
      `⏰ *Waktu Masuk:* ${waktu} ${note ? `(${note})` : ""}\n` +
      `📋 *Status:* ${status}\n\n` +
      `Terima kasih atas kerja samanya.\n_Sistem Informasi Sekolah_`;

    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleSendAbsenceSummaryWA = (s: typeof allStudents[0]) => {
    const parentPhone = s.noHpWali?.replace(/[^0-9]/g, "");
    const formattedPhone = parentPhone
      ? parentPhone.startsWith("0")
        ? "62" + parentPhone.slice(1)
        : parentPhone
      : "";

    const schoolTitle = profile?.namaSekolah || "Sekolah";
    const absences = presensiList
      .filter((p) => p.siswaId === s.id && p.status !== "Hadir")
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    const sCount = absences.filter((p) => p.status === "Sakit").length;
    const iCount = absences.filter((p) => p.status === "Izin").length;
    const aCount = absences.filter((p) => p.status === "Alpa").length;

    let absenceDetails = "";
    if (absences.length > 0) {
      absenceDetails = absences
        .map(
          (p, i) =>
            `${i + 1}. ${formatDateIndo(p.tanggal)}: *${p.status.toUpperCase()}* ${
              p.keterangan ? `(${p.keterangan})` : ""
            }`
        )
        .join("\n");
    } else {
      absenceDetails = "Alhamdulillah tidak ada riwayat ketidakhadiran (Hadir 100%).";
    }

    const msg =
      `*REKAPITULASI KETIDAKHADIRAN SISWA*\n` +
      `*${schoolTitle}*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Wali Murid dari:\n\n` +
      `👤 *Nama:* ${s.nama}\n` +
      `🔢 *NISN:* ${s.nisn}\n` +
      `🏫 *Kelas:* ${s.kelas}\n\n` +
      `📊 *Ringkasan Ketidakhadiran:*\n` +
      `• Sakit: ${sCount} hari\n` +
      `• Izin: ${iCount} hari\n` +
      `• Alpa: ${aCount} hari\n` +
      `• Total Tidak Masuk: ${sCount + iCount + aCount} hari\n\n` +
      `📅 *Rincian Tanggal & Keterangan:*\n` +
      `${absenceDetails}\n\n` +
      `Demikian informasi ini kami sampaikan untuk menjadi perhatian bersama. Terima kasih.\n_Sistem Informasi Presensi Sekolah_`;

    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarCheck2 className="h-7 w-7 text-purple-600" />
            <span>Presensi & Kehadiran Siswa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kehadiran digital harian otomatis via Wajah AI, Kartu Barcode/QR, dan scanner mandiri HP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/templates/template_presensi_harian.xlsx"
            download="template_presensi_harian.xlsx"
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Template Presensi Excel Siap Pakai Langsung"
          >
            <Download className="h-4 w-4" />
            <span>Unduh Template Excel</span>
          </a>

          <button
            onClick={() => setIsImportExcelOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Unggah / Impor Presensi Siswa via Excel (.xlsx / .csv)"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Import Excel Presensi</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Rekap Presensi Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          {canEdit && (
            <>
              <button
                onClick={handleSetAllHadir}
                className="px-4 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Tandai Semua Hadir ({classStudents.length})</span>
              </button>

              <button
                onClick={() => setIsBulkResetConfirmOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reset seluruh absensi kelas ini pada tanggal terpilih"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Kelas</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ACTION COMMAND DECK: DIGITAL ATTENDANCE MODULES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Terminal Absensi Digital (Scanner HP) */}
        <div
          onClick={() => setIsScannerOpen(true)}
          className="group relative p-4 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-purple-600/25 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all overflow-hidden border border-purple-400/40"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md shadow-inner text-white">
              <Camera className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white backdrop-blur-md border border-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>SIAP SCAN</span>
            </span>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base leading-tight relative z-10">
            Terminal Absensi
          </h3>
          <p className="text-[11px] text-purple-100/80 mt-1 line-clamp-2 relative z-10">
            Pindai wajah AI atau tempelkan barcode/QR siswa ke kamera HP.
          </p>
          <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] font-bold relative z-10">
            <span>Buka Scanner &rarr;</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">Wajah & Barcode</span>
          </div>
        </div>

        {/* 2. Impor Presensi Excel & CSV */}
        <div
          onClick={() => setIsImportExcelOpen(true)}
          className="group p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Format Cepat
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Impor Presensi Excel
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Download format Excel rombel & upload absensi offline massal.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Unggah & Impor</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 2. Cetak Kartu Siswa Ber-Barcode & QR */}
        <div
          onClick={() => setIsCardGeneratorOpen(true)}
          className="group p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Barcode className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Siap Cetak A4
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Cetak Kartu Absensi Siswa
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Generate & cetak kartu pelajar ber-barcode Code128 & QR Code resmi.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            <span className="flex items-center gap-1">
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Massal</span>
            </span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 3. Registrasi Biometrik Wajah */}
        <div
          onClick={() => setIsFaceRegOpen(true)}
          className="group p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Users className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {allStudents.length} Siswa
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Registrasi Foto Wajah
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Ambil foto wajah siswa via kamera HP atau upload file biometrik.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Daftarkan Wajah</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* 4. Pengaturan Jam & Suara */}
        <div
          onClick={() => setIsSettingsOpen(true)}
          className="group p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Settings className="h-6 w-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Kiosk Config
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Pengaturan Jam & Suara
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Atur jam masuk, batas toleransi terlambat, suara beep & sambutan AI.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>Konfigurasi Aturan</span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>

      {/* Teacher Homeroom Banner */}
      {teacherScope.isTeacher && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Presensi Kelas Binaan: Kelas {teacherScope.assignedClass}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {teacherScope.teacherName}
                </span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Pencatatan presensi harian terkunci otomatis pada peserta didik kelas <strong>{teacherScope.assignedClass}</strong> ({classStudents.length} siswa).
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-700/50 self-start sm:self-center shrink-0">
            Akses Terkunci: {teacherScope.assignedClass}
          </span>
        </div>
      )}

      {/* Control & Filter */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pilih Rombel / Kelas:</label>
              {teacherScope.isTeacher ? (
                <div className="px-3 py-1.5 text-xs font-bold rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 flex items-center gap-1.5">
                  <span>Kelas: {teacherScope.assignedClass}</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">({classStudents.length} Siswa)</span>
                </div>
              ) : (
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Semua">Semua Kelas ({allStudents.length} Siswa)</option>
                  {kelasList.map((k) => {
                    const count = allStudents.filter(
                      (s) => s.kelas?.trim().toLowerCase() === k.nama.trim().toLowerCase()
                    ).length;
                    return (
                      <option key={k.id} value={k.nama}>
                        {k.nama} ({count} Siswa)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tanggal Presensi:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Siswa / NISN:</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nama, NISN, atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-48 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Quick Rate & Reset */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="text-right">
              <p className="text-slate-500 text-[11px]">Tingkat Kehadiran:</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{hadirPercentage}%</p>
            </div>
            {(selectedKelas !== "Semua" || searchQuery || selectedStatusFilter !== "Semua") && (
              <button
                onClick={resetFilters}
                className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                title="Reset Semua Filter"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-medium">Filter Status:</span>
          {(["Semua", "Hadir", "Sakit", "Izin", "Alpa", "Belum Absen"] as const).map((st) => {
            const isActive = selectedStatusFilter === st;
            let count = 0;
            if (st === "Semua") count = totalInScope;
            else if (st === "Hadir") count = hadirCount;
            else if (st === "Sakit") count = sakitCount;
            else if (st === "Izin") count = izinCount;
            else if (st === "Alpa") count = alpaCount;
            else if (st === "Belum Absen") count = belumAbsenCount;

            return (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? st === "Belum Absen"
                      ? "bg-slate-700 text-white shadow-sm"
                      : "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{st}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === "Hadir" ? "Semua" : "Hadir")}
          className={`p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border cursor-pointer transition-all ${
            selectedStatusFilter === "Hadir" ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-md" : "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Hadir</p>
            <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{hadirCount} Siswa</p>
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
              <span>{tepatWaktuCount} Tepat Waktu</span>
              {terlambatCount > 0 && <span>• {terlambatCount} Terlambat</span>}
            </div>
          </div>
          <Check className="h-6 w-6 text-emerald-600" />
        </div>

        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === "Sakit" ? "Semua" : "Sakit")}
          className={`p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border cursor-pointer transition-all ${
            selectedStatusFilter === "Sakit" ? "border-amber-500 ring-2 ring-amber-500/30 shadow-md" : "border-amber-200 dark:border-amber-800 hover:border-amber-400"
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Sakit</p>
            <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{sakitCount} Siswa</p>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">Surat Dokter / Izin</p>
          </div>
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>

        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === "Izin" ? "Semua" : "Izin")}
          className={`p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border cursor-pointer transition-all ${
            selectedStatusFilter === "Izin" ? "border-blue-500 ring-2 ring-blue-500/30 shadow-md" : "border-blue-200 dark:border-blue-800 hover:border-blue-400"
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Izin</p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{izinCount} Siswa</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1">Keperluan Keluarga</p>
          </div>
          <Clock className="h-6 w-6 text-blue-600" />
        </div>

        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === "Alpa" ? "Semua" : "Alpa")}
          className={`p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border cursor-pointer transition-all ${
            selectedStatusFilter === "Alpa" ? "border-rose-500 ring-2 ring-rose-500/30 shadow-md" : "border-rose-200 dark:border-rose-800 hover:border-rose-400"
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-medium text-rose-800 dark:text-rose-300">Alpa</p>
            <p className="text-xl font-bold text-rose-900 dark:text-rose-100">{alpaCount} Siswa</p>
            <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-1">Tanpa Keterangan</p>
          </div>
          <XCircle className="h-6 w-6 text-rose-600" />
        </div>

        <div
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === "Belum Absen" ? "Semua" : "Belum Absen")}
          className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border cursor-pointer transition-all ${
            selectedStatusFilter === "Belum Absen" ? "border-slate-500 ring-2 ring-slate-500/30 shadow-md" : "border-slate-200 dark:border-slate-800 hover:border-slate-400"
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Belum Absen</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{belumAbsenCount} Siswa</p>
            <p className="text-[10px] text-slate-500 mt-1">Belum Scan / Reset</p>
          </div>
          <UserX className="h-6 w-6 text-slate-400" />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              Daftar Siswa ({displayedStudents.length} dari {allStudents.length})
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {selectedKelas === "Semua" ? "Semua Kelas" : `Kelas: ${selectedKelas}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">No</th>
                <th className="px-5 py-3.5">Nama Siswa</th>
                <th className="px-4 py-3.5">NISN</th>
                <th className="px-4 py-3.5">Kelas</th>
                <th className="px-4 py-3.5">Waktu & Metode</th>
                <th className="px-5 py-3.5 text-center">Status Kehadiran</th>
                <th className="px-4 py-3.5 text-center">Aksi (Riwayat & Reset)</th>
                <th className="px-4 py-3.5 text-center">Notifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-500 mb-1">Tidak ada data siswa yang sesuai</p>
                    <p className="text-[11px]">
                      {searchQuery
                        ? `Tidak ditemukan siswa dengan kata kunci "${searchQuery}".`
                        : "Tidak ada data siswa untuk kelas atau filter status yang dipilih."}
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-200 transition-colors inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Tampilkan Semua Siswa</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((siswa, idx) => {
                  const currentStatus = getStudentStatus(siswa.id);
                  const studentRecord = getStudentRecord(siswa.id);
                  const waktuMasuk = studentRecord?.waktuMasuk;
                  const metode = studentRecord?.metode;
                  const isLate = studentRecord?.terlambat;

                  // Student absence history stats
                  const studentAbsences = presensiList.filter((p) => p.siswaId === siswa.id && p.status !== "Hadir");
                  const sCount = studentAbsences.filter((p) => p.status === "Sakit").length;
                  const iCount = studentAbsences.filter((p) => p.status === "Izin").length;
                  const aCount = studentAbsences.filter((p) => p.status === "Alpa").length;
                  const hasAbsence = sCount > 0 || iCount > 0 || aCount > 0;

                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 font-medium">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img
                          src={siswa.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                          alt={siswa.nama}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {siswa.nama}
                          </span>
                          {hasAbsence ? (
                            <button
                              onClick={() => {
                                setHistoryFilter("absen_saja");
                                setHistoryStudent(siswa);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:underline transition-colors mt-0.5 cursor-pointer"
                              title="Klik untuk melihat tanggal absen, izin, alfa"
                            >
                              <History className="h-2.5 w-2.5 text-indigo-500" />
                              <span>
                                Absen: {sCount > 0 && <span className="text-amber-600 font-bold">{sCount}S </span>}
                                {iCount > 0 && <span className="text-blue-600 font-bold">{iCount}I </span>}
                                {aCount > 0 && <span className="text-rose-600 font-bold">{aCount}A</span>}
                              </span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              <span>0 Absen (Disiplin)</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{siswa.nisn}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {siswa.kelas || "-"}
                        </span>
                      </td>

                      {/* Waktu & Metode Scan */}
                      <td className="px-4 py-3.5">
                        {waktuMasuk ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 font-bold">
                              <Clock className="h-3.5 w-3.5 text-purple-600" />
                              <span>{waktuMasuk} WIB</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                {metode === "face" && "📷 Wajah AI"}
                                {metode === "barcode" && "🪪 Barcode"}
                                {metode === "qr" && "⚡ QR Code"}
                                {!metode && "✍️ Manual"}
                              </span>
                              {isLate ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                  Terlambat
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  Tepat Waktu
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Belum Scan</span>
                        )}
                      </td>

                      {/* Status Selector */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            {(["Hadir", "Sakit", "Izin", "Alpa"] as StatusKehadiran[]).map((st) => {
                              const isSelected = currentStatus === st;
                              let color = "bg-emerald-600 text-white";
                              if (st === "Sakit") color = "bg-amber-600 text-white";
                              if (st === "Izin") color = "bg-blue-600 text-white";
                              if (st === "Alpa") color = "bg-rose-600 text-white";

                              return (
                                <button
                                  key={st}
                                  disabled={!canEdit}
                                  onClick={() => {
                                    if (isSelected) {
                                      handleQuickEmptyStudent(siswa.id, siswa.nama);
                                    } else {
                                      updatePresensi(siswa.id, st, undefined, selectedDate);
                                    }
                                  }}
                                  title={isSelected ? `Klik lagi untuk mengosongkan status ${st}` : `Tandai ${st}`}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                    isSelected
                                      ? `${color} shadow-sm font-semibold ring-2 ring-purple-500/20`
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                  } ${!canEdit ? "cursor-default" : ""}`}
                                >
                                  {st}
                                </button>
                              );
                            })}

                            {/* Tombol Cepat Kosongkan 100% jika ada status aktif */}
                            {currentStatus && canEdit && (
                              <button
                                onClick={() => handleQuickEmptyStudent(siswa.id, siswa.nama)}
                                title="Kosongkan absensi hari ini (100% Kosong)"
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 transition-all flex items-center gap-1 ml-0.5 cursor-pointer"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Kosongkan</span>
                              </button>
                            )}
                          </div>

                          {/* Indikator Status 100% Kosong */}
                          {!currentStatus && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                              <span>100% Kosong (Belum Absen)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi Riwayat & Reset Absensi Per Siswa */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* Tombol Riwayat Absen, Izin, Alfa */}
                          <button
                            onClick={() => {
                              setHistoryFilter("absen_saja");
                              setHistoryStudent(siswa);
                            }}
                            title={`Lihat riwayat tanggal absen, izin, alfa ${siswa.nama}`}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs active:scale-95 cursor-pointer"
                          >
                            <History className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Riwayat</span>
                          </button>

                          {/* Tombol Reset Presensi */}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setStudentResetMode(studentRecord ? "tanggal" : "semua");
                                setStudentToReset(siswa);
                              }}
                              title={
                                studentRecord
                                  ? `Reset absensi ${siswa.nama} (100% Kosong)`
                                  : `Siswa ini sudah kosong di tanggal ${selectedDate}. Klik untuk opsi reset seluruh riwayat.`
                              }
                              className={`px-2 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                                studentRecord
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-xs active:scale-95"
                                  : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>{studentRecord ? "Reset" : "Reset All"}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* WhatsApp Notification Action */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleSendWA(siswa, studentRecord)}
                          className="p-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Kirim Pesan WhatsApp ke Orang Tua"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={displayedStudents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="siswa"
        />
      </div>

      {/* 1. Modal Terminal Absensi Kiosk */}
      <DigitalAttendanceScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        siswaList={allStudents}
        todayPresensiMap={todayPresensiMap}
        schoolProfile={profile}
        onRecordAttendance={(siswaId, status, keterangan, tanggal, extra) => {
          updatePresensi(siswaId, status, keterangan, tanggal, extra);
        }}
      />

      {/* 2. Modal Cetak Kartu Pelajar Barcode/QR */}
      <KartuPelajarGeneratorModal
        isOpen={isCardGeneratorOpen}
        onClose={() => setIsCardGeneratorOpen(false)}
        siswaList={allStudents}
        kelasList={kelasList}
        schoolProfile={profile}
      />

      {/* 3. Modal Registrasi Biometrik Wajah */}
      <FaceRegistrationModal
        isOpen={isFaceRegOpen}
        onClose={() => setIsFaceRegOpen(false)}
        siswaList={allStudents}
        kelasList={kelasList}
        onUpdateSiswa={(id, data) => {
          updateSiswa(id, data);
        }}
      />

      {/* 4. Modal Pengaturan Absensi */}
      <AttendanceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 5. Modal Impor Presensi Excel & CSV */}
      <ImportPresensiExcelModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
        siswaList={allStudents}
        kelasList={kelasList}
        selectedKelas={selectedKelas}
        selectedDate={selectedDate}
        batchUpdatePresensi={batchUpdatePresensi}
        onImportSuccess={(count, summary) => {
          showToast(`Alhamdulillah! Berhasil mengimpor ${summary}.`);
        }}
      />

      {/* 5. Modal Konfirmasi Reset Presensi Per Siswa (100% Kosong) */}
      {studentToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kosongkan 100% Absensi Siswa?
                </h3>
                <p className="text-xs text-slate-500">
                  {studentToReset.nama} ({studentToReset.nisn}) • Kelas: {studentToReset.kelas}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Cakupan Pengosongan Absensi:
              </label>

              {/* Option 1: Tanggal Terpilih */}
              <div
                onClick={() => setStudentResetMode("tanggal")}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  studentResetMode === "tanggal"
                    ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-500/30"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    checked={studentResetMode === "tanggal"}
                    onChange={() => setStudentResetMode("tanggal")}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Kosongkan Tanggal Ini: {selectedDate} (100% Kosong)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Status kehadiran, waktu masuk/pulang, metode scan, dan catatan keterlambatan pada tanggal {selectedDate} dikosongkan 100% menjadi Belum Absen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Semua Tanggal (Reset Total) */}
              <div
                onClick={() => setStudentResetMode("semua")}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  studentResetMode === "semua"
                    ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500/30"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    checked={studentResetMode === "semua"}
                    onChange={() => setStudentResetMode("semua")}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                      Kosongkan Seluruh Riwayat Absensi (100% Bersih Total)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Menghapus 100% seluruh catatan riwayat kehadiran {studentToReset.nama} di semua tanggal dari database sekolah (hadir, izin, sakit, alpa = 0).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToReset(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetStudent}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ya, Kosongkan 100%</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Konfirmasi Reset Presensi Kelas */}
      {isBulkResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Seluruh Absensi Kelas?
                </h3>
                <p className="text-xs text-slate-500">
                  Target: {selectedKelas} • Tanggal: {selectedDate}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
              Perhatian: Tindakan ini akan mengosongkan seluruh rekaman absensi untuk {selectedKelas === "Semua" ? "semua siswa" : `kelas ${selectedKelas}`} pada tanggal {selectedDate}.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetClass}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ya, Reset Kelas Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Riwayat Absen, Izin, Alfa Siswa */}
      {historyStudent && (() => {
        const studentAllRecords = presensiList
          .filter((p) => p.siswaId === historyStudent.id)
          .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

        const studentAbsenceRecords = studentAllRecords.filter((p) => p.status !== "Hadir");
        const studentHadirCount = studentAllRecords.filter((p) => p.status === "Hadir").length;
        const studentSakitCount = studentAllRecords.filter((p) => p.status === "Sakit").length;
        const studentIzinCount = studentAllRecords.filter((p) => p.status === "Izin").length;
        const studentAlpaCount = studentAllRecords.filter((p) => p.status === "Alpa").length;
        const studentTotalAbsen = studentSakitCount + studentIzinCount + studentAlpaCount;
        const studentRate =
          studentAllRecords.length > 0
            ? Math.round((studentHadirCount / studentAllRecords.length) * 100)
            : 100;

        const displayedHistory =
          historyFilter === "absen_saja"
            ? studentAbsenceRecords
            : historyFilter === "semua"
            ? studentAllRecords
            : studentAllRecords.filter((p) => p.status === historyFilter);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={historyStudent.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                    alt={historyStudent.nama}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {historyStudent.nama}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {historyStudent.kelas || "-"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      NISN: {historyStudent.nisn} • Wali: {historyStudent.namaWali || "-"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryStudent(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  onClick={() => setHistoryFilter(historyFilter === "Alpa" ? "absen_saja" : "Alpa")}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    historyFilter === "Alpa"
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-500/30"
                      : "border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Alpa</span>
                    <XCircle className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="text-lg font-extrabold text-rose-800 dark:text-rose-200 mt-0.5">
                    {studentAlpaCount} <span className="text-xs font-normal">Hari</span>
                  </p>
                  <p className="text-[10px] text-rose-600/80 dark:text-rose-400">Tanpa Keterangan</p>
                </div>

                <div
                  onClick={() => setHistoryFilter(historyFilter === "Izin" ? "absen_saja" : "Izin")}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    historyFilter === "Izin"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500/30"
                      : "border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Izin</span>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-lg font-extrabold text-blue-800 dark:text-blue-200 mt-0.5">
                    {studentIzinCount} <span className="text-xs font-normal">Hari</span>
                  </p>
                  <p className="text-[10px] text-blue-600/80 dark:text-blue-400">Izin / Keperluan</p>
                </div>

                <div
                  onClick={() => setHistoryFilter(historyFilter === "Sakit" ? "absen_saja" : "Sakit")}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    historyFilter === "Sakit"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500/30"
                      : "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Sakit</span>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-lg font-extrabold text-amber-800 dark:text-amber-200 mt-0.5">
                    {studentSakitCount} <span className="text-xs font-normal">Hari</span>
                  </p>
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-400">Surat Dokter</p>
                </div>

                <div
                  onClick={() => setHistoryFilter(historyFilter === "Hadir" ? "semua" : "Hadir")}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    historyFilter === "Hadir"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30"
                      : "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Hadir</span>
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200 mt-0.5">
                    {studentHadirCount} <span className="text-xs font-normal">Hari</span>
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400">{studentRate}% Disiplin</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter:</span>
                <button
                  onClick={() => setHistoryFilter("absen_saja")}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    historyFilter === "absen_saja"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>Ketidakhadiran Saja (Absen/Izin/Alfa)</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
                    {studentTotalAbsen}
                  </span>
                </button>

                <button
                  onClick={() => setHistoryFilter("Sakit")}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    historyFilter === "Sakit"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>Sakit ({studentSakitCount})</span>
                </button>

                <button
                  onClick={() => setHistoryFilter("Izin")}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    historyFilter === "Izin"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>Izin ({studentIzinCount})</span>
                </button>

                <button
                  onClick={() => setHistoryFilter("Alpa")}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    historyFilter === "Alpa"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>Alpa ({studentAlpaCount})</span>
                </button>

                <button
                  onClick={() => setHistoryFilter("semua")}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    historyFilter === "semua"
                      ? "bg-slate-800 text-white dark:bg-slate-700 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>Semua ({studentAllRecords.length})</span>
                </button>
              </div>

              {/* Records List (Scrollable) */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-2 max-h-80">
                {displayedHistory.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {historyFilter === "absen_saja"
                        ? "Tidak Ada Riwayat Ketidakhadiran!"
                        : "Tidak Ada Data untuk Filter Ini"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {historyFilter === "absen_saja"
                        ? `Alhamdulillah, ${historyStudent.nama} belum pernah absen, izin, maupun alpa. Kehadiran tercatat 100% disiplin.`
                        : `Tidak ditemukan rekaman presensi dengan status "${historyFilter}" untuk siswa ini.`}
                    </p>
                  </div>
                ) : (
                  displayedHistory.map((rec) => {
                    let badgeColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200";
                    let icon = <Check className="h-3.5 w-3.5 text-emerald-600" />;
                    if (rec.status === "Sakit") {
                      badgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200";
                      icon = <AlertCircle className="h-3.5 w-3.5 text-amber-600" />;
                    } else if (rec.status === "Izin") {
                      badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200";
                      icon = <Clock className="h-3.5 w-3.5 text-blue-600" />;
                    } else if (rec.status === "Alpa") {
                      badgeColor = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200";
                      icon = <XCircle className="h-3.5 w-3.5 text-rose-600" />;
                    }

                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {formatDateIndo(rec.tanggal)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badgeColor}`}
                              >
                                {icon}
                                <span>{rec.status}</span>
                              </span>
                            </div>

                            {/* Keterangan / Alasan */}
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {rec.keterangan ? (
                                <span>Keterangan: <strong className="font-medium text-slate-800 dark:text-slate-100">{rec.keterangan}</strong></span>
                              ) : rec.status === "Alpa" ? (
                                <span className="italic text-slate-400">Tanpa surat keterangan (Alpa)</span>
                              ) : rec.status === "Sakit" ? (
                                <span className="italic text-slate-400">Sakit (surat dokter/keterangan)</span>
                              ) : rec.status === "Izin" ? (
                                <span className="italic text-slate-400">Izin keperluan keluarga</span>
                              ) : (
                                <span className="text-slate-400">Hadir di sekolah</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Extra Detail: Waktu & Aksi Hapus Tanggal Ini */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          {rec.waktuMasuk && (
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                              🕒 {rec.waktuMasuk} WIB
                            </span>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => {
                                resetPresensiSiswa(historyStudent.id, rec.tanggal);
                                showToast(`Catatan ${rec.status} tanggal ${rec.tanggal} berhasil dihapus.`);
                              }}
                              title={`Hapus catatan ${rec.status} pada ${rec.tanggal}`}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSendAbsenceSummaryWA(historyStudent)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Kirim rincian tanggal ketidakhadiran via WhatsApp ke Orang Tua"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Kirim Rekap WA ke Orang Tua</span>
                </button>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryStudent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-medium shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
