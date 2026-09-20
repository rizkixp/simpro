import { getSupabaseBrowserClient } from "../client";
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
  LMSMateri,
  LMSTugas,
  LMSSubmission,
  LMSKuis,
  LMSKuisAttempt,
  LMSForumDiskusi,
  LMSVirtualMeeting,
  LMSBankSoal,
  LMSJadwalMateri
} from "@/types/school";

export const SupabaseSchoolService = {
  isConfigured(): boolean {
    return !!getSupabaseBrowserClient();
  },

  // ==================== SISWA ====================
  async getSiswaList(): Promise<Siswa[] | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("siswa").select("*").order("nama");
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      nisn: d.nisn,
      nama: d.nama,
      jenisKelamin: d.jenis_kelamin,
      kelas: d.kelas,
      jurusan: d.jurusan,
      tanggalLahir: d.tanggal_lahir,
      tempatLahir: d.tempat_lahir,
      alamat: d.alamat,
      namaWali: d.nama_wali,
      noHpWali: d.no_hp_wali,
      status: d.status,
      avatar: d.avatar,
    }));
  },

  async upsertSiswa(siswa: Siswa): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("siswa").upsert({
      id: siswa.id,
      nisn: siswa.nisn,
      nama: siswa.nama,
      jenis_kelamin: siswa.jenisKelamin,
      kelas: siswa.kelas,
      jurusan: siswa.jurusan,
      tanggal_lahir: siswa.tanggalLahir,
      tempat_lahir: siswa.tempatLahir,
      alamat: siswa.alamat,
      nama_wali: siswa.namaWali,
      no_hp_wali: siswa.noHpWali,
      status: siswa.status,
      avatar: siswa.avatar,
    });
    return !error;
  },

  async deleteSiswa(id: string): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("siswa").delete().eq("id", id);
    return !error;
  },

  // ==================== PROFIL SEKOLAH ====================
  async getProfile(): Promise<SchoolProfile | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data, error } = await client.from("school_profile").select("*").eq("id", "default_profile").single();
    if (error || !data) return null;
    return {
      namaSekolah: data.nama_sekolah,
      npsn: data.npsn,
      akreditasi: data.akreditasi,
      alamat: data.alamat,
      telepon: data.telepon,
      email: data.email,
      website: data.website,
      kepalaSekolah: data.kepala_sekolah,
      tahunAjaranAktif: data.tahun_ajaran_aktif,
      semesterAktif: data.semester_aktif,
    };
  },

  async updateProfile(profile: SchoolProfile): Promise<boolean> {
    const client = getSupabaseBrowserClient();
    if (!client) return false;
    const { error } = await client.from("school_profile").upsert({
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
    });
    return !error;
  },
};
