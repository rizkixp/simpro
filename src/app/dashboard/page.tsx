"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { formatRupiah } from "@/lib/utils";
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
  } = useSchoolData();

  // Statistics calculation scoped to teacher class if role is guru
  const scopedSiswaList = teacherScope.isTeacher
    ? teacherScope.filterByClass(siswaList)
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
  const currentSiswa = siswaList.find(
    (s) => s.nisn === user?.nisnOrNip || s.nama.toLowerCase().includes("ahmad rizky")
  ) || siswaList[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Islamic Emerald & Gold */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#06281e] text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/20 border border-emerald-600/30">
        {/* Subtle Islamic Arabesque Pattern */}
        <div className="absolute inset-0 opacity-10 bg-islamic-pattern pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 backdrop-blur-md text-xs font-semibold text-emerald-200 mb-3.5 border border-emerald-500/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SD Islam Smart School</span>
              <span className="text-emerald-400/40">•</span>
              <span className="text-amber-300 font-medium">1447 H / TA {profile.tahunAjaranAktif}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Assalamu'alaikum, {user?.name}
              <span className="text-amber-300 inline-block animate-pulse">✨</span>
            </h1>
            <p className="mt-2 text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              {user?.role === "admin"
                ? "Selamat datang di Panel SIM SDI Smart School. Pantau pembinaan santri, administrasi asatidz, dan operasional madrasah terintegrasi."
                : user?.role === "guru"
                ? `Wali Kelas ${teacherScope.assignedClass || "Binaan"}. Kelola data murid, presensi sholat & pembelajaran, serta penilaian e-rapor kelas Anda.`
                : "Akses riwayat kehadiran, nilai e-rapor, jadwal pelajaran, pembiasaan ibadah harian, dan informasi SPP sekolah."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {user?.role === "admin" ? (
              <Link
                href="/dashboard/siswa"
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-semibold text-xs shadow-md transition-all flex items-center gap-2 group"
              >
                <PlusCircle className="h-4 w-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                <span>Tambah Siswa</span>
              </Link>
            ) : user?.role === "guru" ? (
              <Link
                href="/dashboard/nilai"
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Award className="h-4 w-4 text-slate-900" />
                <span>E-Rapor {teacherScope.assignedClass}</span>
              </Link>
            ) : null}
            <Link
              href="/dashboard/presensi"
              className="px-4 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/60 border border-emerald-400/40 text-white font-semibold text-xs transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <CalendarCheck2 className="h-4 w-4 text-amber-300" />
              <span>Presensi Hari Ini</span>
            </Link>
          </div>
        </div>

        {/* Decorative ambient glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Stat 1: Siswa */}
        <Link
          href="/dashboard/siswa"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400">
              {teacherScope.isTeacher ? `Santri Kelas ${teacherScope.assignedClass}` : "Total Santri & Siswa"}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-950 dark:text-white">{totalSiswa} Siswa</p>
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
              <TrendingUp className="h-3 w-3" />
              <span>
                {teacherScope.isTeacher
                  ? `Wali: ${teacherScope.teacherName} \u2192`
                  : `Terbagi dalam ${totalKelas} Rombel Kelas \u2192`}
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="h-6 w-6" />
          </div>
        </Link>

        {/* Stat 2: Guru / Asatidz */}
        {user?.role === "guru" ? (
          <Link
            href="/dashboard/nilai"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-950 shadow-xs flex items-center justify-between hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-400">
                Mapel Diampu: {teacherScope.assignedSubjects.join(", ") || "Tematik & Agama"}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">E-Rapor Karakter</p>
              <p className="mt-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 group-hover:underline">
                Kelola Nilai {teacherScope.assignedClass} &rarr;
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="h-6 w-6" />
            </div>
          </Link>
        ) : (
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

        {/* Stat 4: Keuangan / SPP / Tabungan */}
        {user?.role === "guru" ? (
          <Link
            href="/dashboard/jadwal"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100/90 dark:border-emerald-950 shadow-xs flex items-center justify-between hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-emerald-800/70 dark:text-emerald-400">Jadwal KBM Kelas</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {teacherScope.filterByClass(jadwalList).length} Sesi KBM
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                Jadwal Rombel {teacherScope.assignedClass} &rarr;
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
              <Link
                href="/dashboard/jadwal"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
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
            <Link
              href="/dashboard/siswa"
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-emerald-200/80 hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <Users className="h-6 w-6 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Direktori Santri</h3>
              <p className="mt-1 text-xs text-slate-500">Master data kesiswaan & NISN</p>
            </Link>

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
  );
}
