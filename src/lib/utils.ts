import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function calculateMidGrade(harianOrUts: number, uts?: number): {
  nilaiMid: number;
  predikatMid: "A" | "B" | "C" | "D";
} {
  // Bobot Rapor Sumatif Tengah Semester (STS): 100% Nilai Ujian STS (tanpa Ulangan Harian)
  const examScore = typeof uts === "number" ? uts : harianOrUts;
  const nilaiMid = Math.round(examScore);
  let predikatMid: "A" | "B" | "C" | "D" = "D";

  if (nilaiMid >= 88) predikatMid = "A";
  else if (nilaiMid >= 75) predikatMid = "B";
  else if (nilaiMid >= 60) predikatMid = "C";
  else predikatMid = "D";

  return { nilaiMid, predikatMid };
}

export function calculateSemesterGrade(harian: number, uts: number, uas: number): {
  nilaiAkhir: number;
  predikat: "A" | "B" | "C" | "D";
} {
  // Bobot Rapor Akhir Semester: 30% Ulangan Harian, 30% Ujian Mid, 40% Ujian Akhir (UAS)
  const nilaiAkhir = Math.round((harian * 0.3) + (uts * 0.3) + (uas * 0.4));
  let predikat: "A" | "B" | "C" | "D" = "D";

  if (nilaiAkhir >= 88) predikat = "A";
  else if (nilaiAkhir >= 75) predikat = "B";
  else if (nilaiAkhir >= 60) predikat = "C";
  else predikat = "D";

  return { nilaiAkhir, predikat };
}

export function calculateGrade(tugas: number, uts: number, uas: number): {
  nilaiAkhir: number;
  predikat: "A" | "B" | "C" | "D";
} {
  return calculateSemesterGrade(tugas, uts, uas);
}

export function getStatusBadgeClass(status?: string): string {
  if (!status) return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  switch (status.toLowerCase()) {
    case "aktif":
    case "hadir":
    case "lunas":
    case "pns":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    case "izin":
    case "sedang":
    case "tetap yayasan":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    case "sakit":
    case "jatuh tempo":
    case "honorer":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    case "alpa":
    case "belum lunas":
    case "tinggi":
    case "mutasi":
    case "nonaktif":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}
