import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SchoolDataProvider } from "@/contexts/SchoolDataContext";
import { PwaManager } from "@/components/common/PwaManager";

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SDI Smart School - Sistem Informasi Manajemen Madrasah & Sekolah Islam",
  description:
    "Aplikasi Manajemen Sekolah Islam Terpadu & Madrasah Digital dengan E-Rapor Kurikulum Merdeka, Mutaba'ah Ibadah Harian, Tahfidz Qur'an, Smart ID Card, dan Portal Khusus Wali Santri.",
  applicationName: "SDI Smart",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SDI Smart",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full antialiased font-sans bg-slate-50 text-slate-900 selection:bg-emerald-700 selection:text-white">
        <AuthProvider>
          <SchoolDataProvider>
            {children}
            <PwaManager />
          </SchoolDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
