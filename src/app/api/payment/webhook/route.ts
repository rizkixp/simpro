import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransSignature, isMidtransPaymentSuccess } from "@/lib/payment/midtrans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, interpolateTemplate } from "@/lib/whatsapp/gateway";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
    } = payload;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { message: "Payload webhook Midtrans tidak lengkap" },
        { status: 400 }
      );
    }

    // Ambil Midtrans Server Key & WhatsApp configuration
    let activeServerKey = process.env.MIDTRANS_SERVER_KEY;
    let waConfig: any = {};

    try {
      const supabase = await createServerSupabaseClient();
      const { data: profileRow } = await supabase
        .from("school_profile")
        .select("*")
        .eq("id", "extended_config")
        .single();

      if (profileRow && profileRow.nama_sekolah) {
        const extData = JSON.parse(profileRow.nama_sekolah);
        if (!activeServerKey) activeServerKey = extData.midtransServerKey;
        waConfig = extData;
      }
    } catch (err) {
      // Abaikan error koneksi fallback
    }

    // Jika signature key ada dan server key tersedia, lakukan verifikasi keamanan
    if (activeServerKey) {
      const isValid = verifyMidtransSignature({
        orderId: order_id,
        statusCode: status_code,
        grossAmount: gross_amount,
        serverKey: activeServerKey,
        signatureKey: signature_key,
      });

      if (!isValid) {
        console.warn("[Midtrans Webhook] Invalid signature key for order:", order_id);
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }
    }

    // Periksa apakah status pembayaran sukses
    const isSuccess = isMidtransPaymentSuccess(transaction_status, fraud_status);

    if (isSuccess) {
      // Ekstrak tagihanId dari order_id, misal: "SPP-tagihan_123-17272638" -> "tagihan_123"
      const match = order_id.match(/^SPP-([^-]+)-/);
      const tagihanId = match ? match[1] : null;

      const adminClient = createAdminClient();
      const nowIsoDate = new Date().toISOString().split("T")[0];
      const noKuitansi = `KWT-MTR-${Date.now().toString().slice(-6)}`;

      if (adminClient && tagihanId) {
        // Ambil data tagihan lama untuk mengetahui data siswa
        const { data: tagihanData } = await adminClient
          .from("tagihan_siswa")
          .select("*")
          .eq("id", tagihanId)
          .single();

        // Update status tagihan menjadi Lunas
        await adminClient
          .from("tagihan_siswa")
          .update({
            status: "Lunas",
            tanggal_bayar: nowIsoDate,
            metode_pembayaran: `QRIS / Midtrans (${payment_type || "Online"})`,
            no_kuitansi: noKuitansi,
            keterangan: `Pembayaran online terverifikasi Midtrans [${order_id}]`,
          })
          .eq("id", tagihanId);

        // Jika ada data siswa & WhatsApp Gateway diaktifkan, kirim notifikasi kuitansi otomatis ke HP orang tua
        if (tagihanData && waConfig.waAutoSendSPP && waConfig.waGatewayToken) {
          // Cari nomor HP orang tua dari tabel siswa
          const { data: siswaData } = await adminClient
            .from("siswa")
            .select("no_hp_wali, nama, kelas")
            .eq("id", tagihanData.siswa_id)
            .single();

          const parentPhone = siswaData?.no_hp_wali;
          if (parentPhone) {
            const template =
              waConfig.waTemplateSPP ||
              "Assalamu'alaikum Wr. Wb. Terima kasih, pembayaran *{judul}* ananda *{nama}* (Kelas {kelas}) sebesar *Rp {nominal}* telah kami terima dengan No. Kuitansi: *{kuitansi}*. Status: *LUNAS*.";

            const waMsg = interpolateTemplate(template, {
              nama: siswaData.nama || tagihanData.siswa_nama,
              kelas: siswaData.kelas || tagihanData.kelas,
              judul: tagihanData.judul || "SPP",
              nominal: Number(gross_amount).toLocaleString("id-ID"),
              kuitansi: noKuitansi,
              tanggal: nowIsoDate,
            });

            await sendWhatsAppMessage({
              phone: parentPhone,
              message: waMsg,
              provider: waConfig.waGatewayProvider || "fonnte",
              token: waConfig.waGatewayToken,
              domain: waConfig.waGatewayDomain,
            }).catch((waErr) => {
              console.warn("[Webhook] Gagal kirim WA kuitansi otomatis:", waErr);
            });
          }
        }
      }
    }

    return NextResponse.json({ status: "ok", received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Midtrans Webhook Error]:", error);
    return NextResponse.json(
      { message: `Webhook error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
