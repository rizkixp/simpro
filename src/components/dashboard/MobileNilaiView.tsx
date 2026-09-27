"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Calculator,
  Compass,
  Shield,
  Globe,
  Download,
  Award,
  ChevronDown,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface MobileNilaiViewProps {
  onBack?: () => void;
}

export default function MobileNilaiView({ onBack }: MobileNilaiViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { siswaList, profile } = useSchoolData();

  // Tab: "sumatif" | "rapor" (Screen 8 of UI Kit)
  const [activeTab, setActiveTab] = useState<"sumatif" | "rapor">("sumatif");
  const [selectedSemester, setSelectedSemester] = useState("Semester Ganjil 2025/2026");

  // Haptic feedback
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  // Student info (defaults to Ahmad Fauzan)
  const currentSiswa = useMemo(() => {
    const childNameFromUser =
      user?.phone ||
      user?.name?.replace(/^(wali murid|wali santri|wali|orang tua|ayah|bunda|ibu|abi|umi)\s+/i, "").trim() ||
      "Ahmad Fauzan";

    return (
      (siswaList || []).find(
        (s) =>
          (user?.nisnOrNip && s?.nisn === user.nisnOrNip) ||
          (user?.phone && s?.nama && s.nama.toLowerCase().includes(user.phone.toLowerCase())) ||
          (s?.nama && s.nama.toLowerCase().includes("ahmad"))
      ) || {
        id: "sis-default",
        nama: user?.role === "ortu" ? childNameFromUser : "Ahmad Fauzan",
        kelas: user?.kelas || "Kelas 3 Al Farabi",
        nisn: user?.nisnOrNip || "20230015",
      }
    );
  }, [siswaList, user]);

  // Subject Grades matching Screen 8
  const subjectGrades = [
    {
      id: "mp-1",
      nama: "Pendidikan Agama Islam",
      guru: "Ustadz Fauzan, S.Pd.I",
      nilai: 92,
      predikat: "Predikat A (Sangat Baik)",
      capaian: "Menghafal Surat Al-Balad dan mempraktikkan tata cara shalat sunnah",
      icon: BookOpen,
      iconBg: "bg-emerald-100 text-[#056839]",
    },
    {
      id: "mp-2",
      nama: "Bahasa Indonesia",
      guru: "Ustadzah Sarah, S.Pd",
      nilai: 88,
      predikat: "Predikat A (Baik Sekali)",
      capaian: "Mampu memahami ide pokok teks narasi dan menyusun kalimat efektif",
      icon: FileText,
      iconBg: "bg-amber-100 text-amber-700",
    },
    {
      id: "mp-3",
      nama: "Matematika",
      guru: "Ustadz Ridwan, M.Pd",
      nilai: 90,
      predikat: "Predikat A (Sangat Baik)",
      capaian: "Menguasai operasi hitung pecahan senilai dan perkalian bilangan cacah",
      icon: Calculator,
      iconBg: "bg-purple-100 text-purple-700",
    },
    {
      id: "mp-4",
      nama: "IPAS (Ilmu Pengetahuan Alam & Sosial)",
      guru: "Ustadzah Dewi, S.Pd",
      nilai: 85,
      predikat: "Predikat B+ (Baik)",
      capaian: "Memahami bagian tubuh tumbuhan serta interaksi ekosistem sekitar",
      icon: Compass,
      iconBg: "bg-teal-100 text-teal-700",
    },
    {
      id: "mp-5",
      nama: "Pendidikan Pancasila",
      guru: "Ustadz Hendra, S.Pd",
      nilai: 87,
      predikat: "Predikat A (Baik Sekali)",
      capaian: "Menerapkan musyawarah mufakat di lingkungan keluarga dan madrasah",
      icon: Shield,
      iconBg: "bg-sky-100 text-sky-700",
    },
    {
      id: "mp-6",
      nama: "Bahasa Inggris",
      guru: "Miss Nadia, B.Ed",
      nilai: 89,
      predikat: "Predikat A (Baik Sekali)",
      capaian: "Active listening and vocabulary mastery on daily family activities",
      icon: Globe,
      iconBg: "bg-rose-100 text-rose-700",
    },
  ];

  const handleBack = () => {
    triggerHaptic();
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8faf9] dark:bg-slate-950 pb-28 text-slate-800 dark:text-slate-100">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Nilai Siswa
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentSiswa.nama} • {currentSiswa.kelas}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-[#056839] dark:text-emerald-400 text-[11px] font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>E-Rapor</span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Segmented 2-Pill Tabs: Sumatif | Rapor */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab("sumatif");
            }}
            className={`py-2 rounded-xl text-center transition-all ${
              activeTab === "sumatif"
                ? "bg-[#056839] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            Sumatif
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab("rapor");
            }}
            className={`py-2 rounded-xl text-center transition-all ${
              activeTab === "rapor"
                ? "bg-[#056839] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            Rapor
          </button>
        </div>

        {/* Semester Selector Dropdown */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Periode:</span>
            <span className="text-xs font-extrabold text-[#056839] dark:text-emerald-400">
              {selectedSemester}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {/* TAB 1: SUMATIF (Screen 8 of UI Kit) */}
        {activeTab === "sumatif" && (
          <div className="space-y-3 animate-fadeIn">
            {subjectGrades.map((subject) => {
              const Icon = subject.icon;
              return (
                <div
                  key={subject.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl ${subject.iconBg} flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {subject.nama}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {subject.guru}
                        </p>
                      </div>
                    </div>

                    {/* Circular Dark Green Score Badge (1:1 with Screen 8) */}
                    <div className="w-11 h-11 rounded-full bg-[#056839] text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                      {subject.nilai}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {subject.predikat}
                    </span>
                    <span className="text-slate-400">Tuntas KKM</span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                    {subject.capaian}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: RAPOR */}
        {activeTab === "rapor" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Hero Summary Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#056839] dark:text-emerald-300">
                    E-Rapor Kurikulum Merdeka
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedSemester}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#056839] text-white flex items-center justify-center shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80">
                  <p className="text-[10px] text-slate-400">Rata-Rata Nilai</p>
                  <p className="text-xl font-extrabold text-[#056839] dark:text-emerald-300">
                    88.5
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-600">Predikat A</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80">
                  <p className="text-[10px] text-slate-400">Peringkat Kelas</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Ke-3
                  </p>
                  <p className="text-[10px] text-slate-400">dari 28 Siswa</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 space-y-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Catatan Wali Kelas:
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;Ananda Ahmad Fauzan menunjukkan semangat belajar yang luar biasa, santun, tekun beribadah shalat berjamaah, dan aktif dalam kegiatan literasi Al-Qur'an.&rdquo;
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  alert("Mengunduh dokumen resmi E-Rapor Digital PDF (Tanda tangan elektronik kepala sekolah)...");
                }}
                className="w-full py-3 rounded-full bg-[#056839] hover:bg-[#047857] text-white text-xs font-bold shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh E-Rapor Resmi (PDF)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
