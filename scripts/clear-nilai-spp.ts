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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Credentials not found");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearNilaiAndSpp() {
  console.log("==================================================================");
  console.log("🗑️ MENGOSONGKAN DATABASE: Rekap Nilai Siswa & Tagihan SPP");
  console.log(`📡 Cloud Supabase: ${supabaseUrl}`);
  console.log("==================================================================");

  // 1. Kosongkan nilai_siswa
  console.log("\n⏳ Menghapus seluruh data dari tabel [nilai_siswa]...");
  const { error: errNilai } = await supabase
    .from("nilai_siswa")
    .delete()
    .neq("id", "___none___");

  if (errNilai) {
    console.error("❌ Gagal menghapus nilai_siswa:", errNilai.message);
  } else {
    console.log("✅ Berhasil mengosongkan tabel [nilai_siswa]");
  }

  // 2. Kosongkan tagihan_siswa
  console.log("\n⏳ Menghapus seluruh data dari tabel [tagihan_siswa]...");
  const { error: errTagihan } = await supabase
    .from("tagihan_siswa")
    .delete()
    .neq("id", "___none___");

  if (errTagihan) {
    console.error("❌ Gagal menghapus tagihan_siswa:", errTagihan.message);
  } else {
    console.log("✅ Berhasil mengosongkan tabel [tagihan_siswa]");
  }

  // 3. Verifikasi jumlah data terkini
  console.log("\n🔍 Verifikasi sisa data di database Supabase:");
  const { data: checkNilai } = await supabase.from("nilai_siswa").select("id");
  const { data: checkTagihan } = await supabase.from("tagihan_siswa").select("id");

  console.log(`📊 Sisa data [nilai_siswa]: ${checkNilai ? checkNilai.length : 0} record`);
  console.log(`📊 Sisa data [tagihan_siswa]: ${checkTagihan ? checkTagihan.length : 0} record`);
  console.log("==================================================================");
}

clearNilaiAndSpp().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
