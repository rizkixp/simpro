"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { User as UserType } from "@/types/school";

interface MobileBukuPesanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

export default function MobileBukuPesanDrawer({
  isOpen,
  onClose,
  user,
}: MobileBukuPesanDrawerProps) {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      pengirim: string;
      kategori: string;
      pesan: string;
      tanggal: string;
      balasanGuru?: string;
    }>
  >([
    {
      id: "msg-1",
      pengirim: user?.name || "Ayah / Bunda",
      kategori: "Kesehatan",
      pesan:
        "Assalamu'alaikum Ustadzah, izin mengabarkan ananda hari ini membawa obat batuk sirup di tas kecil. Mohon bantuannya untuk diingatkan minum obat setelah makan siang. Jazakillah khair.",
      tanggal: "Hari ini, 07:15 WIB",
      balasanGuru:
        "Wa'alaikumussalam warahmatullah Ayah/Bunda. Baik, insyaAllah akan kami dampingi saat istirahat siang. Syafakumullah untuk ananda.",
    },
    {
      id: "msg-2",
      pengirim: "Ustadzah Siti Nurhaliza (Wali Kelas)",
      kategori: "Capaian Belajar",
      pesan:
        "Alhamdulillah hafalan Surah An-Naba' ananda hari ini lancar dan makhraj hurufnya sangat baik. Bimbingan muraja'ah di rumah dapat diteruskan ke Surah An-Nazi'at.",
      tanggal: "Kemarin, 14:30 WIB",
    },
  ]);

  const [inputPesan, setInputPesan] = useState("");
  const [kategori, setKategori] = useState<"Kesehatan" | "Izin" | "Akademik" | "Lainnya">("Kesehatan");
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleKirim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPesan.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      pengirim: user?.name || "Ayah / Bunda",
      kategori,
      pesan: inputPesan.trim(),
      tanggal: "Baru saja",
      balasanGuru:
        "Jazakumullahu khair atas pesan Ayah/Bunda. Notifikasi telah kami teruskan ke Wali Kelas ananda.",
    };

    setMessages([newMsg, ...messages]);
    setInputPesan("");
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#056839] dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Buku Penghubung & Pesan
              </h2>
              <p className="text-[11px] text-slate-400">
                Komunikasi Santun Wali Santri & Wali Kelas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Message Feed */}
        <div className="overflow-y-auto px-5 py-4 space-y-3.5 flex-1">
          {isSent && (
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pesan berhasil terkirim ke buku harian sekolah!</span>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                  {m.kategori}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {m.tanggal}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 mb-0.5">
                  {m.pengirim}:
                </p>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  "{m.pesan}"
                </p>
              </div>

              {m.balasanGuru && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 mt-2">
                  <p className="text-[10px] font-bold text-[#056839] dark:text-emerald-300 mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Tanggapan Asatidz / Wali Kelas:</span>
                  </p>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-snug">
                    "{m.balasanGuru}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Form at Bottom */}
        <form
          onSubmit={handleKirim}
          className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
        >
          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            {(["Kesehatan", "Izin", "Akademik", "Lainnya"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setKategori(cat)}
                className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
                  kategori === cat
                    ? "bg-[#056839] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputPesan}
              onChange={(e) => setInputPesan(e.target.value)}
              placeholder="Tulis pesan untuk Wali Kelas..."
              className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#056839] dark:focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputPesan.trim()}
              className="p-2.5 rounded-2xl bg-[#056839] hover:bg-[#04522d] text-white transition-all disabled:opacity-40 cursor-pointer"
              title="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
