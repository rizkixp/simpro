/**
 * WhatsApp Gateway Utility Module
 * Mendukung provider Fonnte, Wablas, dan Generic Webhook API.
 */

export interface SendWhatsAppParams {
  phone: string;
  message: string;
  provider?: "fonnte" | "wablas" | "generic" | "manual";
  token?: string;
  domain?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  message: string;
  provider?: string;
  data?: any;
}

/**
 * Format nomor telepon standar Indonesia ke format internasional 62...
 */
export function formatIndonesianPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

/**
 * Mengganti placeholder template string seperti {nama}, {kelas}, {nominal} dengan nilai aktual
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : match;
  });
}

/**
 * Mengirim pesan WhatsApp melalui Gateway API
 */
export async function sendWhatsAppMessage({
  phone,
  message,
  provider = "fonnte",
  token,
  domain,
}: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const formattedPhone = formatIndonesianPhone(phone);
  if (!formattedPhone) {
    return {
      success: false,
      message: "Nomor telepon tidak valid atau kosong.",
    };
  }

  if (!message || message.trim() === "") {
    return {
      success: false,
      message: "Pesan tidak boleh kosong.",
    };
  }

  const activeToken = token || process.env.WHATSAPP_API_TOKEN;
  if (!activeToken && provider !== "manual") {
    return {
      success: false,
      message: "Token WhatsApp Gateway belum dikonfigurasi di Pengaturan Sekolah.",
    };
  }

  try {
    if (provider === "fonnte") {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: activeToken!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: formattedPhone,
          message: message,
          countryCode: "62",
        }),
      });

      const resJson = await response.json().catch(() => ({}));
      if (response.ok && resJson.status !== false) {
        return {
          success: true,
          message: "Pesan WhatsApp berhasil dikirim via Fonnte Gateway.",
          provider: "fonnte",
          data: resJson,
        };
      } else {
        return {
          success: false,
          message: resJson.reason || resJson.message || `Fonnte Error (${response.status})`,
          provider: "fonnte",
          data: resJson,
        };
      }
    }

    if (provider === "wablas") {
      const baseUrl = (domain || "https://pati.wablas.com").replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/api/send-message`, {
        method: "POST",
        headers: {
          Authorization: activeToken!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      });

      const resJson = await response.json().catch(() => ({}));
      if (response.ok && resJson.status !== false) {
        return {
          success: true,
          message: "Pesan WhatsApp berhasil dikirim via Wablas Gateway.",
          provider: "wablas",
          data: resJson,
        };
      } else {
        return {
          success: false,
          message: resJson.message || `Wablas Error (${response.status})`,
          provider: "wablas",
          data: resJson,
        };
      }
    }

    if (provider === "generic") {
      if (!domain) {
        return {
          success: false,
          message: "Domain / URL Webhook Generic belum diisi.",
        };
      }

      const response = await fetch(domain, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      });

      const resJson = await response.json().catch(() => ({}));
      return {
        success: response.ok,
        message: response.ok ? "Pesan terkirim ke Generic Gateway" : `Generic Gateway Error (${response.status})`,
        provider: "generic",
        data: resJson,
      };
    }

    return {
      success: false,
      message: `Provider ${provider} tidak didukung atau diset manual.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Gagal menghubungi server WhatsApp Gateway: ${error.message || error}`,
    };
  }
}
