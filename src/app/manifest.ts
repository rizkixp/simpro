import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SDI Smart School - Sistem Informasi Madrasah",
    short_name: "SDI Smart",
    description: "Aplikasi Manajemen Sekolah Islam Terpadu, Kurikulum Merdeka, Tahfidz, Mutaba'ah, dan Portal Wali Santri",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#064e3b",
    theme_color: "#064e3b",
    lang: "id",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard Utama",
        short_name: "Dashboard",
        description: "Buka ringkasan dashboard madrasah & portal wali",
        url: "/dashboard",
        icons: [{ src: "/icons/icon.svg", sizes: "96x96" }],
      },
      {
        name: "Mutaba'ah Ibadah",
        short_name: "Mutaba'ah",
        description: "Catatan shalat harian & amalan sunnah",
        url: "/dashboard/mutabaah",
        icons: [{ src: "/icons/icon.svg", sizes: "96x96" }],
      },
      {
        name: "Tahfidz Qur'an",
        short_name: "Tahfidz",
        description: "Pantau setoran hafalan surah & ayat",
        url: "/dashboard/tahfidz",
        icons: [{ src: "/icons/icon.svg", sizes: "96x96" }],
      },
      {
        name: "Pembayaran SPP",
        short_name: "SPP",
        description: "Status tagihan SPP & tabungan santri",
        url: "/dashboard/spp-transportasi",
        icons: [{ src: "/icons/icon.svg", sizes: "96x96" }],
      },
    ],
  };
}
