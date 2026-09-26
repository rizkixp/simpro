"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { formatRupiah } from "@/lib/utils";
import MobileSuperAppDashboard from "@/components/dashboard/MobileSuperAppDashboard";
import {
  Users,
  GraduationCap,
  CalendarCheck2,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  Clock,
  Bell,
  BookOpen,
  Award,
  ChevronRight,
  TrendingUp,
  Shield,
  Sparkles,
  CheckCircle2,
  HeartHandshake,
  BookOpenCheck,
  MessageCircle,
  Sun,
  Heart,
  Check,
  Printer,
  FileText,
  Star,
  CreditCard,
  Send,
  Share2,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const teacherScope = useTeacherScope();
  const {
    siswaList,
    guruList,
    kelasList,
    presensiList,
    sppList,
    jadwalList,
    pengumumanList,
    profile,
    mutabaahList,
    nilaiList,
  } = useSchoolData();

  // Statistics calculation scoped to teacher class if role is guru
  const scopedSiswaList = teacherScope.isTeacher
    ? teacherScope.filterByAssignedClass(siswaList)
    : siswaList;

  const totalSiswa = scopedSiswaList.length;
  const totalGuru = guruList.length;
  const totalKelas = kelasList.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayPresensi = presensiList.filter((p) => {
    if (p.tanggal !== todayStr) return false;
    if (teacherScope.isTeacher && teacherScope.assignedClass) {
      const student = siswaList.find((s) => s.id === p.siswaId);
      return student && student.kelas?.toLowerCase() === teacherScope.assignedClass.toLowerCase();
    }
    return true;
  });
  const hadirCount = todayPresensi.filter((p) => p.status === "Hadir").length;
  const presensiRate = todayPresensi.length > 0 ? Math.round((hadirCount / todayPresensi.length) * 100) : 100;

  const sppLunas = sppList.filter((s) => s.status === "Lunas");
  const totalSppTerkumpul = sppLunas.reduce((acc, curr) => acc + curr.nominal, 0);

  // Student specific data (if role is siswa or ortu)
  const currentSiswa =
    siswaList.find(
      (s) =>
        (user?.nisnOrNip && s.nisn === user.nisnOrNip) ||
        s.nama.toLowerCase().includes("ahmad rizky")
    ) || siswaList[0];

  // Interactive Buku Penghubung State (Parent Portal)
  const [bukuPenghubungList, setBukuPenghubungList] = useState<
    {
      id: string;
      tanggal: string;
      pengirim: string;
      kategori: string;
      pesan: string;
      balasanGuru?: string;
    }[]
  >([
    {
      id: "bp-1",
      tanggal: "Hari ini, 07:15 WIB",
      pengirim: "Ustadzah Siti Nurhaliza (Wali Kelas)",
      kategori: "Catatan Pembina",
      pesan:
        "Alhamdulillah Ananda Ahmad Rizky sangat aktif dalam pembacaan Al-Qur'an dan shalat dhuha berjamaah pagi ini. Mohon bimbingan tilawah mandiri di rumah dilanjutkan.",
      balasanGuru: "Syukron Ayah/Bunda atas pendampingan istiqomah di rumah.",
    },
  ]);
  const [bukuInputText, setBukuInputText] = useState("");
  const [bukuKategori, setBukuKategori] = useState("Catatan Ibadah");
  const [isBukuSent, setIsBukuSent] = useState(false);

  const handleSendBukuPenghubung = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bukuInputText.trim()) return;

    const newMsg = {
      id: `bp-${Date.now()}`,
      tanggal: "Baru saja",
      pengirim: user?.name || "Orang Tua / Wali Santri",
      kategori: bukuKategori,
      pesan: bukuInputText.trim(),
      balasanGuru:
        "Jazakumullahu khairan Ayah/Bunda atas konfirmasinya. Pesan telah kami catat dalam buku bimbingan harian ananda.",
    };

    setBukuPenghubungList([newMsg, ...bukuPenghubungList]);
    setBukuInputText("");
    setIsBukuSent(true);
    setTimeout(() => setIsBukuSent(false), 3000);
  };

  // Student specific data for Parent Portal
  const studentNilaiRecords = nilaiList.filter((n) => n.siswaId === currentSiswa?.id);
  const studentAvgScore =
    studentNilaiRecords.length > 0
      ? Math.round(
          studentNilaiRecords.reduce((acc, curr) => acc + (curr.nilaiAkhir || curr.nilaiMid || 80), 0) /
            studentNilaiRecords.length
        )
      : 88;

  const studentTodayRecord =
    mutabaahList.find((m) => m.siswaId === currentSiswa?.id && m.tanggal === todayStr) ||
    mutabaahList.find((m) => m.siswaId === currentSiswa?.id);

  const studentTodayPresensi = presensiList.find(
    (p) => p.siswaId === currentSiswa?.id && p.tanggal === todayStr
  );

  const studentSpp = sppList.filter((s) => s.siswaId === currentSiswa?.id);
  const isStudentSppLunas = studentSpp.some((s) => s.status === "Lunas");

  // =========================================================================
  // RENDER KHUSUS: PORTAL WALI SANTRI (PARENT PORTAL) JIKA ROLE ADALAH ORTU
  // =========================================================================
  if (user?.role === "ortu" && currentSiswa) {
    return (
      <>
        {/* Tampilan Mobile Super-App Bergaya BRImo Emerald (< 1024px) */}
        <MobileSuperAppDashboard />

        {/* Tampilan Desktop Luas Portal Wali Santri (>= 1024px) */}
        <div className="hidden lg:block space-y-6">
          {/* Banner Khusus Wali Santri */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#022c22] text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/20 border border-emerald-600/30">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 backdrop-blur-md text-xs font-semibold text-emerald-200 mb-3.5 border border-emerald-500/30 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Portal Khusus Wali Santri (Parent Portal)</span>
                <span className="text-emerald-400/40">•</span>
                <span className="text-amber-300 font-medium">TA {profile.tahunAjaranAktif} Ganjil</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Ahlan wa Sahlan, {user?.name}
                <span className="text-amber-300">🌿</span>
              </h1>
              <p className="mt-2 text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                Pantau perkembangan ibadah yaumiyah, capaian akademik E-Rapor, presensi harian, dan komunikasi aktif dengan wali kelas ananda tercinta.
              </p>
            </div>

            {/* Quick Summary Pill Card Ananda */}
            <div className="bg-emerald-950/60 backdrop-blur-md border border-emerald-400/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-lg shrink-0">
              <img
                src={currentSiswa.avatar}
                alt={currentSiswa.nama}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-amber-400 shadow-md bg-white/10"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">
                  Ananda Tercinta
                </span>
                <p className="font-bold text-base text-white">{currentSiswa.nama}</p>
                <p className="text-xs text-emerald-200 font-medium">
                  Kelas <strong>{currentSiswa.kelas}</strong> &bull; NISN: <span className="font-mono">{currentSiswa.nisn}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Kartu KPI Ringkasan Ananda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Presensi Hari Ini */}
          <Link
            href="/dashboard/presensi"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 shadow-xs hover:border-emerald-400 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400">Kehadiran Hari Ini</p>
              <p className="mt-1 text-2xl font-black text-emerald-950 dark:text-white">
                {studentTodayPresensi?.status || "Hadir Tepat Waktu"}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kedisiplinan 100% (Mumtaz)</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CalendarCheck2 className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 2: Mutaba'ah Ibadah */}
          <Link
            href="/dashboard/mutabaah"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-400">Mutaba'ah Hari Ini</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {studentTodayRecord?.skorKebaikan || 95} <span className="text-xs font-bold text-slate-400">/ 100</span>
              </p>
              <p className="mt-1.5 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{studentTodayRecord?.statusVerifikasi || "Bintang Kebaikan ⭐"}</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Sun className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 3: Rata-Rata Nilai Rapor */}
          <Link
            href="/dashboard/nilai"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950 shadow-xs hover:border-blue-400 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-semibold text-blue-800/80 dark:text-blue-400">Rata-Rata E-Rapor</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {studentAvgScore} <span className="text-xs font-bold text-slate-400">/ 100</span>
              </p>
              <p className="mt-1.5 text-[11px] font-bold text-blue-700 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>Predikat A (Sangat Memuaskan)</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 4: Status Administrasi & SPP */}
          <Link
            href="/dashboard/spp-transportasi"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-950 shadow-xs hover:border-teal-400 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-semibold text-teal-800/80 dark:text-teal-400">Status SPP Bulan Ini</p>
              <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {isStudentSppLunas ? "Lunas" : "Terverifikasi"}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                <span>Bebas Tunggakan &bull; Rincian &rarr;</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
          </Link>
        </div>

        {/* Konten Utama 2 Kolom Kiri dan 1 Kolom Kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sisi Kiri (2 Kolom): Mutabaah Live & Capaian Belajar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Widget Mutaba'ah Hari Ini */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700">
                    <Sun className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Catatan Ibadah Yaumiyah Ananda Hari Ini</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Live Tracking
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pantauan shalat fardhu 5 waktu, amalan sunnah, serta budi pekerti di sekolah & rumah.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/mutabaah"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Riwayat Lengkap</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Shalat 5 Waktu Status */}
              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>1. Shalat Fardhu 5 Waktu:</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { name: "Subuh", val: studentTodayRecord?.shalatWajib?.subuh || "jamaah" },
                      { name: "Dzuhur", val: studentTodayRecord?.shalatWajib?.dzuhur || "jamaah" },
                      { name: "Ashar", val: studentTodayRecord?.shalatWajib?.ashar || "jamaah" },
                      { name: "Maghrib", val: studentTodayRecord?.shalatWajib?.maghrib || "jamaah" },
                      { name: "Isya", val: studentTodayRecord?.shalatWajib?.isya || "jamaah" },
                    ].map((sh) => (
                      <div
                        key={sh.name}
                        className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center"
                      >
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{sh.name}</p>
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Tuntas (Ya)</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sunnah & Akhlak Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>Amalan Sunnah & Tilawah:</span>
                    </p>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Shalat Dhuha</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">✅ Terlaksana (Ya)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Sunnah Rawatib</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">✅ Terlaksana (Ya)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-600 dark:text-slate-400">Tilawah Al-Qur'an</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">✅ Ya (2 Halaman)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <HeartHandshake className="h-4 w-4 text-rose-500" />
                      <span>Akhlak & Adab Mandiri:</span>
                    </p>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Membantu Orang Tua</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">✅ Ya (Sangat Rajin)</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Belajar Mandiri di Rumah</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">✅ Ya (Tekun)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-600 dark:text-slate-400">Catatan Pembina</span>
                        <span className="italic text-slate-700 dark:text-slate-300">"Alhamdulillah santun & ceria"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ringkasan E-Rapor & Capaian Akademik Ananda */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span>Laporan Hasil Belajar (E-Rapor Ananda)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Rekapitulasi capaian kompetensi semester aktif peserta didik.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/nilai"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Lihat & Unduh PDF Rapor</span>
                  </Link>
                </div>
              </div>

              {/* Tabel Ringkas Nilai Ananda */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Mata Pelajaran</th>
                      <th className="px-3 py-2.5 text-center">KKM</th>
                      <th className="px-3 py-2.5 text-center">Nilai PTS</th>
                      <th className="px-3 py-2.5 text-center">Nilai PAS</th>
                      <th className="px-3 py-2.5 text-center">Predikat</th>
                      <th className="px-4 py-2.5">Catatan Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(studentNilaiRecords.length > 0 ? studentNilaiRecords : [
                      { id: "1", mapel: "Pendidikan Agama Islam", kkm: 78, tugas: 90, uts: 88, uas: 92, nilaiMid: 88, nilaiAkhir: 91, predikat: "A", catatan: "Sangat baik dalam pemahaman akidah dan hafalan doa harian." },
                      { id: "2", mapel: "Matematika", kkm: 75, tugas: 85, uts: 82, uas: 88, nilaiMid: 82, nilaiAkhir: 86, predikat: "A", catatan: "Mampu menyelesaikan soal pemecahan masalah dengan sistematis." },
                      { id: "3", mapel: "Bahasa Arab", kkm: 75, tugas: 88, uts: 85, uas: 90, nilaiMid: 85, nilaiAkhir: 89, predikat: "A", catatan: "Kosa kata dan pelafalan makharijul huruf sangat fasih." },
                      { id: "4", mapel: "Tahfidz Al-Qur'an", kkm: 80, tugas: 95, uts: 92, uas: 96, nilaiMid: 92, nilaiAkhir: 95, predikat: "A", catatan: "Mutqin juz 30 dengan tajwid yang sangat rapi." },
                    ]).slice(0, 4).map((rec, i) => (
                      <tr key={rec.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{rec.mapel}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500">{(rec as any).kkm || 75}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-600">{rec.nilaiMid || 85}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-600">{rec.nilaiAkhir || 88}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {rec.predikat || "A"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 italic text-[11px] truncate max-w-xs">
                          "{rec.catatan || "Tuntas dengan capaian kompetensi sangat baik."}"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sisi Kanan (1 Kolom): Buku Penghubung & Kontak Wali Kelas */}
          <div className="space-y-6">
            {/* Widget Buku Penghubung Digital Orang Tua - Guru */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Buku Penghubung Digital
                  </h3>
                  <p className="text-[11px] text-slate-500">Komunikasi langsung dengan Wali Kelas</p>
                </div>
              </div>

              {/* Form Kirim Catatan ke Wali Kelas */}
              <form onSubmit={handleSendBukuPenghubung} className="space-y-3 mb-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Pesan / Catatan:
                  </label>
                  <select
                    value={bukuKategori}
                    onChange={(e) => setBukuKategori(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Catatan Ibadah">Catatan Ibadah di Rumah</option>
                    <option value="Izin Tidak Masuk / Sakit">Izin Tidak Masuk / Sakit</option>
                    <option value="Konsultasi Belajar">Konsultasi Belajar & Adab</option>
                    <option value="Apresiasi & Saran">Apresiasi & Saran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pesan Orang Tua:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={bukuInputText}
                    onChange={(e) => setBukuInputText(e.target.value)}
                    placeholder="Tuliskan catatan izin, pesan, atau perkembangan ananda di rumah..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  {isBukuSent ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      <span>Terkirim ke Wali Kelas!</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Respon langsung dalam 1x24 jam</span>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Kirim Pesan</span>
                  </button>
                </div>
              </form>

              {/* Feed Percakapan / Catatan Terakhir */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {bukuPenghubungList.map((bp) => (
                  <div
                    key={bp.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[9px] font-bold">
                        {bp.kategori}
                      </span>
                      <span className="text-[10px] text-slate-400">{bp.tanggal}</span>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-0.5">{bp.pengirim}:</p>
                      <p className="text-slate-800 dark:text-slate-200 leading-snug">"{bp.pesan}"</p>
                    </div>

                    {bp.balasanGuru && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 mt-1">
                        <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">
                          Tanggapan Ustadzah (Wali Kelas):
                        </p>
                        <p className="text-[11px] text-emerald-900 dark:text-emerald-200 italic leading-snug">
                          "{bp.balasanGuru}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Wali Kelas & Kontak Penting */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-slate-800 dark:to-slate-900 border border-emerald-200/80 shadow-xs">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Wali Kelas & Pembina Ananda</span>
              </p>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  SN
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Ustadzah Siti Nurhaliza, M.Si.</h4>
                  <p className="text-xs text-emerald-800/80 font-medium">Wali Kelas {currentSiswa.kelas}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-emerald-100 dark:border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span>Kontak Resmi WhatsApp:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">+62 812-3456-7890</span>
                </div>
                <div className="flex justify-between">
                  <span>Jam Konsultasi:</span>
                  <span className="font-medium text-slate-800 dark:text-white">Senin - Jumat (13.00 - 15.30)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // =========================================================================
  // RENDER STANDAR: DASHBOARD OVERVIEW UNTUK ADMIN, GURU, DAN SISWA
  // =========================================================================
  return (
    <>
      {/* Tampilan Mobile Super-App Bergaya BRImo Emerald (< 1024px) */}
      <MobileSuperAppDashboard />

      {/* Tampilan Desktop Luas Admin, Guru, dan Siswa (>= 1024px) */}
      <div className="hidden lg:block space-y-6">
        {/* Primary KPI Stats Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${
          user?.role === "guru" ? "lg:grid-cols-3" : "lg:grid-cols-4"
        } gap-4 sm:gap-5`}
      >
        {/* Stat 1: Siswa */}
        {user?.role === "admin" ? (
          <Link
            href="/dashboard/siswa"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400">
                Total Santri & Siswa
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-950 dark:text-white">{totalSiswa} Siswa</p>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                <TrendingUp className="h-3 w-3" />
                <span>Terbagi dalam {totalKelas} Rombel Kelas &rarr;</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </Link>
        ) : (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400">
                {teacherScope.isTeacher ? `Santri Kelas ${teacherScope.assignedClass}` : "Total Santri & Siswa"}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-950 dark:text-white">{totalSiswa} Siswa</p>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>
                  {teacherScope.isTeacher
                    ? `Wali: ${teacherScope.teacherName}`
                    : `${siswaList.filter((s) => s.status === "Aktif").length} Santri Aktif`}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Stat 2: Guru / Asatidz (Hanya tampil untuk Non-Guru / Admin) */}
        {user?.role !== "guru" && (
          <Link
            href="/dashboard/guru"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-100/90 dark:border-teal-950 shadow-xs flex items-center justify-between hover:border-teal-400 hover:shadow-md transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-teal-800/70 dark:text-teal-400">Dewan Asatidz & Guru</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{totalGuru} Asatidz</p>
              <p className="mt-1.5 text-[11px] font-semibold text-teal-700 group-hover:underline">Tenaga Pendidik SDI &rarr;</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 border border-teal-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
          </Link>
        )}

        {/* Stat 3: Presensi */}
        <Link
          href="/dashboard/presensi"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs flex items-center justify-between hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400">Kehadiran Hari Ini</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-950 dark:text-white">{presensiRate}%</p>
            <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
              {hadirCount} dari {todayPresensi.length || totalSiswa} santri hadir
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CalendarCheck2 className="h-6 w-6" />
          </div>
        </Link>

        {/* Stat 4: LMS / Pembelajaran */}
        {user?.role === "guru" ? (
          <Link
            href="/dashboard/lms"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs flex items-center justify-between hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400">LMS Pembelajaran</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                Kelas {teacherScope.assignedClass}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                Buka Materi & Tugas &rarr;
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard/spp-transportasi"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-950 shadow-xs flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-400">Penerimaan SPP & Infaq</p>
              <p className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                {formatRupiah(totalSppTerkumpul)}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
                {sppLunas.length} Transaksi Terlunasi &rarr;
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="h-6 w-6" />
            </div>
          </Link>
        )}
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule, Islamic Habits & Quick Nav */}
        <div className="lg:col-span-2 space-y-6">
          {/* Islamic Character & Daily Habit Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 border border-emerald-100">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Pembiasaan Ibadah & Karakter Islami
                  </h2>
                  <p className="text-xs text-emerald-800/70">Program pembentukan adab dan akhlak santri harian</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
                Aktif Hari Ini
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sholat Dhuha</h4>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">07.00 - 07.30 WIB</p>
                  <p className="text-[10px] text-slate-500 mt-1">Berjamaah di Masjid SDI</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpenCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tahfidz & Tilawah</h4>
                  <p className="text-[11px] text-teal-700 font-medium mt-0.5">07.30 - 08.15 WIB</p>
                  <p className="text-[10px] text-slate-500 mt-1">Muroja'ah Juz 30 / Pilihan</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dzuhur Berjamaah</h4>
                  <p className="text-[11px] text-amber-800 font-medium mt-0.5">12.00 - 12.35 WIB</p>
                  <p className="text-[10px] text-slate-500 mt-1">Sholat & Kultum Adab</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Schedule Today */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 border border-emerald-100">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Jadwal KBM SDI Hari Ini
                  </h2>
                  <p className="text-xs text-slate-500">Kelas 6 SDI Smart School • Semester Ganjil</p>
                </div>
              </div>
              {user?.role === "admin" && (
                <Link
                  href="/dashboard/jadwal"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {jadwalList.slice(0, 4).map((jdw) => (
                <div
                  key={jdw.id}
                  className="p-3.5 rounded-2xl bg-[#fbfdfc] dark:bg-slate-800/60 border border-emerald-50 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {jdw.jamMulai && jdw.jamMulai !== "-" ? (
                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 shadow-xs border border-emerald-100 dark:border-slate-600 text-center shrink-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-white block">
                          {jdw.jamMulai}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{jdw.jamSelesai}</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 shadow-xs border border-emerald-100 dark:border-slate-600 text-center shrink-0">
                        <BookOpen className="h-4 w-4 text-emerald-600 mx-auto" />
                        <span className="text-[10px] text-slate-400 block">KBM</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {jdw.mapel}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {jdw.guruNama}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shrink-0 border border-emerald-100">
                    {jdw.kelas}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {user?.role === "admin" ? (
              <Link
                href="/dashboard/siswa"
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-emerald-200/80 hover:border-emerald-500 hover:shadow-md transition-all group"
              >
                <Users className="h-6 w-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Direktori Santri</h3>
                <p className="mt-1 text-xs text-slate-500">Master data kesiswaan & NISN</p>
              </Link>
            ) : (
              <Link
                href="/dashboard/presensi"
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-emerald-200/80 hover:border-emerald-500 hover:shadow-md transition-all group"
              >
                <CalendarCheck2 className="h-6 w-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Presensi Harian</h3>
                <p className="mt-1 text-xs text-slate-500">Pencatatan kehadiran santri</p>
              </Link>
            )}

            <Link
              href="/dashboard/lms"
              className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-transparent to-transparent border border-teal-200/80 hover:border-teal-500 hover:shadow-md transition-all group"
            >
              <BookOpenCheck className="h-6 w-6 text-teal-700 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">LMS & Bank Soal</h3>
              <p className="mt-1 text-xs text-slate-500">Materi, tugas & ujian CBT terstandar</p>
            </Link>

            {user?.role === "guru" ? (
              <Link
                href="/dashboard/nilai"
                className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-transparent border border-amber-200/80 hover:border-amber-500 hover:shadow-md transition-all group"
              >
                <Award className="h-6 w-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">E-Rapor Digital</h3>
                <p className="mt-1 text-xs text-slate-500">Penilaian akademik & akhlak</p>
              </Link>
            ) : (
              <Link
                href="/dashboard/spp-transportasi"
                className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-transparent border border-amber-200/80 hover:border-amber-500 hover:shadow-md transition-all group"
              >
                <Wallet className="h-6 w-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">SPP & Kas Sekolah</h3>
                <p className="mt-1 text-xs text-slate-500">Administrasi pembayaran terintegrasi</p>
              </Link>
            )}
          </div>
        </div>

        {/* Right 1 Col: Announcements & Student Profile */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Maklumat & Pengumuman</h2>
              </div>
              <Link
                href="/dashboard/pengumuman"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Semua
              </Link>
            </div>

            <div className="space-y-3.5">
              {pengumumanList.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#fbfdfc] dark:bg-slate-800/40 border border-emerald-50 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200/40">
                      {item.kategori}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.tanggal}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {item.judul}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{item.konten}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Profile Quick View if Siswa or Ortu */}
          {(user?.role === "siswa" || user?.role === "ortu") && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-slate-800 dark:to-slate-900 border border-emerald-200/80 shadow-xs">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Kartu Santri SDI</span>
              </p>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={currentSiswa.avatar}
                  alt={currentSiswa.nama}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{currentSiswa.nama}</h4>
                  <p className="text-xs text-emerald-800/80 font-medium">NISN: {currentSiswa.nisn} • {currentSiswa.kelas}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-emerald-100 dark:border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span>Wali Kelas:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">Ustadzah Siti Nurhaliza, M.Si.</span>
                </div>
                <div className="flex justify-between">
                  <span>Presensi & Kedisiplinan:</span>
                  <span className="font-semibold text-emerald-700">Mumtaz (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Status SPP Bulan Ini:</span>
                  <span className="font-semibold text-emerald-700">Lunas</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
