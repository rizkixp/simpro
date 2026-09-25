import crypto from "crypto";

export interface MidtransCustomerDetails {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface CreateSnapTokenParams {
  orderId: string;
  grossAmount: number;
  customerDetails: MidtransCustomerDetails;
  itemDetails?: MidtransItemDetail[];
  serverKey: string;
  isProduction?: boolean;
}

export interface CreateSnapTokenResult {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  message?: string;
}

/**
 * Membuat Snap Token Transaksi Midtrans
 */
export async function createMidtransSnapToken({
  orderId,
  grossAmount,
  customerDetails,
  itemDetails,
  serverKey,
  isProduction = false,
}: CreateSnapTokenParams): Promise<CreateSnapTokenResult> {
  if (!serverKey) {
    return {
      success: false,
      message: "Midtrans Server Key belum diatur.",
    };
  }

  const endpoint = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const authHeader = `Basic ${Buffer.from(serverKey + ":").toString("base64")}`;

  const payload: any = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(grossAmount),
    },
    customer_details: {
      first_name: customerDetails.firstName,
      last_name: customerDetails.lastName || "",
      email: customerDetails.email || "wali@sekolah.id",
      phone: customerDetails.phone || "081234567890",
    },
    enabled_payments: [
      "qris",
      "gopay",
      "shopeepay",
      "bank_transfer",
      "bca_va",
      "bni_va",
      "bri_va",
      "other_va",
    ],
  };

  if (itemDetails && itemDetails.length > 0) {
    payload.item_details = itemDetails.map((item) => ({
      id: item.id,
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.name.slice(0, 50),
    }));
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    if (response.ok && resJson.token) {
      return {
        success: true,
        token: resJson.token,
        redirectUrl: resJson.redirect_url,
      };
    } else {
      return {
        success: false,
        message: resJson.error_messages?.join(", ") || resJson.message || `Midtrans Error (${response.status})`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Gagal memanggil API Midtrans: ${error.message || error}`,
    };
  }
}

/**
 * Memverifikasi keabsahan data notifikasi Webhook dari Midtrans menggunakan SHA-512
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
  signatureKey: string;
}): boolean {
  const { orderId, statusCode, grossAmount, serverKey, signatureKey } = params;
  const hashString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedSignature = crypto.createHash("sha512").update(hashString).digest("hex");
  return computedSignature === signatureKey;
}

/**
 * Menentukan apakah status transaksi dari Midtrans sudah berhasil/lunas
 */
export function isMidtransPaymentSuccess(
  transactionStatus: string,
  fraudStatus?: string
): boolean {
  if (transactionStatus === "settlement") {
    return true;
  }
  if (transactionStatus === "capture" && fraudStatus === "accept") {
    return true;
  }
  return false;
}
