import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 1. Ambil user dari Supabase Auth
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // 2. Ambil sesi aplikasi terverifikasi dari cookie (sim_session)
  const sessionCookie = request.cookies.get("sim_session")?.value;
  let appUser: { id: string; role: string; email: string; name?: string } | null = null;
  if (sessionCookie) {
    try {
      appUser = JSON.parse(decodeURIComponent(sessionCookie));
    } catch {}
  }

  const effectiveUser = supabaseUser || appUser;
  const role = (
    supabaseUser?.user_metadata?.role ||
    appUser?.role ||
    "siswa"
  ).toLowerCase();

  const pathname = request.nextUrl.pathname;

  // 0. Akses ke Root URL `/`: langsung arahkan ke /dashboard (jika sudah login) atau /login (jika belum login)
  if (pathname === "/") {
    if (effectiveUser) {
      if (role === "bendahara") {
        return NextResponse.redirect(new URL("/dashboard/spp-transportasi", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 1. Proteksi Halaman Dashboard
  if (pathname.startsWith("/dashboard")) {
    // Jika belum login, redirect ke halaman login
    if (!effectiveUser) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 2. Proteksi Halaman Khusus Administrator (Master Data, Pengguna & Konfigurasi)
    const adminOnlyPrefixes = [
      "/dashboard/pengguna",
      "/dashboard/pengaturan",
      "/dashboard/siswa",
      "/dashboard/kelas",
      "/dashboard/jadwal",
    ];

    if (
      adminOnlyPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/")) &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 3. Batasi Bendahara hanya ke Modul Keuangan
    if (role === "bendahara") {
      const allowedFinancePrefixes = [
        "/dashboard/spp-transportasi",
        "/dashboard/keuangan",
        "/dashboard/tabungan",
      ];
      const isAllowed = allowedFinancePrefixes.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/dashboard/spp-transportasi", request.url));
      }
    }

    // 4. Batasi Siswa & Orang Tua dari Pembukuan Kas Internal Sekolah
    if (role === "siswa" || role === "ortu") {
      const internalFinancePrefixes = ["/dashboard/keuangan"];
      if (
        internalFinancePrefixes.some(
          (p) => pathname === p || pathname.startsWith(p + "/")
        )
      ) {
        return NextResponse.redirect(new URL("/dashboard/spp-transportasi", request.url));
      }
    }
  }

  // 5. Jika sudah login tetapi membuka /login, redirect ke dashboard
  if (pathname === "/login" && effectiveUser) {
    if (role === "bendahara") {
      return NextResponse.redirect(new URL("/dashboard/spp-transportasi", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon, apple-icon
     * - static public files (svg, png, jpg, etc.)
     * - api routes that might be public
     */
    "/",
    "/dashboard/:path*",
    "/login",
  ],
};
