"use client";

import React, { useState, useEffect, useRef } from "react";
import { Siswa, SchoolProfile } from "@/types/school";
import { Printer, Download, Eye, Layers, Filter, Check, X, QrCode, Barcode, Sparkles } from "lucide-react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

interface KartuPelajarGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  kelasList: { id: string; nama: string }[];
  schoolProfile?: SchoolProfile;
}

export default function KartuPelajarGeneratorModal({
  isOpen,
  onClose,
  siswaList,
  kelasList,
  schoolProfile,
}: KartuPelajarGeneratorModalProps) {
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"a4" | "single">("a4");
  const [activeSingleIndex, setActiveSingleIndex] = useState(0);

  // Filter students based on selected class
  const filteredStudents = React.useMemo(() => {
    if (selectedKelas === "Semua") return siswaList;
    return siswaList.filter(
      (s) => s.kelas?.trim().toLowerCase() === selectedKelas.trim().toLowerCase()
    );
  }, [siswaList, selectedKelas]);

  // Default select all in filtered list
  useEffect(() => {
    if (isOpen) {
      setSelectedSiswaIds(filteredStudents.map((s) => s.id));
    }
  }, [isOpen, selectedKelas, filteredStudents]);

  // Selected students to print
  const printStudents = React.useMemo(() => {
    return filteredStudents.filter((s) => selectedSiswaIds.includes(s.id));
  }, [filteredStudents, selectedSiswaIds]);

  // Generate QR codes for students
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generateAllQrs = async () => {
      const urls: Record<string, string> = {};
      for (const s of filteredStudents) {
        try {
          // Encode NISN (or student ID if NISN is missing)
          const dataToEncode = s.nisn || s.id;
          const url = await QRCode.toDataURL(dataToEncode, {
            margin: 1,
            width: 160,
            color: { dark: "#0f172a", light: "#ffffff" },
          });
          urls[s.id] = url;
        } catch {
          // Ignore generation errors
        }
      }
      if (isMounted) {
        setQrCodeUrls(urls);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, filteredStudents]);

  // Render Barcode via JsBarcode inside SVG elements
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to allow SVG elements to mount in DOM
    const timer = setTimeout(() => {
      printStudents.forEach((s) => {
        const svgElement = document.getElementById(`barcode-svg-${s.id}`);
        if (svgElement) {
          try {
            JsBarcode(svgElement, s.nisn || s.id, {
              format: "CODE128",
              width: 1.4,
              height: 38,
              displayValue: true,
              fontSize: 10,
              margin: 4,
              lineColor: "#0f172a",
            });
          } catch {
            // fallback
          }
        }
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, printStudents, viewMode, activeSingleIndex]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedSiswaIds.length === filteredStudents.length) {
      setSelectedSiswaIds([]);
    } else {
      setSelectedSiswaIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedSiswaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const schoolName = schoolProfile?.namaSekolah || "SMA Plus Nusantara & SDI Smart School";
  const schoolAddress =
    schoolProfile?.alamat || "Jl. Pendidikan Cendekia No. 45, Kebayoran Baru, Jakarta Selatan";
  const schoolYear = schoolProfile?.tahunAjaranAktif || "2025/2026";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4">
      {/* Styles for print output */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-card-area,
          #printable-card-area * {
            visibility: visible;
          }
          #printable-card-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl h-[95vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header (No print) */}
        <div className="no-print px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Barcode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cetak Kartu Absensi Siswa (Barcode & QR)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {printStudents.length} Siswa Dipilih
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Kartu pelajar resmi terintegrasi Code128 Barcode & QR Code untuk absensi kamera HP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={printStudents.length === 0}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Kartu Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter (No print) */}
        <div className="no-print px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Filter Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-white"
              >
                <option value="Semua">Semua Kelas ({siswaList.length})</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              {selectedSiswaIds.length === filteredStudents.length
                ? "Batal Pilih Semua"
                : `Pilih Semua (${filteredStudents.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("a4")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === "a4"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Grid Lembar A4 (8 Kartu)
            </button>
            <button
              onClick={() => setViewMode("single")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === "single"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Preview Satuan
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          {printStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Barcode className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-bold text-slate-600 dark:text-slate-400">Tidak ada siswa yang dipilih</p>
              <p className="text-xs text-slate-400 mt-1">Pilih setidaknya 1 siswa untuk mencetak kartu.</p>
            </div>
          ) : viewMode === "single" ? (
            /* Single card preview mode */
            <div className="flex flex-col items-center gap-4 max-w-md w-full">
              <div className="flex items-center justify-between w-full no-print text-xs text-slate-500 font-medium">
                <span>
                  Siswa {activeSingleIndex + 1} dari {printStudents.length}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={activeSingleIndex === 0}
                    onClick={() => setActiveSingleIndex((prev) => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={activeSingleIndex >= printStudents.length - 1}
                    onClick={() =>
                      setActiveSingleIndex((prev) => Math.min(printStudents.length - 1, prev + 1))
                    }
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border disabled:opacity-40"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>

              {printStudents[activeSingleIndex] && (
                <div id="printable-card-area" className="w-full flex justify-center">
                  <SingleCard
                    siswa={printStudents[activeSingleIndex]}
                    schoolName={schoolName}
                    schoolAddress={schoolAddress}
                    schoolYear={schoolYear}
                    qrUrl={qrCodeUrls[printStudents[activeSingleIndex].id]}
                  />
                </div>
              )}
            </div>
          ) : (
            /* A4 Grid Layout */
            <div
              id="printable-card-area"
              className="bg-white text-slate-900 shadow-xl rounded-2xl p-6 max-w-[210mm] w-full min-h-[297mm] mx-auto"
            >
              <div className="no-print text-center pb-4 mb-4 border-b border-dashed border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Layout Cetak Standar Kertas A4 (Siap Potong & Laminasi)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {printStudents.map((siswa) => (
                  <SingleCard
                    key={siswa.id}
                    siswa={siswa}
                    schoolName={schoolName}
                    schoolAddress={schoolAddress}
                    schoolYear={schoolYear}
                    qrUrl={qrCodeUrls[siswa.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SingleCardProps {
  siswa: Siswa;
  schoolName: string;
  schoolAddress: string;
  schoolYear: string;
  qrUrl?: string;
}

function SingleCard({ siswa, schoolName, schoolAddress, schoolYear, qrUrl }: SingleCardProps) {
  return (
    <div className="w-[86mm] h-[54mm] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-3 relative overflow-hidden shadow-lg border border-purple-400/30 flex flex-col justify-between print:border-slate-300 print:shadow-none print:break-inside-avoid">
      {/* Decorative Background Elements */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center gap-2 border-b border-purple-300/20 pb-1.5 relative z-10">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-sm">
          SP
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="font-extrabold text-[10px] tracking-wide text-white truncate uppercase">
            {schoolName}
          </p>
          <p className="text-[7.5px] text-purple-200/80 truncate">
            KARTU IDENTITAS & ABSENSI SISWA • TA {schoolYear}
          </p>
        </div>
      </div>

      {/* Card Body: Student Photo + Info */}
      <div className="flex items-center gap-3 my-auto relative z-10">
        {/* Student Photo */}
        <div className="relative shrink-0">
          <img
            src={siswa.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
            alt={siswa.nama}
            className="w-14 h-16 rounded-xl object-cover ring-2 ring-purple-400/50 shadow-md bg-slate-800"
          />
          <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-[7px] font-bold px-1 py-0.2 rounded-full">
            SISWA
          </div>
        </div>

        {/* Student Details */}
        <div className="flex-1 min-w-0 space-y-0.5 text-[9px]">
          <div>
            <span className="text-[7.5px] text-purple-300 block uppercase font-medium">Nama Lengkap</span>
            <p className="font-bold text-[10.5px] text-white leading-tight truncate">{siswa.nama}</p>
          </div>
          <div className="flex items-center gap-3 pt-0.5">
            <div>
              <span className="text-[7px] text-purple-300 block">NISN</span>
              <p className="font-mono font-bold text-[9px] text-purple-100">{siswa.nisn || "-"}</p>
            </div>
            <div>
              <span className="text-[7px] text-purple-300 block">KELAS</span>
              <p className="font-bold text-[9px] text-purple-100">{siswa.kelas || "-"}</p>
            </div>
          </div>
        </div>

        {/* Quick QR Code */}
        {qrUrl && (
          <div className="shrink-0 p-1 bg-white rounded-lg shadow-sm">
            <img src={qrUrl} alt="QR Code" className="w-11 h-11 object-contain" />
          </div>
        )}
      </div>

      {/* Card Footer: Code128 Barcode */}
      <div className="bg-white rounded-lg px-2 py-0.5 flex flex-col items-center justify-center relative z-10 shadow-sm">
        <svg id={`barcode-svg-${siswa.id}`} className="w-full max-h-7 object-contain" />
      </div>
    </div>
  );
}
