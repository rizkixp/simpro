import { NextRequest, NextResponse } from "next/server";
import { createMidtransSnapToken } from "@/lib/payment/midtrans";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tagihanId,
      orderId,
      grossAmount,
      siswaNama,
      siswaKelas,
      judul,
      noHpWali,
      serverKeyOverride,
      isProductionOverride,
    } = body;

    if (!grossAmount || grossAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Nominal pembayaran tidak valid." },
        { status: 400 }
      );
    }

    let activeServerKey = serverKeyOverride || process.env.MIDTRANS_SERVER_KEY;
    let isProduction = isProductionOverride ?? (process.env.MIDTRANS_IS_PRODUCTION === "true");

    // Jika belum ada di env atau override, ambil dari database profil sekolah
    if (!activeServerKey) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data: profileRow } = await supabase
          .from("school_profile")
          .select("*")
          .eq("id", "extended_config")
          .single();

        if (profileRow && profileRow.nama_sekolah) {
          const extData = JSON.parse(profileRow.nama_sekolah);
          activeServerKey = extData.midtransServerKey;
          isProduction = extData.midtransIsProduction ?? false;
        }
      } catch (err) {
        // Fallback jika tidak terhubung
      }
    }

    if (!activeServerKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Midtrans Server Key belum dikonfigurasi. Silakan atur di menu Pengaturan Sekolah atau .env.local.",
        },
        { status: 400 }
      );
    }

    const finalOrderId =
      orderId || `SPP-${tagihanId || "GEN"}-${Date.now().toString().slice(-6)}`;

    const result = await createMidtransSnapToken({
      orderId: finalOrderId,
      grossAmount,
      customerDetails: {
        firstName: siswaNama || "Wali Santri",
        phone: noHpWali || "081234567890",
      },
      itemDetails: [
        {
          id: tagihanId || "tagihan-1",
          name: `${judul || "Pembayaran SPP"} - ${siswaNama || "Siswa"} (${siswaKelas || "Kelas"})`.slice(0, 50),
          price: grossAmount,
          quantity: 1,
        },
      ],
      serverKey: activeServerKey,
      isProduction,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        token: result.token,
        redirectUrl: result.redirectUrl,
        orderId: finalOrderId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
