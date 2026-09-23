"use client";

import React, { useState, useMemo } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope, isClassMatch } from "@/hooks/useTeacherScope";
import { StatusKehadiran, PresensiRecord, MetodePresensi } from "@/types/school";
import { INITIAL_SISWA } from "@/lib/mock-data";
import * as XLSX from "xlsx";
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
} from "lucide-react";

// Modal Components
import DigitalAttendanceScanner from "@/components/presensi/DigitalAttendanceScanner";
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
    kelasList,
    profile,
    updateSiswa,
  } = useSchoolData();

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCardGeneratorOpen, setIsCardGeneratorOpen] = useState(false);
  const [isFaceRegOpen, setIsFaceRegOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fallback to initial data if siswaList is empty
  const allStudents = useMemo(() => {
    return siswaList && siswaList.length > 0 ? siswaList : INITIAL_SISWA;
  }, [siswaList]);

  // Default to "Semua" so all students are visible immediately
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("Semua");
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const canEdit = user?.role === "admin" || user?.role === "guru";

  // Find attendance record for selected date
  const getStudentRecord = (siswaId: string): PresensiRecord | undefined => {
    return presensiList.find(
      (p) => p.siswaId === siswaId && p.tanggal === selectedDate
    );
  };

  // Status map for selected date
  const getStudentStatus = (siswaId: string): StatusKehadiran => {
    const record = getStudentRecord(siswaId);
    return record ? record.status : "Hadir";
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
        selectedStatusFilter === "Semua" || st === selectedStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [classStudents, searchQuery, selectedStatusFilter, presensiList, selectedDate]);

  const handleSetAllHadir = () => {
    if (!canEdit) return;
    classStudents.forEach((s) => {
      updatePresensi(s.id, "Hadir", undefined, selectedDate);
    });
  };

  const resetFilters = () => {
    setSelectedKelas("Semua");
    setSearchQuery("");
    setSelectedStatusFilter("Semua");
  };

  // Export attendance to Excel
  const handleExportExcel = () => {
    const dataToExport = classStudents.map((s, idx) => {
      const rec = getStudentRecord(s.id);
      return {
        No: idx + 1,
        Nama: s.nama,
        NISN: s.nisn,
        Kelas: s.kelas,
        Status: rec ? rec.status : "Hadir",
        "Waktu Masuk": rec?.waktuMasuk || "-",
        "Waktu Pulang": rec?.waktuPulang || "-",
        "Metode Absensi": rec?.metode ? rec.metode.toUpperCase() : "MANUAL",
        Keterangan: rec?.terlambat
          ? "Terlambat"
          : rec?.waktuMasuk
          ? "Tepat Waktu"
          : rec?.keterangan || "-",
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
    const status = rec?.status || "Hadir";
    const waktu = rec?.waktuMasuk ? `${rec.waktuMasuk} WIB` : "Tercatat di Sistem";
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
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1.5"
            title="Download Rekap Presensi Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          {canEdit && (
            <button
              onClick={handleSetAllHadir}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tandai Semua Hadir ({classStudents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTION COMMAND DECK: DIGITAL ATTENDANCE MODULES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
            Terminal Absensi Digital
          </h3>
          <p className="text-[11px] text-purple-100/80 mt-1 line-clamp-2 relative z-10">
            Pindai wajah AI atau tempelkan kartu barcode/QR siswa ke kamera HP.
          </p>
          <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] font-bold relative z-10">
            <span>Buka Kiosk Scanner &rarr;</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">Wajah & Barcode</span>
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
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-medium">Filter Status:</span>
          {(["Semua", "Hadir", "Sakit", "Izin", "Alpa"] as const).map((st) => {
            const isActive = selectedStatusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
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
                <th className="px-4 py-3.5 text-center">Notifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
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
                displayedStudents.map((siswa, idx) => {
                  const currentStatus = getStudentStatus(siswa.id);
                  const studentRecord = getStudentRecord(siswa.id);
                  const waktuMasuk = studentRecord?.waktuMasuk;
                  const metode = studentRecord?.metode;
                  const isLate = studentRecord?.terlambat;

                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img
                          src={siswa.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                          alt={siswa.nama}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {siswa.nama}
                        </span>
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
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
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
                                onClick={() => updatePresensi(siswa.id, st, undefined, selectedDate)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                  isSelected
                                    ? `${color} shadow-sm font-semibold`
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                } ${!canEdit ? "cursor-default" : ""}`}
                              >
                                {st}
                              </button>
                            );
                          })}
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
    </div>
  );
}
