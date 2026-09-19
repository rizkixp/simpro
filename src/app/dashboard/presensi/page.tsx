"use client";

import React, { useState, useMemo } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { StatusKehadiran } from "@/types/school";
import { INITIAL_SISWA } from "@/lib/mock-data";
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
} from "lucide-react";

export default function PresensiPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const { siswaList, presensiList, updatePresensi, kelasList } = useSchoolData();

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

  // Status map for selected date
  const getStudentStatus = (siswaId: string): StatusKehadiran => {
    const record = presensiList.find(
      (p) => p.siswaId === siswaId && p.tanggal === selectedDate
    );
    return record ? record.status : "Hadir";
  };

  // Base list filtered by class
  const classStudents = useMemo(() => {
    if (teacherScope.isTeacher && teacherScope.assignedClass) {
      return allStudents.filter(
        (s) => s.kelas?.trim().toLowerCase() === teacherScope.assignedClass!.trim().toLowerCase()
      );
    }
    if (selectedKelas === "Semua") return allStudents;
    return allStudents.filter(
      (s) => s.kelas?.trim().toLowerCase() === selectedKelas.trim().toLowerCase()
    );
  }, [allStudents, selectedKelas, teacherScope]);

  // Metrics based on classStudents
  const totalInScope = classStudents.length;
  const hadirCount = classStudents.filter((s) => getStudentStatus(s.id) === "Hadir").length;
  const sakitCount = classStudents.filter((s) => getStudentStatus(s.id) === "Sakit").length;
  const izinCount = classStudents.filter((s) => getStudentStatus(s.id) === "Izin").length;
  const alpaCount = classStudents.filter((s) => getStudentStatus(s.id) === "Alpa").length;
  const hadirPercentage = totalInScope > 0 ? Math.round((hadirCount / totalInScope) * 100) : 0;

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
            Pencatatan kehadiran digital harian (Hadir, Sakit, Izin, Alpa) terintegrasi seluruh rombel kelas.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleSetAllHadir}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Tandai Semua Hadir ({classStudents.length} Siswa)</span>
          </button>
        )}
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
                <th className="px-5 py-3.5 text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
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
                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <img
                          src={siswa.avatar}
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

