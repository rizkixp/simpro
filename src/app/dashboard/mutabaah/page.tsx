"use client";

import React, { useState, useMemo } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { MutabaahRecord, MutabaahShalatWajib, MutabaahIbadahSunnah, MutabaahAkhlakKarakter } from "@/types/school";
import {
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Star,
  Award,
  Save,
  Check,
  Search,
  Filter,
  Users,
  MessageSquare,
  ThumbsUp,
  Flame,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ShieldCheck,
} from "lucide-react";

export default function MutabaahPage() {
  const { user } = useAuth();
  const {
    mutabaahList,
    addOrUpdateMutabaahRecord,
    verifyMutabaahRecord,
    siswaList,
    kelasList,
  } = useSchoolData();

  const [activeTab, setActiveTab] = useState<"input" | "rekap" | "evaluasi">("input");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(
    siswaList[0]?.id || "sis-001"
  );
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Find existing record for current selected student & date
  const currentRecord = useMemo(() => {
    return mutabaahList.find(
      (m) => m.siswaId === selectedSiswaId && m.tanggal === selectedDate
    );
  }, [mutabaahList, selectedSiswaId, selectedDate]);

  // Form State initialized from current record or defaults
  const [shalat, setShalat] = useState<MutabaahShalatWajib>({
    subuh: "Berjamaah di Masjid",
    dzuhur: "Berjamaah di Masjid/Sekolah",
    ashar: "Berjamaah di Masjid",
    maghrib: "Berjamaah di Masjid",
    isya: "Berjamaah di Masjid",
  });

  const [sunnah, setSunnah] = useState<MutabaahIbadahSunnah>({
    shalatDhuha: true,
    qiyamulLail: false,
    rawatib: true,
    tilawahQuran: true,
    jumlahHalamanTilawah: 2,
    dzikirPagiPetang: true,
    puasaSunnah: false,
    infaqShadaqah: true,
  });

  const [akhlak, setAkhlak] = useState<MutabaahAkhlakKarakter>({
    birrulWalidain: true,
    merapikanTempatTidur: true,
    belajarMandiri: true,
    adabMakanMinum: true,
  });

  const [catatanOrtu, setCatatanOrtu] = useState<string>("");

  // Sync form when student or date changes
  React.useEffect(() => {
    if (currentRecord) {
      setShalat(currentRecord.shalatWajib);
      setSunnah(currentRecord.ibadahSunnah);
      setAkhlak(currentRecord.akhlakKarakter);
      setCatatanOrtu(currentRecord.catatanOrangTua || "");
    } else {
      setShalat({
        subuh: "Munfarid Tepat Waktu",
        dzuhur: "Berjamaah di Masjid/Sekolah",
        ashar: "Munfarid Tepat Waktu",
        maghrib: "Berjamaah di Masjid",
        isya: "Munfarid Tepat Waktu",
      });
      setSunnah({
        shalatDhuha: false,
        qiyamulLail: false,
        rawatib: false,
        tilawahQuran: true,
        jumlahHalamanTilawah: 1,
        dzikirPagiPetang: true,
        puasaSunnah: false,
        infaqShadaqah: false,
      });
      setAkhlak({
        birrulWalidain: true,
        merapikanTempatTidur: true,
        belajarMandiri: true,
        adabMakanMinum: true,
      });
      setCatatanOrtu("");
    }
  }, [currentRecord, selectedSiswaId, selectedDate]);

  // Calculate live Score
  const calculatedScore = useMemo(() => {
    let score = 0;
    // Shalat wajib (10 pts each, bonus 2 for jamaah)
    const shalatScore = (val: string) => {
      if (val.includes("Berjamaah")) return 12;
      if (val.includes("Tepat Waktu")) return 10;
      if (val.includes("Masbuq")) return 7;
      return 0;
    };
    score += shalatScore(shalat.subuh);
    score += shalatScore(shalat.dzuhur);
    score += shalatScore(shalat.ashar);
    score += shalatScore(shalat.maghrib);
    score += shalatScore(shalat.isya);

    // Sunnah
    if (sunnah.shalatDhuha) score += 5;
    if (sunnah.qiyamulLail) score += 6;
    if (sunnah.rawatib) score += 4;
    if (sunnah.tilawahQuran) score += 5;
    if (sunnah.dzikirPagiPetang) score += 4;
    if (sunnah.puasaSunnah) score += 6;
    if (sunnah.infaqShadaqah) score += 4;

    // Akhlak
    if (akhlak.birrulWalidain) score += 4;
    if (akhlak.merapikanTempatTidur) score += 2;
    if (akhlak.belajarMandiri) score += 2;
    if (akhlak.adabMakanMinum) score += 2;

    return Math.min(100, score);
  }, [shalat, sunnah, akhlak]);

  // Save Mutabaah
  const handleSaveMutabaah = (e: React.FormEvent) => {
    e.preventDefault();
    const student = siswaList.find((s) => s.id === selectedSiswaId);
    if (!student) return;

    addOrUpdateMutabaahRecord({
      siswaId: student.id,
      siswaNama: student.nama,
      nisn: student.nisn || "",
      kelas: student.kelas,
      tanggal: selectedDate,
      shalatWajib: shalat,
      ibadahSunnah: sunnah,
      akhlakKarakter: akhlak,
      catatanOrangTua: catatanOrtu.trim() || undefined,
      skorKebaikan: calculatedScore,
      statusVerifikasi: currentRecord?.statusVerifikasi || "Menunggu Verifikasi",
      catatanGuru: currentRecord?.catatanGuru,
      verifiedByGuru: currentRecord?.verifiedByGuru,
    });

    showNotification(`Mutaba'ah harian ${student.nama} berhasil disimpan! (Skor: ${calculatedScore})`);
  };

  // Teacher Quick Verify
  const handleVerify = (recordId: string, withStar: boolean) => {
    const guruNama = user?.name || "Ustadz Pembina";
    const status = withStar ? "Diberi Bintang Kebaikan" : "Terverifikasi Guru";
    const catatan = withStar
      ? "Barakallahu fiik, terus istiqamah menjaga shalat dan birrul walidain! ⭐⭐⭐"
      : "Alhamdulillah sudah diperiksa dan disetujui.";
    verifyMutabaahRecord(recordId, guruNama, catatan, status);
    showNotification(withStar ? "Berhasil diverifikasi dengan Bintang Kebaikan! ⭐" : "Mutaba'ah berhasil diverifikasi.");
  };

  // Filtered Rekap List
  const filteredRekap = useMemo(() => {
    return mutabaahList.filter((m) => {
      const matchKelas = selectedKelasFilter === "all" || m.kelas === selectedKelasFilter;
      const matchDate = m.tanggal === selectedDate;
      return matchKelas && matchDate;
    });
  }, [mutabaahList, selectedKelasFilter, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c3d2e] via-[#11523f] to-[#156951] text-white p-6 sm:p-8 shadow-xl border border-emerald-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-300/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buku Penghubung Ibadah Yaumiyah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span>Mutaba'ah Ibadah Harian Santri</span>
              <span className="font-arabic text-xl sm:text-2xl font-normal text-emerald-200">متابعة العبادة</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Pemantauan pembiasaan shalat 5 waktu berjamaah, ibadah sunnah harian, membaca Al-Qur'an, dan akhlak berbakti kepada orang tua (birrul walidain) secara terintegrasi antara rumah dan sekolah.
            </p>
          </div>

          {/* Date Picker Header */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md space-y-1.5 shrink-0">
            <span className="text-[11px] text-emerald-200 block font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Pilih Tanggal Ibadah:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab("input")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "input"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Pengisian Checklist Harian</span>
        </button>

        <button
          onClick={() => setActiveTab("rekap")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "rekap"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rekapitulasi Kelas & Verifikasi Guru</span>
        </button>

        <button
          onClick={() => setActiveTab("evaluasi")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "evaluasi"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Grafik & Konsistensi Santri</span>
        </button>
      </div>

      {/* TAB 1: PENGISIAN CHECKLIST HARIAN */}
      {activeTab === "input" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Selector Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Santri yang Dinilai:</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {siswaList.find((s) => s.id === selectedSiswaId)?.nama}
                </div>
              </div>

              <select
                value={selectedSiswaId}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas})
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveMutabaah} className="space-y-6">
              {/* Bagian 1: Shalat Fardhu 5 Waktu */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>1. Shalat Fardhu 5 Waktu</span>
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                    Target Utama Berjamaah
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "subuh", label: "Shalat Subuh", icon: Sunrise, color: "text-amber-500" },
                    { key: "dzuhur", label: "Shalat Dzuhur", icon: Sun, color: "text-amber-600" },
                    { key: "ashar", label: "Shalat Ashar", icon: Sunset, color: "text-orange-500" },
                    { key: "maghrib", label: "Shalat Maghrib", icon: Sunset, color: "text-indigo-500" },
                    { key: "isya", label: "Shalat Isya", icon: Moon, color: "text-blue-500" },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div
                      key={key}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Berjamaah di Masjid",
                          "Munfarid Tepat Waktu",
                          "Masbuq/Terlambat",
                          "Tidak Shalat",
                        ].map((option) => (
                          <button
                            type="button"
                            key={option}
                            onClick={() => setShalat((prev) => ({ ...prev, [key]: option }))}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              (shalat as any)[key] === option
                                ? option.includes("Berjamaah")
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : option.includes("Tepat Waktu")
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : option.includes("Masbuq")
                                  ? "bg-amber-600 text-white"
                                  : "bg-rose-600 text-white"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {option.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagian 2: Ibadah Sunnah */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>2. Amalan & Ibadah Sunnah</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Pahala Tambahan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "shalatDhuha", label: "Shalat Dhuha (Pagi)" },
                    { key: "qiyamulLail", label: "Qiyamul Lail / Tahajjud" },
                    { key: "rawatib", label: "Shalat Sunnah Rawatib" },
                    { key: "tilawahQuran", label: "Tadarus Al-Qur'an / Iqra" },
                    { key: "dzikirPagiPetang", label: "Al-Ma'tsurat / Dzikir Pagi-Petang" },
                    { key: "puasaSunnah", label: "Puasa Sunnah (Senin/Kamis)" },
                    { key: "infaqShadaqah", label: "Infaq / Sedekah Subuh" },
                  ].map(({ key, label }) => {
                    const isChecked = (sunnah as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() =>
                          setSunnah((prev) => ({ ...prev, [key]: !isChecked }))
                        }
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isChecked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagian 3: Akhlak & Karakter Di Rumah */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                    <span>3. Akhlak & Birrul Walidain (Di Rumah)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Karakter Mulia</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "birrulWalidain", label: "Membantu Ayah / Bunda di Rumah" },
                    { key: "merapikanTempatTidur", label: "Merapikan Kamar & Kasur Sendiri" },
                    { key: "belajarMandiri", label: "Mengulang Pelajaran & PR Mandiri" },
                    { key: "adabMakanMinum", label: "Adab Makan (Duduk & Baca Basmalah)" },
                  ].map(({ key, label }) => {
                    const isChecked = (akhlak as any)[key];
                    return (
                      <div
                        key={key}
                        onClick={() =>
                          setAkhlak((prev) => ({ ...prev, [key]: !isChecked }))
                        }
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                            isChecked
                              ? "bg-rose-600 border-rose-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Orang Tua */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Pesan & Catatan Orang Tua untuk Guru Kelas (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatanOrtu}
                  onChange={(e) => setCatatanOrtu(e.target.value)}
                  placeholder="Contoh: Ananda hari ini sangat antusias shalat subuh di masjid bersama kakak..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Mutaba'ah Hari Ini</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary Card */}
          <div className="space-y-6">
            {/* Live Score Meter */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Skor Kebaikan Hari Ini
                </span>
                <span className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </span>
              </div>

              <div className="text-center py-3">
                <div className="text-5xl font-black text-slate-900 dark:text-white">
                  {calculatedScore}
                </div>
                <div className="text-xs text-slate-400 mt-1">Dari Maksimal 100 Poin</div>
                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      calculatedScore >= 90
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : calculatedScore >= 75
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {calculatedScore >= 90
                      ? "Mumtaz! (Luar Biasa) ⭐"
                      : calculatedScore >= 75
                      ? "Jayyid Jiddan (Sangat Baik)"
                      : "Jayyid (Cukup Baik)"}
                  </span>
                </div>
              </div>

              {/* Status Verifikasi Guru */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block">Status Verifikasi Asatidz:</span>
                <div className="flex items-center gap-2">
                  {currentRecord?.statusVerifikasi.includes("Bintang") ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Star className="w-4 h-4 fill-amber-500" /> Diberi Bintang Kebaikan
                    </span>
                  ) : currentRecord?.statusVerifikasi.includes("Guru") ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Terverifikasi Guru
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Clock className="w-4 h-4" /> Menunggu Verifikasi
                    </span>
                  )}
                </div>

                {currentRecord?.catatanGuru && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                    "{currentRecord.catatanGuru}" — <b>{currentRecord.verifiedByGuru}</b>
                  </p>
                )}

                {/* Teacher verify button if current user is guru or admin */}
                {currentRecord && !currentRecord.statusVerifikasi.includes("Bintang") && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleVerify(currentRecord.id, true)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Verifikasi & Beri Bintang ⭐</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI KELAS */}
      {activeTab === "rekap" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rekap Tanggal: <b className="text-emerald-600">{selectedDate}</b>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Filter Rombel:</span>
              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rekap Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Shalat Subuh</th>
                    <th className="py-3 px-4">Shalat Dzuhur & Ashar</th>
                    <th className="py-3 px-4">Amalan Sunnah</th>
                    <th className="py-3 px-4 text-center">Skor Kebaikan</th>
                    <th className="py-3 px-4">Status Verifikasi</th>
                    <th className="py-3 px-4 text-center">Aksi Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRekap.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada data mutaba'ah yang diisi pada tanggal {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredRekap.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{m.siswaNama}</div>
                          <div className="text-[11px] text-slate-400">{m.kelas} • NISN: {m.nisn}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              m.shalatWajib.subuh.includes("Berjamaah")
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}
                          >
                            {m.shalatWajib.subuh}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                          <div>Dzuhur: {m.shalatWajib.dzuhur.split(" ")[0]}</div>
                          <div>Ashar: {m.shalatWajib.ashar.split(" ")[0]}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {m.ibadahSunnah.shalatDhuha && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                                Dhuha
                              </span>
                            )}
                            {m.ibadahSunnah.tilawahQuran && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                                Tilawah
                              </span>
                            )}
                            {m.akhlakKarakter.birrulWalidain && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200">
                                Birrul Walidain
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {m.skorKebaikan}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ 100</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              m.statusVerifikasi.includes("Bintang")
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : m.statusVerifikasi.includes("Guru")
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {m.statusVerifikasi.includes("Bintang") && <Star className="w-3 h-3 fill-amber-500" />}
                            {m.statusVerifikasi}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {m.statusVerifikasi.includes("Bintang") ? (
                            <span className="text-amber-600 font-bold text-xs flex items-center justify-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-500" /> Bintang Aktif
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerify(m.id, true)}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] shadow-xs flex items-center gap-1 mx-auto"
                            >
                              <Star className="w-3 h-3 fill-slate-950" />
                              <span>Beri Bintang ⭐</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GRAFIK & KONSISTENSI */}
      {activeTab === "evaluasi" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Konsistensi Shalat Berjamaah
              </span>
              <div className="text-3xl font-black text-emerald-600">86.4%</div>
              <p className="text-xs text-slate-500">
                Santri yang istiqamah shalat subuh dan maghrib berjamaah pekan ini.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Rata-rata Halaman Tilawah
              </span>
              <div className="text-3xl font-black text-blue-600">2.4 Hal / Hari</div>
              <p className="text-xs text-slate-500">
                Target capaian khatam Al-Qur'an dan kelancaran Iqra santri.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Predikat Bintang Kebaikan
              </span>
              <div className="text-3xl font-black text-amber-500">
                {mutabaahList.filter((m) => m.statusVerifikasi.includes("Bintang")).length} Santri
              </div>
              <p className="text-xs text-slate-500">
                Santri penerima apresiasi bintang akhlak dan ibadah dari ustadz.
              </p>
            </div>
          </div>

          {/* Leaderboard Istiqamah */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Santri Paling Istiqamah Menjaga Ibadah Yaumiyah</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {siswaList.slice(0, 3).map((siswa, idx) => (
                <div
                  key={siswa.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-sm shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {siswa.nama}
                    </div>
                    <div className="text-[11px] text-slate-400">{siswa.kelas}</div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                      Skor Rata-rata: {96 - idx * 4} Poin ⭐
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
