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

async function main() {
  const { data: siswa, error } = await supabase.from("siswa").select("id, nama, kelas, jenis_kelamin, status");
  if (error) {
    console.error("Error fetching siswa:", error.message);
    return;
  }

  console.log(`TOTAL_SISWA_SUPABASE: ${siswa.length}`);

  const byClass: Record<string, number> = {};
  let laki = 0;
  let perempuan = 0;
  let aktif = 0;

  for (const s of siswa) {
    const k = s.kelas || "Tanpa Kelas";
    byClass[k] = (byClass[k] || 0) + 1;
    if (s.jenis_kelamin === "L") laki++;
    else if (s.jenis_kelamin === "P") perempuan++;
    if (s.status === "Aktif") aktif++;
  }

  console.log("\nRincian per Kelas:");
  for (const [k, count] of Object.entries(byClass).sort()) {
    console.log(`- ${k}: ${count} siswa`);
  }

  console.log(`\nJenis Kelamin:`);
  console.log(`- Laki-laki: ${laki}`);
  console.log(`- Perempuan: ${perempuan}`);
  const backupPath = path.resolve(process.cwd(), "data", "supabase_backup", "siswa.json");
  if (fs.existsSync(backupPath)) {
    const backupSiswa = JSON.parse(fs.readFileSync(backupPath, "utf8"));
    const backupIds = new Set(backupSiswa.map((b: any) => b.id));
    const newStudents = siswa.filter((s) => !backupIds.has(s.id));
    console.log(`\nSiswa baru di Supabase (tidak ada di file backup lama): ${newStudents.length}`);
    newStudents.forEach(s => console.log(`- [${s.kelas}] ${s.nama} (${s.id})`));
  }
}

main();
