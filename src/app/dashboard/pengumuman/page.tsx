"use client";

import React, { useState } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Pengumuman } from "@/types/school";
import { formatDateIndo } from "@/lib/utils";
import {
  Bell,
  Plus,
  Trash2,
  Calendar,
  X,
  AlertTriangle,
  Megaphone,
} from "lucide-react";

export default function PengumumanPage() {
  const { user } = useAuth();
  const { pengumumanList, addPengumuman, deletePengumuman } = useSchoolData();

  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    judul: "",
    konten: "",
    kategori: "Akademik" as const,
    prioritas: "Normal" as const,
    penulis: user?.name || "Bagian Akademik",
    targetRole: "Semua" as const,
  });

  const canManage = user?.role === "admin" || user?.role === "guru";

  const filteredPengumuman = pengumumanList.filter((p) => {
    const matchKategori = selectedKategori === "Semua" || p.kategori === selectedKategori;
    return matchKategori;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.konten) return;

    addPengumuman({
      ...formData,
      penulis: user?.name || "Pusat Informasi Sekolah",
    });

    setIsFormOpen(false);
    setFormData({
      judul: "",
      konten: "",
      kategori: "Akademik",
      prioritas: "Normal",
      penulis: user?.name || "Bagian Akademik",
      targetRole: "Semua",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-blue-600" />
            <span>Pusat Pengumuman & Agenda Sekolah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Informasi resmi kegiatan kurikulum, jadwal ujian nasional/PTS, dan surat edaran sekolah.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Pengumuman Baru</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["Semua", "Akademik", "Ujian", "Kegiatan", "Keuangan", "Libur"].map((kat) => (
          <button
            key={kat}
            onClick={() => setSelectedKategori(kat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedKategori === kat
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPengumuman.map((item) => {
          const isHighPriority = item.prioritas === "Tinggi";
          return (
            <div
              key={item.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between transition-all ${
                isHighPriority
                  ? "border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-200/50"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                      {item.kategori}
                    </span>
                    {isHighPriority && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        PENTING
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateIndo(item.tanggal)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                  {item.judul}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.konten}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-3.5 w-3.5 text-blue-500" />
                  <span>Oleh: <strong className="text-slate-700 dark:text-slate-200">{item.penulis}</strong></span>
                </div>

                {canManage && (
                  <button
                    onClick={() => {
                      if (confirm("Hapus pengumuman ini?")) deletePengumuman(item.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Buat Pengumuman */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Buat Surat Pengumuman Resmi
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Siarkan pengumuman ini ke seluruh ekosistem sekolah atau peran tertentu.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Jadwal Ujian Akhir Semester Genap"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Akademik">Akademik</option>
                    <option value="Ujian">Ujian</option>
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Libur">Libur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={formData.prioritas}
                    onChange={(e) => setFormData({ ...formData, prioritas: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi (Penting)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Surat / Pengumuman Lengkap *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.konten}
                  onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tuliskan detail pengumuman yang akan disampaikan..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Terbitkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
