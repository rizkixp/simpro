"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { Siswa, Guru } from "@/types/school";
import {
  Search,
  X,
  Sparkles,
  User,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  PiggyBank,
  BookCheck,
  ShieldCheck,
  Settings,
  LogOut,
  ArrowRight,
  CornerDownLeft,
  Phone,
  QrCode,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Command,
  Layers,
  FileText,
  Bell,
  HeartHandshake,
  Check,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

type PaletteCategory = "semua" | "siswa" | "guru" | "modul" | "aksi";

interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  category: "modul";
  roles: string[];
  keywords: string[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  category: "aksi";
  badge?: string;
  color?: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { siswaList, guruList, syncWithSupabase, isSyncing } = useSchoolData();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PaletteCategory>("semua");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSiswaPreview, setSelectedSiswaPreview] = useState<Siswa | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // 1. Daftar Navigasi Modul Lengkap (Role-Aware)
  const navigationItems: NavigationItem[] = useMemo(
    () => [
      {
        id: "mod-beranda",
        title: "Beranda Utama",
        description: "Dashboard statistik, ringkasan akademik & kehadiran",
        icon: Sparkles,
        path: "/dashboard",
        category: "modul",
        roles: ["admin", "guru", "siswa", "ortu"],
        keywords: ["dashboard", "home", "beranda", "statistik", "utama"],
      },
      {
        id: "mod-siswa",
        title: "Data Siswa & Santri",
        description: "Direktori siswa, cetak kartu pelajar & impor data",
        icon: GraduationCap,
        path: "/dashboard/siswa",
        category: "modul",
        roles: ["admin", "guru"],
        keywords: ["siswa", "santri", "murid", "pelajar", "nisn", "anak"],
      },
      {
        id: "mod-guru",
        title: "Pendidik & Staf (Guru)",
        description: "Data tenaga pengajar, NIP, gelar & tugas mengajar",
        icon: Users,
        path: "/dashboard/guru",
        category: "modul",
        roles: ["admin", "guru"],
        keywords: ["guru", "ustadz", "ustadzah", "staf", "pegawai", "nip"],
      },
      {
        id: "mod-kelas",
        title: "Rombel & Ruang Kelas",
        description: "Manajemen rombongan belajar, wali kelas & kuota",
        icon: Layers,
        path: "/dashboard/kelas",
        category: "modul",
        roles: ["admin"],
        keywords: ["kelas", "rombel", "ruang", "wali kelas"],
      },
      {
        id: "mod-jadwal",
        title: "Jadwal Pelajaran KBM",
        description: "Alokasi jam mata pelajaran per hari dan jam mengajar",
        icon: Calendar,
        path: "/dashboard/jadwal",
        category: "modul",
        roles: ["admin", "guru", "siswa", "ortu"],
        keywords: ["jadwal", "pelajaran", "kbm", "jam", "hari", "mapel"],
      },
      {
        id: "mod-presensi",
        title: "Presensi Digital & Barcode",
        description: "Scanner kartu QR/RFID, rekap kehadiran & izin siswa",
        icon: Clock,
        path: "/dashboard/presensi",
        category: "modul",
        roles: ["admin", "guru", "siswa", "ortu"],
        keywords: ["presensi", "absen", "kehadiran", "scan", "rfid", "barcode", "qr"],
      },
      {
        id: "mod-nilai",
        title: "Penilaian & E-Rapor",
        description: "Input nilai sumatif, formatif, cetak rapor Kurikulum Merdeka",
        icon: FileText,
        path: "/dashboard/nilai",
        category: "modul",
        roles: ["admin", "guru", "siswa", "ortu"],
        keywords: ["nilai", "rapor", "leger", "sumatif", "formatif", "kkm"],
      },
      {
        id: "mod-spp",
        title: "SPP & Kasir Tagihan",
        description: "Pembayaran SPP, bus antar-jemput, kuitansi & QRIS Midtrans",
        icon: DollarSign,
        path: "/dashboard/spp-transportasi",
        category: "modul",
        roles: ["admin", "bendahara", "ortu", "siswa"],
        keywords: ["spp", "bayar", "tagihan", "bus", "transportasi", "uang", "qris", "midtrans"],
      },
      {
        id: "mod-keuangan",
        title: "Buku Kas & Keuangan Sekolah",
        description: "Pemasukan, pengeluaran, laba rugi & laporan kasir",
        icon: CreditCard,
        path: "/dashboard/keuangan",
        category: "modul",
        roles: ["admin", "bendahara"],
        keywords: ["kas", "keuangan", "pemasukan", "pengeluaran", "anggaran", "biaya"],
      },
      {
        id: "mod-tabungan",
        title: "Tabungan Siswa",
        description: "Buku tabungan santri, mutasi debit/kredit saldo",
        icon: PiggyBank,
        path: "/dashboard/tabungan",
        category: "modul",
        roles: ["admin", "bendahara", "guru", "ortu", "siswa"],
        keywords: ["tabungan", "saldo", "debit", "kredit", "simpanan", "uang"],
      },
      {
        id: "mod-tahfidz",
        title: "Tahfidz Al-Qur'an",
        description: "Pencatatan setoran juz, surat, ayat & mutqin hafalan",
        icon: BookCheck,
        path: "/dashboard/tahfidz",
        category: "modul",
        roles: ["admin", "guru", "ortu", "siswa"],
        keywords: ["tahfidz", "quran", "juz", "surat", "ayat", "hafalan", "ziyadah", "murajaah"],
      },
      {
        id: "mod-mutabaah",
        title: "Mutaba'ah Yaumiyah",
        description: "Monitoring ibadah harian: shalat 5 waktu, dhuha, tadarus",
        icon: HeartHandshake,
        path: "/dashboard/mutabaah",
        category: "modul",
        roles: ["admin", "guru", "ortu", "siswa"],
        keywords: ["mutabaah", "ibadah", "shalat", "dhuha", "tahajud", "puasa", "harian"],
      },
      {
        id: "mod-lms",
        title: "LMS & E-Learning",
        description: "Bank materi, tugas online, kuis & forum diskusi",
        icon: BookOpen,
        path: "/dashboard/lms",
        category: "modul",
        roles: ["admin", "guru", "siswa"],
        keywords: ["lms", "materi", "tugas", "kuis", "soal", "ujian", "belajar"],
      },
      {
        id: "mod-pengumuman",
        title: "Papan Pengumuman",
        description: "Informasi resmi sekolah, agenda libur & kegiatan",
        icon: Bell,
        path: "/dashboard/pengumuman",
        category: "modul",
        roles: ["admin", "guru", "ortu", "siswa", "bendahara"],
        keywords: ["pengumuman", "berita", "agenda", "libur", "kegiatan", "info"],
      },
      {
        id: "mod-pengguna",
        title: "Manajemen Pengguna",
        description: "Kelola akun pengguna, reset sandi & role RBAC",
        icon: ShieldCheck,
        path: "/dashboard/pengguna",
        category: "modul",
        roles: ["admin"],
        keywords: ["pengguna", "user", "akun", "sandi", "password", "role", "admin"],
      },
      {
        id: "mod-pengaturan",
        title: "Pengaturan & Cloud Sync",
        description: "Identitas sekolah, WhatsApp Gateway & koneksi database",
        icon: Settings,
        path: "/dashboard/pengaturan",
        category: "modul",
        roles: ["admin"],
        keywords: ["pengaturan", "setting", "profil", "sekolah", "whatsapp", "cloud", "sync"],
      },
    ],
    []
  );

  // 2. Daftar Aksi Cepat Cerdas (Quick Actions)
  const actionItems: ActionItem[] = useMemo(
    () => [
      {
        id: "act-scan",
        title: "Buka Terminal Scanner Presensi",
        description: "Langsung nyalakan kamera QR & barcode scanner kartu siswa",
        icon: QrCode,
        badge: "Absensi",
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200",
        action: () => {
          setIsOpen(false);
          router.push("/dashboard/presensi");
        },
        category: "aksi",
      },
      {
        id: "act-bayar",
        title: "Buka Kasir SPP / Bayar Tagihan",
        description: "Lihat daftar siswa menunggak dan buat pembayaran Snap QRIS",
        icon: DollarSign,
        badge: "Keuangan",
        color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200",
        action: () => {
          setIsOpen(false);
          router.push("/dashboard/spp-transportasi");
        },
        category: "aksi",
      },
      {
        id: "act-tahfidz",
        title: "Catat Setoran Hafalan Baru",
        description: "Input penilaian ziyadah atau muraja'ah santri",
        icon: BookCheck,
        badge: "Tahfidz",
        color: "text-teal-600 bg-teal-50 dark:bg-teal-950/60 border-teal-200",
        action: () => {
          setIsOpen(false);
          router.push("/dashboard/tahfidz");
        },
        category: "aksi",
      },
      {
        id: "act-nilai",
        title: "Buka Matriks Penilaian E-Rapor",
        description: "Input nilai rapor semester ganjil/genap per rombel",
        icon: FileText,
        badge: "E-Rapor",
        color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200",
        action: () => {
          setIsOpen(false);
          router.push("/dashboard/nilai");
        },
        category: "aksi",
      },
      {
        id: "act-sync",
        title: "Sinkronisasi Paksa Supabase Cloud",
        description: "Perbarui seluruh data lokal secara langsung dengan server cloud",
        icon: RefreshCw,
        badge: "Cloud Sync",
        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200",
        action: async () => {
          setIsOpen(false);
          await syncWithSupabase();
        },
        category: "aksi",
      },
      {
        id: "act-logout",
        title: "Keluar Akun (Logout)",
        description: "Akhiri sesi login dengan aman",
        icon: LogOut,
        badge: "Keamanan",
        color: "text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200",
        action: async () => {
          setIsOpen(false);
          await logout();
          window.location.href = "/login?logout=true";
        },
        category: "aksi",
      },
    ],
    [router, syncWithSupabase, logout]
  );

  // 3. Filter Hasil Pencarian secara Real-Time
  const filteredNavigations = useMemo(() => {
    if (!user) return [];
    const allowed = navigationItems.filter((item) =>
      item.roles.includes(user.role)
    );
    if (!query.trim()) return allowed;
    const q = query.toLowerCase().trim();
    return allowed.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [navigationItems, user, query]);

  const filteredSiswa = useMemo(() => {
    if (!user || user.role === "ortu" || user.role === "siswa") {
      // Siswa/Ortu hanya bisa melihat profil sendiri/anaknya
      return [];
    }
    if (!query.trim()) return siswaList.slice(0, 4); // Rekomendasi 4 siswa awal
    const q = query.toLowerCase().trim();
    return siswaList
      .filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nisn.toLowerCase().includes(q) ||
          s.kelas.toLowerCase().includes(q) ||
          (s.namaWali && s.namaWali.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [siswaList, user, query]);

  const filteredGuru = useMemo(() => {
    if (!user || user.role === "siswa") return [];
    if (!query.trim()) return guruList.slice(0, 3);
    const q = query.toLowerCase().trim();
    return guruList
      .filter(
        (g) =>
          g.nama.toLowerCase().includes(q) ||
          g.nip.toLowerCase().includes(q) ||
          g.mataPelajaran.some((m) => m.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [guruList, user, query]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actionItems;
    const q = query.toLowerCase().trim();
    return actionItems.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [actionItems, query]);

  // Gabungkan semua item yang relevan sesuai tab kategori yang dipilih
  const aggregatedItems = useMemo(() => {
    type AnyItem =
      | { type: "modul"; data: NavigationItem }
      | { type: "siswa"; data: Siswa }
      | { type: "guru"; data: Guru }
      | { type: "aksi"; data: ActionItem };

    const items: AnyItem[] = [];

    if (activeCategory === "semua" || activeCategory === "aksi") {
      filteredActions.forEach((a) => items.push({ type: "aksi", data: a }));
    }
    if (activeCategory === "semua" || activeCategory === "modul") {
      filteredNavigations.forEach((m) => items.push({ type: "modul", data: m }));
    }
    if (activeCategory === "semua" || activeCategory === "siswa") {
      filteredSiswa.forEach((s) => items.push({ type: "siswa", data: s }));
    }
    if (activeCategory === "semua" || activeCategory === "guru") {
      filteredGuru.forEach((g) => items.push({ type: "guru", data: g }));
    }

    return items;
  }, [
    activeCategory,
    filteredActions,
    filteredNavigations,
    filteredSiswa,
    filteredGuru,
  ]);

  // Reset selected index saat pencarian atau tab berubah
  useEffect(() => {
    setSelectedIndex(0);
    setSelectedSiswaPreview(null);
  }, [query, activeCategory]);

  // Eksekusi item terpilih
  const executeItem = useCallback(
    (item: (typeof aggregatedItems)[0]) => {
      if (!item) return;

      if (item.type === "aksi") {
        item.data.action();
      } else if (item.type === "modul") {
        setIsOpen(false);
        router.push(item.data.path);
      } else if (item.type === "siswa") {
        // Tampilkan preview atau langsung navigasi ke siswa
        setSelectedSiswaPreview(item.data);
      } else if (item.type === "guru") {
        setIsOpen(false);
        router.push("/dashboard/guru");
      }
    },
    [router]
  );

  // 4. Keyboard Shortcuts: Global Listener (Ctrl+K, Cmd+K, Slash, Arrow, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Buka/Tutup dengan Ctrl+K atau Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // 2. Tombol Slash (/) saat tidak sedang mengetik di input/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (!isOpen && e.key === "/" && !isInputFocused) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Jika modal sedang terbuka, tangani navigasi keyboard di dalamnya
      if (isOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          if (selectedSiswaPreview) {
            setSelectedSiswaPreview(null);
          } else {
            setIsOpen(false);
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < aggregatedItems.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : Math.max(0, aggregatedItems.length - 1)
          );
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (aggregatedItems[selectedIndex]) {
            executeItem(aggregatedItems[selectedIndex]);
          }
        }
      }
    };

    const handleCustomTrigger = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomTrigger);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomTrigger);
    };
  }, [isOpen, aggregatedItems, selectedIndex, executeItem, selectedSiswaPreview]);

  // Auto focus input saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setActiveCategory("semua");
      setSelectedSiswaPreview(null);
    }
  }, [isOpen]);

  // Scroll otomatis agar selected item tetap berada di viewport
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const selectedEl = resultsContainerRef.current.querySelector(
      `[data-palette-index="${selectedIndex}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden animate-fadeIn">
      {/* Backdrop Glassmorphism */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Main Command Dialog Box */}
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden h-full sm:h-auto sm:max-h-[85vh] animate-scaleUp">
        {/* Top Header & Search Bar */}
        <div className="relative flex items-center px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari siswa, guru, tagihan, atau aksi cepat... (Ketik nama/nisn)"
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 mr-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 rounded-md">
            ESC
          </kbd>
          <button
            onClick={() => setIsOpen(false)}
            className="sm:hidden p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills (Tabs Filter) */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: "semua", label: "Semua Hasil" },
            { id: "siswa", label: "Siswa & Santri" },
            { id: "guru", label: "Guru & Staf" },
            { id: "modul", label: "Modul Menu" },
            { id: "aksi", label: "Aksi Cepat" },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as PaletteCategory)}
                className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area / Two-Pane if Siswa Selected */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-[320px] max-h-[500px]">
          {/* Left Pane: Results List */}
          <div
            ref={resultsContainerRef}
            className={`flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100 dark:divide-slate-800/60 ${
              selectedSiswaPreview ? "hidden sm:block sm:w-1/2 sm:border-r border-slate-200 dark:border-slate-800" : "w-full"
            }`}
          >
            {aggregatedItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Coba kata kunci lain seperti nama siswa, NISN, atau nama modul.
                </p>
              </div>
            ) : (
              aggregatedItems.map((item, idx) => {
                const isSelected = selectedIndex === idx;

                if (item.type === "aksi") {
                  const act = item.data;
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      data-palette-index={idx}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${act.color || "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">
                              {act.title}
                            </span>
                            {act.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {act.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {act.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected
                            ? "text-emerald-600 translate-x-1"
                            : "text-slate-300 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </div>
                  );
                }

                if (item.type === "modul") {
                  const mod = item.data;
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.id}
                      data-palette-index={idx}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm block truncate">
                            {mod.title}
                          </span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {mod.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                        <span className="text-[11px] font-mono hidden md:inline">
                          {mod.path}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                }

                if (item.type === "siswa") {
                  const s = item.data;
                  return (
                    <div
                      key={s.id}
                      data-palette-index={idx}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected || selectedSiswaPreview?.id === s.id
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            s.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.nama}`
                          }
                          alt={s.nama}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">
                              {s.nama}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {s.kelas}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            NISN: {s.nisn} • Wali: {s.namaWali || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          title="Lihat Detail Cepat"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSiswaPreview(s);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 transition-colors"
                        >
                          Rincian
                        </button>
                      </div>
                    </div>
                  );
                }

                if (item.type === "guru") {
                  const g = item.data;
                  return (
                    <div
                      key={g.id}
                      data-palette-index={idx}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            g.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.nama}`
                          }
                          alt={g.nama}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-sm block truncate">
                            {g.nama}
                          </span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            NIP: {g.nip || "-"} • Mapel:{" "}
                            {g.mataPelajaran?.join(", ") || "-"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>

          {/* Right Pane: Siswa Quick Profile Card (Desktop or Mobile Overlay) */}
          {selectedSiswaPreview && (
            <div className="w-full sm:w-1/2 p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Kartu Profil Ringkas Siswa
                  </span>
                  <button
                    onClick={() => setSelectedSiswaPreview(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3.5">
                  <img
                    src={
                      selectedSiswaPreview.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSiswaPreview.nama}`
                    }
                    alt={selectedSiswaPreview.nama}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                      {selectedSiswaPreview.nama}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      NISN: <span className="font-mono">{selectedSiswaPreview.nisn}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Kelas {selectedSiswaPreview.kelas}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {selectedSiswaPreview.status || "Aktif"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info List */}
                <div className="mt-4 space-y-2 text-xs bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama Wali:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {selectedSiswaPreview.namaWali || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. HP Wali:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {selectedSiswaPreview.noHpWali || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alamat:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                      {selectedSiswaPreview.alamat || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for this Student */}
              <div className="mt-4 space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                {selectedSiswaPreview.noHpWali && (
                  <a
                    href={`https://wa.me/${selectedSiswaPreview.noHpWali.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Hubungi Wali via WhatsApp
                  </a>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push(
                      `/dashboard/siswa?search=${encodeURIComponent(selectedSiswaPreview.nama)}`
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  Buka di Menu Siswa
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/dashboard/spp-transportasi");
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold transition-colors"
                  >
                    <DollarSign className="w-3 h-3" />
                    Cek SPP
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/dashboard/nilai");
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-semibold transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Cek Rapor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Keyboard Help & Shortcut Legend */}
        <div className="hidden sm:flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono shadow-2xs">
                ↓
              </kbd>
              Pilih
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono shadow-2xs">
                ↵
              </kbd>
              Buka / Eksekusi
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono shadow-2xs">
                ESC
              </kbd>
              Tutup
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIM PRO Universal Command Center</span>
          </div>
        </div>
      </div>
    </div>
  );
}
