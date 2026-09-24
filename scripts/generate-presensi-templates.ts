import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

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
  const { data: siswaList, error } = await supabase
    .from("siswa")
    .select("id, nisn, nama, kelas")
    .order("kelas", { ascending: true })
    .order("nama", { ascending: true });

  if (error || !siswaList) {
    console.error("Error fetching siswa:", error?.message);
    return;
  }

  console.log(`Found ${siswaList.length} students to generate templates for.`);

  const targetDir = path.resolve(process.cwd(), "public/templates");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Template Harian
  const harianRows = siswaList.map((s, idx) => ({
    "No": idx + 1,
    "NISN": s.nisn || "",
    "Nama Siswa": s.nama,
    "Kelas": s.kelas || "",
    "Tanggal": todayStr,
    "Status Kehadiran": "Hadir",
    "Keterangan": "",
  }));

  const wsHarian = XLSX.utils.json_to_sheet(harianRows);
  wsHarian["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 25 },
  ];

  const wbHarian = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbHarian, wsHarian, "Presensi Harian");
  XLSX.writeFile(wbHarian, path.join(targetDir, "template_presensi_harian.xlsx"));

  // 2. Template Mingguan
  const mingguanRows = siswaList.map((s, idx) => ({
    "No": idx + 1,
    "NISN": s.nisn || "",
    "Nama Siswa": s.nama,
    "Kelas": s.kelas || "",
    "Senin": "H",
    "Selasa": "H",
    "Rabu": "H",
    "Kamis": "H",
    "Jumat": "H",
  }));

  const wsMingguan = XLSX.utils.json_to_sheet(mingguanRows);
  wsMingguan["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  const wbMingguan = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbMingguan, wsMingguan, "Presensi Mingguan");
  XLSX.writeFile(wbMingguan, path.join(targetDir, "template_presensi_mingguan.xlsx"));

  // 3. CSV Harian
  let csvContent = "No,NISN,Nama Siswa,Kelas,Tanggal,Status Kehadiran,Keterangan\n";
  siswaList.forEach((s, idx) => {
    csvContent += `${idx + 1},"${s.nisn || ""}","${s.nama}","${s.kelas || ""}","${todayStr}","Hadir",""\n`;
  });
  fs.writeFileSync(path.join(targetDir, "template_presensi_harian.csv"), "\ufeff" + csvContent, "utf8");

  console.log("Templates generated successfully in public/templates!");
}

main().catch(console.error);
