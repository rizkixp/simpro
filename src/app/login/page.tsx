"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/school";
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Wallet,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@sekolah.id");
  const [password, setPassword] = useState("admin123");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const demoAccounts: {
    role: UserRole;
    title: string;
    email: string;
    pass: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      role: "admin",
      title: "Admin / Kepala SDI",
      email: "admin@sekolah.id",
      pass: "admin123",
      icon: <ShieldCheck className="h-4 w-4" />,
      color: "border-emerald-600 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      role: "bendahara",
      title: "Bendahara SDI",
      email: "bendahara@sekolah.id",
      pass: "bendahara123",
      icon: <Wallet className="h-4 w-4" />,
      color: "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      role: "guru",
      title: "Guru Kelas 6 (SDI)",
      email: "guru.kelas6@sekolah.id",
      pass: "guru123",
      icon: <UserCheck className="h-4 w-4" />,
      color: "border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      role: "guru",
      title: "Asatidz / Dewan Guru",
      email: "guru@sekolah.id",
      pass: "guru123",
      icon: <UserCheck className="h-4 w-4" />,
      color: "border-teal-600 text-teal-700 bg-teal-50 dark:bg-teal-950/40",
    },
    {
      role: "siswa",
      title: "Santri / Siswa",
      email: "siswa@sekolah.id",
      pass: "siswa123",
      icon: <BookOpen className="h-4 w-4" />,
      color: "border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      role: "ortu",
      title: "Wali Murid",
      email: "ortu@sekolah.id",
      pass: "ortu123",
      icon: <HeartHandshake className="h-4 w-4" />,
      color: "border-amber-600 text-amber-700 bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Mohon masukkan email dan kata sandi Anda.");
      return;
    }

    if (password.length < 4) {
      setErrorMsg("Kata sandi minimal 4 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate network auth delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const result = await login(email, selectedRole, password);
      if (result.success) {
        setSuccessMsg("Autentikasi berhasil! Mengalihkan...");
        setTimeout(() => {
          if (selectedRole === "bendahara") {
            router.push("/dashboard/spp-transportasi");
          } else {
            router.push("/dashboard");
          }
        }, 400);
      } else {
        setErrorMsg(result.message || "Gagal masuk. Periksa email atau password.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi server. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-100 dark:bg-slate-950">
      {/* Left Column: Visual & Branding (Visible on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#064e3b] via-[#06281e] to-[#041d16] text-white flex-col justify-between p-12 overflow-hidden">
        {/* Subtle Decorative Islamic Glows & Pattern */}
        <div className="absolute inset-0 opacity-10 bg-islamic-pattern pointer-events-none" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              SIM SDI <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-400/30">ISLAMIC</span>
            </h2>
            <p className="text-xs text-emerald-200/80">SD Islam Smart School Management System</p>
          </div>
        </div>

        {/* Hero Copy & Islamic Mission */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Sekolah Dasar Islam Terpadu • Akreditasi A (Unggul)
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-white tracking-tight">
            Membina Generasi Qur'ani, Berakhlak Mulia & Cerdas Berprestasi.
          </h1>

          <p className="text-emerald-100/80 text-sm leading-relaxed">
            Sistem Informasi Manajemen Terpadu untuk Asatidz, Santri, Wali Murid, dan Tenaga Administrasi dalam memantau kegiatan ibadah harian, pembelajaran LMS, e-rapor, dan administrasi sekolah.
          </p>

          <div className="pt-4 border-t border-emerald-800/40 flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-emerald-300/80">Digital & Terstruktur</p>
            </div>
            <div className="w-px h-10 bg-emerald-800/40" />
            <div>
              <p className="text-2xl font-bold text-white">5 Peran</p>
              <p className="text-xs text-emerald-300/80">Hak Akses Terpadu</p>
            </div>
            <div className="w-px h-10 bg-emerald-800/40" />
            <div>
              <p className="text-2xl font-bold text-amber-300">1447 H</p>
              <p className="text-xs text-emerald-300/80">Tahun Ajaran Aktif</p>
            </div>
          </div>
        </div>

        {/* Islamic Quote */}
        <div className="relative z-10 p-5 rounded-2xl bg-[#093527]/80 backdrop-blur-md border border-emerald-700/40 text-xs text-emerald-100/90 leading-relaxed italic">
          &ldquo;Barangsiapa menempuh jalan untuk menuntut ilmu, maka Allah akan memudahkan jalannya menuju surga.&rdquo;
          <div className="mt-2 font-semibold not-italic text-amber-300">— HR. Muslim no. 2699</div>
        </div>
      </div>

      {/* Right Column: Professional Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-emerald-100 dark:border-slate-800 p-8 sm:p-10 transition-all">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">SIM SDI Smart School</h2>
              <p className="text-xs text-emerald-700">Portal Akses Terpadu</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Assalamu'alaikum 🌿
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Silakan pilih akun demo atau masukkan kredensial Anda.
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/70 dark:text-slate-400 mb-2">
              Akun Demo Siap Pakai (1-Klik):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  type="button"
                  key={acc.role}
                  onClick={() => handleSelectDemo(acc)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border flex items-center gap-2 text-left transition-all ${
                    selectedRole === acc.role
                      ? `${acc.color} border-2 shadow-sm font-semibold`
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="shrink-0">{acc.icon}</span>
                  <span className="truncate">{acc.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Notifications */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actual Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email / ID Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.id"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="current-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => alert("Untuk keperluan demo, Anda dapat menggunakan password default: 'admin123' atau klik tombol Akun Demo di atas.")}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="current-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium select-none">
                  Ingat saya di perangkat ini
                </span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                Peran: <span className="font-semibold text-emerald-700 capitalize">{selectedRole}</span>
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke SIM SDI</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Guarantee Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Koneksi terenkripsi SSL 256-bit & Proteksi Keamanan Multi-Tingkat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
