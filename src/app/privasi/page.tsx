import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Database, UserCheck, HeartHandshake, EyeOff, Mail, Phone, School, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi - SIM Sekolah PRO",
  description: "Kebijakan privasi dan perlindungan data pribadi siswa, guru, dan wali murid pada aplikasi SIM Sekolah PRO.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Aplikasi
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-500/30 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 text-xs font-bold mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dokumen Resmi Kepatuhan Google Play & UU PDP</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Kebijakan Privasi & Perlindungan Data
            </h1>
            <p className="mt-3 text-sm sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
              Komitmen transparansi dan keamanan data pribadi santri, wali murid, pendidik, dan pengelola lembaga pendidikan pada aplikasi Sistem Informasi Manajemen Madrasah (SIM Sekolah PRO).
            </p>
            <div className="mt-5 text-xs text-emerald-300 font-medium">
              Terakhir diperbarui: 26 September 2026 • Versi Dokumen: 2.0 (Google Play Certified)
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800 space-y-8 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <School className="w-5 h-5" />
              </div>
              <h2>1. Pendahuluan</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              SIM Sekolah PRO (&ldquo;Aplikasi&rdquo;) dikembangkan sebagai sistem informasi manajemen terintegrasi untuk mendukung kegiatan administrasi pendidikan, pencatatan kehadiran digital, e-rapor Kurikulum Merdeka, mutaba&apos;ah ibadah, tahfidz Al-Qur&apos;an, serta layanan pembayaran SPP sekolah. Kami berkomitmen menjunjung tinggi hak privasi Anda dan memperlakukan seluruh data pengguna dengan standar perlindungan tertinggi.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <h2>2. Data Pribadi yang Kami Kumpulkan</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Data yang diproses oleh Aplikasi semata-mata digunakan untuk kepentingan operasional sekolah dan kebutuhan komunikasi antara sekolah dengan orang tua/wali santri:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Data Identitas Siswa & Santri:</strong> Nama lengkap, Nomor Induk Siswa Nasional (NISN), kelas/rombel, tempat & tanggal lahir, jenis kelamin, serta pas foto profil.
              </li>
              <li>
                <strong>Data Wali Murid / Orang Tua:</strong> Nama orang tua/wali, nomor kontak telepon/WhatsApp aktif untuk pengiriman notifikasi kehadiran dan tagihan SPP.
              </li>
              <li>
                <strong>Data Akademik & Pembinaan:</strong> Nilai rapor formatif/sumatif, catatan setoran hafalan Tahfidz Qur&apos;an, catatan amalan harian (Mutaba&apos;ah Yaumiyah), dan catatan konseling.
              </li>
              <li>
                <strong>Data Presensi & Log Masuk:</strong> Waktu kehadiran (jam masuk/pulang), status kehadiran (Hadir, Izin, Sakit, Alpa), serta log pemindaian kartu RFID/barcode.
              </li>
              <li>
                <strong>Data Transaksi Keuangan:</strong> Status pembayaran SPP, riwayat kasir, tabungan santri, dan token transaksi Midtrans (Aplikasi <em>tidak pernah menyimpan</em> nomor kartu debit/kredit atau PIN perbankan pengguna).
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h2>3. Kebijakan Perlindungan Anak (Google Play Families Policy & COPPA)</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Mengingat aplikasi ini digunakan dalam lingkungan sekolah dasar dan madrasah yang melibatkan data anak di bawah umur:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
              <li>Aplikasi <strong>tidak memuat iklan komersial apa pun</strong> (*Zero Ads*).</li>
              <li>Aplikasi tidak melakukan pelacakan perilaku (*behavioral tracking*) untuk tujuan komersial atau periklanan pihak ketiga.</li>
              <li>Pendaftaran akun siswa dan wali murid dikelola secara tertutup oleh administrator resmi sekolah (*closed educational portal*).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h2>4. Keamanan & Enkripsi Data (Bank-Grade Security)</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Kami menerapkan langkah-langkah keamanan teknis berstandar industri:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
              <li><strong>Enkripsi Lalu Lintas Jaringan:</strong> Seluruh komunikasi menggunakan protokol HTTPS terenkripsi TLS 1.3 dengan sertifikasi resmi.</li>
              <li><strong>Proteksi Database Cloud:</strong> Basis data PostgreSQL dilindungi oleh kebijakan ketat <em>Row-Level Security (RLS)</em>, di mana setiap pengguna hanya dapat melihat dan mengakses data yang menjadi haknya.</li>
              <li><strong>Keamanan Pembayaran:</strong> Seluruh pembayaran online diproses melalui payment gateway berlisensi Bank Indonesia (Midtrans) yang tersertifikasi PCI-DSS Level 1.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <EyeOff className="w-5 h-5" />
              </div>
              <h2>5. Tidak Ada Penjualan Data Pribadi</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Kami <strong>tidak pernah dan tidak akan pernah menjual, menyewakan, atau memperdagangkan data pribadi pengguna</strong> kepada pihak ketiga manapun untuk tujuan pemasaran komersial. Data hanya dapat dibagikan kepada penyedia layanan resmi yang ditunjuk oleh sekolah (misalnya gateway pengiriman pesan notifikasi WhatsApp resmi atau pemrosesan pembayaran perbankan).
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2>6. Hak Pengguna & Permohonan Penghapusan Data (Data Deletion)</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Sesuai dengan ketentuan Google Play Store dan Undang-Undang Perlindungan Data Pribadi (UU PDP), Anda berhak untuk:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
              <li>Memeriksa dan memperbarui data pribadi Anda atau data santri Anda melalui antarmuka aplikasi.</li>
              <li>Meminta salinan rekap data akademik dan catatan transaksi.</li>
              <li>
                <strong>Permohonan Penghapusan Akun & Data:</strong> Apabila siswa telah lulus atau mutasi, wali murid dapat mengajukan penghapusan akun dan data terkait melalui kantor tata usaha madrasah atau dengan mengirimkan permohonan ke email resmi sekolah: <span className="font-mono text-emerald-600 dark:text-emerald-400">admin@sekolah.id</span>.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Mail className="w-5 h-5" />
              </div>
              <h2>7. Kontak Pengelola Privasi</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Jika Anda memiliki pertanyaan, keluhan, atau saran terkait kebijakan privasi ini, silakan hubungi tim pengelola kami:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <p><strong>Lembaga:</strong> Tim IT & Tata Usaha SD Islam Smart School</p>
              <p><strong>Email Kontak:</strong> admin@sekolah.id / info@sekolah.id</p>
              <p><strong>WhatsApp Bantuan:</strong> +62 857-1122-3344</p>
              <p><strong>Alamat:</strong> Jl. Pendidikan Karakter No. 1, Kompleks Madrasah Digital</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© 2026 SIM Sekolah PRO. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </div>
    </div>
  );
}
