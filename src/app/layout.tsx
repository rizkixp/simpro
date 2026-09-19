import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SchoolDataProvider } from "@/contexts/SchoolDataContext";

export const metadata: Metadata = {
  title: "SIM Sekolah Pro - Sistem Informasi Manajemen Sekolah Modern #1",
  description:
    "Aplikasi Web Manajemen Sekolah Terpadu dengan fitur administrasi siswa, guru, jadwal pelajaran, presensi harian, penilaian e-rapor, dan keuangan SPP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased font-sans bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <SchoolDataProvider>{children}</SchoolDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
