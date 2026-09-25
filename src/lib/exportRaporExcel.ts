import { Siswa, NilaiSiswa, JenisRapor, MataPelajaran, SchoolProfile, Kelas, Guru } from "@/types/school";
import { calculateMidGrade, calculateSemesterGrade, formatDateIndo } from "@/lib/utils";

// Categorize subjects into: "wajib" | "mulok" | "quran"
export function getMapelCategory(
  mapelName: string,
  mapelList: MataPelajaran[] = []
): "wajib" | "mulok" | "quran" {
  const norm = (mapelName || "").toLowerCase().trim();
  const mapelObj = mapelList.find(
    (m) => m.nama.toLowerCase().trim() === norm
  );
  if (mapelObj) {
    if (mapelObj.kategori === "Kecerdasan Al-Qur'an") return "quran";
    if (mapelObj.kategori === "Muatan Lokal") return "mulok";
    if (mapelObj.kategori === "Wajib" || mapelObj.kategori === "Peminatan") {
      if (
        norm.includes("al-qur'an") ||
        norm.includes("al-quran") ||
        norm.includes("alquran") ||
        norm.includes("tahfidz") ||
        norm.includes("tahsin") ||
        norm.includes("tartil") ||
        norm.includes("tilawah") ||
        norm.includes("btq") ||
        norm.includes("baca tulis al-qur'an") ||
        norm.includes("kecerdasan al-qur'an")
      ) {
        return "quran";
      }
      return "wajib";
    }
  }

  // Keywords for Al-Qur'an
  if (
    norm.includes("al-qur'an") ||
    norm.includes("al-quran") ||
    norm.includes("alquran") ||
    norm.includes("tahfidz") ||
    norm.includes("tahsin") ||
    norm.includes("tartil") ||
    norm.includes("tilawah") ||
    norm.includes("tajwid") ||
    norm.includes("btq") ||
    norm.includes("baca tulis al-qur'an") ||
    norm.includes("kecerdasan al-qur'an")
  ) {
    return "quran";
  }

  // Keywords for Muatan Lokal
  if (
    norm.includes("muatan lokal") ||
    norm.includes("mulok") ||
    norm.includes("bahasa jawa") ||
    norm.includes("bahasa sunda") ||
    norm.includes("bahasa daerah") ||
    norm.includes("plbj") ||
    norm.includes("kemuhammadiyahan") ||
    norm.includes("ke-nu-an")
  ) {
    return "mulok";
  }

  return "wajib";
}

// Sort subjects based on customMapelOrder
export function sortRecordsByMapelOrder<T extends { mapel?: string; nama?: string }>(
  records: T[],
  customOrder?: string[]
): T[] {
  if (!customOrder || customOrder.length === 0) return records;
  const orderMap = new Map<string, number>();
  customOrder.forEach((name, idx) => {
    orderMap.set(name.toLowerCase().trim(), idx);
  });
  return [...records].sort((a, b) => {
    const nameA = (a.mapel || a.nama || "").toLowerCase().trim();
    const nameB = (b.mapel || b.nama || "").toLowerCase().trim();
    const indexA = orderMap.has(nameA) ? orderMap.get(nameA)! : 9999;
    const indexB = orderMap.has(nameB) ? orderMap.get(nameB)! : 9999;
    return indexA - indexB;
  });
}

// Resolve STS score
export function resolveStudentMidScore(record: NilaiSiswa) {
  const examScore =
    typeof record.uts === "number"
      ? record.uts
      : typeof record.nilaiMid === "number"
      ? record.nilaiMid
      : 0;
  const calc = calculateMidGrade(examScore);
  return {
    nilaiMid: examScore,
    predikatMid: record.predikatMid || calc.predikatMid,
    catatanMid:
      record.catatanMid || record.catatan || "Mengikuti pembelajaran dengan baik.",
  };
}

