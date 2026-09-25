import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage, formatIndonesianPhone } from "@/lib/whatsapp/gateway";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi Autentikasi Pengguna untuk mencegah eksploitasi spam & kehabisan kuota
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();

    if (!caller) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Pengiriman WhatsApp memerlukan sesi login terverifikasi." },
        { status: 401 }
      );
    }

    const callerRole = (caller.user_metadata?.role || "").toLowerCase();
    if (callerRole === "siswa" || callerRole === "ortu") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Pengiriman pesan WhatsApp hanya diperbolehkan untuk staf sekolah (Admin/Guru/Bendahara)." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { phone, message, provider, token, domain } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, message: "Nomor telepon (phone) dan pesan (message) wajib diisi." },
        { status: 400 }
      );
    }

    // Ambil konfigurasi dari body atau fallback ke Supabase profile jika tidak disertakan
    let activeProvider = provider;
    let activeToken = token;
    let activeDomain = domain;

    if (!activeToken) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data: profileRow } = await supabase
          .from("school_profile")
          .select("*")
          .eq("id", "extended_config")
          .single();

        if (profileRow && profileRow.nama_sekolah) {
          const extData = JSON.parse(profileRow.nama_sekolah);
          activeProvider = activeProvider || extData.waGatewayProvider;
          activeToken = extData.waGatewayToken;
          activeDomain = activeDomain || extData.waGatewayDomain;
        }
      } catch (err) {
        // Abaikan jika Supabase tidak tersedia
      }
    }

    const result = await sendWhatsAppMessage({
      phone,
      message,
      provider: activeProvider || "fonnte",
      token: activeToken,
      domain: activeDomain,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
