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
  const { data: nilai, error: errNilai } = await supabase.from("nilai_siswa").select("id");
  const { data: tagihan, error: errTagihan } = await supabase.from("tagihan_siswa").select("id");
  const { data: sppTrans, error: errSppTrans } = await supabase.from("spp_transport_records").select("id");
  const { data: transSpp, error: errTransSpp } = await supabase.from("transaksi_spp_transport").select("id");

  console.log("nilai_siswa count:", nilai ? nilai.length : 0, "error:", errNilai?.message || "none");
  console.log("tagihan_siswa count:", tagihan ? tagihan.length : 0, "error:", errTagihan?.message || "none");
  console.log("spp_transport_records count:", sppTrans ? sppTrans.length : 0, "error:", errSppTrans?.message || "none");
  console.log("transaksi_spp_transport count:", transSpp ? transSpp.length : 0, "error:", errTransSpp?.message || "none");
}

check();
