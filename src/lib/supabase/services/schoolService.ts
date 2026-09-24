import { getSupabaseBrowserClient, isSupabaseConfigured } from "../client";
import {
  Siswa,
  Guru,
  Kelas,
  MataPelajaran,
  JadwalPelajaran,
  PresensiRecord,
  NilaiSiswa,
  SchoolProfile,
  TagihanSiswa,
  TabunganSiswa,
  TransaksiTabungan,
  Pengumuman,
  JenisTagihan,
  PesertaTransportasi,
  RecordSPPTransportTahunAjaran,
  TransaksiSPPTransport,
  LMSMateri,
  LMSTugas,
  LMSSubmission,
  LMSKuis,
  LMSKuisAttempt,
  LMSForumDiskusi,
  LMSVirtualMeeting,
  LMSBankSoal,
  LMSJadwalMateri,
  User,
  TahfidzRecord,
  MutabaahRecord,
} from "@/types/school";

export interface SupabaseHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  latencyMs: number;
  url: string | null;
  error?: string;
  tableCounts?: Record<string, number>;
}

export const SupabaseSchoolService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async testConnection(): Promise<SupabaseHealthStatus> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
    if (!this.isConfigured()) {
      return {
        isConfigured: false,
        isConnected: false,
        latencyMs: 0,
        url,
        error: "Kredensial Supabase belum dikonfigurasi di .env.local",
      };
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      return {
        isConfigured: true,
        isConnected: false,
        latencyMs: 0,
        url,
        error: "Gagal menginisialisasi klien Supabase",
      };
    }

    const startTime = performance.now();
    try {
      const [siswaRes, guruRes, kelasRes, profRes] = await Promise.all([
        client.from("siswa").select("id", { count: "exact", head: true }),
        client.from("guru").select("id", { count: "exact", head: true }),
        client.from("kelas").select("id", { count: "exact", head: true }),
        client.from("school_profile").select("id", { count: "exact", head: true }),
      ]);

      const latencyMs = Math.round(performance.now() - startTime);

      const firstError = siswaRes.error || guruRes.error || kelasRes.error || profRes.error;
      if (firstError) {
        return {
          isConfigured: true,
          isConnected: false,
          latencyMs,
          url,
          error: firstError.message,
        };
      }

      return {
        isConfigured: true,
        isConnected: true,
        latencyMs,
        url,
        tableCounts: {
          siswa: siswaRes.count || 0,
          guru: guruRes.count || 0,
          kelas: kelasRes.count || 0,
          school_profile: profRes.count || 0,
        },
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        isConnected: false,
        latencyMs: Math.round(performance.now() - startTime),
        url,
        error: err.message || "Gagal menghubungi server Supabase",
      };
    }
  },

  // ==================== PROFIL SEKOLAH ====================
  async getProfile(): Promise<SchoolProfile | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client
      .from("school_profile")
      .select("*");
    if (error || !data || data.length === 0) return null;

    const defaultRow = data.find((r: any) => r.id === "default_profile") || data[0];
    const extRow = data.find((r: any) => r.id === "extended_config");

    let extData: any = {};
    if (extRow && extRow.nama_sekolah) {
      try {
        extData = JSON.parse(extRow.nama_sekolah);
      } catch (e) {
        console.warn("[getProfile] Gagal parse extended_config:", e);
      }
    }

    return {
      namaSekolah: extData.namaSekolah || defaultRow.nama_sekolah || "",
      npsn: extData.npsn || defaultRow.npsn || "",
      akreditasi: extData.akreditasi || defaultRow.akreditasi || "",
      alamat: extData.alamat || defaultRow.alamat || "",
      telepon: extData.telepon || defaultRow.telepon || "",
      email: extData.email || defaultRow.email || "",
      website: extData.website || defaultRow.website || "",
      kepalaSekolah: extData.kepalaSekolah || defaultRow.kepala_sekolah || "",
      tahunAjaranAktif: extData.tahunAjaranAktif || defaultRow.tahun_ajaran_aktif || "2025/2026",
      semesterAktif: extData.semesterAktif || defaultRow.semester_aktif || "Ganjil",
      appName:
        defaultRow.app_name !== undefined && defaultRow.app_name !== null && defaultRow.app_name !== ""
          ? defaultRow.app_name
          : extData.appName !== undefined
          ? extData.appName
          : "",
      appTagline:
        defaultRow.app_tagline !== undefined && defaultRow.app_tagline !== null && defaultRow.app_tagline !== ""
          ? defaultRow.app_tagline
          : extData.appTagline !== undefined
          ? extData.appTagline
          : "",
      appLogoUrl:
        defaultRow.app_logo_url !== undefined && defaultRow.app_logo_url !== null && defaultRow.app_logo_url !== ""
          ? defaultRow.app_logo_url
          : extData.appLogoUrl !== undefined
          ? extData.appLogoUrl
          : "",
      appIconPreset:
        defaultRow.app_icon_preset !== undefined && defaultRow.app_icon_preset !== null && defaultRow.app_icon_preset !== ""
          ? defaultRow.app_icon_preset
          : extData.appIconPreset !== undefined
          ? extData.appIconPreset
          : "graduation",
      landingHeroBadge:
        defaultRow.landing_hero_badge !== undefined && defaultRow.landing_hero_badge !== null && defaultRow.landing_hero_badge !== ""
          ? defaultRow.landing_hero_badge
          : extData.landingHeroBadge !== undefined
          ? extData.landingHeroBadge
          : "",
      landingHeroTitle:
        defaultRow.landing_hero_title !== undefined && defaultRow.landing_hero_title !== null && defaultRow.landing_hero_title !== ""
          ? defaultRow.landing_hero_title
          : extData.landingHeroTitle !== undefined
          ? extData.landingHeroTitle
          : "",
      landingHeroSubtitle:
        defaultRow.landing_hero_subtitle !== undefined && defaultRow.landing_hero_subtitle !== null && defaultRow.landing_hero_subtitle !== ""
          ? defaultRow.landing_hero_subtitle
          : extData.landingHeroSubtitle !== undefined
          ? extData.landingHeroSubtitle
          : "",
      landingCtaText:
        defaultRow.landing_cta_text !== undefined && defaultRow.landing_cta_text !== null && defaultRow.landing_cta_text !== ""
          ? defaultRow.landing_cta_text
          : extData.landingCtaText !== undefined
          ? extData.landingCtaText
          : "",
      landingShowDemoButton:
        defaultRow.landing_show_demo_button !== undefined && defaultRow.landing_show_demo_button !== null
          ? defaultRow.landing_show_demo_button
          : extData.landingShowDemoButton !== undefined
          ? extData.landingShowDemoButton
          : true,
      landingFooterText:
        defaultRow.landing_footer_text !== undefined && defaultRow.landing_footer_text !== null && defaultRow.landing_footer_text !== ""
          ? defaultRow.landing_footer_text
          : extData.landingFooterText !== undefined
          ? extData.landingFooterText
          : "",
    };
  },

  async updateProfile(profile: SchoolProfile): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;

    const nowIso = new Date().toISOString();

    const basePayload: any = {
      id: "default_profile",
      nama_sekolah: profile.namaSekolah,
      npsn: profile.npsn,
      akreditasi: profile.akreditasi,
      alamat: profile.alamat,
      telepon: profile.telepon,
      email: profile.email,
      website: profile.website,
      kepala_sekolah: profile.kepalaSekolah,
      tahun_ajaran_aktif: profile.tahunAjaranAktif,
      semester_aktif: profile.semesterAktif,
      updated_at: nowIso,
    };

    const extendedPayload = {
      ...basePayload,
      ...(profile.appName !== undefined ? { app_name: profile.appName } : {}),
      ...(profile.appTagline !== undefined ? { app_tagline: profile.appTagline } : {}),
      ...(profile.appLogoUrl !== undefined ? { app_logo_url: profile.appLogoUrl } : {}),
      ...(profile.appIconPreset !== undefined ? { app_icon_preset: profile.appIconPreset } : {}),
      ...(profile.landingHeroBadge !== undefined ? { landing_hero_badge: profile.landingHeroBadge } : {}),
      ...(profile.landingHeroTitle !== undefined ? { landing_hero_title: profile.landingHeroTitle } : {}),
      ...(profile.landingHeroSubtitle !== undefined ? { landing_hero_subtitle: profile.landingHeroSubtitle } : {}),
      ...(profile.landingCtaText !== undefined ? { landing_cta_text: profile.landingCtaText } : {}),
      ...(profile.landingShowDemoButton !== undefined ? { landing_show_demo_button: profile.landingShowDemoButton } : {}),
      ...(profile.landingFooterText !== undefined ? { landing_footer_text: profile.landingFooterText } : {}),
    };

    // 1. Try upserting extended fields to default_profile
    const { error: extError } = await client.from("school_profile").upsert(extendedPayload);

    // If extendedPayload failed because columns don't exist in Supabase schema, fallback to basePayload
    if (extError) {
      await client.from("school_profile").upsert(basePayload);
    }

    // 2. ALSO save extended properties to 'extended_config' row as JSON in nama_sekolah
    // This guarantees 100% persistence in Supabase even when the database table lacks new columns
    const extObj = {
      ...profile,
      appName: profile.appName,
      appTagline: profile.appTagline,
      appLogoUrl: profile.appLogoUrl,
      appIconPreset: profile.appIconPreset,
      landingHeroBadge: profile.landingHeroBadge,
      landingHeroTitle: profile.landingHeroTitle,
      landingHeroSubtitle: profile.landingHeroSubtitle,
      landingCtaText: profile.landingCtaText,
      landingShowDemoButton: profile.landingShowDemoButton,
      landingFooterText: profile.landingFooterText,
    };

    const extConfigRow = {
      id: "extended_config",
      nama_sekolah: JSON.stringify(extObj),
      updated_at: nowIso,
    };

    await client.from("school_profile").upsert(extConfigRow);

    return true;
  },

  // ==================== USERS ====================
  async getUsers(): Promise<User[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("users").select("*").order("name");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      role: d.role,
      avatar: d.avatar || "",
      nisnOrNip: d.nisn_or_nip,
      kelas: d.kelas,
      phone: d.phone,
      status: d.status || "Aktif",
      password: d.password,
      lastLogin: d.last_login,
      createdAt: d.created_at,
    }));
  },

  async upsertUser(user: User): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("users").upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      nisn_or_nip: user.nisnOrNip || null,
      kelas: user.kelas || null,
      phone: user.phone || null,
      status: user.status,
      password: user.password || null,
      last_login: user.lastLogin || null,
    });
    return !error;
  },

  async deleteUser(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("users").delete().eq("id", id);
    return !error;
  },

  // ==================== SISWA ====================
  async getSiswaList(): Promise<Siswa[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("siswa").select("*").order("nama");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      nisn: d.nisn || "",
      nama: d.nama,
      jenisKelamin: d.jenis_kelamin,
      kelas: d.kelas,
      jurusan: d.jurusan || "",
      tanggalLahir: d.tanggal_lahir || "",
      tempatLahir: d.tempat_lahir || "",
      alamat: d.alamat || "",
      namaWali: d.nama_wali || "",
      noHpWali: d.no_hp_wali || "",
      status: d.status || "Aktif",
      avatar: d.avatar || "",
    }));
  },

  async upsertSiswa(siswa: Siswa): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("siswa").upsert({
      id: siswa.id,
      nisn: siswa.nisn?.trim() ? siswa.nisn.trim() : null,
      nama: siswa.nama,
      jenis_kelamin: siswa.jenisKelamin,
      kelas: siswa.kelas,
      jurusan: siswa.jurusan || null,
      tanggal_lahir: siswa.tanggalLahir,
      tempat_lahir: siswa.tempatLahir,
      alamat: siswa.alamat,
      nama_wali: siswa.namaWali,
      no_hp_wali: siswa.noHpWali,
      status: siswa.status,
      avatar: siswa.avatar,
    });
    if (error) {
      console.error("[Supabase] upsertSiswa error:", error);
    }
    return !error;
  },

  async bulkUpsertSiswa(items: Siswa[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || items.length === 0) return false;
    const payload = items.map((siswa) => ({
      id: siswa.id,
      nisn: siswa.nisn?.trim() ? siswa.nisn.trim() : null,
      nama: siswa.nama,
      jenis_kelamin: siswa.jenisKelamin,
      kelas: siswa.kelas,
      jurusan: siswa.jurusan || null,
      tanggal_lahir: siswa.tanggalLahir,
      tempat_lahir: siswa.tempatLahir,
      alamat: siswa.alamat,
      nama_wali: siswa.namaWali,
      no_hp_wali: siswa.noHpWali,
      status: siswa.status,
      avatar: siswa.avatar,
    }));
    const { error } = await client.from("siswa").upsert(payload);
    if (error) {
      console.error("[Supabase] bulkUpsertSiswa error:", error);
    }
    return !error;
  },

  async deleteSiswa(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("siswa").delete().eq("id", id);
    return !error;
  },

  async bulkDeleteSiswa(ids: string[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || ids.length === 0) return false;
    const { error } = await client.from("siswa").delete().in("id", ids);
    return !error;
  },

  // ==================== GURU ====================
  async getGuruList(): Promise<Guru[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("guru").select("*").order("nama");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      nip: d.nip || "",
      nama: d.nama,
      gelar: d.gelar || "",
      jenisKelamin: d.jenis_kelamin || "L",
      mataPelajaran: Array.isArray(d.mata_pelajaran) ? d.mata_pelajaran : [],
      kelasWali: d.kelas_wali || "",
      pendidikanTerakhir: d.pendidikan_terakhir || "",
      statusKepegawaian: d.status_kepegawaian || "Tetap Yayasan",
      email: d.email || "",
      noHp: d.no_hp || "",
      avatar: d.avatar || "",
    }));
  },

  async upsertGuru(guru: Guru): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("guru").upsert({
      id: guru.id,
      nip: guru.nip,
      nama: guru.nama,
      gelar: guru.gelar,
      jenis_kelamin: guru.jenisKelamin,
      mata_pelajaran: guru.mataPelajaran,
      kelas_wali: guru.kelasWali || null,
      pendidikan_terakhir: guru.pendidikanTerakhir,
      status_kepegawaian: guru.statusKepegawaian,
      email: guru.email,
      no_hp: guru.noHp,
      avatar: guru.avatar,
    });
    return !error;
  },

  async deleteGuru(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("guru").delete().eq("id", id);
    return !error;
  },

  // ==================== KELAS ====================
  async getKelasList(): Promise<Kelas[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("kelas").select("*").order("nama");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      nama: d.nama,
      tingkat: d.tingkat,
      waliKelasId: d.wali_kelas_id || "",
      waliKelasNama: d.wali_kelas_nama || "",
      kapasitas: d.kapasitas || 30,
      jumlahSiswa: d.jumlah_siswa || 0,
      ruangan: d.ruangan || "",
    }));
  },

  async upsertKelas(kelas: Kelas): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("kelas").upsert({
      id: kelas.id,
      nama: kelas.nama,
      tingkat: kelas.tingkat,
      wali_kelas_id: kelas.waliKelasId || null,
      wali_kelas_nama: kelas.waliKelasNama || null,
      kapasitas: kelas.kapasitas,
      jumlah_siswa: kelas.jumlahSiswa,
      ruangan: kelas.ruangan || null,
    });
    return !error;
  },

  async deleteKelas(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("kelas").delete().eq("id", id);
    return !error;
  },

  // ==================== MATA PELAJARAN ====================
  async getMapelList(): Promise<MataPelajaran[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("mata_pelajaran").select("*").order("nama");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      kode: d.kode,
      nama: d.nama,
      kategori: d.kategori || "Wajib",
      kkm: Number(d.kkm) || 75,
    }));
  },

  async upsertMapel(mapel: MataPelajaran): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("mata_pelajaran").upsert({
      id: mapel.id,
      kode: mapel.kode,
      nama: mapel.nama,
      kategori: mapel.kategori,
      kkm: mapel.kkm,
    });
    return !error;
  },

  async deleteMapel(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("mata_pelajaran").delete().eq("id", id);
    return !error;
  },

  // ==================== JADWAL PELAJARAN ====================
  async getJadwalList(): Promise<JadwalPelajaran[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("jadwal_pelajaran").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      hari: d.hari,
      jamMulai: d.jam_mulai,
      jamSelesai: d.jam_selesai,
      kelas: d.kelas,
      mapel: d.mapel,
      guruNama: d.guru_nama,
      ruangan: d.ruangan || "",
    }));
  },

  async upsertJadwal(jadwal: JadwalPelajaran): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("jadwal_pelajaran").upsert({
      id: jadwal.id,
      hari: jadwal.hari,
      jam_mulai: jadwal.jamMulai,
      jam_selesai: jadwal.jamSelesai,
      kelas: jadwal.kelas,
      mapel: jadwal.mapel,
      guru_nama: jadwal.guruNama,
      ruangan: jadwal.ruangan || null,
    });
    return !error;
  },

  async bulkUpsertJadwal(items: JadwalPelajaran[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || items.length === 0) return false;
    const payload = items.map((j) => ({
      id: j.id,
      hari: j.hari,
      jam_mulai: j.jamMulai,
      jam_selesai: j.jamSelesai,
      kelas: j.kelas,
      mapel: j.mapel,
      guru_nama: j.guruNama,
      ruangan: j.ruangan || null,
    }));
    const { error } = await client.from("jadwal_pelajaran").upsert(payload);
    return !error;
  },

  async deleteJadwal(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("jadwal_pelajaran").delete().eq("id", id);
    return !error;
  },

  async bulkDeleteJadwal(ids: string[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || ids.length === 0) return false;
    const { error } = await client.from("jadwal_pelajaran").delete().in("id", ids);
    return !error;
  },

  // ==================== PRESENSI ====================
  async getPresensiList(): Promise<PresensiRecord[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("presensi").select("*").order("tanggal", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      kelas: d.kelas,
      tanggal: d.tanggal,
      status: d.status,
      keterangan: d.keterangan || "",
    }));
  },

  async upsertPresensi(rec: PresensiRecord): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("presensi").upsert({
      id: rec.id,
      siswa_id: rec.siswaId,
      siswa_nama: rec.siswaNama,
      kelas: rec.kelas,
      tanggal: rec.tanggal,
      status: rec.status,
      keterangan: rec.keterangan || null,
    });
    return !error;
  },

  async upsertPresensiBatch(records: PresensiRecord[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || records.length === 0) return false;
    const payload = records.map((rec) => ({
      id: rec.id,
      siswa_id: rec.siswaId,
      siswa_nama: rec.siswaNama,
      kelas: rec.kelas,
      tanggal: rec.tanggal,
      status: rec.status,
      keterangan: rec.keterangan || null,
    }));
    const { error } = await client.from("presensi").upsert(payload, { onConflict: "id" });
    return !error;
  },

  async deletePresensi(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("presensi").delete().eq("id", id);
    return !error;
  },

  async deletePresensiBySiswaTanggal(siswaId: string, tanggal: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("presensi").delete().eq("siswa_id", siswaId).eq("tanggal", tanggal);
    return !error;
  },

  async deletePresensiBySiswa(siswaId: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("presensi").delete().eq("siswa_id", siswaId);
    return !error;
  },

  // ==================== NILAI SISWA ====================
  async getNilaiList(): Promise<NilaiSiswa[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("nilai_siswa").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      mapel: d.mapel,
      semester: d.semester,
      tahunAjaran: d.tahun_ajaran,
      uh1: d.uh1 !== null ? Number(d.uh1) : undefined,
      uh2: d.uh2 !== null ? Number(d.uh2) : undefined,
      tugas: Number(d.tugas) || 0,
      uts: Number(d.uts) || 0,
      uas: Number(d.uas) || 0,
      nilaiMid: d.nilai_mid !== null ? Number(d.nilai_mid) : undefined,
      predikatMid: d.predikat_mid || undefined,
      catatanMid: d.catatan_mid || undefined,
      nilaiAkhir: Number(d.nilai_akhir) || 0,
      predikat: d.predikat || "C",
      catatan: d.catatan || "",
      jenisRapor: d.jenis_rapor || "semua",
    }));
  },

  async upsertNilai(nilai: NilaiSiswa): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("nilai_siswa").upsert({
      id: nilai.id,
      siswa_id: nilai.siswaId,
      siswa_nama: nilai.siswaNama,
      nisn: nilai.nisn || null,
      kelas: nilai.kelas,
      mapel: nilai.mapel,
      semester: nilai.semester,
      tahun_ajaran: nilai.tahunAjaran,
      uh1: nilai.uh1 ?? null,
      uh2: nilai.uh2 ?? null,
      tugas: nilai.tugas,
      uts: nilai.uts,
      uas: nilai.uas,
      nilai_mid: nilai.nilaiMid ?? null,
      predikat_mid: nilai.predikatMid ?? null,
      catatan_mid: nilai.catatanMid ?? null,
      nilai_akhir: nilai.nilaiAkhir,
      predikat: nilai.predikat,
      catatan: nilai.catatan ?? null,
      jenis_rapor: nilai.jenisRapor || "semua",
    });
    return !error;
  },

  async bulkUpsertNilai(items: NilaiSiswa[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || items.length === 0) return false;
    const payload = items.map((n) => ({
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
    }));
    const { error } = await client.from("nilai_siswa").upsert(payload);
    return !error;
  },

  async deleteNilai(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("nilai_siswa").delete().eq("id", id);
    return !error;
  },

  async deleteNilaiBySiswa(siswaId: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("nilai_siswa").delete().eq("siswa_id", siswaId);
    return !error;
  },

  // ==================== KEUANGAN & TAGIHAN ====================
  async getJenisTagihanList(): Promise<JenisTagihan[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("jenis_tagihan").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      nama: d.nama,
      kode: d.kode,
      nominalDefault: Number(d.nominal_default) || 0,
      keterangan: d.keterangan || "",
      warnaBadge: d.warna_badge || "",
    }));
  },

  async upsertJenisTagihan(item: JenisTagihan): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("jenis_tagihan").upsert({
      id: item.id,
      nama: item.nama,
      kode: item.kode,
      nominal_default: item.nominalDefault,
      keterangan: item.keterangan || null,
      warna_badge: item.warnaBadge || null,
    });
    return !error;
  },

  async deleteJenisTagihan(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("jenis_tagihan").delete().eq("id", id);
    return !error;
  },

  async getTagihanList(): Promise<TagihanSiswa[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("tagihan_siswa").select("*").order("created_at", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      judul: d.judul,
      kategori: d.kategori,
      nominal: Number(d.nominal) || 0,
      jatuhTempo: d.jatuh_tempo,
      status: d.status,
      tanggalBayar: d.tanggal_bayar,
      metodePembayaran: d.metode_pembayaran,
      noKuitansi: d.no_kuitansi,
      keterangan: d.keterangan,
      bulan: d.bulan,
      tahun: d.tahun ? Number(d.tahun) : undefined,
    }));
  },

  async upsertTagihan(tagihan: TagihanSiswa): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("tagihan_siswa").upsert({
      id: tagihan.id,
      siswa_id: tagihan.siswaId,
      siswa_nama: tagihan.siswaNama,
      nisn: tagihan.nisn || null,
      kelas: tagihan.kelas,
      judul: tagihan.judul,
      kategori: tagihan.kategori,
      nominal: tagihan.nominal,
      jatuh_tempo: tagihan.jatuhTempo,
      status: tagihan.status,
      tanggal_bayar: tagihan.tanggalBayar || null,
      metode_pembayaran: tagihan.metodePembayaran || null,
      no_kuitansi: tagihan.noKuitansi || null,
      keterangan: tagihan.keterangan || null,
      bulan: tagihan.bulan || null,
      tahun: tagihan.tahun || null,
    });
    return !error;
  },

  async bulkUpsertTagihan(items: TagihanSiswa[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || items.length === 0) return false;
    const payload = items.map((t) => ({
      id: t.id,
      siswa_id: t.siswaId,
      siswa_nama: t.siswaNama,
      nisn: t.nisn || null,
      kelas: t.kelas,
      judul: t.judul,
      kategori: t.kategori,
      nominal: t.nominal,
      jatuh_tempo: t.jatuhTempo,
      status: t.status,
      tanggal_bayar: t.tanggalBayar || null,
      metode_pembayaran: t.metodePembayaran || null,
      no_kuitansi: t.noKuitansi || null,
      keterangan: t.keterangan || null,
      bulan: t.bulan || null,
      tahun: t.tahun || null,
    }));
    const { error } = await client.from("tagihan_siswa").upsert(payload);
    return !error;
  },

  async deleteTagihan(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("tagihan_siswa").delete().eq("id", id);
    return !error;
  },

  async bulkDeleteTagihan(ids: string[]): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client || ids.length === 0) return false;
    const { error } = await client.from("tagihan_siswa").delete().in("id", ids);
    return !error;
  },

  // ==================== TABUNGAN SISWA ====================
  async getTabunganList(): Promise<TabunganSiswa[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("tabungan_siswa").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      saldo: Number(d.saldo) || 0,
      terakhirUpdate: d.terakhir_update || "",
    }));
  },

  async upsertTabungan(tabungan: TabunganSiswa): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("tabungan_siswa").upsert({
      id: tabungan.id,
      siswa_id: tabungan.siswaId,
      siswa_nama: tabungan.siswaNama,
      nisn: tabungan.nisn || null,
      kelas: tabungan.kelas,
      saldo: tabungan.saldo,
      terakhir_update: tabungan.terakhirUpdate,
    });
    return !error;
  },

  async getTransaksiTabunganList(): Promise<TransaksiTabungan[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("transaksi_tabungan").select("*").order("tanggal", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      tabunganId: d.tabungan_id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      tipe: d.tipe,
      nominal: Number(d.nominal) || 0,
      saldoAkhir: Number(d.saldo_akhir) || 0,
      tanggal: d.tanggal,
      keterangan: d.keterangan || "",
      petugas: d.petugas || "",
      noReferensi: d.no_referensi || "",
    }));
  },

  async insertTransaksiTabungan(trx: TransaksiTabungan): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("transaksi_tabungan").insert({
      id: trx.id,
      tabungan_id: trx.tabunganId || null,
      siswa_id: trx.siswaId,
      siswa_nama: trx.siswaNama,
      nisn: trx.nisn || null,
      kelas: trx.kelas,
      tipe: trx.tipe,
      nominal: trx.nominal,
      saldo_akhir: trx.saldoAkhir,
      tanggal: trx.tanggal,
      keterangan: trx.keterangan || null,
      petugas: trx.petugas || null,
      no_referensi: trx.noReferensi || null,
    });
    return !error;
  },

  // ==================== TRANSPORTASI & SPP TRANSPORT ====================
  async getPesertaTransportList(): Promise<PesertaTransportasi[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("peserta_transportasi").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      siswaId: d.siswa_id,
      isAktif: Boolean(d.is_aktif),
      biayaBulanan: Number(d.biaya_bulanan) || 0,
      rute: d.rute || "",
    }));
  },

  async upsertPesertaTransport(item: PesertaTransportasi): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("peserta_transportasi").upsert({
      siswa_id: item.siswaId,
      is_aktif: item.isAktif,
      biaya_bulanan: item.biayaBulanan,
      rute: item.rute || null,
    });
    return !error;
  },

  async getSPPTransportRecords(): Promise<RecordSPPTransportTahunAjaran[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("spp_transport_records").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      tahunAjaran: d.tahun_ajaran,
      bulan: typeof d.bulan === "object" && d.bulan ? d.bulan : {},
    }));
  },

  async upsertSPPTransportRecord(rec: RecordSPPTransportTahunAjaran): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("spp_transport_records").upsert({
      id: rec.id,
      siswa_id: rec.siswaId,
      siswa_nama: rec.siswaNama,
      nisn: rec.nisn || null,
      kelas: rec.kelas,
      tahun_ajaran: rec.tahunAjaran,
      bulan: rec.bulan,
    });
    return !error;
  },

  async getTransaksiSPPTransportList(): Promise<TransaksiSPPTransport[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("transaksi_spp_transport").select("*").order("tanggal_bayar", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      noKuitansi: d.no_kuitansi,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      tahunAjaran: d.tahun_ajaran,
      jenis: d.jenis,
      bulan: Array.isArray(d.bulan) ? d.bulan : [],
      totalNominal: Number(d.total_nominal) || 0,
      metodePembayaran: d.metode_pembayaran,
      tanggalBayar: d.tanggal_bayar,
      petugas: d.petugas || "",
      keterangan: d.keterangan || "",
    }));
  },

  async insertTransaksiSPPTransport(trx: TransaksiSPPTransport): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("transaksi_spp_transport").insert({
      id: trx.id,
      no_kuitansi: trx.noKuitansi,
      siswa_id: trx.siswaId,
      siswa_nama: trx.siswaNama,
      nisn: trx.nisn || null,
      kelas: trx.kelas,
      tahun_ajaran: trx.tahunAjaran,
      jenis: trx.jenis,
      bulan: trx.bulan,
      total_nominal: trx.totalNominal,
      metode_pembayaran: trx.metodePembayaran,
      tanggal_bayar: trx.tanggalBayar,
      petugas: trx.petugas,
      keterangan: trx.keterangan || null,
    });
    return !error;
  },

  // ==================== PENGUMUMAN ====================
  async getPengumumanList(): Promise<Pengumuman[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("pengumuman").select("*").order("tanggal", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      judul: d.judul,
      konten: d.konten,
      kategori: d.kategori,
      prioritas: d.prioritas || "Normal",
      tanggal: d.tanggal,
      penulis: d.penulis,
      targetRole: d.target_role || "Semua",
    }));
  },

  async upsertPengumuman(item: Pengumuman): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("pengumuman").upsert({
      id: item.id,
      judul: item.judul,
      konten: item.konten,
      kategori: item.kategori,
      prioritas: item.prioritas,
      tanggal: item.tanggal,
      penulis: item.penulis,
      target_role: item.targetRole,
    });
    return !error;
  },

  async deletePengumuman(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("pengumuman").delete().eq("id", id);
    return !error;
  },

  // ==================== LMS MODULES ====================
  async getLMSMateri(): Promise<LMSMateri[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_materi").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      judul: d.judul,
      mapel: d.mapel,
      kelas: d.kelas,
      guruNama: d.guru_nama,
      guruId: d.guru_id || undefined,
      deskripsi: d.deskripsi || "",
      tipeKonten: d.tipe_konten,
      urlKonten: d.url_konten || undefined,
      fileLampiran: d.file_lampiran || undefined,
      pertemuanKe: Number(d.pertemuan_ke) || 1,
      durasiMenit: d.durasi_menit ? Number(d.durasi_menit) : undefined,
      createdAt: d.created_at,
      sudahDibacaSiswaIds: Array.isArray(d.sudah_dibaca_siswa_ids) ? d.sudah_dibaca_siswa_ids : [],
    }));
  },

  async upsertLMSMateri(materi: LMSMateri): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_materi").upsert({
      id: materi.id,
      judul: materi.judul,
      mapel: materi.mapel,
      kelas: materi.kelas,
      guru_nama: materi.guruNama,
      guru_id: materi.guruId || null,
      deskripsi: materi.deskripsi || null,
      tipe_konten: materi.tipeKonten,
      url_konten: materi.urlKonten || null,
      file_lampiran: materi.fileLampiran || null,
      pertemuan_ke: materi.pertemuanKe,
      durasi_menit: materi.durasiMenit || null,
      sudah_dibaca_siswa_ids: materi.sudahDibacaSiswaIds || [],
    });
    return !error;
  },

  async deleteLMSMateri(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_materi").delete().eq("id", id);
    return !error;
  },

  async getLMSTugas(): Promise<LMSTugas[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_tugas").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      judul: d.judul,
      mapel: d.mapel,
      kelas: d.kelas,
      guruNama: d.guru_nama,
      guruId: d.guru_id || undefined,
      deskripsi: d.deskripsi || "",
      deadline: d.deadline,
      bobotPoin: Number(d.bobot_poin) || 100,
      filePetunjuk: d.file_petunjuk || undefined,
      createdAt: d.created_at,
    }));
  },

  async upsertLMSTugas(tugas: LMSTugas): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_tugas").upsert({
      id: tugas.id,
      judul: tugas.judul,
      mapel: tugas.mapel,
      kelas: tugas.kelas,
      guru_nama: tugas.guruNama,
      guru_id: tugas.guruId || null,
      deskripsi: tugas.deskripsi || null,
      deadline: tugas.deadline,
      bobot_poin: tugas.bobotPoin,
      file_petunjuk: tugas.filePetunjuk || null,
    });
    return !error;
  },

  async deleteLMSTugas(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_tugas").delete().eq("id", id);
    return !error;
  },

  async getLMSSubmissions(): Promise<LMSSubmission[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_submissions").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      tugasId: d.tugas_id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      siswaNisn: d.siswa_nisn || "",
      kelas: d.kelas,
      tanggalKumpul: d.tanggal_kumpul,
      catatanSiswa: d.catatan_siswa || "",
      fileJawabanUrl: d.file_jawaban_url || undefined,
      status: d.status,
      nilai: d.nilai !== null ? Number(d.nilai) : undefined,
      feedbackGuru: d.feedback_guru || undefined,
      dinilaiPada: d.dinilai_pada || undefined,
    }));
  },

  async upsertLMSSubmission(sub: LMSSubmission): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_submissions").upsert({
      id: sub.id,
      tugas_id: sub.tugasId,
      siswa_id: sub.siswaId,
      siswa_nama: sub.siswaNama,
      siswa_nisn: sub.siswaNisn || null,
      kelas: sub.kelas,
      tanggal_kumpul: sub.tanggalKumpul,
      catatan_siswa: sub.catatanSiswa || null,
      file_jawaban_url: sub.fileJawabanUrl || null,
      status: sub.status,
      nilai: sub.nilai ?? null,
      feedback_guru: sub.feedbackGuru || null,
      dinilai_pada: sub.dinilaiPada || null,
    });
    return !error;
  },

  async getLMSKuis(): Promise<LMSKuis[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_kuis").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      judul: d.judul,
      mapel: d.mapel,
      kelas: d.kelas,
      guruNama: d.guru_nama,
      durasiMenit: Number(d.durasi_menit) || 30,
      kkm: Number(d.kkm) || 75,
      deadline: d.deadline,
      deskripsi: d.deskripsi || "",
      soalList: Array.isArray(d.soal_list) ? d.soal_list : [],
      createdAt: d.created_at,
    }));
  },

  async upsertLMSKuis(kuis: LMSKuis): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_kuis").upsert({
      id: kuis.id,
      judul: kuis.judul,
      mapel: kuis.mapel,
      kelas: kuis.kelas,
      guru_nama: kuis.guruNama,
      durasi_menit: kuis.durasiMenit,
      kkm: kuis.kkm,
      deadline: kuis.deadline,
      deskripsi: kuis.deskripsi || null,
      soal_list: kuis.soalList,
    });
    return !error;
  },

  async deleteLMSKuis(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_kuis").delete().eq("id", id);
    return !error;
  },

  async getLMSAttempts(): Promise<LMSKuisAttempt[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_attempts").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      kuisId: d.kuis_id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      siswaNisn: d.siswa_nisn || "",
      kelas: d.kelas,
      jawaban: typeof d.jawaban === "object" && d.jawaban ? d.jawaban : {},
      skor: Number(d.skor) || 0,
      totalBenar: Number(d.total_benar) || 0,
      totalSoal: Number(d.total_soal) || 0,
      statusLulus: Boolean(d.status_lulus),
      selesaiPada: d.selesai_pada || "",
    }));
  },

  async upsertLMSAttempt(att: LMSKuisAttempt): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_attempts").upsert({
      id: att.id,
      kuis_id: att.kuisId,
      siswa_id: att.siswaId,
      siswa_nama: att.siswaNama,
      siswa_nisn: att.siswaNisn || null,
      kelas: att.kelas,
      jawaban: att.jawaban,
      skor: att.skor,
      total_benar: att.totalBenar,
      total_soal: att.totalSoal,
      status_lulus: att.statusLulus,
      selesai_pada: att.selesaiPada,
    });
    return !error;
  },

  async getLMSForum(): Promise<LMSForumDiskusi[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_forum").select("*").order("tanggal", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      judul: d.judul,
      mapel: d.mapel,
      kelas: d.kelas,
      pembuatNama: d.pembuat_nama,
      pembuatRole: d.pembuat_role,
      pembuatAvatar: d.pembuat_avatar || undefined,
      isi: d.isi,
      tanggal: d.tanggal,
      komentarList: Array.isArray(d.komentar_list) ? d.komentar_list : [],
    }));
  },

  async upsertLMSForum(forum: LMSForumDiskusi): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_forum").upsert({
      id: forum.id,
      judul: forum.judul,
      mapel: forum.mapel,
      kelas: forum.kelas,
      pembuat_nama: forum.pembuatNama,
      pembuat_role: forum.pembuatRole,
      pembuat_avatar: forum.pembuatAvatar || null,
      isi: forum.isi,
      tanggal: forum.tanggal,
      komentar_list: forum.komentarList,
    });
    return !error;
  },

  async getLMSMeetings(): Promise<LMSVirtualMeeting[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_meetings").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      judul: d.judul,
      mapel: d.mapel,
      kelas: d.kelas,
      guruNama: d.guru_nama,
      platform: d.platform,
      meetingUrl: d.meeting_url,
      tanggal: d.tanggal,
      jamMulai: d.jam_mulai,
      jamSelesai: d.jam_selesai,
      status: d.status,
      keterangan: d.keterangan || undefined,
    }));
  },

  async upsertLMSMeeting(meeting: LMSVirtualMeeting): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_meetings").upsert({
      id: meeting.id,
      judul: meeting.judul,
      mapel: meeting.mapel,
      kelas: meeting.kelas,
      guru_nama: meeting.guruNama,
      platform: meeting.platform,
      meeting_url: meeting.meetingUrl,
      tanggal: meeting.tanggal,
      jam_mulai: meeting.jamMulai,
      jam_selesai: meeting.jamSelesai,
      status: meeting.status,
      keterangan: meeting.keterangan || null,
    });
    return !error;
  },

  async deleteLMSMeeting(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_meetings").delete().eq("id", id);
    return !error;
  },

  async getLMSBankSoal(): Promise<LMSBankSoal[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_bank_soal").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      kode: d.kode,
      judul: d.judul,
      deskripsi: d.deskripsi || "",
      mapel: d.mapel,
      tingkatKelas: d.tingkat_kelas,
      topik: d.topik,
      soalList: Array.isArray(d.soal_list) ? d.soal_list : [],
      pembuatGuru: d.pembuat_guru,
      createdAt: d.created_at,
      updatedAt: d.updated_at || undefined,
    }));
  },

  async upsertLMSBankSoal(bank: LMSBankSoal): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_bank_soal").upsert({
      id: bank.id,
      kode: bank.kode,
      judul: bank.judul,
      deskripsi: bank.deskripsi || null,
      mapel: bank.mapel,
      tingkat_kelas: bank.tingkatKelas,
      topik: bank.topik,
      soal_list: bank.soalList,
      pembuat_guru: bank.pembuatGuru,
      updated_at: bank.updatedAt || new Date().toISOString(),
    });
    return !error;
  },

  async deleteLMSBankSoal(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_bank_soal").delete().eq("id", id);
    return !error;
  },

  async getLMSJadwalMateri(): Promise<LMSJadwalMateri[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("lms_jadwal_materi").select("*");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      mingguKe: Number(d.minggu_ke) || 1,
      rentangTanggal: d.rentang_tanggal,
      bulan: d.bulan,
      semester: d.semester,
      tahunAjaran: d.tahun_ajaran,
      mapel: d.mapel,
      kelas: d.kelas,
      bab: d.bab,
      subBab: Array.isArray(d.sub_bab) ? d.sub_bab : [],
      alokasiJP: Number(d.alokasi_jp) || 2,
      indikatorKompetensi: d.indikator_kompetensi || "",
      materiTerkaitId: d.materi_terkait_id || undefined,
      sudahDiajarkan: Boolean(d.sudah_diajarkan),
      tanggalRealisasi: d.tanggal_realisasi || undefined,
      jamRealisasi: d.jam_realisasi || undefined,
      guruPengajar: d.guru_pengajar || undefined,
      guruId: d.guru_id || undefined,
      catatanPembelajaran: d.catatan_pembelajaran || undefined,
    }));
  },

  async upsertLMSJadwalMateri(j: LMSJadwalMateri): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_jadwal_materi").upsert({
      id: j.id,
      minggu_ke: j.mingguKe,
      rentang_tanggal: j.rentangTanggal,
      bulan: j.bulan,
      semester: j.semester,
      tahun_ajaran: j.tahunAjaran,
      mapel: j.mapel,
      kelas: j.kelas,
      bab: j.bab,
      sub_bab: j.subBab,
      alokasi_jp: j.alokasiJP,
      indikator_kompetensi: j.indikatorKompetensi || null,
      materi_terkait_id: j.materiTerkaitId || null,
      sudah_diajarkan: j.sudahDiajarkan,
      tanggal_realisasi: j.tanggalRealisasi || null,
      jam_realisasi: j.jamRealisasi || null,
      guru_pengajar: j.guruPengajar || null,
      guru_id: j.guruId || null,
      catatan_pembelajaran: j.catatanPembelajaran || null,
    });
    return !error;
  },

  async deleteLMSJadwalMateri(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("lms_jadwal_materi").delete().eq("id", id);
    return !error;
  },

  // ==================== TAHFIDZ & TAHZIN AL-QUR'AN ====================
  async getTahfidzRecords(): Promise<TahfidzRecord[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client
      .from("tahfidz_siswa")
      .select("*")
      .order("tanggal", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      tanggal: d.tanggal,
      jenisSetoran: d.jenis_setoran,
      juz: d.juz || 30,
      surah: d.surah,
      ayatMulai: d.ayat_mulai || 1,
      ayatSelesai: d.ayat_selesai || 1,
      halaman: d.halaman || undefined,
      jilidIqra: d.jilid_iqra || undefined,
      halamanIqra: d.halaman_iqra || undefined,
      kelancaran: d.kelancaran,
      nilaiMakhraj: d.nilai_makhraj || 85,
      nilaiTajwid: d.nilai_tajwid || 85,
      catatanUstadz: d.catatan_ustadz || undefined,
      ustadzPengampu: d.ustadz_pengampu,
      ustadzId: d.ustadz_id || undefined,
      createdAt: d.created_at,
    }));
  },

  async upsertTahfidzRecord(record: TahfidzRecord): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("tahfidz_siswa").upsert({
      id: record.id,
      siswa_id: record.siswaId,
      siswa_nama: record.siswaNama,
      nisn: record.nisn,
      kelas: record.kelas,
      tanggal: record.tanggal,
      jenis_setoran: record.jenisSetoran,
      juz: record.juz,
      surah: record.surah,
      ayat_mulai: record.ayatMulai,
      ayat_selesai: record.ayatSelesai,
      halaman: record.halaman || null,
      jilid_iqra: record.jilidIqra || null,
      halaman_iqra: record.halamanIqra || null,
      kelancaran: record.kelancaran,
      nilai_makhraj: record.nilaiMakhraj,
      nilai_tajwid: record.nilaiTajwid,
      catatan_ustadz: record.catatanUstadz || null,
      ustadz_pengampu: record.ustadzPengampu,
      ustadz_id: record.ustadzId || null,
    });
    return !error;
  },

  async deleteTahfidzRecord(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("tahfidz_siswa").delete().eq("id", id);
    return !error;
  },

  // ==================== MUTABA'AH YAUMIYAH ====================
  async getMutabaahRecords(): Promise<MutabaahRecord[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client
      .from("mutabaah_siswa")
      .select("*")
      .order("tanggal", { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      siswaId: d.siswa_id,
      siswaNama: d.siswa_nama,
      nisn: d.nisn || "",
      kelas: d.kelas,
      tanggal: d.tanggal,
      shalatWajib: d.shalat_wajib || {},
      ibadahSunnah: d.ibadah_sunnah || {},
      akhlakKarakter: d.akhlak_karakter || {},
      catatanOrangTua: d.catatan_orang_tua || undefined,
      skorKebaikan: d.skor_kebaikan || 0,
      statusVerifikasi: d.status_verifikasi || "Menunggu Verifikasi",
      catatanGuru: d.catatan_guru || undefined,
      verifiedByGuru: d.verified_by_guru || undefined,
      createdAt: d.created_at,
    }));
  },

  async upsertMutabaahRecord(record: MutabaahRecord): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("mutabaah_siswa").upsert({
      id: record.id,
      siswa_id: record.siswaId,
      siswa_nama: record.siswaNama,
      nisn: record.nisn,
      kelas: record.kelas,
      tanggal: record.tanggal,
      shalat_wajib: record.shalatWajib,
      ibadah_sunnah: record.ibadahSunnah,
      akhlak_karakter: record.akhlakKarakter,
      catatan_orang_tua: record.catatanOrangTua || null,
      skor_kebaikan: record.skorKebaikan,
      status_verifikasi: record.statusVerifikasi,
      catatan_guru: record.catatanGuru || null,
      verified_by_guru: record.verifiedByGuru || null,
    });
    return !error;
  },

  async deleteMutabaahRecord(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("mutabaah_siswa").delete().eq("id", id);
    return !error;
  },

  // ==================== FETCH ALL SCHOOL DATA ====================
  async fetchAllSchoolData() {
    if (!this.isConfigured()) return null;
    try {
      const [
        profile,
        users,
        siswa,
        guru,
        kelas,
        mapel,
        jadwal,
        presensi,
        nilai,
        jenisTagihan,
        tagihan,
        tabungan,
        transaksiTabungan,
        pesertaTransport,
        sppTransportRecords,
        transaksiSPPTransport,
        pengumuman,
        lmsMateri,
        lmsTugas,
        lmsSubmissions,
        lmsKuis,
        lmsAttempts,
        lmsForum,
        lmsMeetings,
        lmsBankSoal,
        lmsJadwalMateri,
        tahfidz,
        mutabaah,
      ] = await Promise.all([
        this.getProfile(),
        this.getUsers(),
        this.getSiswaList(),
        this.getGuruList(),
        this.getKelasList(),
        this.getMapelList(),
        this.getJadwalList(),
        this.getPresensiList(),
        this.getNilaiList(),
        this.getJenisTagihanList(),
        this.getTagihanList(),
        this.getTabunganList(),
        this.getTransaksiTabunganList(),
        this.getPesertaTransportList(),
        this.getSPPTransportRecords(),
        this.getTransaksiSPPTransportList(),
        this.getPengumumanList(),
        this.getLMSMateri(),
        this.getLMSTugas(),
        this.getLMSSubmissions(),
        this.getLMSKuis(),
        this.getLMSAttempts(),
        this.getLMSForum(),
        this.getLMSMeetings(),
        this.getLMSBankSoal(),
        this.getLMSJadwalMateri(),
        this.getTahfidzRecords(),
        this.getMutabaahRecords(),
      ]);

      return {
        profile,
        users,
        siswa,
        guru,
        kelas,
        mapel,
        jadwal,
        presensi,
        nilai,
        jenisTagihan,
        tagihan,
        tabungan,
        transaksiTabungan,
        pesertaTransport,
        sppTransportRecords,
        transaksiSPPTransport,
        pengumuman,
        lmsMateri,
        lmsTugas,
        lmsSubmissions,
        lmsKuis,
        lmsAttempts,
        lmsForum,
        lmsMeetings,
        lmsBankSoal,
        lmsJadwalMateri,
        tahfidz,
        mutabaah,
      };
    } catch (err) {
      console.error("Failed to fetch complete school data from Supabase:", err);
      return null;
    }
  },

  // ==================== CLEAR ALL SCHOOL DATA ====================
  async clearAllSchoolData(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, message: "Klien Supabase belum aktif atau URL/Key belum dikonfigurasi." };
    }

    try {
      const tables = [
        "siswa",
        "guru",
        "kelas",
        "mata_pelajaran",
        "jadwal_pelajaran",
        "presensi",
        "nilai_siswa",
        "nilai",
        "tagihan_siswa",
        "tagihan",
        "jenis_tagihan",
        "tabungan_siswa",
        "tabungan",
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
        "lms_kuis_attempts",
        "lms_forum",
        "lms_forum_diskusi",
        "lms_meetings",
        "lms_virtual_meetings",
        "lms_bank_soal",
        "lms_jadwal_materi",
        "tahfidz_records",
        "mutabaah_records",
      ];

      for (const table of tables) {
        try {
          await client.from(table).delete().neq("id", "___none___");
        } catch (tableErr) {
          console.warn(`[Supabase] Peringatan saat membersihkan tabel ${table}:`, tableErr);
        }
      }

      return { success: true, message: "Seluruh data operasional di Supabase berhasil dikosongkan." };
    } catch (err: any) {
      console.error("[Supabase] Gagal mengosongkan database:", err);
      return { success: false, message: err?.message || "Gagal mengosongkan data di Supabase." };
    }
  },

  // ==================== SEED INITIAL DATA ====================
  async seedInitialDataToSupabase(mockData: {
    profile: SchoolProfile;
    users?: User[];
    siswa: Siswa[];
    guru: Guru[];
    kelas: Kelas[];
    mapel: MataPelajaran[];
    jadwal: JadwalPelajaran[];
    presensi: PresensiRecord[];
    nilai: NilaiSiswa[];
    jenisTagihan: JenisTagihan[];
    tagihan: TagihanSiswa[];
    tabungan: TabunganSiswa[];
    transaksiTabungan: TransaksiTabungan[];
    pesertaTransport: PesertaTransportasi[];
    sppTransportRecords: RecordSPPTransportTahunAjaran[];
    transaksiSPPTransport: TransaksiSPPTransport[];
    pengumuman: Pengumuman[];
    lmsMateri: LMSMateri[];
    lmsTugas: LMSTugas[];
    lmsSubmissions: LMSSubmission[];
    lmsKuis: LMSKuis[];
    lmsAttempts: LMSKuisAttempt[];
    lmsForum: LMSForumDiskusi[];
    lmsMeetings: LMSVirtualMeeting[];
    lmsBankSoal: LMSBankSoal[];
    lmsJadwalMateri: LMSJadwalMateri[];
    tahfidz?: TahfidzRecord[];
    mutabaah?: MutabaahRecord[];
    deletedIds?: string[];
  }): Promise<{ success: boolean; message: string; details?: any }> {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, message: "Klien Supabase belum aktif atau URL/Key belum dikonfigurasi." };
    }

    try {
      // 0. Purge tombstoned / explicitly deleted IDs across tables in Supabase
      if (mockData.deletedIds && mockData.deletedIds.length > 0) {
        const delList = mockData.deletedIds;
        const tables = [
          "siswa",
          "guru",
          "kelas",
          "mata_pelajaran",
          "jadwal_pelajaran",
          "nilai_siswa",
          "tagihan_siswa",
          "jenis_tagihan",
          "pengumuman",
          "lms_materi",
          "lms_tugas",
          "lms_kuis",
          "lms_meetings",
          "lms_bank_soal",
          "lms_jadwal_materi",
          "tahfidz_records",
          "mutabaah_records",
        ];
        for (const tbl of tables) {
          try {
            await client.from(tbl).delete().in("id", delList);
          } catch {}
        }
      }

      // 1. Profil Sekolah
      await this.updateProfile(mockData.profile);

      // 2. Users (if provided)
      if (mockData.users && mockData.users.length > 0) {
        for (const u of mockData.users) {
          await this.upsertUser(u);
        }
      }

      // 3. Siswa
      try {
        const { data: existingSiswa } = await client.from("siswa").select("id");
        if (existingSiswa && existingSiswa.length > 0) {
          const currentIds = new Set(mockData.siswa.map((s) => s.id));
          const toDeleteIds = existingSiswa.filter((es: any) => !currentIds.has(es.id)).map((es: any) => es.id);
          if (toDeleteIds.length > 0) {
            await client.from("siswa").delete().in("id", toDeleteIds);
          }
        }
      } catch (err) {
        console.warn("Clean orphan siswa warning:", err);
      }
      if (mockData.siswa.length > 0) {
        await this.bulkUpsertSiswa(mockData.siswa);
      }

      // 4. Guru
      try {
        const { data: existingGuru } = await client.from("guru").select("id");
        if (existingGuru && existingGuru.length > 0) {
          const currentIds = new Set(mockData.guru.map((g) => g.id));
          const toDeleteIds = existingGuru.filter((eg: any) => !currentIds.has(eg.id)).map((eg: any) => eg.id);
          if (toDeleteIds.length > 0) {
            await client.from("guru").delete().in("id", toDeleteIds);
          }
        }
      } catch (err) {
        console.warn("Clean orphan guru warning:", err);
      }
      for (const g of mockData.guru) {
        await this.upsertGuru(g);
      }

      // 5. Kelas
      try {
        const { data: existingKelas } = await client.from("kelas").select("id");
        if (existingKelas && existingKelas.length > 0) {
          const currentIds = new Set(mockData.kelas.map((k) => k.id));
          const toDeleteIds = existingKelas.filter((ek: any) => !currentIds.has(ek.id)).map((ek: any) => ek.id);
          if (toDeleteIds.length > 0) {
            await client.from("kelas").delete().in("id", toDeleteIds);
          }
        }
      } catch (err) {
        console.warn("Clean orphan kelas warning:", err);
      }
      for (const k of mockData.kelas) {
        await this.upsertKelas(k);
      }

      // 6. Mapel
      try {
        const { data: existingMapel } = await client.from("mata_pelajaran").select("id");
        if (existingMapel && existingMapel.length > 0) {
          const currentIds = new Set(mockData.mapel.map((m) => m.id));
          const toDeleteIds = existingMapel.filter((em: any) => !currentIds.has(em.id)).map((em: any) => em.id);
          if (toDeleteIds.length > 0) {
            await client.from("mata_pelajaran").delete().in("id", toDeleteIds);
          }
        }
      } catch (err) {
        console.warn("Clean orphan mapel warning:", err);
      }
      for (const m of mockData.mapel) {
        await this.upsertMapel(m);
      }

      // 7. Jadwal
      try {
        const { data: existingJadwal } = await client.from("jadwal_pelajaran").select("id");
        if (existingJadwal && existingJadwal.length > 0) {
          const currentIds = new Set(mockData.jadwal.map((j) => j.id));
          const toDeleteIds = existingJadwal.filter((ej: any) => !currentIds.has(ej.id)).map((ej: any) => ej.id);
          if (toDeleteIds.length > 0) {
            await client.from("jadwal_pelajaran").delete().in("id", toDeleteIds);
          }
        }
      } catch (err) {
        console.warn("Clean orphan jadwal warning:", err);
      }
      if (mockData.jadwal.length > 0) {
        await this.bulkUpsertJadwal(mockData.jadwal);
      }

      // 8. Presensi
      for (const p of mockData.presensi) {
        await this.upsertPresensi(p);
      }

      // 9. Nilai Siswa
      if (mockData.nilai.length > 0) {
        await this.bulkUpsertNilai(mockData.nilai);
      }

      // 10. Jenis Tagihan
      for (const jt of mockData.jenisTagihan) {
        await this.upsertJenisTagihan(jt);
      }

      // 11. Tagihan Siswa
      if (mockData.tagihan.length > 0) {
        await this.bulkUpsertTagihan(mockData.tagihan);
      }

      // 12. Tabungan & Transaksi
      for (const t of mockData.tabungan) {
        await this.upsertTabungan(t);
      }
      for (const tt of mockData.transaksiTabungan) {
        await this.insertTransaksiTabungan(tt);
      }

      // 13. Transportasi & SPP Transport
      for (const pt of mockData.pesertaTransport) {
        await this.upsertPesertaTransport(pt);
      }
      for (const st of mockData.sppTransportRecords) {
        await this.upsertSPPTransportRecord(st);
      }
      for (const tst of mockData.transaksiSPPTransport) {
        await this.insertTransaksiSPPTransport(tst);
      }

      // 14. Pengumuman
      for (const peng of mockData.pengumuman) {
        await this.upsertPengumuman(peng);
      }

      // 15. LMS modules
      for (const lm of mockData.lmsMateri) {
        await this.upsertLMSMateri(lm);
      }
      for (const lt of mockData.lmsTugas) {
        await this.upsertLMSTugas(lt);
      }
      for (const ls of mockData.lmsSubmissions) {
        await this.upsertLMSSubmission(ls);
      }
      for (const lk of mockData.lmsKuis) {
        await this.upsertLMSKuis(lk);
      }
      for (const la of mockData.lmsAttempts) {
        await this.upsertLMSAttempt(la);
      }
      for (const lf of mockData.lmsForum) {
        await this.upsertLMSForum(lf);
      }
      for (const lm of mockData.lmsMeetings) {
        await this.upsertLMSMeeting(lm);
      }
      for (const lb of mockData.lmsBankSoal) {
        await this.upsertLMSBankSoal(lb);
      }
      for (const lj of mockData.lmsJadwalMateri) {
        await this.upsertLMSJadwalMateri(lj);
      }

      // 16. Tahfidz & Mutaba'ah
      if (mockData.tahfidz) {
        for (const th of mockData.tahfidz) {
          await this.upsertTahfidzRecord(th);
        }
      }
      if (mockData.mutabaah) {
        for (const mb of mockData.mutabaah) {
          await this.upsertMutabaahRecord(mb);
        }
      }

      return {
        success: true,
        message: "Seluruh data awal sekolah berhasil disinkronkan dan di-seed ke cloud Supabase!",
      };
    } catch (err: any) {
      console.error("Error seeding to Supabase:", err);
      return {
        success: false,
        message: `Gagal mengunggah data ke Supabase: ${err.message || err}`,
      };
    }
  },
};
