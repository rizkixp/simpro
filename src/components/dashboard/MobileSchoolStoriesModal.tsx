"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, Heart, Share2, Volume2, VolumeX } from "lucide-react";

export interface SchoolStory {
  id: string;
  category: string;
  categoryBadge: string;
  title: string;
  subtitle: string;
  time: string;
  image?: string;
  bgGradient: string;
  description: string;
  highlights: string[];
}

export const DEFAULT_STORIES: SchoolStory[] = [
  {
    id: "story-1",
    category: "Kilas Sekolah",
    categoryBadge: "Aktivitas Harian",
    title: "Praktik Sains di Kebun Edukasi",
    subtitle: "Santri Kelas 3 Al-Farabi",
    time: "Hari ini, 08:30 WIB",
    bgGradient: "from-emerald-700 via-teal-800 to-slate-900",
    description:
      "Alhamdulillah, santri antusias mengamati siklus pertumbuhan tanaman herbal dan mengukur kelembapan tanah secara langsung menggunakan sensor mini di Kebun Edukasi Sekolah.",
    highlights: ["Eksperimen Lapangan", "Sains Merdeka", "Karakter Mandiri"],
  },
  {
    id: "story-2",
    category: "Ibadah Pagi",
    categoryBadge: "Habit Pembiasaan",
    title: "Dhuha & Tilawah Bersama",
    subtitle: "Masjid Al-Ikhlas SDI",
    time: "Pagi tadi, 07:15 WIB",
    bgGradient: "from-amber-600 via-emerald-800 to-slate-950",
    description:
      "Rutinitas pagi sebelum memulai pelajaran diawali dengan Sholat Dhuha 4 rakaat dilanjutkan murojaah Juz 30 secara khusyuk bersama wali kelas.",
    highlights: ["4 Rakaat Dhuha", "Murojaah Surat An-Naba", "Doa Pagi Barakah"],
  },
  {
    id: "story-3",
    category: "Prestasi",
    categoryBadge: "Kebanggaan Sekolah",
    title: "Juara 1 MHQ Tingkat Kota",
    subtitle: "Musabaqah Hifdzil Qur'an 2026",
    time: "Kemarin, 14:00 WIB",
    bgGradient: "from-blue-600 via-indigo-900 to-slate-950",
    description:
      "Barakallah kepada Ananda Ahmad Fauzan atas prestasinya meraih Juara 1 lomba hafalan Al-Qur'an 1 Juz Tingkat Sekolah Dasar se-Kota Medan.",
    highlights: ["Juara 1 MHQ", "100 Poin Prestasi", "Bebas SPP 3 Bulan"],
  },
  {
    id: "story-4",
    category: "Gizi & Katering",
    categoryBadge: "Menu Sehat",
    title: "Menu Katering Hari Ini",
    subtitle: "Dapur Sehat SDI Cendekia",
    time: "Siang ini, 11:45 WIB",
    bgGradient: "from-rose-600 via-purple-900 to-slate-950",
    description:
      "Menu makan siang bergizi seimbang untuk santri: Nasi Organik, Ayam Panggang Madu, Sayur Sup Brokoli Jagung Manis, Semangka Segar, dan Susu Kurma.",
    highlights: ["Halal & Higienis", "Zero MSG Berlebih", "Buah Segar Setiap Hari"],
  },
  {
    id: "story-5",
    category: "Armada Bus",
    categoryBadge: "Operasional Jemputan",
    title: "Armada Jemputan Tiba Tepat Waktu",
    subtitle: "Rute A, B, dan C Aman",
    time: "Pagi tadi, 06:55 WIB",
    bgGradient: "from-teal-600 via-cyan-900 to-slate-950",
    description:
      "Seluruh armada bus sekolah telah mengantar santri dengan selamat tepat sebelum bel masuk berbunyi. Driver dan pendamping melakukan cek suhu & sanitasi.",
    highlights: ["GPS Terpantau", "3 Rute Aktif", "Driver Berpengalaman"],
  },
  {
    id: "story-6",
    category: "Agenda",
    categoryBadge: "Kalender Akademik",
    title: "Persiapan PTS Pekan Depan",
    subtitle: "20 - 25 Oktober 2026",
    time: "Pemberitahuan Resmi",
    bgGradient: "from-indigo-600 via-purple-900 to-slate-950",
    description:
      "Mohon para ayah dan bunda mendampingi ananda dalam mengulang materi di LMS serta menjaga kesehatan menjelang Penilaian Tengah Semester Gasal.",
    highlights: ["Jadwal di LMS", "Kisi-kisi Tersedia", "Format Digital & Tulis"],
  },
];

