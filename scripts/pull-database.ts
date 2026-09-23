import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.substring("NEXT_PUBLIC_SUPABASE_URL=".length).trim();
    }
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      supabaseAnonKey = trimmed.substring("NEXT_PUBLIC_SUPABASE_ANON_KEY=".length).trim();
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan.");
  process.exit(1);
}

console.log("==================================================================");
console.log("📥 SIM SEKOLAH PRO - TARIK DATA SUPABASE KE SERVER LOKAL");
console.log(`📡 Sumber Cloud Supabase: ${supabaseUrl}`);
console.log("==================================================================\n");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Daftar semua tabel yang ada di Supabase
const TABLES_TO_PULL = [
  "school_profile",
  "users",
  "siswa",
  "guru",
  "kelas",
  "mata_pelajaran",
  "jadwal_pelajaran",
  "presensi",
  "jenis_tagihan",
  "tagihan_siswa",
  "tabungan_siswa",
  "transaksi_tabungan",
  "peserta_transportasi",
  "spp_transport_records",
  "transaksi_spp_transport",
  "pengumuman",
  "lms_materi",
  "lms_tugas",
  "lms_submissions",
  "lms_kuis",
  "lms_attempts",
  "lms_forum",
  "lms_meetings",
  "lms_bank_soal",
  "lms_jadwal_materi",
];

async function pullDatabase() {
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  const backupData: Record<string, any[]> = {};

  const outputDir = path.resolve(process.cwd(), "data", "supabase_backup");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const table of TABLES_TO_PULL) {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.error(`❌ [${table}] Gagal ditarik: ${error.message}`);
        failCount++;
      } else {
        const count = data ? data.length : 0;
        backupData[table] = data || [];
        // Simpan file per tabel
        fs.writeFileSync(
          path.join(outputDir, `${table}.json`),
          JSON.stringify(data || [], null, 2),
          "utf8"
        );
        console.log(`✅ [${table}] Berhasil ditarik: ${count} record tersimpan ke data/supabase_backup/${table}.json`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ [${table}] Exception: ${err.message}`);
      failCount++;
    }
  }

  // Simpan file dump keseluruhan
  const dumpFilePath = path.join(outputDir, "all_tables_dump.json");
  fs.writeFileSync(dumpFilePath, JSON.stringify(backupData, null, 2), "utf8");

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log("\n==================================================================");
  console.log(`🎉 TARIK DATA SUPABASE KE LOKAL SELESAI dalam ${duration} detik!`);
  console.log(`📁 Lokasi file backup lokal: ${outputDir}`);
  console.log(`📊 Hasil: ${successCount} tabel berhasil ditarik, ${failCount} tabel gagal.`);
  console.log("==================================================================");
}

pullDatabase().catch((e) => {
  console.error("Fatal Error during Pull Database:", e);
  process.exit(1);
});
