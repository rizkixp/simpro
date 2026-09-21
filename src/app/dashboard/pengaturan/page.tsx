"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { SchoolProfile } from "@/types/school";
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  School,
  ShieldCheck,
  Cloud,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowDownToLine,
  UploadCloud,
  Server,
  Activity,
  Lock,
  Key,
  GraduationCap,
  Image as ImageIcon,
  Upload,
  Trash2,
  Layout,
  Sparkles,
  BookOpen,
  Eye,
  Link as LinkIcon,
  Monitor,
  Check,
} from "lucide-react";

export default function PengaturanPage() {
  const { user } = useAuth();
  const {
    profile,
    updateProfile,
    resetToDefault,
    isSupabaseConnected,
    isSyncing,
    lastSyncTime,
    supabaseError,
    syncWithSupabase,
    seedDatabaseToCloud,
    testSupabaseHealth,
  } = useSchoolData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<SchoolProfile>({
    ...profile,
    appName: profile?.appName || "SIM Sekolah PRO",
    appTagline: profile?.appTagline || "Sistem Informasi Manajemen Sekolah Terpadu",
    appLogoUrl: profile?.appLogoUrl || "",
    appIconPreset: profile?.appIconPreset || "graduation",
    landingHeroBadge: profile?.landingHeroBadge || "Platform Manajemen Sekolah Generasi Terbaru #1",
    landingHeroTitle: profile?.landingHeroTitle || "Transformasi Digital Pendidikan yang Cerdas, Efisien & Terpadu",
    landingHeroSubtitle: profile?.landingHeroSubtitle || "Kelola seluruh ekosistem sekolah dari administrasi siswa, tenaga pendidik, absensi digital, e-rapor, hingga tagihan SPP dalam satu platform modern berkecepatan tinggi.",
    landingCtaText: profile?.landingCtaText || "Buka Portal & Form Login",
    landingShowDemoButton: profile?.landingShowDemoButton !== undefined ? profile.landingShowDemoButton : true,
    landingFooterText: profile?.landingFooterText || "SIM Sekolah PRO - Sistem Informasi Manajemen Sekolah Terpadu. All rights reserved.",
  });

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        ...profile,
        appName: profile.appName || prev.appName || "SIM Sekolah PRO",
        appTagline: profile.appTagline || prev.appTagline || "Sistem Informasi Manajemen Sekolah Terpadu",
        appLogoUrl: profile.appLogoUrl !== undefined ? profile.appLogoUrl : prev.appLogoUrl,
        appIconPreset: profile.appIconPreset || prev.appIconPreset || "graduation",
        landingHeroBadge: profile.landingHeroBadge || prev.landingHeroBadge || "Platform Manajemen Sekolah Generasi Terbaru #1",
        landingHeroTitle: profile.landingHeroTitle || prev.landingHeroTitle || "Transformasi Digital Pendidikan yang Cerdas, Efisien & Terpadu",
        landingHeroSubtitle: profile.landingHeroSubtitle || prev.landingHeroSubtitle || "Kelola seluruh ekosistem sekolah dari administrasi siswa, tenaga pendidik, absensi digital, e-rapor, hingga tagihan SPP dalam satu platform modern berkecepatan tinggi.",
        landingCtaText: profile.landingCtaText || prev.landingCtaText || "Buka Portal & Form Login",
        landingShowDemoButton: profile.landingShowDemoButton !== undefined ? profile.landingShowDemoButton : (prev.landingShowDemoButton !== undefined ? prev.landingShowDemoButton : true),
        landingFooterText: profile.landingFooterText || prev.landingFooterText || "SIM Sekolah PRO - Sistem Informasi Manajemen Sekolah Terpadu. All rights reserved.",
      }));
    }
  }, [profile]);

  const [isSaved, setIsSaved] = useState(false);
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file logo maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setFormData((prev) => ({ ...prev, appLogoUrl: base64Url }));
    };
    reader.readAsDataURL(file);
  };

  const canEdit = user?.role === "admin";

  const handleTestConnection = async () => {
    setTestingHealth(true);
    try {
      const res = await testSupabaseHealth();
      setHealthResult(res);
    } catch (e: any) {
      setHealthResult({ isConnected: false, latencyMs: 0, error: e.message });
    } finally {
      setTestingHealth(false);
    }
  };

  const handleManualSync = async () => {
    setSyncStatusMsg(null);
    try {
      await syncWithSupabase();
      setSyncStatusMsg({ text: "Berhasil menarik data terbaru dari Supabase Cloud!", type: "success" });
    } catch (e: any) {
      setSyncStatusMsg({ text: e.message || "Gagal menarik data dari cloud", type: "error" });
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleSeedCloud = async () => {
    if (!confirm("Apakah Anda yakin ingin menyinkronkan / mengunggah seluruh data sekolah saat ini ke Cloud Supabase?")) return;
    setSyncStatusMsg(null);
    try {
      const ok = await seedDatabaseToCloud();
      if (ok) {
        setSyncStatusMsg({ text: "Seluruh data sekolah berhasil diunggah ke Supabase Cloud!", type: "success" });
      } else {
        setSyncStatusMsg({ text: "Gagal mengunggah data ke Supabase", type: "error" });
      }
    } catch (e: any) {
      setSyncStatusMsg({ text: e.message || "Gagal mengunggah data", type: "error" });
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (
      confirm(
        "Apakah Anda yakin ingin mereset seluruh database simulasi ke pengaturan bawaan awal?"
      )
    ) {
      resetToDefault();
      setFormData({ ...profile });
      alert("Database sekolah berhasil di-reset ke data bawaan awal!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-slate-700 dark:text-slate-300" />
            <span>Pengaturan & Profil Satuan Pendidikan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi identitas lembaga sekolah, legalitas NPSN, kalender akademik, dan semester aktif.
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Profil dan konfigurasi sekolah berhasil diperbarui secara permanen!</span>
        </div>
      )}

      {syncStatusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
            syncStatusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {syncStatusMsg.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{syncStatusMsg.text}</span>
        </div>
      )}

      {/* Supabase Cloud Database Card */}
      <div className="bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 rounded-3xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-sm">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Database Cloud Terpusat (Supabase PostgreSQL)
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isSyncing
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                      : isSupabaseConnected
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  }`}
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Menyinkronkan...</span>
                    </>
                  ) : isSupabaseConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Cloud Online & Terhubung</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Mode Offline</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Seluruh data akademik, keuangan, LMS, dan akun pengguna tersimpan secara persisten di cloud agar dapat diakses bersama secara online.
              </p>
            </div>
          </div>
        </div>

        {/* Server & Connection Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block">
              Endpoint Project Supabase
            </span>
            <div className="font-mono text-emerald-800 dark:text-emerald-300 font-semibold truncate text-[11px]">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bzokswukvykpadmvvwsb.supabase.co"}
            </div>
            <span className="text-[10px] text-slate-400">PostgreSQL Cloud Database</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block">
              Terakhir Disinkronkan
            </span>
            <div className="text-slate-800 dark:text-white font-semibold text-xs">
              {lastSyncTime ? lastSyncTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB" : "Baru saja diinisialisasi"}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
              {isSupabaseConnected ? "Sinkronisasi otomatis aktif" : "Menunggu koneksi..."}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block">
              Struktur Database
            </span>
            <div className="text-slate-800 dark:text-white font-semibold text-xs flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>26 Tabel Lengkap</span>
            </div>
            <span className="text-[10px] text-slate-400">Row Level Security (RLS) Aktif</span>
          </div>
        </div>

        {/* Diagnostic Results Box */}
        {healthResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            healthResult.isConnected
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>Hasil Diagnostik Koneksi Cloud:</span>
              </span>
              <span className="font-mono text-[11px] font-semibold bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-inherit">
                Latensi: {healthResult.latencyMs} ms
              </span>
            </div>
            {healthResult.isConnected ? (
              <div className="text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
                <span>Koneksi sukses!</span>
                {healthResult.tableCounts && (
                  <>
                    <span>Siswa: <b>{healthResult.tableCounts.siswa}</b></span>
                    <span>Guru: <b>{healthResult.tableCounts.guru}</b></span>
                    <span>Kelas: <b>{healthResult.tableCounts.kelas}</b></span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Gagal: {healthResult.error || "Tidak dapat menghubungi server Supabase."}
              </p>
            )}
          </div>
        )}

        {/* Action Controls for Cloud Database */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingHealth}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition-all flex items-center gap-2 shadow-xs"
          >
            {testingHealth ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>{testingHealth ? "Menguji..." : "Uji Koneksi Cloud"}</span>
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Tarik Data dari Cloud</span>
          </button>

          <button
            type="button"
            onClick={handleSeedCloud}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-sm shadow-emerald-700/20"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Sinkronisasi / Unggah Data ke Cloud</span>
          </button>
        </div>
      </div>

      {/* Security Hardening & Cryptography Card */}
      <div className="bg-gradient-to-br from-white via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 rounded-3xl border border-blue-200/80 dark:border-blue-800/60 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Audit Keamanan & Kriptografi Data Sistem
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Sistem Terenkripsi & Terlindungi</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Standar proteksi kriptografi Web Crypto API, anti-tamper sesi, dan Row Level Security (RLS) PostgreSQL.
              </p>
            </div>
          </div>
        </div>

        {/* Security Metric Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 block">Enkripsi Kata Sandi</span>
            <div className="text-slate-800 dark:text-white font-semibold text-xs flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Salted SHA-256 + 16-Byte Salt</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Auto-upgrade Transparan Aktif</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 block">Integritas Sesi & Hak Akses</span>
            <div className="text-slate-800 dark:text-white font-semibold text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anti-Tamper Role Guard</span>
            </div>
            <span className="text-[10px] text-slate-400">Verifikasi otoritas terhadap database cloud</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 block">Keamanan Cloud Database</span>
            <div className="text-slate-800 dark:text-white font-semibold text-xs flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              <span>Row Level Security (RLS)</span>
            </div>
            <span className="text-[10px] text-slate-400">Script RLS: supabase/security_rules.sql</span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Section: Identitas & Branding Aplikasi */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50/50 to-white dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-900 border border-blue-200/70 dark:border-blue-900/50 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                  <Layout className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Identitas & Branding Aplikasi
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kustomisasi nama sistem, tagline, dan logo/ikon yang tampil pada Sidebar, Header, dan Halaman Login.
                  </p>
                </div>
              </div>
            </div>

            {/* Nama & Tagline Aplikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Aplikasi / Judul Sistem
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.appName || ""}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  placeholder="Contoh: SIM Sekolah PRO atau SIM SDI Cendekia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ditampilkan di sudut kiri atas Sidebar, Header Dashboard, dan tab browser.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Subjudul Aplikasi
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.appTagline || ""}
                  onChange={(e) => setFormData({ ...formData, appTagline: e.target.value })}
                  placeholder="Contoh: Sistem Informasi Manajemen Sekolah Terpadu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Keterangan ringkas di bawah nama aplikasi.
                </p>
              </div>
            </div>

            {/* Logo & Ikon Aplikasi */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-4">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Logo / Ikon Aplikasi
              </label>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Logo Upload & URL Options */}
                <div className="lg:col-span-7 space-y-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                      disabled={!canEdit}
                    />
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Unggah Gambar Logo (Max 2MB)</span>
                    </button>

                    {formData.appLogoUrl && (
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => setFormData({ ...formData, appLogoUrl: "" })}
                        className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 font-semibold text-xs transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Logo Gambar</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Atau Masukkan Tautan (URL) Gambar Logo:
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="url"
                        disabled={!canEdit}
                        value={formData.appLogoUrl || ""}
                        onChange={(e) => setFormData({ ...formData, appLogoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Preset Icons Selection (Fallback if no custom image logo) */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                      Preset Ikon (Digunakan jika tidak ada gambar logo khusus):
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "graduation", label: "Topi Toga", icon: <GraduationCap className="h-4 w-4" /> },
                        { id: "school", label: "Gedung Sekolah", icon: <School className="h-4 w-4" /> },
                        { id: "book", label: "Buku Terbuka", icon: <BookOpen className="h-4 w-4" /> },
                        { id: "shield", label: "Perisai", icon: <ShieldCheck className="h-4 w-4" /> },
                        { id: "sparkles", label: "Bintang / Prestasi", icon: <Sparkles className="h-4 w-4" /> },
                      ].map((preset) => {
                        const isSelected = (formData.appIconPreset || "graduation") === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setFormData({ ...formData, appIconPreset: preset.id as any })}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {preset.icon}
                            <span>{preset.label}</span>
                            {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pratinjau Tampilan (Live Preview)
                  </span>

                  {/* Sidebar Style Preview (Dark) */}
                  <div className="p-3 rounded-xl bg-[#06241b] text-white flex items-center gap-3 border border-emerald-900/50">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      {formData.appLogoUrl ? (
                        <img
                          src={formData.appLogoUrl}
                          alt="Logo Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-white">
                          {formData.appIconPreset === "school" && <School className="h-5 w-5" />}
                          {formData.appIconPreset === "book" && <BookOpen className="h-5 w-5" />}
                          {formData.appIconPreset === "shield" && <ShieldCheck className="h-5 w-5" />}
                          {formData.appIconPreset === "sparkles" && <Sparkles className="h-5 w-5" />}
                          {(!formData.appIconPreset || formData.appIconPreset === "graduation") && <GraduationCap className="h-5 w-5" />}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white truncate leading-tight">
                        {formData.appName || "SIM Sekolah PRO"}
                      </p>
                      <p className="text-[10px] text-emerald-300/80 truncate">
                        {formData.appTagline || "Sistem Informasi Manajemen"}
                      </p>
                    </div>
                  </div>

                  {/* Header / Light Style Preview */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center gap-2.5 border border-slate-200 dark:border-slate-700">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {formData.appLogoUrl ? (
                        <img
                          src={formData.appLogoUrl}
                          alt="Logo Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div>
                          {formData.appIconPreset === "school" && <School className="h-4 w-4" />}
                          {formData.appIconPreset === "book" && <BookOpen className="h-4 w-4" />}
                          {formData.appIconPreset === "shield" && <ShieldCheck className="h-4 w-4" />}
                          {formData.appIconPreset === "sparkles" && <Sparkles className="h-4 w-4" />}
                          {(!formData.appIconPreset || formData.appIconPreset === "graduation") && <GraduationCap className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate leading-tight">
                        {formData.appName || "SIM Sekolah PRO"}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                        {formData.appTagline || "Sistem Informasi Manajemen"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Kustomisasi Tampilan Awal (Landing Page) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-slate-50/40 to-white dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/70 dark:border-indigo-900/50 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kustomisasi Tampilan Awal (Landing Page)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Atur teks sambutan, judul banner hero, deskripsi, dan tombol aksi pada halaman depan (/) aplikasi.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Badge Hero */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Badge Status / Pengumuman Singkat
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.landingHeroBadge || ""}
                  onChange={(e) => setFormData({ ...formData, landingHeroBadge: e.target.value })}
                  placeholder="Contoh: Platform Manajemen Sekolah Generasi Terbaru #1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Pita kecil di atas judul utama dengan indikator titik hijau berdenyut.
                </p>
              </div>

              {/* Judul Utama Hero */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Utama Hero (Hero Heading)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.landingHeroTitle || ""}
                  onChange={(e) => setFormData({ ...formData, landingHeroTitle: e.target.value })}
                  placeholder="Contoh: Transformasi Digital Pendidikan yang Cerdas, Efisien & Terpadu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              {/* Subjudul / Deskripsi Hero */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Paragraf Sambutan
                </label>
                <textarea
                  rows={3}
                  disabled={!canEdit}
                  value={formData.landingHeroSubtitle || ""}
                  onChange={(e) => setFormData({ ...formData, landingHeroSubtitle: e.target.value })}
                  placeholder="Tuliskan pengantar singkat tentang fasilitas dan sistem sekolah..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Tombol Aksi & Demo Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Tombol Masuk Sistem (Login)
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.landingCtaText || ""}
                    onChange={(e) => setFormData({ ...formData, landingCtaText: e.target.value })}
                    placeholder="Buka Portal & Form Login"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opsi Tombol Demo Dashboard Langsung
                  </label>
                  <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={formData.landingShowDemoButton ?? true}
                      onChange={(e) => setFormData({ ...formData, landingShowDemoButton: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      Tampilkan tombol &ldquo;Lihat Demo Dashboard Langsung&rdquo;
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nonaktifkan jika ingin pengunjung wajib login terlebih dahulu melalui form login.
                  </p>
                </div>
              </div>

              {/* Teks Footer */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Hak Cipta / Footer Tampilan Awal
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.landingFooterText || ""}
                  onChange={(e) => setFormData({ ...formData, landingFooterText: e.target.value })}
                  placeholder="SIM Sekolah PRO - Sistem Informasi Manajemen Sekolah Terpadu. All rights reserved."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Identitas Sekolah */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <School className="h-4 w-4 text-blue-600" />
              <span>Identitas & Legalitas Sekolah</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Resmi Sekolah / Yayasan
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.namaSekolah}
                  onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Pokok Sekolah Nasional (NPSN)
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.npsn}
                  onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peringkat Akreditasi BAN-S/M
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.akreditasi}
                  onChange={(e) => setFormData({ ...formData, akreditasi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kepala Sekolah & Gelar
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.kepalaSekolah}
                  onChange={(e) => setFormData({ ...formData, kepalaSekolah: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kontak & Alamat */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              Informasi Alamat & Kontak Resmi
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap Gedung Sekolah
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Telepon Kantor
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Kontak Resmi
                  </label>
                  <input
                    type="email"
                    disabled={!canEdit}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Website Resmi
                  </label>
                  <input
                    type="url"
                    disabled={!canEdit}
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Tahun Ajaran & Semester */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              Konfigurasi Kalender Akademik
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Ajaran Aktif
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.tahunAjaranAktif}
                  onChange={(e) => setFormData({ ...formData, tahunAjaranAktif: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  placeholder="2025/2026"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Semester Aktif
                </label>
                <select
                  disabled={!canEdit}
                  value={formData.semesterAktif}
                  onChange={(e) => setFormData({ ...formData, semesterAktif: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition-all flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Database ke Default</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan Profil & Aplikasi</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