// Resolve SAS score
export function resolveStudentAkhirScore(record: NilaiSiswa) {
  if (typeof record.nilaiAkhir === "number" && record.predikat) {
    return {
      nilaiAkhir: record.nilaiAkhir,
      predikat: record.predikat,
      catatan: record.catatan || "Capaian kompetensi tuntas dengan baik.",
    };
  }
  const calc = calculateSemesterGrade(
    record.tugas || 0,
    record.uts || 0,
    record.uas || 0
  );
  return {
    nilaiAkhir: calc.nilaiAkhir,
    predikat: calc.predikat,
    catatan: record.catatan || "Capaian kompetensi tuntas dengan baik.",
  };
}

// Helper filter STS
export function isRecordStsFilled(n: NilaiSiswa): boolean {
  if (n.hasSts === false) return false;
  if (n.hasSts === true) return true;
  return typeof n.nilaiMid === "number" || (typeof n.uts === "number" && n.uts > 0);
}

// Helper filter SAS
export function isRecordSasFilled(n: NilaiSiswa): boolean {
  if (n.hasSas === false) return false;
  if (n.hasSas === true) return true;
  return typeof n.uas === "number" && n.uas > 0 && typeof n.nilaiAkhir === "number" && n.nilaiAkhir > 0;
}

// Detect educational phase (Fase Kurikulum Merdeka)
export function getFaseFromClass(kelas?: string): string {
  if (!kelas) return "Fase -";
  const numMatch = kelas.match(/\d+|[IVXLCDM]+/i);
  if (!numMatch) return "Fase -";
  const val = numMatch[0].toUpperCase();
  if (val === "1" || val === "I" || val === "2" || val === "II") return "Fase A (Kelas 1-2)";
  if (val === "3" || val === "III" || val === "4" || val === "IV") return "Fase B (Kelas 3-4)";
  if (val === "5" || val === "V" || val === "6" || val === "VI") return "Fase C (Kelas 5-6)";
  return "Fase A/B/C";
}

export interface SingleRaporExcelDataParams {
  siswa: Siswa;
  type: JenisRapor; // "tengah" | "akhir"
  semester: "Ganjil" | "Genap";
  studentRecords: NilaiSiswa[];
  mapelList: MataPelajaran[];
  profile: SchoolProfile;
  kelasList?: Kelas[];
  guruList?: Guru[];
  attendance?: { sakit: number; izin: number; alpa: number; hadir?: number };
  raporConfig?: any;
}

