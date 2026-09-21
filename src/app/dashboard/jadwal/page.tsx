"use client";

import React, { useState, useMemo } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { JadwalPelajaran, MataPelajaran } from "@/types/school";
import {
  CalendarDays,
  Printer,
  Clock,
  User,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  BookOpen,
  LayoutGrid,
  List,
  GraduationCap,
  Copy,
  AlertTriangle,
  Settings2,
  CheckSquare,
  Square,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  Cloud,
} from "lucide-react";

type ActiveMenu = "lihat" | "tambah" | "edit" | "hapus" | "mapel";

export interface MapelGuruRow {
  id: string;
  mapel: string;
  guruNama: string;
}

export default function JadwalPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const {
    profile,
    jadwalList,
    kelasList,
    guruList,
    mapelList,
    addJadwal,
    bulkAddJadwal,
    updateJadwal,
    deleteJadwal,
    bulkDeleteJadwal,
    resetJadwalToDefault,
    addMapel,
    updateMapel,
    deleteMapel,
    isSupabaseConnected,
    isSyncing,
    lastSyncTime,
    syncWithSupabase,
    isAutoPushing,
  } = useSchoolData();

  // Active Menu: "lihat" | "tambah" | "edit" | "hapus" | "mapel"
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>("lihat");

  // Filters & View State
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");
  const [selectedHari, setSelectedHari] = useState<string>("Semua");
  const [selectedMapel, setSelectedMapel] = useState<string>("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected schedules for Bulk Delete
  const [selectedIdsToDelete, setSelectedIdsToDelete] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isResetDefaultModalOpen, setIsResetDefaultModalOpen] = useState(false);

  // Print Modal & Options (Senin s.d. Jumat)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSelectedKelas, setPrintSelectedKelas] = useState<string>("Semua");
  const [printFormatMode, setPrintFormatMode] = useState<"matrix" | "table">("matrix");

  // Hari Efektif KBM Sekolah (Senin s/d Jumat)
  const KBM_DAYS: JadwalPelajaran["hari"][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetJadwal, setTargetJadwal] = useState<JadwalPelajaran | null>(null);

  // Modals State for Mata Pelajaran
  const [isAddMapelModalOpen, setIsAddMapelModalOpen] = useState(false);
  const [isEditMapelModalOpen, setIsEditMapelModalOpen] = useState(false);
  const [isDeleteMapelModalOpen, setIsDeleteMapelModalOpen] = useState(false);
  const [targetMapel, setTargetMapel] = useState<MataPelajaran | null>(null);

  // Form Fields State for Mata Pelajaran
  const [mapelFormNama, setMapelFormNama] = useState("");
  const [mapelFormKode, setMapelFormKode] = useState("");
  const [mapelFormKategori, setMapelFormKategori] = useState<MataPelajaran["kategori"]>("Wajib");
  const [mapelFormKkm, setMapelFormKkm] = useState<number>(75);

  // Search & Filter State for Mata Pelajaran
  const [mapelSearchTerm, setMapelSearchTerm] = useState("");
  const [mapelFilterKategori, setMapelFilterKategori] = useState<string>("Semua");

  // Form Fields State (shared between dedicated Tambah menu & Edit modal)
  const [formHari, setFormHari] = useState<JadwalPelajaran["hari"]>("Senin");
  const [formJamMulai, setFormJamMulai] = useState("07:30");
  const [formJamSelesai, setFormJamSelesai] = useState("09:00");
  const [formKelas, setFormKelas] = useState("");
  const [formMapel, setFormMapel] = useState("");
  const [formGuruNama, setFormGuruNama] = useState("");
  const [formRuangan, setFormRuangan] = useState("");
  const [allowJointSession, setAllowJointSession] = useState(false);

  // Multi-subject entries state for Tambah Jadwal
  const [multiRows, setMultiRows] = useState<MapelGuruRow[]>([
    { id: "row-1", mapel: "", guruNama: "" },
  ]);

  const handleAddRow = () => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const defaultGuru = teacherScope.isTeacher ? teacherScope.teacherName : "";
    setMultiRows((prev) => [...prev, { id: newId, mapel: "", guruNama: defaultGuru }]);
  };

  const handleRemoveRow = (id: string) => {
    if (multiRows.length <= 1) {
      setMultiRows([
        {
          id: `row-${Date.now()}`,
          mapel: "",
          guruNama: teacherScope.isTeacher ? teacherScope.teacherName : "",
        },
      ]);
      return;
    }
    setMultiRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowMapelChange = (id: string, newMapel: string) => {
    let autoGuru = "";
    if (teacherScope.isTeacher) {
      autoGuru = teacherScope.teacherName;
    } else {
      const match = guruList.find((g) =>
        g.mataPelajaran.some(
          (m) =>
            m.toLowerCase().includes(newMapel.toLowerCase()) ||
            newMapel.toLowerCase().includes(m.toLowerCase())
        )
      );
      if (match) {
        autoGuru = `${match.nama}${match.gelar ? `, ${match.gelar}` : ""}`;
      }
    }

    setMultiRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, mapel: newMapel, guruNama: autoGuru || r.guruNama }
          : r
      )
    );
  };

  const handleRowGuruChange = (id: string, newGuru: string) => {
    setMultiRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, guruNama: newGuru } : r))
    );
  };

  const handlePopulateAllMapel = () => {
    const sourceMapel = teacherScope.isTeacher ? teacherScope.scopedMapelList : mapelList;
    if (sourceMapel.length === 0) {
      showToast("Tidak ada data mata pelajaran yang tersedia.", "info");
      return;
    }
    const newRows: MapelGuruRow[] = sourceMapel.map((m, idx) => {
      let matchedGuru = "";
      if (teacherScope.isTeacher) {
        matchedGuru = teacherScope.teacherName;
      } else {
        const found = guruList.find((g) =>
          g.mataPelajaran.some(
            (p) =>
              p.toLowerCase().includes(m.nama.toLowerCase()) ||
              m.nama.toLowerCase().includes(p.toLowerCase())
          )
        );
        if (found) {
          matchedGuru = `${found.nama}${found.gelar ? `, ${found.gelar}` : ""}`;
        }
      }
      return {
        id: `bulk-row-${Date.now()}-${idx}`,
        mapel: m.nama,
        guruNama:
          matchedGuru ||
          (guruList[0] ? `${guruList[0].nama}${guruList[0].gelar ? `, ${guruList[0].gelar}` : ""}` : ""),
      };
    });

    setMultiRows(newRows);
    showToast(`Berhasil memuat ${newRows.length} mata pelajaran dari kurikulum!`, "info");
  };

  const handleResetRows = () => {
    setMultiRows([
      {
        id: `row-${Date.now()}`,
        mapel: "",
        guruNama: teacherScope.isTeacher ? teacherScope.teacherName : "",
      },
    ]);
  };

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const hariList: JadwalPelajaran["hari"][] = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  // Helper to parse time string "HH:MM", "H:M", or "HH:MM:SS" into minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const clean = timeStr.trim();
    const parts = clean.split(":");
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // Helper to format minutes from midnight to "HH:MM"
  const formatMinutesToTime = (totalMinutes: number): string => {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Safe strictly non-touching overlap checker
  const isTimeOverlapping = (
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ): boolean => {
    const sA = parseTimeToMinutes(startA);
    const eA = parseTimeToMinutes(endA);
    const sB = parseTimeToMinutes(startB);
    const eB = parseTimeToMinutes(endB);

    if (sA === null || eA === null || sB === null || eB === null) return false;
    if (eA <= sA || eB <= sB) return false;

    // Touching intervals (eA === sB or sA === eB) do NOT overlap
    return sA < eB && eA > sB;
  };

  // Normalize teacher names (strip honorary titles and extra spaces for fair matching)
  const normalizeTeacherName = (name: string): string => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/(drs\.|dra\.|dr\.|prof\.|hj\.|h\.|kh\.|ust\.|ustadz\.)/gi, "")
      .replace(/,\s*(s\.pd|m\.pd|s\.si|m\.si|s\.kom|m\.kom|s\.t|m\.t|s\.e|m\.m|s\.pd\.i|m\.ag|m\.hum|b\.a|m\.a|ph\.d).*/gi, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };

  // Find next available free slot for a given class and day
  const getNextAvailableSlot = (
    kelas: string,
    hari: JadwalPelajaran["hari"],
    durationMinutes: number = 90
  ): { jamMulai: string; jamSelesai: string } => {
    const existing = jadwalList
      .filter(
        (j) =>
          j.kelas === kelas &&
          j.hari === hari &&
          (!targetJadwal || j.id !== targetJadwal.id)
      )
      .map((j) => ({
        start: parseTimeToMinutes(j.jamMulai) || 0,
        end: parseTimeToMinutes(j.jamSelesai) || 0,
      }))
      .filter((j) => j.end > j.start)
      .sort((a, b) => a.start - b.start);

    if (existing.length === 0) {
      return { jamMulai: "07:30", jamSelesai: "09:00" };
    }

    const defaultStart = parseTimeToMinutes("07:30") || 450;
    // Check if slot before the earliest session is free
    if (existing[0].start >= defaultStart + durationMinutes) {
      return {
        jamMulai: formatMinutesToTime(defaultStart),
        jamSelesai: formatMinutesToTime(defaultStart + durationMinutes),
      };
    }

    // Check gaps between sessions
    for (let i = 0; i < existing.length - 1; i++) {
      const gapStart = existing[i].end;
      const gapEnd = existing[i + 1].start;
      if (gapEnd - gapStart >= durationMinutes) {
        return {
          jamMulai: formatMinutesToTime(gapStart),
          jamSelesai: formatMinutesToTime(gapStart + durationMinutes),
        };
      }
    }

    // Otherwise, place after the latest session
    const lastEnd = existing[existing.length - 1].end;
    const restBreak = lastEnd >= 690 && lastEnd <= 780 ? 30 : 15;
    const nextStart = lastEnd + restBreak;
    const nextEnd = nextStart + durationMinutes;

    // If past late afternoon, wrap to standard afternoon session
    if (nextEnd > 17 * 60) {
      return { jamMulai: "13:15", jamSelesai: "14:45" };
    }

    return {
      jamMulai: formatMinutesToTime(nextStart),
      jamSelesai: formatMinutesToTime(nextEnd),
    };
  };

  // Helper when class changes in form
  const handleKelasChange = (kelasNama: string) => {
    setFormKelas(kelasNama);
    const hasConflict = jadwalList.some(
      (j) =>
        j.kelas === kelasNama &&
        j.hari === formHari &&
        (!targetJadwal || j.id !== targetJadwal.id) &&
        isTimeOverlapping(formJamMulai, formJamSelesai, j.jamMulai, j.jamSelesai)
    );
    if (hasConflict) {
      const free = getNextAvailableSlot(kelasNama, formHari);
      setFormJamMulai(free.jamMulai);
      setFormJamSelesai(free.jamSelesai);
    }
  };

  // Helper when day changes in form
  const handleHariChange = (newHari: JadwalPelajaran["hari"]) => {
    setFormHari(newHari);
    const hasConflict = jadwalList.some(
      (j) =>
        j.kelas === formKelas &&
        j.hari === newHari &&
        (!targetJadwal || j.id !== targetJadwal.id) &&
        isTimeOverlapping(formJamMulai, formJamSelesai, j.jamMulai, j.jamSelesai)
    );
    if (hasConflict) {
      const free = getNextAvailableSlot(formKelas, newHari);
      setFormJamMulai(free.jamMulai);
      setFormJamSelesai(free.jamSelesai);
    }
  };

  // Helper when mapel changes in form: auto-suggest guru
  const handleMapelChange = (mapelNama: string) => {
    setFormMapel(mapelNama);
    const matchingGuru = guruList.find((g) =>
      g.mataPelajaran.some(
        (m) =>
          m.toLowerCase().includes(mapelNama.toLowerCase()) ||
          mapelNama.toLowerCase().includes(m.toLowerCase())
      )
    );
    if (matchingGuru) {
      setFormGuruNama(`${matchingGuru.nama}${matchingGuru.gelar ? `, ${matchingGuru.gelar}` : ""}`);
    }
  };

  // Granular Conflict Detection Checker
  const conflictDetails = useMemo(() => {
    if (!formHari || !formJamMulai || !formJamSelesai) {
      return {
        warnings: [],
        hasClassConflict: false,
        hasGuruConflict: false,
        isExactDuplicate: false,
        conflictingJadwal: [] as JadwalPelajaran[],
      };
    }

    const sA = parseTimeToMinutes(formJamMulai);
    const eA = parseTimeToMinutes(formJamSelesai);
    if (sA === null || eA === null || eA <= sA) {
      return {
        warnings: [],
        hasClassConflict: false,
        hasGuruConflict: false,
        isExactDuplicate: false,
        conflictingJadwal: [] as JadwalPelajaran[],
      };
    }

    const warnings: string[] = [];
    const conflictingJadwal: JadwalPelajaran[] = [];
    let hasClassConflict = false;
    let hasGuruConflict = false;
    let isExactDuplicate = false;

    jadwalList.forEach((j) => {
      if (targetJadwal && j.id === targetJadwal.id) return;
      if (j.hari !== formHari) return;

      if (isTimeOverlapping(formJamMulai, formJamSelesai, j.jamMulai, j.jamSelesai)) {
        conflictingJadwal.push(j);

        if (formKelas && j.kelas === formKelas) {
          hasClassConflict = true;
          if (formMapel && j.mapel.trim().toLowerCase() === formMapel.trim().toLowerCase()) {
            isExactDuplicate = true;
            warnings.push(
              `Data Ganda: Sesi "${j.mapel}" untuk kelas ${formKelas} sudah terdaftar pada jam ${j.jamMulai} - ${j.jamSelesai}.`
            );
          } else {
            warnings.push(
              `Jam Bersinggungan: Kelas ${formKelas} pada jam ${j.jamMulai} - ${j.jamSelesai} sudah terisi mata pelajaran "${j.mapel}".`
            );
          }
        }

        if (
          formGuruNama &&
          normalizeTeacherName(j.guruNama) === normalizeTeacherName(formGuruNama) &&
          j.kelas !== formKelas
        ) {
          hasGuruConflict = true;
          warnings.push(
            `Guru ${formGuruNama} sudah terjadwal mengajar di kelas ${j.kelas} pada jam ${j.jamMulai} - ${j.jamSelesai}.`
          );
        }
      }
    });

    return {
      warnings,
      hasClassConflict,
      hasGuruConflict,
      isExactDuplicate,
      conflictingJadwal,
    };
  }, [
    jadwalList,
    formHari,
    formJamMulai,
    formJamSelesai,
    formKelas,
    formMapel,
    formGuruNama,
    targetJadwal,
  ]);

  // Backward compatibility alias for any existing reference
  const conflictWarnings = conflictDetails.warnings;

  // Init form defaults
  const initForm = (kelasPreset?: string, hariPreset?: JadwalPelajaran["hari"]) => {
    const kDefault = teacherScope.isTeacher
      ? (teacherScope.assignedClass || "X MIPA 1")
      : (kelasPreset || (selectedKelas !== "Semua" ? selectedKelas : (kelasList[0]?.nama || "X MIPA 1")));
    const hDefault = hariPreset || (selectedHari !== "Semua" ? (selectedHari as JadwalPelajaran["hari"]) : "Senin");

    setFormHari(hDefault);
    setFormKelas(kDefault);
    setTargetJadwal(null);

    const firstMapel = teacherScope.isTeacher
      ? (teacherScope.scopedMapelList[0]?.nama || "Matematika")
      : (mapelList[0]?.nama || "Matematika");

    let firstGuru = teacherScope.isTeacher ? teacherScope.teacherName : "";
    if (!firstGuru) {
      const match = guruList.find((g) =>
        g.mataPelajaran.some(
          (m) =>
            m.toLowerCase().includes(firstMapel.toLowerCase()) ||
            firstMapel.toLowerCase().includes(m.toLowerCase())
        )
      );
      firstGuru = match
        ? `${match.nama}${match.gelar ? `, ${match.gelar}` : ""}`
        : (guruList[0] ? `${guruList[0].nama}${guruList[0].gelar ? `, ${guruList[0].gelar}` : ""}` : "");
    }

    setMultiRows([
      { id: `row-${Date.now()}-1`, mapel: firstMapel, guruNama: firstGuru },
    ]);
  };

  // Open Add Modal / Page
  const handleOpenAddModal = (kelasPreset?: string, hariPreset?: JadwalPelajaran["hari"]) => {
    initForm(kelasPreset, hariPreset);
    setActiveMenu("tambah");
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: JadwalPelajaran) => {
    setTargetJadwal(item);
    setFormHari(item.hari);
    setFormJamMulai(item.jamMulai || "-");
    setFormJamSelesai(item.jamSelesai || "-");
    setFormKelas(item.kelas);
    setFormMapel(item.mapel);
    setFormGuruNama(item.guruNama);
    setFormRuangan(item.ruangan || "");
    setAllowJointSession(false);
    setIsEditModalOpen(true);
  };

  // Open Duplicate
  const handleDuplicateJadwal = (item: JadwalPelajaran) => {
    setTargetJadwal(null);
    setFormHari(item.hari);
    setFormKelas(item.kelas);
    setMultiRows([
      { id: `dup-${Date.now()}`, mapel: item.mapel, guruNama: item.guruNama },
    ]);
    setActiveMenu("tambah");
    showToast(`Jadwal ${item.mapel} disalin ke formulir tambah.`, "info");
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item: JadwalPelajaran) => {
    setTargetJadwal(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Add (Multiple Subjects & Direct Teachers, without start/end time)
  const handleSaveAddJadwal = (e: React.FormEvent, stayOnAdd: boolean = false) => {
    e.preventDefault();
    if (!formKelas) {
      showToast("Mohon tentukan rombel kelas terlebih dahulu.", "error");
      return;
    }

    const validEntries = multiRows.filter(
      (entry) => entry.mapel.trim() !== "" && entry.guruNama.trim() !== ""
    );

    if (validEntries.length === 0) {
      showToast("Mohon masukkan minimal 1 mata pelajaran beserta guru pengampunya.", "error");
      return;
    }

    if (teacherScope.isTeacher) {
      if (!teacherScope.isClassAccessible(formKelas)) {
        showToast(`Anda hanya berwenang menambahkan jadwal untuk kelas ${teacherScope.assignedClass}.`, "error");
        return;
      }
      for (const entry of validEntries) {
        if (!teacherScope.isSubjectAccessible(entry.mapel)) {
          showToast(
            `Mata pelajaran "${entry.mapel}" bukan merupakan mapel yang Anda ampu (${teacherScope.assignedSubjects.join(", ")}).`,
            "error"
          );
          return;
        }
      }
    }

    const itemsToSave: Omit<JadwalPelajaran, "id">[] = validEntries.map((entry) => ({
      hari: formHari,
      kelas: formKelas,
      mapel: entry.mapel.trim(),
      guruNama: entry.guruNama.trim(),
      jamMulai: "-",
      jamSelesai: "-",
      ruangan: "",
    }));

    bulkAddJadwal(itemsToSave);

    if (isAddModalOpen) {
      setIsAddModalOpen(false);
    }

    showToast(
      `🎉 Berhasil menambahkan ${validEntries.length} mata pelajaran untuk kelas ${formKelas} (${formHari})!`,
      "success"
    );

    if (!stayOnAdd) {
      setActiveMenu("lihat");
      setSelectedKelas(formKelas);
      setSelectedHari(formHari);
    } else {
      handleResetRows();
    }
  };

  // Submit Edit
  const handleSaveEditJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJadwal) return;

    if (!formKelas || !formMapel || !formGuruNama) {
      showToast("Mohon lengkapi seluruh data jadwal KBM.", "error");
      return;
    }

    if (teacherScope.isTeacher) {
      if (!teacherScope.isClassAccessible(formKelas)) {
        showToast(`Anda hanya berwenang mengedit jadwal untuk kelas ${teacherScope.assignedClass}.`, "error");
        return;
      }
      if (!teacherScope.isSubjectAccessible(formMapel)) {
        showToast(`Anda hanya berwenang mengedit jadwal untuk mata pelajaran yang diampu (${teacherScope.assignedSubjects.join(", ")}).`, "error");
        return;
      }
    }

    const sMulai = parseTimeToMinutes(formJamMulai);
    const sSelesai = parseTimeToMinutes(formJamSelesai);
    if (sMulai !== null && sSelesai !== null && sMulai >= sSelesai) {
      showToast("Jam selesai harus lebih akhir dari jam mulai.", "error");
      return;
    }

    updateJadwal(targetJadwal.id, {
      hari: formHari,
      jamMulai: formJamMulai ? formJamMulai : "-",
      jamSelesai: formJamSelesai ? formJamSelesai : "-",
      kelas: formKelas,
      mapel: formMapel,
      guruNama: formGuruNama,
      ruangan: formRuangan || "",
    });

    setIsEditModalOpen(false);
    setTargetJadwal(null);
    showToast(`Jadwal ${formMapel} (${formKelas}) berhasil diperbarui!`, "success");
  };

  // Confirm Single Delete
  const handleConfirmDelete = () => {
    if (!targetJadwal) return;
    deleteJadwal(targetJadwal.id);
    setIsDeleteModalOpen(false);
    showToast(`Jadwal ${targetJadwal.mapel} (${targetJadwal.kelas}) berhasil dihapus.`, "success");
    setTargetJadwal(null);
  };

  // ================= MATA PELAJARAN HANDLERS =================
  const handleOpenAddMapel = () => {
    setTargetMapel(null);
    setMapelFormNama("");
    setMapelFormKode("");
    setMapelFormKategori("Wajib");
    setMapelFormKkm(75);
    setIsAddMapelModalOpen(true);
  };

  const handleOpenEditMapel = (m: MataPelajaran) => {
    setTargetMapel(m);
    setMapelFormNama(m.nama);
    setMapelFormKode(m.kode);
    setMapelFormKategori(m.kategori);
    setMapelFormKkm(m.kkm);
    setIsEditMapelModalOpen(true);
  };

  const handleOpenDeleteMapel = (m: MataPelajaran) => {
    setTargetMapel(m);
    setIsDeleteMapelModalOpen(true);
  };

  const handleSaveAddMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapelFormNama.trim()) {
      showToast("Mohon masukkan nama mata pelajaran.", "error");
      return;
    }
    const isDuplicate = mapelList.some(
      (m) => m.nama.trim().toLowerCase() === mapelFormNama.trim().toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Mata pelajaran "${mapelFormNama}" sudah terdaftar sebelumnya.`, "error");
      return;
    }

    const generatedKode = mapelFormKode.trim()
      ? mapelFormKode.trim().toUpperCase()
      : mapelFormNama.trim().replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "MPL";

    addMapel({
      nama: mapelFormNama.trim(),
      kode: generatedKode,
      kategori: mapelFormKategori,
      kkm: Number(mapelFormKkm) || 75,
    });

    setIsAddMapelModalOpen(false);
    showToast(`Mata pelajaran "${mapelFormNama.trim()}" berhasil ditambahkan!`, "success");
  };

  const handleSaveEditMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMapel) return;
    if (!mapelFormNama.trim()) {
      showToast("Mohon masukkan nama mata pelajaran.", "error");
      return;
    }

    const isDuplicate = mapelList.some(
      (m) => m.id !== targetMapel.id && m.nama.trim().toLowerCase() === mapelFormNama.trim().toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Mata pelajaran "${mapelFormNama}" sudah digunakan oleh mata pelajaran lain.`, "error");
      return;
    }

    const generatedKode = mapelFormKode.trim()
      ? mapelFormKode.trim().toUpperCase()
      : targetMapel.kode;

    updateMapel(targetMapel.id, {
      nama: mapelFormNama.trim(),
      kode: generatedKode,
      kategori: mapelFormKategori,
      kkm: Number(mapelFormKkm) || 75,
    });

    setIsEditMapelModalOpen(false);
    showToast(`Mata pelajaran "${mapelFormNama.trim()}" berhasil diperbarui!`, "success");
    setTargetMapel(null);
  };

  const handleConfirmDeleteMapel = () => {
    if (!targetMapel) return;
    const deletedName = targetMapel.nama;
    deleteMapel(targetMapel.id);
    setIsDeleteMapelModalOpen(false);
    showToast(`Mata pelajaran "${deletedName}" berhasil dihapus.`, "success");
    setTargetMapel(null);
  };

  // Bulk Delete Actions
  const toggleSelectDelete = (id: string) => {
    setSelectedIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIdsToDelete.length === filteredJadwal.length) {
      setSelectedIdsToDelete([]);
    } else {
      setSelectedIdsToDelete(filteredJadwal.map((j) => j.id));
    }
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIdsToDelete.length === 0) return;
    bulkDeleteJadwal(selectedIdsToDelete);
    setIsBulkDeleteModalOpen(false);
    showToast(`Sebanyak ${selectedIdsToDelete.length} jadwal berhasil dihapus.`, "success");
    setSelectedIdsToDelete([]);
  };

  // Print Handler (Membuka Modal Pratinjau Cetak Senin s/d Jumat)
  const handleOpenPrintModal = () => {
    if (teacherScope.isTeacher) {
      setPrintSelectedKelas(teacherScope.assignedClass || "X MIPA 1");
    } else if (selectedKelas !== "Semua") {
      setPrintSelectedKelas(selectedKelas);
    } else {
      setPrintSelectedKelas("Semua");
    }
    setIsPrintModalOpen(true);
  };

  // Daftar rombel kelas yang akan dicetak
  const classesForPrint = useMemo(() => {
    if (teacherScope.isTeacher) {
      const tc = kelasList.find((k) => teacherScope.isClassAccessible(k.nama));
      if (tc) return [tc];
      return [
        {
          id: "cls-teacher",
          nama: teacherScope.assignedClass || "Kelas Binaan",
          tingkat: "X",
          waliKelasId: "gur",
          waliKelasNama: teacherScope.teacherName,
          kapasitas: 36,
          jumlahSiswa: 36,
          ruangan: "Kelas Binaan",
        },
      ];
    }

    if (printSelectedKelas === "Semua") {
      return kelasList.length > 0
        ? kelasList
        : [
            {
              id: "cls-all",
              nama: "Semua Kelas",
              tingkat: "X",
              waliKelasId: "-",
              waliKelasNama: "-",
              kapasitas: 0,
              jumlahSiswa: 0,
              ruangan: "-",
            },
          ];
    }

    const found = kelasList.filter((k) => k.nama === printSelectedKelas);
    if (found.length > 0) return found;

    return [
      {
        id: "cls-custom",
        nama: printSelectedKelas,
        tingkat: "X",
        waliKelasId: "-",
        waliKelasNama: "-",
        kapasitas: 0,
        jumlahSiswa: 0,
        ruangan: "-",
      },
    ];
  }, [teacherScope, printSelectedKelas, kelasList]);

  // Helper untuk mengambil sesi pelajaran per hari (Senin s/d Jumat)
  const getSchedulesForDay = (kelasNama: string, hari: JadwalPelajaran["hari"]) => {
    return jadwalList
      .filter((j) => (kelasNama === "Semua Kelas" ? true : j.kelas === kelasNama) && j.hari === hari)
      .sort((a, b) => {
        const startA = parseTimeToMinutes(a.jamMulai) || 0;
        const startB = parseTimeToMinutes(b.jamMulai) || 0;
        return startA - startB;
      });
  };

  // Filtered & Sorted Schedules
  const filteredJadwal = useMemo(() => {
    return jadwalList
      .filter((j) => {
        const matchKelas = teacherScope.isTeacher
          ? teacherScope.isClassAccessible(j.kelas)
          : selectedKelas === "Semua" || j.kelas === selectedKelas;
        const matchHari = selectedHari === "Semua" || j.hari === selectedHari;

        let matchMapel = true;
        if (teacherScope.isTeacher) {
          if (selectedMapel === "Diampu") {
            matchMapel = teacherScope.isSubjectAccessible(j.mapel);
          } else if (selectedMapel !== "Semua") {
            matchMapel =
              j.mapel.toLowerCase().includes(selectedMapel.toLowerCase()) ||
              selectedMapel.toLowerCase().includes(j.mapel.toLowerCase());
          }
        } else {
          if (selectedMapel !== "Semua") {
            matchMapel =
              j.mapel.toLowerCase().includes(selectedMapel.toLowerCase()) ||
              selectedMapel.toLowerCase().includes(j.mapel.toLowerCase());
          }
        }

        const q = searchTerm.toLowerCase().trim();
        const matchSearch =
          !q ||
          j.mapel.toLowerCase().includes(q) ||
          j.guruNama.toLowerCase().includes(q) ||
          j.kelas.toLowerCase().includes(q);

        return matchKelas && matchHari && matchMapel && matchSearch;
      })
      .sort((a, b) => {
        const dayOrder = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };
        const dayDiff = (dayOrder[a.hari] || 99) - (dayOrder[b.hari] || 99);
        if (dayDiff !== 0) return dayDiff;
        const startA = parseTimeToMinutes(a.jamMulai) || 0;
        const startB = parseTimeToMinutes(b.jamMulai) || 0;
        return startA - startB;
      });
  }, [jadwalList, selectedKelas, selectedHari, selectedMapel, searchTerm, teacherScope]);

  // Helper to check if an item in the list has an active overlap
  const checkItemOverlap = (item: JadwalPelajaran) => {
    if (!item.jamMulai || item.jamMulai === "-" || !item.jamSelesai || item.jamSelesai === "-") {
      return undefined;
    }
    return jadwalList.find(
      (other) =>
        other.id !== item.id &&
        other.hari === item.hari &&
        other.jamMulai &&
        other.jamMulai !== "-" &&
        other.jamSelesai &&
        other.jamSelesai !== "-" &&
        isTimeOverlapping(item.jamMulai, item.jamSelesai, other.jamMulai, other.jamSelesai) &&
        (other.kelas === item.kelas ||
          (normalizeTeacherName(other.guruNama) &&
            normalizeTeacherName(other.guruNama) === normalizeTeacherName(item.guruNama)))
    );
  };

  // Filtered Mata Pelajaran for Menu 5 (Kelola Mapel)
  const filteredMapelList = useMemo(() => {
    return mapelList.filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(mapelSearchTerm.toLowerCase()) ||
        m.kode.toLowerCase().includes(mapelSearchTerm.toLowerCase());
      const matchKategori =
        mapelFilterKategori === "Semua" || m.kategori === mapelFilterKategori;
      return matchSearch && matchKategori;
    });
  }, [mapelList, mapelSearchTerm, mapelFilterKategori]);

  // Statistics
  const stats = useMemo(() => {
    const relevantJadwal = teacherScope.isTeacher
      ? jadwalList.filter((j) => teacherScope.isClassAccessible(j.kelas))
      : jadwalList;
    const totalJadwal = relevantJadwal.length;
    const uniqueKelas = new Set(relevantJadwal.map((j) => j.kelas)).size;
    const uniqueGuru = new Set(relevantJadwal.map((j) => j.guruNama)).size;
    const filteredCount = filteredJadwal.length;

    return {
      total: totalJadwal,
      filtered: filteredCount,
      kelasCount: uniqueKelas,
      guruCount: uniqueGuru,
    };
  }, [jadwalList, filteredJadwal, teacherScope]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/80 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-800"
              : "bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
          {toast.type === "info" && <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Interactive Screen UI Wrapper (Hidden during print) */}
      <div className="space-y-6 no-print">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Jadwal Pelajaran & KBM
                </h1>
                {/* Cloud Status Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isSyncing || isAutoPushing
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                      : isSupabaseConnected
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  }`}
                  title={isSupabaseConnected ? "Tersambung ke Supabase Cloud (Sinkronisasi Otomatis Aktif)" : "Mode Penyimpanan Lokal"}
                >
                  {isSyncing || isAutoPushing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Sinkronisasi Cloud...</span>
                    </>
                  ) : isSupabaseConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Cloud Terhubung (Supabase)</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Penyimpanan Lokal</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pusat pengelolaan agenda KBM sekolah: Menu Tambah, Hapus, dan Edit jadwal pelajaran per rombel kelas &bull; Terhubung otomatis ke Supabase.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={async () => {
              try {
                await syncWithSupabase();
                showToast("Data jadwal pelajaran berhasil disinkronkan dari Supabase Cloud!", "success");
              } catch (e: any) {
                showToast(e.message || "Gagal sinkronisasi data cloud.", "error");
              }
            }}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer disabled:opacity-60"
            title="Tarik data jadwal pelajaran & mapel terbaru langsung dari Supabase Cloud"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Menyinkronkan..." : "Sinkron Cloud"}</span>
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => setIsResetDefaultModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              title="Kembalikan jadwal ke sampel awal"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          )}

          <button
            onClick={handleOpenPrintModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Jadwal
          </button>
        </div>
      </div>

      {/* Teacher Homeroom Banner */}
      {teacherScope.isTeacher && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Jadwal Pelajaran KBM: Kelas {teacherScope.assignedClass}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {teacherScope.teacherName}
                </span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Mata Pelajaran Diampu: <strong>{teacherScope.assignedSubjects.join(", ")}</strong> &bull; Rombel Kelas Binaan: <strong>{teacherScope.assignedClass}</strong>.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-700/50 self-start sm:self-center shrink-0">
            Akses Terkunci: {teacherScope.assignedClass} &bull; {teacherScope.assignedSubjects.join(", ")}
          </span>
        </div>
      )}

      {/* ================= DEDICATED MENU BAR (TABBED NAVIGATION) ================= */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Menu 1: Lihat Jadwal */}
          <button
            type="button"
            onClick={() => setActiveMenu("lihat")}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeMenu === "lihat"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>1. Lihat ({stats.total})</span>
          </button>

          {/* Menu 2: Tambah Jadwal */}
          <button
            type="button"
            onClick={() => {
              initForm();
              setActiveMenu("tambah");
            }}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeMenu === "tambah"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>2. Tambah Jadwal</span>
          </button>

          {/* Menu 3: Edit Jadwal */}
          <button
            type="button"
            onClick={() => setActiveMenu("edit")}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeMenu === "edit"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>3. Edit Jadwal</span>
          </button>

          {/* Menu 4: Hapus Jadwal */}
          <button
            type="button"
            onClick={() => setActiveMenu("hapus")}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeMenu === "hapus"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>4. Hapus {selectedIdsToDelete.length > 0 && `(${selectedIdsToDelete.length})`}</span>
          </button>

          {/* Menu 5: Kelola Mata Pelajaran */}
          <button
            type="button"
            onClick={() => setActiveMenu("mapel")}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all col-span-2 sm:col-span-1 ${
              activeMenu === "mapel"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>5. Kelola Mapel ({mapelList.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MENU 1: LIHAT JADWAL (VISUAL GRID & TABLE)                            */}
      {/* ===================================================================== */}
      {activeMenu === "lihat" && (
        <div className="space-y-4">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Sesi</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</h3>
              <span className="text-[11px] text-slate-400">Semua kelas & hari</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hasil Filter</span>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.filtered}</h3>
              <span className="text-[11px] text-slate-400">Sesi tampil saat ini</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rombel Kelas</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.kelasCount}</h3>
              <span className="text-[11px] text-slate-400">Kelas memiliki jadwal</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dewan Guru</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.guruCount}</h3>
              <span className="text-[11px] text-slate-400">Pendidik aktif mengajar</span>
            </div>
          </div>

          {/* Filter & Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {teacherScope.isTeacher ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200">
                    <span>Kelas: {teacherScope.assignedClass}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">(Wali)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Kelas:</span>
                    <select
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Semua">Semua Kelas ({kelasList.length})</option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.nama}>
                          {k.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filter Mapel */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Mapel:</span>
                  <select
                    value={selectedMapel}
                    onChange={(e) => setSelectedMapel(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {teacherScope.isTeacher ? (
                      <>
                        <option value="Semua">Semua Jadwal ({teacherScope.assignedClass})</option>
                        <option value="Diampu">
                          ★ Hanya Mapel Diampu ({teacherScope.assignedSubjects.join(", ")})
                        </option>
                        {teacherScope.scopedMapelList.map((m) => (
                          <option key={m.id} value={m.nama}>
                            {m.nama} (Diampu)
                          </option>
                        ))}
                      </>
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
                </div>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari mapel, guru, atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode & Quick Add */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === "table"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabel</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sesi</span>
                </button>
              </div>
            </div>

            {/* Hari Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 pb-1">
              <button
                onClick={() => setSelectedHari("Semua")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  selectedHari === "Semua"
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Semua Hari
              </button>
              {hariList.map((hari) => {
                const countForDay = jadwalList.filter(
                  (j) => j.hari === hari && (selectedKelas === "Semua" || j.kelas === selectedKelas)
                ).length;

                return (
                  <button
                    key={hari}
                    onClick={() => setSelectedHari(hari)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                      selectedHari === hari
                        ? "bg-indigo-600 text-white font-semibold shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{hari}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedHari === hari
                          ? "bg-indigo-700 text-indigo-100"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {countForDay}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule List Content */}
          {filteredJadwal.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Belum ada jadwal KBM pada filter ini
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Gunakan Menu Tambah Jadwal di atas untuk menambahkan agenda sesi pelajaran baru.
              </p>
              <button
                onClick={() => {
                  initForm();
                  setActiveMenu("tambah");
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Buka Menu Tambah Jadwal
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJadwal.map((item) => {
                const overlappingWith = checkItemOverlap(item);
                return (
                  <div
                    key={item.id}
                    className={`group p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm transition-all flex flex-col justify-between ${
                      overlappingWith
                        ? "border-amber-300 dark:border-amber-800/80 hover:border-amber-400"
                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-900/40">
                          {item.hari}
                        </span>
                        {item.jamMulai && item.jamMulai !== "-" ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            <span>
                              {item.jamMulai} {item.jamSelesai && item.jamSelesai !== "-" ? `- ${item.jamSelesai}` : ""}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Sesi Belajar</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.mapel}
                        </h3>
                        {teacherScope.isTeacher && teacherScope.isSubjectAccessible(item.mapel) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Diampu
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{item.guruNama}</span>
                        </div>
                      </div>

                      {overlappingWith && (
                        <div className="mt-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
                          <span className="flex items-center gap-1 font-medium truncate">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">Bersinggungan dgn &ldquo;{overlappingWith.mapel}&rdquo;</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="font-bold underline ml-2 shrink-0 hover:text-amber-900 dark:hover:text-amber-100"
                          >
                            Ubah
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {item.kelas}
                      </span>

                      {/* Quick Action buttons */}
                      <div className="flex items-center gap-1 no-print">
                        <button
                          type="button"
                          onClick={() => handleDuplicateJadwal(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                          title="Salin Jadwal"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                          title="Edit Jadwal"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Hari</th>
                      <th className="py-3 px-4">Jam Belajar</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Mata Pelajaran</th>
                      <th className="py-3 px-4">Guru Pengampu</th>
                      <th className="py-3 px-4 text-center no-print">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredJadwal.map((item) => {
                      const overlappingWith = checkItemOverlap(item);
                      return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          overlappingWith
                            ? "bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs">
                            {item.hari}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 block">
                            {item.jamMulai && item.jamMulai !== "-"
                              ? `${item.jamMulai} - ${item.jamSelesai}`
                              : "Sesi KBM"}
                          </span>
                          {overlappingWith && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                              ⚠️ Bersinggungan ({overlappingWith.mapel})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white text-xs">
                          {item.kelas}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{item.mapel}</span>
                            {teacherScope.isTeacher && teacherScope.isSubjectAccessible(item.mapel) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Diampu
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                          {item.guruNama}
                        </td>
                        <td className="py-3 px-4 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateJadwal(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                              title="Salin Jadwal"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                              title="Edit Jadwal"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="Hapus Jadwal"
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
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MENU 2: TAMBAH JADWAL PELAJARAN (MULTI MAPEL & PILIHAN LANGSUNG GURU) */}
      {/* ===================================================================== */}
      {activeMenu === "tambah" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-xl">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Menu Tambah Jadwal Pelajaran
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Masukkan satu atau beberapa mata pelajaran langsung sekaligus, pilih guru yang mengajar, tanpa alokasi jam.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveMenu("lihat")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              ← Kembali ke Jadwal
            </button>
          </div>

          <form onSubmit={(e) => handleSaveAddJadwal(e, false)} className="space-y-6">
            {/* Bagian 1: Hari & Rombel Kelas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hari KBM <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {hariList.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setFormHari(h)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        formHari === h
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rombongan Belajar (Kelas) <span className="text-rose-500">*</span>
                </label>
                {teacherScope.isTeacher ? (
                  <div className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                    {teacherScope.assignedClass} (Kelas Binaan Terkunci)
                  </div>
                ) : (
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama} (Jumlah Murid: {k.jumlahSiswa}/{k.kapasitas})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Bagian 2: Daftar Mata Pelajaran & Pilihan Langsung Guru Pengampu */}
            <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Daftar Mata Pelajaran & Guru Pengampu
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {multiRows.length} Mapel
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!teacherScope.isTeacher && (
                    <button
                      type="button"
                      onClick={handlePopulateAllMapel}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1.5"
                      title="Tambahkan seluruh mata pelajaran kurikulum sekaligus"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                      <span>Muat Semua Mapel</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddMapel}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5"
                    title="Tambah nama mata pelajaran baru ke master"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mapel Baru</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-3">
                {multiRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                  >
                    {/* Badge Nomor */}
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>

                    {/* Mata Pelajaran Selector */}
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Mata Pelajaran <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={row.mapel}
                        onChange={(e) => handleRowMapelChange(row.id, e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {(teacherScope.isTeacher ? teacherScope.scopedMapelList : mapelList).map((m) => (
                          <option key={m.id} value={m.nama}>
                            {m.nama} ({m.kategori})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Guru Pengampu (Pilihan Langsung Siapa Guru yang Mengajar) */}
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Guru Pengampu <span className="text-rose-500">*</span>
                      </label>
                      {teacherScope.isTeacher ? (
                        <div className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                          {teacherScope.teacherName} (Terkunci)
                        </div>
                      ) : (
                        <select
                          value={row.guruNama}
                          onChange={(e) => handleRowGuruChange(row.id, e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Pilih Guru yang Mengajar --</option>
                          {guruList.map((g) => {
                            const fullGuru = `${g.nama}${g.gelar ? `, ${g.gelar}` : ""}`;
                            return (
                              <option key={g.id} value={fullGuru}>
                                {fullGuru} ({g.mataPelajaran.join(", ")})
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>

                    {/* Tombol Hapus Baris */}
                    <div className="pt-2 md:pt-4 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus baris mata pelajaran ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Row helper button below list */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Baris Mata Pelajaran Lainnya</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetRows}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Bersihkan Baris
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => initForm()}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              >
                Reset Formulir
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => handleSaveAddJadwal(e, true)}
                  className="px-4 py-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all"
                >
                  Simpan & Tambah Rombel/Hari Lain
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Simpan {multiRows.filter((r) => r.mapel).length > 0 ? `${multiRows.filter((r) => r.mapel).length} ` : ""}Jadwal Mata Pelajaran
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MENU 3: EDIT JADWAL PELAJARAN (TABLE WITH EDIT BUTTONS)              */}
      {/* ===================================================================== */}
      {activeMenu === "edit" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 rounded-xl">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Menu Edit Jadwal Pelajaran
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih salah satu sesi pelajaran di bawah untuk memperbarui jam, hari, guru, atau ruangan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveMenu("lihat")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors self-start sm:self-auto"
            >
              ← Kembali ke Jadwal
            </button>
          </div>

          {/* Table of Schedules to Edit */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Hari & Jam</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Guru Pengampu</th>
                  <th className="py-3 px-4 text-center">Aksi Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredJadwal.map((item) => {
                  const overlappingWith = checkItemOverlap(item);
                  return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      overlappingWith
                        ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70"
                        : "hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {item.hari}
                        </span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          {item.jamMulai && item.jamMulai !== "-"
                            ? `${item.jamMulai} - ${item.jamSelesai}`
                            : "Sesi KBM"}
                        </span>
                      </div>
                      {overlappingWith && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                          ⚠️ Bersinggungan ({overlappingWith.mapel})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-xs text-slate-900 dark:text-white">
                      {item.kelas}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.mapel}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {item.guruNama}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(!teacherScope.isTeacher || (teacherScope.isClassAccessible(item.kelas) && teacherScope.isSubjectAccessible(item.mapel))) ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Sesi Ini</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          Bukan Mapel Diampu
                        </span>
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

      {/* ===================================================================== */}
      {/* MENU 4: HAPUS JADWAL PELAJARAN (SINGLE & BULK DELETE DASHBOARD)     */}
      {/* ===================================================================== */}
      {activeMenu === "hapus" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Menu Hapus / Kurangi Jadwal Pelajaran
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hapus sesi jadwal perorangan atau pilih beberapa sesi untuk dihapus sekaligus secara massal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveMenu("lihat")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors self-start sm:self-auto"
            >
              ← Kembali ke Jadwal
            </button>
          </div>

          {/* Bulk Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:text-indigo-600"
              >
                {selectedIdsToDelete.length === filteredJadwal.length && filteredJadwal.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Pilih Semua Sesi ({filteredJadwal.length})</span>
              </button>

              <span className="text-slate-400">|</span>

              <span className="font-medium text-slate-600 dark:text-slate-400">
                Terpilih: <strong className="text-rose-600">{selectedIdsToDelete.length}</strong> sesi
              </span>
            </div>

            <button
              type="button"
              disabled={selectedIdsToDelete.length === 0}
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedIdsToDelete.length > 0
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIdsToDelete.length} Jadwal Terpilih</span>
            </button>
          </div>

          {/* Table with Selection Checkboxes */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">Pilih</th>
                  <th className="py-3 px-4">Hari & Jam</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Guru Pengampu</th>
                  <th className="py-3 px-4 text-center">Aksi Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredJadwal.map((item) => {
                  const isChecked = selectedIdsToDelete.includes(item.id);
                  const canDeleteItem = !teacherScope.isTeacher || (
                    teacherScope.isClassAccessible(item.kelas) && teacherScope.isSubjectAccessible(item.mapel)
                  );

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (canDeleteItem) toggleSelectDelete(item.id);
                      }}
                      className={`transition-colors ${
                        canDeleteItem ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                      } ${
                        isChecked
                          ? "bg-rose-50/50 dark:bg-rose-950/40"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {canDeleteItem ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectDelete(item.id)}
                            className="rounded text-rose-600 focus:ring-rose-500 dark:bg-slate-800 w-4 h-4 cursor-pointer"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {item.hari}
                          </span>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {item.jamMulai && item.jamMulai !== "-"
                              ? `${item.jamMulai} - ${item.jamSelesai}`
                              : "Sesi KBM"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-slate-900 dark:text-white">
                        {item.kelas}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{item.mapel}</span>
                          {teacherScope.isTeacher && teacherScope.isSubjectAccessible(item.mapel) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Diampu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {item.guruNama}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {canDeleteItem ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(item)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-xl transition-all inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            Bukan Mapel Diampu
                          </span>
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

      {/* ===================================================================== */}
      {/* MENU 5: KELOLA MATA PELAJARAN (TAMBAH, EDIT, HAPUS MAPEL)              */}
      {/* ===================================================================== */}
      {activeMenu === "mapel" && (
        <div className="space-y-6">
          {/* Top Banner / Action Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Kelola Master Mata Pelajaran
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tambah, perbarui, dan hapus nama mata pelajaran. Perubahan nama otomatis memperbarui jadwal KBM, nilai siswa, dan guru pengampu.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddMapel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-2 shadow-sm shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Mapel Baru</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Pills / Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div
                onClick={() => setMapelFilterKategori("Semua")}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  mapelFilterKategori === "Semua"
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="text-[11px] font-medium block">Total Mata Pelajaran</span>
                <span className="text-lg font-extrabold">{mapelList.length} Mapel</span>
              </div>

              <div
                onClick={() => setMapelFilterKategori("Wajib")}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  mapelFilterKategori === "Wajib"
                    ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="text-[11px] font-medium block">Kelompok Wajib</span>
                <span className="text-lg font-extrabold">
                  {mapelList.filter((m) => m.kategori === "Wajib").length} Mapel
                </span>
              </div>

              <div
                onClick={() => setMapelFilterKategori("Peminatan")}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  mapelFilterKategori === "Peminatan"
                    ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="text-[11px] font-medium block">Kelompok Peminatan</span>
                <span className="text-lg font-extrabold">
                  {mapelList.filter((m) => m.kategori === "Peminatan").length} Mapel
                </span>
              </div>

              <div
                onClick={() => setMapelFilterKategori("Muatan Lokal")}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  mapelFilterKategori === "Muatan Lokal"
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="text-[11px] font-medium block">Muatan Lokal</span>
                <span className="text-lg font-extrabold">
                  {mapelList.filter((m) => m.kategori === "Muatan Lokal").length} Mapel
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mapelSearchTerm}
                onChange={(e) => setMapelSearchTerm(e.target.value)}
                placeholder="Cari nama atau kode mapel..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {mapelSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMapelSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Kategori:
              </span>
              <select
                value={mapelFilterKategori}
                onChange={(e) => setMapelFilterKategori(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Wajib">Wajib</option>
                <option value="Peminatan">Peminatan</option>
                <option value="Muatan Lokal">Muatan Lokal</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-24">Kode</th>
                    <th className="py-3 px-4">Nama Mata Pelajaran</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">KKM</th>
                    <th className="py-3 px-4">Terjadwal di KBM</th>
                    <th className="py-3 px-4">Guru Pengampu</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMapelList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                        <p className="text-sm font-semibold">Tidak ada mata pelajaran yang ditemukan</p>
                        <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMapelList.map((m, idx) => {
                      const countJadwal = jadwalList.filter(
                        (j) => j.mapel.trim().toLowerCase() === m.nama.trim().toLowerCase()
                      ).length;
                      const assignedTeachers = guruList.filter((g) =>
                        g.mataPelajaran.some(
                          (sub) => sub.trim().toLowerCase() === m.nama.trim().toLowerCase()
                        )
                      );

                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-xs font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {m.kode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {m.nama}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                m.kategori === "Wajib"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  : m.kategori === "Peminatan"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {m.kategori}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {m.kkm}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {countJadwal > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>{countJadwal} Sesi Terjadwal</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Belum Terjadwal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {assignedTeachers.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {assignedTeachers.map((g) => (
                                  <span
                                    key={g.id}
                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                                  >
                                    {g.nama}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Belum Ditautkan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMapel(m)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                                title="Edit Nama / Kategori Mata Pelajaran"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteMapel(m)}
                                className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                title="Hapus Mata Pelajaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}
      </div> {/* End of no-print screen UI */}

      {/* ================= MODAL: EDIT JADWAL ================= */}
      {isEditModalOpen && targetJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Edit Jadwal Pelajaran
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbarui rincian jam, hari, mata pelajaran, atau guru pengampu.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEditJadwal} className="p-6 overflow-y-auto space-y-4 flex-1">
              {conflictDetails.warnings.length > 0 && (
                <div
                  className={`p-3.5 rounded-xl text-xs space-y-2 border transition-all ${
                    allowJointSession
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 ${
                          allowJointSession ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      />
                      <span>
                        {allowJointSession
                          ? "Sesi Bersama / Gabungan Diizinkan"
                          : "Peringatan Jam Bersinggungan / Bentrok:"}
                      </span>
                    </div>

                    {!allowJointSession && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextSlot = getNextAvailableSlot(formKelas, formHari);
                          setFormJamMulai(nextSlot.jamMulai);
                          setFormJamSelesai(nextSlot.jamSelesai);
                          showToast(`Jam KBM digeser ke slot kosong: ${nextSlot.jamMulai} - ${nextSlot.jamSelesai}`, "info");
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-lg shrink-0 flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Jam Kosong</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 pl-5">
                    {conflictDetails.warnings.map((warn, i) => (
                      <p key={i} className="text-xs">
                        • {warn}
                      </p>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1.5 border-t border-amber-200 dark:border-amber-800/70 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    <input
                      type="checkbox"
                      checked={allowJointSession}
                      onChange={(e) => setAllowJointSession(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 w-3.5 h-3.5"
                    />
                    <span>Centang jika sesi merupakan kegiatan gabungan / bersama (abaikan peringatan).</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hari Pelajaran
                  </label>
                  <select
                    value={formHari}
                    onChange={(e) => handleHariChange(e.target.value as JadwalPelajaran["hari"])}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {hariList.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas (Rombel)
                  </label>
                  {teacherScope.isTeacher ? (
                    <div className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                      {teacherScope.assignedClass}
                    </div>
                  ) : (
                    <select
                      value={formKelas}
                      onChange={(e) => handleKelasChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.nama}>
                          {k.nama}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Mulai <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="time"
                    value={formJamMulai === "-" ? "" : formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value || "-")}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Selesai <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="time"
                    value={formJamSelesai === "-" ? "" : formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value || "-")}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran
                </label>
                <div className="flex gap-2">
                  <select
                    value={formMapel}
                    onChange={(e) => handleMapelChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {!teacherScope.isTeacher && (
                      <option value="">-- Pilih dari Kurikulum --</option>
                    )}
                    {(teacherScope.isTeacher ? teacherScope.scopedMapelList : mapelList).map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                  {!teacherScope.isTeacher && (
                    <input
                      type="text"
                      required
                      value={formMapel}
                      onChange={(e) => setFormMapel(e.target.value)}
                      className="w-1/2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Guru Pengampu
                </label>
                {teacherScope.isTeacher ? (
                  <div className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                    {teacherScope.teacherName} (Terkunci)
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={formGuruNama}
                      onChange={(e) => setFormGuruNama(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Guru Pengampu --</option>
                      {guruList.map((g) => {
                        const full = `${g.nama}${g.gelar ? `, ${g.gelar}` : ""}`;
                        return (
                          <option key={g.id} value={full}>
                            {full} ({g.mataPelajaran.join(", ")})
                          </option>
                        );
                      })}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Atau tulis nama guru pengajar manual"
                      value={formGuruNama}
                      onChange={(e) => setFormGuruNama(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI KURANG / HAPUS TUNGGAL ================= */}
      {isDeleteModalOpen && targetJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Sesi Jadwal Pelajaran?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sesi KBM ini akan dihapus dari agenda kelas.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {targetJadwal.mapel}
              </p>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Hari & Jam:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {targetJadwal.hari}, {targetJadwal.jamMulai} - {targetJadwal.jamSelesai}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Rombel Kelas:</span>
                <span className="font-semibold">{targetJadwal.kelas}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Guru:</span>
                <span className="font-semibold">{targetJadwal.guruNama}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm"
              >
                Ya, Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS MASSAL (BULK DELETE) ================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus {selectedIdsToDelete.length} Jadwal Terpilih?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini akan menghapus seluruh sesi pelajaran yang Anda centang.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus sebanyak{" "}
              <strong className="text-rose-600 font-bold">{selectedIdsToDelete.length} sesi jadwal</strong> pelajaran ini secara permanen dari agenda KBM?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm"
              >
                Ya, Hapus {selectedIdsToDelete.length} Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI RESET DEFAULT ================= */}
      {isResetDefaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset ke Jadwal Bawaan Awal?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data jadwal KBM akan dikembalikan ke susunan sampel awal.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Semua jadwal yang baru saja Anda tambahkan atau ubah akan direset kembali ke susunan jadwal standar sekolah.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetDefaultModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetJadwalToDefault();
                  setIsResetDefaultModalOpen(false);
                  showToast("Jadwal pelajaran telah direset ke data sampel awal.", "info");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm"
              >
                Ya, Reset Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT MATA PELAJARAN ================= */}
      {(isAddMapelModalOpen || isEditMapelModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-xl">
                  {isEditMapelModalOpen ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {isEditMapelModalOpen ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isEditMapelModalOpen
                      ? "Perbarui nama, kode, kategori, atau KKM mata pelajaran."
                      : "Daftarkan mata pelajaran baru ke dalam kurikulum sekolah."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddMapelModalOpen(false);
                  setIsEditMapelModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={isEditMapelModalOpen ? handleSaveEditMapel : handleSaveAddMapel} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Wajib, Fisika, dsb."
                  value={mapelFormNama}
                  onChange={(e) => setMapelFormNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Singkatan <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: MTK"
                    value={mapelFormKode}
                    onChange={(e) => setMapelFormKode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-semibold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Standar KKM <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={mapelFormKkm}
                    onChange={(e) => setMapelFormKkm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Kelompok <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Wajib", "Peminatan", "Muatan Lokal"] as const).map((kat) => (
                    <button
                      key={kat}
                      type="button"
                      onClick={() => setMapelFormKategori(kat)}
                      className={`py-2 px-2.5 text-center text-xs font-semibold rounded-xl border transition-all ${
                        mapelFormKategori === kat
                          ? kat === "Wajib"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : kat === "Peminatan"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60"
                      }`}
                    >
                      {kat}
                    </button>
                  ))}
                </div>
              </div>

              {isEditMapelModalOpen && targetMapel && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Sinkronisasi Otomatis:</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Jika nama diubah, semua agenda KBM di jadwal pelajaran, riwayat nilai siswa, dan data pengajar terkait akan otomatis ikut diperbarui.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMapelModalOpen(false);
                    setIsEditMapelModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
                >
                  {isEditMapelModalOpen ? "Simpan Perubahan" : "Tambah Mata Pelajaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS MATA PELAJARAN ================= */}
      {isDeleteMapelModalOpen && targetMapel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Mata Pelajaran?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mata pelajaran ini akan dihapus dari master kurikulum sekolah.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {targetMapel.nama} ({targetMapel.kode})
              </p>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Kelompok Kategori:</span>
                <span className="font-semibold">{targetMapel.kategori}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Standar KKM:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {targetMapel.kkm}
                </span>
              </div>
            </div>

            {/* Warning if mapel is actively used */}
            {(() => {
              const activeCount = jadwalList.filter(
                (j) => j.mapel.trim().toLowerCase() === targetMapel.nama.trim().toLowerCase()
              ).length;
              if (activeCount > 0) {
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Peringatan KBM Aktif</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Mata pelajaran ini saat ini dipakai oleh <strong>{activeCount} sesi jadwal KBM</strong>. Jika dihapus dari kurikulum, jadwal KBM yang sudah ada tetap tercatat namun tidak akan muncul lagi di daftar pilihan baru.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteMapelModalOpen(false);
                  setTargetMapel(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMapel}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm"
              >
                Ya, Hapus Mapel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CETAK JADWAL PELAJARAN RESMI (SENIN S.D. JUMAT)                     */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:static print:p-0 print:bg-transparent print:overflow-visible">
          <div className="w-full max-w-6xl bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl relative my-6 print:my-0 print:p-0 print:max-w-none print:shadow-none print:rounded-none">
            {/* Top Toolbar (Excluded from print) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-6 no-print">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Printer className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pratinjau Cetak Jadwal Pelajaran (Senin s.d. Jumat)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tampilan cetak resmi menampilkan seluruh jadwal mata pelajaran hari Senin sampai Jumat secara otomatis.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Selector Kelas (Admin only) */}
                {user?.role === "admin" ? (
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-500 pl-2">Kelas:</span>
                    <select
                      value={printSelectedKelas}
                      onChange={(e) => setPrintSelectedKelas(e.target.value)}
                      className="text-xs font-bold bg-white text-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer shadow-xs"
                    >
                      <option value="Semua">Semua Kelas ({kelasList.length})</option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.nama}>
                          {k.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold">
                    Kelas Binaan: {teacherScope.assignedClass}
                  </div>
                )}

                {/* Format View Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPrintFormatMode("matrix")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      printFormatMode === "matrix"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Format Matriks 5 Kolom (Senin - Jumat)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Matriks 5 Hari</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormatMode("table")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      printFormatMode === "table"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Format Tabel Rincian (Senin - Jumat)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabel Rincian</span>
                  </button>
                </div>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-10 print:space-y-8">
              {classesForPrint.map((cls) => {
                return (
                  <div
                    key={cls.id || cls.nama}
                    className="print-class-page border-b-2 border-dashed border-slate-300 pb-8 last:border-b-0 last:pb-0 print:border-b-0 print:pb-0"
                    style={{ pageBreakAfter: classesForPrint.length > 1 ? "always" : "auto" }}
                  >
                    {/* Kop Surat Resmi */}
                    <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                      <div className="flex items-center justify-center gap-3 mb-1.5">
                        <div className="h-11 w-11 rounded-xl bg-indigo-700 flex items-center justify-center text-white font-bold shrink-0">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900 leading-tight">
                            {profile.namaSekolah || "SDI SMART SCHOOL"}
                          </h2>
                          <p className="text-[11px] text-slate-600 font-medium">
                            NPSN: {profile.npsn || "20211456"} • Status Akreditasi: {profile.akreditasi || "A (Unggul)"}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 max-w-xl mx-auto leading-normal">
                        {profile.alamat || "Jl. Pendidikan No. 45, Coblong, Kota Bandung"} • Telp: {profile.telepon || "(022) 7201234"} • Website: {profile.website || "www.sekolah.sch.id"}
                      </p>
                    </div>

                    {/* Judul Dokumen */}
                    <div className="text-center mb-4">
                      <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-900 underline underline-offset-4">
                        JADWAL KEGIATAN BELAJAR MENGAJAR (KBM) RESMI
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        TAHUN AJARAN {profile.tahunAjaranAktif || "2025/2026"} • SEMESTER {profile.semesterAktif?.toUpperCase() || "GANJIL"}
                      </p>
                    </div>

                    {/* Info Rombel / Kelas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 border border-slate-300 p-3 rounded-xl mb-4 text-slate-800">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-medium">Rombongan Belajar:</span>
                        <strong className="text-sm text-indigo-950 font-bold">{cls.nama}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-medium">Wali Kelas:</span>
                        <strong className="text-slate-900">{cls.waliKelasNama || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-medium">Hari Efektif KBM:</span>
                        <strong className="text-indigo-800 font-bold">Senin s.d. Jumat</strong>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-slate-500 block text-[10px] font-medium">Tanggal Cetak:</span>
                        <strong className="text-slate-900">
                          {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </strong>
                      </div>
                    </div>

                    {/* Content: Matrix 5 Hari (Senin - Jumat) */}
                    {printFormatMode === "matrix" ? (
                      <div className="grid grid-cols-5 border-2 border-slate-900 rounded-xl overflow-hidden divide-x-2 divide-slate-900 bg-white">
                        {KBM_DAYS.map((day) => {
                          const dayItems = getSchedulesForDay(cls.nama, day);
                          return (
                            <div key={day} className="flex flex-col min-h-[300px] bg-white">
                              {/* Header Hari */}
                              <div className="bg-slate-900 text-white text-center py-2 px-1 border-b-2 border-slate-900">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider">{day}</h4>
                                <span className="text-[10px] text-slate-300 font-medium">
                                  {dayItems.length} Pelajaran
                                </span>
                              </div>
                              {/* Daftar Pelajaran */}
                              <div className="p-2 space-y-2 flex-1 flex flex-col justify-start">
                                {dayItems.length === 0 ? (
                                  <div className="flex-1 flex items-center justify-center p-2 text-center text-slate-400 text-[10px] italic">
                                    - Tidak ada KBM -
                                  </div>
                                ) : (
                                  dayItems.map((item, idx) => (
                                    <div
                                      key={item.id || `${day}-${idx}`}
                                      className="p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-left shadow-2xs"
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-200">
                                        <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                                          Sesi {idx + 1}
                                        </span>
                                        {item.jamMulai && item.jamMulai !== "-" && item.jamSelesai && item.jamSelesai !== "-" ? (
                                          <span className="text-[9px] font-mono font-semibold text-slate-600">
                                            {item.jamMulai}-{item.jamSelesai}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-medium text-slate-500">
                                            Sesi KBM
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-bold text-slate-900 leading-tight">
                                        {item.mapel}
                                      </p>
                                      <p className="text-[10px] text-slate-700 mt-1 font-medium leading-snug">
                                        {item.guruNama}
                                      </p>
                                      {item.ruangan && (
                                        <p className="text-[9px] text-slate-500 mt-0.5">
                                          Ruang: {item.ruangan}
                                        </p>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Content: Tabel Rincian (Senin - Jumat) */
                      <div className="overflow-hidden border-2 border-slate-900 rounded-xl bg-white">
                        <table className="w-full border-collapse text-xs text-slate-900">
                          <thead>
                            <tr className="bg-slate-900 text-white">
                              <th className="border-r border-slate-700 px-3 py-2 text-center w-24 uppercase font-bold">Hari</th>
                              <th className="border-r border-slate-700 px-2 py-2 text-center w-14 uppercase font-bold">Sesi</th>
                              <th className="border-r border-slate-700 px-3 py-2 text-center w-28 uppercase font-bold">Alokasi</th>
                              <th className="border-r border-slate-700 px-4 py-2 text-left uppercase font-bold">Mata Pelajaran</th>
                              <th className="border-r border-slate-700 px-4 py-2 text-left uppercase font-bold">Guru Pengajar</th>
                              <th className="px-3 py-2 text-center w-24 uppercase font-bold">Ruangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300">
                            {KBM_DAYS.map((day) => {
                              const dayItems = getSchedulesForDay(cls.nama, day);
                              if (dayItems.length === 0) {
                                return (
                                  <tr key={day} className="border-b border-slate-300 bg-slate-50/50">
                                    <td className="border-r border-slate-300 px-3 py-2 font-bold text-center bg-slate-100 text-slate-800">
                                      {day}
                                    </td>
                                    <td colSpan={5} className="px-4 py-2 text-center italic text-slate-400">
                                      - Tidak ada KBM terjadwal pada hari ini -
                                    </td>
                                  </tr>
                                );
                              }

                              return dayItems.map((item, idx) => (
                                <tr key={item.id || `${day}-${idx}`} className="border-b border-slate-200 hover:bg-slate-50">
                                  {idx === 0 && (
                                    <td
                                      rowSpan={dayItems.length}
                                      className="border-r-2 border-slate-400 px-3 py-2 font-extrabold text-center bg-slate-100 text-slate-900 align-middle text-sm"
                                    >
                                      {day}
                                    </td>
                                  )}
                                  <td className="border-r border-slate-300 px-2 py-2 text-center font-bold bg-slate-50/70">
                                    {idx + 1}
                                  </td>
                                  <td className="border-r border-slate-300 px-3 py-2 text-center font-mono text-[11px] text-slate-600">
                                    {item.jamMulai && item.jamMulai !== "-" && item.jamSelesai && item.jamSelesai !== "-"
                                      ? `${item.jamMulai} - ${item.jamSelesai}`
                                      : "Sesi Belajar"}
                                  </td>
                                  <td className="border-r border-slate-300 px-4 py-2 font-bold text-slate-900">
                                    {item.mapel}
                                  </td>
                                  <td className="border-r border-slate-300 px-4 py-2 text-slate-800 font-medium">
                                    {item.guruNama}
                                  </td>
                                  <td className="px-3 py-2 text-center text-slate-600">
                                    {item.ruangan || "-"}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pengesahan Tanda Tangan */}
                    <div className="mt-8 pt-4 flex justify-between items-start text-xs text-slate-900">
                      <div className="text-center w-56">
                        <p className="text-slate-600">Mengetahui,</p>
                        <p className="font-bold text-slate-800 mt-0.5">Kepala Sekolah</p>
                        <div className="h-16" />
                        <p className="font-extrabold underline text-slate-900">
                          {profile.kepalaSekolah || "H. Ahmad Dahlan, M.Pd."}
                        </p>
                        <p className="text-[10px] text-slate-500">NIP. 19750812 200003 1 002</p>
                      </div>

                      <div className="text-center w-56">
                        <p className="text-slate-600">
                          Kota Bandung, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="font-bold text-slate-800 mt-0.5">Wali Kelas {cls.nama}</p>
                        <div className="h-16" />
                        <p className="font-extrabold underline text-slate-900">
                          {cls.waliKelasNama || "-"}
                        </p>
                        <p className="text-[10px] text-slate-500">NIP. - / NUPTK Terdaftar</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FALLBACK PRINT CONTAINER (Jika pengguna menekan Ctrl+P langsung di layar)   */}
      {/* ========================================================================= */}
      {!isPrintModalOpen && (
        <div className="print-only hidden p-4">
          {classesForPrint.map((cls) => (
            <div
              key={cls.id || cls.nama}
              className="mb-8 pb-6 border-b-2 border-dashed border-slate-300 last:border-b-0 print:border-b-0"
              style={{ pageBreakAfter: classesForPrint.length > 1 ? "always" : "auto" }}
            >
              {/* Kop Surat Resmi */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <h2 className="text-lg font-extrabold uppercase text-slate-900">
                  {profile.namaSekolah || "SDI SMART SCHOOL"}
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  NPSN: {profile.npsn || "20211456"} • Status Akreditasi: {profile.akreditasi || "A (Unggul)"} • {profile.alamat}
                </p>
              </div>

              {/* Title & Info */}
              <div className="text-center mb-4">
                <h3 className="text-base font-extrabold uppercase underline underline-offset-4 text-slate-900">
                  JADWAL PELAJARAN KBM RESMI (SENIN S.D. JUMAT)
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Kelas: {cls.nama} • Wali Kelas: {cls.waliKelasNama || "-"} • Semester {profile.semesterAktif || "Ganjil"} {profile.tahunAjaranAktif || "2025/2026"}
                </p>
              </div>

              {/* Matriks 5 Hari: Senin sampai Jumat */}
              <div className="grid grid-cols-5 border-2 border-slate-900 rounded-xl overflow-hidden divide-x-2 divide-slate-900 bg-white">
                {KBM_DAYS.map((day) => {
                  const dayItems = getSchedulesForDay(cls.nama, day);
                  return (
                    <div key={day} className="flex flex-col min-h-[280px]">
                      <div className="bg-slate-900 text-white text-center py-2 px-1 border-b-2 border-slate-900">
                        <h4 className="font-extrabold text-xs uppercase">{day}</h4>
                        <span className="text-[9px] text-slate-300 font-medium">{dayItems.length} Pelajaran</span>
                      </div>
                      <div className="p-2 space-y-2 flex-1">
                        {dayItems.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-center p-2 text-slate-400 text-[10px] italic">
                            - Tidak ada KBM -
                          </div>
                        ) : (
                          dayItems.map((item, idx) => (
                            <div key={item.id || `${day}-${idx}`} className="p-1.5 rounded bg-slate-50 border border-slate-300 text-left">
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 mb-0.5">
                                <span>Sesi {idx + 1}</span>
                                {item.jamMulai && item.jamMulai !== "-" && item.jamSelesai && item.jamSelesai !== "-" && (
                                  <span>{item.jamMulai}-{item.jamSelesai}</span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">{item.mapel}</p>
                              <p className="text-[10px] text-slate-700 mt-0.5">{item.guruNama}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tanda Tangan */}
              <div className="mt-8 pt-4 flex justify-between items-start text-xs text-slate-900">
                <div className="text-center w-52">
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold">Kepala Sekolah</p>
                  <div className="h-14" />
                  <p className="font-extrabold underline">{profile.kepalaSekolah || "H. Ahmad Dahlan, M.Pd."}</p>
                  <p className="text-[10px] text-slate-500">NIP. 19750812 200003 1 002</p>
                </div>
                <div className="text-center w-52">
                  <p className="text-slate-600">
                    Kota Bandung, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="font-bold">Wali Kelas {cls.nama}</p>
                  <div className="h-14" />
                  <p className="font-extrabold underline">{cls.waliKelasNama || "-"}</p>
                  <p className="text-[10px] text-slate-500">NIP. - / NUPTK Terdaftar</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
