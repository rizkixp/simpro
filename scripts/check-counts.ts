import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const tables = [
    "siswa",
    "guru",
    "kelas",
    "mata_pelajaran",
    "jadwal_pelajaran",
    "presensi",
    "nilai_siswa",
    "tagihan_siswa",
    "tabungan_siswa",
    "transaksi_tabungan",
    "peserta_transportasi",
    "spp_transport_records",
    "transaksi_spp_transport",
    "pengumuman",
  ];

  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    console.log(`${t} count:`, count ?? 0, "error:", error?.message || "none");
  }

  const dummySiswaIds = ["sis-001", "sis-002", "sis-003", "sis-004", "sis-005", "sis-006", "sis-007", "sis-008"];
  const { data: dummySiswa } = await supabase.from("siswa").select("id, nama").in("id", dummySiswaIds);
  console.log("\n--- AUDIT STATUS ---");
  console.log("Dummy siswa found in Supabase:", dummySiswa?.length || 0, dummySiswa?.map(s => s.nama));
  
  const { count: realCount } = await supabase.from("siswa").select("*", { count: "exact", head: true }).not("id", "in", `(${dummySiswaIds.join(",")})`);
  console.log("Real siswa SDI count in Supabase:", realCount || 0);

  const dummyGuruIds = ["gur-001", "gur-002", "gur-003", "gur-004", "gur-005", "gur-006"];
  const { data: dummyGuru } = await supabase.from("guru").select("id, nama").in("id", dummyGuruIds);
  console.log("Dummy guru found in Supabase:", dummyGuru?.length || 0);
}

check();
