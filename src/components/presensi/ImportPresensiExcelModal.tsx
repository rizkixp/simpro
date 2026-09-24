"use client";

import React, { useState, useRef, useMemo } from "react";
import { Siswa, StatusKehadiran } from "@/types/school";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Sparkles,
  Calendar,
  Layers,
  Check,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
  RotateCcw,
} from "lucide-react";

interface ImportPresensiExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  kelasList: { id: string; nama: string }[];
  selectedKelas: string;
  selectedDate: string;
  onImportSuccess: (count: number, summaryText: string) => void;
  batchUpdatePresensi: (
    items: Array<{
      siswaId: string;
      status: StatusKehadiran;
      keterangan?: string;
      tanggal?: string;
    }>
  ) => void;
}

interface ParsedPresensiItem {
  idKey: string;
  siswaId: string;
  nisn: string;
  nama: string;
  kelas: string;
  tanggal: string;
  status: StatusKehadiran;
  keterangan: string;
  isValid: boolean;
  errorReason?: string;
}

export default function ImportPresensiExcelModal({
  isOpen,
  onClose,
  siswaList,
  kelasList,
  selectedKelas,
  selectedDate,
  onImportSuccess,
  batchUpdatePresensi,
}: ImportPresensiExcelModalProps) {
  const [modalKelas, setModalKelas] = useState(selectedKelas || "Semua");
  const [targetDate, setTargetDate] = useState(selectedDate);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedPresensiItem[]>([]);
  const [previewFilter, setPreviewFilter] = useState<string>("Semua");
  const [previewSearch, setPreviewSearch] = useState("");
  const [overrideDateWithModal, setOverrideDateWithModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync modal class when opened
  React.useEffect(() => {
    if (isOpen) {
      setModalKelas(selectedKelas || "Semua");
      setTargetDate(selectedDate);
      setImportedFile(null);
      setParsedItems([]);
      setPreviewFilter("Semua");
      setPreviewSearch("");
    }
  }, [isOpen, selectedKelas, selectedDate]);

  // Filter students based on modal class
  const classStudents = useMemo(() => {
    if (modalKelas === "Semua") return siswaList;
    return siswaList.filter(
      (s) => s.kelas?.trim().toLowerCase() === modalKelas.trim().toLowerCase()
    );
  }, [siswaList, modalKelas]);

  // Lookup map for fast student matching (by NISN and by Name)
  const studentLookup = useMemo(() => {
    const nisnMap = new Map<string, Siswa>();
    const nameMap = new Map<string, Siswa>();

    siswaList.forEach((s) => {
      if (s.nisn) {
        nisnMap.set(s.nisn.trim().toLowerCase(), s);
      }
      if (s.nama) {
        nameMap.set(s.nama.trim().toLowerCase(), s);
      }
    });

    return { nisnMap, nameMap };
  }, [siswaList]);

  // Normalizer for Status Kehadiran
  const normalizeStatus = (raw: any): StatusKehadiran => {
    if (!raw) return "Hadir";
    const str = String(raw).trim().toLowerCase();

    if (["h", "hadir", "masuk", "present", "1", "v", "yes", "ya"].includes(str)) {
      return "Hadir";
    }
    if (["s", "sakit", "sick"].includes(str) || str.startsWith("sakit")) {
      return "Sakit";
    }
    if (["i", "izin", "ijin", "permit", "dispensasi"].includes(str) || str.startsWith("izin") || str.startsWith("ijin")) {
      return "Izin";
    }
    if (["a", "alpa", "alpha", "tk", "bolos", "absen", "tanpa keterangan", "0", "x"].includes(str)) {
      return "Alpa";
    }

    return "Hadir";
  };

  // Helper to extract clean value from dynamic keys
  const getColVal = (row: any, ...aliases: string[]): string => {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const alias of aliases) {
        const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanKey === cleanAlias || cleanKey.includes(cleanAlias)) {
          const val = row[key];
          return val !== undefined && val !== null ? String(val).trim() : "";
        }
      }
    }
    return "";
  };

  // Helper to format date into YYYY-MM-DD
  const cleanDateString = (rawDate: any, fallback: string): string => {
    if (!rawDate) return fallback;
    if (typeof rawDate === "number") {
      // Excel serial date format
      const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split("T")[0];
      }
    }

    const str = String(rawDate).trim();
    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, "0");
      const m = dmyMatch[2].padStart(2, "0");
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }

    return fallback;
  };

  // 1. DOWNLOAD TEMPLATE HARIAN (.XLSX)
  const handleDownloadHarianTemplate = () => {
    const listToExport = classStudents.length > 0 ? classStudents : siswaList;
    const cleanClassName = modalKelas === "Semua" ? "Semua_Kelas" : modalKelas.replace(/[^a-zA-Z0-9]/g, "_");

    const rows = listToExport.map((s, idx) => ({
      "No": idx + 1,
      "NISN": s.nisn || "",
      "Nama Siswa": s.nama,
      "Kelas": s.kelas || "",
      "Tanggal": targetDate,
      "Status Kehadiran (H/S/I/A)": "Hadir",
      "Keterangan (Opsional)": "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws["!cols"] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 25 },
      { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presensi Harian");
    XLSX.writeFile(wb, `Template_Presensi_${cleanClassName}_${targetDate}.xlsx`);
  };

  // 2. DOWNLOAD TEMPLATE MINGGUAN (5 HARI KERJA) (.XLSX)
  const handleDownloadMingguanTemplate = () => {
    const listToExport = classStudents.length > 0 ? classStudents : siswaList;
    const cleanClassName = modalKelas === "Semua" ? "Semua_Kelas" : modalKelas.replace(/[^a-zA-Z0-9]/g, "_");

    // Calculate dates for current week Monday to Friday
    const curr = new Date(targetDate);
    const day = curr.getDay();
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diffToMonday));

    const weekDays = [0, 1, 2, 3, 4].map((offset) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        key: `${dayNames[offset]} (${yyyy}-${mm}-${dd})`,
        dateStr: `${yyyy}-${mm}-${dd}`,
      };
    });

    const rows = listToExport.map((s, idx) => {
      const row: any = {
        "No": idx + 1,
        "NISN": s.nisn || "",
        "Nama Siswa": s.nama,
        "Kelas": s.kelas || "",
      };
      weekDays.forEach((wd) => {
        row[wd.key] = "H";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presensi Mingguan");
    XLSX.writeFile(wb, `Template_Presensi_Mingguan_${cleanClassName}.xlsx`);
  };

  // 3. DOWNLOAD TEMPLATE CSV
  const handleDownloadCsvTemplate = () => {
    const listToExport = classStudents.length > 0 ? classStudents : siswaList;
    const cleanClassName = modalKelas === "Semua" ? "Semua_Kelas" : modalKelas.replace(/[^a-zA-Z0-9]/g, "_");

    let csvContent = "No,NISN,Nama Siswa,Kelas,Tanggal,Status Kehadiran,Keterangan\n";
    listToExport.forEach((s, idx) => {
      csvContent += `${idx + 1},"${s.nisn}","${s.nama}","${s.kelas}","${targetDate}","Hadir",""\n`;
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Template_Presensi_${cleanClassName}_${targetDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PARSE IMPORTED FILE
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

      // Check if format is Matrix/Mingguan (contains columns formatted like "Senin (2026-09-22)" or date strings)
      const firstRow = jsonData[0];
      const headerKeys = Object.keys(firstRow);

      const dateColumns: Array<{ key: string; dateStr: string }> = [];
      headerKeys.forEach((key) => {
        // Look for date inside parenthesis like "Senin (2026-09-22)"
        const parenMatch = key.match(/\((\d{4}-\d{2}-\d{2})\)/);
        if (parenMatch) {
          dateColumns.push({ key, dateStr: parenMatch[1] });
          return;
        }
        // Look for direct YYYY-MM-DD in header
        if (/^\d{4}-\d{2}-\d{2}$/.test(key.trim())) {
          dateColumns.push({ key, dateStr: key.trim() });
          return;
        }
        // Look for DD/MM/YYYY in header
        const dmyMatch = key.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (dmyMatch) {
          dateColumns.push({
            key,
            dateStr: `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`,
          });
        }
      });

      const parsed: ParsedPresensiItem[] = [];

      if (dateColumns.length > 0) {
        // FORMAT MULTI-DATE / MINGGUAN
        jsonData.forEach((row, rowIdx) => {
          const rawNisn = getColVal(row, "nisn", "nis", "noinduk");
          const rawNama = getColVal(row, "nama", "namasiswa", "student", "siswa");
          const rawKelas = getColVal(row, "kelas", "rombel");

          // Find student in school database
          let matchedStudent = rawNisn
            ? studentLookup.nisnMap.get(rawNisn.toLowerCase())
            : undefined;

          if (!matchedStudent && rawNama) {
            matchedStudent = studentLookup.nameMap.get(rawNama.toLowerCase());
          }

          dateColumns.forEach((col, colIdx) => {
            const statusVal = row[col.key];
            if (statusVal === undefined || statusVal === null || String(statusVal).trim() === "") {
              return; // Skip empty cells
            }

            const normalizedStatus = normalizeStatus(statusVal);
            const isValid = !!matchedStudent;
            const errorReason = !matchedStudent
              ? "Siswa tidak ditemukan dalam database (cek NISN/Nama)"
              : undefined;

            parsed.push({
              idKey: `item-${rowIdx}-${colIdx}-${Math.random().toString(36).substring(2, 6)}`,
              siswaId: matchedStudent ? matchedStudent.id : "",
              nisn: matchedStudent ? matchedStudent.nisn : rawNisn || "-",
              nama: matchedStudent ? matchedStudent.nama : rawNama || `Baris ${rowIdx + 1}`,
              kelas: matchedStudent ? matchedStudent.kelas || "-" : rawKelas || "-",
              tanggal: overrideDateWithModal ? targetDate : col.dateStr,
              status: normalizedStatus,
              keterangan: "",
              isValid,
              errorReason,
            });
          });
        });
      } else {
        // FORMAT STANDAR HARIAN (KOLOM STATUS + TANGGAL)
        jsonData.forEach((row, idx) => {
          const rawNisn = getColVal(row, "nisn", "nis", "noinduk");
          const rawNama = getColVal(row, "nama", "namasiswa", "student", "siswa");
          const rawKelas = getColVal(row, "kelas", "rombel");
          const rawTanggal = getColVal(row, "tanggal", "tgl", "date");
          const rawStatus = getColVal(row, "status", "kehadiran", "statuskehadiran", "presensi", "absensi");
          const rawKet = getColVal(row, "keterangan", "ket", "alasan", "note", "catatan");

          let matchedStudent = rawNisn
            ? studentLookup.nisnMap.get(rawNisn.toLowerCase())
            : undefined;

          if (!matchedStudent && rawNama) {
            matchedStudent = studentLookup.nameMap.get(rawNama.toLowerCase());
          }

          const resolvedDate = overrideDateWithModal
            ? targetDate
            : cleanDateString(rawTanggal, targetDate);

          const normalizedStatus = normalizeStatus(rawStatus);
          const isValid = !!matchedStudent;
          const errorReason = !matchedStudent
            ? "Siswa tidak ditemukan dalam database (cek NISN/Nama)"
            : undefined;

          parsed.push({
            idKey: `item-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            siswaId: matchedStudent ? matchedStudent.id : "",
            nisn: matchedStudent ? matchedStudent.nisn : rawNisn || "-",
            nama: matchedStudent ? matchedStudent.nama : rawNama || `Baris ${idx + 1}`,
            kelas: matchedStudent ? matchedStudent.kelas || "-" : rawKelas || "-",
            tanggal: resolvedDate,
            status: normalizedStatus,
            keterangan: rawKet,
            isValid,
            errorReason,
          });
        });
      }

      setParsedItems(parsed);
      setIsParsing(false);
    } catch (err: any) {
      console.error("Error parsing presensi file:", err);
      alert("Terjadi kesalahan saat memproses file. Pastikan format file .xlsx, .xls, atau .csv valid.");
      setIsParsing(false);
    }
  };

  // Drag and drop handlers
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

  // Metrics for parsed results
  const validItems = useMemo(() => parsedItems.filter((p) => p.isValid), [parsedItems]);
  const invalidItems = useMemo(() => parsedItems.filter((p) => !p.isValid), [parsedItems]);

  const hadirCount = useMemo(() => validItems.filter((p) => p.status === "Hadir").length, [validItems]);
  const sakitCount = useMemo(() => validItems.filter((p) => p.status === "Sakit").length, [validItems]);
  const izinCount = useMemo(() => validItems.filter((p) => p.status === "Izin").length, [validItems]);
  const alpaCount = useMemo(() => validItems.filter((p) => p.status === "Alpa").length, [validItems]);

  // Filtered displayed items in preview table
  const displayedPreview = useMemo(() => {
    return parsedItems.filter((item) => {
      const q = previewSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        item.nisn.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q);

      let matchFilter = true;
      if (previewFilter === "Valid") matchFilter = item.isValid;
      else if (previewFilter === "Error") matchFilter = !item.isValid;
      else if (previewFilter === "Hadir") matchFilter = item.status === "Hadir" && item.isValid;
      else if (previewFilter === "Sakit") matchFilter = item.status === "Sakit" && item.isValid;
      else if (previewFilter === "Izin") matchFilter = item.status === "Izin" && item.isValid;
      else if (previewFilter === "Alpa") matchFilter = item.status === "Alpa" && item.isValid;

      return matchSearch && matchFilter;
    });
  }, [parsedItems, previewSearch, previewFilter]);

  // Handle Save to Database
  const handleCommitSave = async () => {
    if (validItems.length === 0) {
      alert("Tidak ada data presensi yang valid untuk disimpan.");
      return;
    }

    setIsSaving(true);

    try {
      const itemsToUpdate = validItems.map((item) => ({
        siswaId: item.siswaId,
        status: item.status,
        keterangan: item.keterangan || undefined,
        tanggal: item.tanggal,
      }));

      // Execute batch save to state & Supabase
      batchUpdatePresensi(itemsToUpdate);

      // Fire celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }

      const summaryText = `${validItems.length} data presensi (${hadirCount} Hadir, ${sakitCount} Sakit, ${izinCount} Izin, ${alpaCount} Alpa)`;
      onImportSuccess(validItems.length, summaryText);

      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error("Error saving batch presensi:", err);
      alert("Gagal menyimpan presensi ke database. Silakan coba lagi.");
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Impor Presensi via Excel / CSV</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  Solusi Praktis Cepat
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah file absensi offline untuk menginput presensi seluruh kelas secara otomatis dalam sekejap.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* STEP 1: CONFIGURE & DOWNLOAD TEMPLATE */}
          <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                    1
                  </span>
                  <span>Pilih Rombel & Unduh Template Resmi</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  File template otomatis terisi seluruh nama & NISN siswa di kelas yang Anda pilih di bawah:
                </p>
              </div>

              {/* Class & Date Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <select
                    value={modalKelas}
                    onChange={(e) => setModalKelas(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Semua">Semua Kelas ({siswaList.length} Siswa)</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama} ({siswaList.filter((s) => s.kelas?.trim().toLowerCase() === k.nama.trim().toLowerCase()).length} Siswa)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Template Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={handleDownloadHarianTemplate}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Unduh format presensi 1 hari untuk rombel terpilih"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Format Harian (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMingguanTemplate}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Unduh format presensi 5 hari (Senin - Jumat) dalam 1 tabel"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Format Mingguan Sen-Jum (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Unduh format CSV sederhana"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Format CSV (.csv)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 bg-purple-50/50 dark:bg-purple-950/20 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
              <Info className="h-3.5 w-3.5 text-purple-600 shrink-0" />
              <span>
                <strong>Petunjuk Singkat:</strong> Cukup isi huruf <strong>H</strong> (Hadir), <strong>S</strong> (Sakit), <strong>I</strong> (Izin), atau <strong>A</strong> (Alpa). Pada template standar, seluruh siswa otomatis sudah terisi Hadir sehingga guru cukup mengubah siswa yang absen saja!
              </span>
            </div>
          </div>

          {/* STEP 2: UPLOAD & DROPZONE */}
          <div className="space-y-3">
            <p className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                2
              </span>
              <span>Unggah File Absensi yang Telah Diisi</span>
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
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
                className={`border-2 border-dashed rounded-3xl p-7 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 ring-4 ring-purple-500/20"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-400 hover:bg-purple-50/30"
                }`}
              >
                <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 mb-2 shadow-inner">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">
                  Tarik & lepas file Excel/CSV ke sini, atau klik untuk memilih
                </p>
                <p className="text-slate-500 text-[11px] mt-1">
                  Mendukung format <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> (Format Harian maupun Mingguan)
                </p>
                <button
                  type="button"
                  className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Pilih File Excel dari Komputer / HP</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active File Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold text-xs">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-xs">
                        {importedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(importedFile.size / 1024).toFixed(1)} KB • {parsedItems.length} baris presensi terbaca
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                    >
                      Ganti File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportedFile(null);
                        setParsedItems([]);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                      title="Hapus file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Date Override Option */}
                <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-[11px]">
                        Gunakan Tanggal Pilihan ({targetDate}) untuk Seluruh Baris
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Aktifkan ini jika file Anda tidak memiliki kolom tanggal atau Anda ingin memaksakan tanggal tertentu.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={overrideDateWithModal}
                    onChange={(e) => {
                      setOverrideDateWithModal(e.target.checked);
                      if (importedFile) handleProcessFile(importedFile);
                    }}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div
                    onClick={() => setPreviewFilter("Semua")}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                      previewFilter === "Semua"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <p className="text-[10px] opacity-80 uppercase font-semibold">Total Baris</p>
                    <p className="text-base font-bold">{parsedItems.length}</p>
                  </div>

                  <div
                    onClick={() => setPreviewFilter("Hadir")}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                      previewFilter === "Hadir"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:border-emerald-400"
                    }`}
                  >
                    <p className="text-[10px] opacity-80 uppercase font-semibold">Hadir</p>
                    <p className="text-base font-bold">{hadirCount}</p>
                  </div>

                  <div
                    onClick={() => setPreviewFilter("Sakit")}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                      previewFilter === "Sakit"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:border-amber-400"
                    }`}
                  >
                    <p className="text-[10px] opacity-80 uppercase font-semibold">Sakit</p>
                    <p className="text-base font-bold">{sakitCount}</p>
                  </div>

                  <div
                    onClick={() => setPreviewFilter("Izin")}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                      previewFilter === "Izin"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 hover:border-blue-400"
                    }`}
                  >
                    <p className="text-[10px] opacity-80 uppercase font-semibold">Izin</p>
                    <p className="text-base font-bold">{izinCount}</p>
                  </div>

                  <div
                    onClick={() => setPreviewFilter("Alpa")}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                      previewFilter === "Alpa"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:border-rose-400"
                    }`}
                  >
                    <p className="text-[10px] opacity-80 uppercase font-semibold">Alpa</p>
                    <p className="text-base font-bold">{alpaCount}</p>
                  </div>

                  <div
                    onClick={() => setPreviewFilter("Error")}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                      previewFilter === "Error"
                        ? "bg-rose-700 text-white border-rose-700 shadow-sm"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:border-rose-400"
                    }`}
                  >
                    <p className="text-[10px] opacity-80 uppercase font-semibold">Tidak Cocok</p>
                    <p className="text-base font-bold">{invalidItems.length}</p>
                  </div>
                </div>

                {/* Filter and Search Bar for Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1">Filter:</span>
                    {(["Semua", "Valid", "Error", "Hadir", "Sakit", "Izin", "Alpa"] as const).map((fl) => (
                      <button
                        key={fl}
                        onClick={() => setPreviewFilter(fl)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          previewFilter === fl
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {fl}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari siswa di preview..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="px-3 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-48"
                    />
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-center w-10">No</th>
                          <th className="px-3 py-2">NISN</th>
                          <th className="px-3 py-2">Nama Siswa</th>
                          <th className="px-3 py-2">Kelas</th>
                          <th className="px-3 py-2">Tanggal</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2">Keterangan</th>
                          <th className="px-3 py-2 text-center">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayedPreview.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                              Tidak ada data yang sesuai filter preview.
                            </td>
                          </tr>
                        ) : (
                          displayedPreview.map((item, idx) => (
                            <tr
                              key={item.idKey}
                              className={`transition-colors ${
                                !item.isValid
                                  ? "bg-rose-50/60 dark:bg-rose-950/20"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              }`}
                            >
                              <td className="px-3 py-2 text-center text-slate-400 font-medium">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                                {item.nisn}
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">
                                {item.nama}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {item.kelas}
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px]">
                                {item.tanggal}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    item.status === "Hadir"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : item.status === "Sakit"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : item.status === "Izin"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-500 italic text-[11px]">
                                {item.keterangan || "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {item.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                                    <Check className="h-3 w-3" />
                                    <span>Siap Simpan</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold"
                                    title={item.errorReason}
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Tidak Dikenali</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {invalidItems.length > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-[11px]">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      Ada <strong>{invalidItems.length} baris</strong> yang tidak cocok dengan siswa di database. Baris ini akan otomatis dilewati saat penyimpanan.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {validItems.length > 0 ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {validItems.length} data presensi terverifikasi dan siap diimpor ke sistem.
                </span>
              </span>
            ) : (
              <span>Unduh template & unggah file untuk mulai menyimpan presensi.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={validItems.length === 0 || isSaving}
              onClick={handleCommitSave}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Simpan Presensi ({validItems.length} Siswa)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
