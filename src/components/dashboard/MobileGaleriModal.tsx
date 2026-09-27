"use client";

import React, { useState } from "react";
import { X, Image as ImageIcon, Sparkles, Calendar, Tag } from "lucide-react";

interface MobileGaleriModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileGaleriModal({
  isOpen,
  onClose,
}: MobileGaleriModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  if (!isOpen) return null;

  const galleryItems = [
    {
      id: "gal-1",
      title: "Praktik Manasik Haji Cilik",
      category: "Keagamaan",
      date: "18 September 2026",
      imageUrl:
        "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&auto=format&fit=crop&q=80",
      desc: "Edukasi rukun Islam ke-5 dan penanaman kecintaan pada Baitullah.",
    },
    {
      id: "gal-2",
      title: "Wisuda Tahfidz Qur'an Juz 30",
      category: "Tahfidz",
      date: "12 September 2026",
      imageUrl:
        "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80",
      desc: "Uji publik hafalan Al-Qur'an santri kelas 1 hingga kelas 6.",
    },
    {
      id: "gal-3",
      title: "Sholat Dhuha Berjamaah & Dzikir",
      category: "Ibadah",
      date: "25 September 2026",
      imageUrl:
        "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&auto=format&fit=crop&q=80",
      desc: "Pembiasaan ibadah sunnah setiap pagi sebelum KBM dimulai.",
    },
    {
      id: "gal-4",
      title: "Eksplorasi Sains & Percobaan Robotik",
      category: "Akademik",
      date: "20 September 2026",
      imageUrl:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
      desc: "Proyek penguatan profil pelajar Pancasila (P5) tema rekayasa teknologi.",
    },
  ];

  const categories = ["Semua", "Ibadah", "Tahfidz", "Keagamaan", "Akademik"];

  const filteredItems =
    selectedCategory === "Semua"
      ? galleryItems
      : galleryItems.filter((i) => i.category === selectedCategory);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Galeri & Dokumentasi Sekolah
              </h2>
              <p className="text-[11px] text-slate-400">
                Aktivitas & Kreativitas Santri SDI Smart
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-3 overflow-x-auto border-b border-slate-100 dark:border-slate-800 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-[#056839] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Cards Grid */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 shadow-xs group"
            >
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  {item.category}
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {item.desc}
                </p>
                <p className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{item.date}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Close footer button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#056839] hover:bg-[#04522d] text-white text-xs font-bold transition-all shadow-md active:scale-98"
          >
            Tutup Galeri
          </button>
        </div>
      </div>
    </div>
  );
}
