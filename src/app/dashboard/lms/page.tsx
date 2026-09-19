"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import {
  LMSMateri,
  LMSTugas,
  LMSSubmission,
  LMSKuis,
  LMSSoal,
  LMSKuisAttempt,
  LMSTipeMateri,
  LMSBankSoal,
  LMSBankSoalItem,
  TingkatKesulitanSoal,
  LMSJadwalMateri,
} from "@/types/school";
import { generateBankSoalQuestions, REKOMENDASI_TOPIK_MAPEL } from "@/lib/lms-question-generator";
import {
  BookOpenCheck,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Video,
  HelpCircle,
  Plus,
  Search,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Printer,
  FileCheck,
  User,
  ExternalLink,
  Download,
  UploadCloud,
  Award,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  PlayCircle,
  Check,
  Users,
  Sparkles,
  ShieldAlert,
  CheckSquare,
  Square,
  Filter,
  Eye,
  RefreshCw,
  Database,
  Zap,
  Layers,
  Lightbulb,
  Wand2,
  FolderPlus,
  ArrowLeft,
  List,
  LayoutGrid,
  UserCheck,
} from "lucide-react";

type LMSTab = "jadwal" | "materi" | "tugas" | "kuis" | "bank-soal";

export default function LMSPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const {
    kelasList,
    mapelList,
    siswaList,
    lmsMateriList,
    addMateri,
    updateMateri,
    deleteMateri,
    toggleBacaMateri,
    lmsTugasList,
    addTugas,
    deleteTugas,
    lmsSubmissionList,
    submitTugas,
    nilaiSubmission,
    lmsKuisList,
    addKuis,
    deleteKuis,
    submitKuisAttempt,
    lmsKuisAttemptList,
    lmsBankSoalList,
    addBankSoal,
    updateBankSoal,
    deleteBankSoal,
    addSoalToBank,
    updateSoalInBank,
    deleteSoalFromBank,
    generateKuisFromBankSoal,
    lmsJadwalMateriList,
    addJadwalMateri,
    updateJadwalMateri,
    deleteJadwalMateri,
    toggleRealisasiJadwal,
  } = useSchoolData();

  // Role permissions: Khusus LMS Pembelajaran, HANYA Administrator yang dapat melakukan Tambah, Edit, dan Hapus
  const isBendahara = user?.role === "bendahara";
  const isGuru = user?.role === "guru";
  const isAdmin = user?.role === "admin";
  const isSiswa = user?.role === "siswa";
  const isOrtu = user?.role === "ortu";
  const canManageContent = isAdmin; // Hanya Admin yang memiliki akses Tambah, Edit, dan Hapus konten LMS
  const canViewTeacherReports = isAdmin || isGuru; // Guru & Admin dapat melihat rekap pengumpulan tugas dan hasil CBT santri

  // Active student identity for Siswa / Ortu
  const currentStudent = useMemo(() => {
    if (isSiswa) {
      return (
        siswaList.find(
          (s) =>
            s.id === user?.id ||
            s.nisn === user?.nisnOrNip ||
            s.nama.toLowerCase() === user?.name?.toLowerCase()
        ) || {
          id: user?.id || "sis-active",
          nama: user?.name || "Siswa Belajar",
          nisn: user?.nisnOrNip || "0081234567",
          kelas: user?.kelas || "X MIPA 1",
        }
      );
    }
    if (isOrtu) {
      return (
        siswaList[0] || {
          id: "sis-child",
          nama: "Siswa Anak Asuh",
          nisn: "0081234567",
          kelas: "X MIPA 1",
        }
      );
    }
    return null;
  }, [isSiswa, isOrtu, user, siswaList]);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<LMSTab>("jadwal");
  const [selectedKelas, setSelectedKelas] = useState<string>("Semua");
  const [selectedMapel, setSelectedMapel] = useState<string>("Semua");
  const [selectedMinggu, setSelectedMinggu] = useState<number | "Semua">(3);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [materiViewMode, setMateriViewMode] = useState<"list" | "grid">("list");

  // Jadwal & Agenda Mengajar Modals & Forms
  const [isAddJadwalOpen, setIsAddJadwalOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<LMSJadwalMateri | null>(null);
  const [jadwalForm, setJadwalForm] = useState({
    mingguKe: 3,
    rentangTanggal: "15 - 20 September 2025",
    bulan: "September",
    semester: "Ganjil" as "Ganjil" | "Genap",
    tahunAjaran: "2025/2026",
    mapel: "Matematika",
    kelas: "Kelas 6",
    bab: "",
    subBabText: "",
    alokasiJP: 4,
    indikatorKompetensi: "",
  });

  // Catat Jurnal Mengajar / Realisasi Modal (Guru & Admin)
  const [catatJurnalModal, setCatatJurnalModal] = useState<LMSJadwalMateri | null>(null);
  const [jurnalForm, setJurnalForm] = useState({
    sudahDiajarkan: true,
    tanggalRealisasi: new Date().toISOString().split("T")[0],
    jamRealisasi: "08.00 - 09.30 WIB",
    guruPengajar: user?.name || "Guru Pengampu",
    catatanPembelajaran: "",
  });

  // Pelaporan Mingguan Modal State
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [reportMingguKe, setReportMingguKe] = useState<number>(3);
  const [reportKelas, setReportKelas] = useState<string>("Semua");

  // Auto set initial filters based on role
  useEffect(() => {
    if (isSiswa && currentStudent?.kelas) {
      setSelectedKelas(currentStudent.kelas);
    } else if (isGuru && teacherScope.assignedClass) {
      setSelectedKelas(teacherScope.assignedClass);
      if (teacherScope.assignedSubjects.length > 0) {
        setSelectedMapel(teacherScope.assignedSubjects[0]);
      }
    }
  }, [isSiswa, isGuru, currentStudent, teacherScope]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // --- Jadwal Silabus & Realisasi Mengajar Handlers ---
  const handleOpenAddJadwal = () => {
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk menyusun silabus materi mingguan.");
      return;
    }
    setEditingJadwal(null);
    setJadwalForm({
      mingguKe: typeof selectedMinggu === "number" ? selectedMinggu : 3,
      rentangTanggal: "15 - 20 September 2025",
      bulan: "September",
      semester: "Ganjil",
      tahunAjaran: "2025/2026",
      mapel: selectedMapel !== "Semua" ? selectedMapel : (mapelList[0]?.nama || "Matematika"),
      kelas: selectedKelas !== "Semua" ? selectedKelas : (kelasList[0]?.nama || "Kelas 6"),
      bab: "",
      subBabText: "",
      alokasiJP: 4,
      indikatorKompetensi: "",
    });
    setIsAddJadwalOpen(true);
  };

  const handleOpenEditJadwal = (item: LMSJadwalMateri) => {
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk mengubah silabus materi mingguan.");
      return;
    }
    setEditingJadwal(item);
    setJadwalForm({
      mingguKe: item.mingguKe,
      rentangTanggal: item.rentangTanggal,
      bulan: item.bulan,
      semester: item.semester,
      tahunAjaran: item.tahunAjaran,
      mapel: item.mapel,
      kelas: item.kelas,
      bab: item.bab,
      subBabText: item.subBab.join("\n"),
      alokasiJP: item.alokasiJP,
      indikatorKompetensi: item.indikatorKompetensi || "",
    });
    setIsAddJadwalOpen(true);
  };

  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageContent) {
      showToast("Hanya Administrator yang berwenang menambah atau mengedit silabus materi.");
      return;
    }
    const subBabArray = jadwalForm.subBabText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (subBabArray.length === 0) {
      alert("Mohon masukkan minimal 1 sub-bab materi pembelajaran (satu per baris).");
      return;
    }

    if (editingJadwal) {
      updateJadwalMateri(editingJadwal.id, {
        mingguKe: Number(jadwalForm.mingguKe),
        rentangTanggal: jadwalForm.rentangTanggal,
        bulan: jadwalForm.bulan,
        semester: jadwalForm.semester,
        tahunAjaran: jadwalForm.tahunAjaran,
        mapel: jadwalForm.mapel,
        kelas: jadwalForm.kelas,
        bab: jadwalForm.bab,
        subBab: subBabArray,
        alokasiJP: Number(jadwalForm.alokasiJP),
        indikatorKompetensi: jadwalForm.indikatorKompetensi,
      });
      showToast(`Silabus "${jadwalForm.bab}" berhasil diperbarui!`);
    } else {
      addJadwalMateri({
        mingguKe: Number(jadwalForm.mingguKe),
        rentangTanggal: jadwalForm.rentangTanggal,
        bulan: jadwalForm.bulan,
        semester: jadwalForm.semester,
        tahunAjaran: jadwalForm.tahunAjaran,
        mapel: jadwalForm.mapel,
        kelas: jadwalForm.kelas,
        bab: jadwalForm.bab,
        subBab: subBabArray,
        alokasiJP: Number(jadwalForm.alokasiJP),
        indikatorKompetensi: jadwalForm.indikatorKompetensi,
        sudahDiajarkan: false,
      });
      showToast(`Agenda silabus "${jadwalForm.bab}" berhasil ditambahkan ke Pekan ke-${jadwalForm.mingguKe}!`);
    }
    setIsAddJadwalOpen(false);
    setEditingJadwal(null);
  };

  const handleDeleteJadwal = (item: LMSJadwalMateri) => {
    if (!canManageContent) {
      showToast("Hanya Administrator yang berwenang menghapus agenda silabus.");
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus agenda materi "${item.bab}" pada Pekan ${item.mingguKe}?`)) {
      deleteJadwalMateri(item.id);
      showToast(`Agenda materi "${item.bab}" berhasil dihapus.`);
    }
  };

  const handleOpenJurnalModal = (item: LMSJadwalMateri) => {
    setCatatJurnalModal(item);
    setJurnalForm({
      sudahDiajarkan: item.sudahDiajarkan,
      tanggalRealisasi: item.tanggalRealisasi || new Date().toISOString().split("T")[0],
      jamRealisasi: item.jamRealisasi || "08.00 - 09.30 WIB",
      guruPengajar: item.guruPengajar || user?.name || "Ustadzah Fatimah, S.Pd.",
      catatanPembelajaran: item.catatanPembelajaran || "",
    });
  };

  const handleSaveJurnal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catatJurnalModal) return;
    toggleRealisasiJadwal(catatJurnalModal.id, {
      sudahDiajarkan: jurnalForm.sudahDiajarkan,
      tanggalRealisasi: jurnalForm.sudahDiajarkan ? jurnalForm.tanggalRealisasi : undefined,
      jamRealisasi: jurnalForm.sudahDiajarkan ? jurnalForm.jamRealisasi : undefined,
      guruPengajar: jurnalForm.sudahDiajarkan ? jurnalForm.guruPengajar : undefined,
      catatanPembelajaran: jurnalForm.catatanPembelajaran,
    });
    showToast(
      jurnalForm.sudahDiajarkan
        ? `Alhamdulillah, realisasi pembelajaran "${catatJurnalModal.bab}" berhasil dicatat!`
        : `Status materi "${catatJurnalModal.bab}" ditandai belum diajarkan.`
    );
    setCatatJurnalModal(null);
  };

  const handleQuickToggleRealisasi = (item: LMSJadwalMateri) => {
    const nextStatus = !item.sudahDiajarkan;
    toggleRealisasiJadwal(item.id, {
      sudahDiajarkan: nextStatus,
      tanggalRealisasi: nextStatus ? (item.tanggalRealisasi || new Date().toISOString().split("T")[0]) : undefined,
      jamRealisasi: nextStatus ? (item.jamRealisasi || "08.00 - 09.30 WIB") : undefined,
      guruPengajar: nextStatus ? (item.guruPengajar || user?.name || "Ustadzah Fatimah, S.Pd.") : undefined,
    });
    showToast(
      nextStatus
        ? `Centang aktif: "${item.bab}" ditandai Sudah Diajarkan.`
        : `Centang dilepas: "${item.bab}" ditandai Belum Diajarkan.`
    );
  };

  // Helper YouTube Embed
  const getEmbedUrl = (url?: string) => {
    if (!url) return "";
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  // --- Modals State ---
  // Materi Modals
  const [activeMateriModal, setActiveMateriModal] = useState<LMSMateri | null>(null);
  const [isAddMateriOpen, setIsAddMateriOpen] = useState(false);
  const [materiForm, setMateriForm] = useState({
    judul: "",
    mapel: "",
    kelas: "",
    pertemuanKe: 1,
    durasiMenit: 30,
    tipeKonten: "video" as LMSTipeMateri,
    urlKonten: "",
    fileLampiran: "",
    deskripsi: "",
  });
  const [editingMateri, setEditingMateri] = useState<LMSMateri | null>(null);

  const handleOpenEditMateri = (materi: LMSMateri) => {
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk mengedit modul materi.");
      return;
    }
    setEditingMateri(materi);
    setMateriForm({
      judul: materi.judul,
      mapel: materi.mapel,
      kelas: materi.kelas,
      pertemuanKe: materi.pertemuanKe,
      durasiMenit: materi.durasiMenit || 30,
      tipeKonten: materi.tipeKonten,
      urlKonten: materi.urlKonten || "",
      fileLampiran: materi.fileLampiran || "",
      deskripsi: materi.deskripsi,
    });
    setIsAddMateriOpen(true);
  };

  // Tugas Modals
  const [isAddTugasOpen, setIsAddTugasOpen] = useState(false);
  const [tugasForm, setTugasForm] = useState({
    judul: "",
    mapel: "",
    kelas: "",
    deskripsi: "",
    deadline: "",
    bobotPoin: 100,
    filePetunjuk: "",
  });
  const [activeTugasToSubmit, setActiveTugasToSubmit] = useState<LMSTugas | null>(null);
  const [submissionForm, setSubmissionForm] = useState({
    catatanSiswa: "",
    fileJawabanUrl: "",
  });
  const [activeTugasSubmissions, setActiveTugasSubmissions] = useState<LMSTugas | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<{
    id: string;
    nilai: number;
    feedback: string;
  } | null>(null);

  // Kuis CBT Exam State
  const [isAddKuisOpen, setIsAddKuisOpen] = useState(false);
  const [activeCbtQuiz, setActiveCbtQuiz] = useState<LMSKuis | null>(null);
  const [cbtTimeRemaining, setCbtTimeRemaining] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [cbtAnswers, setCbtAnswers] = useState<Record<string, number>>({});
  const [cbtDoubtful, setCbtDoubtful] = useState<Record<string, boolean>>({});
  const [cbtExamFinished, setCbtExamFinished] = useState(false);
  const [lastAttemptResult, setLastAttemptResult] = useState<LMSKuisAttempt | null>(null);
  const [reviewQuizModal, setReviewQuizModal] = useState<{
    quiz: LMSKuis;
    attempt: LMSKuisAttempt;
  } | null>(null);
  const [viewAttemptsQuiz, setViewAttemptsQuiz] = useState<LMSKuis | null>(null);

  // Bank Soal States (Paket & Butir Soal)
  const [activeBankPackage, setActiveBankPackage] = useState<LMSBankSoal | null>(null);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
  const [editingBankPackage, setEditingBankPackage] = useState<LMSBankSoal | null>(null);
  const [bankPackageForm, setBankPackageForm] = useState({
    judul: "",
    mapel: "Matematika Wajib",
    tingkatKelas: "X",
    topik: "",
    deskripsi: "",
  });

  // Generator Soal Otomatis States
  const [generatorJumlah, setGeneratorJumlah] = useState<number>(3);
  const [generatorKesulitan, setGeneratorKesulitan] = useState<"Campuran" | "Mudah" | "Sedang" | "Sukar">("Campuran");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatorStepText, setGeneratorStepText] = useState<string>("");
  const [generatedSoalList, setGeneratedSoalList] = useState<LMSBankSoalItem[]>([]);

  // Inside Active Bank Package Question Items
  const [selectedSoalIds, setSelectedSoalIds] = useState<string[]>([]);
  const [expandedPembahasanIds, setExpandedPembahasanIds] = useState<Record<string, boolean>>({});
  const [studentPracticeAnswers, setStudentPracticeAnswers] = useState<Record<string, number>>({});
  const [isAddSoalItemModalOpen, setIsAddSoalItemModalOpen] = useState(false);
  const [editingSoalItem, setEditingSoalItem] = useState<LMSBankSoalItem | null>(null);
  const [soalItemForm, setSoalItemForm] = useState({
    pertanyaan: "",
    pilihan: ["", "", "", "", ""],
    kunciJawaban: 0,
    pembahasan: "",
    tingkatKesulitan: "Sedang" as TingkatKesulitanSoal,
    poinDefault: 15,
  });

  // Generate CBT from Bank Soal
  const [isGenerateKuisModalOpen, setIsGenerateKuisModalOpen] = useState(false);
  const [cbtSourceItems, setCbtSourceItems] = useState<LMSBankSoalItem[]>([]);
  const [generateKuisForm, setGenerateKuisForm] = useState({
    judul: "",
    mapel: "",
    kelas: "X MIPA 1",
    durasiMenit: 30,
    kkm: 75,
    deadline: "",
    deskripsi: "",
  });

  // Generator Soal Otomatis Handler
  const handleGenerateQuestions = (topikInput?: string, mapelInput?: string, kelasInput?: string) => {
    const targetTopik = (topikInput || bankPackageForm.topik).trim();
    const targetMapel = mapelInput || bankPackageForm.mapel;
    const targetKelas = kelasInput || bankPackageForm.tingkatKelas;

    if (!targetTopik) {
      alert("Harap masukkan atau pilih topik materi pembelajaran terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    setGeneratorStepText(`Menganalisis kurikulum & silabus ${targetMapel} (${targetTopik})...`);

    setTimeout(() => {
      setGeneratorStepText("Menyusun butir pertanyaan & 5 pilihan jawaban terstruktur...");
      setTimeout(() => {
        setGeneratorStepText("Menghitung kunci jawaban & merumuskan pembahasan ilmiah...");
        setTimeout(() => {
          const generated = generateBankSoalQuestions({
            mapel: targetMapel,
            tingkatKelas: targetKelas,
            topik: targetTopik,
            jumlahSoal: generatorJumlah,
            kesulitan: generatorKesulitan,
          });
          setGeneratedSoalList((prev) => [...prev, ...generated]);
          setIsGenerating(false);
          setGeneratorStepText("");
          showToast(`✨ Berhasil men-generate ${generated.length} butir soal untuk materi "${targetTopik}"!`);
        }, 300);
      }, 350);
    }, 350);
  };

  // Save new Bank Soal Package
  const handleSaveNewBankPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk membuat paket Bank Soal.");
      return;
    }
    if (!bankPackageForm.judul.trim()) {
      alert("Judul Bank Soal wajib diisi.");
      return;
    }
    const newKode = `PKT-${bankPackageForm.mapel.substring(0, 3).toUpperCase()}-${String(
      (lmsBankSoalList || []).length + 1
    ).padStart(2, "0")}`;

    const newPackage = addBankSoal({
      kode: newKode,
      judul: bankPackageForm.judul,
      deskripsi: bankPackageForm.deskripsi || `Kumpulan bank soal terstandar materi ${bankPackageForm.topik}.`,
      mapel: bankPackageForm.mapel,
      tingkatKelas: bankPackageForm.tingkatKelas,
      topik: bankPackageForm.topik || "Umum",
      pembuatGuru: user?.name || "Guru Pengampu",
      soalList: generatedSoalList,
    });

    showToast(`Sukses membuat paket Bank Soal "${newPackage.judul}" (${generatedSoalList.length} butir soal)!`);
    setIsAddBankModalOpen(false);
    setGeneratedSoalList([]);
  };

  // Save edit Bank Soal Package
  const handleSaveEditBankPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk mengubah paket Bank Soal.");
      return;
    }
    if (!editingBankPackage) return;
    updateBankSoal(editingBankPackage.id, {
      judul: bankPackageForm.judul,
      mapel: bankPackageForm.mapel,
      tingkatKelas: bankPackageForm.tingkatKelas,
      topik: bankPackageForm.topik,
      deskripsi: bankPackageForm.deskripsi,
    });
    showToast(`Perubahan paket Bank Soal "${bankPackageForm.judul}" berhasil disimpan!`);
    setIsEditBankModalOpen(false);
    setEditingBankPackage(null);
  };

  // Delete Bank Soal Package
  const handleDeleteBankPackage = (bank: LMSBankSoal) => {
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk menghapus paket Bank Soal.");
      return;
    }
    if (
      window.confirm(
        `Yakin ingin menghapus paket "${bank.judul}" beserta seluruh (${bank.soalList.length}) butir soal di dalamnya?`
      )
    ) {
      deleteBankSoal(bank.id);
      if (activeBankPackage?.id === bank.id) {
        setActiveBankPackage(null);
      }
      showToast(`Paket Bank Soal "${bank.judul}" berhasil dihapus.`);
    }
  };

  // Save Question Item in Active Package
  const handleSaveQuestionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk menambah atau mengubah butir soal.");
      return;
    }
    if (!currentActivePackage) return;

    if (editingSoalItem) {
      updateSoalInBank(currentActivePackage.id, editingSoalItem.id, {
        pertanyaan: soalItemForm.pertanyaan,
        pilihan: soalItemForm.pilihan,
        kunciJawaban: Number(soalItemForm.kunciJawaban),
        pembahasan: soalItemForm.pembahasan,
        tingkatKesulitan: soalItemForm.tingkatKesulitan,
        poinDefault: Number(soalItemForm.poinDefault) || 15,
      });
      showToast("Butir soal berhasil diperbarui!");
    } else {
      const newKode = `BS-${currentActivePackage.kode.replace("PKT-", "")}-${String(
        currentActivePackage.soalList.length + 1
      ).padStart(2, "0")}`;

      addSoalToBank(currentActivePackage.id, {
        kode: newKode,
        pertanyaan: soalItemForm.pertanyaan,
        pilihan: soalItemForm.pilihan,
        kunciJawaban: Number(soalItemForm.kunciJawaban),
        pembahasan: soalItemForm.pembahasan,
        tingkatKesulitan: soalItemForm.tingkatKesulitan,
        poinDefault: Number(soalItemForm.poinDefault) || 15,
      });
      showToast("Butir soal baru berhasil ditambahkan!");
    }
    setIsAddSoalItemModalOpen(false);
    setEditingSoalItem(null);
  };

  // Quick Generate More Questions into Active Package
  const handleQuickGenerateMoreQuestions = () => {
    if (!canManageContent) {
      showToast("Hanya Administrator yang memiliki akses untuk mengenerate butir soal otomatis.");
      return;
    }
    if (!currentActivePackage) return;
    const moreGenerated = generateBankSoalQuestions({
      mapel: currentActivePackage.mapel,
      tingkatKelas: currentActivePackage.tingkatKelas,
      topik: currentActivePackage.topik,
      jumlahSoal: 2,
      kesulitan: "Campuran",
    });

    moreGenerated.forEach((item, idx) => {
      addSoalToBank(currentActivePackage.id, {
        kode: `BS-${currentActivePackage.kode.replace("PKT-", "")}-${String(
          currentActivePackage.soalList.length + idx + 1
        ).padStart(2, "0")}`,
        pertanyaan: item.pertanyaan,
        pilihan: item.pilihan,
        kunciJawaban: item.kunciJawaban,
        pembahasan: item.pembahasan,
        tingkatKesulitan: item.tingkatKesulitan,
        poinDefault: item.poinDefault,
      });
    });

    showToast(`✨ Berhasil menambahkan ${moreGenerated.length} butir soal otomatis ke "${currentActivePackage.judul}"!`);
  };

  // Timer Countdown for CBT Exam
  useEffect(() => {
    if (!activeCbtQuiz || cbtExamFinished) return;
    const interval = setInterval(() => {
      setCbtTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishCBT();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCbtQuiz, cbtExamFinished, cbtAnswers]);

  // Start CBT Exam
  const handleStartCBT = (kuis: LMSKuis) => {
    setActiveCbtQuiz(kuis);
    setCbtTimeRemaining(kuis.durasiMenit * 60);
    setCurrentQuestionIndex(0);
    setCbtAnswers({});
    setCbtDoubtful({});
    setCbtExamFinished(false);
    setLastAttemptResult(null);
  };

  // Submit CBT Exam
  const handleFinishCBT = () => {
    if (!activeCbtQuiz) return;
    const soalList = activeCbtQuiz.soalList || [];
    let benarCount = 0;
    soalList.forEach((soal) => {
      if (cbtAnswers[soal.id] === soal.kunciJawaban) {
        benarCount++;
      }
    });
    const totalSoal = soalList.length || 1;
    const skorFinal = Math.round((benarCount / totalSoal) * 100);
    const statusLulus = skorFinal >= activeCbtQuiz.kkm;

    const studentId = currentStudent?.id || user?.id || "sis-active";
    const studentName = currentStudent?.nama || user?.name || "Siswa";
    const studentNisn = currentStudent?.nisn || user?.nisnOrNip || "0081234567";
    const studentKelas = currentStudent?.kelas || activeCbtQuiz.kelas;

    const attemptData = {
      kuisId: activeCbtQuiz.id,
      siswaId: studentId,
      siswaNama: studentName,
      siswaNisn: studentNisn,
      kelas: studentKelas,
      jawaban: cbtAnswers,
      skor: skorFinal,
      totalBenar: benarCount,
      totalSoal: totalSoal,
      statusLulus: statusLulus,
    };

    submitKuisAttempt(attemptData);

    const fullAttemptResult: LMSKuisAttempt = {
      ...attemptData,
      id: `att-${Date.now()}`,
      selesaiPada: new Date().toLocaleString("id-ID"),
    };

    setLastAttemptResult(fullAttemptResult);
    setCbtExamFinished(true);
    showToast("Ujian CBT berhasil diselesaikan! Skor telah dikalkulasi otomatis.");
  };

  // Filtered Items Calculation with Strict Teacher and Student Role Access
  const filteredJadwalMateri = useMemo(() => {
    return (lmsJadwalMateriList || []).filter((j) => {
      // Strict Guru scope: Only show content for this teacher's assigned class/grade
      if (isGuru && !teacherScope.isClassAccessible(j.kelas)) {
        return false;
      }
      // Strict Siswa scope: Only show content for this student's class
      if (isSiswa && currentStudent?.kelas && !teacherScope.isClassAccessible(j.kelas)) {
        return false;
      }
      const matchKelas =
        selectedKelas === "Semua" || j.kelas.toLowerCase() === selectedKelas.toLowerCase();
      const matchMapel =
        selectedMapel === "Semua" || j.mapel.toLowerCase() === selectedMapel.toLowerCase();
      const matchMinggu =
        selectedMinggu === "Semua" || j.mingguKe === Number(selectedMinggu);
      const matchSearch =
        !searchQuery ||
        j.bab.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.subBab.some((sb) => sb.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (j.catatanPembelajaran && j.catatanPembelajaran.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchKelas && matchMapel && matchMinggu && matchSearch;
    });
  }, [lmsJadwalMateriList, selectedKelas, selectedMapel, selectedMinggu, searchQuery, isGuru, isSiswa, currentStudent, teacherScope]);

  const jadwalStats = useMemo(() => {
    const list = isGuru
      ? (lmsJadwalMateriList || []).filter((j) => teacherScope.isClassAccessible(j.kelas))
      : (lmsJadwalMateriList || []);

    const weekList = selectedMinggu === "Semua"
      ? list
      : list.filter((j) => j.mingguKe === Number(selectedMinggu));

    const totalAgenda = weekList.length;
    const sudahDiajarkanCount = weekList.filter((j) => j.sudahDiajarkan).length;
    const belumDiajarkanCount = totalAgenda - sudahDiajarkanCount;
    const persentaseTuntas = totalAgenda > 0 ? Math.round((sudahDiajarkanCount / totalAgenda) * 100) : 0;

    return {
      totalAgenda,
      sudahDiajarkanCount,
      belumDiajarkanCount,
      persentaseTuntas,
    };
  }, [lmsJadwalMateriList, selectedMinggu, isGuru, teacherScope]);

  const filteredMateri = useMemo(() => {
    return lmsMateriList.filter((m) => {
      // Strict Guru scope: Only show content for this teacher's assigned class/grade
      if (isGuru && !teacherScope.isClassAccessible(m.kelas)) {
        return false;
      }
      // Strict Siswa scope: Only show content for this student's class
      if (isSiswa && currentStudent?.kelas && !teacherScope.isClassAccessible(m.kelas)) {
        return false;
      }
      const matchKelas =
        selectedKelas === "Semua" || m.kelas.toLowerCase() === selectedKelas.toLowerCase();
      const matchMapel =
        selectedMapel === "Semua" || m.mapel.toLowerCase() === selectedMapel.toLowerCase();
      const matchSearch =
        !searchQuery ||
        m.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKelas && matchMapel && matchSearch;
    });
  }, [lmsMateriList, selectedKelas, selectedMapel, searchQuery, isGuru, isSiswa, currentStudent, teacherScope]);

  const filteredTugas = useMemo(() => {
    return lmsTugasList.filter((t) => {
      // Strict Guru scope
      if (isGuru && !teacherScope.isClassAccessible(t.kelas)) {
        return false;
      }
      // Strict Siswa scope
      if (isSiswa && currentStudent?.kelas && !teacherScope.isClassAccessible(t.kelas)) {
        return false;
      }
      const matchKelas =
        selectedKelas === "Semua" || t.kelas.toLowerCase() === selectedKelas.toLowerCase();
      const matchMapel =
        selectedMapel === "Semua" || t.mapel.toLowerCase() === selectedMapel.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKelas && matchMapel && matchSearch;
    });
  }, [lmsTugasList, selectedKelas, selectedMapel, searchQuery, isGuru, isSiswa, currentStudent, teacherScope]);

  const filteredKuis = useMemo(() => {
    return lmsKuisList.filter((k) => {
      // Strict Guru scope
      if (isGuru && !teacherScope.isClassAccessible(k.kelas)) {
        return false;
      }
      // Strict Siswa scope
      if (isSiswa && currentStudent?.kelas && !teacherScope.isClassAccessible(k.kelas)) {
        return false;
      }
      const matchKelas =
        selectedKelas === "Semua" || k.kelas.toLowerCase() === selectedKelas.toLowerCase();
      const matchMapel =
        selectedMapel === "Semua" || k.mapel.toLowerCase() === selectedMapel.toLowerCase();
      const matchSearch =
        !searchQuery ||
        k.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKelas && matchMapel && matchSearch;
    });
  }, [lmsKuisList, selectedKelas, selectedMapel, searchQuery, isGuru, isSiswa, currentStudent, teacherScope]);

  const filteredBankSoalPackages = useMemo(() => {
    return (lmsBankSoalList || []).filter((b) => {
      // Strict Guru scope: Only packages belonging to teacher's grade or 'Semua'
      if (isGuru && !teacherScope.isClassAccessible(b.tingkatKelas) && b.tingkatKelas !== "Semua") {
        return false;
      }
      const matchKelas =
        selectedKelas === "Semua" ||
        b.tingkatKelas.toLowerCase() === selectedKelas.toLowerCase() ||
        b.tingkatKelas === "Semua" ||
        (isGuru && teacherScope.isClassAccessible(b.tingkatKelas));
      const matchMapel =
        selectedMapel === "Semua" || b.mapel.toLowerCase() === selectedMapel.toLowerCase();
      const matchSearch =
        !searchQuery ||
        b.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.topik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.deskripsi && b.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchKelas && matchMapel && matchSearch;
    });
  }, [lmsBankSoalList, selectedKelas, selectedMapel, searchQuery, isGuru, teacherScope]);

  const totalBankQuestions = useMemo(() => {
    const list = isGuru
      ? (lmsBankSoalList || []).filter(
          (b) => teacherScope.isClassAccessible(b.tingkatKelas) || b.tingkatKelas === "Semua"
        )
      : (lmsBankSoalList || []);
    return list.reduce((acc, b) => acc + (b.soalList?.length || 0), 0);
  }, [lmsBankSoalList, isGuru, teacherScope]);

  // Scoped summary counters for header banner
  const totalMateriCount = useMemo(() => {
    return isGuru
      ? lmsMateriList.filter((m) => teacherScope.isClassAccessible(m.kelas)).length
      : lmsMateriList.length;
  }, [lmsMateriList, isGuru, teacherScope]);

  const totalTugasCount = useMemo(() => {
    return isGuru
      ? lmsTugasList.filter((t) => teacherScope.isClassAccessible(t.kelas)).length
      : lmsTugasList.length;
  }, [lmsTugasList, isGuru, teacherScope]);

  const totalKuisCount = useMemo(() => {
    return isGuru
      ? lmsKuisList.filter((k) => teacherScope.isClassAccessible(k.kelas)).length
      : lmsKuisList.length;
  }, [lmsKuisList, isGuru, teacherScope]);

  const totalBankCount = useMemo(() => {
    return isGuru
      ? (lmsBankSoalList || []).filter(
          (b) => teacherScope.isClassAccessible(b.tingkatKelas) || b.tingkatKelas === "Semua"
        ).length
      : (lmsBankSoalList || []).length;
  }, [lmsBankSoalList, isGuru, teacherScope]);

  // Keep activeBankPackage in sync with latest context state
  const currentActivePackage = useMemo(() => {
    if (!activeBankPackage) return null;
    return (lmsBankSoalList || []).find((b) => b.id === activeBankPackage.id) || null;
  }, [lmsBankSoalList, activeBankPackage]);

  // If Bendahara tries to open LMS directly
  if (isBendahara) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Akses Terbatas</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-6">
            Menu Learning Management System (LMS) dikhususkan untuk Administrator, Guru, Siswa, dan
            Wali Murid. Akun Peran Bendahara memiliki hak akses khusus pada modul Keuangan, SPP, Kas,
            dan Tabungan Siswa.
          </p>
          <a
            href="/dashboard/keuangan"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition"
          >
            Buka Halaman Keuangan
          </a>
        </div>
      </div>
    );
  }

  // --- FULL SCREEN CBT EXAM MODE ---
  if (activeCbtQuiz) {
    const currentSoal = activeCbtQuiz.soalList[currentQuestionIndex];
    const totalSoal = activeCbtQuiz.soalList.length;
    const answeredCount = Object.keys(cbtAnswers).length;
    const minutes = Math.floor(cbtTimeRemaining / 60);
    const seconds = cbtTimeRemaining % 60;
    const isTimerWarning = cbtTimeRemaining <= 120; // less than 2 mins

    if (cbtExamFinished && lastAttemptResult) {
      return (
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div
              className={`p-8 text-center text-white ${
                lastAttemptResult.statusLulus
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700"
                  : "bg-gradient-to-r from-amber-600 to-rose-700"
              }`}
            >
              <div className="inline-flex p-4 rounded-full bg-white/20 mb-4">
                <Award className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-black mb-1">
                {lastAttemptResult.statusLulus ? "Selamat! Anda LULUS" : "Evaluasi: Perlu Remedial"}
              </h2>
              <p className="text-white/90 text-sm">
                Ujian CBT: {activeCbtQuiz.judul} ({activeCbtQuiz.mapel} - {activeCbtQuiz.kelas})
              </p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-3 gap-4 text-center mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Skor Akhir</p>
                  <p className="text-3xl font-extrabold text-blue-600">
                    {lastAttemptResult.skor}
                    <span className="text-sm font-normal text-slate-400">/100</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Benar / Total</p>
                  <p className="text-3xl font-extrabold text-emerald-600">
                    {lastAttemptResult.totalBenar}
                    <span className="text-sm font-normal text-slate-400">
                      /{lastAttemptResult.totalSoal}
                    </span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Standar KKM</p>
                  <p className="text-3xl font-extrabold text-slate-700">{activeCbtQuiz.kkm}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setReviewQuizModal({ quiz: activeCbtQuiz, attempt: lastAttemptResult });
                    setActiveCbtQuiz(null);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  <Eye className="w-5 h-5" />
                  Lihat Pembahasan Soal
                </button>
                <button
                  onClick={() => {
                    setActiveCbtQuiz(null);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-5 rounded-xl transition"
                >
                  Kembali ke Menu LMS
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* CBT Header Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  CBT Mode
                </span>
                <span className="text-slate-500 text-sm">{activeCbtQuiz.mapel}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 text-sm">{activeCbtQuiz.kelas}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-800 mt-1">{activeCbtQuiz.judul}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold shadow-inner ${
                  isTimerWarning
                    ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                    : "bg-slate-900 text-white"
                }`}
              >
                <Clock className="w-5 h-5 text-amber-400" />
                <span>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
              </div>

              {/* Finish Button */}
              <button
                onClick={() => {
                  const unanswered = totalSoal - answeredCount;
                  const confirmMsg =
                    unanswered > 0
                      ? `Anda masih memiliki ${unanswered} soal yang belum dijawab. Apakah Anda yakin ingin menyelesaikan ujian CBT ini sekarang?`
                      : "Apakah Anda yakin ingin menyelesaikan dan mengirimkan jawaban ujian CBT ini?";
                  if (window.confirm(confirmMsg)) {
                    handleFinishCBT();
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition shadow flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Selesai Ujian
              </button>
            </div>
          </div>
        </header>

        {/* CBT Body */}
        <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
          {/* Main Question Display */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Soal Nomor {currentQuestionIndex + 1} dari {totalSoal}
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!cbtDoubtful[currentSoal?.id]}
                      onChange={(e) => {
                        setCbtDoubtful({
                          ...cbtDoubtful,
                          [currentSoal?.id]: e.target.checked,
                        });
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium">Ragu-ragu</span>
                  </label>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-slate-800 text-base md:text-lg font-medium leading-relaxed mb-8">
                {currentSoal?.pertanyaan}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentSoal?.pilihan.map((opsi, idx) => {
                  const huruf = String.fromCharCode(65 + idx); // A, B, C, D, E
                  const isSelected = cbtAnswers[currentSoal.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCbtAnswers({
                          ...cbtAnswers,
                          [currentSoal.id]: idx,
                        });
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {huruf}
                      </span>
                      <span className="text-slate-800 text-sm md:text-base font-normal mt-1 leading-snug">
                        {opsi}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav Buttons */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              <div className="text-xs text-slate-500 font-medium">
                Terjawab {answeredCount} dari {totalSoal} Soal
              </div>

              {currentQuestionIndex < totalSoal - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const unanswered = totalSoal - answeredCount;
                    const confirmMsg =
                      unanswered > 0
                        ? `Anda masih memiliki ${unanswered} soal yang belum dijawab. Apakah Anda yakin ingin menyelesaikan ujian CBT ini sekarang?`
                        : "Apakah Anda yakin ingin menyelesaikan dan mengirimkan jawaban ujian CBT ini?";
                    if (window.confirm(confirmMsg)) {
                      handleFinishCBT();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow"
                >
                  Kirim Jawaban
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Question Palette Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">
              Nomor Soal
            </h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {activeCbtQuiz.soalList.map((soal, idx) => {
                const isAnswered = cbtAnswers[soal.id] !== undefined;
                const isDoubtful = !!cbtDoubtful[soal.id];
                const isCurrent = idx === currentQuestionIndex;

                let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
                if (isDoubtful) {
                  colorClasses = "bg-amber-400 text-amber-900 border-amber-500 font-bold";
                } else if (isAnswered) {
                  colorClasses = "bg-blue-600 text-white border-blue-700 font-bold";
                }

                return (
                  <button
                    key={soal.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-10 h-10 rounded-xl text-sm flex items-center justify-center border transition-all ${colorClasses} ${
                      isCurrent ? "ring-2 ring-blue-500 ring-offset-2 scale-105" : ""
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="text-xs space-y-2 pt-4 border-t border-slate-100 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 shrink-0"></span>
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 shrink-0"></span>
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0"></span>
                <span>Belum Dijawab</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN LMS DASHBOARD VIEW ---
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                <BookOpenCheck className="w-4 h-4 text-amber-300" />
                <span>SIM Sekolah Pro • Learning Management System</span>
              </div>

              {/* Mode Akses Peran Guru / Siswa Badge */}
              {isGuru && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs px-3 py-1 rounded-full font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    Akses Guru: <strong className="text-white">{teacherScope.teacherName}</strong> (Kelas {teacherScope.assignedClass || user?.kelas || "Binaan"}) • Mode Baca & Evaluasi
                  </span>
                </div>
              )}

              {isSiswa && currentStudent && (
                <div className="inline-flex items-center gap-1.5 bg-purple-500/25 border border-purple-400/40 text-purple-100 text-xs px-3 py-1 rounded-full font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                  <span>
                    Siswa: <strong className="text-white">{currentStudent.nama}</strong> ({currentStudent.kelas})
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Portal Pembelajaran Digital (LMS)
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              {isGuru ? (
                <span>
                  Ruang pembelajaran khusus kelas <strong className="underline text-white font-bold">{teacherScope.assignedClass || user?.kelas}</strong>. Mode Guru difokuskan untuk mempelajari modul materi, memantau pengumpulan tugas, dan meninjau hasil evaluasi CBT siswa (akses penambahan, pengubahan, dan penghapusan materi dikelola terpusat oleh Administrator).
                </span>
              ) : (
                "Platform terpadu untuk materi digital, pengumpulan tugas & evaluasi, ujian CBT dengan timer otomatis, serta repositori Bank Soal sekolah."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
            <div className="text-center px-3">
              <p className="text-xl font-bold text-emerald-300">
                {jadwalStats.sudahDiajarkanCount}/{jadwalStats.totalAgenda}
              </p>
              <p className="text-[11px] text-blue-200">Realisasi Jadwal ({jadwalStats.persentaseTuntas}%)</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3">
              <p className="text-xl font-bold">{totalMateriCount}</p>
              <p className="text-[11px] text-blue-200">Materi</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3">
              <p className="text-xl font-bold">{totalTugasCount}</p>
              <p className="text-[11px] text-blue-200">Tugas</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3">
              <p className="text-xl font-bold">{totalKuisCount}</p>
              <p className="text-[11px] text-blue-200">Kuis CBT</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3">
              <p className="text-xl font-bold text-amber-300">{totalBankCount}</p>
              <p className="text-[11px] text-blue-200">Bank Soal ({totalBankQuestions} Soal)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Kelas Selector */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-xs">Kelas:</span>
            {isGuru ? (
              /* Guru mode: locked to assigned class */
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{teacherScope.assignedClass || user?.kelas}</span>
                <span className="text-[10px] text-emerald-600 font-medium">(Kelas Binaan Anda)</span>
              </div>
            ) : isSiswa ? (
              /* Siswa mode: locked to student class */
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-800">
                <span>{currentStudent?.kelas || selectedKelas}</span>
              </div>
            ) : (
              /* Admin mode: can select any class or all */
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Semua">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Mapel Selector */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-xs">Mapel:</span>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Semua">Semua Mata Pelajaran</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.nama}>
                  {m.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Minggu / Pekan Selector (aktif ketika tab jadwal) */}
          {activeTab === "jadwal" && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-xs">Pekan:</span>
              <select
                value={selectedMinggu}
                onChange={(e) =>
                  setSelectedMinggu(e.target.value === "Semua" ? "Semua" : Number(e.target.value))
                }
                className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Semua">Semua Pekan (Bulan Ini)</option>
                <option value="1">Pekan 1 (01 - 06 Sep)</option>
                <option value="2">Pekan 2 (08 - 13 Sep)</option>
                <option value="3">Pekan 3 (15 - 20 Sep - Pekan Ini)</option>
                <option value="4">Pekan 4 (22 - 27 Sep)</option>
              </select>
            </div>
          )}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari bab, sub-bab, mapel, materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Tabs Navigation (Jadwal Silabus, Materi, Tugas, Kuis, Bank Soal) */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("jadwal")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "jadwal"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-emerald-600" />
          <span>Jadwal Pelaksanaan Materi</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
            {jadwalStats.sudahDiajarkanCount}/{jadwalStats.totalAgenda} Tuntas
          </span>
        </button>

        <button
          onClick={() => setActiveTab("materi")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "materi"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Materi & Modul</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {filteredMateri.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tugas")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "tugas"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tugas & Pengumpulan</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {filteredTugas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("kuis")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "kuis"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Ujian & Kuis CBT</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {filteredKuis.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("bank-soal")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "bank-soal"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4 text-indigo-500" />
          <span>Bank Soal</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
            {filteredBankSoalPackages.length}
          </span>
        </button>
      </div>

      {/* --- TAB JADWAL: KALENDER JADWAL PELAKSANAAN MATERI & SILABUS --- */}
      {activeTab === "jadwal" && (
        <div className="space-y-5">
          {/* Week Selector Bar & KPI Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Silabus Pembelajaran Mingguan
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-semibold">Tahun Ajaran 2025/2026</span>
                </div>
                <h2 className="text-xl font-black text-slate-800 mt-1">
                  Kalender & Realisasi Pelaksanaan Materi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tersusun sistematis per pekan dengan rincian Bab dan Sub-Bab materi. Tandai centang untuk konfirmasi keterlaksanaan pembelajaran di kelas.
                </p>
              </div>

              {/* Action Buttons: Laporan Mingguan & Tambah Agenda */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setReportMingguKe(typeof selectedMinggu === "number" ? selectedMinggu : 3);
                    setReportKelas(selectedKelas);
                    setIsWeeklyReportOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Laporan Pembelajaran Mingguan</span>
                </button>

                {canManageContent && (
                  <button
                    type="button"
                    onClick={handleOpenAddJadwal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Agenda Silabus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Week Pills Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 shrink-0 mr-1 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                Pilih Pekan:
              </span>
              {[
                { id: "Semua", label: "Semua Pekan (Bulan Ini)", badge: "" },
                { id: 1, label: "Pekan 1", sub: "01 - 06 Sep", badge: "Lalu" },
                { id: 2, label: "Pekan 2", sub: "08 - 13 Sep", badge: "Lalu" },
                { id: 3, label: "Pekan 3", sub: "15 - 20 Sep", badge: "Pekan Ini" },
                { id: 4, label: "Pekan 4", sub: "22 - 27 Sep", badge: "Mendatang" },
              ].map((w) => {
                const isSelected = selectedMinggu === w.id;
                return (
                  <button
                    key={String(w.id)}
                    type="button"
                    onClick={() => setSelectedMinggu(w.id as number | "Semua")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border cursor-pointer ${
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <span>{w.label}</span>
                    {w.sub && (
                      <span
                        className={`text-[10px] font-normal ${
                          isSelected ? "text-emerald-100" : "text-slate-400"
                        }`}
                      >
                        ({w.sub})
                      </span>
                    )}
                    {w.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
                          isSelected
                            ? "bg-emerald-800 text-amber-300"
                            : w.badge === "Pekan Ini"
                            ? "bg-emerald-100 text-emerald-800 animate-pulse"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {w.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* KPI Stats Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Agenda Materi
                </p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {jadwalStats.totalAgenda}{" "}
                  <span className="text-xs font-normal text-slate-500">Materi</span>
                </p>
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Sudah Diajarkan
                  </p>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {jadwalStats.sudahDiajarkanCount}{" "}
                  <span className="text-xs font-normal text-emerald-600">Selesai</span>
                </p>
              </div>

              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Belum Diajarkan
                  </p>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-amber-700 mt-1">
                  {jadwalStats.belumDiajarkanCount}{" "}
                  <span className="text-xs font-normal text-amber-600">Agenda</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-sky-50 p-3.5 rounded-2xl border border-indigo-200">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                    Ketercapaian
                  </p>
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-indigo-700 mt-1">
                  {jadwalStats.persentaseTuntas}%
                </p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${jadwalStats.persentaseTuntas}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List of Schedules (Table & Interactive Checkbox View) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-800">
                  Daftar Agenda Silabus ({filteredJadwalMateri.length} Ditemukan)
                </span>
                {selectedMinggu !== "Semua" && (
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Pekan Ke-{selectedMinggu}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Centang hijau = Sudah diajarkan di kelas</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>Centang abu = Belum diajarkan</span>
                </span>
              </div>
            </div>

            {filteredJadwalMateri.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700">
                  Tidak ada agenda materi pada filter ini
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Silakan sesuaikan pilihan kelas, mata pelajaran, atau pekan di atas.
                </p>
                {canManageContent && (
                  <button
                    type="button"
                    onClick={handleOpenAddJadwal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Silabus Pekan Ini</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-36 text-center">Status Realisasi</th>
                      <th className="py-3 px-4 w-28">Pekan & Waktu</th>
                      <th className="py-3 px-4 w-36">Mapel & Kelas</th>
                      <th className="py-3 px-4">Bab & Rincian Sub-Bab</th>
                      <th className="py-3 px-4 w-56">Jurnal Pelaksanaan Mengajar</th>
                      <th className="py-3 px-4 w-36 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJadwalMateri.map((item) => {
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.sudahDiajarkan ? "bg-emerald-50/20" : ""
                          }`}
                        >
                          {/* Centang Realisasi Pembelajaran */}
                          <td className="py-4 px-4 text-center align-top">
                            <div className="flex flex-col items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickToggleRealisasi(item)}
                                title={
                                  item.sudahDiajarkan
                                    ? "Klik untuk membatalkan centang realisasi"
                                    : "Klik untuk mencentang bahwa materi sudah diajarkan"
                                }
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                                  item.sudahDiajarkan
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-4 ring-emerald-100"
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 border border-slate-300"
                                }`}
                              >
                                {item.sudahDiajarkan ? (
                                  <Check className="w-6 h-6 stroke-[3]" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300" />
                                )}
                              </button>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  item.sudahDiajarkan
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {item.sudahDiajarkan ? "Sudah Diajarkan" : "Belum Diajarkan"}
                              </span>
                            </div>
                          </td>

                          {/* Pekan & Alokasi */}
                          <td className="py-4 px-4 align-top">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              Pekan {item.mingguKe}
                            </span>
                            <p className="text-[11px] font-medium text-slate-600 mt-1">
                              {item.rentangTanggal}
                            </p>
                            <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1">
                              {item.alokasiJP} JP ({item.alokasiJP * 35} Menit)
                            </span>
                          </td>

                          {/* Mapel & Kelas */}
                          <td className="py-4 px-4 align-top">
                            <p className="font-bold text-slate-800 text-xs">{item.mapel}</p>
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mt-1">
                              {item.kelas}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Semester {item.semester}
                            </p>
                          </td>

                          {/* Bab & Sub-Bab */}
                          <td className="py-4 px-4 align-top space-y-2">
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{item.bab}</span>
                              </p>
                              {item.indikatorKompetensi && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">
                                  🎯 Target: {item.indikatorKompetensi}
                                </p>
                              )}
                            </div>

                            {/* Sub-Bab Badges List */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Rincian Sub-Bab:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.subBab.map((sub, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
                                  >
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                      {sIdx + 1}
                                    </span>
                                    <span>{sub}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Jurnal Realisasi Pelaksanaan */}
                          <td className="py-4 px-4 align-top space-y-1.5">
                            {item.sudahDiajarkan ? (
                              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 space-y-1">
                                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px]">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{item.tanggalRealisasi || "Tanggal tercatat"}</span>
                                  {item.jamRealisasi && (
                                    <span className="text-emerald-700 font-normal">
                                      • {item.jamRealisasi}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-700 flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="font-semibold">{item.guruPengajar || "Guru Pengampu"}</span>
                                </p>
                                {item.catatanPembelajaran && (
                                  <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-emerald-100 mt-1 italic">
                                    &ldquo;{item.catatanPembelajaran}&rdquo;
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-300 text-slate-400 text-center space-y-1">
                                <p className="text-[11px] font-medium text-slate-500">
                                  Belum ada catatan jurnal
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenJurnalModal(item)}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                                >
                                  + Catat Jurnal Sekarang
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-4 px-4 align-top text-center">
                            <div className="flex flex-col gap-1.5 items-center">
                              {/* Guru & Admin can edit journal notes */}
                              <button
                                type="button"
                                onClick={() => handleOpenJurnalModal(item)}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer"
                                title="Catat Jurnal & Realisasi Mengajar"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{item.sudahDiajarkan ? "Edit Jurnal" : "Catat Jurnal"}</span>
                              </button>

                              {/* Admin only: Edit and Delete Silabus */}
                              {canManageContent && (
                                <div className="flex items-center gap-1 w-full justify-center pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditJadwal(item)}
                                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                    title="Edit Silabus Agenda"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteJadwal(item)}
                                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                    title="Hapus Agenda"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 1: MATERI & MODUL --- */}
      {activeTab === "materi" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>Daftar Modul & Materi Pelajaran</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredMateri.length} Materi Ditemukan)
                </span>
              </h2>

              {/* View Switcher: List Tabel (default) and Grid */}
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMateriViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    materiViewMode === "list"
                      ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                  title="Tampilan List Tabel"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMateriViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    materiViewMode === "grid"
                      ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                  title="Tampilan Grid Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid Kartu</span>
                </button>
              </div>
            </div>

            {canManageContent && (
              <button
                onClick={() => {
                  setEditingMateri(null);
                  const defaultClass = isGuru
                    ? teacherScope.assignedClass || user?.kelas || "Kelas 6"
                    : selectedKelas !== "Semua"
                    ? selectedKelas
                    : kelasList[0]?.nama || "Kelas 6";
                  const defaultMapel =
                    isGuru && teacherScope.assignedSubjects.length > 0
                      ? teacherScope.assignedSubjects[0]
                      : mapelList[0]?.nama || "Matematika";

                  setMateriForm({
                    judul: "",
                    mapel: defaultMapel,
                    kelas: defaultClass,
                    pertemuanKe: (filteredMateri.length || 0) + 1,
                    durasiMenit: 30,
                    tipeKonten: "video",
                    urlKonten: "",
                    fileLampiran: "",
                    deskripsi: "",
                  });
                  setIsAddMateriOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Modul Materi</span>
              </button>
            )}
          </div>

          {filteredMateri.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-slate-800 p-12 text-center text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto text-emerald-300 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">Belum ada materi pembelajaran</p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan sesuaikan filter kelas/mapel atau tambahkan modul materi baru.
              </p>
            </div>
          ) : materiViewMode === "list" ? (
            /* --- LIST TABEL VIEW (RESPONSIVE TABLE) --- */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                      <th className="py-3.5 px-4 text-center w-16">Sesi</th>
                      <th className="py-3.5 px-4 min-w-[260px]">Modul & Materi Pelajaran</th>
                      <th className="py-3.5 px-4 min-w-[150px]">Mapel & Rombel</th>
                      <th className="py-3.5 px-4 min-w-[160px]">Pengampu & Durasi</th>
                      <th className="py-3.5 px-4 text-center min-w-[130px]">Status</th>
                      <th className="py-3.5 px-4 text-right min-w-[190px]">Aksi / Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50/80 dark:divide-slate-800 text-xs">
                    {filteredMateri.map((materi) => {
                      const studentId = currentStudent?.id || "sis-active";
                      const isRead = materi.sudahDibacaSiswaIds?.includes(studentId);
                      const readCount = materi.sudahDibacaSiswaIds?.length || 0;

                      return (
                        <tr
                          key={materi.id}
                          className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          {/* Sesi / Pertemuan */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="inline-flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-200/70 shadow-2xs">
                              <span className="text-[9px] text-emerald-600 font-semibold leading-none">Pert.</span>
                              <span className="text-xs leading-none mt-0.5">#{materi.pertemuanKe}</span>
                            </div>
                          </td>

                          {/* Modul & Judul */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 shrink-0">
                                {materi.tipeKonten === "video" && (
                                  <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 inline-block" title="Video Pembelajaran">
                                    <Video className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {materi.tipeKonten === "pdf" && (
                                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 inline-block" title="Dokumen / PDF">
                                    <FileText className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {materi.tipeKonten === "artikel" && (
                                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 inline-block" title="Rangkuman Materi">
                                    <BookOpen className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setActiveMateriModal(materi)}
                                  className="font-bold text-slate-800 dark:text-white hover:text-emerald-700 text-left line-clamp-1 group-hover:text-emerald-700 transition"
                                >
                                  {materi.judul}
                                </button>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                                  {materi.deskripsi}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Mapel & Kelas */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                {materi.mapel}
                              </span>
                              <span className="inline-flex items-center w-fit text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {materi.kelas}
                              </span>
                            </div>
                          </td>

                          {/* Pengampu & Durasi */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                {materi.guruNama}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {materi.durasiMenit || 30} menit
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            {isSiswa || isOrtu ? (
                              isRead ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Selesai
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Belum Dibaca
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                                <Users className="w-3 h-3 text-emerald-600" />
                                {readCount} Santri
                              </span>
                            )}
                          </td>

                          {/* Aksi: Buka, Edit, Hapus */}
                          <td className="py-3.5 px-4 text-right align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setActiveMateriModal(materi)}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-xl transition shadow-xs"
                                title="Buka dan Pelajari Materi"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Buka</span>
                              </button>

                              {canManageContent && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditMateri(materi)}
                                    className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-semibold py-1.5 px-2.5 rounded-xl transition shadow-xs"
                                    title="Edit Modul & Materi"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Hapus materi "${materi.judul}"?`)) {
                                        deleteMateri(materi.id);
                                        showToast("Materi berhasil dihapus");
                                      }
                                    }}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                                    title="Hapus Materi"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* --- GRID VIEW --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMateri.map((materi) => {
                const studentId = currentStudent?.id || "sis-active";
                const isRead = materi.sudahDibacaSiswaIds?.includes(studentId);

                return (
                  <div
                    key={materi.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Card Header Tag */}
                      <div className="p-5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Pertemuan #{materi.pertemuanKe}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {materi.kelas}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mb-1">
                          <span>{materi.mapel}</span>
                        </div>

                        <h3 className="font-bold text-slate-800 dark:text-white text-base line-clamp-2 mb-2">
                          {materi.judul}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                          {materi.deskripsi}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Info & Actions */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[130px]">{materi.guruNama}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {materi.tipeKonten === "video" && (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                              <Video className="w-3 h-3" /> Video
                            </span>
                          )}
                          {materi.tipeKonten === "pdf" && (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                              <FileText className="w-3 h-3" /> PDF
                            </span>
                          )}
                          {materi.tipeKonten === "artikel" && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                              <BookOpen className="w-3 h-3" /> Rangkuman
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Read status for student */}
                      {(isSiswa || isOrtu) && (
                        <div className="flex items-center justify-between text-xs">
                          {isRead ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Selesai Dipelajari
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum dipelajari</span>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setActiveMateriModal(materi)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-xl transition shadow-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Buka Materi
                        </button>

                        {canManageContent && (
                          <>
                            <button
                              onClick={() => handleOpenEditMateri(materi)}
                              className="p-2 text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition"
                              title="Edit Materi"
                            >
                              <Edit className="w-4 h-4 text-amber-600" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus materi "${materi.judul}"?`)) {
                                  deleteMateri(materi.id);
                                  showToast("Materi berhasil dihapus");
                                }
                              }}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: TUGAS & PENGUMPULAN --- */}
      {activeTab === "tugas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Daftar Tugas & Tagihan Siswa</span>
              <span className="text-xs font-normal text-slate-500">
                ({filteredTugas.length} Tugas)
              </span>
            </h2>
            {canManageContent && (
              <button
                onClick={() => {
                  const defaultClass = isGuru
                    ? teacherScope.assignedClass || user?.kelas || "Kelas 6"
                    : selectedKelas !== "Semua"
                    ? selectedKelas
                    : kelasList[0]?.nama || "Kelas 6";
                  const defaultMapel =
                    isGuru && teacherScope.assignedSubjects.length > 0
                      ? teacherScope.assignedSubjects[0]
                      : mapelList[0]?.nama || "Matematika";

                  setTugasForm({
                    judul: "",
                    mapel: defaultMapel,
                    kelas: defaultClass,
                    deskripsi: "",
                    deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
                    bobotPoin: 100,
                    filePetunjuk: "",
                  });
                  setIsAddTugasOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Buat Tugas Baru
              </button>
            )}
          </div>

          {filteredTugas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Tidak ada tugas aktif</p>
              <p className="text-xs text-slate-400 mt-1">
                Semua tugas telah diselesaikan atau belum ada tugas yang diterbitkan guru.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTugas.map((tugas) => {
                const studentId = currentStudent?.id || "sis-active";
                const studentNisn = currentStudent?.nisn || "0081234567";

                const userSubmission = lmsSubmissionList.find(
                  (s) =>
                    s.tugasId === tugas.id &&
                    (s.siswaId === studentId || s.siswaNisn === studentNisn)
                );

                const allSubmissions = lmsSubmissionList.filter((s) => s.tugasId === tugas.id);
                const isPastDeadline = new Date(tugas.deadline) < new Date();

                return (
                  <div
                    key={tugas.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {tugas.mapel}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {tugas.kelas}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                            Bobot: {tugas.bobotPoin} Poin
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{tugas.judul}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Diterbitkan oleh: <span className="font-semibold">{tugas.guruNama}</span>
                        </p>
                      </div>

                      {/* Deadline & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-slate-400 font-medium">Batas Pengumpulan</p>
                            <p
                              className={`font-bold ${
                                isPastDeadline ? "text-rose-600" : "text-slate-700"
                              }`}
                            >
                              {tugas.deadline.replace("T", " ")}
                            </p>
                          </div>
                        </div>

                        {(isSiswa || isOrtu) && (
                          <div>
                            {userSubmission ? (
                              userSubmission.nilai !== undefined ? (
                                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
                                  <span className="text-slate-500 block">Nilai Tugas:</span>
                                  <span className="text-emerald-700 font-extrabold text-sm">
                                    {userSubmission.nilai} / 100
                                  </span>
                                </div>
                              ) : (
                                <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-700 font-medium flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                  <span>Sudah Diserahkan</span>
                                </div>
                              )
                            ) : (
                              <div
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                                  isPastDeadline
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                <AlertCircle className="w-4 h-4" />
                                <span>{isPastDeadline ? "Terlambat" : "Belum Dikumpulkan"}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Task Description */}
                    <div className="py-4 text-sm text-slate-600 leading-relaxed">
                      {tugas.deskripsi}
                    </div>

                    {tugas.filePetunjuk && (
                      <div className="mb-4 inline-flex items-center gap-2 text-xs bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lampiran Panduan: {tugas.filePetunjuk}</span>
                      </div>
                    )}

                    {/* Student Feedback Note if graded */}
                    {userSubmission && userSubmission.feedbackGuru && (
                      <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                        <span className="font-bold">Komentar & Catatan Guru:</span>{" "}
                        {userSubmission.feedbackGuru}
                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div>
                        {canViewTeacherReports && (
                          <span className="text-xs text-slate-500 font-medium">
                            Total Pengumpulan:{" "}
                            <span className="font-bold text-blue-600">
                              {allSubmissions.length} Siswa
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isSiswa && (
                          <button
                            onClick={() => {
                              setActiveTugasToSubmit(tugas);
                              setSubmissionForm({
                                catatanSiswa: userSubmission?.catatanSiswa || "",
                                fileJawabanUrl: userSubmission?.fileJawabanUrl || "",
                              });
                            }}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>
                              {userSubmission ? "Perbarui Jawaban Tugas" : "Kumpulkan Tugas Sekarang"}
                            </span>
                          </button>
                        )}

                        {canViewTeacherReports && (
                          <button
                            onClick={() => setActiveTugasSubmissions(tugas)}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition"
                          >
                            <Eye className="w-4 h-4 text-slate-500" />
                            <span>Lihat Jawaban Siswa ({allSubmissions.length})</span>
                          </button>
                        )}

                        {canManageContent && (
                          <button
                            onClick={() => {
                              if (window.confirm("Hapus tugas ini?")) {
                                deleteTugas(tugas.id);
                                showToast("Tugas berhasil dihapus");
                              }
                            }}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: UJIAN & KUIS CBT --- */}
      {activeTab === "kuis" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Simulasi & Ujian Online (CBT)</span>
              <span className="text-xs font-normal text-slate-500">
                ({filteredKuis.length} Ujian CBT Tersedia)
              </span>
            </h2>
            <div className="flex items-center gap-2">
              {canManageContent && (
                <>
                  <button
                    onClick={() => setActiveTab("bank-soal")}
                    className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs px-3.5 py-2 rounded-xl transition"
                  >
                    <Database className="w-4 h-4" />
                    Ambil dari Bank Soal
                  </button>
                  <button
                    onClick={() => {
                      const targetBank =
                        filteredBankSoalPackages && filteredBankSoalPackages.length > 0
                          ? filteredBankSoalPackages[0]
                          : (lmsBankSoalList || [])[0];
                      if (targetBank && targetBank.soalList && targetBank.soalList.length > 0) {
                        setCbtSourceItems(targetBank.soalList);
                        setGenerateKuisForm({
                          judul: `Ujian CBT: ${targetBank.judul}`,
                          mapel: targetBank.mapel,
                          kelas: isGuru
                            ? teacherScope.assignedClass || user?.kelas || "Kelas 6"
                            : selectedKelas !== "Semua"
                            ? selectedKelas
                            : "Kelas 6",
                          durasiMenit: 30,
                          kkm: 75,
                          deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
                          deskripsi: `Penilaian CBT berbasis Bank Soal materi ${targetBank.topik}`,
                        });
                        setIsGenerateKuisModalOpen(true);
                      } else {
                        setActiveTab("bank-soal");
                        showToast("Silakan pilih paket Bank Soal untuk diterbitkan menjadi Ujian CBT!");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Kuis CBT Baru
                  </button>
                </>
              )}
            </div>
          </div>

          {filteredKuis.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Belum ada jadwal kuis CBT</p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan pilih filter kelas lain atau buat paket kuis baru dari Bank Soal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredKuis.map((kuis) => {
                const studentId = currentStudent?.id || "sis-active";
                const studentNisn = currentStudent?.nisn || "0081234567";

                const myAttempt = lmsKuisAttemptList.find(
                  (a) =>
                    a.kuisId === kuis.id &&
                    (a.siswaId === studentId || a.siswaNisn === studentNisn)
                );

                const totalAttempts = lmsKuisAttemptList.filter((a) => a.kuisId === kuis.id);

                return (
                  <div
                    key={kuis.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {kuis.mapel}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {kuis.kelas}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-800 text-base mb-2">{kuis.judul}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{kuis.deskripsi}</p>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center mb-4">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Durasi
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {kuis.durasiMenit} Menit
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Soal
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {kuis.soalList.length} Butir
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            KKM
                          </span>
                          <span className="text-xs font-bold text-blue-600">{kuis.kkm}</span>
                        </div>
                      </div>

                      {/* Attempt card for student */}
                      {(isSiswa || isOrtu) && myAttempt && (
                        <div
                          className={`p-3 rounded-xl border mb-2 text-xs ${
                            myAttempt.statusLulus
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                              : "bg-amber-50 border-amber-200 text-amber-900"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Status: {myAttempt.statusLulus ? "LULUS" : "REMEDIAL"}</span>
                            <span className="text-sm">{myAttempt.skor}/100</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Benar: {myAttempt.totalBenar} dari {myAttempt.totalSoal} Soal
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Guru: {kuis.guruNama}</span>
                        {canViewTeacherReports && (
                          <span className="font-semibold text-blue-600">
                            {totalAttempts.length} Siswa Mengerjakan
                          </span>
                        )}
                      </div>

                      {isSiswa && (
                        <div className="flex gap-2">
                          {myAttempt ? (
                            <button
                              onClick={() => {
                                setReviewQuizModal({ quiz: kuis, attempt: myAttempt });
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Lihat Pembahasan
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Mulai Ujian CBT "${kuis.judul}" sekarang?\nDurasi pengerjaan: ${kuis.durasiMenit} menit. Timer akan langsung berjalan.`
                                  )
                                ) {
                                  handleStartCBT(kuis);
                                }
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-md shadow-blue-500/20"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Mulai Ujian CBT
                            </button>
                          )}
                        </div>
                      )}

                      {canViewTeacherReports && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewAttemptsQuiz(kuis)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 px-3 rounded-xl transition border border-blue-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Rekap Skor Siswa ({totalAttempts.length})
                          </button>
                          {canManageContent && (
                            <button
                              onClick={() => {
                                if (window.confirm("Hapus kuis CBT ini?")) {
                                  deleteKuis(kuis.id);
                                  showToast("Kuis CBT berhasil dihapus");
                                }
                              }}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                              title="Hapus Kuis"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: BANK SOAL (PAKET JUDUL & KELOLA BUTIR SOAL) --- */}
      {activeTab === "bank-soal" && (
        <div className="space-y-5">
          {!currentActivePackage ? (
            /* ========================================================================= */
            /* --- HALAMAN AWAL: DAFTAR JUDUL BANK SOAL --- */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Toolbar & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <span>Daftar Paket Bank Soal</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {filteredBankSoalPackages.length} Paket
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Kelola paket bank soal terstandar per topik mata pelajaran, atau gunakan generator otomatis untuk membuat butir soal instan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-600 font-medium">
                    Total: <strong className="text-slate-800">{totalBankQuestions}</strong> Butir Soal Terdaftar
                  </div>

                  {canManageContent && (
                    <button
                      onClick={() => {
                        const defaultTingkat = isGuru && teacherScope.accessibleClasses.length > 0
                          ? (teacherScope.accessibleClasses.some((c) => c.includes("6")) ? "6" : "X")
                          : (selectedKelas !== "Semua" ? selectedKelas : "X");
                        const defaultMapel = selectedMapel !== "Semua"
                          ? selectedMapel
                          : (isGuru && teacherScope.accessibleClasses.some((c) => c.includes("6"))
                            ? "Matematika"
                            : "Matematika Wajib");
                        setBankPackageForm({
                          judul: "",
                          mapel: defaultMapel,
                          tingkatKelas: defaultTingkat,
                          topik: "",
                          deskripsi: "",
                        });
                        setGeneratedSoalList([]);
                        setIsAddBankModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Bank Soal Baru</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Bank Soal Packages */}
              {filteredBankSoalPackages.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
                  <Database className="w-14 h-14 mx-auto text-slate-300 mb-3" />
                  <h3 className="font-bold text-slate-700 text-base">Tidak Ada Paket Bank Soal Ditemukan</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Belum ada bank soal untuk kriteria filter ini. Silakan sesuaikan pencarian atau buat paket bank soal baru dengan generator otomatis.
                  </p>
                  {canManageContent && (
                    <button
                      onClick={() => {
                        const defaultTingkat = isGuru && teacherScope.accessibleClasses.length > 0
                          ? (teacherScope.accessibleClasses.some((c) => c.includes("6")) ? "6" : "X")
                          : (selectedKelas !== "Semua" ? selectedKelas : "X");
                        const defaultMapel = selectedMapel !== "Semua"
                          ? selectedMapel
                          : (isGuru && teacherScope.accessibleClasses.some((c) => c.includes("6"))
                            ? "Matematika"
                            : "Matematika Wajib");
                        setBankPackageForm({
                          judul: "",
                          mapel: defaultMapel,
                          tingkatKelas: defaultTingkat,
                          topik: "",
                          deskripsi: "",
                        });
                        setGeneratedSoalList([]);
                        setIsAddBankModalOpen(true);
                      }}
                      className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Bank Soal Pertama</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredBankSoalPackages.map((pkg) => {
                    const countMudah = pkg.soalList.filter((s) => s.tingkatKesulitan === "Mudah").length;
                    const countSedang = pkg.soalList.filter((s) => s.tingkatKesulitan === "Sedang").length;
                    const countSukar = pkg.soalList.filter((s) => s.tingkatKesulitan === "Sukar").length;

                    return (
                      <div
                        key={pkg.id}
                        className="bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                      >
                        <div className="p-6">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {pkg.kode}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                {pkg.mapel}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                                Kelas {pkg.tingkatKelas}
                              </span>
                            </div>
                          </div>

                          {/* Judul Bank Soal */}
                          <h3
                            onClick={() => {
                              setActiveBankPackage(pkg);
                              setSelectedSoalIds([]);
                            }}
                            className="text-base font-bold text-slate-800 hover:text-indigo-600 transition cursor-pointer line-clamp-2 mb-1.5"
                          >
                            {pkg.judul}
                          </h3>

                          {/* Topik */}
                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">Topik: {pkg.topik}</span>
                          </div>

                          {/* Deskripsi */}
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                            {pkg.deskripsi || `Paket bank soal mata pelajaran ${pkg.mapel} untuk materi pokok ${pkg.topik}.`}
                          </p>

                          {/* Metrics Box */}
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Jumlah Butir Soal:</span>
                              <span className="font-extrabold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                                {pkg.soalList.length} Soal
                              </span>
                            </div>

                            {/* Difficulty Badges */}
                            <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-slate-200/60">
                              <span className="text-slate-400 text-[10px] uppercase font-semibold">Tingkat:</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                {countMudah} Mudah
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                {countSedang} Sedang
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                {countSukar} Sukar
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveBankPackage(pkg);
                                setSelectedSoalIds([]);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Buka Butir Soal ({pkg.soalList.length})</span>
                            </button>

                            {canManageContent && (
                              <button
                                disabled={pkg.soalList.length === 0}
                                onClick={() => {
                                  setCbtSourceItems(pkg.soalList);
                                  const targetKelas = isGuru && teacherScope.accessibleClasses.length > 0
                                    ? teacherScope.accessibleClasses[0]
                                    : (pkg.tingkatKelas === "Semua" ? (kelasList[0]?.nama || "Kelas 6") : pkg.tingkatKelas);
                                  setGenerateKuisForm({
                                    judul: `Ujian CBT: ${pkg.topik}`,
                                    mapel: pkg.mapel,
                                    kelas: targetKelas,
                                    durasiMenit: Math.max(15, pkg.soalList.length * 5),
                                    kkm: 75,
                                    deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                                    deskripsi: `Paket soal CBT diterbitkan langsung dari "${pkg.judul}" (${pkg.soalList.length} butir soal).`,
                                  });
                                  setIsGenerateKuisModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Jadikan Ujian CBT"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>CBT</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span className="truncate">Oleh: {pkg.pembuatGuru}</span>
                            {canManageContent && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingBankPackage(pkg);
                                    setBankPackageForm({
                                      judul: pkg.judul,
                                      mapel: pkg.mapel,
                                      tingkatKelas: pkg.tingkatKelas,
                                      topik: pkg.topik,
                                      deskripsi: pkg.deskripsi || "",
                                    });
                                    setIsEditBankModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Edit Informasi Bank Soal"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBankPackage(pkg)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus Paket Bank Soal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* --- HALAMAN DETAIL: KELOLA BUTIR SOAL DALAM PAKET --- */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Back to package list navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveBankPackage(null);
                    setSelectedSoalIds([]);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-4 py-2 rounded-xl transition shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar Judul Bank Soal</span>
                </button>

                <div className="flex items-center gap-2">
                  {canManageContent && (
                    <button
                      onClick={() => {
                        setEditingBankPackage(currentActivePackage);
                        setBankPackageForm({
                          judul: currentActivePackage.judul,
                          mapel: currentActivePackage.mapel,
                          tingkatKelas: currentActivePackage.tingkatKelas,
                          topik: currentActivePackage.topik,
                          deskripsi: currentActivePackage.deskripsi || "",
                        });
                        setIsEditBankModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Paket</span>
                    </button>
                  )}
                  {canManageContent && (
                    <button
                      onClick={() => handleDeleteBankPackage(currentActivePackage)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Paket</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Package Banner Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-white/20 text-white">
                        {currentActivePackage.kode}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                        {currentActivePackage.mapel}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/30">
                        Kelas {currentActivePackage.tingkatKelas}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                        Topik: {currentActivePackage.topik}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black">{currentActivePackage.judul}</h1>
                    <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
                      {currentActivePackage.deskripsi || `Bank butir soal resmi mata pelajaran ${currentActivePackage.mapel}.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Select all toggle */}
                    {canManageContent && currentActivePackage.soalList.length > 0 && (
                      <button
                        onClick={() => {
                          if (selectedSoalIds.length === currentActivePackage.soalList.length) {
                            setSelectedSoalIds([]);
                          } else {
                            setSelectedSoalIds(currentActivePackage.soalList.map((s) => s.id));
                          }
                        }}
                        className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
                      >
                        {selectedSoalIds.length === currentActivePackage.soalList.length ? (
                          <>
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                            <span>Batal Pilih Semua</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-slate-300" />
                            <span>Pilih Semua ({currentActivePackage.soalList.length})</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Quick CBT Button */}
                    {canManageContent && (
                      <button
                        onClick={() => {
                          const items =
                            selectedSoalIds.length > 0
                              ? currentActivePackage.soalList.filter((s) => selectedSoalIds.includes(s.id))
                              : currentActivePackage.soalList;
                          setCbtSourceItems(items);
                          const targetKelas = isGuru && teacherScope.accessibleClasses.length > 0
                            ? teacherScope.accessibleClasses[0]
                            : (currentActivePackage.tingkatKelas === "Semua" ? (kelasList[0]?.nama || "Kelas 6") : currentActivePackage.tingkatKelas);
                          setGenerateKuisForm({
                            judul: `Ujian CBT - ${currentActivePackage.topik}`,
                            mapel: currentActivePackage.mapel,
                            kelas: targetKelas,
                            durasiMenit: Math.max(15, items.length * 5),
                            kkm: 75,
                            deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                            deskripsi: `Ujian CBT diterbitkan dari paket ${currentActivePackage.judul} (${items.length} butir soal).`,
                          });
                          setIsGenerateKuisModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Jadikan Kuis CBT ({selectedSoalIds.length || currentActivePackage.soalList.length})</span>
                      </button>
                    )}

                    {/* Generate Extra Questions */}
                    {canManageContent && (
                      <button
                        onClick={handleQuickGenerateMoreQuestions}
                        className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow"
                        title="Generate otomatis 2 butir soal tambahan sesuai topik"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>✨ Generate Soal Tambahan</span>
                      </button>
                    )}

                    {/* Add Question Item Manual */}
                    {canManageContent && (
                      <button
                        onClick={() => {
                          setEditingSoalItem(null);
                          setSoalItemForm({
                            pertanyaan: "",
                            pilihan: ["", "", "", "", ""],
                            kunciJawaban: 0,
                            pembahasan: "",
                            tingkatKesulitan: "Sedang",
                            poinDefault: 15,
                          });
                          setIsAddSoalItemModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Soal Manual</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Items List in Active Package */}
              {currentActivePackage.soalList.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
                  <Database className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-bold text-slate-700">Belum Ada Butir Soal dalam Paket Ini</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Paket bank soal ini masih kosong. Klik tombol di bawah untuk men-generate butir soal otomatis atau memasukkan soal manual.
                  </p>
                  {canManageContent && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <button
                        onClick={handleQuickGenerateMoreQuestions}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Generate Soal Otomatis</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingSoalItem(null);
                          setSoalItemForm({
                            pertanyaan: "",
                            pilihan: ["", "", "", "", ""],
                            kunciJawaban: 0,
                            pembahasan: "",
                            tingkatKesulitan: "Sedang",
                            poinDefault: 15,
                          });
                          setIsAddSoalItemModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Input Soal Manual</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentActivePackage.soalList.map((soal, idx) => {
                    const isSelected = selectedSoalIds.includes(soal.id);
                    const isPembahasanOpen = !!expandedPembahasanIds[soal.id];
                    const studentAnswer = studentPracticeAnswers[soal.id];

                    return (
                      <div
                        key={soal.id}
                        className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-sm ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Top Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-2">
                            {canManageContent && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSoalIds([...selectedSoalIds, soal.id]);
                                  } else {
                                    setSelectedSoalIds(selectedSoalIds.filter((id) => id !== soal.id));
                                  }
                                }}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            )}

                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              #{idx + 1} ({soal.kode})
                            </span>

                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                soal.tingkatKesulitan === "Mudah"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : soal.tingkatKesulitan === "Sedang"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {soal.tingkatKesulitan}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {soal.poinDefault} Poin
                            </span>
                          </div>
                        </div>

                        {/* Pertanyaan */}
                        <div className="py-4 text-sm md:text-base font-semibold text-slate-800 leading-relaxed whitespace-pre-line">
                          {soal.pertanyaan}
                        </div>

                        {/* Pilihan A - E */}
                        <div className="space-y-2 mb-4">
                          {soal.pilihan.map((opsi, optIdx) => {
                            const huruf = String.fromCharCode(65 + optIdx);
                            const isSelectedPractice = studentAnswer === optIdx;
                            const isKey = optIdx === soal.kunciJawaban;

                            let optClasses =
                              "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700";
                            if (isPembahasanOpen) {
                              if (isKey) {
                                optClasses = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                              }
                            } else if (isSelectedPractice) {
                              if (isKey) {
                                optClasses = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                              } else {
                                optClasses = "border-rose-400 bg-rose-50 text-rose-800";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  setStudentPracticeAnswers({
                                    ...studentPracticeAnswers,
                                    [soal.id]: optIdx,
                                  });
                                }}
                                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between text-xs ${optClasses}`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-lg bg-black/5 font-bold flex items-center justify-center shrink-0">
                                    {huruf}
                                  </span>
                                  <span>{opsi}</span>
                                </span>

                                {isPembahasanOpen && isKey && (
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase bg-white px-2 py-0.5 rounded border border-emerald-300">
                                    Kunci Jawaban
                                  </span>
                                )}

                                {!isPembahasanOpen && isSelectedPractice && (
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                      isKey ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"
                                    }`}
                                  >
                                    {isKey ? "✓ Jawaban Benar" : "✗ Kurang Tepat"}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Pembahasan */}
                        {isPembahasanOpen && (
                          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 animate-in fade-in">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              <span>Kunci Jawaban: Pilihan {String.fromCharCode(65 + soal.kunciJawaban)}</span>
                            </div>
                            <div className="leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200 text-slate-600">
                              <span className="font-semibold text-slate-800 block mb-1">Pembahasan & Konsep:</span>
                              {soal.pembahasan}
                            </div>
                          </div>
                        )}

                        {/* Bottom Actions per Question */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setExpandedPembahasanIds({
                                ...expandedPembahasanIds,
                                [soal.id]: !isPembahasanOpen,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isPembahasanOpen ? "Sembunyikan Pembahasan" : "Lihat Kunci & Pembahasan"}</span>
                          </button>

                          {canManageContent && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingSoalItem(soal);
                                  setSoalItemForm({
                                    pertanyaan: soal.pertanyaan,
                                    pilihan: [...soal.pilihan],
                                    kunciJawaban: soal.kunciJawaban,
                                    pembahasan: soal.pembahasan,
                                    tingkatKesulitan: soal.tingkatKesulitan,
                                    poinDefault: soal.poinDefault,
                                  });
                                  setIsAddSoalItemModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Butir Soal"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus butir soal [${soal.kode}] dari paket ini?`)) {
                                    deleteSoalFromBank(currentActivePackage.id, soal.id);
                                    setSelectedSoalIds(selectedSoalIds.filter((id) => id !== soal.id));
                                    showToast("Butir soal berhasil dihapus dari paket.");
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus / Kurangi Butir Soal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- ALL LMS MODALS --- */}
      {/* ========================================================================= */}

      {/* 1. Modal Baca & Preview Materi */}
      {activeMateriModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    Pertemuan #{activeMateriModal.pertemuanKe}
                  </span>
                  <span className="text-xs text-slate-500">
                    {activeMateriModal.mapel} • {activeMateriModal.kelas}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{activeMateriModal.judul}</h3>
              </div>
              <button
                onClick={() => setActiveMateriModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {activeMateriModal.tipeKonten === "video" && activeMateriModal.urlKonten && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow">
                  <iframe
                    src={getEmbedUrl(activeMateriModal.urlKonten)}
                    title={activeMateriModal.judul}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <div>
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2">
                  Rangkuman Materi & Catatan Pembelajaran
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {activeMateriModal.deskripsi}
                </div>
              </div>

              {activeMateriModal.fileLampiran && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {activeMateriModal.fileLampiran}
                      </p>
                      <p className="text-[11px] text-slate-500">Modul e-Book / PDF Materi</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      alert(`Simulasi unduhan berkas: ${activeMateriModal.fileLampiran}`)
                    }
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Modul
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Pengampu: <span className="font-semibold">{activeMateriModal.guruNama}</span>
              </div>

              <div className="flex items-center gap-3">
                {(isSiswa || isOrtu) && (
                  <button
                    onClick={() => {
                      const studentId = currentStudent?.id || "sis-active";
                      toggleBacaMateri(activeMateriModal.id, studentId);
                      showToast("Status progres membaca materi berhasil diperbarui!");
                      setActiveMateriModal(null);
                    }}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tandai Selesai Dipelajari</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveMateriModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Tambah / Edit Materi (Guru/Admin) */}
      {isAddMateriOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {editingMateri ? <Edit className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {editingMateri ? "Edit Modul Materi Pembelajaran" : "Tambah Modul Materi Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingMateri
                      ? "Perbarui detail bahan ajar, topik, atau berkas modul pembelajaran"
                      : "Unggah materi belajar, tautan video, atau ringkasan baru"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddMateriOpen(false);
                  setEditingMateri(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!canManageContent) {
                  showToast("Hanya Administrator yang memiliki akses untuk menambah atau mengedit materi.");
                  setIsAddMateriOpen(false);
                  setEditingMateri(null);
                  return;
                }
                if (editingMateri) {
                  updateMateri(editingMateri.id, {
                    judul: materiForm.judul,
                    mapel: materiForm.mapel,
                    kelas: materiForm.kelas,
                    deskripsi: materiForm.deskripsi,
                    tipeKonten: materiForm.tipeKonten,
                    urlKonten: materiForm.urlKonten,
                    fileLampiran: materiForm.fileLampiran || "Modul_Pembelajaran.pdf",
                    pertemuanKe: Number(materiForm.pertemuanKe) || 1,
                    durasiMenit: Number(materiForm.durasiMenit) || 30,
                  });
                  showToast(`Modul materi "${materiForm.judul}" berhasil diperbarui!`);
                } else {
                  addMateri({
                    judul: materiForm.judul,
                    mapel: materiForm.mapel,
                    kelas: materiForm.kelas,
                    guruNama: user?.name || "Guru Pengampu",
                    guruId: user?.id,
                    deskripsi: materiForm.deskripsi,
                    tipeKonten: materiForm.tipeKonten,
                    urlKonten: materiForm.urlKonten,
                    fileLampiran: materiForm.fileLampiran || "Modul_Pembelajaran.pdf",
                    pertemuanKe: Number(materiForm.pertemuanKe) || 1,
                    durasiMenit: Number(materiForm.durasiMenit) || 30,
                  });
                  showToast("Modul materi baru berhasil diterbitkan!");
                }
                setIsAddMateriOpen(false);
                setEditingMateri(null);
              }}
              className="p-6 overflow-y-auto space-y-4 flex-1"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Materi / Topik Pembelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={materiForm.judul}
                  onChange={(e) => setMateriForm({ ...materiForm, judul: e.target.value })}
                  placeholder="Contoh: Pengenalan Aljabar Linear & Matriks"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={materiForm.mapel}
                    onChange={(e) => setMateriForm({ ...materiForm, mapel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Kelas *
                  </label>
                  <select
                    value={materiForm.kelas}
                    onChange={(e) => setMateriForm({ ...materiForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  >
                    {(isGuru
                      ? (teacherScope.accessibleClasses.length > 0
                          ? teacherScope.accessibleClasses
                          : [teacherScope.assignedClass || "Kelas 6"])
                      : kelasList.map((k) => k.nama)
                    ).map((kNama) => (
                      <option key={kNama} value={kNama}>
                        {kNama} {isGuru ? "(Kelas Binaan Anda)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pertemuan Ke *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={materiForm.pertemuanKe}
                    onChange={(e) =>
                      setMateriForm({ ...materiForm, pertemuanKe: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format Konten *
                  </label>
                  <select
                    value={materiForm.tipeKonten}
                    onChange={(e) =>
                      setMateriForm({
                        ...materiForm,
                        tipeKonten: e.target.value as LMSTipeMateri,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  >
                    <option value="video">Video YouTube</option>
                    <option value="pdf">Dokumen PDF</option>
                    <option value="artikel">Artikel Rangkuman</option>
                    <option value="link">Tautan Luar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimasi (Menit)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={materiForm.durasiMenit}
                    onChange={(e) =>
                      setMateriForm({ ...materiForm, durasiMenit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL Video YouTube / Tautan Konten
                </label>
                <input
                  type="url"
                  value={materiForm.urlKonten}
                  onChange={(e) => setMateriForm({ ...materiForm, urlKonten: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama File Lampiran (Opsional)
                </label>
                <input
                  type="text"
                  value={materiForm.fileLampiran}
                  onChange={(e) => setMateriForm({ ...materiForm, fileLampiran: e.target.value })}
                  placeholder="Modul_Lengkap_Bab_1.pdf"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi & Rangkuman Materi *
                </label>
                <textarea
                  rows={4}
                  required
                  value={materiForm.deskripsi}
                  onChange={(e) => setMateriForm({ ...materiForm, deskripsi: e.target.value })}
                  placeholder="Tuliskan intisari materi, instruksi baca, dan target kompetensi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMateriOpen(false);
                    setEditingMateri(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  {editingMateri ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Terbitkan Materi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Kumpulkan Tugas (Siswa) */}
      {activeTugasToSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-600 font-bold">
                  {activeTugasToSubmit.mapel} • {activeTugasToSubmit.kelas}
                </span>
                <h3 className="text-base font-bold text-slate-800">{activeTugasToSubmit.judul}</h3>
              </div>
              <button
                onClick={() => setActiveTugasToSubmit(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const studentId = currentStudent?.id || user?.id || "sis-active";
                const studentName = currentStudent?.nama || user?.name || "Siswa";
                const studentNisn = currentStudent?.nisn || user?.nisnOrNip || "0081234567";
                const studentKelas = currentStudent?.kelas || activeTugasToSubmit.kelas;

                submitTugas({
                  tugasId: activeTugasToSubmit.id,
                  siswaId: studentId,
                  siswaNama: studentName,
                  siswaNisn: studentNisn,
                  kelas: studentKelas,
                  catatanSiswa: submissionForm.catatanSiswa,
                  fileJawabanUrl: submissionForm.fileJawabanUrl,
                });

                showToast("Jawaban tugas berhasil dikirimkan ke guru!");
                setActiveTugasToSubmit(null);
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <span className="font-bold">Deadline:</span>{" "}
                {activeTugasToSubmit.deadline.replace("T", " ")} WIB
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Ringkasan Jawaban Tugas *
                </label>
                <textarea
                  rows={4}
                  required
                  value={submissionForm.catatanSiswa}
                  onChange={(e) =>
                    setSubmissionForm({ ...submissionForm, catatanSiswa: e.target.value })
                  }
                  placeholder="Tuliskan jawaban singkat atau keterangan tugas yang Anda serahkan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tautan File Jawaban (Google Drive / Dokumen / GitHub) *
                </label>
                <input
                  type="url"
                  required
                  value={submissionForm.fileJawabanUrl}
                  onChange={(e) =>
                    setSubmissionForm({ ...submissionForm, fileJawabanUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/file/d/... atau tautan file tugas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Pastikan link Google Drive telah diatur publik (*Anyone with the link can view*).
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTugasToSubmit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Kirim Jawaban Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Penilaian & Rekap Pengumpulan Tugas (Guru/Admin) */}
      {activeTugasSubmissions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-600 font-bold">
                  {activeTugasSubmissions.mapel} • {activeTugasSubmissions.kelas}
                </span>
                <h3 className="text-lg font-bold text-slate-800">
                  Rekap Jawaban Siswa: {activeTugasSubmissions.judul}
                </h3>
              </div>
              <button
                onClick={() => setActiveTugasSubmissions(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const subs = lmsSubmissionList.filter(
                  (s) => s.tugasId === activeTugasSubmissions.id
                );
                if (subs.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-600">Belum ada siswa yang mengumpulkan tugas ini</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {subs.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">
                              {sub.siswaNama}
                            </span>
                            <span className="text-xs text-slate-500">({sub.siswaNisn})</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sub.status === "Dinilai"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Dikumpulkan: {sub.tanggalKumpul}
                          </p>
                          <p className="text-xs text-slate-700 mt-2 italic bg-white p-2.5 rounded-xl border border-slate-100">
                            &ldquo;{sub.catatanSiswa}&rdquo;
                          </p>

                          {sub.fileJawabanUrl && (
                            <a
                              href={sub.fileJawabanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline mt-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Buka Tautan Tugas Siswa
                            </a>
                          )}
                        </div>

                        {/* Grading Box */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0 flex flex-col gap-2 min-w-[200px]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-semibold">Skor:</span>
                            <span className="font-black text-blue-700 text-base">
                              {sub.nilai !== undefined ? `${sub.nilai} / 100` : "Belum Dinilai"}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              setGradingSubmission({
                                id: sub.id,
                                nilai: sub.nilai ?? 85,
                                feedback: sub.feedbackGuru ?? "Bagus, jawaban sangat lengkap dan terstruktur.",
                              })
                            }
                            className="inline-flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                          >
                            <Award className="w-3.5 h-3.5" />
                            {sub.nilai !== undefined ? "Edit Nilai" : "Beri Nilai & Evaluasi"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 5. Sub-modal Form Penilaian Guru */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-800 mb-4">Input Nilai & Feedback Guru</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skor Nilai Tugas (0 - 100) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradingSubmission.nilai}
                  onChange={(e) =>
                    setGradingSubmission({
                      ...gradingSubmission,
                      nilai: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-base font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Evaluasi / Feedback Guru *
                </label>
                <textarea
                  rows={3}
                  value={gradingSubmission.feedback}
                  onChange={(e) =>
                    setGradingSubmission({
                      ...gradingSubmission,
                      feedback: e.target.value,
                    })
                  }
                  placeholder="Beri motivasi dan catatan perbaikan tugas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    nilaiSubmission(
                      gradingSubmission.id,
                      gradingSubmission.nilai,
                      gradingSubmission.feedback
                    );
                    showToast("Penilaian tugas berhasil disimpan!");
                    setGradingSubmission(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan Nilai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Buat Tugas Baru (Guru/Admin) */}
      {isAddTugasOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Buat Tugas Baru</h3>
              <button
                onClick={() => setIsAddTugasOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!canManageContent) {
                  showToast("Hanya Administrator yang memiliki akses untuk membuat tugas baru.");
                  setIsAddTugasOpen(false);
                  return;
                }
                addTugas({
                  judul: tugasForm.judul,
                  mapel: tugasForm.mapel,
                  kelas: tugasForm.kelas,
                  guruNama: user?.name || "Guru Pengampu",
                  guruId: user?.id,
                  deskripsi: tugasForm.deskripsi,
                  deadline: tugasForm.deadline,
                  bobotPoin: Number(tugasForm.bobotPoin) || 100,
                  filePetunjuk: tugasForm.filePetunjuk || undefined,
                });
                showToast("Tugas baru berhasil diterbitkan untuk siswa!");
                setIsAddTugasOpen(false);
              }}
              className="p-6 overflow-y-auto space-y-4 flex-1"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Tugas *
                </label>
                <input
                  type="text"
                  required
                  value={tugasForm.judul}
                  onChange={(e) => setTugasForm({ ...tugasForm, judul: e.target.value })}
                  placeholder="Contoh: Latihan Mandiri Hukum Newton II"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={tugasForm.mapel}
                    onChange={(e) => setTugasForm({ ...tugasForm, mapel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Kelas *
                  </label>
                  <select
                    value={tugasForm.kelas}
                    onChange={(e) => setTugasForm({ ...tugasForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {(isGuru && teacherScope.accessibleClasses.length > 0
                      ? teacherScope.accessibleClasses
                      : kelasList.map((k) => k.nama)
                    ).map((namaKelas) => (
                      <option key={namaKelas} value={namaKelas}>
                        {namaKelas} {isGuru ? "(Kelas Binaan Anda)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Waktu Pengumpulan (Deadline) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={tugasForm.deadline}
                    onChange={(e) => setTugasForm({ ...tugasForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot Nilai (Poin) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={tugasForm.bobotPoin}
                    onChange={(e) =>
                      setTugasForm({ ...tugasForm, bobotPoin: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petunjuk & Instruksi Pengerjaan *
                </label>
                <textarea
                  rows={4}
                  required
                  value={tugasForm.deskripsi}
                  onChange={(e) => setTugasForm({ ...tugasForm, deskripsi: e.target.value })}
                  placeholder="Jelaskan langkah pengerjaan, format berkas yang diminta, dan ketentuan tugas..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama File Panduan (Opsional)
                </label>
                <input
                  type="text"
                  value={tugasForm.filePetunjuk}
                  onChange={(e) => setTugasForm({ ...tugasForm, filePetunjuk: e.target.value })}
                  placeholder="Lembar_Kerja_Siswa.pdf"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddTugasOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Terbitkan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Pembahasan Kuis CBT */}
      {reviewQuizModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">Pembahasan Ujian CBT</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    Skor: {reviewQuizModal.attempt.skor}/100
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  {reviewQuizModal.quiz.judul}
                </h3>
              </div>
              <button
                onClick={() => setReviewQuizModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {reviewQuizModal.quiz.soalList.map((soal, idx) => {
                const userChoice = reviewQuizModal.attempt.jawaban[soal.id];
                const isCorrect = userChoice === soal.kunciJawaban;

                return (
                  <div
                    key={soal.id}
                    className={`p-5 rounded-2xl border-2 ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-rose-200 bg-rose-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        Soal #{idx + 1}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isCorrect ? "✓ Jawaban Benar" : "✗ Jawaban Salah"}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 mb-4">{soal.pertanyaan}</p>

                    <div className="space-y-2 mb-4">
                      {soal.pilihan.map((opsi, optIdx) => {
                        const huruf = String.fromCharCode(65 + optIdx);
                        const isChosenByUser = userChoice === optIdx;
                        const isKeyAnswer = optIdx === soal.kunciJawaban;

                        let optClasses = "bg-white border-slate-200 text-slate-700";
                        if (isKeyAnswer) {
                          optClasses = "bg-emerald-100 border-emerald-400 text-emerald-900 font-bold";
                        } else if (isChosenByUser && !isCorrect) {
                          optClasses = "bg-rose-100 border-rose-300 text-rose-900";
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optClasses}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-black/5 flex items-center justify-center font-bold">
                                {huruf}
                              </span>
                              <span>{opsi}</span>
                            </span>
                            {isKeyAnswer && (
                              <span className="text-[10px] font-bold text-emerald-800 uppercase">
                                Kunci Jawaban
                              </span>
                            )}
                            {isChosenByUser && !isKeyAnswer && (
                              <span className="text-[10px] font-bold text-rose-700 uppercase">
                                Pilihan Anda
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {soal.pembahasan && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-blue-600 block mb-1">
                          Pembahasan Soal:
                        </span>
                        <span>{soal.pembahasan}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setReviewQuizModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Selesai Membaca Pembahasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Rekap Nilai Ujian Siswa (Guru/Admin) */}
      {viewAttemptsQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-600 font-bold">
                  {viewAttemptsQuiz.mapel} • {viewAttemptsQuiz.kelas}
                </span>
                <h3 className="text-lg font-bold text-slate-800">
                  Rekap Hasil CBT: {viewAttemptsQuiz.judul}
                </h3>
              </div>
              <button
                onClick={() => setViewAttemptsQuiz(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const attempts = lmsKuisAttemptList.filter((a) => a.kuisId === viewAttemptsQuiz.id);
                if (attempts.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400">
                      <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-600">Belum ada siswa yang menyelesaikan kuis ini</p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-slate-100">
                    {attempts.map((att) => (
                      <div key={att.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{att.siswaNama}</p>
                          <p className="text-xs text-slate-400">
                            NISN: {att.siswaNisn} • Kelas: {att.kelas} • Selesai: {att.selesaiPada}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-blue-600">{att.skor} / 100</p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              att.statusLulus
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {att.statusLulus ? "LULUS KKM" : "REMEDIAL"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal Tambah Paket Bank Soal Baru (dengan Generator Soal Otomatis) */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Buat Paket Bank Soal Baru</h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi topik materi, lalu gunakan generator otomatis untuk membuat butir soal secara instan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddBankModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveNewBankPackage} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Bagian 1: Data Identitas Paket Bank Soal */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>1. Informasi Pokok Paket Bank Soal</span>
                  </h4>

                  {bankPackageForm.topik && (
                    <button
                      type="button"
                      onClick={() => {
                        setBankPackageForm({
                          ...bankPackageForm,
                          judul: `Bank Soal ${bankPackageForm.mapel}: ${bankPackageForm.topik}`,
                        });
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Beri Judul Otomatis</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Paket Bank Soal *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankPackageForm.judul}
                    onChange={(e) => setBankPackageForm({ ...bankPackageForm, judul: e.target.value })}
                    placeholder="Contoh: Bank Soal Fisika: Hukum Termodinamika & Kalor"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mata Pelajaran *
                    </label>
                    <select
                      value={bankPackageForm.mapel}
                      onChange={(e) => setBankPackageForm({ ...bankPackageForm, mapel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.nama}>
                          {m.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenjang / Tingkat Kelas *
                    </label>
                    <select
                      value={bankPackageForm.tingkatKelas}
                      onChange={(e) => setBankPackageForm({ ...bankPackageForm, tingkatKelas: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Semua">Semua Tingkat (Umum)</option>
                      <option value="6">Kelas 6 (SDI)</option>
                      <option value="X">Kelas X</option>
                      <option value="XI">Kelas XI</option>
                      <option value="XII">Kelas XII</option>
                    </select>
                  </div>
                </div>

                {/* Topik Materi Pelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Topik / Materi yang Dipelajari *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankPackageForm.topik}
                    onChange={(e) => setBankPackageForm({ ...bankPackageForm, topik: e.target.value })}
                    placeholder="Ketik materi (misal: Hukum Termodinamika, Enzim, dll)..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />

                  {/* Rekomendasi Topik Kurikulum Chips */}
                  {REKOMENDASI_TOPIK_MAPEL[bankPackageForm.mapel] && (
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Rekomendasi Topik Kurikulum (Klik untuk Pilih Cepat):</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/70">
                        {REKOMENDASI_TOPIK_MAPEL[bankPackageForm.mapel].map((recTopik, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => {
                              setBankPackageForm({
                                ...bankPackageForm,
                                topik: recTopik,
                                judul: bankPackageForm.judul
                                  ? bankPackageForm.judul
                                  : `Bank Soal ${bankPackageForm.mapel}: ${recTopik}`,
                              });
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left ${
                              bankPackageForm.topik === recTopik
                                ? "bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                            }`}
                          >
                            {recTopik}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi / Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={bankPackageForm.deskripsi}
                    onChange={(e) => setBankPackageForm({ ...bankPackageForm, deskripsi: e.target.value })}
                    placeholder="Tambahkan keterangan atau lingkup kompetensi dasar..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bagian 2: Generator Soal Otomatis Sesuai Topik */}
              <div className="bg-gradient-to-br from-indigo-50 via-blue-50/60 to-purple-50 p-5 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-indigo-950">
                        ✨ Generator Soal Otomatis Sesuai Topik
                      </h4>
                      <p className="text-[11px] text-indigo-700">
                        Menghasilkan butir soal berkualitas (pilihan A - E, kunci jawaban, dan pembahasan ilmiah).
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-200/70 text-indigo-800 self-start sm:self-auto uppercase tracking-wide">
                    Kurikulum Terpadu
                  </span>
                </div>

                {/* Generator Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Jumlah Butir Soal yang Di-generate:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 10].map((count) => (
                        <button
                          type="button"
                          key={count}
                          onClick={() => setGeneratorJumlah(count)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                            generatorJumlah === count
                              ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {count} Butir Soal
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tingkat Kesulitan:
                    </label>
                    <select
                      value={generatorKesulitan}
                      onChange={(e) =>
                        setGeneratorKesulitan(e.target.value as "Campuran" | "Mudah" | "Sedang" | "Sukar")
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Campuran">Campuran (Mudah, Sedang, Sukar)</option>
                      <option value="Mudah">Dominan Mudah</option>
                      <option value="Sedang">Dominan Sedang</option>
                      <option value="Sukar">Dominan Sukar (HOTS)</option>
                    </select>
                  </div>
                </div>

                {/* Generate Button / Progress */}
                <div className="pt-2">
                  {isGenerating ? (
                    <div className="p-4 bg-white rounded-xl border border-indigo-200 flex items-center gap-3 animate-pulse">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                      <div className="text-xs">
                        <p className="font-bold text-indigo-900">Sedang Men-generate Soal Otomatis...</p>
                        <p className="text-slate-500 text-[11px]">{generatorStepText}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateQuestions()}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition shadow-md shadow-indigo-500/25"
                    >
                      <Wand2 className="w-4 h-4 text-amber-300" />
                      <span>✨ Generate Soal Otomatis Sesuai Topik "{bankPackageForm.topik || "..."}"</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bagian 3: Preview Butir Soal Hasil Generate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>2. Daftar Butir Soal dalam Paket ({generatedSoalList.length} Soal)</span>
                  </h4>

                  {generatedSoalList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setGeneratedSoalList([])}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Kosongkan Daftar Soal
                    </button>
                  )}
                </div>

                {generatedSoalList.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
                    <Database className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">Belum Ada Soal yang Di-generate</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol "✨ Generate Soal Otomatis" di atas untuk membuat soal secara instan sesuai topik materi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {generatedSoalList.map((soal, idx) => (
                      <div
                        key={soal.id}
                        className="p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 text-xs transition space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                              #{idx + 1}
                            </span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full border ${
                                soal.tingkatKesulitan === "Mudah"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : soal.tingkatKesulitan === "Sedang"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {soal.tingkatKesulitan}
                            </span>
                            <span className="text-slate-500">{soal.poinDefault} Poin</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedSoalList(generatedSoalList.filter((s) => s.id !== soal.id));
                              showToast("Soal dihapus dari daftar generate.");
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus butir soal ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="font-semibold text-slate-800 leading-snug">{soal.pertanyaan}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {soal.pilihan.map((opsi, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${
                                oIdx === soal.kunciJawaban
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                  : "bg-white border-slate-200 text-slate-600"
                              }`}
                            >
                              <span className="w-4 h-4 rounded bg-black/5 flex items-center justify-center shrink-0 font-mono text-[10px]">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate">{opsi}</span>
                              {oIdx === soal.kunciJawaban && (
                                <span className="text-[9px] text-emerald-700 ml-auto font-bold">KUNCI ✓</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {soal.pembahasan && (
                          <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                            <strong className="text-slate-700">Pembahasan: </strong>
                            {soal.pembahasan}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Paket Bank Soal ({generatedSoalList.length} Soal)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal Edit Informasi Paket Bank Soal */}
      {isEditBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Paket Bank Soal</h3>
                <p className="text-xs text-slate-500">Perbarui judul, topik, atau deskripsi bank soal.</p>
              </div>
              <button
                onClick={() => setIsEditBankModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBankPackage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Paket Bank Soal *
                </label>
                <input
                  type="text"
                  required
                  value={bankPackageForm.judul}
                  onChange={(e) => setBankPackageForm({ ...bankPackageForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={bankPackageForm.mapel}
                    onChange={(e) => setBankPackageForm({ ...bankPackageForm, mapel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Kelas *
                  </label>
                  <select
                    value={bankPackageForm.tingkatKelas}
                    onChange={(e) => setBankPackageForm({ ...bankPackageForm, tingkatKelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Semua">Semua Tingkat</option>
                    <option value="6">Kelas 6 (SDI)</option>
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topik / Materi Pembelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={bankPackageForm.topik}
                  onChange={(e) => setBankPackageForm({ ...bankPackageForm, topik: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={3}
                  value={bankPackageForm.deskripsi}
                  onChange={(e) => setBankPackageForm({ ...bankPackageForm, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Modal Tambah / Edit Butir Soal Manual (dalam paket aktif) */}
      {isAddSoalItemModalOpen && currentActivePackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingSoalItem ? "Edit Butir Soal" : "Tambah Butir Soal Manual"}
                </h3>
                <p className="text-xs text-slate-500">
                  Paket: <span className="font-semibold text-indigo-600">{currentActivePackage.judul}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddSoalItemModalOpen(false);
                  setEditingSoalItem(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionItem} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Kesulitan *
                  </label>
                  <select
                    value={soalItemForm.tingkatKesulitan}
                    onChange={(e) =>
                      setSoalItemForm({
                        ...soalItemForm,
                        tingkatKesulitan: e.target.value as TingkatKesulitanSoal,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sukar">Sukar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Poin Soal
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={soalItemForm.poinDefault}
                    onChange={(e) =>
                      setSoalItemForm({ ...soalItemForm, poinDefault: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teks Pertanyaan / Soal *
                </label>
                <textarea
                  rows={3}
                  required
                  value={soalItemForm.pertanyaan}
                  onChange={(e) => setSoalItemForm({ ...soalItemForm, pertanyaan: e.target.value })}
                  placeholder="Tuliskan rumusan soal secara jelas..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              {/* Pilihan A - E */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Opsi Pilihan Jawaban (A - E) & Kunci Jawaban *
                </label>
                {soalItemForm.pilihan.map((opsi, idx) => {
                  const huruf = String.fromCharCode(65 + idx);
                  const isKey = soalItemForm.kunciJawaban === idx;

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSoalItemForm({ ...soalItemForm, kunciJawaban: idx })}
                        className={`w-8 h-8 rounded-lg font-bold text-xs shrink-0 transition flex items-center justify-center border ${
                          isKey
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Klik untuk jadikan kunci jawaban"
                      >
                        {huruf}
                      </button>
                      <input
                        type="text"
                        required
                        value={opsi}
                        onChange={(e) => {
                          const newPilihan = [...soalItemForm.pilihan];
                          newPilihan[idx] = e.target.value;
                          setSoalItemForm({ ...soalItemForm, pilihan: newPilihan });
                        }}
                        placeholder={`Teks pilihan ${huruf}`}
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          isKey ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200"
                        }`}
                      />
                      {isKey && (
                        <span className="text-[10px] font-bold text-emerald-700 px-2 py-1 rounded bg-emerald-100 shrink-0">
                          Kunci ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pembahasan & Solusi Langkah Pengerjaan *
                </label>
                <textarea
                  rows={3}
                  required
                  value={soalItemForm.pembahasan}
                  onChange={(e) => setSoalItemForm({ ...soalItemForm, pembahasan: e.target.value })}
                  placeholder="Jelaskan dasar teori, rumus, dan langkah penyelesaian..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSoalItemModalOpen(false);
                    setEditingSoalItem(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  {editingSoalItem ? "Simpan Perubahan Soal" : "Simpan ke Paket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Modal Generate Ujian CBT dari Bank Soal */}
      {isGenerateKuisModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Generator Paket Ujian CBT</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Terbitkan CBT ({cbtSourceItems.length} Soal Terpilih)
                </h3>
              </div>
              <button
                onClick={() => setIsGenerateKuisModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!canManageContent) {
                  showToast("Hanya Administrator yang memiliki akses untuk menerbitkan ujian CBT.");
                  setIsGenerateKuisModalOpen(false);
                  return;
                }
                generateKuisFromBankSoal({
                  judul: generateKuisForm.judul,
                  mapel: generateKuisForm.mapel,
                  kelas: generateKuisForm.kelas,
                  durasiMenit: Number(generateKuisForm.durasiMenit) || 30,
                  kkm: Number(generateKuisForm.kkm) || 75,
                  deadline: generateKuisForm.deadline,
                  deskripsi: generateKuisForm.deskripsi,
                  soalItems: cbtSourceItems,
                  guruNama: user?.name || "Guru Pengampu",
                });
                showToast(`Sukses! Paket CBT "${generateKuisForm.judul}" berhasil dibuat dari Bank Soal.`);
                setIsGenerateKuisModalOpen(false);
                setSelectedSoalIds([]);
                setActiveTab("kuis");
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Ujian CBT *
                </label>
                <input
                  type="text"
                  required
                  value={generateKuisForm.judul}
                  onChange={(e) =>
                    setGenerateKuisForm({ ...generateKuisForm, judul: e.target.value })
                  }
                  placeholder="Contoh: Penilaian Harian Nilai Mutlak"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={generateKuisForm.mapel}
                    onChange={(e) =>
                      setGenerateKuisForm({ ...generateKuisForm, mapel: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Kelas *
                  </label>
                  <select
                    value={generateKuisForm.kelas}
                    onChange={(e) =>
                      setGenerateKuisForm({ ...generateKuisForm, kelas: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {(isGuru && teacherScope.accessibleClasses.length > 0
                      ? teacherScope.accessibleClasses
                      : kelasList.map((k) => k.nama)
                    ).map((namaKelas) => (
                      <option key={namaKelas} value={namaKelas}>
                        {namaKelas} {isGuru ? "(Kelas Binaan Anda)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Pengerjaan (Menit) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    required
                    value={generateKuisForm.durasiMenit}
                    onChange={(e) =>
                      setGenerateKuisForm({
                        ...generateKuisForm,
                        durasiMenit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standar Kelulusan KKM *
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    required
                    value={generateKuisForm.kkm}
                    onChange={(e) =>
                      setGenerateKuisForm({ ...generateKuisForm, kkm: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Akhir Pengerjaan (Deadline) *
                </label>
                <input
                  type="date"
                  required
                  value={generateKuisForm.deadline}
                  onChange={(e) =>
                    setGenerateKuisForm({ ...generateKuisForm, deadline: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petunjuk & Keterangan Ujian *
                </label>
                <textarea
                  rows={3}
                  required
                  value={generateKuisForm.deskripsi}
                  onChange={(e) =>
                    setGenerateKuisForm({ ...generateKuisForm, deskripsi: e.target.value })
                  }
                  placeholder="Instruksi pengerjaan untuk siswa..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateKuisModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                >
                  Terbitkan Ujian Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. Modal Catat Jurnal Mengajar & Realisasi (Guru & Admin) */}
      {catatJurnalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Jurnal Mengajar & Realisasi Materi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pekan {catatJurnalModal.mingguKe} • {catatJurnalModal.mapel} ({catatJurnalModal.kelas})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCatatJurnalModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bab & Sub-Bab Brief Info */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{catatJurnalModal.bab}</span>
              </p>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Rincian Sub-Bab:
                </p>
                <ul className="text-xs text-emerald-900 space-y-1 pl-1">
                  {catatJurnalModal.subBab.map((sb, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{sb}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                <span>Alokasi: <strong>{catatJurnalModal.alokasiJP} JP</strong> ({catatJurnalModal.alokasiJP * 35} Menit)</span>
                <span>Semester {catatJurnalModal.semester}</span>
              </div>
            </div>

            <form onSubmit={handleSaveJurnal} className="space-y-4">
              {/* Checkbox Status */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition">
                <input
                  type="checkbox"
                  id="chkSudahDiajarkan"
                  checked={jurnalForm.sudahDiajarkan}
                  onChange={(e) =>
                    setJurnalForm({ ...jurnalForm, sudahDiajarkan: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="chkSudahDiajarkan" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                  Tandai centang: materi ini <span className="text-emerald-700 font-extrabold underline">Sudah Diajarkan</span> di kelas
                </label>
              </div>

              {jurnalForm.sudahDiajarkan && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal Pelaksanaan *
                      </label>
                      <input
                        type="date"
                        required
                        value={jurnalForm.tanggalRealisasi}
                        onChange={(e) =>
                          setJurnalForm({ ...jurnalForm, tanggalRealisasi: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jam Pelaksanaan *
                      </label>
                      <input
                        type="text"
                        required
                        value={jurnalForm.jamRealisasi}
                        onChange={(e) =>
                          setJurnalForm({ ...jurnalForm, jamRealisasi: e.target.value })
                        }
                        placeholder="Contoh: 08.00 - 09.30 WIB"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Guru Pengajar *
                    </label>
                    <input
                      type="text"
                      required
                      value={jurnalForm.guruPengajar}
                      onChange={(e) =>
                        setJurnalForm({ ...jurnalForm, guruPengajar: e.target.value })
                      }
                      placeholder="Nama guru pengampu..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Jurnal Pembelajaran & Refleksi Kelas
                    </label>
                    <textarea
                      rows={3}
                      value={jurnalForm.catatanPembelajaran}
                      onChange={(e) =>
                        setJurnalForm({ ...jurnalForm, catatanPembelajaran: e.target.value })
                      }
                      placeholder="Tuliskan ketercapaian materi, kendala santri, atau poin evaluasi pembelajaran..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCatatJurnalModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Simpan Realisasi Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. Modal Laporan Pembelajaran Mingguan (Printable & Export Ready) */}
      {isWeeklyReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Pratinjau Laporan Pembelajaran Mingguan
                </h3>
              </div>

              {/* Filter Controls for the Report */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-600">Pekan:</span>
                <select
                  value={reportMingguKe}
                  onChange={(e) => setReportMingguKe(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value={1}>Pekan 1 (01 - 06 Sep)</option>
                  <option value={2}>Pekan 2 (08 - 13 Sep)</option>
                  <option value={3}>Pekan 3 (15 - 20 Sep)</option>
                  <option value={4}>Pekan 4 (22 - 27 Sep)</option>
                </select>

                <span className="font-bold text-slate-600 ml-2">Kelas:</span>
                <select
                  value={reportKelas}
                  onChange={(e) => setReportKelas(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Semua">Semua Kelas</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.nama}>
                      {k.nama}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ml-2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWeeklyReportOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:m-0 bg-white" id="weekly-report-area">
              {/* Kop Surat Sekolah */}
              <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-xl shadow">
                    SDI
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black tracking-wide text-slate-900 uppercase">
                      SD ISLAM TERPADU AL-QALAM
                    </h1>
                    <p className="text-xs text-slate-600">
                      Sistem Informasi Manajemen Pembelajaran & Kurikulum Berbasis Silabus
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Jl. Pesantren No. 45, Kompleks Pendidikan Islam Terpadu • Telp: (021) 7890-1234
                    </p>
                  </div>
                </div>
              </div>

              {/* Judul Laporan & Metadata */}
              <div className="text-center space-y-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 underline uppercase tracking-wider">
                  LAPORAN REALISASI PEMBELAJARAN MINGGUAN
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  PEKAN KE-{reportMingguKe} • BULAN SEPTEMBER 2025
                </p>
                <div className="flex justify-center gap-6 text-xs text-slate-600 pt-1">
                  <span>Semester: <strong>Ganjil</strong></span>
                  <span>•</span>
                  <span>Tahun Ajaran: <strong>2025/2026</strong></span>
                  <span>•</span>
                  <span>Kelas: <strong>{reportKelas}</strong></span>
                </div>
              </div>

              {/* Progress Summary Cards in Report */}
              {(() => {
                const reportItems = (lmsJadwalMateriList || []).filter(
                  (j) =>
                    j.mingguKe === reportMingguKe &&
                    (reportKelas === "Semua" || j.kelas.toLowerCase() === reportKelas.toLowerCase())
                );
                const totalMateri = reportItems.length;
                const sudahCount = reportItems.filter((j) => j.sudahDiajarkan).length;
                const belumCount = totalMateri - sudahCount;
                const persen = totalMateri > 0 ? Math.round((sudahCount / totalMateri) * 100) : 0;
                const totalJP = reportItems.reduce((acc, curr) => acc + curr.alokasiJP, 0);

                return (
                  <>
                    <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Total Bab/Materi</p>
                        <p className="text-lg font-black text-slate-800">{totalMateri}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-700 uppercase font-bold">Sudah Diajarkan</p>
                        <p className="text-lg font-black text-emerald-600">{sudahCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-700 uppercase font-bold">Belum Diajarkan</p>
                        <p className="text-lg font-black text-amber-600">{belumCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-indigo-700 uppercase font-bold">Ketercapaian</p>
                        <p className="text-lg font-black text-indigo-600">{persen}% ({totalJP} JP)</p>
                      </div>
                    </div>

                    {/* Table of Bab and Sub-Bab Realization */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                            <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">No</th>
                            <th className="py-2.5 px-3 w-32 border-r border-slate-200">Mapel & Kelas</th>
                            <th className="py-2.5 px-3 border-r border-slate-200">Bab & Rincian Sub-Bab</th>
                            <th className="py-2.5 px-3 w-14 text-center border-r border-slate-200">JP</th>
                            <th className="py-2.5 px-3 w-28 text-center border-r border-slate-200">Status</th>
                            <th className="py-2.5 px-3 w-48">Waktu, Guru & Catatan Jurnal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {reportItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                                Tidak ada data agenda pembelajaran untuk pekan dan kelas yang dipilih.
                              </td>
                            </tr>
                          ) : (
                            reportItems.map((item, idx) => (
                              <tr key={item.id} className="text-[11px]">
                                <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200 align-top">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-semibold border-r border-slate-200 align-top">
                                  <p className="text-slate-900 font-bold">{item.mapel}</p>
                                  <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.kelas}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-200 align-top space-y-1">
                                  <p className="font-bold text-slate-900">{item.bab}</p>
                                  <div className="pl-3 border-l-2 border-emerald-500 space-y-0.5 text-slate-700">
                                    {item.subBab.map((sb, sIdx) => (
                                      <p key={sIdx}>
                                        <strong className="text-emerald-800">{sIdx + 1}.</strong> {sb}
                                      </p>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200 align-top">
                                  {item.alokasiJP}
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-slate-200 align-top">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      item.sudahDiajarkan
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {item.sudahDiajarkan ? "Sudah Diajarkan" : "Belum Diajarkan"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 align-top space-y-1">
                                  {item.sudahDiajarkan ? (
                                    <>
                                      <p className="font-bold text-slate-800">
                                        {item.tanggalRealisasi} • {item.jamRealisasi}
                                      </p>
                                      <p className="text-slate-600">Guru: {item.guruPengajar || "-"}</p>
                                      {item.catatanPembelajaran && (
                                        <p className="italic text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 text-[10px]">
                                          &ldquo;{item.catatanPembelajaran}&rdquo;
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-slate-400 italic">Menunggu realisasi</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}

              {/* Tanda Tangan Pengesahan */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-bold text-slate-800">Kepala SD Islam Terpadu Al-Qalam</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900 underline">Dr. H. Ahmad Dahlan, M.Pd.</p>
                  <p className="text-slate-500 text-[11px]">NIP: 19780512 200312 1 002</p>
                </div>
                <div>
                  <p className="text-slate-500">
                    Jakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="font-bold text-slate-800">Guru Mata Pelajaran / Wali Kelas</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-900 underline">
                    {user?.name || "Ustadzah Fatimah, S.Pd."}
                  </p>
                  <p className="text-slate-500 text-[11px]">NIP: 19890415 201503 2 001</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsWeeklyReportOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Ekspor PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. Modal Tambah / Edit Agenda Silabus (Admin Only) */}
      {isAddJadwalOpen && canManageContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    {editingJadwal ? "Edit Agenda Silabus Materi" : "Tambah Agenda Silabus Materi"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Susun materi pembelajaran terstruktur per pekan untuk panduan mengajar guru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddJadwalOpen(false);
                  setEditingJadwal(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pekan Ke- *
                  </label>
                  <select
                    value={jadwalForm.mingguKe}
                    onChange={(e) =>
                      setJadwalForm({ ...jadwalForm, mingguKe: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={1}>Pekan 1</option>
                    <option value={2}>Pekan 2</option>
                    <option value={3}>Pekan 3</option>
                    <option value={4}>Pekan 4</option>
                    <option value={5}>Pekan 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rentang Tanggal *
                  </label>
                  <input
                    type="text"
                    required
                    value={jadwalForm.rentangTanggal}
                    onChange={(e) =>
                      setJadwalForm({ ...jadwalForm, rentangTanggal: e.target.value })
                    }
                    placeholder="Contoh: 15 - 20 September 2025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={jadwalForm.mapel}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, mapel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas Sasaran *
                  </label>
                  <select
                    value={jadwalForm.kelas}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bab Pokok Pembelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={jadwalForm.bab}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, bab: e.target.value })}
                  placeholder="Contoh: Bab 3: Bangun Ruang & Volume Kubus/Balok"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rincian Sub-Bab (Satu baris per sub-bab) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={jadwalForm.subBabText}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, subBabText: e.target.value })}
                  placeholder={"Contoh:\n3.1 Sifat-sifat kubus dan balok\n3.2 Jaring-jaring kubus dan balok\n3.3 Menghitung volume kubus"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan tombol Enter untuk memisahkan setiap sub-bab pembelajaran.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alokasi Jam Pelajaran (JP) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={jadwalForm.alokasiJP}
                    onChange={(e) =>
                      setJadwalForm({ ...jadwalForm, alokasiJP: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target / Indikator Kompetensi
                  </label>
                  <input
                    type="text"
                    value={jadwalForm.indikatorKompetensi}
                    onChange={(e) =>
                      setJadwalForm({ ...jadwalForm, indikatorKompetensi: e.target.value })
                    }
                    placeholder="Contoh: Siswa mampu menghitung volume kubus"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddJadwalOpen(false);
                    setEditingJadwal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingJadwal ? "Simpan Perubahan Silabus" : "Tambahkan Silabus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
