import type { NextConfig } from "next";

const securityHeaders = [
  // 1. Anti-Clickjacking: Melindungi aplikasi agar tidak dapat disematkan di dalam iframe situs luar
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // 2. Anti-MIME Sniffing: Memaksa browser mematuhi MIME type asli file
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // 3. Referrer Policy: Hanya mengirim origin saat berpindah ke domain eksternal demi privasi
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // 4. Strict Transport Security (HSTS): Memaksa koneksi selalu menggunakan HTTPS terenkripsi
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // 5. Permissions Policy: Membatasi akses kamera hanya untuk domain sendiri (Scanner QR Presensi)
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
  // 6. X-DNS-Prefetch-Control: Optimasi resolusi DNS
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // 7. X-XSS-Protection: Proteksi filter XSS bawaan browser
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        // Terapkan header keamanan ini ke semua rute di seluruh aplikasi
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Cache abadi (1 tahun) untuk bundle JS/CSS hasil build Next.js
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache aset ikon dan splash screen statis
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