// Build 2D array of rows for a single student's report card in Excel
export function buildSingleRaporRows(params: SingleRaporExcelDataParams): (string | number)[][] {
  const {
    siswa,
    type,
    semester,
    studentRecords,
    mapelList,
    profile,
    kelasList = [],
    guruList = [],
    attendance = { sakit: 0, izin: 0, alpa: 0 },
    raporConfig = {},
  } = params;

  const rows: (string | number)[][] = [];

  // 1. Kop Sekolah
  const namaSekolah = profile.namaSekolah ? profile.namaSekolah.toUpperCase() : "SD ISLAM TERPADU PRO";
  rows.push([namaSekolah]);
  rows.push([`NPSN: ${profile.npsn || "-"}   •   Akreditasi: ${profile.akreditasi || "A"}`]);
  rows.push([`${profile.alamat || ""} • Telp: ${profile.telepon || ""} • Email: ${profile.email || ""}`]);
  rows.push([""]); // Baris kosong pemisah kop

  // 2. Judul Dokumen
  const docTitle =
    type === "tengah"
      ? (raporConfig.judulRaporSTS || "LAPORAN PENILAIAN HASIL BELAJAR SUMATIF TENGAH SEMESTER (STS)")
      : (raporConfig.judulRaporSAS || "LAPORAN CAPAIAN HASIL BELAJAR SUMATIF AKHIR SEMESTER (SAS)");

  const subTitle =
    raporConfig.subjudulRapor?.trim() ||
    `Tahun Ajaran ${profile.tahunAjaranAktif || "2024/2025"} • Semester ${semester}`;

  rows.push([docTitle]);
  rows.push([subTitle]);
  rows.push([""]); // Baris kosong

  // 3. Identitas Siswa
  rows.push(["Nama Peserta Didik", `: ${siswa.nama}`, "", "Kelas", `: ${siswa.kelas}`]);
  rows.push(["Nomor Induk / NISN", `: ${siswa.nisn || "-"}`, "", "Semester", `: ${semester}`]);
  rows.push(["Nama Sekolah", `: ${profile.namaSekolah}`, "", "Tahun Ajaran", `: ${profile.tahunAjaranAktif}`]);
  rows.push(["Nama Wali Murid", `: ${siswa.namaWali || "-"}`, "", "Fase / Jenjang", `: ${getFaseFromClass(siswa.kelas)}`]);
  rows.push([""]); // Baris kosong

  // 4. Pengelompokan Mata Pelajaran
  const wajibRecords = sortRecordsByMapelOrder(
    studentRecords.filter((item) => getMapelCategory(item.mapel, mapelList) === "wajib"),
    raporConfig.customMapelOrder
  );
  const mulokRecords = sortRecordsByMapelOrder(
    studentRecords.filter((item) => getMapelCategory(item.mapel, mapelList) === "mulok"),
    raporConfig.customMapelOrder
  );
  const quranRecords = sortRecordsByMapelOrder(
    studentRecords.filter((item) => getMapelCategory(item.mapel, mapelList) === "quran"),
    raporConfig.customMapelOrder
  );

  // 5. Tabel Nilai Berdasarkan Tipe (STS atau SAS)
  if (type === "tengah") {
    // Header Tabel STS
    rows.push(["No", "Mata Pelajaran", "KKM / KKTP", "Nilai Prestasi (STS)", "Predikat"]);

    // Kelompok A: Muatan Wajib
    rows.push(["A. MUATAN WAJIB"]);
    if (wajibRecords.length === 0) {
      rows.push(["-", "Belum ada nilai mata pelajaran muatan wajib", "-", "-", "-"]);
    } else {
      wajibRecords.forEach((item, idx) => {
        const mid = resolveStudentMidScore(item);
        const mapelObj = mapelList.find(
          (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
        );
        const kkm = mapelObj?.kkm || 75;
        rows.push([idx + 1, item.mapel, kkm, mid.nilaiMid, mid.predikatMid]);
      });
    }

    // Kelompok B: Muatan Lokal
    rows.push(["B. MUATAN LOKAL"]);
    if (mulokRecords.length === 0) {
      rows.push(["-", "Tidak ada mata pelajaran muatan lokal", "-", "-", "-"]);
    } else {
      mulokRecords.forEach((item, idx) => {
        const mid = resolveStudentMidScore(item);
        const mapelObj = mapelList.find(
          (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
        );
        const kkm = mapelObj?.kkm || 75;
        rows.push([idx + 1, item.mapel, kkm, mid.nilaiMid, mid.predikatMid]);
      });
    }

    // Kelompok C: Kecerdasan Al-Qur'an
    rows.push(["C. KECERDASAN AL-QUR'AN"]);
    if (quranRecords.length === 0) {
      rows.push(["-", "Tidak ada mata pelajaran kecerdasan al-qur'an", "-", "-", "-"]);
    } else {
      quranRecords.forEach((item, idx) => {
        const mid = resolveStudentMidScore(item);
        const mapelObj = mapelList.find(
          (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
        );
        const kkm = mapelObj?.kkm || 75;
        rows.push([idx + 1, item.mapel, kkm, mid.nilaiMid, mid.predikatMid]);
      });
    }

    // Rata-rata STS
    const midAvg =
      studentRecords.length > 0
        ? Math.round(
            studentRecords.reduce((acc, curr) => acc + resolveStudentMidScore(curr).nilaiMid, 0) /
              studentRecords.length
          )
        : 0;

    const predikatMidAvg =
      midAvg >= 88 ? "A" : midAvg >= 75 ? "B" : midAvg >= 60 ? "C" : "D";

    rows.push(["", "RATA-RATA NILAI SUMATIF TENGAH SEMESTER (STS)", "", midAvg, predikatMidAvg]);
  } else {
    // Header Tabel SAS
    rows.push([
      "No",
      "Mata Pelajaran",
      "KKM / KKTP",
      "Nilai Harian (30%)",
      "Nilai Mid (30%)",
      "Nilai UAS (40%)",
      "Nilai Akhir Rapor",
      "Predikat",
      "Catatan Capaian Kompetensi",
    ]);

    // Kelompok A: Muatan Wajib
    rows.push(["A. MUATAN WAJIB"]);
    if (wajibRecords.length === 0) {
      rows.push(["-", "Belum ada nilai mata pelajaran muatan wajib", "-", "-", "-", "-", "-", "-", "-"]);
    } else {
      wajibRecords.forEach((item, idx) => {
        const akhir = resolveStudentAkhirScore(item);
        const mapelObj = mapelList.find(
          (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
        );
        const kkm = mapelObj?.kkm || 75;
        rows.push([
          idx + 1,
          item.mapel,
          kkm,
          item.tugas ?? 0,
          item.uts ?? 0,
          item.uas ?? 0,
          akhir.nilaiAkhir,
          akhir.predikat,
          akhir.catatan || "-",
        ]);
      });
    }

    // Kelompok B: Muatan Lokal
    rows.push(["B. MUATAN LOKAL"]);
    if (mulokRecords.length === 0) {
      rows.push(["-", "Tidak ada mata pelajaran muatan lokal", "-", "-", "-", "-", "-", "-", "-"]);
    } else {
      mulokRecords.forEach((item, idx) => {
        const akhir = resolveStudentAkhirScore(item);
        const mapelObj = mapelList.find(
          (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
        );
        const kkm = mapelObj?.kkm || 75;
        rows.push([
          idx + 1,
          item.mapel,
          kkm,
          item.tugas ?? 0,
          item.uts ?? 0,
          item.uas ?? 0,
          akhir.nilaiAkhir,
          akhir.predikat,
          akhir.catatan || "-",
        ]);
      });
    }

    // Kelompok C: Kecerdasan Al-Qur'an
    rows.push(["C. KECERDASAN AL-QUR'AN"]);
    if (quranRecords.length === 0) {
      rows.push(["-", "Tidak ada mata pelajaran kecerdasan al-qur'an", "-", "-", "-", "-", "-", "-", "-"]);
    } else {
      quranRecords.forEach((item, idx) => {
        const akhir = resolveStudentAkhirScore(item);
        const mapelObj = mapelList.find(
          (m) => m.nama.toLowerCase() === item.mapel.toLowerCase()
        );
        const kkm = mapelObj?.kkm || 75;
        rows.push([
          idx + 1,
          item.mapel,
          kkm,
          item.tugas ?? 0,
          item.uts ?? 0,
          item.uas ?? 0,
          akhir.nilaiAkhir,
          akhir.predikat,
          akhir.catatan || "-",
        ]);
      });
    }

    // Rata-rata SAS
    const akhirAvg =
      studentRecords.length > 0
        ? Math.round(
            studentRecords.reduce((acc, curr) => acc + resolveStudentAkhirScore(curr).nilaiAkhir, 0) /
              studentRecords.length
          )
        : 0;

    const predikatAkhirAvg =
      akhirAvg >= 88 ? "A" : akhirAvg >= 75 ? "B" : akhirAvg >= 60 ? "C" : "D";

    rows.push([
      "",
      "RATA-RATA NILAI AKHIR SEMESTER (PAS)",
      "",
      "",
      "",
      "",
      akhirAvg,
      predikatAkhirAvg,
      `Predikat Umum: ${
        predikatAkhirAvg === "A"
          ? "A (Sangat Baik)"
          : predikatAkhirAvg === "B"
          ? "B (Baik)"
          : predikatAkhirAvg === "C"
          ? "C (Cukup)"
          : "D (Perlu Bimbingan)"
      }`,
    ]);
  }

  // 6. Rekapitulasi Presensi & Interval Predikat
  rows.push([""]); // baris kosong
  rows.push(["REKAPITULASI KETIDAKHADIRAN", "", "", "KRITERIA KETUNTASAN & PREDIKAT"]);
  rows.push(["1. Sakit", `${attendance.sakit} hari`, "", "Nilai Standar KKM Acuan: 75"]);
  rows.push(["2. Izin", `${attendance.izin} hari`, "", "A = 88 - 100 (Sangat Baik)"]);
  rows.push(["3. Tanpa Keterangan (Alpa)", `${attendance.alpa} hari`, "", "B = 75 - 87 (Baik)"]);
  rows.push(["", "", "", "C = 60 - 74 (Cukup)"]);
  rows.push(["", "", "", "D = < 60 (Perlu Bimbingan)"]);
  rows.push([""]); // baris kosong

  // 7. Titimangsa & Tanda Tangan
  const tglRapor =
    type === "tengah"
      ? (raporConfig.tanggalRaporSTS || raporConfig.tanggalRapor || formatDateIndo(new Date().toISOString()))
      : (raporConfig.tanggalRaporSAS || raporConfig.tanggalRapor || formatDateIndo(new Date().toISOString()));

  const tempatRapor = raporConfig.tempatRapor || "Jakarta";

  const matchedKelasObj = kelasList.find((k) =>
    k.nama.toLowerCase().trim() === siswa.kelas.toLowerCase().trim() ||
    k.nama.toLowerCase().replace(/[^a-z0-9]/g, "") === siswa.kelas.toLowerCase().replace(/[^a-z0-9]/g, "")
  );
  const matchedWaliGuru = matchedKelasObj
    ? guruList.find((g) => g.id === matchedKelasObj.waliKelasId)
    : null;
  const waliNama =
    (matchedWaliGuru?.nama
      ? `${matchedWaliGuru.nama}, ${matchedWaliGuru.gelar || ""}`.trim()
      : null) ||
    matchedKelasObj?.waliKelasNama ||
    "Wali Kelas";

  const kepsekNama =
    raporConfig.customKepalaSekolah?.trim() ||
    profile.kepalaSekolah ||
    "Kepala Sekolah";
  const kepsekLabel = raporConfig.labelKepalaSekolah?.trim() || "Kepala Sekolah";
  const nipKepsek = raporConfig.nipKepalaSekolah;

  if (type === "tengah") {
    rows.push(["", "", "", `${tempatRapor}, ${tglRapor}`]);
    rows.push(["Mengetahui,", "", "Wali Kelas,", "Orang Tua / Wali Santri,"]);
    rows.push([`${kepsekLabel},`, "", "", ""]);
    rows.push([""]);
    rows.push([""]);
    rows.push([kepsekNama, "", waliNama, siswa.namaWali || "...................................."]);
    if (nipKepsek) {
      rows.push([`NIP. ${nipKepsek}`, "", "", ""]);
    }
  } else {
    rows.push(["", "", "", "", "", "", `${tempatRapor}, ${tglRapor}`]);
    rows.push(["Mengetahui,", "", "", "Wali Kelas,", "", "", "Orang Tua / Wali Santri,"]);
    rows.push([`${kepsekLabel},`, "", "", "", "", "", ""]);
    rows.push([""]);
    rows.push([""]);
    rows.push([kepsekNama, "", "", waliNama, "", "", siswa.namaWali || "...................................."]);
    if (nipKepsek) {
      rows.push([`NIP. ${nipKepsek}`, "", "", "", "", "", ""]);
    }
  }

  return rows;
}

// Convert 2D rows into configured XLSX worksheet with column widths
export function createRaporWorksheet(
  rows: (string | number)[][],
  type: JenisRapor,
  XLSX: any
): any {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  if (type === "tengah") {
    worksheet["!cols"] = [
      { wch: 6 },  // No
      { wch: 38 }, // Mapel
      { wch: 14 }, // KKM
      { wch: 22 }, // Nilai Mid
      { wch: 14 }, // Predikat
      { wch: 24 }, // Extra col
    ];
  } else {
    worksheet["!cols"] = [
      { wch: 6 },  // No
      { wch: 36 }, // Mapel
      { wch: 12 }, // KKM
      { wch: 16 }, // Harian
      { wch: 16 }, // Mid
      { wch: 16 }, // UAS
      { wch: 18 }, // Nilai Akhir
      { wch: 12 }, // Predikat
      { wch: 45 }, // Catatan
    ];
  }

  return worksheet;
}

// Export single student report card to Excel file (.xlsx / .xls)
export async function exportSingleRaporXls(
  params: SingleRaporExcelDataParams,
  format: "xlsx" | "xls" = "xlsx"
): Promise<string> {
  const XLSX = await import("xlsx");
  const { siswa, type, semester } = params;
  const rows = buildSingleRaporRows(params);
  const worksheet = createRaporWorksheet(rows, type, XLSX);

  const workbook = XLSX.utils.book_new();
  const sheetName = type === "tengah" ? `Rapor STS - ${siswa.nama.slice(0, 18)}` : `Rapor SAS - ${siswa.nama.slice(0, 18)}`;
  const cleanSheetName = sheetName.replace(/[/\\?%*:[\]]/g, " ").trim().slice(0, 31);

  XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);

  const namaClean = siswa.nama.replace(/[/\\?%*:|"<>]/g, "_").trim();
  const kelasClean = siswa.kelas.replace(/[/\\?%*:|"<>]/g, "_").trim();
  const typeLabel = type === "tengah" ? "STS" : "SAS";
  const fileName = `Rapor_${typeLabel}_${namaClean}_${kelasClean}_Sem_${semester}.${format}`;

  if (format === "xls") {
    XLSX.writeFile(workbook, fileName, { bookType: "biff8" });
  } else {
    XLSX.writeFile(workbook, fileName, { bookType: "xlsx" });
  }

  return fileName;
}

export interface BatchRaporExcelDataParams {
  batchStudents: Siswa[];
  type: JenisRapor;
  semester: "Ganjil" | "Genap";
  selectedKelas: string;
  nilaiList: NilaiSiswa[];
  mapelList: MataPelajaran[];
  profile: SchoolProfile;
  kelasList?: Kelas[];
  guruList?: Guru[];
  getAttendance: (siswaId: string, siswaNama?: string) => { sakit: number; izin: number; alpa: number; hadir?: number };
  raporConfig?: any;
}

// Export entire class / batch report cards to Excel (.xlsx / .xls)
// Includes a Master "Rekap Leger & Rapor" Sheet + Individual Sheets for every student
export async function exportBatchRaporXls(
  params: BatchRaporExcelDataParams,
  format: "xlsx" | "xls" = "xlsx"
): Promise<string> {
  const XLSX = await import("xlsx");
  const {
    batchStudents,
    type,
    semester,
    selectedKelas,
    nilaiList,
    mapelList,
    profile,
    kelasList = [],
    guruList = [],
    getAttendance,
    raporConfig = {},
  } = params;

  const workbook = XLSX.utils.book_new();

  // 1. MASTER SHEET: REKAP LEGER & NILAI RAPOR KELAS
  const masterRows: (string | number)[][] = [];

  // Kop Lembaga
  masterRows.push([profile.namaSekolah ? profile.namaSekolah.toUpperCase() : "SD ISLAM TERPADU PRO"]);
  masterRows.push([
    `REKAPITULASI BUKU LEGER & NILAI RAPOR ${type === "tengah" ? "SUMATIF TENGAH SEMESTER (STS)" : "SUMATIF AKHIR SEMESTER (SAS)"}`,
  ]);
  masterRows.push([
    `Kelas: ${selectedKelas} • Tahun Ajaran: ${profile.tahunAjaranAktif} • Semester: ${semester}`,
  ]);
  masterRows.push([""]);

  // Build columns for Master Sheet
  const distinctMapelNames = Array.from(
    new Set(mapelList.map((m) => m.nama.trim()))
  );

  const headerRow: (string | number)[] = [
    "No",
    "NISN",
    "Nama Lengkap Siswa",
    "Kelas",
  ];

  distinctMapelNames.forEach((m) => {
    headerRow.push(m);
  });

  headerRow.push("Rata-Rata Nilai");
  headerRow.push("Predikat Umum");
  headerRow.push("Sakit");
  headerRow.push("Izin");
  headerRow.push("Alpa");

  masterRows.push(headerRow);

  // Fill data rows for all students
  batchStudents.forEach((siswa, idx) => {
    const studentRecords = nilaiList.filter(
      (n) =>
        n.siswaId === siswa.id &&
        (n.semester || "Ganjil").toLowerCase() === semester.toLowerCase() &&
        (type === "tengah" ? isRecordStsFilled(n) : isRecordSasFilled(n))
    );

    const att = getAttendance(siswa.id, siswa.nama);

    let totalScore = 0;
    let scoreCount = 0;

    const row: (string | number)[] = [
      idx + 1,
      siswa.nisn || "-",
      siswa.nama,
      siswa.kelas,
    ];

    distinctMapelNames.forEach((mName) => {
      const rec = studentRecords.find(
        (r) => r.mapel.toLowerCase().trim() === mName.toLowerCase().trim()
      );
      if (rec) {
        const val =
          type === "tengah"
            ? resolveStudentMidScore(rec).nilaiMid
            : resolveStudentAkhirScore(rec).nilaiAkhir;
        row.push(val);
        totalScore += val;
        scoreCount++;
      } else {
        row.push("-");
      }
    });

    const avg = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    const predikat = avg >= 88 ? "A" : avg >= 75 ? "B" : avg >= 60 ? "C" : "D";

    row.push(avg);
    row.push(predikat);
    row.push(att.sakit);
    row.push(att.izin);
    row.push(att.alpa);

    masterRows.push(row);
  });

  const masterSheet = XLSX.utils.aoa_to_sheet(masterRows);
  masterSheet["!cols"] = [
    { wch: 6 },  // No
    { wch: 16 }, // NISN
    { wch: 32 }, // Nama Siswa
    { wch: 14 }, // Kelas
    ...distinctMapelNames.map((m) => ({ wch: Math.max(m.length + 3, 12) })),
    { wch: 16 }, // Rata-Rata
    { wch: 14 }, // Predikat
    { wch: 8 },  // S
    { wch: 8 },  // I
    { wch: 8 },  // A
  ];

  XLSX.utils.book_append_sheet(workbook, masterSheet, "Rekap Rapor Leger");

  // 2. INDIVIDUAL SHEETS FOR EACH STUDENT IN CLASS
  const usedSheetNames = new Set<string>(["rekap rapor leger"]);

  batchStudents.forEach((siswa, idx) => {
    const studentRecords = nilaiList.filter(
      (n) =>
        n.siswaId === siswa.id &&
        (n.semester || "Ganjil").toLowerCase() === semester.toLowerCase() &&
        (type === "tengah" ? isRecordStsFilled(n) : isRecordSasFilled(n))
    );

    const att = getAttendance(siswa.id, siswa.nama);

    const rows = buildSingleRaporRows({
      siswa,
      type,
      semester,
      studentRecords,
      mapelList,
      profile,
      kelasList,
      guruList,
      attendance: att,
      raporConfig,
    });

    const studentSheet = createRaporWorksheet(rows, type, XLSX);

    // Generate safe sheet name (<= 31 chars, unique, no invalid chars)
    let safeName = `${idx + 1}. ${siswa.nama}`.replace(/[/\\?%*:[\]]/g, " ").trim();
    if (safeName.length > 28) safeName = safeName.slice(0, 28);
    let finalSheetName = safeName;
    let counter = 1;
    while (usedSheetNames.has(finalSheetName.toLowerCase())) {
      finalSheetName = `${safeName.slice(0, 25)}_${counter}`;
      counter++;
    }
    usedSheetNames.add(finalSheetName.toLowerCase());

    XLSX.utils.book_append_sheet(workbook, studentSheet, finalSheetName);
  });

  const classNameClean =
    selectedKelas === "Semua" ? "Semua_Kelas" : selectedKelas.replace(/[/\\?%*:|"<>]/g, "_").trim();
  const typeLabel = type === "tengah" ? "STS" : "SAS";
  const fileName = `Bundel_Rapor_${typeLabel}_Kelas_${classNameClean}_Sem_${semester}.${format}`;

  if (format === "xls") {
    XLSX.writeFile(workbook, fileName, { bookType: "biff8" });
  } else {
    XLSX.writeFile(workbook, fileName, { bookType: "xlsx" });
  }

  return fileName;
}
