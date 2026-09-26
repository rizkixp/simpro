import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user } = body;

    if (!user || !user.id || !user.role) {
      return NextResponse.json(
        { error: "Data pengguna tidak valid untuk pembuatan sesi." },
        { status: 400 }
      );
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      nisnOrNip: user.nisnOrNip || null,
      kelas: user.kelas || null,
      sessionToken: user.sessionToken || null,
      timestamp: Date.now(),
    };

    const cookieValue = encodeURIComponent(JSON.stringify(sessionPayload));
    const response = NextResponse.json({ success: true, user: sessionPayload });

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    // Pasang cookie sesi aman
    response.cookies.set("sim_session", cookieValue, {
      httpOnly: false, // Boleh diakses client untuk sinkronisasi state
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal membuat sesi." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Sesi berhasil dihapus." });
  response.cookies.set("sim_session", "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
