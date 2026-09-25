"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import IdleSessionTimeout from "@/components/common/IdleSessionTimeout";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      // 1. Proteksi Halaman Khusus Administrator
      const adminOnlyPaths = [
        "/dashboard/pengguna",
        "/dashboard/pengaturan",
        "/dashboard/siswa",
        "/dashboard/kelas",
        "/dashboard/jadwal",
      ];
      if (
        adminOnlyPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
        user.role !== "admin"
      ) {
        router.replace("/dashboard");
        return;
      }

      // 2. Bendahara dibatasi hanya ke modul keuangan
      if (user.role === "bendahara") {
        const allowedFinancePaths = [
          "/dashboard/spp-transportasi",
          "/dashboard/keuangan",
          "/dashboard/tabungan",
        ];
        const isAllowed = allowedFinancePaths.some(
          (p) => pathname === p || pathname.startsWith(p + "/")
        );
        if (!isAllowed) {
          router.replace("/dashboard/spp-transportasi");
          return;
        }
      }

      // 3. Batasi Siswa & Orang Tua dari Pembukuan Kas Internal Sekolah
      if (
        (user.role === "siswa" || user.role === "ortu") &&
        (pathname === "/dashboard/keuangan" || pathname.startsWith("/dashboard/keuangan/"))
      ) {
        router.replace("/dashboard/spp-transportasi");
        return;
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf9] dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Memuat SIM SD Islam Smart School...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Proteksi Keamanan: Inactivity Auto-Logout Timer (Bank-Grade PCI-DSS) */}
      <IdleSessionTimeout />

      {/* Navigasi Mobile Native ala Google Play Store (Bottom App Bar) */}
      <MobileBottomNav />
    </div>
  );
}
