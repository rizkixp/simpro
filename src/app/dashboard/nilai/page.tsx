"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope, isClassMatch } from "@/hooks/useTeacherScope";
import { NilaiSiswa, Siswa, JenisRapor, MataPelajaran } from "@/types/school";
import {
  calculateGrade,
  calculateMidGrade,
  calculateSemesterGrade,
  formatDateIndo,
} from "@/lib/utils";
import { exportSingleRaporXls, exportBatchRaporXls } from "@/lib/exportRaporExcel";
import {
  Award,
  Search,
  Plus,
  Printer,
  Edit2,
  Edit3,
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
  Save,
  TableProperties,
  ChevronLeft,
  MessageCircle,
  Share2,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  UserX,
  Eraser,
  Sliders,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  Bold,
  Underline as UnderlineIcon,
  Type,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Eye,
  School,
  ZoomIn,
  ZoomOut,
  FileSpreadsheet,
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
    presensiList,
    jadwalList,
  } = useSchoolData();

  const canEdit = user?.role === "admin" || user?.role === "guru";
  const isAdmin = user?.role === "admin";

  const baseSiswaList = teacherScope.isTeacher
    ? teacherScope.filterByAssignedClass(siswaList)
    : siswaList;

  const baseNilaiList = teacherScope.isTeacher
    ? teacherScope.filterBySubject(teacherScope.filterByAssignedClass(nilaiList))
    : nilaiList;

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

  // Helper: Dapatkan daftar mata pelajaran suatu kelas berdasarkan entri di menu Jadwal Pelajaran & KBM + Nilai Siswa
  const getAvailableMapelForClass = (
    targetKelas: string
  ): { mapels: MataPelajaran[]; isScheduled: boolean } => {
    if (!targetKelas || targetKelas === "Semua") {
      const all = (teacherScope.isTeacher && teacherScope.scopedMapelList.length > 0
        ? teacherScope.scopedMapelList
        : mapelList) || mapelList;
      return { mapels: all.length > 0 ? all : mapelList, isScheduled: false };
    }

    // Ambil jadwal pelajaran untuk kelas target
    const classJadwal = (jadwalList || []).filter((j) =>
      isClassMatch(j.kelas, targetKelas)
    );

    // Ambil juga mata pelajaran yang sudah pernah dinilai di kelas ini
    const classNilaiMapels = (nilaiList || [])
      .filter((n) => isClassMatch(n.kelas, targetKelas))
      .map((n) => n.mapel?.trim())
      .filter((m): m is string => Boolean(m && m.length > 0));

    // Jika kelas target sudah memiliki jadwal pelajaran di menu Jadwal Pelajaran & KBM,
    // gunakan HANYA mata pelajaran dari jadwal kelas tersebut sebagai acuan resmi.
    // Hal ini memastikan kolom input nilai leger rombel sinkron dan tepat sesuai mata pelajaran kelas
    // (misalnya Kelas 1 tidak memiliki IPAS di jadwal, maka IPAS tidak akan muncul di leger).
    // Riwayat nilai (classNilaiMapels) hanya dipakai jika kelas belum memiliki entri jadwal sama sekali.
    const scheduledNames =
      classJadwal.length > 0
        ? Array.from(
            new Set(
              classJadwal
                .map((j) => j.mapel?.trim())
                .filter((m): m is string => Boolean(m && m.length > 0))
            )
          )
        : Array.from(new Set(classNilaiMapels));

    if (scheduledNames.length > 0) {
      const matched: MataPelajaran[] = [];
      scheduledNames.forEach((name) => {
        // Prioritaskan kecocokan persis terlebih dahulu
        const exact = mapelList.find(
          (m) => m.nama.trim().toLowerCase() === name.toLowerCase()
        );
        const found =
          exact ||
          mapelList.find(
            (m) =>
              name.toLowerCase().includes(m.nama.trim().toLowerCase()) ||
              m.nama.trim().toLowerCase().includes(name.toLowerCase())
          );
        if (found) {
          if (!matched.some((item) => item.id === found.id)) {
            matched.push(found);
          }
        } else {
          matched.push({
            id: `mapel-sch-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            kode: name.substring(0, 4).toUpperCase(),
            nama: name,
            kategori: "Wajib",
            kkm: 75,
          });
        }
      });

      // Urutkan mata pelajaran sesuai urutan kurikulum standar di mapelList
      matched.sort((a, b) => {
        const idxA = mapelList.findIndex(
          (m) => m.nama.toLowerCase().trim() === a.nama.toLowerCase().trim()
        );
        const idxB = mapelList.findIndex(
          (m) => m.nama.toLowerCase().trim() === b.nama.toLowerCase().trim()
        );
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.nama.localeCompare(b.nama);
      });

      // Jika akun merupakan guru pengampu mata pelajaran tertentu (dan BUKAN wali kelas di kelas ini), filter lebih lanjut
      if (
        teacherScope.isTeacher &&
        !teacherScope.isHomeroom &&
        teacherScope.scopedMapelList.length > 0
      ) {
        const teacherFiltered = matched.filter((sm) =>
          teacherScope.scopedMapelList.some(
            (tm) => tm.nama.trim().toLowerCase() === sm.nama.trim().toLowerCase()
          )
        );
        if (teacherFiltered.length > 0) {
          return { mapels: teacherFiltered, isScheduled: true };
        }
      }

      return { mapels: matched, isScheduled: true };
    }

    // Fallback jika kelas belum diset jadwalnya di menu Jadwal Pelajaran & KBM
    const fallback = (teacherScope.isTeacher && teacherScope.scopedMapelList.length > 0
      ? teacherScope.scopedMapelList
      : mapelList) || mapelList;
    return { mapels: fallback.length > 0 ? fallback : mapelList, isScheduled: false };
  };

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
    tugas: 0,
    uts: 80,
    uas: 0,
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

  // Mode Edit / Input Nilai Langsung dari Leger Rombel
  const [isLegerEditMode, setIsLegerEditMode] = useState<boolean>(false);
  const [legerInputScores, setLegerInputScores] = useState<Record<string, string | number>>({});
  const [isLegerSaving, setIsLegerSaving] = useState<boolean>(false);
  const [isLegerImporting, setIsLegerImporting] = useState<boolean>(false);
  const legerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Mode Tampilan Tabel Utama: Leger Matriks (Input Langsung) vs Ringkasan Siswa
  const [mainTableViewMode, setMainTableViewMode] = useState<"leger" | "ringkasan">("leger");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const mainLegerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Daftar mata pelajaran aktif untuk tabel leger pada halaman utama
  const activeLegerMapels = useMemo(() => {
    const targetKelas =
      teacherScope.isTeacher && teacherScope.assignedClass
        ? teacherScope.assignedClass
        : selectedKelas;
    if (selectedMapel !== "Semua") {
      const found = mapelList.find(
        (m) => m.nama.trim().toLowerCase() === selectedMapel.trim().toLowerCase()
      );
      if (found) return [found];
    }
    const { mapels } = getAvailableMapelForClass(targetKelas);
    return mapels.length > 0 ? mapels : mapelList;
  }, [selectedKelas, selectedMapel, teacherScope, jadwalList, nilaiList, mapelList]);

  // Daftar siswa aktif untuk tabel leger pada halaman utama
  const activeTargetStudents = useMemo(() => {
    return baseSiswaList.filter((s) => {
      if (teacherScope.isTeacher && teacherScope.assignedClass) {
        return isClassMatch(s.kelas, teacherScope.assignedClass);
      }
      if (selectedKelas === "Semua") return true;
      return isClassMatch(s.kelas, selectedKelas);
    });
  }, [baseSiswaList, teacherScope, selectedKelas]);

  // Daftar mata pelajaran khusus rombel/kelas yang sedang dipilih pada Leger Rombel
  const currentLegerMapelList = useMemo(() => {
    const targetKelas =
      teacherScope.isTeacher && teacherScope.assignedClass
        ? teacherScope.assignedClass
        : batchSelectedKelas;
    const { mapels } = getAvailableMapelForClass(targetKelas);
    return mapels.length > 0 ? mapels : mapelList;
  }, [batchSelectedKelas, teacherScope, jadwalList, nilaiList, mapelList]);

  // Konfigurasi Kustomisasi Kop Surat, Judul, & Titimangsa Rapor
  interface RaporConfig {
    // 1. Kop Surat
    tampilkanKop?: boolean;
    logoKiriUrl: string;
    logoKananUrl: string;
    yayasanNama: string;
    namaSekolah: string;
    npsnAkreditasi: string;
    alamatKontak: string;
    garisKop: "double" | "single" | "none";
    ukuranFontKop?: "sm" | "md" | "lg";
    fontSizeBaris1?: number;
    fontSizeBaris2?: number;
    fontSizeBaris3?: number;
    fontSizeBaris4?: number;
    ukuranLogoKop?: "sm" | "md" | "lg" | "xl";

    // 2. Alamat & Titimangsa Tanggal
    tempatRapor: string;
    tanggalRapor: string;
    tanggalRaporSTS?: string;
    tanggalRaporSAS?: string;
    labelKepalaSekolah?: string;
    customKepalaSekolah?: string;
    nipKepalaSekolah?: string;
    showTtdKepsek?: boolean;
    showTtdWali?: boolean;
    showTtdOrtu?: boolean;

    // 3. Judul & Format Huruf Rapor
    judulRaporSTS?: string;
    judulRaporSAS?: string;
    subjudulRapor?: string;
    fontSizeJudulRapor?: number;
    boldJudulRapor?: boolean;
    underlineJudulRapor?: boolean;
    fontSizeSubjudulRapor?: number;
    boldSubjudulRapor?: boolean;

    // 4. Format & Pengaturan Rapor Lainnya (Font Family, Font Size, Scale, Spacing, Columns)
    fontFamilyRapor?: string;
    customFontName?: string;
    skalaUkuranRapor?: number;
    fontSizeHeaderTabel?: number;
    fontSizeTabelNilai?: number;
    fontSizeIdentitas?: number;
    fontSizeCatatanGuru?: number;
    fontSizePresensi?: number;
    fontSizeTitimangsa?: number;
    paddingTabel?: "kompak" | "sedang" | "longgar";
    showKkm?: boolean;
    showPredikat?: boolean;
    showCatatanGuru?: boolean;
    showPresensi?: boolean;

    // 5. Tabel KKM & Interval Predikat Nilai
    tampilkanTabelKkm?: boolean;
    nilaiStandarKkm?: number;
    fontSizeTabelKkm?: number;
    judulTabelKkm?: string;

    // 6. Ukuran & Ruang Tanda Tangan
    tinggiRuangTtd?: number;
    fontSizeNamaTtd?: number;
    boldNamaTtd?: boolean;
    underlineNamaTtd?: boolean;

    // 7. Kustomisasi Urutan Mata Pelajaran Rapor
    customMapelOrder?: string[];
  }

  const getDefaultRaporConfig = (): RaporConfig => ({
    tampilkanKop: true,
    logoKiriUrl: "",
    logoKananUrl: "",
    yayasanNama: "YAYASAN PENDIDIKAN ISLAM TERPADU",
    namaSekolah: profile?.namaSekolah || "SDI SMART SCHOOL",
    npsnAkreditasi: `NPSN: ${profile?.npsn || "20104567"} • Akreditasi: ${profile?.akreditasi || "A"}`,
    alamatKontak: `${profile?.alamat || "Jl. Pendidikan No. 45"} • Telp: ${profile?.telepon || "(021) 7890123"} • Website: ${profile?.website || "www.smartschool.sch.id"}`,
    garisKop: "double",
    ukuranFontKop: "md",
    fontSizeBaris1: 16,
    fontSizeBaris2: 16,
    fontSizeBaris3: 16,
    fontSizeBaris4: 11,
    ukuranLogoKop: "lg",

    tempatRapor: "Jakarta",
    tanggalRapor: formatDateIndo(new Date().toISOString().split("T")[0]),
    tanggalRaporSTS: formatDateIndo(new Date().toISOString().split("T")[0]),
    tanggalRaporSAS: formatDateIndo(new Date().toISOString().split("T")[0]),
    labelKepalaSekolah: "Kepala Sekolah",
    customKepalaSekolah: "",
    nipKepalaSekolah: "",
    showTtdKepsek: true,
    showTtdWali: true,
    showTtdOrtu: true,

    // Judul & Teks Rapor Default
    judulRaporSTS: "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)",
    judulRaporSAS: "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)",
    subjudulRapor: "",
    fontSizeJudulRapor: 16,
    boldJudulRapor: true,
    underlineJudulRapor: true,
    fontSizeSubjudulRapor: 12,
    boldSubjudulRapor: false,

    fontFamilyRapor: "Times New Roman",
    customFontName: "",
    skalaUkuranRapor: 100,
    fontSizeHeaderTabel: 11,
    fontSizeTabelNilai: 11,
    fontSizeIdentitas: 12,
    fontSizeCatatanGuru: 10,
    fontSizePresensi: 10,
    fontSizeTitimangsa: 11,
    paddingTabel: "sedang",
    showKkm: true,
    showPredikat: true,
    showCatatanGuru: true,
    showPresensi: true,

    // Tabel KKM & Interval Predikat Nilai Default
    tampilkanTabelKkm: true,
    nilaiStandarKkm: 75,
    fontSizeTabelKkm: 10,
    judulTabelKkm: "Kriteria Ketuntasan Minimal (KKM)",

    // Ukuran & Ruang Tanda Tangan Default
    tinggiRuangTtd: 64,
    fontSizeNamaTtd: 12,
    boldNamaTtd: true,
    underlineNamaTtd: true,

    // Urutan Mata Pelajaran Default
    customMapelOrder: [],
  });

  const [raporConfig, setRaporConfig] = useState<RaporConfig>(getDefaultRaporConfig);
  const [isRaporSettingsOpen, setIsRaporSettingsOpen] = useState(false);
  const [activeRaporConfigTab, setActiveRaporConfigTab] = useState<"kop" | "titimangsa" | "judul" | "urutan">("kop");
  const [isInlineTitleEdit, setIsInlineTitleEdit] = useState(false);

  // State untuk Modal Khusus Format Rapor & Live Preview
  const [isFormatRaporModalOpen, setIsFormatRaporModalOpen] = useState(false);
  const [formatRaporActiveTab, setFormatRaporActiveTab] = useState<"kop" | "judul" | "titimangsa" | "format" | "urutan">("kop");
  const [formatPreviewType, setFormatPreviewType] = useState<"tengah" | "akhir">("tengah");
  const [formatPreviewSemester, setFormatPreviewSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [formatPreviewSource, setFormatPreviewSource] = useState<"demo" | "siswa">("demo");
  const [formatPreviewSelectedSiswaId, setFormatPreviewSelectedSiswaId] = useState<string>("");
  const [formatPreviewZoom, setFormatPreviewZoom] = useState<number>(100);
  const [formatSaveToast, setFormatSaveToast] = useState(false);

  // Load saved rapor config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("simpro_rapor_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        setRaporConfig((prev) => ({
          ...prev,
          ...parsed,
          tampilkanKop: parsed.tampilkanKop ?? prev.tampilkanKop ?? true,
          garisKop: parsed.garisKop || prev.garisKop || "double",
          ukuranFontKop: parsed.ukuranFontKop || prev.ukuranFontKop || "md",
          fontSizeBaris1: parsed.fontSizeBaris1 || prev.fontSizeBaris1 || 16,
          fontSizeBaris2: parsed.fontSizeBaris2 || prev.fontSizeBaris2 || 16,
          fontSizeBaris3: parsed.fontSizeBaris3 || prev.fontSizeBaris3 || 16,
          fontSizeBaris4: parsed.fontSizeBaris4 || prev.fontSizeBaris4 || 11,
          ukuranLogoKop: parsed.ukuranLogoKop || prev.ukuranLogoKop || "lg",
          namaSekolah: parsed.namaSekolah || profile?.namaSekolah || prev.namaSekolah,
          tempatRapor: parsed.tempatRapor || prev.tempatRapor || "Jakarta",
          tanggalRapor: parsed.tanggalRapor || prev.tanggalRapor,
          tanggalRaporSTS: parsed.tanggalRaporSTS || prev.tanggalRaporSTS || prev.tanggalRapor,
          tanggalRaporSAS: parsed.tanggalRaporSAS || prev.tanggalRaporSAS || prev.tanggalRapor,
          labelKepalaSekolah: parsed.labelKepalaSekolah || prev.labelKepalaSekolah || "Kepala Sekolah",
          customKepalaSekolah: parsed.customKepalaSekolah ?? prev.customKepalaSekolah ?? "",
          nipKepalaSekolah: parsed.nipKepalaSekolah ?? prev.nipKepalaSekolah ?? "",
          showTtdKepsek: parsed.showTtdKepsek ?? prev.showTtdKepsek ?? true,
          showTtdWali: parsed.showTtdWali ?? prev.showTtdWali ?? true,
          showTtdOrtu: parsed.showTtdOrtu ?? prev.showTtdOrtu ?? true,
          judulRaporSTS: parsed.judulRaporSTS ?? prev.judulRaporSTS,
          judulRaporSAS: parsed.judulRaporSAS ?? prev.judulRaporSAS,
          subjudulRapor: parsed.subjudulRapor ?? prev.subjudulRapor,
          fontSizeJudulRapor: parsed.fontSizeJudulRapor ?? prev.fontSizeJudulRapor ?? 16,
          boldJudulRapor: parsed.boldJudulRapor ?? prev.boldJudulRapor ?? true,
          underlineJudulRapor: parsed.underlineJudulRapor ?? prev.underlineJudulRapor ?? true,
          fontSizeSubjudulRapor: parsed.fontSizeSubjudulRapor ?? prev.fontSizeSubjudulRapor ?? 12,
          boldSubjudulRapor: parsed.boldSubjudulRapor ?? prev.boldSubjudulRapor ?? false,
          fontFamilyRapor: parsed.fontFamilyRapor || prev.fontFamilyRapor || "Times New Roman",
          customFontName: parsed.customFontName ?? prev.customFontName ?? "",
          skalaUkuranRapor: parsed.skalaUkuranRapor || prev.skalaUkuranRapor || 100,
          fontSizeHeaderTabel: parsed.fontSizeHeaderTabel || prev.fontSizeHeaderTabel || 11,
          fontSizeTabelNilai: parsed.fontSizeTabelNilai || prev.fontSizeTabelNilai || 11,
          fontSizeIdentitas: parsed.fontSizeIdentitas || prev.fontSizeIdentitas || 12,
          fontSizeCatatanGuru: parsed.fontSizeCatatanGuru || prev.fontSizeCatatanGuru || 10,
          fontSizePresensi: parsed.fontSizePresensi || prev.fontSizePresensi || 10,
          fontSizeTitimangsa: parsed.fontSizeTitimangsa || prev.fontSizeTitimangsa || 11,
          paddingTabel: parsed.paddingTabel || prev.paddingTabel || "sedang",
          showKkm: parsed.showKkm ?? prev.showKkm ?? true,
          showPredikat: parsed.showPredikat ?? prev.showPredikat ?? true,
          showCatatanGuru: parsed.showCatatanGuru ?? prev.showCatatanGuru ?? true,
          showPresensi: parsed.showPresensi ?? prev.showPresensi ?? true,
          customMapelOrder: Array.isArray(parsed.customMapelOrder)
            ? parsed.customMapelOrder
            : prev.customMapelOrder || [],
          tampilkanTabelKkm: parsed.tampilkanTabelKkm ?? prev.tampilkanTabelKkm ?? true,
          nilaiStandarKkm: parsed.nilaiStandarKkm ?? prev.nilaiStandarKkm ?? 75,
          fontSizeTabelKkm: parsed.fontSizeTabelKkm ?? prev.fontSizeTabelKkm ?? 10,
          judulTabelKkm: parsed.judulTabelKkm ?? prev.judulTabelKkm ?? "Kriteria Ketuntasan Minimal (KKM)",
          tinggiRuangTtd: parsed.tinggiRuangTtd ?? prev.tinggiRuangTtd ?? 64,
          fontSizeNamaTtd: parsed.fontSizeNamaTtd ?? prev.fontSizeNamaTtd ?? 12,
          boldNamaTtd: parsed.boldNamaTtd ?? prev.boldNamaTtd ?? true,
          underlineNamaTtd: parsed.underlineNamaTtd ?? prev.underlineNamaTtd ?? true,
        }));
      }
    } catch (e) {
      console.warn("Failed to load simpro_rapor_config:", e);
    }
  }, [profile?.namaSekolah]);

  // Daftar Pilihan Jenis Tulisan (Font Family) Resmi Rapor
  const RAPOR_FONT_OPTIONS = [
    {
      id: "Times New Roman",
      label: "Times New Roman",
      category: "Standar Kedinasan (Serif)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-serif",
      css: "'Times New Roman', Times, 'Liberation Serif', serif",
    },
    {
      id: "Arial",
      label: "Arial",
      category: "Modern Bersih (Sans)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-sans",
      css: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    },
    {
      id: "Calibri",
      label: "Calibri",
      category: "Kantor & Lembaga (Sans)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-sans",
      css: "Calibri, 'Segoe UI', Candara, Optima, sans-serif",
    },
    {
      id: "Georgia",
      label: "Georgia",
      category: "Elegan & Formal (Serif)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-serif",
      css: "Georgia, Cambria, 'Times New Roman', Times, serif",
    },
    {
      id: "Garamond",
      label: "Garamond",
      category: "Klasik Akademik (Serif)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-serif",
      css: "Garamond, 'Baskerville', 'Baskerville Old Face', 'Hoefler Text', serif",
    },
    {
      id: "Tahoma",
      label: "Tahoma",
      category: "Kompak & Padat (Sans)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-sans",
      css: "Tahoma, Verdana, Segoe, sans-serif",
    },
    {
      id: "Verdana",
      label: "Verdana",
      category: "Sangat Jelas Terbaca (Sans)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-sans",
      css: "Verdana, Geneva, Tahoma, sans-serif",
    },
    {
      id: "Trebuchet MS",
      label: "Trebuchet MS",
      category: "Modern Dinamis (Sans)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-sans",
      css: "'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', Tahoma, sans-serif",
    },
    {
      id: "Bookman Old Style",
      label: "Bookman Old Style",
      category: "Formal Piagam (Serif)",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-serif",
      css: "'Bookman Old Style', 'Book Antiqua', Palatino, serif",
    },
    {
      id: "Courier New",
      label: "Courier New",
      category: "Monospace / Gaya Ketik",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-mono",
      css: "'Courier New', Courier, monospace",
    },
    {
      id: "sans",
      label: "Inter / Sistem Sans",
      category: "Standar Web Modern",
      sample: "Laporan Capaian Hasil Belajar Peserta Didik",
      fontClass: "font-sans",
      css: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
  ];

  const getFontFamilyCss = (fontFamily?: string): string => {
    if (!fontFamily) return "'Times New Roman', Times, 'Liberation Serif', serif";
    const matched = RAPOR_FONT_OPTIONS.find((f) => f.id.toLowerCase() === fontFamily.toLowerCase());
    if (matched) return matched.css;
    if (fontFamily === "serif") return "'Times New Roman', Times, 'Liberation Serif', serif";
    if (fontFamily === "mono") return "'Courier New', Courier, monospace";
    if (fontFamily === "sans") return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    return `"${fontFamily}", ui-sans-serif, system-ui, sans-serif`;
  };

  const updateRaporConfig = (updates: Partial<RaporConfig>) => {
    setRaporConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("simpro_rapor_config", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save simpro_rapor_config:", e);
      }
      return next;
    });
  };

  // Helper mengurutkan daftar record mata pelajaran berdasarkan customMapelOrder
  const sortRecordsByMapelOrder = <T extends { mapel?: string; nama?: string }>(records: T[]): T[] => {
    if (!raporConfig.customMapelOrder || raporConfig.customMapelOrder.length === 0) {
      return records;
    }
    const orderMap = new Map<string, number>();
    raporConfig.customMapelOrder.forEach((name, idx) => {
      orderMap.set(name.toLowerCase().trim(), idx);
    });
    return [...records].sort((a, b) => {
      const nameA = (a.mapel || a.nama || "").toLowerCase().trim();
      const nameB = (b.mapel || b.nama || "").toLowerCase().trim();
      const indexA = orderMap.has(nameA) ? orderMap.get(nameA)! : 9999;
      const indexB = orderMap.has(nameB) ? orderMap.get(nameB)! : 9999;
      return indexA - indexB;
    });
  };

  // Helper memindahkan posisi mata pelajaran ke atas atau ke bawah dalam kelompoknya
  const moveMapelInSection = (
    currentMapel: string,
    direction: "up" | "down",
    currentSectionRecords: Array<{ mapel?: string; nama?: string } | string>
  ) => {
    const getMapelName = (item: { mapel?: string; nama?: string } | string): string => {
      if (typeof item === "string") return item;
      return item.mapel || item.nama || "";
    };

    const normCurrent = currentMapel.toLowerCase().trim();
    const sectionNames = currentSectionRecords.map(getMapelName).filter(Boolean);

    const indexInSection = sectionNames.findIndex(
      (n) => n.toLowerCase().trim() === normCurrent
    );
    if (indexInSection === -1) return;

    const targetIndex = direction === "up" ? indexInSection - 1 : indexInSection + 1;
    if (targetIndex < 0 || targetIndex >= sectionNames.length) return;

    const targetMapel = sectionNames[targetIndex];
    const normTarget = targetMapel.toLowerCase().trim();

    // Buat daftar lengkap urutan seluruh nama mata pelajaran yang terdata
    const existingOrder =
      raporConfig.customMapelOrder && raporConfig.customMapelOrder.length > 0
        ? [...raporConfig.customMapelOrder]
        : [];

    const allKnownMapels: string[] = [];
    const added = new Set<string>();

    for (const name of existingOrder) {
      const n = name.trim();
      if (n && !added.has(n.toLowerCase())) {
        allKnownMapels.push(n);
        added.add(n.toLowerCase());
      }
    }
    for (const n of sectionNames) {
      const trimmed = n.trim();
      if (trimmed && !added.has(trimmed.toLowerCase())) {
        allKnownMapels.push(trimmed);
        added.add(trimmed.toLowerCase());
      }
    }
    for (const m of mapelList) {
      const n = m.nama.trim();
      if (n && !added.has(n.toLowerCase())) {
        allKnownMapels.push(n);
        added.add(n.toLowerCase());
      }
    }
    for (const n of nilaiList) {
      const nm = n.mapel.trim();
      if (nm && !added.has(nm.toLowerCase())) {
        allKnownMapels.push(nm);
        added.add(nm.toLowerCase());
      }
    }

    const posA = allKnownMapels.findIndex((n) => n.toLowerCase() === normCurrent);
    const posB = allKnownMapels.findIndex((n) => n.toLowerCase() === normTarget);

    if (posA !== -1 && posB !== -1) {
      const temp = allKnownMapels[posA];
      allKnownMapels[posA] = allKnownMapels[posB];
      allKnownMapels[posB] = temp;
      updateRaporConfig({ customMapelOrder: allKnownMapels });
    }
  };

  const handleLogoUpload = (side: "kiri" | "kanan", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateRaporConfig(
          side === "kiri"
            ? { logoKiriUrl: reader.result }
            : { logoKananUrl: reader.result }
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Close Format Rapor modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFormatRaporModalOpen) {
        setIsFormatRaporModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormatRaporModalOpen]);

  // Handle printing directly from format preview paper
  const handlePrintFormatRapor = () => {
    const previewEl = document.getElementById("format-rapor-preview-paper");
    if (!previewEl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const activeFont = raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor;
    const fontCss = `font-family: ${getFontFamilyCss(activeFont)};`;
    const docScale = (raporConfig.skalaUkuranRapor || 100) / 100;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pratinjau Format Rapor - SIMPRO</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
              ${fontCss}
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .rapor-print-wrapper {
              zoom: ${docScale};
            }
            .rapor-print-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            .rapor-print-table th, .rapor-print-table td {
              border: 1px solid #000000;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .underline { text-decoration: underline; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .pt-6 { padding-top: 1.5rem; }
            .h-16 { height: 4rem; }
          </style>
        </head>
        <body>
          <div class="rapor-print-wrapper" style="padding: 12px;">
            ${previewEl.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderRaporSettingsPanel = () => {
    if (!isAdmin || !isRaporSettingsOpen) return null;

    return (
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-700/50 shadow-sm print:hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Kustomisasi Kop Surat, Judul & Titimangsa Rapor
              </h4>
              <p className="text-[11px] text-slate-500">
                Sesuaikan logo kop, teks instansi, judul & format huruf rapor, serta titimangsa tanggal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const fresh = getDefaultRaporConfig();
                setRaporConfig(fresh);
                localStorage.removeItem("simpro_rapor_config");
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Reset Pengaturan ke Default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Default</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRaporSettingsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Logo & Kop vs Titimangsa Tanda Tangan vs Judul & Format */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveRaporConfigTab("kop")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRaporConfigTab === "kop"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            1. Logo & Teks Kop Surat
          </button>
          <button
            type="button"
            onClick={() => setActiveRaporConfigTab("titimangsa")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRaporConfigTab === "titimangsa"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            2. Alamat & Tanggal Rapor (Titimangsa)
          </button>
          <button
            type="button"
            onClick={() => setActiveRaporConfigTab("judul")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRaporConfigTab === "judul"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>3. Judul & Format Huruf Rapor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRaporConfigTab("urutan")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRaporConfigTab === "urutan"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>4. Urutan Mata Pelajaran</span>
          </button>
        </div>

        {activeRaporConfigTab === "kop" ? (
          <div className="space-y-4 text-xs">
            {/* Logo Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {/* Logo Kiri */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Logo Kiri (Yayasan / Sekolah)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    {raporConfig.logoKiriUrl ? (
                      <img src={raporConfig.logoKiriUrl} alt="Logo Kiri" className="w-full h-full object-contain" />
                    ) : (
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer transition-all">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Unggah Gambar</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload("kiri", e)}
                        />
                      </label>
                      {raporConfig.logoKiriUrl && (
                        <button
                          type="button"
                          onClick={() => updateRaporConfig({ logoKiriUrl: "" })}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-medium cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Atau tempel URL gambar..."
                      value={raporConfig.logoKiriUrl}
                      onChange={(e) => updateRaporConfig({ logoKiriUrl: e.target.value })}
                      className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Kanan */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Logo Kanan (Kemenag / Disdik / Program)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    {raporConfig.logoKananUrl ? (
                      <img src={raporConfig.logoKananUrl} alt="Logo Kanan" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic text-center px-1">Tanpa Logo</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer transition-all">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Unggah Gambar</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload("kanan", e)}
                        />
                      </label>
                      {raporConfig.logoKananUrl && (
                        <button
                          type="button"
                          onClick={() => updateRaporConfig({ logoKananUrl: "" })}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-medium cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Atau tempel URL gambar..."
                      value={raporConfig.logoKananUrl}
                      onChange={(e) => updateRaporConfig({ logoKananUrl: e.target.value })}
                      className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Opsi Pengaturan Ukuran Logo Kop Surat (Kiri & Kanan) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">
                  Ukuran Logo Kop Surat (Kiri & Kanan):
                </span>
                <span className="text-[11px] text-slate-500">
                  Sesuaikan besaran tampilan logo instansi pada bagian kiri dan kanan kop rapor.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "sm", label: "Sedang (80px)" },
                  { id: "md", label: "Besar (96px)" },
                  { id: "lg", label: "Ekstra Besar (112px) - Default" },
                  { id: "xl", label: "Jumbo (128px)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateRaporConfig({ ukuranLogoKop: item.id as any })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      (raporConfig.ukuranLogoKop || "lg") === item.id
                        ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kop Text Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {/* Baris 1 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Nama Yayasan / Instansi (Baris 1)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Font:</span>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris1: Math.max(10, (raporConfig.fontSizeBaris1 || 16) - 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perkecil Font Baris 1"
                    >
                      -
                    </button>
                    <select
                      value={raporConfig.fontSizeBaris1 || 16}
                      onChange={(e) => updateRaporConfig({ fontSizeBaris1: Number(e.target.value) })}
                      className="text-[11px] font-bold px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 cursor-pointer"
                    >
                      {[11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24].map((sz) => (
                        <option key={sz} value={sz}>{sz}px</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris1: Math.min(28, (raporConfig.fontSizeBaris1 || 16) + 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perbesar Font Baris 1"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={raporConfig.yayasanNama}
                  onChange={(e) => updateRaporConfig({ yayasanNama: e.target.value })}
                  placeholder="Contoh: YAYASAN PENDIDIKAN ISLAM ..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm"
                />
              </div>

              {/* Baris 2 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Nama Satuan Pendidikan / Sekolah (Baris 2)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Font:</span>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris2: Math.max(10, (raporConfig.fontSizeBaris2 || 16) - 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perkecil Font Baris 2"
                    >
                      -
                    </button>
                    <select
                      value={raporConfig.fontSizeBaris2 || 16}
                      onChange={(e) => updateRaporConfig({ fontSizeBaris2: Number(e.target.value) })}
                      className="text-[11px] font-bold px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 cursor-pointer"
                    >
                      {[11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24].map((sz) => (
                        <option key={sz} value={sz}>{sz}px</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris2: Math.min(28, (raporConfig.fontSizeBaris2 || 16) + 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perbesar Font Baris 2"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={raporConfig.namaSekolah}
                  onChange={(e) => updateRaporConfig({ namaSekolah: e.target.value })}
                  placeholder="Contoh: SD ISLAM TERPADU ..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm"
                />
              </div>

              {/* Baris 3 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    NPSN & Akreditasi / Info Lembaga (Baris 3)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Font:</span>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris3: Math.max(10, (raporConfig.fontSizeBaris3 || 16) - 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perkecil Font Baris 3"
                    >
                      -
                    </button>
                    <select
                      value={raporConfig.fontSizeBaris3 || 16}
                      onChange={(e) => updateRaporConfig({ fontSizeBaris3: Number(e.target.value) })}
                      className="text-[11px] font-bold px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 cursor-pointer"
                    >
                      {[11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24].map((sz) => (
                        <option key={sz} value={sz}>{sz}px</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris3: Math.min(28, (raporConfig.fontSizeBaris3 || 16) + 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perbesar Font Baris 3"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={raporConfig.npsnAkreditasi}
                  onChange={(e) => updateRaporConfig({ npsnAkreditasi: e.target.value })}
                  placeholder="Contoh: NPSN: 20104567 • AKREDITASI: A"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm"
                />
              </div>

              {/* Baris 4 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Alamat, Kontak & Web (Baris 4)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Font:</span>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris4: Math.max(9, (raporConfig.fontSizeBaris4 || 11) - 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perkecil Font Baris 4"
                    >
                      -
                    </button>
                    <select
                      value={raporConfig.fontSizeBaris4 || 11}
                      onChange={(e) => updateRaporConfig({ fontSizeBaris4: Number(e.target.value) })}
                      className="text-[11px] font-bold px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 cursor-pointer"
                    >
                      {[9, 10, 11, 12, 13, 14, 15].map((sz) => (
                        <option key={sz} value={sz}>{sz}px</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeBaris4: Math.min(18, (raporConfig.fontSizeBaris4 || 11) + 1) })}
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Perbesar Font Baris 4"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={raporConfig.alamatKontak}
                  onChange={(e) => updateRaporConfig({ alamatKontak: e.target.value })}
                  placeholder="Contoh: Jl. Merdeka No. 12 • Telp: (021) 123456"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Garis Pembatas Kop:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ garisKop: "double" })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer border ${
                        raporConfig.garisKop === "double"
                          ? "bg-amber-500 text-white border-amber-600 font-bold shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300"
                      }`}
                    >
                      Garis Ganda (Resmi)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ garisKop: "single" })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer border ${
                        raporConfig.garisKop === "single"
                          ? "bg-amber-500 text-white border-amber-600 font-bold shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300"
                      }`}
                    >
                      Garis Tunggal Tebal
                    </button>
                  </div>
                </div>

                {/* Quick Presets untuk Menyamakan Baris 1, 2, 3 Sekaligus */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Samakan Font Baris 1, 2, 3:
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { label: "14px", size: 14 },
                      { label: "16px (Default)", size: 16 },
                      { label: "18px", size: 18 },
                      { label: "20px", size: 20 },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        type="button"
                        onClick={() =>
                          updateRaporConfig({
                            fontSizeBaris1: preset.size,
                            fontSizeBaris2: preset.size,
                            fontSizeBaris3: preset.size,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                          raporConfig.fontSizeBaris1 === preset.size &&
                          raporConfig.fontSizeBaris2 === preset.size &&
                          raporConfig.fontSizeBaris3 === preset.size
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 hover:bg-slate-50"
                        }`}
                        title={`Ubah ukuran Baris 1, 2, dan 3 serentak ke ${preset.size}px`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeRaporConfigTab === "titimangsa" ? (
          /* Titimangsa Tab */
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <p className="text-slate-500">
              Titimangsa ini akan muncul di atas kolom tanda tangan pada bagian bawah lembar rapor:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat / Kota Penetapan Rapor
                </label>
                <input
                  type="text"
                  value={raporConfig.tempatRapor}
                  onChange={(e) => updateRaporConfig({ tempatRapor: e.target.value })}
                  placeholder="Contoh: Jakarta, Bandung, Surabaya..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Rapor
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={raporConfig.tanggalRapor}
                    onChange={(e) => updateRaporConfig({ tanggalRapor: e.target.value })}
                    placeholder="Contoh: 20 Desember 2024"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateRaporConfig({
                        tanggalRapor: formatDateIndo(new Date().toISOString().split("T")[0]),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer text-[11px] whitespace-nowrap"
                  >
                    Hari Ini
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Pratinjau Format Titimangsa:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                {raporConfig.tempatRapor}, {raporConfig.tanggalRapor}
              </strong>
            </div>
          </div>
        ) : activeRaporConfigTab === "judul" ? (
          /* Tab 3: Judul & Format Huruf Rapor */
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <p className="text-slate-500">
                Atur jenis huruf rapor (font family), teks judul rapor, besar huruf (font size), format tebal (bold), dan garis bawah (underline).
              </p>
              <button
                type="button"
                onClick={() =>
                  updateRaporConfig({
                    judulRaporSTS: "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)",
                    judulRaporSAS: "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)",
                    subjudulRapor: "",
                    fontSizeJudulRapor: 16,
                    boldJudulRapor: true,
                    underlineJudulRapor: true,
                    fontSizeSubjudulRapor: 12,
                    boldSubjudulRapor: false,
                    fontFamilyRapor: "Times New Roman",
                    customFontName: "",
                  })
                }
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                title="Kembalikan format judul & huruf rapor ke standar sistem"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Judul Standar</span>
              </button>
            </div>

            {/* Pilihan Jenis Huruf (Font Family) Dokumen Rapor */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Type className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block text-sm">
                      Pilih Jenis Huruf Dokumen Rapor (Font Family):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Pilih jenis huruf resmi yang diterapkan pada seluruh lembar cetak rapor (kop, judul, identitas, tabel nilai, dan tanda tangan).
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Aktif: {raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor || "Times New Roman"}
                  </span>
                  <select
                    value={raporConfig.customFontName ? "custom" : (raporConfig.fontFamilyRapor || "Times New Roman")}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        updateRaporConfig({ fontFamilyRapor: e.target.value, customFontName: "" });
                      }
                    }}
                    className="text-xs font-bold py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 cursor-pointer shadow-xs focus:ring-2 focus:ring-amber-500"
                    title="Pilih Jenis Huruf Dokumen Rapor Cepat"
                  >
                    {RAPOR_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label} ({f.category})
                      </option>
                    ))}
                    {raporConfig.customFontName && (
                      <option value="custom">Kustom: {raporConfig.customFontName}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Grid Kartu Font Interaktif */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {RAPOR_FONT_OPTIONS.map((f) => {
                  const isSelected =
                    !raporConfig.customFontName?.trim() &&
                    (raporConfig.fontFamilyRapor || "Times New Roman").toLowerCase() === f.id.toLowerCase();
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        updateRaporConfig({
                          fontFamilyRapor: f.id,
                          customFontName: "",
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {f.label}
                        </span>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">
                        {f.category}
                      </span>
                      <p
                        style={{ fontFamily: f.css }}
                        className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 italic"
                      >
                        {f.sample}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Input Font Kustom / Lokal */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Atau Ketik Font Kustom Komputer:
                </span>
                <div className="flex-1 flex gap-2 min-w-[200px]">
                  <input
                    type="text"
                    value={raporConfig.customFontName || ""}
                    onChange={(e) => updateRaporConfig({ customFontName: e.target.value })}
                    placeholder="Contoh: Cambria, Palatino Linotype, Century Gothic, Segoe UI..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                  {raporConfig.customFontName && (
                    <button
                      type="button"
                      onClick={() => updateRaporConfig({ customFontName: "" })}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hapus font kustom dan kembali ke pilihan standar"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Styling Toolbar: Font Size, Bold, Underline */}
            <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">
                    Format Huruf Judul Utama:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Besar huruf (px), tebal teks (bold), dan garis bawah (underline).
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Font Size Stepper & Select */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-[11px] text-slate-500 font-semibold mr-1">Ukuran Font:</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateRaporConfig({
                          fontSizeJudulRapor: Math.max(10, (raporConfig.fontSizeJudulRapor || 16) - 1),
                        })
                      }
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs cursor-pointer"
                      title="Perkecil Ukuran Font Judul"
                    >
                      -
                    </button>
                    <select
                      value={raporConfig.fontSizeJudulRapor || 16}
                      onChange={(e) => updateRaporConfig({ fontSizeJudulRapor: Number(e.target.value) })}
                      className="text-xs font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 cursor-pointer"
                    >
                      {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28].map((sz) => (
                        <option key={sz} value={sz}>{sz}px</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        updateRaporConfig({
                          fontSizeJudulRapor: Math.min(32, (raporConfig.fontSizeJudulRapor || 16) + 1),
                        })
                      }
                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs cursor-pointer"
                      title="Perbesar Ukuran Font Judul"
                    >
                      +
                    </button>
                  </div>

                  {/* Bold Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      updateRaporConfig({
                        boldJudulRapor: !(raporConfig.boldJudulRapor ?? true),
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                      (raporConfig.boldJudulRapor ?? true)
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 hover:bg-slate-100"
                    }`}
                    title="Aktifkan / Nonaktifkan Huruf Tebal (Bold)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                    <span>Tebal (Bold)</span>
                  </button>

                  {/* Underline Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      updateRaporConfig({
                        underlineJudulRapor: !(raporConfig.underlineJudulRapor ?? true),
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                      (raporConfig.underlineJudulRapor ?? true)
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 hover:bg-slate-100"
                    }`}
                    title="Aktifkan / Nonaktifkan Garis Bawah (Underline)"
                  >
                    <UnderlineIcon className="h-3.5 w-3.5" />
                    <span>Garis Bawah (Underline)</span>
                  </button>
                </div>
              </div>

              {/* Presets Ukuran Huruf Judul */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Preset Cepat Ukuran Judul:
                </span>
                <div className="flex gap-1.5">
                  {[
                    { label: "13px (Kecil)", size: 13 },
                    { label: "14px (Sedang)", size: 14 },
                    { label: "16px (Standar)", size: 16 },
                    { label: "18px (Besar)", size: 18 },
                    { label: "20px (Ekstra)", size: 20 },
                  ].map((preset) => (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => updateRaporConfig({ fontSizeJudulRapor: preset.size })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                        (raporConfig.fontSizeJudulRapor || 16) === preset.size
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Teks Judul STS & SAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teks Judul STS */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-100">
                    Teks Judul Rapor STS (Tengah Semester)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateRaporConfig({
                        judulRaporSTS: "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)",
                      })
                    }
                    className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset Teks
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={raporConfig.judulRaporSTS ?? "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)"}
                  onChange={(e) => updateRaporConfig({ judulRaporSTS: e.target.value })}
                  placeholder="LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Muncul saat memilih tipe cetak Rapor Tengah Semester (STS).
                </p>
              </div>

              {/* Teks Judul SAS */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-100">
                    Teks Judul Rapor SAS (Akhir Semester)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateRaporConfig({
                        judulRaporSAS: "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)",
                      })
                    }
                    className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset Teks
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={raporConfig.judulRaporSAS ?? "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)"}
                  onChange={(e) => updateRaporConfig({ judulRaporSAS: e.target.value })}
                  placeholder="LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Muncul saat memilih tipe cetak Rapor Akhir Semester (SAS).
                </p>
              </div>
            </div>

            {/* Subjudul (Tahun Ajaran & Semester) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-100 block">
                    Subjudul (Tahun Ajaran & Semester)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Kosongkan bila ingin otomatis mengikuti tahun ajaran dan semester aktif.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Subtitle Font Size */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-medium">Font:</span>
                    <select
                      value={raporConfig.fontSizeSubjudulRapor || 12}
                      onChange={(e) => updateRaporConfig({ fontSizeSubjudulRapor: Number(e.target.value) })}
                      className="text-xs font-bold px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 cursor-pointer"
                    >
                      {[10, 11, 12, 13, 14, 15, 16].map((sz) => (
                        <option key={sz} value={sz}>{sz}px</option>
                      ))}
                    </select>
                  </div>
                  {/* Subtitle Bold */}
                  <button
                    type="button"
                    onClick={() =>
                      updateRaporConfig({
                        boldSubjudulRapor: !(raporConfig.boldSubjudulRapor ?? false),
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                      raporConfig.boldSubjudulRapor
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200"
                    }`}
                  >
                    <Bold className="h-3 w-3" />
                    <span>Tebal</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={raporConfig.subjudulRapor || ""}
                onChange={(e) => updateRaporConfig({ subjudulRapor: e.target.value })}
                placeholder={`Otomatis: Tahun Ajaran ${profile.tahunAjaranAktif} • Semester ${profile.semesterAktif}`}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
              />
            </div>

            {/* Live Preview Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-amber-300 dark:border-amber-700/60 text-center">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-2">
                Pratinjau Hasil Format Judul
              </span>
              <h3
                style={{ fontSize: `${raporConfig.fontSizeJudulRapor || 16}px` }}
                className={`tracking-wider uppercase text-slate-900 dark:text-white ${
                  (raporConfig.boldJudulRapor ?? true) ? "font-extrabold" : "font-normal"
                } ${
                  (raporConfig.underlineJudulRapor ?? true) ? "underline" : "no-underline"
                }`}
              >
                {raporConfig.judulRaporSTS || "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)"}
              </h3>
              <p
                style={{ fontSize: `${raporConfig.fontSizeSubjudulRapor || 12}px` }}
                className={`mt-1 ${
                  raporConfig.boldSubjudulRapor
                    ? "font-bold text-slate-800 dark:text-slate-200"
                    : "font-medium text-slate-600 dark:text-slate-400"
                }`}
              >
                {raporConfig.subjudulRapor?.trim()
                  ? raporConfig.subjudulRapor
                  : `Tahun Ajaran ${profile.tahunAjaranAktif} • Semester ${profile.semesterAktif}`}
              </p>
            </div>
          </div>
        ) : (
          /* Tab 4: Urutan Mata Pelajaran Rapor */
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-100">
                  Pengaturan Urutan Mata Pelajaran pada Lembar Rapor
                </h5>
                <p className="text-[11px] text-slate-500">
                  Gunakan tombol <strong>Naik (▲)</strong> atau <strong>Turun (▼)</strong> untuk memindahkan posisi mata pelajaran. Anda juga bisa langsung memindahkan urutan pada tabel lembar rapor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateRaporConfig({ customMapelOrder: [] })}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                title="Kembalikan urutan mata pelajaran ke bawaan sistem"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Urutan Default</span>
              </button>
            </div>

            {/* List Groups */}
            {(() => {
              const allWajib = sortRecordsByMapelOrder(
                mapelList.filter((m) => getMapelSection(m.nama) === "wajib")
              );
              const allMulok = sortRecordsByMapelOrder(
                mapelList.filter((m) => getMapelSection(m.nama) === "mulok")
              );
              const allQuran = sortRecordsByMapelOrder(
                mapelList.filter((m) => getMapelSection(m.nama) === "quran")
              );

              const renderMapelCategoryReorder = (
                title: string,
                categoryRecords: Array<{ id?: string; nama: string; kkm?: number }>,
                colorBadge: string
              ) => (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {title} ({categoryRecords.length} Mapel)
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorBadge}`}>
                      Kelompok
                    </span>
                  </div>
                  {categoryRecords.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2 text-center">
                      Belum ada mata pelajaran dalam kelompok ini.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {categoryRecords.map((item, idx) => (
                        <div
                          key={item.id || item.nama}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-amber-400 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 font-black text-[11px] flex items-center justify-center text-slate-600 dark:text-slate-300">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                              {item.nama}
                            </span>
                            {item.kkm && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                KKM: {item.kkm}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveMapelInSection(item.nama, "up", categoryRecords)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 dark:bg-slate-800 dark:hover:bg-amber-500 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title={`Pindahkan "${item.nama}" ke atas`}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                              <span>Naik</span>
                            </button>
                            <button
                              type="button"
                              disabled={idx === categoryRecords.length - 1}
                              onClick={() => moveMapelInSection(item.nama, "down", categoryRecords)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 dark:bg-slate-800 dark:hover:bg-amber-500 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title={`Pindahkan "${item.nama}" ke bawah`}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                              <span>Turun</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

              return (
                <div className="space-y-3">
                  {renderMapelCategoryReorder("A. Muatan Wajib", allWajib, "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300")}
                  {renderMapelCategoryReorder("B. Muatan Lokal", allMulok, "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300")}
                  {renderMapelCategoryReorder("C. Kecerdasan Al-Qur'an", allQuran, "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300")}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const renderOfficialLetterhead = (isSmall = false) => {
    if (raporConfig.tampilkanKop === false) return null;

    const isDouble = raporConfig.garisKop === "double";
    const isNone = raporConfig.garisKop === "none";

    // Ukuran Font Khusus Masing-masing Baris Kop
    const fSize1 = isSmall
      ? Math.max(10, Math.round((raporConfig.fontSizeBaris1 || 16) * 0.88))
      : (raporConfig.fontSizeBaris1 || 16);
    const fSize2 = isSmall
      ? Math.max(10, Math.round((raporConfig.fontSizeBaris2 || 16) * 0.88))
      : (raporConfig.fontSizeBaris2 || 16);
    const fSize3 = isSmall
      ? Math.max(10, Math.round((raporConfig.fontSizeBaris3 || 16) * 0.88))
      : (raporConfig.fontSizeBaris3 || 16);
    const fSize4 = isSmall
      ? Math.max(9, Math.round((raporConfig.fontSizeBaris4 || 11) * 0.9))
      : (raporConfig.fontSizeBaris4 || 11);

    const logoSize = raporConfig.ukuranLogoKop || "lg";
    const logoBoxClass =
      logoSize === "sm"
        ? isSmall ? "w-16 h-16" : "w-20 h-20"
        : logoSize === "md"
        ? isSmall ? "w-20 h-20" : "w-24 h-24"
        : logoSize === "xl"
        ? isSmall ? "w-28 h-28" : "w-32 h-32"
        : isSmall ? "w-24 h-24" : "w-28 h-28"; // Default "lg" (Ekstra Besar: 112px / 96px)

    return (
      <div
        className={`text-center pb-3 mb-4 ${
          isNone
            ? ""
            : isDouble
            ? "border-b-4 border-double border-[#000000]"
            : "border-b-2 border-[#000000]"
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-1">
          {/* Logo Kiri */}
          <div className={`${logoBoxClass} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
            {raporConfig.logoKiriUrl ? (
              <img
                src={raporConfig.logoKiriUrl}
                alt="Logo Kiri"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className={`${isSmall ? "h-14 w-14" : "h-18 w-18"} rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm`}>
                <GraduationCap className={`${isSmall ? "h-8 w-8" : "h-10 w-10"}`} />
              </div>
            )}
          </div>

          {/* Bagian Tulisan Tengah Kop Surat */}
          <div className="flex-1 text-center px-2">
            {raporConfig.yayasanNama && (
              <p
                style={{ fontSize: `${fSize1}px` }}
                className="font-bold tracking-wide uppercase text-slate-900 leading-tight"
              >
                {raporConfig.yayasanNama}
              </p>
            )}
            <h2
              style={{ fontSize: `${fSize2}px` }}
              className="font-bold uppercase tracking-wide text-slate-900 leading-tight mt-0.5"
            >
              {raporConfig.namaSekolah || profile.namaSekolah}
            </h2>
            {raporConfig.npsnAkreditasi && (
              <p
                style={{ fontSize: `${fSize3}px` }}
                className="font-bold uppercase tracking-wide text-slate-900 leading-tight mt-0.5"
              >
                {raporConfig.npsnAkreditasi}
              </p>
            )}
            {raporConfig.alamatKontak && (
              <p
                style={{ fontSize: `${fSize4}px` }}
                className="text-slate-600 max-w-xl mx-auto mt-1 leading-normal"
              >
                {raporConfig.alamatKontak}
              </p>
            )}
          </div>

          {/* Logo Kanan */}
          <div className={`${logoBoxClass} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
            {raporConfig.logoKananUrl ? (
              <img
                src={raporConfig.logoKananUrl}
                alt="Logo Kanan"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className={logoBoxClass} />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Komponen Tabel KKM & Interval Predikat Nilai Rapor
  const renderTabelKkmComponent = (isSmall = false) => {
    if (raporConfig.tampilkanTabelKkm === false) return null;

    const baseKkm = Math.max(1, Math.min(99, Number(raporConfig.nilaiStandarKkm) || 75));
    const kkmFontSize = isSmall
      ? Math.max(8, Math.round((raporConfig.fontSizeTabelKkm || 10) * 0.9))
      : (raporConfig.fontSizeTabelKkm || 10);
    const title = raporConfig.judulTabelKkm || "Kriteria Ketuntasan Minimal (KKM)";

    // Rumus interval predikat kurikulum: interval = (100 - KKM) / 3
    const interval = Math.max(1, Math.round((100 - baseKkm) / 3));
    const minC = baseKkm;
    const maxC = Math.min(99, baseKkm + interval - 1);
    const minB = maxC + 1;
    const maxB = Math.min(99, minB + interval - 1);
    const minA = Math.min(100, maxB + 1);

    const predikats = [
      { predikat: "A", rentang: `${minA} - 100`, keterangan: "Sangat Baik" },
      { predikat: "B", rentang: `${minB} - ${maxB}`, keterangan: "Baik" },
      { predikat: "C", rentang: `${minC} - ${maxC}`, keterangan: "Cukup" },
      { predikat: "D", rentang: `< ${baseKkm}`, keterangan: "Perlu Bimbingan" },
    ];

    return (
      <div className="w-full sm:w-80">
        <table
          className="rapor-print-table w-full border-collapse border border-[#000000]"
          style={{ fontSize: `${kkmFontSize}px` }}
        >
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold">
              <th
                colSpan={3}
                className="border border-[#000000] px-3 py-1 text-left uppercase tracking-wider"
                style={{ fontSize: `${Math.max(8, kkmFontSize - 1)}px` }}
              >
                <div className="flex items-center justify-between">
                  <span>{title}</span>
                  <span className="font-mono text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-100 border border-slate-400 font-bold">
                    KKM: {baseKkm}
                  </span>
                </div>
              </th>
            </tr>
            <tr className="bg-slate-50 text-slate-800 font-bold text-center">
              <th className="border border-[#000000] px-2 py-0.5 w-14">Predikat</th>
              <th className="border border-[#000000] px-2 py-0.5 w-24">Rentang</th>
              <th className="border border-[#000000] px-2 py-0.5 text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {predikats.map((row) => (
              <tr key={row.predikat} className="text-center">
                <td className="border border-[#000000] px-2 py-0.5 font-bold font-mono text-slate-900">
                  {row.predikat}
                </td>
                <td className="border border-[#000000] px-2 py-0.5 font-mono text-slate-800">
                  {row.rentang}
                </td>
                <td className="border border-[#000000] px-2 py-0.5 text-left font-medium text-slate-800">
                  {row.keterangan}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
    const calc = calculateSemesterGrade(n.tugas || 0, n.uts || 0, n.uas || 0);
    return {
      nilaiAkhir: calc.nilaiAkhir,
      predikat: calc.predikat,
      catatan: n.catatan || "Capaian kompetensi tuntas dengan baik.",
    };
  };

  // Helper untuk menentukan apakah record nilai memiliki data STS
  const isRecordStsFilled = (n: NilaiSiswa): boolean => {
    if (n.hasSts === false) return false;
    if (n.hasSts === true) return true;
    return typeof n.nilaiMid === "number" || (typeof n.uts === "number" && n.uts > 0);
  };

  // Helper untuk menentukan apakah record nilai memiliki data SAS
  const isRecordSasFilled = (n: NilaiSiswa): boolean => {
    if (n.hasSas === false) return false;
    if (n.hasSas === true) return true;
    return typeof n.uas === "number" && n.uas > 0 && typeof n.nilaiAkhir === "number" && n.nilaiAkhir > 0;
  };

  // Attendance resolution helper for student report card (presensi: Sakit, Izin, Alpa)
  const getStudentAttendance = (studentId: string, studentName?: string) => {
    const records = (presensiList || []).filter(
      (p) =>
        p.siswaId === studentId ||
        (p.siswaNama && studentName && p.siswaNama.trim().toLowerCase() === studentName.trim().toLowerCase())
    );
    const sakit = records.filter((p) => p.status === "Sakit").length;
    const izin = records.filter((p) => p.status === "Izin").length;
    const alpa = records.filter((p) => p.status === "Alpa").length;
    const hadir = records.filter((p) => p.status === "Hadir").length;
    return { sakit, izin, alpa, hadir, total: records.length };
  };

  // Filtered nilai based on search, selected filters, active tab semester, and assessment type
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
    const matchType =
      activeRaporTab === "semua"
        ? true
        : isTengah
        ? isRecordStsFilled(n)
        : isRecordSasFilled(n);

    return matchSearch && matchKelas && matchMapel && matchSemester && matchType;
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
          : n.mapel.toLowerCase() === selectedMapel.toLowerCase()) &&
        (activeRaporTab === "semua"
          ? true
          : isTengah
          ? isRecordStsFilled(n)
          : isRecordSasFilled(n))
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
    const { mapels: availableMapels } = getAvailableMapelForClass(defaultSiswa?.kelas || "");
    const defaultMapel = availableMapels[0]?.nama || (mapelList[0]?.nama || "Matematika");
    const isSas = !isTengah;
    setFormData({
      siswaId: defaultSiswa?.id || "",
      mapel: defaultMapel,
      semester: activeSemester,
      tugas: isSas ? 0 : 82,
      uts: isSas ? 0 : 80,
      uas: 0,
      catatanMid: isSas ? "" : "Menunjukkan pemahaman materi tengah semester yang baik dan aktif berdiskusi.",
      catatan: isSas ? "" : "Pertahankan ketekunan belajar dan tingkatkan literasi mandiri.",
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
      tugas: n.tugas || 0,
      uts: n.uts || 0,
      uas: n.uas || 0,
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
    const isSas = !isTengah;
    const uhVal = Number(formData.tugas) || 0;
    const stsVal = Number(formData.uts) || 0;
    const uasVal = Number(formData.uas) || 0;
    const isSasFilled = isSas ? (uasVal > 0 || uhVal > 0) : false;

    saveNilai({
      id: editingId || undefined,
      siswaId: siswa.id,
      siswaNama: siswa.nama,
      nisn: siswa.nisn,
      kelas: siswa.kelas,
      mapel: formData.mapel,
      semester: targetSemester,
      tahunAjaran: profile.tahunAjaranAktif,
      tugas: uhVal,
      uts: stsVal,
      uas: uasVal,
      nilaiMid,
      predikatMid,
      catatanMid: formData.catatanMid,
      nilaiAkhir: isSasFilled ? nilaiAkhir : 0,
      predikat: isSasFilled ? predikat : undefined,
      catatan: formData.catatan,
      hasSts: stsVal > 0,
      hasSas: isSasFilled,
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
    const isSasTab = tab === "sas-ganjil" || tab === "sas-genap";

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
        const hasSas = isRecordSasFilled(existing);
        return {
          siswaId: s.id,
          siswaNama: s.nama,
          nisn: s.nisn,
          kelas: s.kelas,
          kkm,
          tugas: isSasTab ? (hasSas ? (existing.tugas ?? 0) : 0) : (typeof existing.tugas === "number" ? existing.tugas : 80),
          uts: typeof existing.uts === "number" ? existing.uts : (isSasTab ? 0 : 80),
          uas: isSasTab ? (hasSas ? (existing.uas ?? 0) : 0) : (typeof existing.uas === "number" ? existing.uas : 0),
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
        tugas: isSasTab ? 0 : 80,
        uts: isSasTab ? 0 : 80,
        uas: 0,
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

    // Filter mapel yang sesuai dengan Jadwal Pelajaran & KBM kelas siswa ini
    const { mapels: classMapels } = getAvailableMapelForClass(targetSiswa.kelas);
    const finalSubjects = classMapels.length > 0 ? classMapels : mapelList;

    const existingStudentNilai = nilaiList.filter(
      (n) => n.siswaId === targetSiswaId && (n.semester || "Ganjil").toLowerCase() === sem.toLowerCase()
    );

    const isSasTab = !bulkIsTengah;

    const rows = finalSubjects.map((m) => {
      const existing = existingStudentNilai.find(
        (n) => n.mapel.toLowerCase() === m.nama.toLowerCase()
      );
      if (existing) {
        const hasSas = isRecordSasFilled(existing);
        return {
          mapel: m.nama,
          kkm: m.kkm,
          tugas: isSasTab ? (hasSas ? (existing.tugas ?? 0) : 0) : (typeof existing.tugas === "number" ? existing.tugas : 82),
          uts: typeof existing.uts === "number" ? existing.uts : (isSasTab ? 0 : 80),
          uas: isSasTab ? (hasSas ? (existing.uas ?? 0) : 0) : (typeof existing.uas === "number" ? existing.uas : 0),
          catatanMid: "",
          catatan: existing.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
          existingId: existing.id,
        };
      }
      return {
        mapel: m.nama,
        kkm: m.kkm,
        tugas: isSasTab ? 0 : 82,
        uts: isSasTab ? 0 : 80,
        uas: 0,
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
    const { mapels: classMapels } = getAvailableMapelForClass(newKelas);
    const isMapelStillAvailable = classMapels.some(
      (m) => m.nama.toLowerCase() === bulkSelectedMapel.toLowerCase()
    );
    const nextMapel = isMapelStillAvailable
      ? bulkSelectedMapel
      : classMapels[0]?.nama || (mapelList[0]?.nama || "Matematika");
    setBulkSelectedMapel(nextMapel);
    initBulkClassRows(newKelas, nextMapel, bulkAssessmentTab);
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

    const { mapels: initialClassMapels } = getAvailableMapelForClass(initialKelas);
    const initialMapel =
      selectedMapel !== "Semua" && initialClassMapels.some((m) => m.nama.toLowerCase() === selectedMapel.toLowerCase())
        ? selectedMapel
        : initialClassMapels[0]?.nama || (mapelList[0]?.nama || "Matematika");
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
      const existing = nilaiList.find((n) => n.id === row.existingId);
      const uhVal = Number(row.tugas) || 0;
      const stsVal = Number(row.uts) || (existing?.uts || 0);
      const uasVal = Number(row.uas) || 0;

      const { nilaiMid, predikatMid } = calculateMidGrade(stsVal);
      const { nilaiAkhir, predikat } = calculateSemesterGrade(uhVal, stsVal, uasVal);

      if (bulkIsTengah) {
        // Mode STS
        return {
          id: row.existingId,
          siswaId: row.siswaId,
          siswaNama: row.siswaNama,
          nisn: row.nisn,
          kelas: row.kelas,
          mapel: bulkSelectedMapel,
          semester: bulkActiveSemester,
          tahunAjaran: profile.tahunAjaranAktif,
          tugas: existing?.tugas || 0,
          uts: Number(row.uts) || 0,
          uas: existing?.uas || 0,
          nilaiMid,
          predikatMid,
          catatanMid: "",
          nilaiAkhir: existing?.hasSas ? (existing.nilaiAkhir || 0) : 0,
          predikat: existing?.hasSas ? existing.predikat : undefined,
          catatan: existing?.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
          hasSts: true,
          hasSas: existing?.hasSas || false,
        };
      }

      // Mode SAS
      const isSasFilled = uasVal > 0 || uhVal > 0;
      return {
        id: row.existingId,
        siswaId: row.siswaId,
        siswaNama: row.siswaNama,
        nisn: row.nisn,
        kelas: row.kelas,
        mapel: bulkSelectedMapel,
        semester: bulkActiveSemester,
        tahunAjaran: profile.tahunAjaranAktif,
        tugas: uhVal,
        uts: stsVal,
        uas: uasVal,
        nilaiMid: existing?.nilaiMid ?? nilaiMid,
        predikatMid: existing?.predikatMid ?? predikatMid,
        catatanMid: existing?.catatanMid || "",
        nilaiAkhir: isSasFilled ? nilaiAkhir : 0,
        predikat: isSasFilled ? predikat : undefined,
        catatan: row.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
        hasSts: existing?.hasSts ?? (stsVal > 0),
        hasSas: isSasFilled,
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
      const existing = nilaiList.find((n) => n.id === row.existingId);
      const uhVal = Number(row.tugas) || 0;
      const stsVal = Number(row.uts) || (existing?.uts || 0);
      const uasVal = Number(row.uas) || 0;

      const { nilaiMid, predikatMid } = calculateMidGrade(stsVal);
      const { nilaiAkhir, predikat } = calculateSemesterGrade(uhVal, stsVal, uasVal);

      if (bulkIsTengah) {
        // Mode STS
        return {
          id: row.existingId,
          siswaId: siswa.id,
          siswaNama: siswa.nama,
          nisn: siswa.nisn,
          kelas: siswa.kelas,
          mapel: row.mapel,
          semester: bulkActiveSemester,
          tahunAjaran: profile.tahunAjaranAktif,
          tugas: existing?.tugas || 0,
          uts: Number(row.uts) || 0,
          uas: existing?.uas || 0,
          nilaiMid,
          predikatMid,
          catatanMid: "",
          nilaiAkhir: existing?.hasSas ? (existing.nilaiAkhir || 0) : 0,
          predikat: existing?.hasSas ? existing.predikat : undefined,
          catatan: existing?.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
          hasSts: true,
          hasSas: existing?.hasSas || false,
        };
      }

      // Mode SAS
      const isSasFilled = uasVal > 0 || uhVal > 0;
      return {
        id: row.existingId,
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
        mapel: row.mapel,
        semester: bulkActiveSemester,
        tahunAjaran: profile.tahunAjaranAktif,
        tugas: uhVal,
        uts: stsVal,
        uas: uasVal,
        nilaiMid: existing?.nilaiMid ?? nilaiMid,
        predikatMid: existing?.predikatMid ?? predikatMid,
        catatanMid: existing?.catatanMid || "",
        nilaiAkhir: isSasFilled ? nilaiAkhir : 0,
        predikat: isSasFilled ? predikat : undefined,
        catatan: row.catatan || "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
        hasSts: existing?.hasSts ?? (stsVal > 0),
        hasSas: isSasFilled,
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

  // =========================================================================
  // LOGIKA INPUT NILAI DARI LEGER NILAI ROMBEL (MATRIKS 1 KELAS x MAPEL KELAS)
  // =========================================================================
  const prevTabRef = useRef(activeRaporTab);
  const prevKelasRef = useRef(selectedKelas);

  const initLegerInputScores = (
    kelasTarget: string,
    typeTarget: "tengah" | "akhir",
    semesterTarget: "Ganjil" | "Genap"
  ) => {
    const students = baseSiswaList.filter((s) => {
      if (teacherScope.isTeacher && teacherScope.assignedClass) {
        return isClassMatch(s.kelas, teacherScope.assignedClass);
      }
      if (kelasTarget === "Semua") return true;
      return isClassMatch(s.kelas, kelasTarget);
    });

    const { mapels: targetMapels } = getAvailableMapelForClass(kelasTarget);
    const activeMapels = targetMapels.length > 0 ? targetMapels : mapelList;

    const initialScores: Record<string, string | number> = {};
    students.forEach((s) => {
      activeMapels.forEach((m) => {
        const rec = nilaiList.find(
          (n) =>
            n.siswaId === s.id &&
            n.mapel?.trim().toLowerCase() === m.nama?.trim().toLowerCase() &&
            (n.semester || "Ganjil").trim().toLowerCase() === semesterTarget.trim().toLowerCase()
        );
        const key = `${s.id}_${m.nama}`;
        if (rec) {
          if (typeTarget === "tengah") {
            const val =
              typeof rec.uts === "number" && rec.uts > 0
                ? rec.uts
                : typeof rec.nilaiMid === "number" && rec.nilaiMid > 0
                ? rec.nilaiMid
                : rec.uts === 0
                ? 0
                : "";
            initialScores[key] = val;
          } else {
            const val =
              typeof rec.uas === "number" && rec.uas > 0
                ? rec.uas
                : typeof rec.nilaiAkhir === "number" && rec.nilaiAkhir > 0 && rec.hasSas
                ? rec.nilaiAkhir
                : rec.uas === 0
                ? 0
                : "";
            initialScores[key] = val;
          }
        } else {
          initialScores[key] = "";
        }
      });
    });
    setLegerInputScores(initialScores);
    setHasUnsavedChanges(false);
  };

  // Sinkronisasi otomatis data nilai ke state leger saat load atau ganti filter kelas / tab
  useEffect(() => {
    const isFilterChanged =
      prevTabRef.current !== activeRaporTab ||
      prevKelasRef.current !== selectedKelas;

    prevTabRef.current = activeRaporTab;
    prevKelasRef.current = selectedKelas;

    // Jika filter kelas/tab berganti, selalu muat data baru
    // Jika hanya nilaiList.length berubah tapi ada perubahan belum disimpan, jangan timpa
    if (!isFilterChanged && hasUnsavedChanges) {
      return;
    }

    const targetKelas =
      teacherScope.isTeacher && teacherScope.assignedClass
        ? teacherScope.assignedClass
        : selectedKelas;
    initLegerInputScores(
      targetKelas,
      isTengah ? "tengah" : "akhir",
      activeSemester
    );
  }, [
    selectedKelas,
    activeRaporTab,
    teacherScope.assignedClass,
    nilaiList.length,
    activeSemester,
    isTengah,
  ]);

  const handleLegerScoreChange = (
    siswaId: string,
    mapelNama: string,
    valueStr: string
  ) => {
    const key = `${siswaId}_${mapelNama}`;
    let cleanVal = valueStr;
    if (cleanVal !== "") {
      let num = Number(cleanVal);
      if (num > 100) num = 100;
      if (num < 0) num = 0;
      cleanVal = String(num);
    }
    setLegerInputScores((prev) => ({
      ...prev,
      [key]: cleanVal,
    }));
    setHasUnsavedChanges(true);
  };

  const handleFillKkmForMapel = (mapelNama: string, kkmValue: number) => {
    const targetStudents = isBatchRaporOpen ? batchStudents : activeTargetStudents;
    let count = 0;
    setLegerInputScores((prev) => {
      const updated = { ...prev };
      targetStudents.forEach((s) => {
        const key = `${s.id}_${mapelNama}`;
        if (
          updated[key] === "" ||
          updated[key] === undefined ||
          Number(updated[key]) === 0
        ) {
          updated[key] = kkmValue;
          count++;
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
    setNotification({
      type: "success",
      message: `Nilai KKM (${kkmValue}) berhasil diisikan untuk ${count} siswa yang nilainya masih kosong pada mapel "${mapelNama}". Pastikan klik "Simpan Nilai Leger".`,
    });
  };

  const handleFillAllKkmEmpty = () => {
    let count = 0;
    const targetStudents = isBatchRaporOpen ? batchStudents : activeTargetStudents;
    const targetMapels = isBatchRaporOpen ? currentLegerMapelList : activeLegerMapels;
    const targetKelas = isBatchRaporOpen ? batchSelectedKelas : selectedKelas;

    setLegerInputScores((prev) => {
      const updated = { ...prev };
      targetStudents.forEach((s) => {
        targetMapels.forEach((m) => {
          const key = `${s.id}_${m.nama}`;
          if (
            updated[key] === "" ||
            updated[key] === undefined ||
            Number(updated[key]) === 0
          ) {
            updated[key] = m.kkm || 75;
            count++;
          }
        });
      });
      return updated;
    });
    setHasUnsavedChanges(true);
    setNotification({
      type: "success",
      message: `Berhasil mengisi ${count} nilai kosong dengan standar KKM mata pelajaran Kelas ${targetKelas === "Semua" ? "Semua Kelas" : targetKelas}. Pastikan klik "Simpan Nilai Leger".`,
    });
  };

  // Unduh Format / Template Excel Leger Rombel (dilengkapi daftar siswa dan mapel kelas aktif)
  const handleDownloadLegerExcelTemplate = () => {
    try {
      const targetStudents = isBatchRaporOpen ? batchStudents : activeTargetStudents;
      const targetMapels = isBatchRaporOpen ? currentLegerMapelList : activeLegerMapels;
      const targetKelas = isBatchRaporOpen ? batchSelectedKelas : selectedKelas;
      const targetSemester = isBatchRaporOpen ? batchRaporSemester : activeSemester;
      const targetType = isBatchRaporOpen ? batchRaporType : (isTengah ? "tengah" : "akhir");

      const classNameClean =
        targetKelas === "Semua"
          ? "Semua_Kelas"
          : targetKelas.replace(/[^a-zA-Z0-9]/g, "_");
      const typeLabel = targetType === "tengah" ? "STS_Mid" : "SAS_Akhir";
      const fileName = `Format_Leger_Nilai_${classNameClean}_${typeLabel}_Sem_${targetSemester}.xlsx`;

      // Bangun baris data Excel terstruktur
      const rows = targetStudents.map((s, idx) => {
        const row: Record<string, string | number> = {
          "No": idx + 1,
          "NISN": s.nisn || "",
          "Nama Siswa": s.nama,
          "Kelas": s.kelas,
        };

        targetMapels.forEach((m) => {
          const key = `${s.id}_${m.nama}`;
          const currentVal = legerInputScores[key] ?? "";
          row[m.nama] = currentVal !== "" ? Number(currentVal) : "";
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Atur lebar kolom otomatis agar rapi saat dibuka di Microsoft Excel
      const colWidths = [
        { wch: 6 },  // No
        { wch: 16 }, // NISN
        { wch: 30 }, // Nama Siswa
        { wch: 20 }, // Kelas
        ...targetMapels.map((m) => ({
          wch: Math.max(m.nama.length + 4, 12),
        })),
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai Leger");
      XLSX.writeFile(workbook, fileName);

      setNotification({
        type: "success",
        message: `Format Excel (${fileName}) berhasil diunduh. Silakan isi nilai siswa pada file tersebut dan klik "Impor Excel" untuk mengunggah.`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Gagal mengunduh format Excel: ${err?.message || err}`,
      });
    }
  };

  // Proses Unggah & Impor File Excel Leger Rombel
  const handleProcessLegerExcelFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLegerImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("File Excel tidak memiliki lembar kerja (worksheet).");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      // Deteksi baris header secara dinamis jika file memiliki baris kop/judul di atas tabel (misal baris 1-3)
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
        const rowStr = (rawRows[i] || []).map((c) => String(c).toLowerCase()).join(" ");
        if (
          rowStr.includes("nama") ||
          rowStr.includes("nisn") ||
          rowStr.includes("siswa") ||
          rowStr.includes("peserta didik")
        ) {
          headerRowIndex = i;
          break;
        }
      }

      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        defval: "",
      });

      if (jsonData.length === 0) {
        throw new Error("File Excel kosong atau format tabel nilai tidak terdeteksi.");
      }

      let importedScoresCount = 0;
      let matchedStudentsCount = 0;

      const cleanNorm = (str: string) =>
        String(str || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

      const cleanDigits = (str: string) =>
        String(str || "")
          .replace(/\D/g, "")
          .replace(/^0+/, "");

      const IGNORED_COLS = new Set([
        "no",
        "nomor",
        "no.",
        "nisn",
        "nis",
        "noinduk",
        "nomorinduk",
        "nama",
        "namasiswa",
        "namapesertadidik",
        "siswa",
        "pesertadidik",
        "kelas",
        "rombel",
        "peringkat",
        "rank",
        "total",
        "ratarata",
        "rata2",
        "status",
        "kkm",
        "predikat",
        "keterangan",
        "aksi",
      ]);

      const updatedScores: Record<string, string | number> = {
        ...legerInputScores,
      };

      const targetStudents = isBatchRaporOpen ? batchStudents : activeTargetStudents;
      const targetMapels = isBatchRaporOpen ? currentLegerMapelList : activeLegerMapels;

      jsonData.forEach((row) => {
        const rowKeys = Object.keys(row);
        const nisnKey = rowKeys.find((k) => {
          const norm = cleanNorm(k);
          return norm === "nisn" || norm === "nis" || norm === "noinduk" || norm === "nomorinduk";
        });
        const namaKey = rowKeys.find((k) => {
          const norm = cleanNorm(k);
          return (
            norm === "namasiswa" ||
            norm === "nama" ||
            norm === "namapesertadidik" ||
            norm === "siswa" ||
            norm === "pesertadidik" ||
            norm.includes("namasiswa")
          );
        });

        const rawNisn = nisnKey ? String(row[nisnKey]).trim() : "";
        const rawNama = namaKey ? String(row[namaKey]).trim() : "";

        // Cari siswa yang cocok di targetStudents
        const student = targetStudents.find((s) => {
          // 1. Cek NISN
          if (rawNisn && s.nisn) {
            const rawNisnClean = cleanDigits(rawNisn);
            const sNisnClean = cleanDigits(s.nisn);
            if (rawNisnClean.length >= 3 && rawNisnClean === sNisnClean) return true;
            if (rawNisn.trim() === s.nisn.trim()) return true;
          }

          // 2. Cek Nama Siswa (case-insensitive & whitespace tolerant)
          if (rawNama) {
            const sNamaNorm = cleanNorm(s.nama);
            const rowNamaNorm = cleanNorm(rawNama);
            if (sNamaNorm === rowNamaNorm) return true;
            if (sNamaNorm.length >= 4 && rowNamaNorm.length >= 4) {
              if (sNamaNorm.includes(rowNamaNorm) || rowNamaNorm.includes(sNamaNorm)) return true;
            }
          }
          return false;
        });

        if (!student) return;
        matchedStudentsCount++;

        // Cocokkan setiap mata pelajaran di targetMapels
        targetMapels.forEach((m) => {
          const mapelNorm = cleanNorm(m.nama);

          // Cari kolom di Excel yang bukan metadata dan cocok dengan mapel
          const matchedColKey = rowKeys.find((k) => {
            const colNorm = cleanNorm(k.replace(/\(.*?\)/g, ""));
            if (!colNorm || IGNORED_COLS.has(colNorm)) return false;

            if (colNorm === mapelNorm) return true;

            // Alias & singkatan umum pelajaran
            if (mapelNorm.includes("agama") && (colNorm === "pai" || colNorm === "agama" || colNorm === "agamaislam")) return true;
            if (mapelNorm.includes("matematika") && (colNorm === "mtk" || colNorm === "math")) return true;
            if (mapelNorm.includes("bahasaindonesia") && (colNorm === "bindonesia" || colNorm === "bindo" || colNorm === "bi")) return true;
            if (mapelNorm.includes("bahasainggris") && (colNorm === "binggris" || colNorm === "bing")) return true;
            if (mapelNorm.includes("bahasaarab") && (colNorm === "barab" || colNorm === "arab")) return true;
            if (mapelNorm.includes("jasmani") && (colNorm === "pjok" || colNorm === "penjas" || colNorm === "olahraga")) return true;
            if (mapelNorm.includes("pancasila") && (colNorm === "pkn" || colNorm === "ppkn")) return true;
            if (mapelNorm.includes("alam") && (colNorm === "ipa" || colNorm === "ipas")) return true;
            if (mapelNorm.includes("sosial") && (colNorm === "ips")) return true;
            if (mapelNorm.includes("seni") && (colNorm === "sbdp" || colNorm === "senirupa" || colNorm === "senibudaya")) return true;
            if (mapelNorm.includes("quran") && (colNorm === "alquran" || colNorm === "quran")) return true;
            if (mapelNorm.includes("fikih") && (colNorm === "fiqih")) return true;

            // Partial match jika panjang nama kolom >= 4 karakter
            if (colNorm.length >= 4 && mapelNorm.length >= 4) {
              if (colNorm.includes(mapelNorm) || mapelNorm.includes(colNorm)) return true;
            }
            return false;
          });

          if (matchedColKey !== undefined) {
            const rawVal = row[matchedColKey];
            if (rawVal !== "" && rawVal !== undefined && rawVal !== null) {
              const numVal = Number(String(rawVal).replace(",", "."));
              if (!isNaN(numVal) && numVal >= 0 && numVal <= 100) {
                const key = `${student.id}_${m.nama}`;
                updatedScores[key] = numVal;
                importedScoresCount++;
              }
            }
          }
        });
      });

      if (matchedStudentsCount === 0) {
        throw new Error(
          "Tidak ada data siswa yang cocok dari file Excel. Pastikan kolom NISN atau Nama Siswa sesuai dengan siswa di kelas ini."
        );
      }

      if (importedScoresCount === 0) {
        throw new Error(
          `Siswa (${matchedStudentsCount} anak) berhasil dikenali, namun tidak ada nilai angka (0-100) yang terdeteksi di kolom mata pelajaran. Pastikan kolom mata pelajaran sesuai dengan mapel kelas ini.`
        );
      }

      setLegerInputScores(updatedScores);
      setHasUnsavedChanges(true);
      setNotification({
        type: "success",
        message: `Berhasil mengimpor nilai untuk ${matchedStudentsCount} siswa (${importedScoresCount} nilai mata pelajaran). Periksa nilai pada tabel dan klik "Simpan Nilai Leger" untuk menyimpan ke sistem.`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Gagal mengimpor Excel: ${err?.message || err}`,
      });
    } finally {
      setIsLegerImporting(false);
      if (e.target) {
        e.target.value = "";
      }
      if (legerFileInputRef.current) legerFileInputRef.current.value = "";
      if (mainLegerFileInputRef.current) mainLegerFileInputRef.current.value = "";
    }
  };

  const handleSaveLegerScores = async () => {
    setIsLegerSaving(true);
    try {
      const itemsToSave: (Omit<NilaiSiswa, "id"> & { id?: string })[] = [];

      const targetStudents = isBatchRaporOpen ? batchStudents : activeTargetStudents;
      const targetMapels = isBatchRaporOpen ? currentLegerMapelList : activeLegerMapels;
      const targetSemester = isBatchRaporOpen ? batchRaporSemester : activeSemester;
      const targetType = isBatchRaporOpen ? batchRaporType : (isTengah ? "tengah" : "akhir");
      const targetKelas = isBatchRaporOpen ? batchSelectedKelas : selectedKelas;

      targetStudents.forEach((s) => {
        targetMapels.forEach((m) => {
          const key = `${s.id}_${m.nama}`;
          const rawVal = legerInputScores[key];

          const existing = nilaiList.find(
            (n) =>
              n.siswaId === s.id &&
              n.mapel?.trim().toLowerCase() === m.nama?.trim().toLowerCase() &&
              (n.semester || "Ganjil").trim().toLowerCase() === targetSemester.trim().toLowerCase()
          );

          if (rawVal !== "" && rawVal !== undefined) {
            const numVal = Number(rawVal);
            if (!isNaN(numVal) && numVal >= 0 && numVal <= 100) {
              if (targetType === "tengah") {
                const { nilaiMid, predikatMid } = calculateMidGrade(numVal);
                itemsToSave.push({
                  id: existing?.id,
                  siswaId: s.id,
                  siswaNama: s.nama,
                  nisn: s.nisn,
                  kelas: s.kelas,
                  mapel: m.nama,
                  semester: targetSemester,
                  tahunAjaran: profile.tahunAjaranAktif,
                  tugas: existing?.tugas || 0,
                  uts: numVal,
                  uas: existing?.uas || 0,
                  nilaiMid: numVal,
                  predikatMid,
                  catatanMid:
                    existing?.catatanMid || "Mengikuti pembelajaran dengan baik.",
                  nilaiAkhir: existing?.hasSas ? (existing.nilaiAkhir || 0) : 0,
                  predikat: existing?.hasSas ? existing.predikat : undefined,
                  catatan:
                    existing?.catatan ||
                    "Memiliki pemahaman konsep yang baik, pertahankan prestasimu.",
                  hasSts: true,
                  hasSas: existing?.hasSas || false,
                });
              } else {
                // Mode SAS (Sumatif Akhir Semester)
                const uhVal = existing?.tugas || numVal;
                const stsVal = existing?.uts || numVal;
                const { nilaiAkhir, predikat } = calculateSemesterGrade(
                  uhVal,
                  stsVal,
                  numVal
                );
                itemsToSave.push({
                  id: existing?.id,
                  siswaId: s.id,
                  siswaNama: s.nama,
                  nisn: s.nisn,
                  kelas: s.kelas,
                  mapel: m.nama,
                  semester: targetSemester,
                  tahunAjaran: profile.tahunAjaranAktif,
                  tugas: uhVal,
                  uts: stsVal,
                  uas: numVal,
                  nilaiMid: existing?.nilaiMid || stsVal,
                  predikatMid:
                    existing?.predikatMid || calculateMidGrade(stsVal).predikatMid,
                  catatanMid: existing?.catatanMid || "",
                  nilaiAkhir,
                  predikat,
                  catatan:
                    existing?.catatan ||
                    "Capaian kompetensi tuntas dengan baik, pertahankan prestasimu.",
                  hasSts: existing?.hasSts || false,
                  hasSas: true,
                });
              }
            }
          }
        });
      });

      if (itemsToSave.length > 0) {
        bulkSaveNilai(itemsToSave);

        // Update state legerInputScores agar nilai tetap ada di tabel setelah tombol simpan diklik
        const updatedInitial: Record<string, string | number> = { ...legerInputScores };
        itemsToSave.forEach((item) => {
          const val = (targetType === "tengah" ? item.uts : item.uas) ?? "";
          updatedInitial[`${item.siswaId}_${item.mapel}`] = val;
        });
        setLegerInputScores(updatedInitial);
        setHasUnsavedChanges(false);

        setNotification({
          type: "success",
          message: `Berhasil menyimpan ${itemsToSave.length} rekaman nilai dari Leger untuk ${targetStudents.length} siswa Kelas ${targetKelas === "Semua" ? "Semua Kelas" : targetKelas} (${targetType === "tengah" ? "STS" : "SAS"} - Semester ${targetSemester})! Data telah tersimpan di sistem & database cloud.`,
        });
      } else {
        setNotification({
          type: "error",
          message: "Tidak ada data nilai yang diisi untuk disimpan.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Gagal menyimpan nilai leger: ${err.message}`,
      });
    } finally {
      setIsLegerSaving(false);
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

  // Listener tombol Escape untuk menutup modal pratinjau cetak rapor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (raporSiswa) setRaporSiswa(null);
        else if (isBatchRaporOpen) setIsBatchRaporOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [raporSiswa, isBatchRaporOpen]);

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

  // Export Single Student Rapor to Excel (.xlsx / .xls)
  const handleExportSingleRapor = (
    siswa: Siswa,
    type?: JenisRapor,
    sem?: "Ganjil" | "Genap",
    format: "xlsx" | "xls" = "xlsx"
  ) => {
    try {
      const activeType = type || raporPrintType || activeAssessmentType;
      const activeSem = sem || raporPrintSemester || activeSemester;
      const studentRecords = nilaiList.filter(
        (n) =>
          n.siswaId === siswa.id &&
          (n.semester || "Ganjil").toLowerCase() === activeSem.toLowerCase() &&
          (activeType === "tengah" ? isRecordStsFilled(n) : isRecordSasFilled(n))
      );
      const att = getStudentAttendance(siswa.id, siswa.nama);
      const fileName = exportSingleRaporXls(
        {
          siswa,
          type: activeType,
          semester: activeSem,
          studentRecords,
          mapelList,
          profile,
          kelasList,
          guruList,
          attendance: att,
          raporConfig,
        },
        format
      );
      setNotification({
        type: "success",
        message: `Rapor ${activeType.toUpperCase()} untuk "${siswa.nama}" berhasil diekspor ke format Excel (${fileName}).`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Gagal mengekspor rapor ke Excel: ${err?.message || err}`,
      });
    }
  };

  // Export Batch Student Rapor to Excel (.xlsx / .xls)
  const handleExportBatchRapor = (format: "xlsx" | "xls" = "xlsx") => {
    try {
      if (batchStudents.length === 0) {
        setNotification({
          type: "error",
          message: "Tidak ada siswa pada rombel yang dipilih untuk diekspor.",
        });
        return;
      }
      const fileName = exportBatchRaporXls(
        {
          batchStudents,
          type: batchRaporType,
          semester: batchRaporSemester,
          selectedKelas: batchSelectedKelas,
          nilaiList,
          mapelList,
          profile,
          kelasList,
          guruList,
          getAttendance: getStudentAttendance,
          raporConfig,
        },
        format
      );
      setNotification({
        type: "success",
        message: `Bundel Rapor ${batchRaporType.toUpperCase()} kelas "${batchSelectedKelas}" berhasil diekspor ke Excel (${fileName}) lengkap dengan rekap nilai & lembar rapor per siswa.`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Gagal mengekspor bundel rapor ke Excel: ${err?.message || err}`,
      });
    }
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

  // Helper to determine subject category in report card: Wajib, Muatan Lokal, or Kecerdasan Al-Qur'an
  const getMapelSection = (mapelName: string): "wajib" | "mulok" | "quran" => {
    const norm = (mapelName || "").toLowerCase().trim();
    const mapelObj = mapelList.find((m) => m.nama.toLowerCase().trim() === norm);
    if (mapelObj) {
      if (mapelObj.kategori === "Kecerdasan Al-Qur'an") return "quran";
      if (mapelObj.kategori === "Muatan Lokal") return "mulok";
      if (mapelObj.kategori === "Wajib" || mapelObj.kategori === "Peminatan") {
        if (
          norm.includes("al-qur'an") ||
          norm.includes("al-quran") ||
          norm.includes("alquran") ||
          norm.includes("tahfidz") ||
          norm.includes("tahsin") ||
          norm.includes("tartil") ||
          norm.includes("tilawah") ||
          norm.includes("btq") ||
          norm.includes("baca tulis al-qur'an") ||
          norm.includes("kecerdasan al-qur'an")
        ) {
          return "quran";
        }
        return "wajib";
      }
    }
    // Check keywords for Al-Qur'an
    if (
      norm.includes("al-qur'an") ||
      norm.includes("al-quran") ||
      norm.includes("alquran") ||
      norm.includes("tahfidz") ||
      norm.includes("tahsin") ||
      norm.includes("tartil") ||
      norm.includes("tilawah") ||
      norm.includes("tajwid") ||
      norm.includes("btq") ||
      norm.includes("baca tulis al-qur'an") ||
      norm.includes("kecerdasan al-qur'an")
    ) {
      return "quran";
    }
    // Check keywords for Muatan Lokal
    if (
      norm.includes("muatan lokal") ||
      norm.includes("mulok") ||
      norm.includes("bahasa jawa") ||
      norm.includes("bahasa sunda") ||
      norm.includes("bahasa daerah") ||
      norm.includes("plbj") ||
      norm.includes("kemuhammadiyahan") ||
      norm.includes("ke-nu-an")
    ) {
      return "mulok";
    }
    return "wajib";
  };

  const isMuatanLokal = (mapelName: string): boolean => getMapelSection(mapelName) === "mulok";

  // Generate official Islamic formatted WhatsApp message for student report
  const generateRaporWhatsAppText = (siswa: Siswa, type: JenisRapor, sem: "Ganjil" | "Genap" = waRaporSemester) => {
    const isMid = type === "tengah";
    const records = nilaiList.filter(
      (n) =>
        n.siswaId === siswa.id &&
        (n.semester || "Ganjil").toLowerCase() === sem.toLowerCase() &&
        (isMid ? isRecordStsFilled(n) : isRecordSasFilled(n))
    );
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
      const wajibRecs = records.filter((r) => getMapelSection(r.mapel) === "wajib");
      const mulokRecs = records.filter((r) => getMapelSection(r.mapel) === "mulok");
      const quranRecs = records.filter((r) => getMapelSection(r.mapel) === "quran");

      let hasPrevious = false;

      if (wajibRecs.length > 0) {
        msg += `*A. Muatan Wajib*\n`;
        wajibRecs.forEach((r, i) => {
          const score = isMid ? getStudentMid(r).nilaiMid : getStudentAkhir(r).nilaiAkhir;
          const pred = isMid ? getStudentMid(r).predikatMid : getStudentAkhir(r).predikat;
          const note = isMid ? "" : getStudentAkhir(r).catatan;
          msg += `${i + 1}. *${r.mapel}*: ${score} (${pred})\n`;
          if (!isMid && note && note !== "-") {
            msg += `   _Catatan:_ "${note}"\n`;
          }
        });
        hasPrevious = true;
      }

      if (mulokRecs.length > 0) {
        if (hasPrevious) msg += `\n`;
        msg += `*B. Muatan Lokal*\n`;
        mulokRecs.forEach((r, i) => {
          const score = isMid ? getStudentMid(r).nilaiMid : getStudentAkhir(r).nilaiAkhir;
          const pred = isMid ? getStudentMid(r).predikatMid : getStudentAkhir(r).predikat;
          const note = isMid ? "" : getStudentAkhir(r).catatan;
          msg += `${i + 1}. *${r.mapel}*: ${score} (${pred})\n`;
          if (!isMid && note && note !== "-") {
            msg += `   _Catatan:_ "${note}"\n`;
          }
        });
        hasPrevious = true;
      }

      if (quranRecs.length > 0) {
        if (hasPrevious) msg += `\n`;
        msg += `*C. Kecerdasan Al-Qur'an*\n`;
        quranRecs.forEach((r, i) => {
          const score = isMid ? getStudentMid(r).nilaiMid : getStudentAkhir(r).nilaiAkhir;
          const pred = isMid ? getStudentMid(r).predikatMid : getStudentAkhir(r).predikat;
          const note = isMid ? "" : getStudentAkhir(r).catatan;
          msg += `${i + 1}. *${r.mapel}*: ${score} (${pred})\n`;
          if (!isMid && note && note !== "-") {
            msg += `   _Catatan:_ "${note}"\n`;
          }
        });
      }
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📊 *Rata-rata Nilai:* ${avgScore} / 100\n`;
    msg += `🌟 *Predikat Umum:* ${generalPredicate}\n\n`;

    const att = getStudentAttendance(siswa.id, siswa.nama);
    msg += `📋 *Ketidakhadiran (Presensi):*\n`;
    msg += `• Sakit: ${att.sakit} hari\n`;
    msg += `• Izin: ${att.izin} hari\n`;
    msg += `• Tanpa Keterangan: ${att.alpa} hari\n\n`;

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

  // Nilai records for selected rapor siswa filtered by chosen print semester and type
  const studentNilaiRecords = raporSiswa
    ? nilaiList.filter(
        (n) =>
          n.siswaId === raporSiswa.id &&
          (n.semester || "Ganjil").toLowerCase() === (raporPrintSemester || "Ganjil").toLowerCase() &&
          (raporPrintType === "tengah" ? isRecordStsFilled(n) : isRecordSasFilled(n))
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
              setIsLegerEditMode(false);
              setBatchRaporType(isTengah ? "tengah" : "akhir");
              setBatchRaporSemester(activeSemester);
              const targetKelas =
                teacherScope.isTeacher && teacherScope.assignedClass
                  ? teacherScope.assignedClass
                  : selectedKelas !== "Semua"
                  ? selectedKelas
                  : kelasList[0]?.nama || "Semua";
              setBatchSelectedKelas(targetKelas);
              setIsBatchRaporOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Leger Nilai Rombel</span>
          </button>

          {/* Tombol Simpan Nilai Leger */}
          <button
            onClick={handleSaveLegerScores}
            disabled={isLegerSaving}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Simpan seluruh perubahan nilai pada tabel leger ke sistem & cloud database"
          >
            {isLegerSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isLegerSaving ? "Menyimpan Nilai..." : "Simpan Nilai Leger"}</span>
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

        {/* Tombol Khusus Format Rapor & Live Preview (Hanya Admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsFormatRaporModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 active:scale-95 border border-amber-600 ml-auto sm:ml-0"
            title="Pengaturan Format Cetak Rapor & Pratinjau Langsung (Live Preview)"
          >
            <Sliders className="h-4 w-4 text-white" />
            <span>Format Rapor</span>
          </button>
        )}
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
              onChange={(e) => {
                const newK = e.target.value;
                setSelectedKelas(newK);
                if (newK !== "Semua" && selectedMapel !== "Semua") {
                  const { mapels: km } = getAvailableMapelForClass(newK);
                  if (!km.some((m) => m.nama.toLowerCase() === selectedMapel.toLowerCase())) {
                    setSelectedMapel("Semua");
                  }
                }
              }}
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

          {(() => {
            const activeFilterKelas = teacherScope.isTeacher && teacherScope.assignedClass
              ? teacherScope.assignedClass
              : selectedKelas;
            const { mapels: filteredMapelOptions, isScheduled: isFilterScheduled } = getAvailableMapelForClass(activeFilterKelas);

            return (
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none font-medium"
              >
                <option value="Semua">
                  Semua Mapel {activeFilterKelas !== "Semua" ? `(Kelas ${activeFilterKelas})` : ""}
                </option>
                {filteredMapelOptions.map((m) => (
                  <option key={m.id} value={m.nama}>
                    {m.nama} {isFilterScheduled && activeFilterKelas !== "Semua" ? "(Jadwal KBM)" : ""}
                  </option>
                ))}
              </select>
            );
          })()}

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

      {/* Nilai Table Container: Mode Matriks Leger & Mode Ringkasan */}
      {(() => {
        // Kalkulasi live ranking siswa untuk mode leger
        const rankedStudentIds = (() => {
          const scoresWithAvg = filteredSiswa.map((s) => {
            const scs = activeLegerMapels.map((m) => {
              const raw = legerInputScores[`${s.id}_${m.nama}`];
              if (raw !== "" && raw !== undefined) {
                const num = Number(raw);
                return isNaN(num) ? 0 : num;
              }
              return 0;
            });
            const filled = scs.filter((v) => v > 0);
            const avg = filled.length > 0 ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;
            return { id: s.id, avg };
          });
          scoresWithAvg.sort((a, b) => b.avg - a.avg);
          const rankMap = new Map<string, number>();
          scoresWithAvg.forEach((item, idx) => {
            rankMap.set(item.id, idx + 1);
          });
          return rankMap;
        })();

        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
            {/* Top Toolbar Tabel Leger & Ringkasan */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-sm shrink-0">
                  <TableProperties className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {mainTableViewMode === "leger"
                        ? "Input Nilai Langsung Matriks Leger"
                        : "Ringkasan Status Pengisian Nilai Siswa"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {isTengah ? "STS (Mid)" : "SAS (Akhir)"} &bull; Semester {activeSemester}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                        Ada Nilai Belum Disimpan
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {mainTableViewMode === "leger"
                      ? "Ketik nilai (0-100) langsung pada sel mapel. Total, rata-rata, predikat, dan ketuntasan terhitung otomatis."
                      : "Daftar ringkasan keterisian nilai per peserta didik."}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* Mode Switcher */}
                <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMainTableViewMode("leger")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      mainTableViewMode === "leger"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <TableProperties className="h-3.5 w-3.5" />
                    <span>Matriks Leger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainTableViewMode("ringkasan")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      mainTableViewMode === "ringkasan"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Ringkasan Siswa</span>
                  </button>
                </div>

                {mainTableViewMode === "leger" && (
                  <>
                    {/* Format Excel */}
                    <button
                      type="button"
                      onClick={handleDownloadLegerExcelTemplate}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                      title="Unduh format tabel Excel untuk pengisian offline"
                    >
                      <Download className="h-3.5 w-3.5 text-teal-600" />
                      <span className="hidden md:inline">Format Excel</span>
                    </button>

                    {/* Impor Excel */}
                    <input
                      ref={mainLegerFileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleProcessLegerExcelFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => mainLegerFileInputRef.current?.click()}
                      disabled={isLegerImporting}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm disabled:opacity-50"
                      title="Impor nilai dari file Excel ke tabel leger"
                    >
                      {isLegerImporting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-indigo-600" />
                      )}
                      <span className="hidden md:inline">{isLegerImporting ? "Mengimpor..." : "Impor Excel"}</span>
                    </button>

                    {/* Isi KKM Kosong */}
                    <button
                      type="button"
                      onClick={handleFillAllKkmEmpty}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                      title="Otomatis isi seluruh nilai kosong dengan standar KKM mapel"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span>Isi KKM Kosong</span>
                    </button>

                    {/* Simpan Nilai Leger */}
                    <button
                      type="button"
                      onClick={handleSaveLegerScores}
                      disabled={isLegerSaving || isLegerImporting}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                      title="Simpan seluruh perubahan nilai pada tabel leger ke sistem & database cloud"
                    >
                      {isLegerSaving ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>{isLegerSaving ? "Menyimpan..." : "Simpan Nilai Leger"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TABEL 1: MODE MATRIKS LEGER (INPUT LANGSUNG) */}
            {mainTableViewMode === "leger" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-2 py-3 text-center w-9">No</th>
                      <th className="px-3 py-3 min-w-[170px]">Peserta Didik</th>
                      <th className="px-2 py-3 text-center w-16">Kelas</th>
                      {activeLegerMapels.map((m) => (
                        <th
                          key={m.id}
                          className="px-1.5 py-2.5 text-center min-w-[72px] border-l border-slate-200 dark:border-slate-700/60"
                          title={`${m.nama} (KKM: ${m.kkm || 75})`}
                        >
                          <span className="block truncate max-w-[72px] font-extrabold text-slate-800 dark:text-slate-100">
                            {m.kode || m.nama.substring(0, 4).toUpperCase()}
                          </span>
                          <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400 block">
                            KKM {m.kkm || 75}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFillKkmForMapel(m.nama, m.kkm || 75)}
                            className="mt-1 block mx-auto text-[8px] leading-tight px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 cursor-pointer no-print transition-all"
                            title={`Isi otomatis nilai kosong pada mapel ${m.nama} dengan KKM (${m.kkm || 75})`}
                          >
                            Isi KKM
                          </button>
                        </th>
                      ))}
                      <th className="px-2 py-3 text-center bg-slate-100 dark:bg-slate-800/80 w-16 border-l border-slate-200 dark:border-slate-700 font-bold">
                        Total
                      </th>
                      <th className="px-2 py-3 text-center bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-black w-14">
                        Rata2
                      </th>
                      <th className="px-2 py-3 text-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 font-bold w-12">
                        Rank
                      </th>
                      <th className="px-2 py-3 text-center w-20">Status</th>
                      <th className="px-3 py-3 text-right min-w-[130px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredSiswa.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activeLegerMapels.length + 8}
                          className="px-5 py-12 text-center text-slate-400"
                        >
                          Tidak ada peserta didik yang sesuai dengan kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSiswa.map((s, index) => {
                        const studentScores = activeLegerMapels.map((m) => {
                          const key = `${s.id}_${m.nama}`;
                          const raw = legerInputScores[key];
                          if (raw !== "" && raw !== undefined) {
                            const num = Number(raw);
                            return isNaN(num) ? null : num;
                          }
                          return null;
                        });

                        const filledScores = studentScores.filter((sc): sc is number => sc !== null && sc > 0);
                        const studentTotal = filledScores.reduce((a, b) => a + b, 0);
                        const studentAvg =
                          filledScores.length > 0 ? Math.round(studentTotal / filledScores.length) : 0;
                        const studentPredikat =
                          filledScores.length > 0
                            ? isTengah
                              ? calculateMidGrade(studentAvg).predikatMid
                              : getPredikatFromScore(studentAvg)
                            : "-";
                        const isStudentTuntas = filledScores.length > 0 && studentAvg >= 75;
                        const studentRank =
                          studentAvg > 0 ? (rankedStudentIds.get(s.id) ?? index + 1) : "-";

                        return (
                          <tr
                            key={s.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-2 py-2 text-center font-mono text-slate-400 text-xs">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                                  {s.nama.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-white block text-xs truncate max-w-[150px]">
                                    {s.nama}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    NISN: {s.nisn}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {s.kelas}
                              </span>
                            </td>

                            {/* Input Cells for each mapel */}
                            {activeLegerMapels.map((m) => {
                              const key = `${s.id}_${m.nama}`;
                              const rawVal = legerInputScores[key] ?? "";
                              const numVal = Number(rawVal) || 0;
                              const kkm = m.kkm || 75;
                              const isFilled = rawVal !== "" && rawVal !== undefined;
                              const isScoreTuntas = numVal >= kkm;

                              return (
                                <td
                                  key={m.id}
                                  className={`px-1 py-1.5 text-center border-l border-slate-100 dark:border-slate-800/60 ${
                                    !isFilled
                                      ? "bg-transparent"
                                      : isScoreTuntas
                                      ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                                      : "bg-rose-50/40 dark:bg-rose-950/20"
                                  }`}
                                >
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={rawVal}
                                    placeholder="-"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) =>
                                      handleLegerScoreChange(s.id, m.nama, e.target.value)
                                    }
                                    className={`w-14 text-center font-mono text-xs font-bold py-1 px-1 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                      !isFilled
                                        ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        : isScoreTuntas
                                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 font-extrabold"
                                        : "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-black"
                                    }`}
                                    title={`${s.nama} - ${m.nama} (KKM: ${kkm})`}
                                  />
                                </td>
                              );
                            })}

                            {/* Total */}
                            <td className="px-2 py-2 text-center font-mono font-bold bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-slate-800">
                              {studentTotal > 0 ? studentTotal : "-"}
                            </td>

                            {/* Rata2 */}
                            <td className="px-2 py-2 text-center font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30">
                              {studentAvg > 0 ? studentAvg : "-"}
                            </td>

                            {/* Rank */}
                            <td className="px-2 py-2 text-center font-bold">
                              {studentAvg > 0 ? (
                                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                                  #{studentRank}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">-</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-2 py-2 text-center">
                              {studentAvg > 0 ? (
                                isStudentTuntas ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                    Tuntas
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                                    Remedial
                                  </span>
                                )
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                                  Kosong
                                </span>
                              )}
                            </td>

                            {/* Aksi */}
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRapor(s, isTengah ? "tengah" : "akhir", activeSemester)}
                                  title={`Cetak E-Rapor ${isTengah ? "STS" : "SAS"} untuk ${s.nama}`}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors inline-flex items-center cursor-pointer"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExportSingleRapor(s, isTengah ? "tengah" : "akhir", activeSemester)}
                                  title={`Ekspor Rapor ${s.nama} (.xlsx)`}
                                  className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors inline-flex items-center cursor-pointer"
                                >
                                  <FileSpreadsheet className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenWhatsAppModal(s, isTengah ? "tengah" : "akhir", activeSemester)}
                                  title="Kirim Ringkasan Nilai via WhatsApp"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center cursor-pointer"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {/* Tfoot: Rekap Rata-Rata Kelas */}
                  {filteredSiswa.length > 0 && (
                    <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                      <tr>
                        <td colSpan={3} className="px-3 py-2.5 text-center font-extrabold uppercase">
                          Rata-Rata Kelas ({filteredSiswa.length} Siswa)
                        </td>
                        {activeLegerMapels.map((m) => {
                          const colScores = filteredSiswa
                            .map((s) => Number(legerInputScores[`${s.id}_${m.nama}`]))
                            .filter((v) => !isNaN(v) && v > 0);
                          const colAvg =
                            colScores.length > 0
                              ? Math.round(colScores.reduce((a, b) => a + b, 0) / colScores.length)
                              : 0;
                          return (
                            <td
                              key={m.id}
                              className={`px-1 py-2 text-center font-mono text-xs border-l border-slate-200 dark:border-slate-700 ${
                                colAvg >= (m.kkm || 75)
                                  ? "text-emerald-700 dark:text-emerald-400 font-extrabold"
                                  : colAvg > 0
                                  ? "text-rose-700 dark:text-rose-400 font-extrabold"
                                  : "text-slate-400"
                              }`}
                            >
                              {colAvg > 0 ? colAvg : "-"}
                            </td>
                          );
                        })}
                        <td colSpan={5} className="px-3 py-2 text-left text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          KKM Standar: 75 &bull; Real-time calculation
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              /* TABEL 2: MODE RINGKASAN SISWA */
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
                        : (n.semester || "Ganjil").toLowerCase() === activeSemester.toLowerCase()) &&
                      (activeRaporTab === "semua"
                        ? true
                        : isTengah
                        ? isRecordStsFilled(n)
                        : isRecordSasFilled(n))
                  );

                  const { mapels: studentClassMapels } = getAvailableMapelForClass(s.kelas);
                  const totalMapelCount = Math.max(1, studentClassMapels.length);

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

                            {/* Tombol Ekspor XLS */}
                            <button
                              onClick={() => handleExportSingleRapor(s, isTengah ? "tengah" : "akhir", activeSemester)}
                              title={`Ekspor E-Rapor ${isTengah ? "STS" : "SAS"} (${s.nama}) ke Excel (.xlsx)`}
                              className="p-1.5 px-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors inline-flex items-center gap-1 cursor-pointer font-bold text-xs"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                              <span className="hidden xl:inline text-[11px]">XLS</span>
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

                          {/* Tombol Ekspor XLS */}
                          <button
                            onClick={() => handleExportSingleRapor(s, isTengah ? "tengah" : "akhir", activeSemester)}
                            title={`Ekspor E-Rapor ${isTengah ? "STS" : "SAS"} (${s.nama}) ke Excel (.xlsx)`}
                            className="p-1.5 px-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors inline-flex items-center gap-1 cursor-pointer font-bold text-xs"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            <span className="hidden xl:inline text-[11px]">XLS</span>
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
        )}
      </div>
    );
  })()}

  {/* Sticky Bottom Bar for Unsaved Changes in Leger */}
  {hasUnsavedChanges && (
    <div className="sticky bottom-4 mx-4 p-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 z-30 animate-pulse no-print border border-amber-300/40">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-white/20">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold leading-tight">
            Ada perubahan nilai pada tabel yang belum disimpan!
          </p>
          <p className="text-[11px] text-amber-100">
            Klik tombol simpan agar nilai terbaru tersimpan secara permanen ke database cloud.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleSaveLegerScores}
          disabled={isLegerSaving}
          className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-900 text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
        >
          {isLegerSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
          ) : (
            <Save className="h-4 w-4 text-emerald-600" />
          )}
          <span>{isLegerSaving ? "Menyimpan Nilai..." : "Simpan Perubahan Sekarang"}</span>
        </button>
      </div>
    </div>
  )}

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

                      <button
                        type="button"
                        onClick={() => {
                          setIsBulkModalOpen(false);
                          setBatchRaporViewMode("leger");
                          setIsLegerEditMode(true);
                          setBatchRaporType(bulkIsTengah ? "tengah" : "akhir");
                          setBatchRaporSemester(bulkActiveSemester);
                          setBatchSelectedKelas(bulkSelectedKelas);
                          initLegerInputScores(
                            bulkSelectedKelas,
                            bulkIsTengah ? "tengah" : "akhir",
                            bulkActiveSemester
                          );
                          setIsBatchRaporOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                        title="Buka input matriks seluruh siswa 1 kelas x seluruh mata pelajaran"
                      >
                        <TableProperties className="h-3.5 w-3.5 text-purple-600" />
                        <span>Mode Leger Matriks Rombel</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          1 Kelas Lengkap
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

                    {(() => {
                      const { mapels: perClassMapels, isScheduled: perClassIsScheduled } = getAvailableMapelForClass(bulkSelectedKelas);
                      return (
                        <div className="w-full sm:w-1/3">
                          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-amber-600" />
                              <span>Pilih Mata Pelajaran *</span>
                            </span>
                            {perClassIsScheduled && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                Jadwal KBM
                              </span>
                            )}
                          </label>
                          <select
                            required
                            value={bulkSelectedMapel}
                            onChange={(e) => handleBulkMapelChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                          >
                            {perClassMapels.map((m) => (
                              <option key={m.id} value={m.nama}>
                                {m.nama} (KKM: {m.kkm})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

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
                          const hasSasScore = (Number(row.uas) > 0 || Number(row.tugas) > 0);
                          const rowAkhir = hasSasScore
                            ? calculateSemesterGrade(
                                Number(row.tugas) || 0,
                                Number(row.uts) || 0,
                                Number(row.uas) || 0
                              )
                            : { nilaiAkhir: "-", predikat: "-" };
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
                                  value={row.tugas === 0 ? "" : row.tugas}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleBulkClassRowChange(idx, "tugas", e.target.value === "" ? 0 : Number(e.target.value))
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
                                  value={row.uts === 0 ? "" : row.uts}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleBulkClassRowChange(idx, "uts", e.target.value === "" ? 0 : Number(e.target.value))
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
                                  value={row.uas === 0 ? "" : row.uas}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleBulkClassRowChange(idx, "uas", e.target.value === "" ? 0 : Number(e.target.value))
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
                          const hasSasScore = (Number(row.uas) > 0 || Number(row.tugas) > 0);
                          const rowAkhir = hasSasScore
                            ? calculateSemesterGrade(
                                Number(row.tugas) || 0,
                                Number(row.uts) || 0,
                                Number(row.uas) || 0
                              )
                            : { nilaiAkhir: "-", predikat: "-" };
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
                                  value={row.tugas === 0 ? "" : row.tugas}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleBulkRowChange(idx, "tugas", e.target.value === "" ? 0 : Number(e.target.value))
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
                                  value={row.uts === 0 ? "" : row.uts}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleBulkRowChange(idx, "uts", e.target.value === "" ? 0 : Number(e.target.value))
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
                                  value={row.uas === 0 ? "" : row.uas}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleBulkRowChange(idx, "uas", e.target.value === "" ? 0 : Number(e.target.value))
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
                  onChange={(e) => {
                    const newSiswaId = e.target.value;
                    const stu = baseSiswaList.find((s) => s.id === newSiswaId) || siswaList.find((s) => s.id === newSiswaId);
                    const { mapels: nextMapels } = getAvailableMapelForClass(stu?.kelas || "");
                    const isAvailable = nextMapels.some(
                      (m) => m.nama.toLowerCase() === formData.mapel.toLowerCase()
                    );
                    setFormData({
                      ...formData,
                      siswaId: newSiswaId,
                      mapel: isAvailable ? formData.mapel : (nextMapels[0]?.nama || formData.mapel),
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {baseSiswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const singleInputStudent =
                  baseSiswaList.find((s) => s.id === formData.siswaId) ||
                  siswaList.find((s) => s.id === formData.siswaId);
                const { mapels: singleModalMapels, isScheduled: singleModalIsScheduled } =
                  getAvailableMapelForClass(singleInputStudent?.kelas || "");

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Mata Pelajaran *</span>
                        {singleModalIsScheduled && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Jadwal KBM {singleInputStudent?.kelas}
                          </span>
                        )}
                      </label>
                      <select
                        value={formData.mapel}
                        onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {singleModalMapels.map((m) => (
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
                );
              })()}

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
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 pt-2 sm:pt-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible rapor-print-container"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRaporSiswa(null);
          }}
        >
          {/* Tombol Tutup Melayang (Floating Close Button) */}
          <button
            type="button"
            onClick={() => setRaporSiswa(null)}
            className="fixed top-4 right-4 z-[60] px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-2xl flex items-center gap-2 text-xs font-black cursor-pointer transition-all border-2 border-white/20 hover:shadow-rose-600/40 no-print"
            title="Tutup Pratinjau Rapor (Esc)"
          >
            <X className="h-4 w-4 stroke-[3]" />
            <span>TUTUP</span>
          </button>

          <div
            className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl relative mt-1 mb-8 border-0 border-none print:m-0 print:p-0 print:max-w-none print:w-full print:shadow-none print:rounded-none print:border-none rapor-print-card"
            style={{
              fontFamily: getFontFamilyCss(raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor),
            }}
          >
            {/* Dynamic Print Styles for Typography & Document Scale */}
            <style>{`
              @media print {
                .rapor-print-card {
                  zoom: ${(raporConfig.skalaUkuranRapor || 100) / 100} !important;
                  font-family: ${getFontFamilyCss(raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor)} !important;
                }
              }
            `}</style>

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

              {/* Action Buttons (Direct Print, PDF Export & Admin Tools) */}
              <div className="flex items-center gap-2">
                {isAdmin && (
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
                  onClick={() =>
                    handleExportSingleRapor(
                      raporSiswa,
                      raporPrintType,
                      raporPrintSemester,
                      "xlsx"
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-teal-700/20 transition-all cursor-pointer"
                  title="Ekspor dokumen rapor siswa ini ke file spreadsheet Microsoft Excel (.xlsx / .xls)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Ekspor Excel (.xlsx)</span>
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

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsRaporSettingsOpen(!isRaporSettingsOpen)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      isRaporSettingsOpen
                        ? "bg-amber-500 text-white shadow-amber-500/20"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                    title="Kustomisasi Logo Kop, Teks Kop Surat, dan Titimangsa Rapor"
                  >
                    <Sliders className="h-4 w-4" />
                    <span>Atur Kop & TTD</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setRaporSiswa(null)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Tutup Modal Cetak Rapor (Esc)"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {/* Kustomisasi Kop Surat & Titimangsa (No Print - Hanya Admin) */}
            {isAdmin && isRaporSettingsOpen && renderRaporSettingsPanel()}

            {/* Official School Letterhead (Kop Surat) */}
            {renderOfficialLetterhead()}

            {/* Report Title & Type Info */}
            <div className="text-center mb-5">
              {/* Quick Format & Edit Bar (No Print - Khusus Admin) */}
              {isAdmin && (
                <>
                  <div className="mb-2.5 print:hidden inline-flex flex-wrap items-center justify-center gap-1.5 p-1 px-3 rounded-full bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700/70 border border-slate-300 dark:border-slate-600 shadow-xs transition-all text-xs">
                {/* Quick Font Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
                    <Type className="h-3 w-3 text-indigo-500" />
                    <span>Font:</span>
                  </span>
                  <select
                    value={raporConfig.fontFamilyRapor || "Times New Roman"}
                    onChange={(e) => updateRaporConfig({ fontFamilyRapor: e.target.value })}
                    className="text-[11px] font-bold py-0.5 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                    title="Pilih Jenis Font Tulisan Dokumen Rapor"
                  >
                    {RAPOR_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
                  <span>Judul:</span>
                </span>

                {/* Font Size Judul - */}
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      fontSizeJudulRapor: Math.max(10, (raporConfig.fontSizeJudulRapor || 16) - 1),
                    })
                  }
                  className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                  title="Perkecil Ukuran Huruf Judul"
                >
                  -
                </button>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 min-w-[34px] text-center">
                  {raporConfig.fontSizeJudulRapor || 16}px
                </span>
                {/* Font Size Judul + */}
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      fontSizeJudulRapor: Math.min(32, (raporConfig.fontSizeJudulRapor || 16) + 1),
                    })
                  }
                  className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                  title="Perbesar Ukuran Huruf Judul"
                >
                  +
                </button>

                <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                {/* Font Size Tabel - / + */}
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
                  <span>Tabel:</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      fontSizeTabelNilai: Math.max(8, (raporConfig.fontSizeTabelNilai || 11) - 1),
                    })
                  }
                  className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 hover:bg-blue-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                  title="Perkecil Ukuran Huruf Tabel Nilai"
                >
                  -
                </button>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 min-w-[30px] text-center">
                  {raporConfig.fontSizeTabelNilai || 11}px
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      fontSizeTabelNilai: Math.min(16, (raporConfig.fontSizeTabelNilai || 11) + 1),
                    })
                  }
                  className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 hover:bg-blue-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                  title="Perbesar Ukuran Huruf Tabel Nilai"
                >
                  +
                </button>

                <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                {/* Bold Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      boldJudulRapor: !(raporConfig.boldJudulRapor ?? true),
                    })
                  }
                  className={`px-2 py-0.5 rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                    (raporConfig.boldJudulRapor ?? true)
                      ? "bg-amber-500 text-white shadow-xs font-black"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  }`}
                  title="Tebalkan Huruf Judul (Bold)"
                >
                  <Bold className="h-3 w-3" />
                  <span>B</span>
                </button>

                {/* Underline Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      underlineJudulRapor: !(raporConfig.underlineJudulRapor ?? true),
                    })
                  }
                  className={`px-2 py-0.5 rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                    (raporConfig.underlineJudulRapor ?? true)
                      ? "bg-amber-500 text-white shadow-xs font-black underline"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  }`}
                  title="Garis Bawah Judul (Underline)"
                >
                  <UnderlineIcon className="h-3 w-3" />
                  <span>U</span>
                </button>

                <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                {/* Ruang TTD Quick Control */}
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
                  <span>Ruang TTD:</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      tinggiRuangTtd: Math.max(30, (raporConfig.tinggiRuangTtd || 64) - 10),
                    })
                  }
                  className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                  title="Perkecil Ruang Tanda Tangan"
                >
                  -
                </button>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 min-w-[34px] text-center font-mono">
                  {raporConfig.tinggiRuangTtd || 64}px
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateRaporConfig({
                      tinggiRuangTtd: Math.min(180, (raporConfig.tinggiRuangTtd || 64) + 10),
                    })
                  }
                  className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                  title="Perbesar Ruang Tanda Tangan"
                >
                  +
                </button>

                <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                {/* Edit Text Toggle */}
                <button
                  type="button"
                  onClick={() => setIsInlineTitleEdit(!isInlineTitleEdit)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    isInlineTitleEdit
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80"
                  }`}
                  title="Ubah teks tulisan judul langsung di lembar rapor"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>{isInlineTitleEdit ? "Tutup Edit Teks" : "Edit Tulisan"}</span>
                </button>

                {/* Urutan Mapel Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveRaporConfigTab("urutan");
                    setIsRaporSettingsOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-amber-50 text-slate-700 dark:text-slate-200 border border-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Atur urutan naik/turun mata pelajaran rapor"
                >
                  <ArrowUpDown className="h-3 w-3 text-amber-600" />
                  <span>Urutan Mapel</span>
                </button>

                {/* Open Full Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveRaporConfigTab("judul");
                    setIsRaporSettingsOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Buka panel pengaturan cepat judul & kop"
                >
                  <Sliders className="h-3 w-3" />
                  <span>Atur Cepat</span>
                </button>

                {/* Format Rapor (Full Modal) Button */}
                <button
                  type="button"
                  onClick={() => setIsFormatRaporModalOpen(true)}
                  className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                  title="Buka Format Rapor Komprehensif (Kop, Judul, Font, Ukuran & Pratinjau)"
                >
                  <Sliders className="h-3 w-3" />
                  <span>Format Rapor</span>
                </button>
              </div>

              {/* Inline Title Editor Box if active */}
              {isInlineTitleEdit && (
                <div className="max-w-xl mx-auto mb-3 p-3 bg-amber-50 dark:bg-slate-800 border-2 border-amber-400 rounded-xl space-y-2 shadow-sm text-left print:hidden animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Edit Tulisan Judul ({raporPrintType === "tengah" ? "STS" : "SAS"}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsInlineTitleEdit(false)}
                      className="text-[11px] px-2.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                  <input
                    type="text"
                    value={
                      raporPrintType === "tengah"
                        ? (raporConfig.judulRaporSTS ?? "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)")
                        : (raporConfig.judulRaporSAS ?? "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)")
                    }
                    onChange={(e) => {
                      if (raporPrintType === "tengah") {
                        updateRaporConfig({ judulRaporSTS: e.target.value });
                      } else {
                        updateRaporConfig({ judulRaporSAS: e.target.value });
                      }
                    }}
                    placeholder={
                      raporPrintType === "tengah"
                        ? "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)"
                        : "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)"
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold uppercase"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      Teks judul akan otomatis tersimpan dan diterapkan pada pratinjau & cetak.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (raporPrintType === "tengah") {
                          updateRaporConfig({
                            judulRaporSTS: "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)",
                          });
                        } else {
                          updateRaporConfig({
                            judulRaporSAS: "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)",
                          });
                        }
                      }}
                      className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Reset Teks Standar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

              {/* Title Header with Dynamic Style */}
              <h3
                style={{ fontSize: `${raporConfig.fontSizeJudulRapor || 16}px` }}
                className={`tracking-wider uppercase text-slate-900 ${
                  (raporConfig.boldJudulRapor ?? true) ? "font-extrabold" : "font-normal"
                } ${
                  (raporConfig.underlineJudulRapor ?? true) ? "underline" : "no-underline"
                }`}
              >
                {raporPrintType === "tengah"
                  ? (raporConfig.judulRaporSTS || "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)")
                  : (raporConfig.judulRaporSAS || "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)")}
              </h3>
              <p
                style={{ fontSize: `${raporConfig.fontSizeSubjudulRapor || 12}px` }}
                className={`mt-1 ${
                  raporConfig.boldSubjudulRapor
                    ? "font-bold text-slate-800"
                    : "font-medium text-slate-600"
                }`}
              >
                {raporConfig.subjudulRapor?.trim()
                  ? raporConfig.subjudulRapor
                  : `Tahun Ajaran ${profile.tahunAjaranAktif} • Semester ${raporPrintSemester || profile.semesterAktif}`}
              </p>
              {raporPrintType === "akhir" && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] text-slate-700 font-medium print:hidden">
                  Komposisi Penilaian SAS: 30% Nilai Harian + 30% Ujian Mid + 40% Ujian Akhir Semester
                </div>
              )}
            </div>

            {/* Student & Class Info Box */}
            <div
              className="grid grid-cols-2 gap-4 mb-5 py-2 border-0 border-none bg-transparent"
              style={{ fontSize: `${raporConfig.fontSizeIdentitas || 11}px` }}
            >
              <div>
                <p className="text-slate-600">Nama Peserta Didik: <strong className="text-slate-900">{raporSiswa.nama}</strong></p>
              </div>
              <div>
                <p className="text-slate-600">Kelas: <strong className="text-slate-900">{raporSiswa.kelas}</strong></p>
              </div>
            </div>

            {/* Table of Grades */}
            {raporPrintType === "tengah" ? (
              // Table for Rapor Tengah Semester (PTS)
              <table
                className="rapor-print-table w-full text-left border-collapse border border-[#000000] mb-4"
                style={{ fontSize: `${raporConfig.fontSizeTabelNilai || 11}px` }}
              >
                <thead>
                  <tr
                    className="bg-slate-100 text-slate-800 font-bold"
                    style={{ fontSize: `${raporConfig.fontSizeHeaderTabel || 11}px` }}
                  >
                    <th className="border border-[#000000] px-3 py-1.5 text-center w-10">No</th>
                    <th className="border border-[#000000] px-3 py-1.5">Mata Pelajaran</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-16">KKM</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-24 text-black">Nilai Prestasi</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-16">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {studentNilaiRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-[#000000] px-3 py-4 text-center text-slate-400">
                        Belum ada nilai mata pelajaran yang diinputkan untuk siswa ini.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const wajibRecords = sortRecordsByMapelOrder(studentNilaiRecords.filter((item) => getMapelSection(item.mapel) === "wajib"));
                      const mulokRecords = sortRecordsByMapelOrder(studentNilaiRecords.filter((item) => getMapelSection(item.mapel) === "mulok"));
                      const quranRecords = sortRecordsByMapelOrder(studentNilaiRecords.filter((item) => getMapelSection(item.mapel) === "quran"));

                      return (
                        <>
                          {/* Kelompok A: Muatan Wajib */}
                          <tr className="bg-slate-100/90 font-bold text-slate-900">
                            <td colSpan={5} className="border border-[#000000] px-3 py-1 font-bold uppercase tracking-wider bg-slate-100">
                              A. Muatan Wajib
                            </td>
                          </tr>
                          {wajibRecords.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="border border-[#000000] px-3 py-1.5 text-center text-slate-400 italic">
                                - Belum ada mata pelajaran muatan wajib -
                              </td>
                            </tr>
                          ) : (
                            wajibRecords.map((item, idx) => {
                              const mid = getStudentMid(item);
                              const mapelObj = mapelList.find(
                                (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                              );
                              const kkm = mapelObj?.kkm || 75;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-[#000000] px-3 py-1 text-center">{idx + 1}</td>
                                  <td className="border border-[#000000] px-3 py-1 font-semibold">
                                    <div className="flex items-center justify-between group/row">
                                      <span>{item.mapel}</span>
                                      <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "up", wajibRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Atas`}
                                        >
                                          <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === wajibRecords.length - 1}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "down", wajibRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Bawah`}
                                        >
                                          <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold text-black font-mono">
                                    {mid.nilaiMid}
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                    {mid.predikatMid}
                                  </td>
                                </tr>
                              );
                            })
                          )}

                          {/* Kelompok B: Muatan Lokal */}
                          <tr className="bg-slate-100/90 font-bold text-slate-900">
                            <td colSpan={5} className="border border-[#000000] px-3 py-1 font-bold uppercase tracking-wider bg-slate-100">
                              B. Muatan Lokal
                            </td>
                          </tr>
                          {mulokRecords.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="border border-[#000000] px-3 py-1.5 text-center text-slate-400 italic">
                                - Tidak ada mata pelajaran muatan lokal -
                              </td>
                            </tr>
                          ) : (
                            mulokRecords.map((item, idx) => {
                              const mid = getStudentMid(item);
                              const mapelObj = mapelList.find(
                                (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                              );
                              const kkm = mapelObj?.kkm || 75;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-[#000000] px-3 py-1 text-center">{idx + 1}</td>
                                  <td className="border border-[#000000] px-3 py-1 font-semibold">
                                    <div className="flex items-center justify-between group/row">
                                      <span>{item.mapel}</span>
                                      <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "up", mulokRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Atas`}
                                        >
                                          <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === mulokRecords.length - 1}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "down", mulokRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Bawah`}
                                        >
                                          <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold text-black font-mono">
                                    {mid.nilaiMid}
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                    {mid.predikatMid}
                                  </td>
                                </tr>
                              );
                            })
                          )}

                          {/* Kelompok C: Kecerdasan Al-Qur'an */}
                          <tr className="bg-slate-100/90 font-bold text-slate-900">
                            <td colSpan={5} className="border border-[#000000] px-3 py-1 font-bold uppercase tracking-wider bg-slate-100">
                              C. Kecerdasan Al-Qur&apos;an
                            </td>
                          </tr>
                          {quranRecords.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="border border-[#000000] px-3 py-1.5 text-center text-slate-400 italic">
                                - Tidak ada mata pelajaran kecerdasan al-qur&apos;an -
                              </td>
                            </tr>
                          ) : (
                            quranRecords.map((item, idx) => {
                              const mid = getStudentMid(item);
                              const mapelObj = mapelList.find(
                                (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                              );
                              const kkm = mapelObj?.kkm || 75;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-[#000000] px-3 py-1 text-center">{idx + 1}</td>
                                  <td className="border border-[#000000] px-3 py-1 font-semibold">
                                    <div className="flex items-center justify-between group/row">
                                      <span>{item.mapel}</span>
                                      <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "up", quranRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Atas`}
                                        >
                                          <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === quranRecords.length - 1}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "down", quranRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Bawah`}
                                        >
                                          <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold text-black font-mono">
                                    {mid.nilaiMid}
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                    {mid.predikatMid}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </>
                      );
                    })()
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={3} className="border border-[#000000] px-3 py-1.5 text-right">
                      Rata-Rata Nilai Sumatif Tengah Semester (STS):
                    </td>
                    <td className="border border-[#000000] px-2 py-1.5 text-center font-bold text-black text-sm font-mono">
                      {studentMidAverage}
                    </td>
                    <td colSpan={1} className="border border-[#000000] px-2 py-1.5 text-center text-slate-700 font-bold">
                      {studentMidAverage >= 88
                        ? "A"
                        : studentMidAverage >= 75
                        ? "B"
                        : "C"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              // Table for Rapor Akhir Semester (PAS)
              <table
                className="rapor-print-table w-full text-left border-collapse border border-[#000000] mb-4"
                style={{ fontSize: `${raporConfig.fontSizeTabelNilai || 11}px` }}
              >
                <thead>
                  <tr
                    className="bg-slate-100 text-slate-800 font-bold"
                    style={{ fontSize: `${raporConfig.fontSizeHeaderTabel || 11}px` }}
                  >
                    <th className="border border-[#000000] px-3 py-1.5 text-center w-10">No</th>
                    <th className="border border-[#000000] px-3 py-1.5">Mata Pelajaran</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-14">KKM</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-20">Harian (30%)</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-20">Mid (30%)</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-20">UAS (40%)</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-20 bg-blue-50">Nilai Akhir</th>
                    <th className="border border-[#000000] px-2 py-1.5 text-center w-16">Predikat</th>
                    <th className="border border-[#000000] px-3 py-1.5">Catatan Capaian Kompetensi</th>
                  </tr>
                </thead>
                <tbody>
                  {studentNilaiRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-[#000000] px-3 py-4 text-center text-slate-400">
                        Belum ada nilai mata pelajaran yang diinputkan untuk siswa ini.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const wajibRecords = sortRecordsByMapelOrder(studentNilaiRecords.filter((item) => getMapelSection(item.mapel) === "wajib"));
                      const mulokRecords = sortRecordsByMapelOrder(studentNilaiRecords.filter((item) => getMapelSection(item.mapel) === "mulok"));
                      const quranRecords = sortRecordsByMapelOrder(studentNilaiRecords.filter((item) => getMapelSection(item.mapel) === "quran"));

                      return (
                        <>
                          {/* Kelompok A: Muatan Wajib */}
                          <tr className="bg-slate-100/90 font-bold text-slate-900">
                            <td colSpan={9} className="border border-[#000000] px-3 py-1 font-bold uppercase tracking-wider bg-slate-100">
                              A. Muatan Wajib
                            </td>
                          </tr>
                          {wajibRecords.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="border border-[#000000] px-3 py-1.5 text-center text-slate-400 italic">
                                - Belum ada mata pelajaran muatan wajib -
                              </td>
                            </tr>
                          ) : (
                            wajibRecords.map((item, idx) => {
                              const akhir = getStudentAkhir(item);
                              const mapelObj = mapelList.find(
                                (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                              );
                              const kkm = mapelObj?.kkm || 75;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-[#000000] px-3 py-1 text-center">{idx + 1}</td>
                                  <td className="border border-[#000000] px-3 py-1 font-semibold">
                                    <div className="flex items-center justify-between group/row">
                                      <span>{item.mapel}</span>
                                      <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "up", wajibRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Atas`}
                                        >
                                          <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === wajibRecords.length - 1}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "down", wajibRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Bawah`}
                                        >
                                          <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.tugas}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uts}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uas}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold text-blue-700 bg-blue-50/50 font-mono">
                                    {akhir.nilaiAkhir}
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                    {akhir.predikat}
                                  </td>
                                  <td
                                    className="border border-[#000000] px-3 py-1 text-slate-600"
                                    style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}
                                  >
                                    {akhir.catatan || "-"}
                                  </td>
                                </tr>
                              );
                            })
                          )}

                          {/* Kelompok B: Muatan Lokal */}
                          <tr className="bg-slate-100/90 font-bold text-slate-900">
                            <td colSpan={9} className="border border-[#000000] px-3 py-1 font-bold uppercase tracking-wider bg-slate-100">
                              B. Muatan Lokal
                            </td>
                          </tr>
                          {mulokRecords.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="border border-[#000000] px-3 py-1.5 text-center text-slate-400 italic">
                                - Tidak ada mata pelajaran muatan lokal -
                              </td>
                            </tr>
                          ) : (
                            mulokRecords.map((item, idx) => {
                              const akhir = getStudentAkhir(item);
                              const mapelObj = mapelList.find(
                                (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                              );
                              const kkm = mapelObj?.kkm || 75;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-[#000000] px-3 py-1 text-center">{idx + 1}</td>
                                  <td className="border border-[#000000] px-3 py-1 font-semibold">
                                    <div className="flex items-center justify-between group/row">
                                      <span>{item.mapel}</span>
                                      <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "up", mulokRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Atas`}
                                        >
                                          <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === mulokRecords.length - 1}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "down", mulokRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Bawah`}
                                        >
                                          <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.tugas}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uts}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uas}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold text-blue-700 bg-blue-50/50 font-mono">
                                    {akhir.nilaiAkhir}
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                    {akhir.predikat}
                                  </td>
                                  <td
                                    className="border border-[#000000] px-3 py-1 text-slate-600"
                                    style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}
                                  >
                                    {akhir.catatan || "-"}
                                  </td>
                                </tr>
                              );
                            })
                          )}

                          {/* Kelompok C: Kecerdasan Al-Qur'an */}
                          <tr className="bg-slate-100/90 font-bold text-slate-900">
                            <td colSpan={9} className="border border-[#000000] px-3 py-1 font-bold uppercase tracking-wider bg-slate-100">
                              C. Kecerdasan Al-Qur&apos;an
                            </td>
                          </tr>
                          {quranRecords.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="border border-[#000000] px-3 py-1.5 text-center text-slate-400 italic">
                                - Tidak ada mata pelajaran kecerdasan al-qur&apos;an -
                              </td>
                            </tr>
                          ) : (
                            quranRecords.map((item, idx) => {
                              const akhir = getStudentAkhir(item);
                              const mapelObj = mapelList.find(
                                (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                              );
                              const kkm = mapelObj?.kkm || 75;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-[#000000] px-3 py-1 text-center">{idx + 1}</td>
                                  <td className="border border-[#000000] px-3 py-1 font-semibold">
                                    <div className="flex items-center justify-between group/row">
                                      <span>{item.mapel}</span>
                                      <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "up", quranRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Atas`}
                                        >
                                          <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === quranRecords.length - 1}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveMapelInSection(item.mapel, "down", quranRecords);
                                          }}
                                          className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                          title={`Pindahkan "${item.mapel}" ke Bawah`}
                                        >
                                          <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.tugas}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uts}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uas}</td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold text-blue-700 bg-blue-50/50 font-mono">
                                    {akhir.nilaiAkhir}
                                  </td>
                                  <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                    {akhir.predikat}
                                  </td>
                                  <td
                                    className="border border-[#000000] px-3 py-1 text-slate-600"
                                    style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}
                                  >
                                    {akhir.catatan || "-"}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </>
                      );
                    })()
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={6} className="border border-[#000000] px-3 py-1.5 text-right">
                      Rata-Rata Nilai Akhir Semester (PAS):
                    </td>
                    <td className="border border-[#000000] px-2 py-1.5 text-center font-bold text-blue-800 text-sm font-mono bg-blue-50">
                      {studentAkhirAverage}
                    </td>
                    <td colSpan={2} className="border border-[#000000] px-3 py-1.5 text-slate-600">
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

            {/* Tabel Ketidakhadiran (Presensi Siswa) & Tabel KKM */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              {raporConfig.showPresensi !== false && (() => {
                const att = getStudentAttendance(raporSiswa.id, raporSiswa.nama);
                return (
                  <div className="w-full sm:w-72">
                    <table
                      className="rapor-print-table w-full border-collapse border border-[#000000]"
                      style={{ fontSize: `${raporConfig.fontSizePresensi || 11}px` }}
                    >
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold">
                          <th
                            colSpan={2}
                            className="border border-[#000000] px-3 py-1 text-left uppercase tracking-wider"
                            style={{ fontSize: `${(raporConfig.fontSizePresensi || 11) - 1}px` }}
                          >
                            Ketidakhadiran
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">
                            1. Sakit
                          </td>
                          <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">
                            {att.sakit} hari
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">
                            2. Izin
                          </td>
                          <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">
                            {att.izin} hari
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">
                            3. Tanpa Keterangan
                          </td>
                          <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">
                            {att.alpa} hari
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Tabel KKM & Interval Predikat */}
              {renderTabelKkmComponent()}
            </div>

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

              const tglCetak =
                raporPrintType === "tengah"
                  ? (raporConfig.tanggalRaporSTS || raporConfig.tanggalRapor)
                  : (raporConfig.tanggalRaporSAS || raporConfig.tanggalRapor);
              const kepsekNama =
                raporConfig.customKepalaSekolah?.trim() || profile.kepalaSekolah;
              const kepsekLabel =
                raporConfig.labelKepalaSekolah?.trim() || "Kepala Sekolah";

              return (
                <div
                  className="pt-6 border-0 border-none"
                  style={{ fontSize: `${raporConfig.fontSizeTitimangsa || 11}px` }}
                >
                  {/* Titimangsa Alamat dan Tanggal Rapor */}
                  <div className="flex justify-end mb-2 pr-4">
                    <p className="text-slate-800 font-medium">
                      {raporConfig.tempatRapor}, {tglCetak}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 text-center gap-4">
                    {/* Kolom 1: Kepala Sekolah */}
                    <div>
                      {raporConfig.showTtdKepsek !== false && (
                        <>
                          <p className="text-slate-600">Mengetahui,</p>
                          <p className="text-slate-800 font-medium">{kepsekLabel},</p>
                          <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                          <p
                            style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                            className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                              raporConfig.underlineNamaTtd !== false ? "underline" : ""
                            }`}
                          >
                            {kepsekNama}
                          </p>
                          {raporConfig.nipKepalaSekolah && (
                            <p
                              className="text-slate-600 mt-0.5"
                              style={{ fontSize: `${Math.max(8, (raporConfig.fontSizeTitimangsa || 11) - 2)}px` }}
                            >
                              NIP. {raporConfig.nipKepalaSekolah}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Kolom 2: Wali Kelas */}
                    <div>
                      {raporConfig.showTtdWali !== false && (
                        <>
                          <p className="text-slate-600 invisible">Mengetahui,</p>
                          <p className="text-slate-800 font-medium">Wali Kelas,</p>
                          <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                          <p
                            style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                            className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                              raporConfig.underlineNamaTtd !== false ? "underline" : ""
                            }`}
                          >
                            {waliNama}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Kolom 3: Orang Tua / Wali Santri */}
                    <div>
                      {raporConfig.showTtdOrtu !== false && (
                        <>
                          <p className="text-slate-600 invisible">Mengetahui,</p>
                          <p className="text-slate-800 font-medium">Orang Tua / Wali Santri,</p>
                          <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                          <p
                            style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                            className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                              raporConfig.underlineNamaTtd !== false ? "underline" : ""
                            }`}
                          >
                            {raporSiswa.namaWali || "................................................"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bottom Action Footer (No Print) */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevSiswa}
                  disabled={currentSiswaIndex <= 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Siswa Sebelumnya</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextSiswa}
                  disabled={currentSiswaIndex >= baseSiswaList.length - 1}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>Siswa Berikutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handlePrintReport(
                      `Rapor_${raporPrintType.toUpperCase()}_${raporSiswa.nama}_${raporSiswa.kelas}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExportSingleRapor(
                      raporSiswa,
                      raporPrintType,
                      raporPrintSemester,
                      "xlsx"
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-700/20 transition-all cursor-pointer"
                  title="Ekspor dokumen rapor siswa ini ke file Excel (.xlsx)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Ekspor Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRaporSiswa(null)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                  <span>Tutup / Kembali</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: E-RAPOR SELURUH SISWA (BUNDEL RAPOR & LEGER NILAI) */}
      {/* ========================================================= */}
      {isBatchRaporOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 pt-2 sm:pt-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:static print:p-0 print:m-0 print:bg-white print:overflow-visible rapor-print-container"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBatchRaporOpen(false);
          }}
        >
          {/* Tombol Tutup Melayang (Floating Close Button) */}
          <button
            type="button"
            onClick={() => setIsBatchRaporOpen(false)}
            className="fixed top-4 right-4 z-[60] px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-2xl flex items-center gap-2 text-xs font-black cursor-pointer transition-all border-2 border-white/20 hover:shadow-rose-600/40 no-print"
            title="Tutup Modal Cetak Rapor Rombel (Esc)"
          >
            <X className="h-4 w-4 stroke-[3]" />
            <span>TUTUP</span>
          </button>

          <div className="w-full max-w-6xl bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl relative mt-1 mb-8 border-0 border-none max-h-[96vh] overflow-y-auto print:m-0 print:p-0 print:max-w-none print:w-full print:shadow-none print:rounded-none print:border-none print:max-h-none rapor-print-card">
            {/* Action Bar (No Print) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6 no-print">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1.5">
                  <Printer className="h-3.5 w-3.5" />
                  <span>Modul Cetak / Ekspor Rapor Seluruh Siswa</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>{isLegerEditMode ? "Input Nilai Leger Rombel" : "E-Rapor Rombel"}: {batchSelectedKelas === "Semua" ? "Seluruh Siswa" : `Kelas ${batchSelectedKelas}`}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {batchStudents.length} Siswa
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                    {currentLegerMapelList.length} Mapel Rombel
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isLegerEditMode
                    ? "Mode Matriks: Masukkan nilai siswa per rombel untuk seluruh mata pelajaran sekaligus secara real-time."
                    : "Pilih mode cetak: Bundel Rapor Lembar Individu (multi-halaman) atau Buku Leger Nilai Komprehensif."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Mode Selector: Bundel vs Buku Leger vs Input Nilai Leger */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchRaporViewMode("bundel");
                      setIsLegerEditMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      batchRaporViewMode === "bundel"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Bundel Rapor ({batchStudents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchRaporViewMode("leger");
                      setIsLegerEditMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      batchRaporViewMode === "leger" && !isLegerEditMode
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Buku Leger Cetak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchRaporViewMode("leger");
                      setIsLegerEditMode(true);
                      initLegerInputScores(batchSelectedKelas, batchRaporType, batchRaporSemester);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      batchRaporViewMode === "leger" && isLegerEditMode
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <TableProperties className="h-3.5 w-3.5" />
                    <span>Input Nilai Leger</span>
                  </button>
                </div>

                {/* Switcher Semester */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchRaporSemester("Ganjil");
                      if (isLegerEditMode) {
                        initLegerInputScores(batchSelectedKelas, batchRaporType, "Ganjil");
                      }
                    }}
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
                    onClick={() => {
                      setBatchRaporSemester("Genap");
                      if (isLegerEditMode) {
                        initLegerInputScores(batchSelectedKelas, batchRaporType, "Genap");
                      }
                    }}
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
                    onClick={() => {
                      setBatchRaporType("tengah");
                      if (isLegerEditMode) {
                        initLegerInputScores(batchSelectedKelas, "tengah", batchRaporSemester);
                      }
                    }}
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
                    onClick={() => {
                      setBatchRaporType("akhir");
                      if (isLegerEditMode) {
                        initLegerInputScores(batchSelectedKelas, "akhir", batchRaporSemester);
                      }
                    }}
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
                    onChange={(e) => {
                      const newKelas = e.target.value;
                      setBatchSelectedKelas(newKelas);
                      if (isLegerEditMode) {
                        initLegerInputScores(newKelas, batchRaporType, batchRaporSemester);
                      }
                    }}
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

                {/* Aksi Khusus Mode Input Leger vs Mode Cetak */}
                {isLegerEditMode ? (
                  <>
                    {/* Input File Tersembunyi untuk Impor Excel Leger */}
                    <input
                      ref={legerFileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleProcessLegerExcelFile}
                    />

                    <button
                      type="button"
                      onClick={handleSaveLegerScores}
                      disabled={isLegerSaving || isLegerImporting}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50"
                      title="Simpan seluruh nilai leger rombel ini"
                    >
                      {isLegerSaving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{isLegerSaving ? "Menyimpan..." : "Simpan Nilai Leger"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadLegerExcelTemplate}
                      className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Unduh format tabel Excel untuk input nilai kelas ini secara offline"
                    >
                      <Download className="h-4 w-4 text-teal-600" />
                      <span>Format Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => legerFileInputRef.current?.click()}
                      disabled={isLegerImporting}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                      title="Impor nilai dari file Excel (.xlsx, .xls) ke tabel leger"
                    >
                      {isLegerImporting ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      ) : (
                        <Upload className="h-4 w-4 text-indigo-600" />
                      )}
                      <span>{isLegerImporting ? "Mengimpor..." : "Impor Excel"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFillAllKkmEmpty}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Otomatis isi nilai kosong dengan standar KKM mapel"
                    >
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span>Isi KKM Kosong</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        initLegerInputScores(batchSelectedKelas, batchRaporType, batchRaporSemester)
                      }
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Reset dan muat ulang nilai dari database"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  </>
                ) : (
                  <>
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

                    {/* Tombol Ekspor Excel */}
                    <button
                      type="button"
                      onClick={() => {
                        if (batchRaporViewMode === "bundel") {
                          handleExportBatchRapor("xlsx");
                        } else {
                          handleDownloadLegerExcelTemplate();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-700/20 cursor-pointer transition-all"
                      title={
                        batchRaporViewMode === "bundel"
                          ? "Ekspor bundel rapor seluruh siswa kelas ini ke file Excel (.xlsx) lengkap dengan rekap dan lembar per siswa"
                          : "Unduh format leger nilai kelas aktif ke file Excel (.xlsx)"
                      }
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Ekspor Excel (.xlsx)</span>
                    </button>

                    {/* Kontrol Format & Kustomisasi Rapor (Hanya Admin) */}
                    {isAdmin && (
                      <>
                        {/* Quick Font Selector */}
                        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
                            <Type className="h-3 w-3 text-indigo-500" />
                            <span>Font:</span>
                          </span>
                          <select
                            value={raporConfig.fontFamilyRapor || "Times New Roman"}
                            onChange={(e) => updateRaporConfig({ fontFamilyRapor: e.target.value })}
                            className="text-[11px] font-bold py-0.5 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none"
                            title="Pilih Jenis Font Tulisan Dokumen Rapor"
                          >
                            {RAPOR_FONT_OPTIONS.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
                            <Type className="h-3 w-3" />
                            <span>Judul:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateRaporConfig({
                                fontSizeJudulRapor: Math.max(10, (raporConfig.fontSizeJudulRapor || 16) - 1),
                              })
                            }
                            className="w-5 h-5 rounded bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                            title="Perkecil Font Judul"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 min-w-[28px] text-center">
                            {raporConfig.fontSizeJudulRapor || 16}px
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateRaporConfig({
                                fontSizeJudulRapor: Math.min(32, (raporConfig.fontSizeJudulRapor || 16) + 1),
                              })
                            }
                            className="w-5 h-5 rounded bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shadow-xs cursor-pointer transition-colors"
                            title="Perbesar Font Judul"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateRaporConfig({
                                boldJudulRapor: !(raporConfig.boldJudulRapor ?? true),
                              })
                            }
                            className={`px-1.5 py-0.5 rounded font-bold text-xs cursor-pointer transition-all ${
                              (raporConfig.boldJudulRapor ?? true)
                                ? "bg-amber-500 text-white font-black"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                            }`}
                            title="Tebalkan Huruf Judul (Bold)"
                          >
                            <Bold className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateRaporConfig({
                                underlineJudulRapor: !(raporConfig.underlineJudulRapor ?? true),
                              })
                            }
                            className={`px-1.5 py-0.5 rounded font-bold text-xs cursor-pointer transition-all ${
                              (raporConfig.underlineJudulRapor ?? true)
                                ? "bg-amber-500 text-white font-black underline"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                            }`}
                            title="Garis Bawah Judul (Underline)"
                          >
                            <UnderlineIcon className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveRaporConfigTab("judul");
                            setIsRaporSettingsOpen(!isRaporSettingsOpen);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                            isRaporSettingsOpen
                              ? "bg-amber-500 text-white shadow-amber-500/20"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                          title="Kustomisasi Judul, Logo Kop, Teks Kop Surat, dan Titimangsa Rapor"
                        >
                          <Sliders className="h-4 w-4" />
                          <span>Atur Judul & Kop</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveRaporConfigTab("urutan");
                            setIsRaporSettingsOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="Atur urutan naik/turun mata pelajaran pada rapor"
                        >
                          <ArrowUpDown className="h-4 w-4 text-indigo-600" />
                          <span>Urutan Mapel</span>
                        </button>

                        {/* Format Rapor (Full Modal) Button */}
                        <button
                          type="button"
                          onClick={() => setIsFormatRaporModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
                          title="Buka Format Rapor Komprehensif (Kop, Judul, Font, Ukuran & Pratinjau)"
                        >
                          <Sliders className="h-4 w-4" />
                          <span>Format Rapor</span>
                        </button>
                      </>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsBatchRaporOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Tutup Modal Cetak Rapor Rombel (Esc)"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {/* Kustomisasi Kop Surat & Titimangsa (No Print - Hanya Admin) */}
            {isAdmin && isRaporSettingsOpen && renderRaporSettingsPanel()}

            {/* ========================================================= */}
            {/* KONTEN 1: MODE BUNDEL LEMBAR RAPOR PER SISWA (MULTI-PAGE) */}
            {/* ========================================================= */}
            {batchRaporViewMode === "bundel" && (
              <div className="space-y-12 print:space-y-0">
                {/* Dynamic Print Styles for Batch Printing Typography & Scaling */}
                <style>{`
                  @media print {
                    .batch-rapor-sheet {
                      zoom: ${(raporConfig.skalaUkuranRapor || 100) / 100} !important;
                      font-family: ${getFontFamilyCss(raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor)} !important;
                    }
                  }
                `}</style>
                {batchStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Tidak ada siswa yang ditemukan untuk kelas yang dipilih.
                  </div>
                ) : (
                  batchStudents.map((siswa) => {
                    const studentRecords = nilaiList.filter(
                      (n) =>
                        n.siswaId === siswa.id &&
                        (n.semester || "Ganjil").toLowerCase() === (batchRaporSemester || "Ganjil").toLowerCase() &&
                        (batchRaporType === "tengah" ? isRecordStsFilled(n) : isRecordSasFilled(n))
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

                    const att = getStudentAttendance(siswa.id, siswa.nama);

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

                    return (
                      <div
                        key={siswa.id}
                        style={{
                          pageBreakAfter: "always",
                          breakAfter: "page",
                          fontFamily: getFontFamilyCss(raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor),
                        }}
                        className="p-6 sm:p-8 bg-white border-0 border-none print:border-none print:p-0 print:m-0 batch-rapor-sheet"
                      >
                        {/* Kop Surat */}
                        {renderOfficialLetterhead(true)}

                        {/* Title */}
                        <div className="text-center mb-4">
                          <h3
                            style={{
                              fontSize: `${
                                raporConfig.fontSizeJudulRapor
                                  ? Math.max(11, Math.round(raporConfig.fontSizeJudulRapor * 0.92))
                                  : 14
                              }px`,
                            }}
                            className={`tracking-wider uppercase text-slate-900 ${
                              (raporConfig.boldJudulRapor ?? true) ? "font-extrabold" : "font-normal"
                            } ${
                              (raporConfig.underlineJudulRapor ?? true) ? "underline" : "no-underline"
                            }`}
                          >
                            {batchRaporType === "tengah"
                              ? (raporConfig.judulRaporSTS || "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)")
                              : (raporConfig.judulRaporSAS || "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)")}
                          </h3>
                          <p
                            style={{
                              fontSize: `${
                                raporConfig.fontSizeSubjudulRapor
                                  ? Math.max(10, Math.round(raporConfig.fontSizeSubjudulRapor * 0.92))
                                  : 11
                              }px`,
                            }}
                            className={`mt-0.5 ${
                              raporConfig.boldSubjudulRapor
                                ? "font-bold text-slate-800"
                                : "font-medium text-slate-600"
                            }`}
                          >
                            {raporConfig.subjudulRapor?.trim()
                              ? raporConfig.subjudulRapor
                              : `Tahun Ajaran ${profile.tahunAjaranAktif} • Semester ${batchRaporSemester || profile.semesterAktif}`}
                          </p>
                        </div>

                        {/* Student Info Box */}
                        <div
                          className="grid grid-cols-2 gap-3 mb-4 py-2 border-0 border-none bg-transparent"
                          style={{ fontSize: `${raporConfig.fontSizeIdentitas || 11}px` }}
                        >
                          <div>
                            <p className="text-slate-600">Nama Peserta Didik: <strong className="text-slate-900">{siswa.nama}</strong></p>
                          </div>
                          <div>
                            <p className="text-slate-600">Kelas: <strong className="text-slate-900">{siswa.kelas}</strong></p>
                          </div>
                        </div>

                        {/* Table of Grades */}
                        {batchRaporType === "tengah" ? (
                          <table
                            className="rapor-print-table w-full text-left border-collapse border border-[#000000] mb-4"
                            style={{ fontSize: `${raporConfig.fontSizeTabelNilai || 11}px` }}
                          >
                            <thead>
                              <tr
                                className="bg-slate-100 text-slate-800 font-bold"
                                style={{ fontSize: `${raporConfig.fontSizeHeaderTabel || 11}px` }}
                              >
                                <th className="border border-[#000000] px-2 py-1 text-center w-8">No</th>
                                <th className="border border-[#000000] px-2 py-1">Mata Pelajaran</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-12">KKM</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-20 text-black">Nilai Prestasi</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-14">Predikat</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentRecords.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="border border-[#000000] px-3 py-3 text-center text-slate-400">
                                    Belum ada nilai yang diinputkan untuk siswa ini.
                                  </td>
                                </tr>
                              ) : (
                                (() => {
                                  const batchWajib = sortRecordsByMapelOrder(studentRecords.filter((item) => getMapelSection(item.mapel) === "wajib"));
                                  const batchMulok = sortRecordsByMapelOrder(studentRecords.filter((item) => getMapelSection(item.mapel) === "mulok"));
                                  const batchQuran = sortRecordsByMapelOrder(studentRecords.filter((item) => getMapelSection(item.mapel) === "quran"));

                                  return (
                                    <>
                                      {/* Kelompok A: Muatan Wajib */}
                                      <tr className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                                        <td colSpan={5} className="border border-[#000000] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100">
                                          A. Muatan Wajib
                                        </td>
                                      </tr>
                                      {batchWajib.length === 0 ? (
                                        <tr className="text-[11px]">
                                          <td colSpan={5} className="border border-[#000000] px-2 py-1 text-center text-slate-400 italic">
                                            - Belum ada mata pelajaran muatan wajib -
                                          </td>
                                        </tr>
                                      ) : (
                                        batchWajib.map((item, idx) => {
                                          const mid = getStudentMid(item);
                                          const mapelObj = mapelList.find(
                                            (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                          );
                                          const kkm = mapelObj?.kkm || 75;

                                          return (
                                            <tr key={item.id} className="text-[11px]">
                                              <td className="border border-[#000000] px-2 py-1 text-center">{idx + 1}</td>
                                              <td className="border border-[#000000] px-2 py-1 font-semibold">
                                                <div className="flex items-center justify-between group/row">
                                                  <span>{item.mapel}</span>
                                                  <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                      type="button"
                                                      disabled={idx === 0}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "up", batchWajib);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Atas`}
                                                    >
                                                      <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={idx === batchWajib.length - 1}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "down", batchWajib);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Bawah`}
                                                    >
                                                      <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold text-black font-mono">
                                                {mid.nilaiMid}
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                                {mid.predikatMid}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}

                                      {/* Kelompok B: Muatan Lokal */}
                                      <tr className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                                        <td colSpan={5} className="border border-[#000000] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100">
                                          B. Muatan Lokal
                                        </td>
                                      </tr>
                                      {batchMulok.length === 0 ? (
                                        <tr className="text-[11px]">
                                          <td colSpan={5} className="border border-[#000000] px-2 py-1 text-center text-slate-400 italic">
                                            - Tidak ada mata pelajaran muatan lokal -
                                          </td>
                                        </tr>
                                      ) : (
                                        batchMulok.map((item, idx) => {
                                          const mid = getStudentMid(item);
                                          const mapelObj = mapelList.find(
                                            (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                          );
                                          const kkm = mapelObj?.kkm || 75;

                                          return (
                                            <tr key={item.id} className="text-[11px]">
                                              <td className="border border-[#000000] px-2 py-1 text-center">{idx + 1}</td>
                                              <td className="border border-[#000000] px-2 py-1 font-semibold">
                                                <div className="flex items-center justify-between group/row">
                                                  <span>{item.mapel}</span>
                                                  <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                      type="button"
                                                      disabled={idx === 0}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "up", batchMulok);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Atas`}
                                                    >
                                                      <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={idx === batchMulok.length - 1}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "down", batchMulok);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Bawah`}
                                                    >
                                                      <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold text-black font-mono">
                                                {mid.nilaiMid}
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                                {mid.predikatMid}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}

                                      {/* Kelompok C: Kecerdasan Al-Qur'an */}
                                      <tr className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                                        <td colSpan={5} className="border border-[#000000] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100">
                                          C. Kecerdasan Al-Qur&apos;an
                                        </td>
                                      </tr>
                                      {batchQuran.length === 0 ? (
                                        <tr className="text-[11px]">
                                          <td colSpan={5} className="border border-[#000000] px-2 py-1 text-center text-slate-400 italic">
                                            - Tidak ada mata pelajaran kecerdasan al-qur&apos;an -
                                          </td>
                                        </tr>
                                      ) : (
                                        batchQuran.map((item, idx) => {
                                          const mid = getStudentMid(item);
                                          const mapelObj = mapelList.find(
                                            (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                          );
                                          const kkm = mapelObj?.kkm || 75;

                                          return (
                                            <tr key={item.id} className="text-[11px]">
                                              <td className="border border-[#000000] px-2 py-1 text-center">{idx + 1}</td>
                                              <td className="border border-[#000000] px-2 py-1 font-semibold">
                                                <div className="flex items-center justify-between group/row">
                                                  <span>{item.mapel}</span>
                                                  <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                      type="button"
                                                      disabled={idx === 0}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "up", batchQuran);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Atas`}
                                                    >
                                                      <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={idx === batchQuran.length - 1}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "down", batchQuran);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Bawah`}
                                                    >
                                                      <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold text-black font-mono">
                                                {mid.nilaiMid}
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                                {mid.predikatMid}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </>
                                  );
                                })()
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-semibold text-[11px]">
                                <td colSpan={3} className="border border-[#000000] px-3 py-1 text-right">
                                  Rata-Rata Nilai Rapor STS:
                                </td>
                                <td className="border border-[#000000] px-2 py-1 text-center font-bold text-black font-mono">
                                  {midAvg}
                                </td>
                                <td colSpan={1} className="border border-[#000000] px-2 py-1 text-center text-slate-700 font-bold">
                                  {midAvg >= 88 ? "A" : midAvg >= 75 ? "B" : "C"}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        ) : (
                          <table
                            className="rapor-print-table w-full text-left border-collapse border border-[#000000] mb-4"
                            style={{ fontSize: `${raporConfig.fontSizeTabelNilai || 11}px` }}
                          >
                            <thead>
                              <tr
                                className="bg-slate-100 text-slate-800 font-bold"
                                style={{ fontSize: `${raporConfig.fontSizeHeaderTabel || 11}px` }}
                              >
                                <th className="border border-[#000000] px-2 py-1 text-center w-8">No</th>
                                <th className="border border-[#000000] px-2 py-1">Mata Pelajaran</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-12">KKM</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-16">UH (30%)</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-16">Mid (30%)</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-16">UAS (40%)</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-16 bg-blue-50">Nilai Akhir</th>
                                <th className="border border-[#000000] px-2 py-1 text-center w-14">Predikat</th>
                                <th className="border border-[#000000] px-2 py-1">Catatan Capaian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentRecords.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="border border-[#000000] px-3 py-3 text-center text-slate-400">
                                    Belum ada nilai yang diinputkan untuk siswa ini.
                                  </td>
                                </tr>
                              ) : (
                                (() => {
                                  const batchWajib = sortRecordsByMapelOrder(studentRecords.filter((item) => getMapelSection(item.mapel) === "wajib"));
                                  const batchMulok = sortRecordsByMapelOrder(studentRecords.filter((item) => getMapelSection(item.mapel) === "mulok"));
                                  const batchQuran = sortRecordsByMapelOrder(studentRecords.filter((item) => getMapelSection(item.mapel) === "quran"));

                                  return (
                                    <>
                                      {/* Kelompok A: Muatan Wajib */}
                                      <tr className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                                        <td colSpan={9} className="border border-[#000000] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100">
                                          A. Muatan Wajib
                                        </td>
                                      </tr>
                                      {batchWajib.length === 0 ? (
                                        <tr className="text-[11px]">
                                          <td colSpan={9} className="border border-[#000000] px-2 py-1 text-center text-slate-400 italic">
                                            - Belum ada mata pelajaran muatan wajib -
                                          </td>
                                        </tr>
                                      ) : (
                                        batchWajib.map((item, idx) => {
                                          const akhir = getStudentAkhir(item);
                                          const mapelObj = mapelList.find(
                                            (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                          );
                                          const kkm = mapelObj?.kkm || 75;

                                          return (
                                            <tr key={item.id} className="text-[11px]">
                                              <td className="border border-[#000000] px-2 py-1 text-center">{idx + 1}</td>
                                              <td className="border border-[#000000] px-2 py-1 font-semibold">
                                                <div className="flex items-center justify-between group/row">
                                                  <span>{item.mapel}</span>
                                                  <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                      type="button"
                                                      disabled={idx === 0}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "up", batchWajib);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Atas`}
                                                    >
                                                      <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={idx === batchWajib.length - 1}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "down", batchWajib);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Bawah`}
                                                    >
                                                      <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.tugas}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uts}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uas}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold text-blue-800 bg-blue-50/50 font-mono">
                                                {akhir.nilaiAkhir}
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                                {akhir.predikat}
                                              </td>
                                              <td
                                                className="border border-[#000000] px-2 py-1 text-slate-600"
                                                style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}
                                              >
                                                {akhir.catatan || "-"}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}

                                      {/* Kelompok B: Muatan Lokal */}
                                      <tr className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                                        <td colSpan={9} className="border border-[#000000] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100">
                                          B. Muatan Lokal
                                        </td>
                                      </tr>
                                      {batchMulok.length === 0 ? (
                                        <tr className="text-[11px]">
                                          <td colSpan={9} className="border border-[#000000] px-2 py-1 text-center text-slate-400 italic">
                                            - Tidak ada mata pelajaran muatan lokal -
                                          </td>
                                        </tr>
                                      ) : (
                                        batchMulok.map((item, idx) => {
                                          const akhir = getStudentAkhir(item);
                                          const mapelObj = mapelList.find(
                                            (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                          );
                                          const kkm = mapelObj?.kkm || 75;

                                          return (
                                            <tr key={item.id} className="text-[11px]">
                                              <td className="border border-[#000000] px-2 py-1 text-center">{idx + 1}</td>
                                              <td className="border border-[#000000] px-2 py-1 font-semibold">
                                                <div className="flex items-center justify-between group/row">
                                                  <span>{item.mapel}</span>
                                                  <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                      type="button"
                                                      disabled={idx === 0}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "up", batchMulok);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Atas`}
                                                    >
                                                      <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={idx === batchMulok.length - 1}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "down", batchMulok);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Bawah`}
                                                    >
                                                      <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.tugas}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uts}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uas}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold text-blue-800 bg-blue-50/50 font-mono">
                                                {akhir.nilaiAkhir}
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                                {akhir.predikat}
                                              </td>
                                              <td
                                                className="border border-[#000000] px-2 py-1 text-slate-600"
                                                style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}
                                              >
                                                {akhir.catatan || "-"}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}

                                      {/* Kelompok C: Kecerdasan Al-Qur'an */}
                                      <tr className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                                        <td colSpan={9} className="border border-[#000000] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-100">
                                          C. Kecerdasan Al-Qur&apos;an
                                        </td>
                                      </tr>
                                      {batchQuran.length === 0 ? (
                                        <tr className="text-[11px]">
                                          <td colSpan={9} className="border border-[#000000] px-2 py-1 text-center text-slate-400 italic">
                                            - Tidak ada mata pelajaran kecerdasan al-qur&apos;an -
                                          </td>
                                        </tr>
                                      ) : (
                                        batchQuran.map((item, idx) => {
                                          const akhir = getStudentAkhir(item);
                                          const mapelObj = mapelList.find(
                                            (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
                                          );
                                          const kkm = mapelObj?.kkm || 75;

                                          return (
                                            <tr key={item.id} className="text-[11px]">
                                              <td className="border border-[#000000] px-2 py-1 text-center">{idx + 1}</td>
                                              <td className="border border-[#000000] px-2 py-1 font-semibold">
                                                <div className="flex items-center justify-between group/row">
                                                  <span>{item.mapel}</span>
                                                  <div className="flex items-center gap-0.5 print:hidden opacity-30 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                      type="button"
                                                      disabled={idx === 0}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "up", batchQuran);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Atas`}
                                                    >
                                                      <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={idx === batchQuran.length - 1}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveMapelInSection(item.mapel, "down", batchQuran);
                                                      }}
                                                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                                      title={`Pindahkan "${item.mapel}" ke Bawah`}
                                                    >
                                                      <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{kkm}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.tugas}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uts}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-mono">{item.uas}</td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold text-blue-800 bg-blue-50/50 font-mono">
                                                {akhir.nilaiAkhir}
                                              </td>
                                              <td className="border border-[#000000] px-2 py-1 text-center font-bold">
                                                {akhir.predikat}
                                              </td>
                                              <td
                                                className="border border-[#000000] px-2 py-1 text-slate-600"
                                                style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}
                                              >
                                                {akhir.catatan || "-"}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </>
                                  );
                                })()
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-semibold text-[11px]">
                                <td colSpan={6} className="border border-[#000000] px-3 py-1 text-right">
                                  Rata-Rata Nilai Rapor Akhir Semester (PAS):
                                </td>
                                <td className="border border-[#000000] px-2 py-1 text-center font-bold text-blue-800 font-mono bg-blue-50">
                                  {akhirAvg}
                                </td>
                                <td colSpan={2} className="border border-[#000000] px-3 py-1 text-slate-600">
                                  Predikat:{" "}
                                  <strong>
                                    {akhirAvg >= 88 ? "A (Sangat Baik)" : akhirAvg >= 75 ? "B (Baik)" : "C (Cukup)"}
                                  </strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        )}

                        {/* Tabel Ketidakhadiran (Presensi Siswa) & Tabel KKM */}
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                          {raporConfig.showPresensi !== false && (
                            <div className="w-full sm:w-72">
                              <table
                                className="rapor-print-table w-full border-collapse border border-[#000000]"
                                style={{ fontSize: `${raporConfig.fontSizePresensi || 11}px` }}
                              >
                                <thead>
                                  <tr className="bg-slate-100 text-slate-900 font-bold">
                                    <th
                                      colSpan={2}
                                      className="border border-[#000000] px-3 py-1 text-left uppercase tracking-wider"
                                      style={{ fontSize: `${(raporConfig.fontSizePresensi || 11) - 1}px` }}
                                    >
                                      Ketidakhadiran
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">
                                      1. Sakit
                                    </td>
                                    <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">
                                      {att.sakit} hari
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">
                                      2. Izin
                                    </td>
                                    <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">
                                      {att.izin} hari
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">
                                      3. Tanpa Keterangan
                                    </td>
                                    <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">
                                      {att.alpa} hari
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Tabel KKM & Interval Predikat */}
                          {renderTabelKkmComponent()}
                        </div>

                        {/* Signature Area (3 Kolom: Kepala Sekolah, Wali Kelas, Orang Tua / Wali Santri) */}
                        <div
                          className="pt-6 border-0 border-none"
                          style={{ fontSize: `${raporConfig.fontSizeTitimangsa || 11}px` }}
                        >
                          {/* Titimangsa Alamat dan Tanggal Rapor */}
                          <div className="flex justify-end mb-2 pr-4">
                            <p className="text-slate-800 font-medium">
                              {raporConfig.tempatRapor},{" "}
                              {batchRaporType === "tengah"
                                ? (raporConfig.tanggalRaporSTS || raporConfig.tanggalRapor)
                                : (raporConfig.tanggalRaporSAS || raporConfig.tanggalRapor)}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 text-center gap-4">
                            {/* Kolom 1: Kepala Sekolah */}
                            <div>
                              {raporConfig.showTtdKepsek !== false && (
                                <>
                                  <p className="text-slate-600">Mengetahui,</p>
                                  <p className="text-slate-800 font-medium">
                                    {raporConfig.labelKepalaSekolah || "Kepala Sekolah"},
                                  </p>
                                  <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                                  <p
                                    style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                                    className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                                      raporConfig.underlineNamaTtd !== false ? "underline" : ""
                                    }`}
                                  >
                                    {raporConfig.customKepalaSekolah || profile.kepalaSekolah}
                                  </p>
                                  {raporConfig.nipKepalaSekolah && (
                                    <p
                                      className="text-slate-600 mt-0.5"
                                      style={{ fontSize: `${Math.max(8, (raporConfig.fontSizeTitimangsa || 11) - 2)}px` }}
                                    >
                                      NIP. {raporConfig.nipKepalaSekolah}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Kolom 2: Wali Kelas */}
                            <div>
                              {raporConfig.showTtdWali !== false && (
                                <>
                                  <p className="text-slate-600 invisible">Mengetahui,</p>
                                  <p className="text-slate-800 font-medium">Wali Kelas,</p>
                                  <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                                  <p
                                    style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                                    className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                                      raporConfig.underlineNamaTtd !== false ? "underline" : ""
                                    }`}
                                  >
                                    {waliNama}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Kolom 3: Orang Tua / Wali Santri */}
                            <div>
                              {raporConfig.showTtdOrtu !== false && (
                                <>
                                  <p className="text-slate-600 invisible">Mengetahui,</p>
                                  <p className="text-slate-800 font-medium">Orang Tua / Wali Santri,</p>
                                  <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                                  <p
                                    style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                                    className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                                      raporConfig.underlineNamaTtd !== false ? "underline" : ""
                                    }`}
                                  >
                                    {siswa.namaWali || "................................................"}
                                  </p>
                                </>
                              )}
                            </div>
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
                {/* Banner Mode Input jika isLegerEditMode */}
                {isLegerEditMode && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm no-print">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm shrink-0">
                        <TableProperties className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-purple-950">
                            Mode Input Nilai Matriks Rombel ({batchSelectedKelas === "Semua" ? "Semua Kelas" : `Kelas ${batchSelectedKelas}`})
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            {batchRaporType === "tengah" ? "Nilai STS (Mid)" : "Nilai SAS (Akhir)"} &bull; Sem. {batchRaporSemester}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Ketik nilai (0-100) langsung pada tabel di bawah. Total nilai, rata-rata, peringkat (#rank), dan status tuntas dihitung secara otomatis real-time. Klik tombol <strong>Simpan Nilai Leger</strong> setelah selesai.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={handleDownloadLegerExcelTemplate}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Unduh format tabel Excel untuk input nilai kelas ini secara offline"
                      >
                        <Download className="h-3.5 w-3.5 text-teal-600" />
                        <span>Format Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => legerFileInputRef.current?.click()}
                        disabled={isLegerImporting}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                        title="Impor nilai dari file Excel (.xlsx, .xls) ke tabel leger"
                      >
                        {isLegerImporting ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                        <span>{isLegerImporting ? "Mengimpor..." : "Impor Excel"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFillAllKkmEmpty}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Otomatis isi seluruh nilai kosong dengan standar KKM mapel"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        <span>Isi KKM Kosong</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLegerScores}
                        disabled={isLegerSaving || isLegerImporting}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isLegerSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        <span>{isLegerSaving ? "Menyimpan..." : "Simpan Nilai Leger"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Kop Surat Leger */}
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                  <h2 className="text-lg font-black uppercase text-slate-900">
                    {profile.namaSekolah}
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    NPSN: {profile.npsn} &bull; Akreditasi: {profile.akreditasi} &bull; {profile.alamat}
                  </p>
                  <h3 className="text-base font-extrabold uppercase mt-2 text-indigo-950">
                    {isLegerEditMode ? "INPUT & REKAP NILAI HASIL BELAJAR" : "BUKU LEGER NILAI HASIL BELAJAR"} {batchRaporType === "tengah" ? "SUMATIF TENGAH SEMESTER (STS)" : "SUMATIF AKHIR SEMESTER (SAS)"}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Kelas: <strong>{batchSelectedKelas === "Semua" ? "Semua Kelas" : batchSelectedKelas}</strong> &bull; Semester: <strong>{batchRaporSemester || profile.semesterAktif}</strong> &bull; Tahun Ajaran: <strong>{profile.tahunAjaranAktif}</strong> &bull; Mapel Rombel: <strong>{currentLegerMapelList.length} Mapel</strong>
                  </p>
                </div>

                {/* Tabel Leger Nilai Komprehensif */}
                {(() => {
                  const rankedStudents = batchStudents
                    .map((s) => {
                      const records = nilaiList.filter(
                        (n) =>
                          n.siswaId === s.id &&
                          (n.semester || "Ganjil").toLowerCase() === (batchRaporSemester || "Ganjil").toLowerCase() &&
                          (batchRaporType === "tengah" ? isRecordStsFilled(n) : isRecordSasFilled(n))
                      );
                      let total = 0;
                      let count = 0;
                      const scoresByMapel: Record<string, number> = {};

                      currentLegerMapelList.forEach((m) => {
                        if (isLegerEditMode) {
                          const key = `${s.id}_${m.nama}`;
                          const rawVal = legerInputScores[key];
                          if (rawVal !== "" && rawVal !== undefined) {
                            const val = Number(rawVal) || 0;
                            scoresByMapel[m.nama] = val;
                            if (val > 0) {
                              total += val;
                              count++;
                            }
                          } else {
                            scoresByMapel[m.nama] = 0;
                          }
                        } else {
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
                            {currentLegerMapelList.map((m) => (
                              <th
                                key={m.id}
                                className="border border-slate-300 px-2 py-2 text-center min-w-[70px]"
                                title={`${m.nama} (KKM: ${m.kkm || 75})`}
                              >
                                <span className="block truncate max-w-[75px]">{m.nama}</span>
                                <span className="text-[9px] font-normal text-slate-500">KKM {m.kkm || 75}</span>
                                {isLegerEditMode && (
                                  <button
                                    type="button"
                                    onClick={() => handleFillKkmForMapel(m.nama, m.kkm || 75)}
                                    className="mt-0.5 block mx-auto text-[8px] leading-tight px-1 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 cursor-pointer no-print transition-all"
                                    title={`Isi otomatis nilai kosong pada mapel ${m.nama} dengan KKM (${m.kkm || 75})`}
                                  >
                                    Isi KKM
                                  </button>
                                )}
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
                              <td colSpan={currentLegerMapelList.length + 8} className="text-center py-6 text-slate-400">
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
                                {currentLegerMapelList.map((m) => {
                                  const rawVal = isLegerEditMode
                                    ? (legerInputScores[`${s.id}_${m.nama}`] ?? "")
                                    : s.scoresByMapel[m.nama];
                                  const numVal = Number(rawVal) || 0;
                                  const kkm = m.kkm || 75;
                                  const isFilled = rawVal !== "" && rawVal !== undefined;
                                  const isTuntas = numVal >= kkm;

                                  if (isLegerEditMode) {
                                    return (
                                      <td
                                        key={m.id}
                                        className={`border border-slate-300 p-1 text-center ${
                                          !isFilled
                                            ? "bg-slate-50/50"
                                            : isTuntas
                                            ? "bg-emerald-50/40"
                                            : "bg-rose-50/50"
                                        }`}
                                      >
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={rawVal}
                                          placeholder="-"
                                          onChange={(e) =>
                                            handleLegerScoreChange(s.id, m.nama, e.target.value)
                                          }
                                          className={`w-14 text-center font-mono text-xs font-bold py-1 px-1 rounded border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            !isFilled
                                              ? "border-slate-200 bg-white text-slate-400 placeholder:text-slate-300"
                                              : isTuntas
                                              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                              : "border-rose-300 bg-rose-50 text-rose-700 font-black"
                                          }`}
                                          title={`${s.nama} - ${m.nama} (KKM: ${kkm})`}
                                        />
                                      </td>
                                    );
                                  }

                                  return (
                                    <td
                                      key={m.id}
                                      className={`border border-slate-300 px-2 py-1.5 text-center font-mono ${
                                        numVal === 0
                                          ? "text-slate-300"
                                          : isTuntas
                                          ? "text-slate-800 font-semibold"
                                          : "text-rose-600 font-bold bg-rose-50"
                                      }`}
                                    >
                                      {numVal > 0 ? numVal : "-"}
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
                {!isLegerEditMode && (
                  <div className="grid grid-cols-2 text-center text-xs pt-8 border-0 border-none">
                    <div>
                      <p className="text-slate-500">Mengetahui,</p>
                      <p className="font-bold">Kepala Sekolah</p>
                      <div className="h-16" />
                      <p className="font-bold underline text-sm">{profile.kepalaSekolah}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">{raporConfig.tempatRapor}, {raporConfig.tanggalRapor}</p>
                      <p className="font-bold">Wali Kelas</p>
                      <div className="h-16" />
                      <p className="font-bold underline text-sm">{teacherScope.teacherName || user?.name || "Wali Kelas"}</p>
                      <p className="text-[10px] text-slate-400">Guru Pembina / Wali Kelas</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Footer for Batch Rapor (No Print) */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="text-xs text-slate-500 font-medium">
                Total Siswa: <strong>{batchStudents.length} Peserta Didik</strong> &bull; Rombel: <strong>{batchSelectedKelas === "Semua" ? "Semua Kelas" : `Kelas ${batchSelectedKelas}`}</strong>
                {isLegerEditMode && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    &bull; Mode Input Matriks Aktif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isLegerEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleFillAllKkmEmpty}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span>Isi KKM Kosong</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLegerScores}
                      disabled={isLegerSaving}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLegerSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>{isLegerSaving ? "Menyimpan Nilai..." : "Simpan Seluruh Nilai Leger"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBatchRaporOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                      <span>Tutup</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handlePrintReport(
                          batchRaporViewMode === "bundel"
                            ? `Bundel_Rapor_${batchRaporType.toUpperCase()}_Kelas_${batchSelectedKelas}`
                            : `Buku_Leger_Nilai_${batchRaporType.toUpperCase()}_Kelas_${batchSelectedKelas}`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Cetak Dokumen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (batchRaporViewMode === "bundel") {
                          handleExportBatchRapor("xlsx");
                        } else {
                          handleDownloadLegerExcelTemplate();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-700/20 transition-all cursor-pointer"
                      title="Ekspor ke spreadsheet Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Ekspor Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBatchRaporOpen(false)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                      <span>Tutup / Kembali</span>
                    </button>
                  </>
                )}
              </div>
            </div>
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

      {/* ========================================================================= */}
      {/* MODAL KHUSUS: FORMAT CETAK RAPOR & PRATINJAU LANGSUNG (LIVE PREVIEW)      */}
      {/* ========================================================================= */}
      {isAdmin && isFormatRaporModalOpen && (() => {
        // Data Siswa untuk Pratinjau
        const previewStudent: Siswa = (() => {
          if (formatPreviewSource === "siswa" && siswaList.length > 0) {
            const found = siswaList.find((s) => s.id === formatPreviewSelectedSiswaId);
            if (found) return found;
            return siswaList[0];
          }
          return {
            id: "demo-preview-student",
            nama: "Ahmad Fauzan Pratama",
            nisn: "0123456789",
            kelas: "VI-A",
            namaWali: "H. Muhammad Pratama",
            jenisKelamin: "L",
            tanggalLahir: "2012-05-15",
            tempatLahir: "Jakarta",
            alamat: "Jl. Pendidikan No. 45",
            noHpWali: "08123456789",
            status: "Aktif",
            avatar: "",
          } as Siswa;
        })();

        // Data Nilai Mata Pelajaran untuk Pratinjau
        const previewSubjects = (() => {
          if (formatPreviewSource === "siswa" && previewStudent?.id) {
            const existingRecords = nilaiList.filter(
              (n) => n.siswaId === previewStudent.id && n.semester === formatPreviewSemester
            );
            if (existingRecords.length > 0) {
              return existingRecords.map((r) => {
                const foundMapel = mapelList.find(
                  (m) => m.nama.toLowerCase().trim() === r.mapel.toLowerCase().trim()
                );
                const kkm = foundMapel?.kkm || 75;
                const tugas = r.tugas || 0;
                const uts = r.uts || 0;
                const uas = r.uas || 0;
                const akhir = Math.round(0.3 * tugas + 0.3 * uts + 0.4 * uas);
                const pred =
                  formatPreviewType === "tengah"
                    ? calculateMidGrade(uts).predikatMid
                    : calculateSemesterGrade(tugas, uts, uas).predikat;
                return {
                  nama: r.mapel,
                  kkm,
                  tugas,
                  uts,
                  uas,
                  akhir,
                  predikat: pred,
                  catatan:
                    r.catatanMid ||
                    r.catatan ||
                    "Menunjukkan pemahaman yang sangat baik dan aktif dalam seluruh kegiatan pembelajaran.",
                };
              });
            }
          }

          // Fallback Data Simulasi Lengkap (12 Mata Pelajaran)
          return [
            // Muatan Wajib
            { nama: "Pendidikan Agama Islam", kkm: 75, tugas: 88, uts: 86, uas: 90, akhir: 88, predikat: "A", catatan: "Sangat baik dalam memahami materi fikih ibadah dan berakhlak terpuji." },
            { nama: "Pendidikan Pancasila", kkm: 75, tugas: 82, uts: 80, uas: 84, akhir: 82, predikat: "B", catatan: "Baik dalam mengamalkan nilai gotong royong dan musyawarah mufakat." },
            { nama: "Bahasa Indonesia", kkm: 75, tugas: 85, uts: 88, uas: 86, akhir: 86, predikat: "A", catatan: "Menunjukkan pemahaman teks fiksi dan literasi bacaan yang sangat memuaskan." },
            { nama: "Matematika", kkm: 75, tugas: 80, uts: 82, uas: 85, akhir: 83, predikat: "B", catatan: "Baik dalam menguasai operasi pecahan dan jaring-jaring bangun ruang." },
            { nama: "Ilmu Pengetahuan Alam dan Sosial (IPAS)", kkm: 75, tugas: 87, uts: 85, uas: 88, akhir: 87, predikat: "A", catatan: "Sangat antusias dalam eksperimen sains dan pemeliharaan lingkungan." },
            { nama: "Bahasa Inggris", kkm: 75, tugas: 84, uts: 85, uas: 86, akhir: 85, predikat: "A", catatan: "Lancar dalam percakapan tematik harian dan kosakata dasar bahasa Inggris." },
            { nama: "Seni Budaya dan Prakarya", kkm: 75, tugas: 86, uts: 88, uas: 90, akhir: 88, predikat: "A", catatan: "Sangat kreatif dan terampil dalam membuat karya seni rupa daerah." },
            { nama: "Pendidikan Jasmani, Olahraga & Kesehatan", kkm: 75, tugas: 85, uts: 86, uas: 88, akhir: 86, predikat: "A", catatan: "Memiliki kebugaran jasmani dan sportivitas yang sangat baik dalam berolahraga." },
            // Muatan Lokal
            { nama: "Bahasa Sunda", kkm: 75, tugas: 82, uts: 80, uas: 84, akhir: 82, predikat: "B", catatan: "Cukup fasih melafalkan percakapan undak-usuk basa santun sehari-hari." },
            { nama: "Keterampilan Komputer (TIK)", kkm: 75, tugas: 90, uts: 92, uas: 94, akhir: 92, predikat: "A", catatan: "Sangat terampil menggunakan aplikasi pengetikan dan dokumen digital." },
            // Kecerdasan Al-Qur'an
            { nama: "Tahsin / Tilawati", kkm: 80, tugas: 92, uts: 90, uas: 94, akhir: 92, predikat: "A", catatan: "Makhraj dan hukum tajwid sangat tartil, bacaan fasih dan lancar." },
            { nama: "Tahfidz Al-Qur'an", kkm: 80, tugas: 95, uts: 94, uas: 96, akhir: 95, predikat: "A", catatan: "Hafalan Juz 30 mutqin dan lancar dengan tajwid dan makhorijul huruf tepat." },
          ];
        })();

        // Pengelompokan & Urutan Mapel Pratinjau
        const previewWajib = sortRecordsByMapelOrder(previewSubjects.filter((m) => getMapelSection(m.nama) === "wajib"));
        const previewMulok = sortRecordsByMapelOrder(previewSubjects.filter((m) => getMapelSection(m.nama) === "mulok"));
        const previewQuran = sortRecordsByMapelOrder(previewSubjects.filter((m) => getMapelSection(m.nama) === "quran"));

        // Info Wali Kelas & Kepala Sekolah
        const previewMatchedKelas = kelasList.find((k) => isClassMatch(k.nama, previewStudent.kelas));
        const previewMatchedWali = previewMatchedKelas
          ? guruList.find((g) => g.id === previewMatchedKelas.waliKelasId)
          : null;
        const previewWaliNama =
          (previewMatchedWali?.nama ? `${previewMatchedWali.nama}, ${previewMatchedWali.gelar || ""}`.trim() : null) ||
          previewMatchedKelas?.waliKelasNama ||
          "Ustadzah Siti Aisyah, S.Pd.";

        const previewTgl =
          formatPreviewType === "tengah"
            ? (raporConfig.tanggalRaporSTS || raporConfig.tanggalRapor)
            : (raporConfig.tanggalRaporSAS || raporConfig.tanggalRapor);

        const previewKepsekNama = raporConfig.customKepalaSekolah?.trim() || profile.kepalaSekolah;
        const previewKepsekLabel = raporConfig.labelKepalaSekolah?.trim() || "Kepala Sekolah";

        const previewJudulText =
          formatPreviewType === "tengah"
            ? (raporConfig.judulRaporSTS || "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)")
            : (raporConfig.judulRaporSAS || "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)");

        const previewSubjudulText = raporConfig.subjudulRapor?.trim()
          ? raporConfig.subjudulRapor
          : `Tahun Ajaran ${profile.tahunAjaranAktif} • Semester ${formatPreviewSemester}`;

        const previewFontFamily = getFontFamilyCss(
          raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor
        );

        const previewCellPadding =
          raporConfig.paddingTabel === "kompak"
            ? "px-2 py-1"
            : raporConfig.paddingTabel === "longgar"
            ? "px-3 py-2.5"
            : "px-2.5 py-1.5";

        const handleSaveConfig = () => {
          try {
            localStorage.setItem("simpro_rapor_config", JSON.stringify(raporConfig));
            setFormatSaveToast(true);
            setTimeout(() => setFormatSaveToast(false), 2500);
          } catch (e) {
            console.error(e);
          }
        };

        const handleResetConfig = () => {
          if (confirm("Kembalikan seluruh format cetak rapor ke setelan bawaan standar?")) {
            const def = getDefaultRaporConfig();
            setRaporConfig(def);
            try {
              localStorage.setItem("simpro_rapor_config", JSON.stringify(def));
            } catch (e) {}
            setFormatSaveToast(true);
            setTimeout(() => setFormatSaveToast(false), 2000);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col h-full max-h-[96vh] max-w-[1700px] w-full mx-auto overflow-hidden">
              {/* Header Modal */}
              <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Pengaturan Format Cetak Rapor
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Live Interactive Preview
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ubah Kop Rapor, Judul Rapor, Titimangsa & Tanda Tangan, Ukuran Font, dan lihat perubahannya secara instan.
                    </p>
                  </div>
                </div>

                {/* Status Toast & Actions */}
                <div className="flex items-center gap-2.5">
                  {formatSaveToast && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 animate-in fade-in duration-150">
                      <Check className="h-4 w-4" />
                      <span>Format Berhasil Disimpan!</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Kembalikan semua setelan ke default"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reset Default</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                    title="Simpan pengaturan format ini"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Format</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintFormatRapor}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
                    title="Cetak lembar pratinjau ini"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Cetak / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleExportSingleRapor(
                        previewStudent,
                        formatPreviewType,
                        formatPreviewSemester,
                        "xlsx"
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-700/20 transition-all cursor-pointer active:scale-95"
                    title="Ekspor format rapor pratinjau ini ke file spreadsheet Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Ekspor Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFormatRaporModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body: Two Column Layout (Settings on Left, Live Preview on Right) */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
                {/* ========================================================= */}
                {/* KOLOM KIRI: PANEL PENGATURAN BER-TAB (5 COLS)             */}
                {/* ========================================================= */}
                <div className="lg:col-span-5 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
                  {/* Tab Navigation */}
                  <div className="p-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormatRaporActiveTab("kop")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        formatRaporActiveTab === "kop"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <School className="h-3.5 w-3.5" />
                      <span>Kop Rapor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormatRaporActiveTab("judul")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        formatRaporActiveTab === "judul"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Type className="h-3.5 w-3.5" />
                      <span>Judul Rapor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormatRaporActiveTab("titimangsa")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        formatRaporActiveTab === "titimangsa"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Alamat & Tanggal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormatRaporActiveTab("format")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        formatRaporActiveTab === "format"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Type className="h-3.5 w-3.5" />
                      <span>Jenis & Ukuran Tulisan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormatRaporActiveTab("urutan")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        formatRaporActiveTab === "urutan"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span>Urutan Mapel</span>
                    </button>
                  </div>

                  {/* Tab Scroll Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* TAB 1: KOP RAPOR */}
                    {formatRaporActiveTab === "kop" && (
                      <div className="space-y-4 text-xs">
                        {/* Toggle Kop */}
                        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              Tampilkan Kop Surat Resmi
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Nonaktifkan bila mencetak pada blanko kertas kop yang sudah dicetak sebelumnya.
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={raporConfig.tampilkanKop ?? true}
                              onChange={(e) => updateRaporConfig({ tampilkanKop: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>

                        {/* Logo Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                          {/* Logo Kiri */}
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Logo Kiri (Sekolah/Yayasan)</span>
                            <div className="flex items-center gap-2.5">
                              <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden shrink-0">
                                {raporConfig.logoKiriUrl ? (
                                  <img src={raporConfig.logoKiriUrl} alt="Logo Kiri" className="w-full h-full object-contain" />
                                ) : (
                                  <GraduationCap className="h-6 w-6 text-blue-600" />
                                )}
                              </div>
                              <div className="space-y-1 flex-1">
                                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] cursor-pointer transition-colors shadow-2xs">
                                  <Upload className="h-3 w-3" />
                                  <span>Unggah File</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload("kiri", e)} />
                                </label>
                                {raporConfig.logoKiriUrl && (
                                  <button
                                    type="button"
                                    onClick={() => updateRaporConfig({ logoKiriUrl: "" })}
                                    className="block text-[10px] text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Hapus Logo
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              value={raporConfig.logoKiriUrl}
                              onChange={(e) => updateRaporConfig({ logoKiriUrl: e.target.value })}
                              placeholder="Atau tautan URL gambar..."
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                            />
                          </div>

                          {/* Logo Kanan */}
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Logo Kanan (Dinas/Pemda)</span>
                            <div className="flex items-center gap-2.5">
                              <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden shrink-0">
                                {raporConfig.logoKananUrl ? (
                                  <img src={raporConfig.logoKananUrl} alt="Logo Kanan" className="w-full h-full object-contain" />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-slate-400" />
                                )}
                              </div>
                              <div className="space-y-1 flex-1">
                                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] cursor-pointer transition-colors shadow-2xs">
                                  <Upload className="h-3 w-3" />
                                  <span>Unggah File</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload("kanan", e)} />
                                </label>
                                {raporConfig.logoKananUrl && (
                                  <button
                                    type="button"
                                    onClick={() => updateRaporConfig({ logoKananUrl: "" })}
                                    className="block text-[10px] text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Hapus Logo
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              value={raporConfig.logoKananUrl}
                              onChange={(e) => updateRaporConfig({ logoKananUrl: e.target.value })}
                              placeholder="Atau tautan URL gambar..."
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                            />
                          </div>
                        </div>

                        {/* Ukuran Logo */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">Ukuran Logo Kop:</span>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { id: "sm", label: "Kecil (80px)" },
                              { id: "md", label: "Sedang (96px)" },
                              { id: "lg", label: "Besar (112px)" },
                              { id: "xl", label: "Jumbo (128px)" },
                            ].map((sz) => (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={() => updateRaporConfig({ ukuranLogoKop: sz.id as any })}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center border cursor-pointer transition-all ${
                                  (raporConfig.ukuranLogoKop || "lg") === sz.id
                                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-bold"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                {sz.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Teks Kop & Font Size Per Baris */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">Teks & Ukuran Huruf Tiap Baris Kop:</span>

                          {/* Baris 1 */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Baris 1: Yayasan / Instansi</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Font:</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris1: Math.max(10, (raporConfig.fontSizeBaris1 || 16) - 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">-</button>
                                <span className="w-8 text-center font-mono font-bold text-amber-600">{raporConfig.fontSizeBaris1 || 16}px</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris1: Math.min(26, (raporConfig.fontSizeBaris1 || 16) + 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">+</button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={raporConfig.yayasanNama}
                              onChange={(e) => updateRaporConfig({ yayasanNama: e.target.value })}
                              placeholder="YAYASAN PENDIDIKAN ISLAM..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase text-xs"
                            />
                          </div>

                          {/* Baris 2 */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Baris 2: Nama Sekolah</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Font:</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris2: Math.max(10, (raporConfig.fontSizeBaris2 || 16) - 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">-</button>
                                <span className="w-8 text-center font-mono font-bold text-amber-600">{raporConfig.fontSizeBaris2 || 16}px</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris2: Math.min(28, (raporConfig.fontSizeBaris2 || 16) + 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">+</button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={raporConfig.namaSekolah}
                              onChange={(e) => updateRaporConfig({ namaSekolah: e.target.value })}
                              placeholder="SD ISLAM TERPADU..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase text-xs"
                            />
                          </div>

                          {/* Baris 3 */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Baris 3: NPSN & Status Akreditasi</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Font:</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris3: Math.max(10, (raporConfig.fontSizeBaris3 || 16) - 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">-</button>
                                <span className="w-8 text-center font-mono font-bold text-amber-600">{raporConfig.fontSizeBaris3 || 16}px</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris3: Math.min(22, (raporConfig.fontSizeBaris3 || 16) + 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">+</button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={raporConfig.npsnAkreditasi}
                              onChange={(e) => updateRaporConfig({ npsnAkreditasi: e.target.value })}
                              placeholder="NPSN: 69987654 • TERAKREDITASI A"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs"
                            />
                          </div>

                          {/* Baris 4 */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Baris 4: Alamat & Kontak Resmi</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400">Font:</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris4: Math.max(9, (raporConfig.fontSizeBaris4 || 11) - 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">-</button>
                                <span className="w-8 text-center font-mono font-bold text-amber-600">{raporConfig.fontSizeBaris4 || 11}px</span>
                                <button type="button" onClick={() => updateRaporConfig({ fontSizeBaris4: Math.min(18, (raporConfig.fontSizeBaris4 || 11) + 1) })} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">+</button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={raporConfig.alamatKontak}
                              onChange={(e) => updateRaporConfig({ alamatKontak: e.target.value })}
                              placeholder="Jl. Merdeka No. 12 • Telp: (021) 123456"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          </div>
                        </div>

                        {/* Garis Pembatas Kop */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Garis Pembatas Kop:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateRaporConfig({ garisKop: "double" })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                                raporConfig.garisKop === "double"
                                  ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-bold"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              Garis Ganda (Resmi)
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRaporConfig({ garisKop: "single" })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                                raporConfig.garisKop === "single"
                                  ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-bold"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              Garis Tunggal
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRaporConfig({ garisKop: "none" })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                                raporConfig.garisKop === "none"
                                  ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-bold"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              Tanpa Garis
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: JUDUL RAPOR */}
                    {formatRaporActiveTab === "judul" && (
                      <div className="space-y-4 text-xs">
                        {/* Judul Rapor STS */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                          <label className="font-bold text-slate-700 dark:text-slate-200 block">
                            Judul Rapor Sumatif Tengah Semester (STS)
                          </label>
                          <input
                            type="text"
                            value={raporConfig.judulRaporSTS ?? ""}
                            onChange={(e) => updateRaporConfig({ judulRaporSTS: e.target.value })}
                            placeholder="LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)"
                            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase text-xs"
                          />
                        </div>

                        {/* Judul Rapor SAS */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                          <label className="font-bold text-slate-700 dark:text-slate-200 block">
                            Judul Rapor Sumatif Akhir Semester (SAS)
                          </label>
                          <input
                            type="text"
                            value={raporConfig.judulRaporSAS ?? ""}
                            onChange={(e) => updateRaporConfig({ judulRaporSAS: e.target.value })}
                            placeholder="LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)"
                            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase text-xs"
                          />
                        </div>

                        {/* Format & Ukuran Judul */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">Format Gaya Huruf Judul:</span>
                            <button
                              type="button"
                              onClick={() => setFormatRaporActiveTab("format")}
                              className="text-[11px] text-amber-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Atur Huruf Lengkap &rarr;</span>
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">Font:</span>
                              <select
                                value={raporConfig.customFontName ? "custom" : (raporConfig.fontFamilyRapor || "Times New Roman")}
                                onChange={(e) => {
                                  if (e.target.value !== "custom") {
                                    updateRaporConfig({ fontFamilyRapor: e.target.value, customFontName: "" });
                                  }
                                }}
                                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer max-w-[130px] truncate"
                                title="Pilih Jenis Huruf Dokumen Rapor"
                              >
                                {RAPOR_FONT_OPTIONS.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.label}
                                  </option>
                                ))}
                                {raporConfig.customFontName && (
                                  <option value="custom">Kustom: {raporConfig.customFontName}</option>
                                )}
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Ukuran:</span>
                              <button type="button" onClick={() => updateRaporConfig({ fontSizeJudulRapor: Math.max(12, (raporConfig.fontSizeJudulRapor || 16) - 1) })} className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">-</button>
                              <span className="w-10 text-center font-mono font-bold text-amber-600 text-sm">{raporConfig.fontSizeJudulRapor || 16}px</span>
                              <button type="button" onClick={() => updateRaporConfig({ fontSizeJudulRapor: Math.min(26, (raporConfig.fontSizeJudulRapor || 16) + 1) })} className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center cursor-pointer">+</button>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Bold Toggle */}
                              <button
                                type="button"
                                onClick={() => updateRaporConfig({ boldJudulRapor: !(raporConfig.boldJudulRapor ?? true) })}
                                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${
                                  (raporConfig.boldJudulRapor ?? true)
                                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <Bold className="h-3.5 w-3.5" />
                                <span>Tebal</span>
                              </button>

                              {/* Underline Toggle */}
                              <button
                                type="button"
                                onClick={() => updateRaporConfig({ underlineJudulRapor: !(raporConfig.underlineJudulRapor ?? true) })}
                                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${
                                  (raporConfig.underlineJudulRapor ?? true)
                                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs underline"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <UnderlineIcon className="h-3.5 w-3.5" />
                                <span>Garis Bawah</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Subjudul Rapor */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700 dark:text-slate-200">
                              Subjudul Rapor (Tahun Ajaran & Semester)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400">Font:</span>
                              <select
                                value={raporConfig.fontSizeSubjudulRapor || 12}
                                onChange={(e) => updateRaporConfig({ fontSizeSubjudulRapor: Number(e.target.value) })}
                                className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold"
                              >
                                {[10, 11, 12, 13, 14, 15, 16].map((sz) => (
                                  <option key={sz} value={sz}>{sz}px</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => updateRaporConfig({ boldSubjudulRapor: !(raporConfig.boldSubjudulRapor ?? false) })}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${
                                  raporConfig.boldSubjudulRapor
                                    ? "bg-amber-500 text-white border-amber-600"
                                    : "bg-white dark:bg-slate-900 text-slate-600 border-slate-200"
                                }`}
                              >
                                B
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={raporConfig.subjudulRapor || ""}
                            onChange={(e) => updateRaporConfig({ subjudulRapor: e.target.value })}
                            placeholder={`Otomatis: Tahun Ajaran ${profile.tahunAjaranAktif} • Semester ${profile.semesterAktif}`}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                          <p className="text-[10px] text-slate-400 italic">
                            Biarkan kosong bila ingin mengikuti secara dinamis tahun ajaran & semester aktif.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: ALAMAT & TANGGAL RAPOR (TITIMANGSA & TTD) */}
                    {formatRaporActiveTab === "titimangsa" && (
                      <div className="space-y-4 text-xs">
                        {/* Tempat & Tanggal */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">Kota & Tanggal Penerbitan:</span>
                          <div>
                            <label className="text-[11px] text-slate-500 block mb-1">Kota / Tempat Terbit Rapor</label>
                            <input
                              type="text"
                              value={raporConfig.tempatRapor}
                              onChange={(e) => updateRaporConfig({ tempatRapor: e.target.value })}
                              placeholder="Jakarta / Bandung / Surabaya..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] text-slate-500 block mb-1">Tanggal Rapor STS (Tengah Semester)</label>
                              <input
                                type="text"
                                value={raporConfig.tanggalRaporSTS || raporConfig.tanggalRapor}
                                onChange={(e) => updateRaporConfig({ tanggalRaporSTS: e.target.value })}
                                placeholder="Contoh: 27 Maret 2026"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500 block mb-1">Tanggal Rapor SAS (Akhir Semester)</label>
                              <input
                                type="text"
                                value={raporConfig.tanggalRaporSAS || raporConfig.tanggalRapor}
                                onChange={(e) => updateRaporConfig({ tanggalRaporSAS: e.target.value })}
                                placeholder="Contoh: 19 Juni 2026"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Kepala Sekolah Penandatangan */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-200">Penandatangan Kepala Sekolah:</span>
                            <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={raporConfig.showTtdKepsek ?? true}
                                onChange={(e) => updateRaporConfig({ showTtdKepsek: e.target.checked })}
                                className="rounded text-amber-500"
                              />
                              <span>Tampilkan TTD</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] text-slate-500 block mb-1">Label Jabatan</label>
                              <input
                                type="text"
                                value={raporConfig.labelKepalaSekolah || "Kepala Sekolah"}
                                onChange={(e) => updateRaporConfig({ labelKepalaSekolah: e.target.value })}
                                placeholder="Kepala Sekolah / Plt. Kepala Sekolah / Kepala Madrasah"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500 block mb-1">Nama Kepala Sekolah (Kustom)</label>
                              <input
                                type="text"
                                value={raporConfig.customKepalaSekolah ?? ""}
                                onChange={(e) => updateRaporConfig({ customKepalaSekolah: e.target.value })}
                                placeholder={`Bawaan: ${profile.kepalaSekolah}`}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500 block mb-1">NIP Kepala Sekolah (Opsional)</label>
                            <input
                              type="text"
                              value={raporConfig.nipKepalaSekolah ?? ""}
                              onChange={(e) => updateRaporConfig({ nipKepalaSekolah: e.target.value })}
                              placeholder="Contoh: 19800101 200501 1 002"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          </div>
                        </div>

                        {/* Toggle Tanda Tangan Lainnya */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">Kolom Tanda Tangan Pendukung:</span>
                          <div className="space-y-2">
                            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <span className="font-medium text-slate-700 dark:text-slate-200">Tampilkan Tanda Tangan Wali Kelas</span>
                              <input
                                type="checkbox"
                                checked={raporConfig.showTtdWali ?? true}
                                onChange={(e) => updateRaporConfig({ showTtdWali: e.target.checked })}
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <span className="font-medium text-slate-700 dark:text-slate-200">Tampilkan Tanda Tangan Orang Tua / Wali Santri</span>
                              <input
                                type="checkbox"
                                checked={raporConfig.showTtdOrtu ?? true}
                                onChange={(e) => updateRaporConfig({ showTtdOrtu: e.target.checked })}
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Ukuran & Ruang Tanda Tangan (Spasi & Huruf TTD) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">
                              Ukuran & Ruang Tanda Tangan:
                            </span>
                            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50">
                              Tinggi Spasi: {raporConfig.tinggiRuangTtd || 64}px
                            </span>
                          </div>

                          {/* Ruang Kosong TTD (Preset & Stepper) */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] text-slate-500 font-medium">
                                Ruang Kosong Tanda Tangan & Cap / Stempel Basah
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRaporConfig({
                                      tinggiRuangTtd: Math.max(30, (raporConfig.tinggiRuangTtd || 64) - 10),
                                    })
                                  }
                                  className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                  title="Perkecil Ruang TTD"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-amber-600 min-w-[36px] text-center text-xs">
                                  {raporConfig.tinggiRuangTtd || 64}px
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRaporConfig({
                                      tinggiRuangTtd: Math.min(180, (raporConfig.tinggiRuangTtd || 64) + 10),
                                    })
                                  }
                                  className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                  title="Perbesar Ruang TTD"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Preset Buttons */}
                            <div className="grid grid-cols-5 gap-1.5 pt-1">
                              {[
                                { label: "Kompak", val: 48 },
                                { label: "Standar", val: 64 },
                                { label: "Sedang", val: 90 },
                                { label: "Besar", val: 120 },
                                { label: "Jumbo", val: 150 },
                              ].map((preset) => (
                                <button
                                  key={preset.val}
                                  type="button"
                                  onClick={() => updateRaporConfig({ tinggiRuangTtd: preset.val })}
                                  className={`py-1.5 px-1 rounded-lg text-center font-bold text-[10px] border transition-all cursor-pointer ${
                                    (raporConfig.tinggiRuangTtd || 64) === preset.val
                                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <div>{preset.label}</div>
                                  <div className="font-mono text-[9px] opacity-80">{preset.val}px</div>
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 italic">
                              Pilih "Besar" (120px) atau "Jumbo" (150px) jika membutuhkan ruang yang leluasa untuk tanda tangan basah & stempel sekolah.
                            </p>
                          </div>

                          {/* Huruf Nama Penandatangan */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] block">
                                Ukuran Huruf Nama Penandatangan:
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Berlaku untuk Kepala Sekolah, Wali Kelas, & Orang Tua
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Font Size Stepper */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRaporConfig({
                                      fontSizeNamaTtd: Math.max(9, (raporConfig.fontSizeNamaTtd || 12) - 1),
                                    })
                                  }
                                  className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-amber-600 min-w-[32px] text-center text-xs">
                                  {raporConfig.fontSizeNamaTtd || 12}px
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRaporConfig({
                                      fontSizeNamaTtd: Math.min(18, (raporConfig.fontSizeNamaTtd || 12) + 1),
                                    })
                                  }
                                  className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              {/* Bold Toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  updateRaporConfig({ boldNamaTtd: !(raporConfig.boldNamaTtd !== false) })
                                }
                                className={`px-2 py-1 rounded text-xs font-bold border cursor-pointer ${
                                  raporConfig.boldNamaTtd !== false
                                    ? "bg-amber-500 text-white border-amber-600 font-black"
                                    : "bg-white dark:bg-slate-900 text-slate-600 border-slate-200"
                                }`}
                                title="Tebalkan Nama Penandatangan"
                              >
                                B
                              </button>

                              {/* Underline Toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  updateRaporConfig({ underlineNamaTtd: !(raporConfig.underlineNamaTtd !== false) })
                                }
                                className={`px-2 py-1 rounded text-xs font-bold border cursor-pointer ${
                                  raporConfig.underlineNamaTtd !== false
                                    ? "bg-amber-500 text-white border-amber-600 font-black underline"
                                    : "bg-white dark:bg-slate-900 text-slate-600 border-slate-200"
                                }`}
                                title="Garis Bawahi Nama Penandatangan"
                              >
                                U
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: JENIS & UKURAN TULISAN RAPOR */}
                    {formatRaporActiveTab === "format" && (
                      <div className="space-y-4 text-xs">
                        {/* 1. KARTU PILIHAN JENIS TULISAN (FONT FAMILY) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                1. Jenis Tulisan Dokumen (Font Family)
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Pilih jenis huruf resmi untuk seluruh teks pada lembar rapor.
                              </span>
                            </div>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              {raporConfig.customFontName?.trim() || raporConfig.fontFamilyRapor || "Times New Roman"}
                            </span>
                          </div>

                          {/* Grid Kartu Font Populer */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                            {RAPOR_FONT_OPTIONS.map((f) => {
                              const isSelected =
                                !raporConfig.customFontName?.trim() &&
                                (raporConfig.fontFamilyRapor || "Times New Roman").toLowerCase() === f.id.toLowerCase();
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() =>
                                    updateRaporConfig({
                                      fontFamilyRapor: f.id,
                                      customFontName: "",
                                    })
                                  }
                                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                                    isSelected
                                      ? "bg-amber-500/10 border-amber-500 dark:border-amber-500 shadow-2xs ring-1 ring-amber-500"
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                      {f.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                        {f.category}
                                      </span>
                                      {isSelected && (
                                        <Check className="h-3.5 w-3.5 text-amber-600 font-black shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                  <p
                                    style={{ fontFamily: f.css }}
                                    className="text-[12px] text-slate-600 dark:text-slate-300 line-clamp-1 italic"
                                  >
                                    {f.sample}
                                  </p>
                                </button>
                              );
                            })}
                          </div>

                          {/* Opsi Font Kustom */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                              Atau Ketik Nama Font Kustom / Lokal:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={raporConfig.customFontName || ""}
                                onChange={(e) => updateRaporConfig({ customFontName: e.target.value })}
                                placeholder="Contoh: Cambria, Palatino Linotype, Century Gothic..."
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                              />
                              {raporConfig.customFontName && (
                                <button
                                  type="button"
                                  onClick={() => updateRaporConfig({ customFontName: "" })}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. SKALA UKURAN DOKUMEN GLOBAL (A4 AUTO-FIT) */}
                        <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-300/80 dark:border-amber-700/60 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                2. Skala Ukuran Dokumen Global (A4 Auto-Fit)
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Kecilkan skala dokumen jika jumlah mata pelajaran banyak agar pas 1 halaman cetak A4.
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700">
                              <button
                                type="button"
                                onClick={() =>
                                  updateRaporConfig({
                                    skalaUkuranRapor: Math.max(80, (raporConfig.skalaUkuranRapor || 100) - 5),
                                  })
                                }
                                className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                                title="Kecilkan Skala"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 w-10 text-center text-xs">
                                {raporConfig.skalaUkuranRapor || 100}%
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateRaporConfig({
                                    skalaUkuranRapor: Math.min(115, (raporConfig.skalaUkuranRapor || 100) + 5),
                                  })
                                }
                                className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                                title="Perbesar Skala"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Preset Cepat Skala */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {[
                              { sc: 85, label: "85%", desc: "Super Kompak" },
                              { sc: 90, label: "90%", desc: "Kompak" },
                              { sc: 95, label: "95%", desc: "Ringkas" },
                              { sc: 100, label: "100%", desc: "Standar" },
                              { sc: 105, label: "105%", desc: "Besar" },
                              { sc: 110, label: "110%", desc: "Ekstra" },
                            ].map((p) => (
                              <button
                                key={p.sc}
                                type="button"
                                onClick={() => updateRaporConfig({ skalaUkuranRapor: p.sc })}
                                className={`py-1.5 px-1 rounded-lg border text-center cursor-pointer transition-all ${
                                  (raporConfig.skalaUkuranRapor || 100) === p.sc
                                    ? "bg-amber-500 text-white border-amber-600 font-bold shadow-2xs"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span className="block text-[11px] font-bold">{p.label}</span>
                                <span className="block text-[9px] opacity-80">{p.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. PENGATURAN DETAIL UKURAN HURUF TIAP BAGIAN */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            3. Pengaturan Detail Ukuran Huruf Tiap Bagian:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* A. Tabel Nilai: Isi Baris */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Isi Baris Nilai & Mapel
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeTabelNilai: Math.max(8, (raporConfig.fontSizeTabelNilai || 11) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizeTabelNilai || 11}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeTabelNilai: Math.min(14, (raporConfig.fontSizeTabelNilai || 11) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[9, 10, 11, 12, 13].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizeTabelNilai: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizeTabelNilai || 11) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* B. Header Kolom Tabel */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Header Kolom Tabel
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeHeaderTabel: Math.max(8, (raporConfig.fontSizeHeaderTabel || 11) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizeHeaderTabel || 11}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeHeaderTabel: Math.min(14, (raporConfig.fontSizeHeaderTabel || 11) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[9, 10, 11, 12, 13].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizeHeaderTabel: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizeHeaderTabel || 11) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* C. Identitas Siswa */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Identitas Siswa & Kelas
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeIdentitas: Math.max(9, (raporConfig.fontSizeIdentitas || 12) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizeIdentitas || 12}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeIdentitas: Math.min(16, (raporConfig.fontSizeIdentitas || 12) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[10, 11, 12, 13, 14].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizeIdentitas: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizeIdentitas || 12) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* D. Catatan Capaian Guru */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Catatan / Capaian Guru
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeCatatanGuru: Math.max(8, (raporConfig.fontSizeCatatanGuru || 10) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizeCatatanGuru || 10}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeCatatanGuru: Math.min(13, (raporConfig.fontSizeCatatanGuru || 10) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[8, 9, 10, 11, 12].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizeCatatanGuru: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizeCatatanGuru || 10) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* E. Tabel Presensi / Kehadiran */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Tabel Presensi / Kehadiran
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizePresensi: Math.max(8, (raporConfig.fontSizePresensi || 10) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizePresensi || 10}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizePresensi: Math.min(13, (raporConfig.fontSizePresensi || 10) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[8, 9, 10, 11, 12].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizePresensi: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizePresensi || 10) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* F. Titimangsa & Tanda Tangan */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Titimangsa & Tanda Tangan
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeTitimangsa: Math.max(9, (raporConfig.fontSizeTitimangsa || 11) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizeTitimangsa || 11}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeTitimangsa: Math.min(14, (raporConfig.fontSizeTitimangsa || 11) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[9, 10, 11, 12, 13].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizeTitimangsa: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizeTitimangsa || 11) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* G. Tabel KKM & Interval Predikat */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Tabel KKM & Interval Predikat
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeTabelKkm: Math.max(8, (raporConfig.fontSizeTabelKkm || 10) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizeTabelKkm || 10}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeTabelKkm: Math.min(14, (raporConfig.fontSizeTabelKkm || 10) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[8, 9, 10, 11, 12].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizeTabelKkm: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizeTabelKkm || 10) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* H. Nama Penandatangan Rapor */}
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                                  Nama Penandatangan TTD
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeNamaTtd: Math.max(9, (raporConfig.fontSizeNamaTtd || 12) - 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-amber-600 min-w-[28px] text-center text-xs">
                                    {raporConfig.fontSizeNamaTtd || 12}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRaporConfig({
                                        fontSizeNamaTtd: Math.min(18, (raporConfig.fontSizeNamaTtd || 12) + 1),
                                      })
                                    }
                                    className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white font-bold flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[10, 11, 12, 13, 14].map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => updateRaporConfig({ fontSizeNamaTtd: sz })}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                      (raporConfig.fontSizeNamaTtd || 12) === sz
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4. KEPADATAN BARIS TABEL (PADDING) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            4. Kepadatan Spasi Baris Tabel (Row Spacing):
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "kompak", label: "Kompak / Rapat", desc: "py-1" },
                              { id: "sedang", label: "Sedang (Bawaan)", desc: "py-1.5" },
                              { id: "longgar", label: "Longgar / Lapang", desc: "py-2.5" },
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => updateRaporConfig({ paddingTabel: p.id as any })}
                                className={`py-2 px-2 rounded-lg border text-center cursor-pointer transition-all ${
                                  (raporConfig.paddingTabel || "sedang") === p.id
                                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-bold"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <span className="block text-xs">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 5. KOMPONEN KOLOM RAPOR */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            5. Komponen Kolom & Rekap Rapor:
                          </span>
                          <div className="space-y-2">
                            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <span className="font-medium text-slate-700 dark:text-slate-200">Tampilkan Kolom KKM / KKTP</span>
                              <input
                                type="checkbox"
                                checked={raporConfig.showKkm ?? true}
                                onChange={(e) => updateRaporConfig({ showKkm: e.target.checked })}
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <span className="font-medium text-slate-700 dark:text-slate-200">Tampilkan Kolom Predikat Nilai (A, B, C, D)</span>
                              <input
                                type="checkbox"
                                checked={raporConfig.showPredikat ?? true}
                                onChange={(e) => updateRaporConfig({ showPredikat: e.target.checked })}
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <span className="font-medium text-slate-700 dark:text-slate-200">Tampilkan Kolom Catatan Guru / Capaian Kompetensi</span>
                              <input
                                type="checkbox"
                                checked={raporConfig.showCatatanGuru ?? true}
                                onChange={(e) => updateRaporConfig({ showCatatanGuru: e.target.checked })}
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <span className="font-medium text-slate-700 dark:text-slate-200">Tampilkan Tabel Rekap Presensi / Kehadiran Siswa</span>
                              <input
                                type="checkbox"
                                checked={raporConfig.showPresensi ?? true}
                                onChange={(e) => updateRaporConfig({ showPresensi: e.target.checked })}
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </label>

                            <label className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                              <div>
                                <span className="font-medium text-slate-700 dark:text-slate-200 block">
                                  Tampilkan Tabel KKM & Interval Predikat (A, B, C, D)
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Menampilkan tabel acuan interval nilai di samping rekap ketidakhadiran
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={raporConfig.tampilkanTabelKkm ?? true}
                                onChange={(e) => updateRaporConfig({ tampilkanTabelKkm: e.target.checked })}
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </label>

                            {/* Pengaturan Nilai & Judul KKM jika aktif */}
                            {(raporConfig.tampilkanTabelKkm ?? true) && (
                              <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block mb-1">
                                      Nilai Standar KKM Acuan:
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min={40}
                                        max={95}
                                        value={raporConfig.nilaiStandarKkm ?? 75}
                                        onChange={(e) =>
                                          updateRaporConfig({
                                            nilaiStandarKkm: Math.max(40, Math.min(95, Number(e.target.value) || 75)),
                                          })
                                        }
                                        className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold font-mono"
                                      />
                                      <div className="flex gap-1">
                                        {[70, 75, 80, 85].map((kVal) => (
                                          <button
                                            key={kVal}
                                            type="button"
                                            onClick={() => updateRaporConfig({ nilaiStandarKkm: kVal })}
                                            className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                                              (raporConfig.nilaiStandarKkm ?? 75) === kVal
                                                ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                                                : "bg-white dark:bg-slate-900 text-slate-600 border-slate-200"
                                            }`}
                                          >
                                            {kVal}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      Interval A, B, C, & D dihitung otomatis berdasarkan acuan ini.
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block mb-1">
                                      Judul Header Tabel KKM:
                                    </label>
                                    <input
                                      type="text"
                                      value={raporConfig.judulTabelKkm ?? "Kriteria Ketuntasan Minimal (KKM)"}
                                      onChange={(e) => updateRaporConfig({ judulTabelKkm: e.target.value })}
                                      placeholder="Kriteria Ketuntasan Minimal (KKM)"
                                      className="w-full px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      Dapat diganti misal "Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)".
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 5: URUTAN MATA PELAJARAN */}
                    {formatRaporActiveTab === "urutan" && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">Atur Urutan Tampil Mata Pelajaran</span>
                            <span className="text-[11px] text-slate-500">Gunakan tombol Naik dan Turun untuk menyesuaikan urutan mata pelajaran per kelompok.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateRaporConfig({ customMapelOrder: [] })}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Reset urutan ke urutan bawaan kurikulum"
                          >
                            Reset Urutan
                          </button>
                        </div>

                        {/* List Reorder Groups */}
                        {(() => {
                          const renderReorderGroup = (title: string, groupList: any[], badgeColor: string) => (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-100">{title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                                  {groupList.length} Mapel
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {groupList.map((item, idx) => (
                                  <div
                                    key={item.nama}
                                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px] flex items-center justify-center text-slate-600 dark:text-slate-400">
                                        {idx + 1}
                                      </span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.nama}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => moveMapelInSection(item.nama, "up", groupList)}
                                        className="p-1 rounded bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-slate-800 disabled:opacity-20 cursor-pointer transition-colors"
                                        title="Pindah ke atas"
                                      >
                                        <ChevronUp className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === groupList.length - 1}
                                        onClick={() => moveMapelInSection(item.nama, "down", groupList)}
                                        className="p-1 rounded bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-slate-800 disabled:opacity-20 cursor-pointer transition-colors"
                                        title="Pindah ke bawah"
                                      >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );

                          return (
                            <div className="space-y-3">
                              {renderReorderGroup("A. Muatan Wajib", previewWajib, "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300")}
                              {renderReorderGroup("B. Muatan Lokal", previewMulok, "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300")}
                              {renderReorderGroup("C. Kecerdasan Al-Qur'an", previewQuran, "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* KOLOM KANAN: PRATINJAU LANGSUNG RAPOR (7 COLS)            */}
                {/* ========================================================= */}
                <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                  {/* Preview Controls Toolbar */}
                  <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    {/* Switcher Tipe Rapor & Semester */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setFormatPreviewType("tengah")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            formatPreviewType === "tengah"
                              ? "bg-amber-500 text-white shadow-2xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                          }`}
                        >
                          Rapor STS (Tengah)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormatPreviewType("akhir")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            formatPreviewType === "akhir"
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                          }`}
                        >
                          Rapor SAS (Akhir)
                        </button>
                      </div>

                      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setFormatPreviewSemester("Ganjil")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            formatPreviewSemester === "Ganjil"
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Ganjil
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormatPreviewSemester("Genap")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            formatPreviewSemester === "Genap"
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Genap
                        </button>
                      </div>
                    </div>

                    {/* Data Source & Font & Scale & Zoom */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Font Family Quick Select */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 hidden xl:inline">Font:</span>
                        <select
                          value={raporConfig.customFontName ? "custom" : (raporConfig.fontFamilyRapor || "Times New Roman")}
                          onChange={(e) => {
                            if (e.target.value !== "custom") {
                              updateRaporConfig({ fontFamilyRapor: e.target.value, customFontName: "" });
                            }
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer max-w-[130px] truncate"
                          title="Ganti Jenis Huruf Dokumen Rapor"
                        >
                          {RAPOR_FONT_OPTIONS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                          {raporConfig.customFontName && (
                            <option value="custom">Kustom: {raporConfig.customFontName}</option>
                          )}
                        </select>
                      </div>

                      {/* Skala Dokumen Global */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 hidden xl:inline">Skala:</span>
                        <select
                          value={raporConfig.skalaUkuranRapor || 100}
                          onChange={(e) => updateRaporConfig({ skalaUkuranRapor: Number(e.target.value) })}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                          title="Skala Ukuran Dokumen A4 Rapor"
                        >
                          {[85, 90, 95, 100, 105, 110].map((sc) => (
                            <option key={sc} value={sc}>
                              {sc}% {sc === 100 ? "(Std)" : sc < 100 ? "(Kompak)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sumber Data */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 hidden xl:inline">Data:</span>
                        <select
                          value={formatPreviewSource}
                          onChange={(e) => setFormatPreviewSource(e.target.value as any)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium cursor-pointer"
                        >
                          <option value="demo">Data Simulasi (Lengkap)</option>
                          {siswaList.length > 0 && <option value="siswa">Pilih Siswa Nyata</option>}
                        </select>

                        {formatPreviewSource === "siswa" && siswaList.length > 0 && (
                          <select
                            value={formatPreviewSelectedSiswaId || siswaList[0]?.id}
                            onChange={(e) => setFormatPreviewSelectedSiswaId(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium max-w-[140px] truncate cursor-pointer"
                          >
                            {siswaList.map((s) => (
                              <option key={s.id} value={s.id}>{s.nama}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Zoom Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setFormatPreviewZoom(Math.max(60, formatPreviewZoom - 10))}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                          title="Perkecil Pratinjau (-)"
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 w-10 text-center">
                          {formatPreviewZoom}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormatPreviewZoom(Math.min(130, formatPreviewZoom + 10))}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                          title="Perbesar Pratinjau (+)"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        {formatPreviewZoom !== 100 && (
                          <button
                            type="button"
                            onClick={() => setFormatPreviewZoom(100)}
                            className="text-[10px] text-amber-600 font-bold ml-1 hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Viewport with A4 Paper Simulation */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
                    <div
                      id="format-rapor-preview-paper"
                      style={{
                        transform: `scale(${(formatPreviewZoom / 100) * ((raporConfig.skalaUkuranRapor || 100) / 100)})`,
                        transformOrigin: "top center",
                        fontFamily: previewFontFamily,
                      }}
                      className="w-full max-w-[820px] bg-white text-black p-8 sm:p-10 shadow-2xl rounded-sm border border-slate-300 transition-transform duration-100"
                    >
                      {/* Kop Surat */}
                      {renderOfficialLetterhead()}

                      {/* Header Judul Rapor */}
                      <div className="text-center mb-6">
                        <h3
                          style={{ fontSize: `${raporConfig.fontSizeJudulRapor || 16}px` }}
                          className={`tracking-wider uppercase text-slate-900 leading-snug ${
                            (raporConfig.boldJudulRapor ?? true) ? "font-extrabold" : "font-normal"
                          } ${
                            (raporConfig.underlineJudulRapor ?? true) ? "underline" : "no-underline"
                          }`}
                        >
                          {previewJudulText}
                        </h3>
                        <p
                          style={{ fontSize: `${raporConfig.fontSizeSubjudulRapor || 12}px` }}
                          className={`mt-1 text-slate-700 ${
                            raporConfig.boldSubjudulRapor ? "font-bold text-slate-900" : "font-medium"
                          }`}
                        >
                          {previewSubjudulText}
                        </p>
                      </div>

                      {/* Identitas Siswa */}
                      <div
                        style={{ fontSize: `${raporConfig.fontSizeIdentitas || 12}px` }}
                        className="grid grid-cols-2 gap-4 mb-4 pb-2 text-slate-800"
                      >
                        <div className="space-y-1">
                          <p>Nama Peserta Didik: <strong className="text-slate-900">{previewStudent.nama}</strong></p>
                          <p>Nomor Induk / NISN: <strong className="text-slate-900">{previewStudent.nisn || "-"}</strong></p>
                        </div>
                        <div className="space-y-1">
                          <p>Kelas: <strong className="text-slate-900">{previewStudent.kelas}</strong></p>
                          <p>Semester: <strong className="text-slate-900">{formatPreviewSemester}</strong></p>
                        </div>
                      </div>

                      {/* Tabel Nilai (STS vs SAS) */}
                      {formatPreviewType === "tengah" ? (
                        // ================= STS TABLE =================
                        <table
                          style={{ fontSize: `${raporConfig.fontSizeTabelNilai || 11}px` }}
                          className="rapor-print-table w-full text-left border-collapse border border-[#000000] mb-4 text-black"
                        >
                          <thead>
                            <tr className="bg-slate-100 text-slate-900 font-bold" style={{ fontSize: `${raporConfig.fontSizeHeaderTabel || 11}px` }}>
                              <th className={`border border-[#000000] ${previewCellPadding} text-center w-10`}>No</th>
                              <th className={`border border-[#000000] ${previewCellPadding}`}>Mata Pelajaran</th>
                              {raporConfig.showKkm !== false && (
                                <th className={`border border-[#000000] ${previewCellPadding} text-center w-14`}>KKM</th>
                              )}
                              <th className={`border border-[#000000] ${previewCellPadding} text-center w-24 text-black`}>
                                Nilai Prestasi
                              </th>
                              {raporConfig.showPredikat !== false && (
                                <th className={`border border-[#000000] ${previewCellPadding} text-center w-16`}>Predikat</th>
                              )}
                              {raporConfig.showCatatanGuru !== false && (
                                <th className={`border border-[#000000] ${previewCellPadding}`}>Capaian Kompetensi / Catatan</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Muatan Wajib */}
                            {previewWajib.length > 0 && (
                              <>
                                <tr className="bg-slate-100/80 font-bold">
                                  <td colSpan={6} className={`border border-[#000000] ${previewCellPadding} uppercase tracking-wider`}>
                                    A. Muatan Wajib
                                  </td>
                                </tr>
                                {previewWajib.map((item, idx) => (
                                  <tr key={item.nama}>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{idx + 1}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} font-semibold`}>{item.nama}</td>
                                    {raporConfig.showKkm !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.kkm}</td>
                                    )}
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono text-black`}>{item.uts}</td>
                                    {raporConfig.showPredikat !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono`}>{item.predikat}</td>
                                    )}
                                    {raporConfig.showCatatanGuru !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} leading-tight`} style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}>{item.catatan}</td>
                                    )}
                                  </tr>
                                ))}
                              </>
                            )}

                            {/* Muatan Lokal */}
                            {previewMulok.length > 0 && (
                              <>
                                <tr className="bg-slate-100/80 font-bold">
                                  <td colSpan={6} className={`border border-[#000000] ${previewCellPadding} uppercase tracking-wider`}>
                                    B. Muatan Lokal
                                  </td>
                                </tr>
                                {previewMulok.map((item, idx) => (
                                  <tr key={item.nama}>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{idx + 1}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} font-semibold`}>{item.nama}</td>
                                    {raporConfig.showKkm !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.kkm}</td>
                                    )}
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono text-black`}>{item.uts}</td>
                                    {raporConfig.showPredikat !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono`}>{item.predikat}</td>
                                    )}
                                    {raporConfig.showCatatanGuru !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} leading-tight`} style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}>{item.catatan}</td>
                                    )}
                                  </tr>
                                ))}
                              </>
                            )}

                            {/* Kecerdasan Quran */}
                            {previewQuran.length > 0 && (
                              <>
                                <tr className="bg-slate-100/80 font-bold">
                                  <td colSpan={6} className={`border border-[#000000] ${previewCellPadding} uppercase tracking-wider`}>
                                    C. Kecerdasan Al-Qur'an
                                  </td>
                                </tr>
                                {previewQuran.map((item, idx) => (
                                  <tr key={item.nama}>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{idx + 1}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} font-semibold`}>{item.nama}</td>
                                    {raporConfig.showKkm !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.kkm}</td>
                                    )}
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono text-black`}>{item.uts}</td>
                                    {raporConfig.showPredikat !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono`}>{item.predikat}</td>
                                    )}
                                    {raporConfig.showCatatanGuru !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} leading-tight`} style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}>{item.catatan}</td>
                                    )}
                                  </tr>
                                ))}
                              </>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        // ================= SAS TABLE =================
                        <table
                          style={{ fontSize: `${raporConfig.fontSizeTabelNilai || 11}px` }}
                          className="rapor-print-table w-full text-left border-collapse border border-[#000000] mb-4 text-black"
                        >
                          <thead>
                            <tr className="bg-slate-100 text-slate-900 font-bold" style={{ fontSize: `${raporConfig.fontSizeHeaderTabel || 11}px` }}>
                              <th className={`border border-[#000000] ${previewCellPadding} text-center w-8`}>No</th>
                              <th className={`border border-[#000000] ${previewCellPadding}`}>Mata Pelajaran</th>
                              {raporConfig.showKkm !== false && (
                                <th className={`border border-[#000000] ${previewCellPadding} text-center w-12`}>KKM</th>
                              )}
                              <th className={`border border-[#000000] ${previewCellPadding} text-center w-12`}>UH</th>
                              <th className={`border border-[#000000] ${previewCellPadding} text-center w-12`}>PTS</th>
                              <th className={`border border-[#000000] ${previewCellPadding} text-center w-12`}>PAS</th>
                              <th className={`border border-[#000000] ${previewCellPadding} text-center w-14 bg-indigo-50 font-black`}>
                                Akhir
                              </th>
                              {raporConfig.showPredikat !== false && (
                                <th className={`border border-[#000000] ${previewCellPadding} text-center w-12`}>Pred</th>
                              )}
                              {raporConfig.showCatatanGuru !== false && (
                                <th className={`border border-[#000000] ${previewCellPadding}`}>Capaian Kompetensi</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Muatan Wajib */}
                            {previewWajib.length > 0 && (
                              <>
                                <tr className="bg-slate-100/80 font-bold">
                                  <td colSpan={9} className={`border border-[#000000] ${previewCellPadding} uppercase tracking-wider`}>
                                    A. Muatan Wajib
                                  </td>
                                </tr>
                                {previewWajib.map((item, idx) => (
                                  <tr key={item.nama}>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{idx + 1}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} font-semibold`}>{item.nama}</td>
                                    {raporConfig.showKkm !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.kkm}</td>
                                    )}
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.tugas}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.uts}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.uas}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-black font-mono bg-indigo-50/50`}>{item.akhir}</td>
                                    {raporConfig.showPredikat !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono`}>{item.predikat}</td>
                                    )}
                                    {raporConfig.showCatatanGuru !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} leading-tight`} style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}>{item.catatan}</td>
                                    )}
                                  </tr>
                                ))}
                              </>
                            )}

                            {/* Muatan Lokal */}
                            {previewMulok.length > 0 && (
                              <>
                                <tr className="bg-slate-100/80 font-bold">
                                  <td colSpan={9} className={`border border-[#000000] ${previewCellPadding} uppercase tracking-wider`}>
                                    B. Muatan Lokal
                                  </td>
                                </tr>
                                {previewMulok.map((item, idx) => (
                                  <tr key={item.nama}>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{idx + 1}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} font-semibold`}>{item.nama}</td>
                                    {raporConfig.showKkm !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.kkm}</td>
                                    )}
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.tugas}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.uts}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.uas}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-black font-mono bg-indigo-50/50`}>{item.akhir}</td>
                                    {raporConfig.showPredikat !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono`}>{item.predikat}</td>
                                    )}
                                    {raporConfig.showCatatanGuru !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} leading-tight`} style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}>{item.catatan}</td>
                                    )}
                                  </tr>
                                ))}
                              </>
                            )}

                            {/* Kecerdasan Quran */}
                            {previewQuran.length > 0 && (
                              <>
                                <tr className="bg-slate-100/80 font-bold">
                                  <td colSpan={9} className={`border border-[#000000] ${previewCellPadding} uppercase tracking-wider`}>
                                    C. Kecerdasan Al-Qur'an
                                  </td>
                                </tr>
                                {previewQuran.map((item, idx) => (
                                  <tr key={item.nama}>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{idx + 1}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} font-semibold`}>{item.nama}</td>
                                    {raporConfig.showKkm !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.kkm}</td>
                                    )}
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.tugas}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.uts}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-mono`}>{item.uas}</td>
                                    <td className={`border border-[#000000] ${previewCellPadding} text-center font-black font-mono bg-indigo-50/50`}>{item.akhir}</td>
                                    {raporConfig.showPredikat !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} text-center font-bold font-mono`}>{item.predikat}</td>
                                    )}
                                    {raporConfig.showCatatanGuru !== false && (
                                      <td className={`border border-[#000000] ${previewCellPadding} leading-tight`} style={{ fontSize: `${raporConfig.fontSizeCatatanGuru || 10}px` }}>{item.catatan}</td>
                                    )}
                                  </tr>
                                ))}
                              </>
                            )}
                          </tbody>
                        </table>
                      )}

                      {/* Tabel Rekap Presensi & Tabel KKM */}
                      <div className="mt-4 mb-5 flex flex-wrap items-start justify-between gap-4">
                        {raporConfig.showPresensi !== false && (
                          <div className="w-full sm:w-72">
                            <p className="font-bold text-xs uppercase mb-1 text-slate-800">Kehadiran (Presensi):</p>
                            <table
                              style={{ fontSize: `${raporConfig.fontSizePresensi || 10}px` }}
                              className="rapor-print-table w-full border-collapse border border-[#000000]"
                            >
                              <tbody>
                                <tr>
                                  <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">1. Sakit</td>
                                  <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">1 hari</td>
                                </tr>
                                <tr>
                                  <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">2. Izin</td>
                                  <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">0 hari</td>
                                </tr>
                                <tr>
                                  <td className="border border-[#000000] px-3 py-1 font-medium text-slate-800">3. Tanpa Keterangan</td>
                                  <td className="border border-[#000000] px-3 py-1 text-center font-bold font-mono text-slate-900 w-24">0 hari</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Tabel KKM & Interval Predikat */}
                        {renderTabelKkmComponent(true)}
                      </div>

                      {/* Area Titimangsa & Tanda Tangan */}
                      <div className="pt-6 border-0" style={{ fontSize: `${raporConfig.fontSizeTitimangsa || 11}px` }}>
                        {/* Titimangsa Alamat dan Tanggal */}
                        <div className="flex justify-end mb-2 pr-4">
                          <p className="text-slate-800 font-medium">
                            {raporConfig.tempatRapor || "Jakarta"}, {previewTgl}
                          </p>
                        </div>

                        {/* Grid Kolom TTD */}
                        <div className="grid grid-cols-3 text-center gap-4">
                          {/* Kolom 1: Kepala Sekolah */}
                          <div>
                            {raporConfig.showTtdKepsek !== false && (
                              <>
                                <p className="text-slate-600">Mengetahui,</p>
                                <p className="text-slate-800 font-medium">{previewKepsekLabel},</p>
                                <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                                <p
                                  style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                                  className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                                    raporConfig.underlineNamaTtd !== false ? "underline" : ""
                                  }`}
                                >
                                  {previewKepsekNama}
                                </p>
                                {raporConfig.nipKepalaSekolah && (
                                  <p className="text-[10px] text-slate-600 mt-0.5">
                                    NIP. {raporConfig.nipKepalaSekolah}
                                  </p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Kolom 2: Wali Kelas */}
                          <div>
                            {raporConfig.showTtdWali !== false && (
                              <>
                                <p className="text-slate-600 invisible">Mengetahui,</p>
                                <p className="text-slate-800 font-medium">Wali Kelas,</p>
                                <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                                <p
                                  style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                                  className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                                    raporConfig.underlineNamaTtd !== false ? "underline" : ""
                                  }`}
                                >
                                  {previewWaliNama}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Kolom 3: Orang Tua / Wali Siswa */}
                          <div>
                            {raporConfig.showTtdOrtu !== false && (
                              <>
                                <p className="text-slate-600 invisible">Mengetahui,</p>
                                <p className="text-slate-800 font-medium">Orang Tua / Wali Santri,</p>
                                <div style={{ height: `${raporConfig.tinggiRuangTtd || 64}px` }} />
                                <p
                                  style={{ fontSize: `${raporConfig.fontSizeNamaTtd || 12}px` }}
                                  className={`${raporConfig.boldNamaTtd !== false ? "font-bold" : "font-normal"} ${
                                    raporConfig.underlineNamaTtd !== false ? "underline" : ""
                                  }`}
                                >
                                  {previewStudent.namaWali || "................................................"}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
