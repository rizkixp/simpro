"use client";

import React, { useState, useRef } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { Siswa } from "@/types/school";
import { getStatusBadgeClass } from "@/lib/utils";
import * as XLSX from "xlsx";
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Edit2,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  FileText,
  UserPlus,
  UploadCloud,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  Shield,
} from "lucide-react";

export default function SiswaManagementPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const { siswaList, addSiswa, importSiswaList, updateSiswa, deleteSiswa, kelasList } = useSchoolData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<"manual" | "import">("manual");

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importNotice, setImportNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  interface ParsedSiswa {
    nisn: string;
    nama: string;
    jenisKelamin: "L" | "P";
    kelas: string;
    jurusan: string;
    tanggalLahir: string;
    tempatLahir: string;
    alamat: string;
    namaWali: string;
    noHpWali: string;
    status: "Aktif" | "Alumni" | "Mutasi";
    isValid: boolean;
    errorMsg?: string;
    isDuplicateNisn?: boolean;
  }

  const [parsedStudents, setParsedStudents] = useState<ParsedSiswa[]>([]);

  // Form State for manual input
  const [formData, setFormData] = useState({
    nisn: "",
    nama: "",
    jenisKelamin: "L" as "L" | "P",
    kelas: "X MIPA 1",
    jurusan: "MIPA",
    tanggalLahir: "2008-01-01",
    tempatLahir: "Jakarta",
    alamat: "",
    namaWali: "",
    noHpWali: "",
    status: "Aktif" as "Aktif" | "Alumni" | "Mutasi",
  });

  const canEdit = user?.role === "admin";

  // If teacher, only students of assignedClass are in scope
  const baseSiswaList = teacherScope.isTeacher
    ? teacherScope.filterByClass(siswaList)
    : siswaList;

  // Filtered Siswa
  const filteredSiswa = baseSiswaList.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.namaWali.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = teacherScope.isTeacher || selectedKelas === "Semua" || s.kelas === selectedKelas;
    return matchSearch && matchKelas;
  });

  const handleOpenAdd = () => {
    if (!canEdit) {
      alert("Akses ditolak: Hanya Administrator yang berwenang menambah data siswa.");
      return;
    }
    setEditingId(null);
    setAddMode("manual");
    const initialKelas = teacherScope.isTeacher && teacherScope.assignedClass
      ? teacherScope.assignedClass
      : kelasList[0]?.nama || "X MIPA 1";

    setFormData({
      nisn: `00781290${Math.floor(40 + Math.random() * 50)}`,
      nama: "",
      jenisKelamin: "L",
      kelas: initialKelas,
      jurusan: initialKelas.includes("IPS") ? "IPS" : "MIPA",
      tanggalLahir: "2008-05-15",
      tempatLahir: "Jakarta",
      alamat: "",
      namaWali: "",
      noHpWali: "0812-",
      status: "Aktif",
    });
    setParsedStudents([]);
    setImportedFile(null);
    setIsFormOpen(true);
  };

  const handleOpenImport = () => {
    if (!canEdit) {
      alert("Akses ditolak: Hanya Administrator yang berwenang mengimpor data siswa.");
      return;
    }
    setEditingId(null);
    setAddMode("import");
    setParsedStudents([]);
    setImportedFile(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (siswa: Siswa) => {
    if (!canEdit) {
      alert("Akses ditolak: Hanya Administrator yang berwenang mengedit data siswa.");
      return;
    }
    setEditingId(siswa.id);
    setAddMode("manual");
    setFormData({
      nisn: siswa.nisn,
      nama: siswa.nama,
      jenisKelamin: siswa.jenisKelamin,
      kelas: siswa.kelas,
      jurusan: siswa.jurusan || "MIPA",
      tanggalLahir: siswa.tanggalLahir,
      tempatLahir: siswa.tempatLahir,
      alamat: siswa.alamat,
      namaWali: siswa.namaWali,
      noHpWali: siswa.noHpWali,
      status: siswa.status,
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Akses ditolak: Hanya Administrator yang berwenang menambah atau mengedit data siswa.");
      return;
    }
    if (!formData.nama || !formData.nisn) return;

    const finalKelas = teacherScope.isTeacher && teacherScope.assignedClass
      ? teacherScope.assignedClass
      : formData.kelas;

    const dataToSave = {
      ...formData,
      kelas: finalKelas,
    };

    if (editingId) {
      updateSiswa(editingId, dataToSave);
      setImportNotice({
        type: "success",
        text: `Data siswa ${dataToSave.nama} berhasil diperbarui!`,
      });
    } else {
      addSiswa({
        ...dataToSave,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dataToSave.nama)}`,
      });
      setImportNotice({
        type: "success",
        text: `Siswa baru ${dataToSave.nama} berhasil ditambahkan ke kelas ${finalKelas}!`,
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, nama: string) => {
    if (!canEdit) {
      alert("Akses ditolak: Hanya Administrator yang berwenang menghapus data siswa.");
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus data siswa ${nama}?`)) {
      deleteSiswa(id);
    }
  };

  const handleExportCSV = () => {
    const headers = ["NISN,Nama Siswa,Jenis Kelamin,Kelas,Tempat Lahir,Tanggal Lahir,Nama Wali,No HP Wali,Status"];
    const rows = filteredSiswa.map(
      (s) =>
        `"${s.nisn}","${s.nama}","${s.jenisKelamin}","${s.kelas}","${s.tempatLahir}","${s.tanggalLahir}","${s.namaWali}","${s.noHpWali}","${s.status}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data-siswa-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Helper Functions for File Import ---
  const formatBirthDate = (val: any): string => {
    if (!val) return "2008-01-01";
    if (typeof val === "number") {
      // Excel serial date to JS Date
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : "2008-01-01";
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.split(/[/.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    return "2008-01-01";
  };

  const normalizeGender = (val: any): "L" | "P" => {
    const s = String(val || "").trim().toUpperCase();
    if (s.startsWith("P") || s === "WANITA" || s === "FEMALE" || s === "F") return "P";
    return "L";
  };

  const normalizeStatus = (val: any): "Aktif" | "Alumni" | "Mutasi" => {
    const s = String(val || "").trim().toLowerCase();
    if (s.includes("alumni") || s.includes("lulus")) return "Alumni";
    if (s.includes("mutasi") || s.includes("pindah")) return "Mutasi";
    return "Aktif";
  };

  const getVal = (row: any, ...aliases: string[]): string => {
    for (const key of Object.keys(row)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanKey.includes(cleanAlias) || cleanAlias.includes(cleanKey)) {
          const val = row[key];
          return val !== undefined && val !== null ? String(val).trim() : "";
        }
      }
    }
    return "";
  };

  // Download Templates
  const handleDownloadExcelTemplate = () => {
    const defaultKelas = teacherScope.isTeacher && teacherScope.assignedClass
      ? teacherScope.assignedClass
      : kelasList[0]?.nama || "X MIPA 1";
    const templateData = [
      {
        "NISN": "0081234501",
        "Nama Siswa": "Budi Santoso",
        "Jenis Kelamin (L/P)": "L",
        "Kelas": defaultKelas,
        "Jurusan": "MIPA",
        "Tempat Lahir": "Jakarta",
        "Tanggal Lahir (YYYY-MM-DD)": "2008-04-15",
        "Nama Orang Tua / Wali": "Haryono Santoso",
        "No HP Wali / WhatsApp": "0812-3456-7890",
        "Alamat": "Jl. Melati No. 12, Jakarta",
        "Status (Aktif/Alumni/Mutasi)": "Aktif",
      },
      {
        "NISN": "0081234502",
        "Nama Siswa": "Anisa Rahmawati",
        "Jenis Kelamin (L/P)": "P",
        "Kelas": kelasList[1]?.nama || defaultKelas,
        "Jurusan": "MIPA",
        "Tempat Lahir": "Bandung",
        "Tanggal Lahir (YYYY-MM-DD)": "2008-07-22",
        "Nama Orang Tua / Wali": "Rahmat Hidayat",
        "No HP Wali / WhatsApp": "0813-8765-4321",
        "Alamat": "Jl. Cempaka No. 8, Bandung",
        "Status (Aktif/Alumni/Mutasi)": "Aktif",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Siswa");
    XLSX.writeFile(workbook, "template_import_siswa.xlsx");
  };

  const handleDownloadCsvTemplate = () => {
    const defaultKelas = kelasList[0]?.nama || "X MIPA 1";
    const csvContent =
      "NISN,Nama Siswa,Jenis Kelamin (L/P),Kelas,Jurusan,Tempat Lahir,Tanggal Lahir (YYYY-MM-DD),Nama Orang Tua / Wali,No HP Wali / WhatsApp,Alamat,Status (Aktif/Alumni/Mutasi)\n" +
      `0081234501,Budi Santoso,L,${defaultKelas},MIPA,Jakarta,2008-04-15,Haryono Santoso,0812-3456-7890,"Jl. Melati No. 12, Jakarta",Aktif\n` +
      `0081234502,Anisa Rahmawati,P,${kelasList[1]?.nama || defaultKelas},MIPA,Bandung,2008-07-22,Rahmat Hidayat,0813-8765-4321,"Jl. Cempaka No. 8, Bandung",Aktif\n`;

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_import_siswa.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process selected file
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setImportedFile(file);
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        alert("File Excel tidak memiliki lembar kerja (worksheet).");
        setIsParsing(false);
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonData.length === 0) {
        alert("File kosong atau format baris data tidak terdeteksi.");
        setIsParsing(false);
        return;
      }

      const existingNisns = new Set(siswaList.map((s) => s.nisn.trim()));
      const seenFileNisns = new Set<string>();

      const parsed: ParsedSiswa[] = jsonData.map((row, index) => {
        const rawNama = getVal(row, "nama", "name", "siswa");
        let rawNisn = getVal(row, "nisn", "nis", "noinduk", "nomorinduk");
        if (!rawNisn) {
          rawNisn = `008${Math.floor(1000000 + Math.random() * 9000000)}`;
        }

        const rawJk = getVal(row, "jeniskelamin", "jk", "gender", "lp", "sex");
        const rawKelas = getVal(row, "kelas", "rombel", "rombongan");
        const rawJurusan = getVal(row, "jurusan", "program", "peminatan");
        const rawTempat = getVal(row, "tempatlahir", "tempat", "kota");
        const rawTgl = getVal(row, "tanggallahir", "tgllahir", "tgl", "birthdate");
        const rawWali = getVal(row, "namawali", "wali", "orangtua", "ayah", "ibu");
        const rawHp = getVal(row, "nohpwali", "nohp", "telepon", "kontak", "wa", "whatsapp", "hp");
        const rawAlamat = getVal(row, "alamat", "domisili", "address");
        const rawStatus = getVal(row, "status", "statuskeaktifan");

        const isDuplicateNisn = existingNisns.has(rawNisn) || seenFileNisns.has(rawNisn);
        seenFileNisns.add(rawNisn);

        const isValid = !!rawNama.trim();
        let errorMsg = "";
        if (!rawNama.trim()) {
          errorMsg = "Nama siswa kosong";
        } else if (isDuplicateNisn) {
          errorMsg = "NISN sudah ada di sistem";
        }

        return {
          nisn: rawNisn,
          nama: rawNama.trim() || `Siswa Baris ${index + 1}`,
          jenisKelamin: normalizeGender(rawJk),
          kelas: rawKelas.trim() || kelasList[0]?.nama || "X MIPA 1",
          jurusan: rawJurusan.trim() || "MIPA",
          tanggalLahir: formatBirthDate(rawTgl),
          tempatLahir: rawTempat.trim() || "Jakarta",
          alamat: rawAlamat.trim() || "-",
          namaWali: rawWali.trim() || "Wali Murid",
          noHpWali: rawHp.trim() || "0812-0000-0000",
          status: normalizeStatus(rawStatus),
          isValid,
          errorMsg,
          isDuplicateNisn,
        };
      });

      setParsedStudents(parsed);
    } catch (err) {
      console.error("Gagal membaca file:", err);
      alert("Terjadi kesalahan saat memproses file. Pastikan file berformat .xlsx, .xls, atau .csv.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (!canEdit) {
      alert("Akses ditolak: Hanya Administrator yang berwenang mengimpor data siswa.");
      return;
    }
    let toImport = parsedStudents.filter((s) => s.isValid);

    if (skipDuplicates) {
      const existingNisns = new Set(siswaList.map((s) => s.nisn.trim()));
      toImport = toImport.filter((s) => !existingNisns.has(s.nisn.trim()));
    }

    if (toImport.length === 0) {
      alert("Tidak ada data siswa baru yang dapat diimpor. Semua baris kosong atau memiliki NISN duplikat.");
      return;
    }

    const studentsToCreate: Omit<Siswa, "id">[] = toImport.map((s) => ({
      nisn: s.nisn,
      nama: s.nama,
      jenisKelamin: s.jenisKelamin,
      kelas: teacherScope.isTeacher && teacherScope.assignedClass ? teacherScope.assignedClass : s.kelas,
      jurusan: s.jurusan,
      tanggalLahir: s.tanggalLahir,
      tempatLahir: s.tempatLahir,
      alamat: s.alamat,
      namaWali: s.namaWali,
      noHpWali: s.noHpWali,
      status: s.status,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.nama)}`,
    }));

    importSiswaList(studentsToCreate);
    setIsFormOpen(false);
    setImportedFile(null);
    setParsedStudents([]);
    setImportNotice({
      type: "success",
      text: `Berhasil mengimpor ${toImport.length} data siswa baru ${teacherScope.isTeacher ? `ke kelas ${teacherScope.assignedClass}` : ""} secara massal!`,
    });
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Preview Counts
  const validCount = parsedStudents.filter((s) => s.isValid && (!skipDuplicates || !s.isDuplicateNisn)).length;
  const duplicateCount = parsedStudents.filter((s) => s.isDuplicateNisn).length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-blue-600" />
            <span>Manajemen Data Siswa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data induk peserta didik, biodata, NISN, status, dan impor data massal dari file.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <>
              <button
                onClick={handleOpenImport}
                className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>Impor File</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Siswa Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Teacher Homeroom Banner */}
      {teacherScope.isTeacher && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Mode Wali Kelas: Kelas {teacherScope.assignedClass}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {teacherScope.teacherName}
                </span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Sesuai kebijakan hak akses wali kelas, Anda dapat melihat data murid kelas <strong>{teacherScope.assignedClass}</strong> ({baseSiswaList.length} siswa terdaftar). Penambahan, perubahan data, dan penghapusan siswa dikelola secara terpusat oleh Administrator.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-700/50 self-start sm:self-center shrink-0">
            Akses Terkunci: {teacherScope.assignedClass}
          </span>
        </div>
      )}

      {/* Notification Banner */}
      {importNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              {importNotice.text}
            </span>
          </div>
          <button
            onClick={() => setImportNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NISN, nama wali..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Kelas Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          {teacherScope.isTeacher ? (
            <div className="px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
              <span>Kelas: {teacherScope.assignedClass}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">(Wali)</span>
            </div>
          ) : (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Semua">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs text-slate-500 ml-auto md:ml-2">
            Total: <strong>{filteredSiswa.length}</strong> siswa
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Foto & Siswa</th>
                <th className="px-4 py-3.5">NISN</th>
                <th className="px-4 py-3.5">Kelas</th>
                <th className="px-4 py-3.5">L/P</th>
                <th className="px-4 py-3.5">Nama Wali Murid</th>
                <th className="px-4 py-3.5">No. Telepon Wali</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
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
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                        {siswa.kelas}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold">
                      {siswa.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="px-4 py-3.5">{siswa.namaWali}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{siswa.noHpWali}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(siswa.status)}`}>
                        {siswa.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedSiswa(siswa)}
                        title="Lihat Detail Profil"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(siswa)}
                            title="Edit Data"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(siswa.id, siswa.nama)}
                            title="Hapus Data"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Siswa */}
      {selectedSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedSiswa(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedSiswa.avatar}
                alt={selectedSiswa.nama}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-md"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedSiswa.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  NISN: <span className="font-mono font-semibold">{selectedSiswa.nisn}</span> • Kelas: {selectedSiswa.kelas}
                </p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(selectedSiswa.status)}`}>
                  Status: {selectedSiswa.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Tempat, Tanggal Lahir:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedSiswa.tempatLahir}, {selectedSiswa.tanggalLahir}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Jenis Kelamin:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedSiswa.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Alamat Tempat Tinggal:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[200px]">
                  {selectedSiswa.alamat || "-"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Nama Orang Tua / Wali:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedSiswa.namaWali}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Kontak Darurat / WhatsApp:</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {selectedSiswa.noHpWali}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSiswa(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit / Impor Siswa */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`w-full ${!editingId && addMode === "import" ? "max-w-3xl" : "max-w-xl"} bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto transition-all`}>
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingId
                ? "Perbarui Data Siswa"
                : addMode === "manual"
                ? "Tambah Data Siswa Baru"
                : "Impor Data Siswa dari File"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {editingId
                ? "Perbarui biodata resmi dan informasi wali siswa."
                : addMode === "manual"
                ? "Input manual satu per satu siswa dengan data lengkap akta kelahiran."
                : "Unggah file spreadsheet (Excel / CSV) untuk menambahkan banyak siswa sekaligus secara instan."}
            </p>

            {/* Mode Switcher (Hanya tampil saat menambah baru) */}
            {!editingId && (
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setAddMode("manual")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    addMode === "manual"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Input Manual (Formulir)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("import")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    addMode === "import"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Impor File (Excel / CSV)</span>
                </button>
              </div>
            )}

            {/* TAB 1: FORMULIR INPUT MANUAL */}
            {(editingId || addMode === "manual") && (
              <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Induk Siswa Nasional (NISN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      placeholder="Contoh: 0078129034"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Siswa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nama siswa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as "L" | "P" })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rombongan Belajar (Kelas)
                    </label>
                    <select
                      value={teacherScope.isTeacher && teacherScope.assignedClass ? teacherScope.assignedClass : formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      disabled={teacherScope.isTeacher}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500"
                    >
                      {teacherScope.isTeacher && teacherScope.assignedClass ? (
                        <option value={teacherScope.assignedClass}>
                          {teacherScope.assignedClass} (Terkunci untuk Wali Kelas)
                        </option>
                      ) : (
                        kelasList.map((k) => (
                          <option key={k.id} value={k.nama}>
                            {k.nama}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status Siswa
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "Aktif" | "Alumni" | "Mutasi" })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Alumni">Alumni</option>
                      <option value="Mutasi">Mutasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      value={formData.namaWali}
                      onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nama ayah/ibu/wali"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor WhatsApp / HP Wali
                    </label>
                    <input
                      type="text"
                      value={formData.noHpWali}
                      onChange={(e) => setFormData({ ...formData, noHpWali: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="0812-xxxx-xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Domisili
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jl., RT/RW, Kelurahan, Kecamatan, Kota"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                  >
                    {editingId ? "Simpan Perubahan" : "Simpan Siswa Baru"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: IMPOR FILE (EXCEL / CSV) */}
            {!editingId && addMode === "import" && (
              <div className="space-y-5 text-xs">
                {/* Download Template Banner */}
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-blue-900 dark:text-blue-200 text-xs flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>Gunakan Template Standar untuk Hasil Terbaik</span>
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                      Unduh template resmi berisi format kolom NISN, Nama, JK, Kelas, Tgl Lahir, dan Wali:
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Template Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Template CSV</span>
                    </button>
                  </div>
                </div>

                {/* Upload & Dropzone Area */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleProcessFile(files[0]);
                    }
                  }}
                  className="hidden"
                />

                {!importedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-4 ring-blue-500/20"
                        : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-3 shadow-inner">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                      Pilih file atau seret file ke sini
                    </p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Mendukung format file <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong>
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Pilih File dari Komputer</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Selected Badge */}
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">
                            {importedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(importedFile.size / 1024).toFixed(1)} KB • {parsedStudents.length} baris terbaca
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImportedFile(null);
                          setParsedStudents([]);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                        title="Hapus file dan unggah ulang"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Summary KPIs */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Baris</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{parsedStudents.length}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Siap Diimpor</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{validCount}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase font-semibold">Duplikat / Catatan</p>
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{duplicateCount}</p>
                      </div>
                    </div>

                    {/* Options */}
                    {duplicateCount > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id="skipDup"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <label htmlFor="skipDup" className="text-xs text-amber-900 dark:text-amber-200 font-medium cursor-pointer">
                          Lewati ({duplicateCount}) data yang memiliki NISN sudah terdaftar di sistem.
                        </label>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Pratinjau Data Siswa ({parsedStudents.length} Data)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Menampilkan baris pertama hasil pembacaan
                        </span>
                      </div>

                      <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                          <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                              <th className="px-3 py-2">No</th>
                              <th className="px-3 py-2">NISN</th>
                              <th className="px-3 py-2">Nama Siswa</th>
                              <th className="px-2 py-2">JK</th>
                              <th className="px-3 py-2">Kelas</th>
                              <th className="px-3 py-2">Nama Wali</th>
                              <th className="px-3 py-2 text-right">Status Data</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {parsedStudents.map((s, idx) => {
                              const isWillSkip = skipDuplicates && s.isDuplicateNisn;
                              return (
                                <tr
                                  key={idx}
                                  className={
                                    isWillSkip
                                      ? "bg-amber-50/40 dark:bg-amber-950/10 text-slate-400"
                                      : !s.isValid
                                      ? "bg-rose-50/50 dark:bg-rose-950/20 text-rose-500"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                  }
                                >
                                  <td className="px-3 py-2 font-mono text-[11px]">{idx + 1}</td>
                                  <td className="px-3 py-2 font-mono font-medium">{s.nisn}</td>
                                  <td className="px-3 py-2 font-semibold text-slate-800 dark:text-white">
                                    {s.nama}
                                  </td>
                                  <td className="px-2 py-2">{s.jenisKelamin}</td>
                                  <td className="px-3 py-2">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                                      {s.kelas}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">{s.namaWali}</td>
                                  <td className="px-3 py-2 text-right">
                                    {!s.isValid ? (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                                        {s.errorMsg}
                                      </span>
                                    ) : s.isDuplicateNisn ? (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                                        {isWillSkip ? "Akan Dilewati" : "Duplikat"}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                                        Siap Impor
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

                    {/* Action Footer for Import */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setImportedFile(null);
                          setParsedStudents([]);
                          setIsFormOpen(false);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteImport}
                        disabled={validCount === 0}
                        className={`px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all flex items-center gap-2 ${
                          validCount > 0
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 cursor-pointer"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        <span>Impor {validCount} Siswa ke Sistem</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