interface MobileSchoolStoriesModalProps {
  isOpen: boolean;
  initialIndex?: number;
  onClose: () => void;
  stories?: SchoolStory[];
}

export default function MobileSchoolStoriesModal({
  isOpen,
  initialIndex = 0,
  onClose,
  stories = DEFAULT_STORIES,
}: MobileSchoolStoriesModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsLiked(false);
    }
  }, [isOpen, initialIndex]);

  // Auto-progress timer (5 detik per story)
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = 50; // update every 50ms
    const step = (interval / 5000) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, currentIndex, stories.length, onClose]);

  if (!isOpen) return null;

  const current = stories[currentIndex] || stories[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center select-none"
      onClick={handleNext}
    >
      <div
        className={`relative w-full max-w-md h-full sm:h-[88vh] sm:rounded-3xl overflow-hidden flex flex-col justify-between bg-gradient-to-b ${current.bgGradient} text-white shadow-2xl transition-all duration-300`}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Subtle Islamic Arabesque overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:20px_20px] pointer-events-none" />

        {/* 1. TOP PROGRESS BARS & HEADER */}
        <div className="relative z-20 p-4 pt-3 space-y-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          {/* Multi-story Segment Progress */}
          <div className="flex gap-1.5 w-full">
            {stories.map((s, idx) => (
              <div
                key={s.id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75 rounded-full"
                  style={{
                    width:
                      idx < currentIndex
                        ? "100%"
                        : idx === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* User / School Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-emerald-950 flex items-center justify-center font-bold text-xs text-amber-300">
                  SDI
                </div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight">SDI Cendekia</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-white/70">{current.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. STORY CONTENT BODY */}
        <div className="relative z-10 px-6 py-4 flex flex-col justify-end space-y-4 flex-1">
          {/* Category Chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs font-bold border border-white/20 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{current.categoryBadge}</span>
          </div>

          {/* Main Title & Subtitle */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-md">
              {current.title}
            </h2>
            <p className="text-sm font-semibold text-emerald-200 mt-1">
              {current.subtitle}
            </p>
          </div>

          {/* Highlights Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {current.highlights.map((h, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-xl bg-black/40 backdrop-blur-md text-white text-xs font-semibold border border-white/10"
              >
                ✓ {h}
              </span>
            ))}
          </div>

          {/* Story Paragraph */}
          <div className="p-4 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 text-xs sm:text-sm text-slate-100 leading-relaxed shadow-lg">
            {current.description}
          </div>
        </div>

        {/* 3. TAP NAVIGATION ZONES (Left / Right) */}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-20 bottom-24 w-1/3 z-20 cursor-pointer"
          title="Ketuk untuk kembali"
        />
        <div
          onClick={handleNext}
          className="absolute right-0 top-20 bottom-24 w-1/3 z-20 cursor-pointer"
          title="Ketuk untuk lanjut"
        />

        {/* 4. FOOTER ACTION BAR */}
        <div className="relative z-20 p-4 pb-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between gap-3">
          <div className="flex-1 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white/80 border border-white/20">
            Kirim doa atau tanggapan...
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-75 cursor-pointer ${
              isLiked ? "bg-rose-600 text-white" : "bg-white/20 text-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
