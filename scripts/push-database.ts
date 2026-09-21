import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import {
  INITIAL_SCHOOL_PROFILE,
  DEMO_USERS,
  INITIAL_SISWA,
  INITIAL_GURU,
  INITIAL_KELAS,
  INITIAL_MAPEL,
  INITIAL_JADWAL,
  INITIAL_PRESENSI,
  INITIAL_NILAI,
  INITIAL_JENIS_TAGIHAN,
  INITIAL_SPP,
  INITIAL_TABUNGAN,
  INITIAL_TRANSAKSI_TABUNGAN,
  INITIAL_PESERTA_TRANSPORT,
  INITIAL_SPP_TRANSPORT_RECORDS,
  INITIAL_TRANSAKSI_SPP_TRANSPORT,
  INITIAL_PENGUMUMAN,
  INITIAL_LMS_MATERI,
  INITIAL_LMS_TUGAS,
  INITIAL_LMS_SUBMISSIONS,
  INITIAL_LMS_KUIS,
  INITIAL_LMS_ATTEMPTS,
  INITIAL_LMS_FORUM,
  INITIAL_LMS_MEETINGS,
  INITIAL_LMS_BANK_SOAL,
  INITIAL_LMS_JADWAL_MATERI,
  INITIAL_TAHFIDZ_RECORDS,
  INITIAL_MUTABAAH_RECORDS,
} from "../src/lib/mock-data";

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
console.log("🚀 SIM SEKOLAH PRO - AUTOMATIC DATABASE PUSH ENGINE");
console.log(`📡 Target Cloud Supabase: ${supabaseUrl}`);
console.log("==================================================================\n");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function pushDatabase() {
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  async function pushTable(name: string, payload: any[]) {
    try {
      if (!payload || payload.length === 0) {
        console.log(`⏭️  [${name}] Kosong, dilewati.`);
        return;
      }
      const { error } = await supabase.from(name).upsert(payload);
      if (error) {
        console.error(`❌ [${name}] Gagal: ${error.message}`);
        failCount++;
      } else {
        console.log(`✅ [${name}] Berhasil diunggah: ${payload.length} data record.`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ [${name}] Exception: ${err.message}`);
      failCount++;
    }
  }

  // 1. Profil Sekolah
  console.log("Mengunggah Profil Sekolah...");
  const baseProfile = {
    id: "default_profile",
    nama_sekolah: INITIAL_SCHOOL_PROFILE.namaSekolah,
    npsn: INITIAL_SCHOOL_PROFILE.npsn,
    akreditasi: INITIAL_SCHOOL_PROFILE.akreditasi,
    alamat: INITIAL_SCHOOL_PROFILE.alamat,
    telepon: INITIAL_SCHOOL_PROFILE.telepon,
    email: INITIAL_SCHOOL_PROFILE.email,
    website: INITIAL_SCHOOL_PROFILE.website,
    kepala_sekolah: INITIAL_SCHOOL_PROFILE.kepalaSekolah,
    tahun_ajaran_aktif: INITIAL_SCHOOL_PROFILE.tahunAjaranAktif,
    semester_aktif: INITIAL_SCHOOL_PROFILE.semesterAktif,
    updated_at: new Date().toISOString(),
  };
  const extProfile = {
    ...baseProfile,
    app_name: INITIAL_SCHOOL_PROFILE.appName,
    app_tagline: INITIAL_SCHOOL_PROFILE.appTagline,
    app_logo_url: INITIAL_SCHOOL_PROFILE.appLogoUrl,
    app_icon_preset: INITIAL_SCHOOL_PROFILE.appIconPreset,
    landing_hero_badge: INITIAL_SCHOOL_PROFILE.landingHeroBadge,
    landing_hero_title: INITIAL_SCHOOL_PROFILE.landingHeroTitle,
    landing_hero_subtitle: INITIAL_SCHOOL_PROFILE.landingHeroSubtitle,
    landing_cta_text: INITIAL_SCHOOL_PROFILE.landingCtaText,
    landing_show_demo_button: INITIAL_SCHOOL_PROFILE.landingShowDemoButton,
    landing_footer_text: INITIAL_SCHOOL_PROFILE.landingFooterText,
  };

  const { error: profError } = await supabase.from("school_profile").upsert(extProfile);
  if (profError) {
    // fallback to base profile if columns not yet altered
    const { error: baseProfError } = await supabase.from("school_profile").upsert(baseProfile);
    if (baseProfError) {
      console.error(`❌ [school_profile] Gagal: ${baseProfError.message}`);
      failCount++;
    } else {
      console.log(`✅ [school_profile] Berhasil diunggah (Base columns).`);
      successCount++;
    }
  } else {
    console.log(`✅ [school_profile] Berhasil diunggah (Lengkap dengan Branding).`);
    successCount++;
  }

  // Also push extended_config row to guarantee 100% cloud persistence
  const extObj = {
    appName: INITIAL_SCHOOL_PROFILE.appName,
    appTagline: INITIAL_SCHOOL_PROFILE.appTagline,
    appLogoUrl: INITIAL_SCHOOL_PROFILE.appLogoUrl,
    appIconPreset: INITIAL_SCHOOL_PROFILE.appIconPreset,
    landingHeroBadge: INITIAL_SCHOOL_PROFILE.landingHeroBadge,
    landingHeroTitle: INITIAL_SCHOOL_PROFILE.landingHeroTitle,
    landingHeroSubtitle: INITIAL_SCHOOL_PROFILE.landingHeroSubtitle,
    landingCtaText: INITIAL_SCHOOL_PROFILE.landingCtaText,
    landingShowDemoButton: INITIAL_SCHOOL_PROFILE.landingShowDemoButton,
    landingFooterText: INITIAL_SCHOOL_PROFILE.landingFooterText,
  };
  await supabase.from("school_profile").upsert({
    id: "extended_config",
    nama_sekolah: JSON.stringify(extObj),
    updated_at: new Date().toISOString(),
  });

  // 2. Users
  await pushTable(
    "users",
    DEMO_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      nisn_or_nip: u.nisnOrNip || null,
      kelas: u.kelas || null,
      phone: u.phone || null,
      status: u.status,
      password: u.password || null,
      last_login: u.lastLogin || null,
    }))
  );

  // 3. Siswa
  await pushTable(
    "siswa",
    INITIAL_SISWA.map((s) => ({
      id: s.id,
      nisn: s.nisn || null,
      nama: s.nama,
      jenis_kelamin: s.jenisKelamin,
      kelas: s.kelas,
      jurusan: s.jurusan || null,
      tanggal_lahir: s.tanggalLahir || null,
      tempat_lahir: s.tempatLahir || null,
      alamat: s.alamat || null,
      nama_wali: s.namaWali || null,
      no_hp_wali: s.noHpWali || null,
      status: s.status || "Aktif",
      avatar: s.avatar || null,
    }))
  );

  // 4. Guru
  await pushTable(
    "guru",
    INITIAL_GURU.map((g) => ({
      id: g.id,
      nip: g.nip || null,
      nama: g.nama,
      gelar: g.gelar || null,
      jenis_kelamin: g.jenisKelamin,
      mata_pelajaran: g.mataPelajaran || [],
      kelas_wali: g.kelasWali || null,
      pendidikan_terakhir: g.pendidikanTerakhir || null,
      status_kepegawaian: g.statusKepegawaian || "Tetap Yayasan",
      email: g.email || null,
      no_hp: g.noHp || null,
      avatar: g.avatar || null,
    }))
  );

  // 5. Kelas
  await pushTable(
    "kelas",
    INITIAL_KELAS.map((k) => ({
      id: k.id,
      nama: k.nama,
      tingkat: k.tingkat || null,
      wali_kelas_id: k.waliKelasId || null,
      wali_kelas_nama: k.waliKelasNama || null,
      kapasitas: k.kapasitas || 30,
      jumlah_siswa: k.jumlahSiswa || 0,
      ruangan: k.ruangan || null,
    }))
  );

  // 6. Mata Pelajaran
  await pushTable(
    "mata_pelajaran",
    INITIAL_MAPEL.map((m) => ({
      id: m.id,
      kode: m.kode,
      nama: m.nama,
      kategori: m.kategori || "Wajib",
      kkm: m.kkm || 75,
    }))
  );

  // 7. Jadwal Pelajaran
  await pushTable(
    "jadwal_pelajaran",
    INITIAL_JADWAL.map((j) => ({
      id: j.id,
      hari: j.hari,
      jam_mulai: j.jamMulai,
      jam_selesai: j.jamSelesai,
      kelas: j.kelas,
      mapel: j.mapel,
      guru_nama: j.guruNama,
      ruangan: j.ruangan || null,
    }))
  );

  // 8. Presensi
  await pushTable(
    "presensi",
    INITIAL_PRESENSI.map((p) => ({
      id: p.id,
      siswa_id: p.siswaId,
      siswa_nama: p.siswaNama,
      kelas: p.kelas,
      tanggal: p.tanggal,
      status: p.status,
      keterangan: p.keterangan || null,
    }))
  );

  // 9. Nilai Siswa
  await pushTable(
    "nilai_siswa",
    INITIAL_NILAI.map((n) => ({
      id: n.id,
      siswa_id: n.siswaId,
      siswa_nama: n.siswaNama,
      nisn: n.nisn || null,
      kelas: n.kelas,
      mapel: n.mapel,
      semester: n.semester,
      tahun_ajaran: n.tahunAjaran,
      uh1: n.uh1 ?? null,
      uh2: n.uh2 ?? null,
      tugas: n.tugas,
      uts: n.uts,
      uas: n.uas,
      nilai_mid: n.nilaiMid ?? null,
      predikat_mid: n.predikatMid ?? null,
      catatan_mid: n.catatanMid ?? null,
      nilai_akhir: n.nilaiAkhir,
      predikat: n.predikat,
      catatan: n.catatan ?? null,
      jenis_rapor: n.jenisRapor || "semua",
    }))
  );

  // 10. Jenis Tagihan
  await pushTable(
    "jenis_tagihan",
    INITIAL_JENIS_TAGIHAN.map((jt) => ({
      id: jt.id,
      nama: jt.nama,
      kode: jt.kode,
      nominal_default: jt.nominalDefault,
      keterangan: jt.keterangan || null,
      warna_badge: jt.warnaBadge || null,
    }))
  );

  // 11. Tagihan Siswa (SPP)
  await pushTable(
    "tagihan_siswa",
    INITIAL_SPP.map((s) => ({
      id: s.id,
      siswa_id: s.siswaId,
      siswa_nama: s.siswaNama,
      nisn: s.nisn || null,
      kelas: s.kelas,
      judul: `SPP ${s.bulan} ${s.tahun}`,
      kategori: "SPP",
      nominal: s.nominal,
      jatuh_tempo: s.jatuhTempo,
      status: s.status,
      tanggal_bayar: s.tanggalBayar || null,
      metode_pembayaran: s.metodePembayaran || null,
      no_kuitansi: s.noKuitansi || null,
      keterangan: s.keterangan || null,
      bulan: s.bulan || null,
      tahun: s.tahun || null,
    }))
  );

  // 12. Tabungan Siswa
  const defaultTabungan = INITIAL_TABUNGAN.length > 0 ? INITIAL_TABUNGAN : INITIAL_SISWA.map((s, idx) => ({
    id: `tab-${s.id}`,
    siswaId: s.id,
    siswaNama: s.nama,
    nisn: s.nisn,
    kelas: s.kelas,
    saldo: (idx + 1) * 75000,
    terakhirUpdate: new Date().toISOString().split("T")[0],
  }));

  await pushTable(
    "tabungan_siswa",
    defaultTabungan.map((t) => ({
      id: t.id,
      siswa_id: t.siswaId,
      siswa_nama: t.siswaNama,
      nisn: t.nisn || null,
      kelas: t.kelas,
      saldo: t.saldo,
      terakhir_update: t.terakhirUpdate,
    }))
  );

  // 13. Transaksi Tabungan
  const defaultTrx = INITIAL_TRANSAKSI_TABUNGAN.length > 0 ? INITIAL_TRANSAKSI_TABUNGAN : defaultTabungan.map((t) => ({
    id: `trx-${t.id}-init`,
    tabunganId: t.id,
    siswaId: t.siswaId,
    siswaNama: t.siswaNama,
    nisn: t.nisn,
    kelas: t.kelas,
    tipe: "Setor",
    nominal: t.saldo,
    saldoAkhir: t.saldo,
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "Saldo Awal Pembukaan Tabungan",
    petugas: "Admin Keuangan",
    noReferensi: `TRX-${Date.now().toString().slice(-6)}`,
  }));

  await pushTable(
    "transaksi_tabungan",
    defaultTrx.map((tt) => ({
      id: tt.id,
      tabungan_id: tt.tabunganId || null,
      siswa_id: tt.siswaId,
      siswa_nama: tt.siswaNama,
      nisn: tt.nisn || null,
      kelas: tt.kelas,
      tipe: tt.tipe,
      nominal: tt.nominal,
      saldo_akhir: tt.saldoAkhir,
      tanggal: tt.tanggal,
      keterangan: tt.keterangan || null,
      petugas: tt.petugas || null,
      no_referensi: tt.noReferensi || null,
    }))
  );

  // 14. Peserta Transportasi
  await pushTable(
    "peserta_transportasi",
    INITIAL_PESERTA_TRANSPORT.map((pt) => ({
      siswa_id: pt.siswaId,
      is_aktif: pt.isAktif,
      biaya_bulanan: pt.biayaBulanan,
      rute: pt.rute || null,
    }))
  );

  // 15. Record SPP Transport
  await pushTable(
    "spp_transport_records",
    INITIAL_SPP_TRANSPORT_RECORDS.map((st) => ({
      id: st.id,
      siswa_id: st.siswaId,
      siswa_nama: st.siswaNama,
      nisn: st.nisn || null,
      kelas: st.kelas,
      tahun_ajaran: st.tahunAjaran,
      bulan: st.bulan,
    }))
  );

  // 16. Transaksi SPP Transport
  await pushTable(
    "transaksi_spp_transport",
    INITIAL_TRANSAKSI_SPP_TRANSPORT.map((tst) => ({
      id: tst.id,
      no_kuitansi: tst.noKuitansi,
      siswa_id: tst.siswaId,
      siswa_nama: tst.siswaNama,
      nisn: tst.nisn || null,
      kelas: tst.kelas,
      tahun_ajaran: tst.tahunAjaran,
      jenis: tst.jenis,
      bulan: tst.bulan,
      total_nominal: tst.totalNominal,
      metode_pembayaran: tst.metodePembayaran,
      tanggal_bayar: tst.tanggalBayar,
      petugas: tst.petugas,
      keterangan: tst.keterangan || null,
    }))
  );

  // 17. Pengumuman
  await pushTable(
    "pengumuman",
    INITIAL_PENGUMUMAN.map((peng) => ({
      id: peng.id,
      judul: peng.judul,
      konten: peng.konten,
      kategori: peng.kategori,
      prioritas: peng.prioritas,
      tanggal: peng.tanggal,
      penulis: peng.penulis,
      target_role: peng.targetRole,
    }))
  );

  // 18. LMS Materi
  await pushTable(
    "lms_materi",
    INITIAL_LMS_MATERI.map((lm) => ({
      id: lm.id,
      judul: lm.judul,
      mapel: lm.mapel,
      kelas: lm.kelas,
      guru_nama: lm.guruNama,
      guru_id: lm.guruId || null,
      deskripsi: lm.deskripsi || null,
      tipe_konten: lm.tipeKonten,
      url_konten: lm.urlKonten || null,
      file_lampiran: lm.fileLampiran || null,
      pertemuan_ke: lm.pertemuanKe,
      durasi_menit: lm.durasiMenit || null,
      sudah_dibaca_siswa_ids: lm.sudahDibacaSiswaIds || [],
    }))
  );

  // 19. LMS Tugas
  await pushTable(
    "lms_tugas",
    INITIAL_LMS_TUGAS.map((lt) => ({
      id: lt.id,
      judul: lt.judul,
      mapel: lt.mapel,
      kelas: lt.kelas,
      guru_nama: lt.guruNama,
      guru_id: lt.guruId || null,
      deskripsi: lt.deskripsi || null,
      deadline: lt.deadline,
      bobot_poin: lt.bobotPoin,
      file_petunjuk: lt.filePetunjuk || null,
    }))
  );

  // 20. LMS Submissions
  await pushTable(
    "lms_submissions",
    INITIAL_LMS_SUBMISSIONS.map((ls) => ({
      id: ls.id,
      tugas_id: ls.tugasId,
      siswa_id: ls.siswaId,
      siswa_nama: ls.siswaNama,
      siswa_nisn: ls.siswaNisn || null,
      kelas: ls.kelas,
      tanggal_kumpul: ls.tanggalKumpul,
      catatan_siswa: ls.catatanSiswa || null,
      file_jawaban_url: ls.fileJawabanUrl || null,
      status: ls.status,
      nilai: ls.nilai ?? null,
      feedback_guru: ls.feedbackGuru || null,
      dinilai_pada: ls.dinilaiPada || null,
    }))
  );

  // 21. LMS Kuis
  await pushTable(
    "lms_kuis",
    INITIAL_LMS_KUIS.map((lk) => ({
      id: lk.id,
      judul: lk.judul,
      mapel: lk.mapel,
      kelas: lk.kelas,
      guru_nama: lk.guruNama,
      durasi_menit: lk.durasiMenit,
      kkm: lk.kkm,
      deadline: lk.deadline,
      deskripsi: lk.deskripsi || null,
      soal_list: lk.soalList,
    }))
  );

  // 22. LMS Attempts
  await pushTable(
    "lms_attempts",
    INITIAL_LMS_ATTEMPTS.map((la) => ({
      id: la.id,
      kuis_id: la.kuisId,
      siswa_id: la.siswaId,
      siswa_nama: la.siswaNama,
      siswa_nisn: la.siswaNisn || null,
      kelas: la.kelas,
      jawaban: la.jawaban,
      skor: la.skor,
      total_benar: la.totalBenar,
      total_soal: la.totalSoal,
      status_lulus: la.statusLulus,
      selesai_pada: la.selesaiPada,
    }))
  );

  // 23. LMS Forum
  await pushTable(
    "lms_forum",
    INITIAL_LMS_FORUM.map((lf) => ({
      id: lf.id,
      judul: lf.judul,
      mapel: lf.mapel,
      kelas: lf.kelas,
      pembuat_nama: lf.pembuatNama,
      pembuat_role: lf.pembuatRole,
      pembuat_avatar: lf.pembuatAvatar || null,
      isi: lf.isi,
      tanggal: lf.tanggal,
      komentar_list: lf.komentarList,
    }))
  );

  // 24. LMS Virtual Meeting
  await pushTable(
    "lms_meetings",
    INITIAL_LMS_MEETINGS.map((lm) => ({
      id: lm.id,
      judul: lm.judul,
      mapel: lm.mapel,
      kelas: lm.kelas,
      guru_nama: lm.guruNama,
      platform: lm.platform,
      meeting_url: lm.meetingUrl,
      tanggal: lm.tanggal,
      jam_mulai: lm.jamMulai,
      jam_selesai: lm.jamSelesai,
      status: lm.status,
      keterangan: lm.keterangan || null,
    }))
  );

  // 25. LMS Bank Soal
  await pushTable(
    "lms_bank_soal",
    INITIAL_LMS_BANK_SOAL.map((lb) => ({
      id: lb.id,
      kode: lb.kode,
      judul: lb.judul,
      deskripsi: lb.deskripsi || null,
      mapel: lb.mapel,
      tingkat_kelas: lb.tingkatKelas,
      topik: lb.topik,
      soal_list: lb.soalList,
      pembuat_guru: lb.pembuatGuru,
      updated_at: lb.updatedAt || new Date().toISOString(),
    }))
  );

  // 26. LMS Jadwal Materi
  await pushTable(
    "lms_jadwal_materi",
    INITIAL_LMS_JADWAL_MATERI.map((lj) => ({
      id: lj.id,
      minggu_ke: lj.mingguKe,
      rentang_tanggal: lj.rentangTanggal,
      bulan: lj.bulan,
      semester: lj.semester,
      tahun_ajaran: lj.tahunAjaran,
      mapel: lj.mapel,
      kelas: lj.kelas,
      bab: lj.bab,
      sub_bab: lj.subBab,
      alokasi_jp: lj.alokasiJP,
      indikator_kompetensi: lj.indikatorKompetensi || null,
      materi_terkait_id: lj.materiTerkaitId || null,
      sudah_diajarkan: lj.sudahDiajarkan,
      tanggal_realisasi: lj.tanggalRealisasi || null,
      jam_realisasi: lj.jamRealisasi || null,
      guru_pengajar: lj.guruPengajar || null,
      guru_id: lj.guruId || null,
      catatan_pembelajaran: lj.catatanPembelajaran || null,
    }))
  );

  // 27. Tahfidz Siswa
  await pushTable(
    "tahfidz_siswa",
    INITIAL_TAHFIDZ_RECORDS.map((th) => ({
      id: th.id,
      siswa_id: th.siswaId,
      siswa_nama: th.siswaNama,
      nisn: th.nisn,
      kelas: th.kelas,
      tanggal: th.tanggal,
      jenis_setoran: th.jenisSetoran,
      juz: th.juz,
      surah: th.surah,
      ayat_mulai: th.ayatMulai,
      ayat_selesai: th.ayatSelesai,
      halaman: th.halaman || null,
      jilid_iqra: th.jilidIqra || null,
      halaman_iqra: th.halamanIqra || null,
      kelancaran: th.kelancaran,
      nilai_makhraj: th.nilaiMakhraj,
      nilai_tajwid: th.nilaiTajwid,
      catatan_ustadz: th.catatanUstadz || null,
      ustadz_pengampu: th.ustadzPengampu,
      ustadz_id: th.ustadzId || null,
    }))
  );

  // 28. Mutaba'ah Siswa
  await pushTable(
    "mutabaah_siswa",
    INITIAL_MUTABAAH_RECORDS.map((mb) => ({
      id: mb.id,
      siswa_id: mb.siswaId,
      siswa_nama: mb.siswaNama,
      nisn: mb.nisn,
      kelas: mb.kelas,
      tanggal: mb.tanggal,
      shalat_wajib: mb.shalatWajib || {},
      ibadah_sunnah: mb.ibadahSunnah || {},
      akhlak_karakter: mb.akhlakKarakter || {},
      catatan_orang_tua: mb.catatanOrangTua || null,
      skor_kebaikan: mb.skorKebaikan || 0,
      status_verifikasi: mb.statusVerifikasi || "Menunggu Verifikasi",
      catatan_guru: mb.catatanGuru || null,
      verified_by_guru: mb.verifiedByGuru || null,
    }))
  );

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log("\n==================================================================");
  console.log(`🎉 AUTOMATIC DATABASE PUSH SELESAI dalam ${duration} detik!`);
  console.log(`📊 Hasil: ${successCount} tabel berhasil, ${failCount} tabel gagal.`);
  console.log("==================================================================");
}

pushDatabase().catch((e) => {
  console.error("Fatal Error during Push Database:", e);
  process.exit(1);
});
