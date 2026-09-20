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
  CheckSquare,
  Zap,
  RotateCcw,
  CheckCheck,
  Printer,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

export default function MutabaahPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const {
    profile,
    mutabaahList,
    addOrUpdateMutabaahRecord,
    batchAddOrUpdateMutabaahRecords,
    verifyMutabaahRecord,
    siswaList,
    kelasList,
  } = useSchoolData();

  // Active view tab: batch (default for fast simultaneous checklist) | list | input | evaluasi | laporan
  const [activeTab, setActiveTab] = useState<"batch" | "list" | "input" | "evaluasi" | "laporan">("batch");
  const [isGeneratingJpg, setIsGeneratingJpg] = useState<boolean>(false);

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

  const isShalatYes = (val?: string) => {
    if (!val) return false;
    return val === "Ya" || val.includes("Berjamaah") || val.includes("Tepat Waktu") || val.includes("Masbuq");
  };

  const [shalat, setShalat] = useState<MutabaahShalatWajib>({
    subuh: "Tidak",
    dzuhur: "Tidak",
    ashar: "Tidak",
    maghrib: "Tidak",
    isya: "Tidak",
  });

  const [sunnah, setSunnah] = useState<MutabaahIbadahSunnah>({
    shalatDhuha: false,
    rawatib: false,
    tilawahQuran: false,
    jumlahHalamanTilawah: 1,
  });

  const [akhlak, setAkhlak] = useState<MutabaahAkhlakKarakter>({
    birrulWalidain: false,
    belajarMandiri: false,
  });

  const [catatanOrtu, setCatatanOrtu] = useState<string>("");
  const [catatanGuruForm, setCatatanGuruForm] = useState<string>("");

  // Sync form when selected student or date changes
  useEffect(() => {
    if (currentRecord) {
      setShalat({
        subuh: isShalatYes(currentRecord.shalatWajib?.subuh) ? "Ya" : "Tidak",
        dzuhur: isShalatYes(currentRecord.shalatWajib?.dzuhur) ? "Ya" : "Tidak",
        ashar: isShalatYes(currentRecord.shalatWajib?.ashar) ? "Ya" : "Tidak",
        maghrib: isShalatYes(currentRecord.shalatWajib?.maghrib) ? "Ya" : "Tidak",
        isya: isShalatYes(currentRecord.shalatWajib?.isya) ? "Ya" : "Tidak",
      });
      setSunnah(currentRecord.ibadahSunnah || {
        shalatDhuha: false,
        rawatib: false,
        tilawahQuran: false,
        jumlahHalamanTilawah: 1,
      });
      setAkhlak(currentRecord.akhlakKarakter || {
        birrulWalidain: false,
        belajarMandiri: false,
      });
      setCatatanOrtu(currentRecord.catatanOrangTua || "");
      setCatatanGuruForm(currentRecord.catatanGuru || "");
    } else {
      setShalat({
        subuh: "Tidak",
        dzuhur: "Tidak",
        ashar: "Tidak",
        maghrib: "Tidak",
        isya: "Tidak",
      });
      setSunnah({
        shalatDhuha: false,
        rawatib: false,
        tilawahQuran: false,
        jumlahHalamanTilawah: 1,
      });
      setAkhlak({
        birrulWalidain: false,
        belajarMandiri: false,
      });
      setCatatanOrtu("");
      setCatatanGuruForm("");
    }
  }, [currentRecord, selectedSiswaId, selectedDate]);

  // Score calculation: 5 shalat (10 poin/shalat) + 3 sunnah (10 poin/amalan) + 2 akhlak (10 poin/akhlak) = 100 poin
  const calculateScoreFromState = (
    sShalat: MutabaahShalatWajib,
    sSunnah: MutabaahIbadahSunnah,
    sAkhlak: MutabaahAkhlakKarakter
  ) => {
    let score = 0;
    // 1. Shalat Fardhu 5 Waktu (10 poin tiap shalat)
    if (isShalatYes(sShalat.subuh)) score += 10;
    if (isShalatYes(sShalat.dzuhur)) score += 10;
    if (isShalatYes(sShalat.ashar)) score += 10;
    if (isShalatYes(sShalat.maghrib)) score += 10;
    if (isShalatYes(sShalat.isya)) score += 10;

    // 2. Amalan Sunnah Harian (10 poin tiap amalan)
    if (sSunnah.shalatDhuha) score += 10;
    if (sSunnah.rawatib) score += 10;
    if (sSunnah.tilawahQuran) score += 10;

    // 3. Akhlak & Birrul Walidain (10 poin tiap pembiasaan)
    if (sAkhlak.birrulWalidain) score += 10;
    if (sAkhlak.belajarMandiri) score += 10;

    return Math.min(100, score);
  };

  const calculatedScore = useMemo(() => {
    return calculateScoreFromState(shalat, sunnah, akhlak);
  }, [shalat, sunnah, akhlak]);

  // =========================================================================
  // STATE & LOGIC UNTUK INPUT CHECKLIST BERSAMAAN (BATCH SIMULTANEOUS INPUT)
  // =========================================================================
  interface StudentDraftItem {
    subuh: boolean;
    dzuhur: boolean;
    ashar: boolean;
    maghrib: boolean;
    isya: boolean;
    shalatDhuha: boolean;
    rawatib: boolean;
    tilawahQuran: boolean;
    jumlahHalamanTilawah: number;
    birrulWalidain: boolean;
    belajarMandiri: boolean;
  }

  const [batchDrafts, setBatchDrafts] = useState<Record<string, StudentDraftItem>>({});
  const [isBatchModified, setIsBatchModified] = useState<boolean>(false);

  // Sync batch drafts whenever class students, date, or mutabaah records change
  useEffect(() => {
    const drafts: Record<string, StudentDraftItem> = {};
    classStudents.forEach((student) => {
      const rec = mutabaahList.find(
        (m) => m.siswaId === student.id && m.tanggal === selectedDate
      );
      if (rec) {
        drafts[student.id] = {
          subuh: isShalatYes(rec.shalatWajib?.subuh),
          dzuhur: isShalatYes(rec.shalatWajib?.dzuhur),
          ashar: isShalatYes(rec.shalatWajib?.ashar),
          maghrib: isShalatYes(rec.shalatWajib?.maghrib),
          isya: isShalatYes(rec.shalatWajib?.isya),
          shalatDhuha: !!rec.ibadahSunnah?.shalatDhuha,
          rawatib: !!rec.ibadahSunnah?.rawatib,
          tilawahQuran: !!rec.ibadahSunnah?.tilawahQuran,
          jumlahHalamanTilawah: rec.ibadahSunnah?.jumlahHalamanTilawah || 1,
          birrulWalidain: !!rec.akhlakKarakter?.birrulWalidain,
          belajarMandiri: !!rec.akhlakKarakter?.belajarMandiri,
        };
      } else {
        // Belum mengisi: kondisi default tidak dalam keadaan tercentang
        drafts[student.id] = {
          subuh: false,
          dzuhur: false,
          ashar: false,
          maghrib: false,
          isya: false,
          shalatDhuha: false,
          rawatib: false,
          tilawahQuran: false,
          jumlahHalamanTilawah: 1,
          birrulWalidain: false,
          belajarMandiri: false,
        };
      }
    });
    setBatchDrafts(drafts);
    setIsBatchModified(false);
  }, [classStudents, selectedDate, mutabaahList]);

  const getDraftScore = (draft?: StudentDraftItem): number => {
    if (!draft) return 0;
    let s = 0;
    if (draft.subuh) s += 10;
    if (draft.dzuhur) s += 10;
    if (draft.ashar) s += 10;
    if (draft.maghrib) s += 10;
    if (draft.isya) s += 10;
    if (draft.shalatDhuha) s += 10;
    if (draft.rawatib) s += 10;
    if (draft.tilawahQuran) s += 10;
    if (draft.birrulWalidain) s += 10;
    if (draft.belajarMandiri) s += 10;
    return s;
  };

  const handleToggleDraft = (siswaId: string, field: keyof StudentDraftItem) => {
    setBatchDrafts((prev) => {
      const current = prev[siswaId];
      if (!current) return prev;
      return {
        ...prev,
        [siswaId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
    setIsBatchModified(true);
  };

  const handleToggleColumnAll = (field: keyof StudentDraftItem) => {
    setBatchDrafts((prev) => {
      const updated = { ...prev };
      const allTrue = displayedStudents.every((s) => prev[s.id] && prev[s.id][field]);
      const targetVal = !allTrue;

      displayedStudents.forEach((s) => {
        if (updated[s.id]) {
          updated[s.id] = {
            ...updated[s.id],
            [field]: targetVal,
          };
        }
      });
      return updated;
    });
    setIsBatchModified(true);
  };

  const handleSetStudentAll = (siswaId: string, val: boolean) => {
    setBatchDrafts((prev) => {
      const updated = { ...prev };
      if (updated[siswaId]) {
        updated[siswaId] = {
          subuh: val,
          dzuhur: val,
          ashar: val,
          maghrib: val,
          isya: val,
          shalatDhuha: val,
          rawatib: val,
          tilawahQuran: val,
          jumlahHalamanTilawah: 1,
          birrulWalidain: val,
          belajarMandiri: val,
        };
      }
      return updated;
    });
    setIsBatchModified(true);
  };

  const handleSetAllPerfect = () => {
    setBatchDrafts((prev) => {
      const updated = { ...prev };
      displayedStudents.forEach((s) => {
        updated[s.id] = {
          subuh: true,
          dzuhur: true,
          ashar: true,
          maghrib: true,
          isya: true,
          shalatDhuha: true,
          rawatib: true,
          tilawahQuran: true,
          jumlahHalamanTilawah: 1,
          birrulWalidain: true,
          belajarMandiri: true,
        };
      });
      return updated;
    });
    setIsBatchModified(true);
    showNotification("Semua santri berhasil ditandai 100 Poin (Mumtaz)!");
  };

  const handleSetAllFardhuOnly = () => {
    setBatchDrafts((prev) => {
      const updated = { ...prev };
      displayedStudents.forEach((s) => {
        if (updated[s.id]) {
          updated[s.id] = {
            ...updated[s.id],
            subuh: true,
            dzuhur: true,
            ashar: true,
            maghrib: true,
            isya: true,
          };
        }
      });
      return updated;
    });
    setIsBatchModified(true);
    showNotification("Shalat fardhu 5 waktu seluruh santri berhasil dicentang Ya!");
  };

  const handleResetAllDrafts = () => {
    setBatchDrafts((prev) => {
      const updated = { ...prev };
      displayedStudents.forEach((s) => {
        updated[s.id] = {
          subuh: false,
          dzuhur: false,
          ashar: false,
          maghrib: false,
          isya: false,
          shalatDhuha: false,
          rawatib: false,
          tilawahQuran: false,
          jumlahHalamanTilawah: 1,
          birrulWalidain: false,
          belajarMandiri: false,
        };
      });
      return updated;
    });
    setIsBatchModified(true);
    showNotification("Semua centang berhasil dikosongkan.");
  };

  const handleSaveAllBatch = () => {
    const recordsToSave: Array<Omit<MutabaahRecord, "id" | "createdAt">> = [];

    displayedStudents.forEach((student) => {
      const draft = batchDrafts[student.id];
      if (!draft) return;

      const score = getDraftScore(draft);
      const existingRec = getStudentRecord(student.id);

      recordsToSave.push({
        siswaId: student.id,
        siswaNama: student.nama,
        nisn: student.nisn || "",
        kelas: student.kelas,
        tanggal: selectedDate,
        shalatWajib: {
          subuh: draft.subuh ? "Ya" : "Tidak",
          dzuhur: draft.dzuhur ? "Ya" : "Tidak",
          ashar: draft.ashar ? "Ya" : "Tidak",
          maghrib: draft.maghrib ? "Ya" : "Tidak",
          isya: draft.isya ? "Ya" : "Tidak",
        },
        ibadahSunnah: {
          shalatDhuha: draft.shalatDhuha,
          rawatib: draft.rawatib,
          tilawahQuran: draft.tilawahQuran,
          jumlahHalamanTilawah: draft.jumlahHalamanTilawah || 1,
        },
        akhlakKarakter: {
          birrulWalidain: draft.birrulWalidain,
          belajarMandiri: draft.belajarMandiri,
        },
        catatanOrangTua: existingRec?.catatanOrangTua,
        skorKebaikan: score,
        statusVerifikasi:
          existingRec?.statusVerifikasi ||
          (score >= 90 ? "Diberi Bintang Kebaikan" : "Terverifikasi Guru"),
        catatanGuru: existingRec?.catatanGuru || "Diinput serentak oleh guru kelas",
        verifiedByGuru: user?.name || "Ustadz Pembina",
      });
    });

    batchAddOrUpdateMutabaahRecords(recordsToSave);
    setIsBatchModified(false);
    showNotification(
      `Alhamdulillah! Mutaba'ah ${recordsToSave.length} santri (${selectedKelas}) berhasil disimpan sekaligus.`
    );
  };

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

  // Export Report to High-Resolution JPG using HTML5 Canvas
  const handleDownloadJPG = () => {
    setIsGeneratingJpg(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("Canvas tidak didukung di peramban ini.");
        setIsGeneratingJpg(false);
        return;
      }

      const students = displayedStudents;
      const rowHeight = 36;
      const headerTopHeight = 280;
      const tableHeaderHeight = 60;
      const tableRowsHeight = Math.max(1, students.length) * rowHeight;
      const footerHeight = 240;

      const width = 1400;
      const height = Math.max(950, headerTopHeight + tableHeaderHeight + tableRowsHeight + footerHeight);

      canvas.width = width;
      canvas.height = height;

      // 1. Background Putih Bersih
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // 2. Kop Surat Sekolah Resmi
      ctx.textAlign = "center";
      ctx.fillStyle = "#064e3b";
      ctx.font = "bold 26px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText((profile.namaSekolah || "SDI SMART SCHOOL").toUpperCase(), width / 2, 50);

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText(
        `NPSN: ${profile.npsn || "-"}  |  AKREDITASI: ${profile.akreditasi || "A"}  |  TAHUN AJARAN: ${profile.tahunAjaranAktif || "2025/2026"} (SEMESTER ${profile.semesterAktif?.toUpperCase() || "GANJIL"})`,
        width / 2,
        78
      );

      ctx.fillStyle = "#64748b";
      ctx.font = "normal 12px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText(
        `${profile.alamat || ""}  |  Telp: ${profile.telepon || "-"}  |  Website: ${profile.website || "-"}`,
        width / 2,
        100
      );

      // Garis Ganda Pemisah Kop Surat
      ctx.strokeStyle = "#064e3b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, 120);
      ctx.lineTo(width - 50, 120);
      ctx.stroke();

      ctx.strokeStyle = "#064e3b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 125);
      ctx.lineTo(width - 50, 125);
      ctx.stroke();

      // 3. Judul Dokumen Laporan
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText("LAPORAN HARIAN MUTABA'AH IBADAH YAUMIYAH SANTRI", width / 2, 160);

      // Format Tanggal Indonesia
      const tanggalFormatted = new Date(selectedDate).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      ctx.fillStyle = "#475569";
      ctx.font = "bold 13px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText(
        `Hari / Tanggal: ${tanggalFormatted}   •   Kelas: ${selectedKelas === "Semua" ? "Semua Kelas" : selectedKelas}   •   Total Santri: ${students.length} Santri`,
        width / 2,
        185
      );

      // 4. Summary Box KPI Rombel
      const statBoxY = 210;
      const statBoxWidth = width - 100;
      ctx.fillStyle = "#f0fdf4";
      ctx.strokeStyle = "#bbf7d0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(50, statBoxY, statBoxWidth, 48, 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#166534";
      ctx.font = "bold 13px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText(`• Santri Tercatat: ${metrics.sudahCount} / ${metrics.total} (${metrics.completionRate}%)`, 80, statBoxY + 30);
      ctx.fillText(`• Rata-rata Skor Ibadah: ${metrics.avgScore} / 100 Poin`, 500, statBoxY + 30);
      ctx.fillText(`• Predikat Mumtaz (⭐ >=90): ${metrics.bintangCount} Santri`, 920, statBoxY + 30);

      // 5. Tabel Komprehensif Seluruh Santri
      const startX = 50;
      const startY = 280;
      const tableWidth = width - 100; // 1300

      const shalatStartX = startX + 45 + 110 + 235 + 65; // 505
      const sunnahStartX = shalatStartX + 55 * 5; // 780
      const akhlakStartX = sunnahStartX + 65 * 3; // 975
      const skorX = akhlakStartX + 90 * 2; // 1155
      const predikatX = skorX + 65; // 1220

      // Header Baris 1
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(startX, startY, tableWidth, 30);
      // Header Baris 2
      ctx.fillStyle = "#0f766e";
      ctx.fillRect(startX, startY + 30, tableWidth, 30);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 11px 'Plus Jakarta Sans', Arial, sans-serif";

      // Teks Header Baris 1
      ctx.fillText("NO", startX + 22, startY + 38);
      ctx.fillText("NISN", startX + 45 + 55, startY + 38);
      ctx.fillText("NAMA SANTRI", startX + 45 + 110 + 117, startY + 38);
      ctx.fillText("KELAS", startX + 45 + 110 + 235 + 32, startY + 38);
      ctx.fillText("SHALAT FARDHU 5 WAKTU", shalatStartX + (55 * 5) / 2, startY + 20);
      ctx.fillText("AMALAN SUNNAH", sunnahStartX + (65 * 3) / 2, startY + 20);
      ctx.fillText("AKHLAK & ADAB", akhlakStartX + (90 * 2) / 2, startY + 20);
      ctx.fillText("SKOR", skorX + 32, startY + 38);
      ctx.fillText("PREDIKAT", predikatX + 40, startY + 38);

      // Teks Header Baris 2 (Subkolom)
      ctx.font = "bold 10px 'Plus Jakarta Sans', Arial, sans-serif";
      const subCols = [
        { label: "Subuh", x: shalatStartX + 27 },
        { label: "Dzuhur", x: shalatStartX + 55 + 27 },
        { label: "Ashar", x: shalatStartX + 110 + 27 },
        { label: "Maghrib", x: shalatStartX + 165 + 27 },
        { label: "Isya", x: shalatStartX + 220 + 27 },
        { label: "Dhuha", x: sunnahStartX + 32 },
        { label: "Rawatib", x: sunnahStartX + 65 + 32 },
        { label: "Tilawah", x: sunnahStartX + 130 + 32 },
        { label: "Bantu Ortu", x: akhlakStartX + 45 },
        { label: "Belajar Mandiri", x: akhlakStartX + 90 + 45 },
      ];
      subCols.forEach((sc) => {
        ctx.fillText(sc.label, sc.x, startY + 49);
      });

      // Garis vertikal header
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      const vLines = [
        startX + 45,
        startX + 45 + 110,
        startX + 45 + 110 + 235,
        shalatStartX,
        shalatStartX + 55,
        shalatStartX + 110,
        shalatStartX + 165,
        shalatStartX + 220,
        sunnahStartX,
        sunnahStartX + 65,
        sunnahStartX + 130,
        akhlakStartX,
        akhlakStartX + 90,
        skorX,
        predikatX,
      ];
      vLines.forEach((vx) => {
        ctx.beginPath();
        ctx.moveTo(vx, startY);
        ctx.lineTo(vx, startY + 60);
        ctx.stroke();
      });

      // Data Siswa
      let curY = startY + 60;
      students.forEach((student, idx) => {
        const rec = getStudentRecord(student.id);
        const draft = batchDrafts[student.id];

        const isSubuh = draft ? draft.subuh : isShalatYes(rec?.shalatWajib?.subuh);
        const isDzuhur = draft ? draft.dzuhur : isShalatYes(rec?.shalatWajib?.dzuhur);
        const isAshar = draft ? draft.ashar : isShalatYes(rec?.shalatWajib?.ashar);
        const isMaghrib = draft ? draft.maghrib : isShalatYes(rec?.shalatWajib?.maghrib);
        const isIsya = draft ? draft.isya : isShalatYes(rec?.shalatWajib?.isya);

        const isDhuha = draft ? draft.shalatDhuha : !!rec?.ibadahSunnah?.shalatDhuha;
        const isRawatib = draft ? draft.rawatib : !!rec?.ibadahSunnah?.rawatib;
        const isTilawah = draft ? draft.tilawahQuran : !!rec?.ibadahSunnah?.tilawahQuran;

        const isBantu = draft ? draft.birrulWalidain : !!rec?.akhlakKarakter?.birrulWalidain;
        const isMandiri = draft ? draft.belajarMandiri : !!rec?.akhlakKarakter?.belajarMandiri;

        const score = draft ? getDraftScore(draft) : rec ? rec.skorKebaikan : 0;
        let predikat = "Belum Terisi";
        if (score >= 90) predikat = "Mumtaz ⭐";
        else if (score >= 75) predikat = "Jayyid Jiddan";
        else if (score >= 60) predikat = "Jayyid";
        else if (score > 0) predikat = "Maqbul";

        // Background Zebra
        ctx.fillStyle = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        ctx.fillRect(startX, curY, tableWidth, rowHeight);

        // Garis Pembatas Baris
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, curY + rowHeight);
        ctx.lineTo(startX + tableWidth, curY + rowHeight);
        ctx.stroke();

        // 1. No
        ctx.textAlign = "center";
        ctx.font = "normal 11px 'Plus Jakarta Sans', Arial, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(String(idx + 1), startX + 22, curY + 22);

        // 2. NISN
        ctx.fillStyle = "#475569";
        ctx.font = "normal 10px monospace";
        ctx.fillText(student.nisn || "-", startX + 45 + 55, curY + 22);

        // 3. Nama
        ctx.textAlign = "left";
        ctx.font = "bold 11px 'Plus Jakarta Sans', Arial, sans-serif";
        ctx.fillStyle = "#0f172a";
        const truncatedName = student.nama.length > 27 ? student.nama.substring(0, 25) + "..." : student.nama;
        ctx.fillText(truncatedName, startX + 45 + 110 + 10, curY + 22);

        // 4. Kelas
        ctx.textAlign = "center";
        ctx.font = "normal 10px 'Plus Jakarta Sans', Arial, sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText(student.kelas || "-", startX + 45 + 110 + 235 + 32, curY + 22);

        // Shalat, Sunnah, Akhlak Checkmarks
        const drawCheck = (val: boolean, posX: number) => {
          if (val) {
            ctx.fillStyle = "#059669";
            ctx.font = "bold 13px Arial, sans-serif";
            ctx.fillText("✓", posX, curY + 22);
          } else {
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "normal 12px Arial, sans-serif";
            ctx.fillText("-", posX, curY + 22);
          }
        };

        drawCheck(isSubuh, shalatStartX + 27);
        drawCheck(isDzuhur, shalatStartX + 55 + 27);
        drawCheck(isAshar, shalatStartX + 110 + 27);
        drawCheck(isMaghrib, shalatStartX + 165 + 27);
        drawCheck(isIsya, shalatStartX + 220 + 27);

        drawCheck(isDhuha, sunnahStartX + 32);
        drawCheck(isRawatib, sunnahStartX + 65 + 32);
        drawCheck(isTilawah, sunnahStartX + 130 + 32);

        drawCheck(isBantu, akhlakStartX + 45);
        drawCheck(isMandiri, akhlakStartX + 90 + 45);

        // Skor
        ctx.textAlign = "center";
        ctx.font = "bold 11px 'Plus Jakarta Sans', Arial, sans-serif";
        if (score >= 90) ctx.fillStyle = "#047857";
        else if (score >= 70) ctx.fillStyle = "#0284c7";
        else if (score >= 40) ctx.fillStyle = "#d97706";
        else ctx.fillStyle = "#94a3b8";
        ctx.fillText(String(score), skorX + 32, curY + 22);

        // Predikat
        ctx.font = "bold 10px 'Plus Jakarta Sans', Arial, sans-serif";
        if (score >= 90) ctx.fillStyle = "#065f46";
        else if (score >= 70) ctx.fillStyle = "#0369a1";
        else if (score > 0) ctx.fillStyle = "#b45309";
        else ctx.fillStyle = "#94a3b8";
        ctx.fillText(predikat, predikatX + 40, curY + 22);

        curY += rowHeight;
      });

      // Garis Luar Tabel
      ctx.strokeStyle = "#064e3b";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX, startY, tableWidth, 60 + tableRowsHeight);

      // 6. Tanda Tangan & Pengesahan
      const ttdY = curY + 45;
      ctx.textAlign = "center";
      ctx.fillStyle = "#334155";
      ctx.font = "normal 12px 'Plus Jakarta Sans', Arial, sans-serif";

      const kotaTitimangsa = `Jakarta, ${new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`;

      // TTD Kiri: Kepala Sekolah
      ctx.fillText("Mengetahui,", 250, ttdY);
      ctx.font = "bold 12px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText("Kepala Sekolah", 250, ttdY + 18);

      ctx.font = "bold 12px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(profile.kepalaSekolah || "Dr. H. Muhammad Rasyid, M.Pd.", 250, ttdY + 95);
      ctx.font = "normal 11px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("NIP. 197204151998031002", 250, ttdY + 112);

      // TTD Kanan: Wali Kelas / Pembina
      ctx.font = "normal 12px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillStyle = "#334155";
      ctx.fillText(kotaTitimangsa, width - 250, ttdY);
      ctx.font = "bold 12px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillText(`Guru Pembina / Wali Kelas ${selectedKelas === "Semua" ? "" : selectedKelas}`, width - 250, ttdY + 18);

      const pembinaName = teacherScope.teacherName || user?.name || "Ustadz Pembina Mutaba'ah";
      ctx.font = "bold 12px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(pembinaName, width - 250, ttdY + 95);
      ctx.font = "normal 11px 'Plus Jakarta Sans', Arial, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Guru Pengampu PAI & Budi Pekerti", width - 250, ttdY + 112);

      // Trigger Download JPG
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      const cleanKelas = (selectedKelas || "Semua").replace(/[^a-zA-Z0-9]/g, "_");
      link.download = `Laporan_Harian_Mutabaah_${cleanKelas}_${selectedDate}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsGeneratingJpg(false);
      showNotification("Alhamdulillah! Laporan harian format JPG berhasil diunduh.");
    } catch (err) {
      console.error("Gagal export JPG:", err);
      alert("Terjadi kendala saat generate gambar JPG.");
      setIsGeneratingJpg(false);
    }
  };

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

      {/* Navigation Tabs & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 w-fit text-xs font-semibold">
          <button
            onClick={() => setActiveTab("batch")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "batch"
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Checklist Cepat Rombel (Input Bersamaan)</span>
            {isBatchModified && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "list"
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rekap & Daftar Santri ({classStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("input")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "input"
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Formulir Per Santri</span>
          </button>

          <button
            onClick={() => setActiveTab("evaluasi")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "evaluasi"
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Grafik & Konsistensi</span>
          </button>

          <button
            onClick={() => setActiveTab("laporan")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "laporan"
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan Harian (PDF / JPG)</span>
          </button>
        </div>

        {/* Quick Trigger Button to open Laporan View */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("laporan")}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-bold text-xs shadow-md shadow-emerald-900/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh Laporan Harian</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB BATCH: CHECKLIST CEPAT ROMBEL (INPUT BERSAMAAN DENGAN SATU KLIK)      */}
      {/* ========================================================================= */}
      {activeTab === "batch" && (
        <div className="space-y-6">
          {/* Top Info & Batch Toolbar */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-1 border border-emerald-300 dark:border-emerald-700">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Mode Checklist Cepat Serentak</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Input Mutaba'ah Rombel Sekaligus</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {selectedKelas === "Semua" ? "Semua Kelas" : selectedKelas} ({displayedStudents.length} Santri)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Guru cukup klik kotak centang (hijau = Ya, abu-abu = Tidak). Gunakan tombol <b>"Semua ✓"</b> pada header kolom untuk mencentang satu kelas secara serentak dalam 1 detik.
                </p>
              </div>

              {/* Save All Button */}
              <div className="flex items-center gap-3 self-end lg:self-center">
                <button
                  type="button"
                  onClick={handleSaveAllBatch}
                  className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/25 transition-all flex items-center gap-2.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Semua ({displayedStudents.length} Santri)</span>
                </button>
              </div>
            </div>

            {/* Quick Action Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Aksi Cepat:
              </span>

              <button
                type="button"
                onClick={handleSetAllPerfect}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Tandai semua santri sempurna (100 Poin)"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Semua 100 Poin (Mumtaz)</span>
              </button>

              <button
                type="button"
                onClick={handleSetAllFardhuOnly}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Centang Ya untuk 5 Shalat Fardhu seluruh santri"
              >
                <Sun className="w-3.5 h-3.5 text-blue-600" />
                <span>Semua Shalat 5 Waktu Ya</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleColumnAll("dzuhur")}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Toggle Dzuhur untuk seluruh santri"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Semua Dzuhur Ya</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleColumnAll("shalatDhuha")}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Toggle Dhuha untuk seluruh santri"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Semua Dhuha Ya</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleColumnAll("tilawahQuran")}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Toggle Tilawah untuk seluruh santri"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Semua Tilawah Ya</span>
              </button>

              <button
                type="button"
                onClick={handleResetAllDrafts}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto"
                title="Kosongkan semua centang"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            </div>
          </div>

          {/* Batch Matrix Checklist Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {/* Category Group Header */}
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                    <th className="py-2.5 px-3 w-10 text-center" rowSpan={2}>No</th>
                    <th className="py-2.5 px-4 min-w-[190px]" rowSpan={2}>Nama Santri</th>
                    <th className="py-2 px-2 text-center bg-amber-50/70 dark:bg-amber-950/30 border-l border-r border-slate-200 dark:border-slate-700" colSpan={5}>
                      <span className="flex items-center justify-center gap-1 text-amber-900 dark:text-amber-200 font-black">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        1. Shalat Fardhu 5 Waktu (10 Poin Tiap Shalat)
                      </span>
                    </th>
                    <th className="py-2 px-2 text-center bg-emerald-50/70 dark:bg-emerald-950/30 border-r border-slate-200 dark:border-slate-700" colSpan={3}>
                      <span className="flex items-center justify-center gap-1 text-emerald-900 dark:text-emerald-200 font-black">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        2. Amalan Sunnah (10 Poin)
                      </span>
                    </th>
                    <th className="py-2 px-2 text-center bg-rose-50/70 dark:bg-rose-950/30 border-r border-slate-200 dark:border-slate-700" colSpan={2}>
                      <span className="flex items-center justify-center gap-1 text-rose-900 dark:text-rose-200 font-black">
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                        3. Akhlak & Birrul Walidain (10 Poin)
                      </span>
                    </th>
                    <th className="py-2.5 px-3 text-center min-w-[85px]" rowSpan={2}>Skor</th>
                    <th className="py-2.5 px-3 text-center min-w-[100px]" rowSpan={2}>Aksi</th>
                  </tr>

                  {/* Individual Column Headers with "Semua ✓" Toggle Button */}
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[10px]">
                    {/* Subuh */}
                    <th className="py-2 px-1 text-center bg-amber-50/40 dark:bg-amber-950/20 border-l border-slate-200 dark:border-slate-700 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Subuh</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("subuh")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 text-amber-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Subuh seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                    {/* Dzuhur */}
                    <th className="py-2 px-1 text-center bg-amber-50/40 dark:bg-amber-950/20 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Dzuhur</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("dzuhur")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 text-amber-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Dzuhur seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                    {/* Ashar */}
                    <th className="py-2 px-1 text-center bg-amber-50/40 dark:bg-amber-950/20 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Ashar</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("ashar")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 text-amber-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Ashar seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                    {/* Maghrib */}
                    <th className="py-2 px-1 text-center bg-amber-50/40 dark:bg-amber-950/20 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Maghrib</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("maghrib")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 text-amber-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Maghrib seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                    {/* Isya */}
                    <th className="py-2 px-1 text-center bg-amber-50/40 dark:bg-amber-950/20 border-r border-slate-200 dark:border-slate-700 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Isya</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("isya")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 text-amber-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Isya seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>

                    {/* Dhuha */}
                    <th className="py-2 px-1 text-center bg-emerald-50/40 dark:bg-emerald-950/20 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Dhuha</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("shalatDhuha")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 text-emerald-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Dhuha seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                    {/* Rawatib */}
                    <th className="py-2 px-1 text-center bg-emerald-50/40 dark:bg-emerald-950/20 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Rawatib</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("rawatib")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 text-emerald-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Rawatib seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                    {/* Tilawah */}
                    <th className="py-2 px-1 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-700 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Tilawah</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("tilawahQuran")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 text-emerald-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Tilawah seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>

                    {/* Bantu Ortu */}
                    <th className="py-2 px-1 text-center bg-rose-50/40 dark:bg-rose-950/20 w-20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Bantu Ortu</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("birrulWalidain")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-200 text-rose-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Bantu Ortu seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                    {/* Belajar Mandiri */}
                    <th className="py-2 px-1 text-center bg-rose-50/40 dark:bg-rose-950/20 border-r border-slate-200 dark:border-slate-700 w-20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Belajar Mandiri</span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumnAll("belajarMandiri")}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-200 text-rose-800 font-bold transition-all"
                          title="Klik untuk centang / un-centang Belajar Mandiri seluruh kelas"
                        >
                          Semua ✓
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-sm">Tidak ada santri yang sesuai filter.</p>
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((siswa, idx) => {
                      const draft = batchDrafts[siswa.id] || {
                        subuh: false,
                        dzuhur: false,
                        ashar: false,
                        maghrib: false,
                        isya: false,
                        shalatDhuha: false,
                        rawatib: false,
                        tilawahQuran: false,
                        jumlahHalamanTilawah: 1,
                        birrulWalidain: false,
                        belajarMandiri: false,
                      };
                      const score = getDraftScore(draft);
                      const isSaved = !!getStudentRecord(siswa.id);

                      return (
                        <tr
                          key={siswa.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* No */}
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Nama Siswa */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {siswa.nama.charAt(0)}
                              </div>
                              <div className="truncate max-w-[170px]">
                                <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{siswa.nama}</span>
                                  {isSaved && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Tercatat di sistem" />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {siswa.kelas}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Subuh */}
                          <td className="py-2.5 px-1 text-center bg-amber-50/20 dark:bg-amber-950/10 border-l border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "subuh")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.subuh
                                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Subuh: ${draft.subuh ? "Ya" : "Tidak"}`}
                            >
                              {draft.subuh ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Dzuhur */}
                          <td className="py-2.5 px-1 text-center bg-amber-50/20 dark:bg-amber-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "dzuhur")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.dzuhur
                                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Dzuhur: ${draft.dzuhur ? "Ya" : "Tidak"}`}
                            >
                              {draft.dzuhur ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Ashar */}
                          <td className="py-2.5 px-1 text-center bg-amber-50/20 dark:bg-amber-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "ashar")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.ashar
                                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Ashar: ${draft.ashar ? "Ya" : "Tidak"}`}
                            >
                              {draft.ashar ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Maghrib */}
                          <td className="py-2.5 px-1 text-center bg-amber-50/20 dark:bg-amber-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "maghrib")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.maghrib
                                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Maghrib: ${draft.maghrib ? "Ya" : "Tidak"}`}
                            >
                              {draft.maghrib ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Isya */}
                          <td className="py-2.5 px-1 text-center bg-amber-50/20 dark:bg-amber-950/10 border-r border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "isya")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.isya
                                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Isya: ${draft.isya ? "Ya" : "Tidak"}`}
                            >
                              {draft.isya ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Dhuha */}
                          <td className="py-2.5 px-1 text-center bg-emerald-50/20 dark:bg-emerald-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "shalatDhuha")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.shalatDhuha
                                  ? "bg-amber-500 text-white font-bold shadow-xs hover:bg-amber-600"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Shalat Dhuha: ${draft.shalatDhuha ? "Ya" : "Tidak"}`}
                            >
                              {draft.shalatDhuha ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Rawatib */}
                          <td className="py-2.5 px-1 text-center bg-emerald-50/20 dark:bg-emerald-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "rawatib")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.rawatib
                                  ? "bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Sunnah Rawatib: ${draft.rawatib ? "Ya" : "Tidak"}`}
                            >
                              {draft.rawatib ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Tilawah */}
                          <td className="py-2.5 px-1 text-center bg-emerald-50/20 dark:bg-emerald-950/10 border-r border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "tilawahQuran")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.tilawahQuran
                                  ? "bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Tilawah Al-Qur'an: ${draft.tilawahQuran ? "Ya" : "Tidak"}`}
                            >
                              {draft.tilawahQuran ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Bantu Ortu */}
                          <td className="py-2.5 px-1 text-center bg-rose-50/20 dark:bg-rose-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "birrulWalidain")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.birrulWalidain
                                  ? "bg-rose-600 text-white font-bold shadow-xs hover:bg-rose-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Membantu Orang Tua: ${draft.birrulWalidain ? "Ya" : "Tidak"}`}
                            >
                              {draft.birrulWalidain ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Belajar Mandiri */}
                          <td className="py-2.5 px-1 text-center bg-rose-50/20 dark:bg-rose-950/10 border-r border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleToggleDraft(siswa.id, "belajarMandiri")}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                draft.belajarMandiri
                                  ? "bg-indigo-600 text-white font-bold shadow-xs hover:bg-indigo-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200"
                              }`}
                              title={`Belajar Mandiri di Rumah: ${draft.belajarMandiri ? "Ya" : "Tidak"}`}
                            >
                              {draft.belajarMandiri ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] text-slate-400">-</span>}
                            </button>
                          </td>

                          {/* Skor Live */}
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-black inline-block border ${
                                score >= 90
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : score >= 70
                                  ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300"
                                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {score}
                            </span>
                          </td>

                          {/* Aksi Cepat per Siswa */}
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetStudentAll(siswa.id, true)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200"
                                title="Set 100 Poin untuk siswa ini"
                              >
                                100%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenInputModal(siswa)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                title="Buka Detail Form Siswa"
                              >
                                <Edit3 className="w-3 h-3" />
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

          {/* Sticky Bottom Save Bar when modified */}
          {isBatchModified && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-xs font-bold">Ada perubahan centang yang belum disimpan!</span>
              </div>
              <button
                type="button"
                onClick={handleSaveAllBatch}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Semua Perubahan</span>
              </button>
            </div>
          )}
        </div>
      )}

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
                                  ].map((sh) => {
                                    const isYes = isShalatYes(sh.val);
                                    return (
                                      <span
                                        key={sh.name}
                                        title={`${sh.name}: ${isYes ? "Ya" : "Tidak"}`}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                          isYes
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                                            : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                        }`}
                                      >
                                        {sh.name}: {isYes ? "Ya" : "Tidak"}
                                      </span>
                                    );
                                  })}
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
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300">
                                    Dhuha
                                  </span>
                                )}
                                {record.ibadahSunnah.rawatib && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                                    Rawatib
                                  </span>
                                )}
                                {record.ibadahSunnah.tilawahQuran && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    Tilawah ({record.ibadahSunnah.jumlahHalamanTilawah || 1} Hal)
                                  </span>
                                )}
                                {!record.ibadahSunnah.shalatDhuha &&
                                  !record.ibadahSunnah.rawatib &&
                                  !record.ibadahSunnah.tilawahQuran && (
                                    <span className="text-slate-400 italic text-[11px]">-</span>
                                  )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 6. Akhlak & Birrul Walidain */}
                          <td className="py-3.5 px-4">
                            {record ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {record.akhlakKarakter.birrulWalidain && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300">
                                    Membantu Orang Tua
                                  </span>
                                )}
                                {record.akhlakKarakter.belajarMandiri && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300">
                                    Belajar Mandiri
                                  </span>
                                )}
                                {!record.akhlakKarakter.birrulWalidain &&
                                  !record.akhlakKarakter.belajarMandiri && (
                                    <span className="text-slate-400 italic text-[11px]">-</span>
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
                    Penilaian: Ya / Tidak (10 Poin / Shalat)
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "subuh", label: "Shalat Subuh", icon: Sunrise, color: "text-amber-500" },
                    { key: "dzuhur", label: "Shalat Dzuhur", icon: Sun, color: "text-amber-600" },
                    { key: "ashar", label: "Shalat Ashar", icon: Sunset, color: "text-orange-500" },
                    { key: "maghrib", label: "Shalat Maghrib", icon: Sunset, color: "text-indigo-500" },
                    { key: "isya", label: "Shalat Isya", icon: Moon, color: "text-blue-500" },
                  ].map(({ key, label, icon: Icon, color }) => {
                    const isYes = isShalatYes((shalat as any)[key]);
                    return (
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

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShalat((prev) => ({ ...prev, [key]: "Ya" }))}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isYes
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${isYes ? "text-white" : "text-slate-400"}`} />
                            <span>Ya</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShalat((prev) => ({ ...prev, [key]: "Tidak" }))}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              !isYes
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-rose-50 hover:text-rose-700"
                            }`}
                          >
                            <X className={`w-3.5 h-3.5 ${!isYes ? "text-white" : "text-slate-400"}`} />
                            <span>Tidak</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagian 2: Ibadah Sunnah */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>2. Amalan & Ibadah Sunnah</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Pahala Tambahan (10 Poin / Amalan)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: "shalatDhuha", label: "Shalat Dhuha" },
                    { key: "rawatib", label: "Sunnah Rawatib" },
                    { key: "tilawahQuran", label: "Tilawah Al Qur'an" },
                  ].map(({ key, label }) => {
                    const isChecked = !!(sunnah as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() =>
                          setSunnah((prev) => ({ ...prev, [key]: !isChecked }))
                        }
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
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
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
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
                      className="w-24 px-3 py-1.5 text-center font-bold text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Bagian 3: Akhlak & Birrul Walidain */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                    <span>3. Akhlak & Birrul Walidain</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Karakter Mulia (10 Poin / Pembiasaan)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "birrulWalidain", label: "Membantu Orang Tua" },
                    { key: "belajarMandiri", label: "Belajar Mandiri di Rumah" },
                  ].map(({ key, label }) => {
                    const isChecked = !!(akhlak as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() =>
                          setAkhlak((prev) => ({ ...prev, [key]: !isChecked }))
                        }
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
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
      {/* TAB LAPORAN: LEMBAR LAPORAN HARIAN MUTABA'AH SELURUH SANTRI (PDF & JPG)  */}
      {/* ========================================================================= */}
      {activeTab === "laporan" && (
        <div className="space-y-6">
          {/* Action Toolbar (no-print) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700">
                <FileText className="w-3.5 h-3.5" />
                <span>Dokumen Resmi Rekapitulasi Rombel</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Laporan Harian Mutaba'ah Seluruh Santri</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  {displayedStudents.length} Santri
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lembar laporan resmi siap cetak ke format PDF atau unduh gambar resolusi tinggi (JPG) untuk dibagikan ke wali santri.
              </p>
            </div>

            {/* Tombol Ekspor PDF & JPG */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJPG}
                disabled={isGeneratingJpg}
                className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isGeneratingJpg ? "Menyiapkan Gambar..." : "Unduh Gambar (JPG)"}</span>
              </button>
            </div>
          </div>

          {/* Printable Report Sheet */}
          <div
            id="mutabaah-report-sheet"
            className="p-6 sm:p-10 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-xl max-w-6xl mx-auto space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:text-black"
          >
            {/* Kop Surat Sekolah */}
            <div className="text-center pb-2">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-950 print:text-black">
                {profile.namaSekolah || "SDI SMART SCHOOL"}
              </h2>
              <p className="text-xs font-bold text-slate-700 mt-1">
                NPSN: {profile.npsn || "-"} • AKREDITASI: {profile.akreditasi || "A"} • TAHUN AJARAN: {profile.tahunAjaranAktif || "2025/2026"} (SEMESTER {profile.semesterAktif?.toUpperCase() || "GANJIL"})
              </p>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                {profile.alamat || ""} • Telp: {profile.telepon || "-"} • Website: {profile.website || "-"}
              </p>
              <div className="mt-3 border-b-2 border-emerald-900 print:border-black"></div>
              <div className="mt-0.5 border-b border-emerald-900 print:border-black"></div>
            </div>

            {/* Judul & Meta Dokumen */}
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 print:text-black">
                LAPORAN HARIAN MUTABA'AH IBADAH YAUMIYAH SANTRI
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600">
                <span>
                  Hari / Tanggal:{" "}
                  <b className="text-slate-900 print:text-black">
                    {new Date(selectedDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </b>
                </span>
                <span>•</span>
                <span>
                  Kelas: <b className="text-slate-900 print:text-black">{selectedKelas === "Semua" ? "Semua Kelas" : selectedKelas}</b>
                </span>
                <span>•</span>
                <span>
                  Total: <b className="text-slate-900 print:text-black">{displayedStudents.length} Santri</b>
                </span>
              </div>
            </div>

            {/* Rekapitulasi Ringkas Rombel */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:bg-slate-50 print:border-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Santri</span>
                <p className="font-extrabold text-sm text-slate-900">{metrics.total} Santri</p>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Tercatat Mengisi</span>
                <p className="font-extrabold text-sm text-emerald-800">
                  {metrics.sudahCount} Santri ({metrics.completionRate}%)
                </p>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Rata-rata Skor</span>
                <p className="font-extrabold text-sm text-blue-700">{metrics.avgScore} / 100 Poin</p>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Predikat Mumtaz (⭐)</span>
                <p className="font-extrabold text-sm text-amber-600">{metrics.bintangCount} Santri</p>
              </div>
            </div>

            {/* Tabel Komprehensif Seluruh Santri */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300 print:border-black">
                <thead>
                  <tr className="bg-emerald-900 text-white font-bold text-[11px] print:bg-slate-200 print:text-black">
                    <th rowSpan={2} className="py-2.5 px-2 text-center border border-emerald-800 print:border-black w-9">
                      No
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 border border-emerald-800 print:border-black w-24">
                      NISN
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 border border-emerald-800 print:border-black">
                      Nama Santri
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 text-center border border-emerald-800 print:border-black w-14">
                      Kelas
                    </th>
                    <th colSpan={5} className="py-1.5 px-2 text-center border border-emerald-800 print:border-black bg-emerald-950/80 print:bg-slate-300">
                      Shalat Fardhu 5 Waktu
                    </th>
                    <th colSpan={3} className="py-1.5 px-2 text-center border border-emerald-800 print:border-black bg-teal-900/80 print:bg-slate-300">
                      Amalan Sunnah
                    </th>
                    <th colSpan={2} className="py-1.5 px-2 text-center border border-emerald-800 print:border-black bg-emerald-950/80 print:bg-slate-300">
                      Akhlak & Adab
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 text-center border border-emerald-800 print:border-black w-12">
                      Skor
                    </th>
                    <th rowSpan={2} className="py-2.5 px-2 text-center border border-emerald-800 print:border-black w-24">
                      Predikat
                    </th>
                  </tr>
                  <tr className="bg-emerald-800 text-white font-semibold text-[10px] print:bg-slate-100 print:text-black">
                    {/* Shalat 5 Waktu */}
                    <th className="py-1 px-1 text-center border border-emerald-700 print:border-black w-10">Subuh</th>
                    <th className="py-1 px-1 text-center border border-emerald-700 print:border-black w-10">Dzuhur</th>
                    <th className="py-1 px-1 text-center border border-emerald-700 print:border-black w-10">Ashar</th>
                    <th className="py-1 px-1 text-center border border-emerald-700 print:border-black w-10">Maghrib</th>
                    <th className="py-1 px-1 text-center border border-emerald-700 print:border-black w-10">Isya</th>

                    {/* Sunnah */}
                    <th className="py-1 px-1 text-center border border-teal-700 print:border-black w-12">Dhuha</th>
                    <th className="py-1 px-1 text-center border border-teal-700 print:border-black w-12">Rawatib</th>
                    <th className="py-1 px-1 text-center border border-teal-700 print:border-black w-12">Tilawah</th>

                    {/* Akhlak */}
                    <th className="py-1 px-1 text-center border border-emerald-700 print:border-black w-14">Bantu Ortu</th>
                    <th className="py-1 px-1 text-center border border-emerald-700 print:border-black w-14">Mandiri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-black text-[11px]">
                  {displayedStudents.map((student, idx) => {
                    const rec = getStudentRecord(student.id);
                    const draft = batchDrafts[student.id];

                    const isSubuh = draft ? draft.subuh : isShalatYes(rec?.shalatWajib?.subuh);
                    const isDzuhur = draft ? draft.dzuhur : isShalatYes(rec?.shalatWajib?.dzuhur);
                    const isAshar = draft ? draft.ashar : isShalatYes(rec?.shalatWajib?.ashar);
                    const isMaghrib = draft ? draft.maghrib : isShalatYes(rec?.shalatWajib?.maghrib);
                    const isIsya = draft ? draft.isya : isShalatYes(rec?.shalatWajib?.isya);

                    const isDhuha = draft ? draft.shalatDhuha : !!rec?.ibadahSunnah?.shalatDhuha;
                    const isRawatib = draft ? draft.rawatib : !!rec?.ibadahSunnah?.rawatib;
                    const isTilawah = draft ? draft.tilawahQuran : !!rec?.ibadahSunnah?.tilawahQuran;

                    const isBantu = draft ? draft.birrulWalidain : !!rec?.akhlakKarakter?.birrulWalidain;
                    const isMandiri = draft ? draft.belajarMandiri : !!rec?.akhlakKarakter?.belajarMandiri;

                    const score = draft ? getDraftScore(draft) : rec ? rec.skorKebaikan : 0;
                    let predikat = "Belum Diisi";
                    let predikatBadge = "bg-slate-100 text-slate-600";
                    if (score >= 90) {
                      predikat = "Mumtaz ⭐";
                      predikatBadge = "bg-emerald-100 text-emerald-800 font-bold";
                    } else if (score >= 75) {
                      predikat = "Jayyid Jiddan";
                      predikatBadge = "bg-blue-100 text-blue-800 font-semibold";
                    } else if (score >= 60) {
                      predikat = "Jayyid";
                      predikatBadge = "bg-teal-100 text-teal-800";
                    } else if (score > 0) {
                      predikat = "Maqbul";
                      predikatBadge = "bg-amber-100 text-amber-800";
                    }

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        <td className="py-1.5 px-2 text-center text-slate-500 border border-slate-300 print:border-black">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-[10px] text-slate-600 border border-slate-300 print:border-black">
                          {student.nisn || "-"}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 border border-slate-300 print:border-black">
                          {student.nama}
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-600 border border-slate-300 print:border-black">
                          {student.kelas}
                        </td>

                        {/* Shalat Fardhu */}
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isSubuh ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isDzuhur ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isAshar ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isMaghrib ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isIsya ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Amalan Sunnah */}
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isDhuha ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isRawatib ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isTilawah ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Akhlak */}
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isBantu ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-center border border-slate-300 print:border-black">
                          {isMandiri ? (
                            <span className="text-emerald-700 font-bold text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Skor */}
                        <td className="py-1.5 px-2 text-center font-bold text-slate-900 border border-slate-300 print:border-black">
                          {score}
                        </td>

                        {/* Predikat */}
                        <td className="py-1.5 px-2 text-center border border-slate-300 print:border-black">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${predikatBadge} print:bg-transparent print:text-black print:p-0`}>
                            {predikat}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Titimangsa & Tanda Tangan Resmi */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-900 print:text-black">
              <div className="text-center space-y-16">
                <div>
                  <p className="font-medium text-slate-600 print:text-black">Mengetahui,</p>
                  <p className="font-bold">Kepala Sekolah</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">
                    {profile.kepalaSekolah || "Dr. H. Muhammad Rasyid, M.Pd."}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-black">NIP. 197204151998031002</p>
                </div>
              </div>

              <div className="text-center space-y-16">
                <div>
                  <p className="font-medium text-slate-600 print:text-black">
                    Jakarta,{" "}
                    {new Date().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="font-bold">
                    Guru Pembina / Wali Kelas {selectedKelas === "Semua" ? "" : selectedKelas}
                  </p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">
                    {teacherScope.teacherName || user?.name || "Ustadz Pembina Mutaba'ah"}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-black">Guru Pengampu PAI & Budi Pekerti</p>
                </div>
              </div>
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
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>1. Shalat Fardhu 5 Waktu</span>
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                    Penilaian: Ya / Tidak (10 Poin / Shalat)
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: "subuh", label: "Shalat Subuh" },
                    { key: "dzuhur", label: "Shalat Dzuhur" },
                    { key: "ashar", label: "Shalat Ashar" },
                    { key: "maghrib", label: "Shalat Maghrib" },
                    { key: "isya", label: "Shalat Isya" },
                  ].map(({ key, label }) => {
                    const isYes = isShalatYes((shalat as any)[key]);
                    return (
                      <div
                        key={key}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShalat((prev) => ({ ...prev, [key]: "Ya" }))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isYes
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            <Check className={`w-3 h-3 ${isYes ? "text-white" : "text-slate-400"}`} />
                            <span>Ya</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShalat((prev) => ({ ...prev, [key]: "Tidak" }))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              !isYes
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-rose-50 hover:text-rose-700"
                            }`}
                          >
                            <X className={`w-3 h-3 ${!isYes ? "text-white" : "text-slate-400"}`} />
                            <span>Tidak</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amalan Sunnah */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>2. Amalan Sunnah Harian</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">10 Poin / Amalan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: "shalatDhuha", label: "Shalat Dhuha" },
                    { key: "rawatib", label: "Sunnah Rawatib" },
                    { key: "tilawahQuran", label: "Tilawah Al Qur'an" },
                  ].map(({ key, label }) => {
                    const isChecked = !!(sunnah as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() => setSunnah((prev) => ({ ...prev, [key]: !isChecked }))}
                        className={`cursor-pointer p-2.5 rounded-xl border flex items-center justify-between transition-all ${
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

                {sunnah.tilawahQuran && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      Halaman Tilawah Hari Ini:
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
                      className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Akhlak & Birrul Walidain */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                    <span>3. Akhlak & Birrul Walidain</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">10 Poin / Pembiasaan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "birrulWalidain", label: "Membantu Orang Tua" },
                    { key: "belajarMandiri", label: "Belajar Mandiri di Rumah" },
                  ].map(({ key, label }) => {
                    const isChecked = !!(akhlak as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() => setAkhlak((prev) => ({ ...prev, [key]: !isChecked }))}
                        className={`cursor-pointer p-2.5 rounded-xl border flex items-center justify-between transition-all ${
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
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Shalat Fardhu 5 Waktu:</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  {[
                    { name: "Subuh", val: detailSiswaData.record.shalatWajib.subuh },
                    { name: "Dzuhur", val: detailSiswaData.record.shalatWajib.dzuhur },
                    { name: "Ashar", val: detailSiswaData.record.shalatWajib.ashar },
                    { name: "Maghrib", val: detailSiswaData.record.shalatWajib.maghrib },
                    { name: "Isya", val: detailSiswaData.record.shalatWajib.isya },
                  ].map((sh) => {
                    const isYes = isShalatYes(sh.val);
                    return (
                      <div
                        key={sh.name}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          isYes
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <span className="font-medium">{sh.name}</span>
                        <b className={isYes ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600"}>
                          {isYes ? "Ya" : "Tidak"}
                        </b>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amalan Sunnah */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Amalan Sunnah Harian:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      detailSiswaData.record.ibadahSunnah.shalatDhuha
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <span>Shalat Dhuha</span>
                    <b className={detailSiswaData.record.ibadahSunnah.shalatDhuha ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}>
                      {detailSiswaData.record.ibadahSunnah.shalatDhuha ? "Ya" : "Tidak"}
                    </b>
                  </div>
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      detailSiswaData.record.ibadahSunnah.rawatib
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <span>Sunnah Rawatib</span>
                    <b className={detailSiswaData.record.ibadahSunnah.rawatib ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}>
                      {detailSiswaData.record.ibadahSunnah.rawatib ? "Ya" : "Tidak"}
                    </b>
                  </div>
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      detailSiswaData.record.ibadahSunnah.tilawahQuran
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <span>Tilawah Al-Qur'an</span>
                    <b className={detailSiswaData.record.ibadahSunnah.tilawahQuran ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}>
                      {detailSiswaData.record.ibadahSunnah.tilawahQuran
                        ? `Ya (${detailSiswaData.record.ibadahSunnah.jumlahHalamanTilawah || 1} Hal)`
                        : "Tidak"}
                    </b>
                  </div>
                </div>
              </div>

              {/* Akhlak & Birrul Walidain */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>Akhlak & Birrul Walidain:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      detailSiswaData.record.akhlakKarakter.birrulWalidain
                        ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <span>Membantu Orang Tua</span>
                    <b className={detailSiswaData.record.akhlakKarakter.birrulWalidain ? "text-rose-700 dark:text-rose-300" : "text-slate-400"}>
                      {detailSiswaData.record.akhlakKarakter.birrulWalidain ? "Ya" : "Tidak"}
                    </b>
                  </div>
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      detailSiswaData.record.akhlakKarakter.belajarMandiri
                        ? "bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <span>Belajar Mandiri di Rumah</span>
                    <b className={detailSiswaData.record.akhlakKarakter.belajarMandiri ? "text-indigo-700 dark:text-indigo-300" : "text-slate-400"}>
                      {detailSiswaData.record.akhlakKarakter.belajarMandiri ? "Ya" : "Tidak"}
                    </b>
                  </div>
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
