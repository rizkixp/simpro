"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  School,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { checkLoginRateLimit, clearLoginRateLimit } from "@/lib/security";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const { profile } = useSchoolData();

  const appName = profile?.appName || "SIM SDI Islamic";
  const appTagline = profile?.appTagline || profile?.namaSekolah || "SD Islam Smart School Management System";
  const appLogoUrl = profile?.appLogoUrl;
  const appIconPreset = profile?.appIconPreset || "graduation";

  useEffect(() => {
    // Jika URL membawa ?logout=true, bersihkan sesi lama dan jangan redirect ke dashboard
    if (typeof window !== "undefined" && window.location.search.includes("logout")) {
      logout();
      return;
    }

    if (user) {
      if (user.role === "bendahara") {
        router.push("/dashboard/spp-transportasi");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router, logout]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [timeoutNotice, setTimeoutNotice] = useState<boolean>(false);

  // Cek apakah user diarahkan karena sesi inaktif (Bank-Grade Idle Timeout)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "timeout") {
        setTimeoutNotice(true);
      }
    }
  }, []);

  // Monitor Rate Limit & Lockout countdown timer
  useEffect(() => {
    if (!email.trim()) {
      setLockoutRemaining(0);
      return;
    }

    const check = () => {
      const status = checkLoginRateLimit(email.trim());
      if (status.isLocked && status.lockoutRemainingSeconds > 0) {
        setLockoutRemaining(status.lockoutRemainingSeconds);
      } else {
        setLockoutRemaining(0);
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Proteksi jika akun sedang terkunci sementara
    const initialCheck = checkLoginRateLimit(email.trim());
    if (initialCheck.isLocked) {
      setLockoutRemaining(initialCheck.lockoutRemainingSeconds);
      setErrorMsg(initialCheck.message || "Akun sementara dikunci karena proteksi keamanan brute force.");
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg("Mohon masukkan email atau ID pengguna serta kata sandi Anda.");
      return;
    }

    if (password.length < 4) {
      setErrorMsg("Kata sandi minimal 4 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate network auth delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = await login(email, undefined, password);
      if (result.success) {
        setSuccessMsg("Autentikasi berhasil! Mengalihkan ke dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 300);
      } else {
        setErrorMsg(result.message || "Gagal masuk. Periksa kembali email atau kata sandi Anda.");
        const status = checkLoginRateLimit(email.trim());
        if (status.isLocked && status.lockoutRemainingSeconds > 0) {
          setLockoutRemaining(status.lockoutRemainingSeconds);
        }
      }
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi ke server. Silakan coba lagi.");
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
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/30 overflow-hidden shrink-0">
            {appLogoUrl ? (
              <img src={appLogoUrl} alt={appName} className="h-full w-full object-cover" />
            ) : (
              <div className="text-white">
                {appIconPreset === "school" && <School className="h-7 w-7" />}
                {appIconPreset === "book" && <BookOpen className="h-7 w-7" />}
                {appIconPreset === "shield" && <ShieldCheck className="h-7 w-7" />}
                {appIconPreset === "sparkles" && <Sparkles className="h-7 w-7" />}
                {(!appIconPreset || appIconPreset === "graduation") && <GraduationCap className="h-7 w-7" />}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              {appName}
            </h2>
            <p className="text-xs text-emerald-200/80">{appTagline}</p>
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
            <div className="h-10 w-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md overflow-hidden shrink-0">
              {appLogoUrl ? (
                <img src={appLogoUrl} alt={appName} className="h-full w-full object-cover" />
              ) : (
                <div className="text-white">
                  {appIconPreset === "school" && <School className="h-6 w-6" />}
                  {appIconPreset === "book" && <BookOpen className="h-6 w-6" />}
                  {appIconPreset === "shield" && <ShieldCheck className="h-6 w-6" />}
                  {appIconPreset === "sparkles" && <Sparkles className="h-6 w-6" />}
                  {(!appIconPreset || appIconPreset === "graduation") && <GraduationCap className="h-6 w-6" />}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white truncate">{appName}</h2>
              <p className="text-xs text-emerald-700 truncate">{appTagline}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Assalamu'alaikum 🌿
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Masukkan email atau ID pengguna dan kata sandi Anda untuk mengakses sistem.
            </p>
          </div>

          {/* Status Notifications */}
          {timeoutNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5 shadow-sm animate-fadeIn">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Sesi Berakhir Otomatis:</strong> Anda telah keluar secara otomatis demi keamanan data sekolah karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.
              </span>
            </div>
          )}

          {lockoutRemaining > 0 ? (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm animate-pulse">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Akses Dibekukan Sementara (Anti Brute-Force)
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Terdeteksi 5 kali percobaan login gagal berturut-turut. Sesuai standar keamanan perbankan (PCI-DSS), akses untuk akun ini dikunci sementara demi melindungi data sekolah.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-200/70 dark:bg-amber-900/60 font-mono font-bold text-xs text-amber-950 dark:text-amber-100 border border-amber-300/50">
                    <Clock className="h-3.5 w-3.5" /> Waktu tunggu: {Math.floor(lockoutRemaining / 60)} menit {lockoutRemaining % 60} detik
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearLoginRateLimit(email.trim());
                      setLockoutRemaining(0);
                      setErrorMsg(null);
                    }}
                    className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Buka Kunci Sekarang
                  </button>
                </div>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

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
                Email / ID Pengguna / NISN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.id atau NISN/NIP"
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
                  onClick={() => alert("Silakan hubungi administrator atau staf TU SDI Smart School untuk bantuan pemulihan kata sandi akun Anda.")}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium select-none">
                  Ingat saya di perangkat ini
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || lockoutRemaining > 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : lockoutRemaining > 0 ? (
                  <>
                    <ShieldAlert className="h-4 w-4 text-amber-300 animate-pulse" />
                    <span>Terkunci Sementara ({Math.floor(lockoutRemaining / 60)}m {lockoutRemaining % 60}s)</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke SIM SDI</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Accounts Helper */}
            <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Pilihan Akun Cepat:
                </span>
                <span className="text-[10px] text-slate-400">Klik untuk isi otomatis</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("rizkixp@gmail.com");
                    setPassword("admin123");
                  }}
                  className="p-2 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 truncate">
                    👑 Rizki XP (Admin)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@sekolah.id");
                    setPassword("admin123");
                  }}
                  className="p-2 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 truncate">
                    🛡️ Admin Sekolah
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("bendahara@sekolah.id");
                    setPassword("bendahara123");
                  }}
                  className="p-2 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 truncate">
                    💼 Bendahara
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">bendahara123</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("guru@sekolah.id");
                    setPassword("guru123");
                  }}
                  className="p-2 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 truncate">
                    📖 Guru / Walas
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">guru123</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("siswa@sekolah.id");
                    setPassword("siswa123");
                  }}
                  className="p-2 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 truncate">
                    🎓 Siswa
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">siswa123</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("ortu@sekolah.id");
                    setPassword("ortu123");
                  }}
                  className="p-2 text-xs text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 truncate">
                    👨‍👩‍👧 Wali Murid
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">ortu123</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("0017");
                    setPassword("siswa123");
                  }}
                  className="col-span-2 sm:col-span-3 p-2 text-xs text-left rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">⭐</span>
                    <div>
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-700 truncate">
                        Siswa Baru: Muhammad Hanif
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                        NISN: <strong>0017</strong> • Kata Sandi: <strong>siswa123</strong>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium shrink-0">
                    Klik untuk Isi
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* Security Guarantee Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Bank-Grade Security: SSL 256-bit, HSTS, Database RLS & Anti Brute-Force (PCI-DSS)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
