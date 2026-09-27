"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Calendar as CalendarIcon,
  ShieldCheck,
  Send,
  FileText,
  UserCheck,
} from "lucide-react";

interface MobilePresensiViewProps {
  onBack?: () => void;
}

export default function MobilePresensiView({ onBack }: MobilePresensiViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { siswaList, profile } = useSchoolData();

  // Active Month (defaults to September 2026 as in UI Kit)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(8); // 8 = September
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState<number>(28);

  // Modal pengajuan izin
  const [isIzinModalOpen, setIsIzinModalOpen] = useState(false);
  const [izinType, setIzinType] = useState<"Izin" | "Sakit">("Izin");
  const [izinAlasan, setIzinAlasan] = useState("");
  const [izinSubmitted, setIzinSubmitted] = useState(false);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysHeader = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

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

  // Attendance simulation for September 2026
  // Day 1 to 30: 20 Hadir, 2 Izin, 1 Sakit, 0 Alfa, plus weekends
  const attendanceData = useMemo(() => {
    const map: Record<number, { status: "Hadir" | "Izin" | "Sakit" | "Alfa" | "Libur"; time?: string; note?: string }> = {};

    // 1 Sep 2026 is Tuesday.
    for (let d = 1; d <= 30; d++) {
      // Days of week: (d = 1 is Tue -> 2, Sun is 7)
      const dayOfWeek = (d + 0) % 7; // simplified day calculation
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        map[d] = { status: "Libur", note: "Hari Libur Akhir Pekan" };
      } else if (d === 15) {
        map[d] = { status: "Sakit", note: "Demam ringan (Surat Dokter)" };
      } else if (d === 22 || d === 25) {
        map[d] = { status: "Izin", note: "Kepentingan keluarga luar kota" };
      } else if (d > 28) {
        map[d] = { status: "Libur", note: "Belum berlangsung" };
      } else {
        map[d] = {
          status: "Hadir",
          time: `07:${String(Math.floor(Math.random() * 15) + 5).padStart(2, "0")} WIB`,
          note: "Tepat Waktu",
        };
      }
    }
    return map;
  }, []);

  const handlePrevMonth = () => {
    triggerHaptic();
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic();
    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  const handleBack = () => {
    triggerHaptic();
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard");
    }
  };

  // Handle izin submission
  const handleSubmitIzin = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setIzinSubmitted(true);
    setTimeout(() => {
      setIzinSubmitted(false);
      setIsIzinModalOpen(false);
      setIzinAlasan("");
      alert("Pengajuan izin berhasil dikirim ke Wali Kelas (Ustadzah Sarah)!");
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
              Absensi
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentSiswa.nama} • {currentSiswa.kelas}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsIzinModalOpen(true);
          }}
          className="px-3 py-1.5 rounded-full bg-[#056839] hover:bg-[#047857] text-white text-[11px] font-bold shadow-xs active:scale-95 transition-transform flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Ajukan Izin</span>
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Month Selector: < September 2026 > */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-sm font-extrabold text-[#056839] dark:text-emerald-400">
              {months[selectedMonthIndex]} {selectedYear}
            </span>
            <p className="text-[10px] text-slate-400">Semester Ganjil</p>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Calendar Dot Grid */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
          {/* Days Header */}
          <div className="grid grid-cols-7 text-center">
            {daysHeader.map((d, i) => (
              <span
                key={d}
                className={`text-[11px] font-bold ${
                  i >= 5 ? "text-rose-500" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Dates Grid with Colored Dots */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {/* Empty slots for calendar offset (Tuesday starts on col 2) */}
            <div className="h-10" />
            
            {Array.from({ length: 30 }, (_, idx) => {
              const dayNum = idx + 1;
              const info = attendanceData[dayNum];
              const isSelected = selectedDay === dayNum;

              // Dot colors
              let dotColor = "bg-transparent";
              if (info?.status === "Hadir") dotColor = "bg-emerald-500";
              else if (info?.status === "Izin") dotColor = "bg-blue-500";
              else if (info?.status === "Sakit") dotColor = "bg-amber-500";
              else if (info?.status === "Alfa") dotColor = "bg-rose-500";

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setSelectedDay(dayNum);
                  }}
                  className={`h-11 flex flex-col items-center justify-center rounded-xl transition-all relative ${
                    isSelected
                      ? "bg-[#056839] text-white shadow-xs font-bold scale-105"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className={`text-xs ${isSelected ? "text-white font-extrabold" : ""}`}>
                    {dayNum}
                  </span>
                  {info?.status !== "Libur" && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? "bg-white" : dotColor
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend dots */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hadir
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Izin
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Sakit
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Alfa
            </span>
          </div>
        </div>

        {/* 4 Bento Recap Cards (Screen 7 UI Kit) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Hadir */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-[#056839] dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-[#056839] dark:text-emerald-300">
                20
              </div>
              <div className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-400">
                Hadir
              </div>
            </div>
          </div>

          {/* Card 2: Izin */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300">
                2
              </div>
              <div className="text-[11px] font-semibold text-blue-800/80 dark:text-blue-400">
                Izin
              </div>
            </div>
          </div>

          {/* Card 3: Sakit */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                1
              </div>
              <div className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-400">
                Sakit
              </div>
            </div>
          </div>

          {/* Card 4: Alfa */}
          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300">
                0
              </div>
              <div className="text-[11px] font-semibold text-rose-800/80 dark:text-rose-400">
                Alfa
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Detail Card */}
        {selectedDay && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#056839]" />
                <span>
                  {selectedDay} {months[selectedMonthIndex]} {selectedYear}
                </span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  attendanceData[selectedDay]?.status === "Hadir"
                    ? "bg-emerald-50 text-[#056839] border border-emerald-200"
                    : attendanceData[selectedDay]?.status === "Izin"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : attendanceData[selectedDay]?.status === "Sakit"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {attendanceData[selectedDay]?.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1">
              <span>Waktu Tiba:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {attendanceData[selectedDay]?.time || "-"}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Keterangan:</span>
              <span className="text-slate-500">
                {attendanceData[selectedDay]?.note || "Presensi Tervalidasi"}
              </span>
            </div>
          </div>
        )}

        {/* Section Catatan Kehadiran Terbaru */}
        <div className="space-y-2.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">
            Riwayat 3 Hari Terakhir
          </h2>

          <div className="space-y-2">
            {[
              {
                tgl: "28 Sep 2026",
                hari: "Senin",
                waktu: "07:12 WIB",
                status: "Hadir",
                badge: "bg-emerald-50 text-[#056839] border-emerald-200",
                wali: "Ustadzah Sarah",
              },
              {
                tgl: "27 Sep 2026",
                hari: "Ahad",
                waktu: "07:15 WIB",
                status: "Hadir",
                badge: "bg-emerald-50 text-[#056839] border-emerald-200",
                wali: "Ustadzah Sarah",
              },
              {
                tgl: "26 Sep 2026",
                hari: "Sabtu",
                waktu: "07:08 WIB",
                status: "Hadir",
                badge: "bg-emerald-50 text-[#056839] border-emerald-200",
                wali: "Ustadzah Sarah",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#056839] flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.hari}, {item.tgl}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Tiba: {item.waktu} • Diverifikasi {item.wali}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.badge}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Pengajuan Izin / Sakit */}
      {isIzinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ajukan Surat Izin / Sakit
              </h3>
              <button
                type="button"
                onClick={() => setIsIzinModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitIzin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jenis Pengajuan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIzinType("Izin")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      izinType === "Izin"
                        ? "bg-[#056839] text-white border-[#056839]"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200"
                    }`}
                  >
                    Izin Keluarga / Acara
                  </button>
                  <button
                    type="button"
                    onClick={() => setIzinType("Sakit")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      izinType === "Sakit"
                        ? "bg-[#056839] text-white border-[#056839]"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200"
                    }`}
                  >
                    Sakit / Rawat
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alasan & Keterangan
                </label>
                <textarea
                  rows={3}
                  required
                  value={izinAlasan}
                  onChange={(e) => setIzinAlasan(e.target.value)}
                  placeholder="Contoh: Ananda sedang demam dan istirahat di rumah sesuai saran dokter..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#056839] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsIzinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={izinSubmitted}
                  className="flex-1 py-2.5 rounded-xl bg-[#056839] hover:bg-[#047857] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                >
                  {izinSubmitted ? (
                    <span>Mengirimkan...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim ke Wali Kelas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
