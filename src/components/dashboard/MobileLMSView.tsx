"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import {
  ArrowLeft,
  BookOpenCheck,
  Clock,
  CheckCircle2,
  UploadCloud,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Send,
  X,
  FileCheck,
} from "lucide-react";

interface MobileLMSViewProps {
  onBack?: () => void;
}

export default function MobileLMSView({ onBack }: MobileLMSViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { siswaList } = useSchoolData();

  // Tab: "aktif" | "selesai" (Screen 9 of UI Kit)
  const [activeTab, setActiveTab] = useState<"aktif" | "selesai">("aktif");

  // Submission modal state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

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

  // Active Tasks matching Screen 9 of UI Kit
  const activeTasks = [
    {
      id: "tsk-1",
      mapel: "Matematika",
      mapelBadge: "bg-purple-100 text-purple-700",
      judul: "Latihan Soal Pecahan Senilai Hal. 45-47",
      guru: "Ustadzah Sarah • Kelas 3 Al Farabi",
      deadline: "Tenggat: Besok, 23:59 WIB",
      deadlineUrgent: true,
      deskripsi:
        "Kerjakan latihan soal pecahan senilai di buku tugas tematik, kemudian foto dan unggah file PDF/JPG di sini.",
      tipe: "Unggah Berkas / Foto",
    },
    {
      id: "tsk-2",
      mapel: "Pendidikan Agama Islam",
      mapelBadge: "bg-emerald-100 text-[#056839]",
      judul: "Setoran Hafalan Surat Al-Balad (Ayat 1-10)",
      guru: "Ustadz Fauzan • Kelas 3 Al Farabi",
      deadline: "Tenggat: 3 Hari Lagi (1 Okt 2026)",
      deadlineUrgent: false,
      deskripsi:
        "Rekam lantunan hafalan Surat Al-Balad ayat 1 sampai 10 dengan tajwid dan makhraj yang fasih.",
      tipe: "Rekaman Suara / Video",
    },
    {
      id: "tsk-3",
      mapel: "Bahasa Indonesia",
      mapelBadge: "bg-amber-100 text-amber-700",
      judul: "Menulis Cerita Pendek Pengalaman Liburan",
      guru: "Ustadzah Sarah • Kelas 3 Al Farabi",
      deadline: "Tenggat: 5 Hari Lagi (3 Okt 2026)",
      deadlineUrgent: false,
      deskripsi:
        "Tuliskan cerita pengalaman liburan bersama keluarga minimal 2 paragraf rapi dengan ejaan yang disempurnakan.",
      tipe: "Tulisan / Dokumen",
    },
  ];

  // Completed Tasks matching Screen 9
  const completedTasks = [
    {
      id: "tsk-c1",
      mapel: "IPAS",
      mapelBadge: "bg-teal-100 text-teal-700",
      judul: "Proyek Pengamatan Bagian Tumbuhan & Fotosintesis",
      guru: "Ustadzah Dewi • Kelas 3 Al Farabi",
      dikumpulkan: "22 Sep 2026 (Tepat Waktu)",
      nilai: 95,
      feedback: "Alhamdulillah sangat rapi, penjelasan bagian bunga sangat detail dan tepat.",
    },
    {
      id: "tsk-c2",
      mapel: "PAI & Budi Pekerti",
      mapelBadge: "bg-emerald-100 text-[#056839]",
      judul: "Kuis Tajwid: Hukum Bacaan Nun Mati & Tanwin",
      guru: "Ustadz Fauzan • Kelas 3 Al Farabi",
      dikumpulkan: "18 Sep 2026 (Tepat Waktu)",
      nilai: 100,
      feedback: "Mumtaz! Penguasaan materi idzhar, idgham, dan ikhfa sangat sempurna.",
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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitFeedback("Alhamdulillah tugas berhasil dikumpulkan!");
      setTimeout(() => {
        setSubmitFeedback(null);
        setSelectedTask(null);
      }, 1500);
    }, 1200);
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
              Tugas Siswa
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentSiswa.nama} • {currentSiswa.kelas}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-[#056839] dark:text-emerald-400 text-[11px] font-semibold">
          <BookOpenCheck className="w-3.5 h-3.5" />
          <span>LMS</span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Segmented 2-Pill Tabs: Tugas Aktif | Selesai */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab("aktif");
            }}
            className={`py-2 rounded-xl text-center transition-all ${
              activeTab === "aktif"
                ? "bg-[#056839] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            Tugas Aktif (3)
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab("selesai");
            }}
            className={`py-2 rounded-xl text-center transition-all ${
              activeTab === "selesai"
                ? "bg-[#056839] text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            Selesai (2)
          </button>
        </div>

        {/* TAB 1: TUGAS AKTIF (Screen 9 of UI Kit) */}
        {activeTab === "aktif" && (
          <div className="space-y-3.5 animate-fadeIn">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${task.mapelBadge}`}
                  >
                    {task.mapel}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      task.deadlineUrgent
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{task.deadline}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {task.judul}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{task.guru}</p>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  {task.deskripsi}
                </p>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{task.tipe}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setSelectedTask(task);
                    }}
                    className="px-4 py-2 rounded-full bg-[#056839] hover:bg-[#047857] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Kerjakan Tugas</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: TUGAS SELESAI */}
        {activeTab === "selesai" && (
          <div className="space-y-3.5 animate-fadeIn">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${task.mapelBadge}`}
                  >
                    {task.mapel}
                  </span>

                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[#056839] dark:text-emerald-300 flex items-center justify-center font-extrabold text-sm shadow-xs">
                    {task.nilai}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {task.judul}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {task.guru} • {task.dikumpulkan}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                  <p className="text-[10px] font-bold text-[#056839] dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Ulasan Guru:</span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                    &ldquo;{task.feedback}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-[#056839]">
                  {selectedTask.mapel}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Unggah Lembar Jawaban
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                &times;
              </button>
            </div>

            {submitFeedback ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#056839] mx-auto animate-bounce" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {submitFeedback}
                </p>
                <p className="text-xs text-slate-400">Menutup jendela...</p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedTask.judul}
                </p>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2 hover:border-[#056839] transition-colors cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ketuk untuk memilih foto / dokumen tugas
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, JPG, PNG hingga 10MB</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan untuk Guru (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jawaban nomor 1-10 sudah selesai dikerjakan..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#056839] hover:bg-[#047857] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>Mengunggah...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Tugas</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
