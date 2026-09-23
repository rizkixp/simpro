export type UserRole = "admin" | "guru" | "siswa" | "ortu" | "bendahara";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  nisnOrNip?: string;
  kelas?: string;
  phone?: string;
  status: "Aktif" | "Nonaktif";
  password?: string;
  sessionToken?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  jenisKelamin: "L" | "P";
  kelas: string;
  jurusan?: string;
  tanggalLahir: string;
  tempatLahir: string;
  alamat: string;
  namaWali: string;
  noHpWali: string;
  status: "Aktif" | "Alumni" | "Mutasi";
  avatar: string;
}

export interface Guru {
  id: string;
  nip: string;
  nama: string;
  gelar: string;
  jenisKelamin: "L" | "P";
  mataPelajaran: string[];
  kelasWali?: string;
  pendidikanTerakhir: string;
  statusKepegawaian: "PNS" | "Tetap Yayasan" | "Honorer";
  email: string;
  noHp: string;
  avatar: string;
}

export interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  kategori: "Wajib" | "Peminatan" | "Muatan Lokal" | "Kecerdasan Al-Qur'an";
  kkm: number;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: "X" | "XI" | "XII" | "7" | "8" | "9" | string;
  waliKelasId: string;
  waliKelasNama: string;
  kapasitas: number;
  jumlahSiswa: number;
  ruangan: string;
}

export interface JadwalPelajaran {
  id: string;
  hari: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  jamMulai: string;
  jamSelesai: string;
  kelas: string;
  mapel: string;
  guruNama: string;
  ruangan: string;
}

export type StatusKehadiran = "Hadir" | "Sakit" | "Izin" | "Alpa";
export type MetodePresensi = "manual" | "face" | "barcode" | "qr";

export interface PresensiRecord {
  id: string;
  siswaId: string;
  siswaNama: string;
  kelas: string;
  tanggal: string; // YYYY-MM-DD
  status: StatusKehadiran;
  keterangan?: string;
  waktuMasuk?: string; // HH:mm:ss
  waktuPulang?: string; // HH:mm:ss
  metode?: MetodePresensi;
  terlambat?: boolean;
  fotoSnapshot?: string;
  notifWaTerkirim?: boolean;
}

export type JenisRapor = "tengah" | "akhir";

export interface NilaiSiswa {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  mapel: string;
  semester: "Ganjil" | "Genap";
  tahunAjaran: string;
  // Isian Komponen Nilai Harian & Ujian
  uh1?: number; // Ulangan Harian 1
  uh2?: number; // Ulangan Harian 2
  tugas?: number; // Rata-rata Ulangan Harian / Tugas Harian
  uts?: number; // Ujian Mid Semester (UTS / PTS)
  uas?: number; // Ujian Akhir Semester (UAS / PAS)
  // Komponen Rapor Tengah Semester (STS / Mid)
  nilaiMid?: number; // Hasil Rapor Tengah Semester: 100% Ujian STS (tanpa UH)
  predikatMid?: "A" | "B" | "C" | "D";
  catatanMid?: string;
  // Komponen Rapor Akhir Semester (PAS / Semester)
  nilaiAkhir?: number; // Hasil Rapor Akhir: 30% UH + 30% Mid + 40% UAS
  predikat?: "A" | "B" | "C" | "D";
  catatan?: string;
  // Jenis Rapor spesifik
  jenisRapor?: JenisRapor | "semua";
  hasSts?: boolean; // Menandai apakah nilai STS telah diinputkan
  hasSas?: boolean; // Menandai apakah nilai SAS telah diinputkan
}

export type KategoriTagihan =
  | "SPP"
  | "Uang Gedung"
  | "Seragam"
  | "Buku & Modul"
  | "Kegiatan & Study Tour"
  | "Ujian & Asesmen"
  | "Katering"
  | "Lainnya"
  | string;

export interface JenisTagihan {
  id: string;
  nama: string;
  kode: string;
  nominalDefault?: number;
  keterangan?: string;
  warnaBadge?: string;
}

export type MetodePembayaranTagihan =
  | "Potong Tabungan Siswa"
  | "Virtual Account"
  | "Transfer Bank"
  | "QRIS"
  | "Tunai";

export interface TagihanSiswa {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  judul: string;
  kategori: KategoriTagihan;
  nominal: number;
  jatuhTempo: string;
  status: "Lunas" | "Belum Lunas" | "Jatuh Tempo";
  tanggalBayar?: string;
  metodePembayaran?: MetodePembayaranTagihan;
  noKuitansi?: string;
  keterangan?: string;
  bulan?: string;
  tahun?: number;
}

export type TagihanSPP = TagihanSiswa;


export interface Pengumuman {
  id: string;
  judul: string;
  konten: string;
  kategori: "Akademik" | "Ujian" | "Kegiatan" | "Keuangan" | "Libur";
  prioritas: "Tinggi" | "Sedang" | "Normal";
  tanggal: string;
  penulis: string;
  targetRole: "Semua" | "Siswa" | "Guru" | "Orang Tua";
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  akreditasi: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  tahunAjaranAktif: string;
  semesterAktif: "Ganjil" | "Genap";
  // Pengaturan Identitas & Branding Aplikasi
  appName?: string;
  appTagline?: string;
  appLogoUrl?: string;
  appIconPreset?: "graduation" | "school" | "book" | "shield" | "sparkles";
  // Pengaturan Tampilan Awal (Landing Page)
  landingHeroBadge?: string;
  landingHeroTitle?: string;
  landingHeroSubtitle?: string;
  landingCtaText?: string;
  landingShowDemoButton?: boolean;
  landingFooterText?: string;
}

export interface TabunganSiswa {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  saldo: number;
  terakhirUpdate: string;
}

export interface TransaksiTabungan {
  id: string;
  tabunganId: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  tipe: "Setor" | "Tarik";
  nominal: number;
  saldoAkhir: number;
  tanggal: string;
  keterangan: string;
  petugas: string;
  noReferensi?: string;
}

export type BulanSPP =
  | "Juli"
  | "Agustus"
  | "September"
  | "Oktober"
  | "November"
  | "Desember"
  | "Januari"
  | "Februari"
  | "Maret"
  | "April"
  | "Mei"
  | "Juni";

export const LIST_BULAN_SPP: { bulan: BulanSPP; urutan: number; semester: "Ganjil" | "Genap" }[] = [
  { bulan: "Juli", urutan: 1, semester: "Ganjil" },
  { bulan: "Agustus", urutan: 2, semester: "Ganjil" },
  { bulan: "September", urutan: 3, semester: "Ganjil" },
  { bulan: "Oktober", urutan: 4, semester: "Ganjil" },
  { bulan: "November", urutan: 5, semester: "Ganjil" },
  { bulan: "Desember", urutan: 6, semester: "Ganjil" },
  { bulan: "Januari", urutan: 7, semester: "Genap" },
  { bulan: "Februari", urutan: 8, semester: "Genap" },
  { bulan: "Maret", urutan: 9, semester: "Genap" },
  { bulan: "April", urutan: 10, semester: "Genap" },
  { bulan: "Mei", urutan: 11, semester: "Genap" },
  { bulan: "Juni", urutan: 12, semester: "Genap" },
];

export interface PesertaTransportasi {
  siswaId: string;
  isAktif: boolean;
  biayaBulanan: number;
  rute?: string;
}

export interface BulanDetailSPPTransport {
  sppStatus: "Lunas" | "Belum Bayar";
  sppNominal: number; // Rp 100.000
  sppTanggalBayar?: string;
  sppMetode?: MetodePembayaranTagihan;
  sppNoKuitansi?: string;

  isTransport: boolean;
  transportNominal: number;
  transportStatus: "Lunas" | "Belum Bayar" | "Tidak Menggunakan";
  transportTanggalBayar?: string;
  transportMetode?: MetodePembayaranTagihan;
  transportNoKuitansi?: string;
}

export interface RecordSPPTransportTahunAjaran {
  id: string; // `${siswaId}_${tahunAjaran}`
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  tahunAjaran: string; // e.g. "2025/2026"
  bulan: Record<BulanSPP, BulanDetailSPPTransport>;
}

export interface TransaksiSPPTransport {
  id: string;
  noKuitansi: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  tahunAjaran: string;
  jenis: "SPP" | "Transportasi" | "Paket Keduanya";
  bulan: BulanSPP[];
  totalNominal: number;
  metodePembayaran: MetodePembayaranTagihan;
  tanggalBayar: string;
  petugas: string;
  keterangan?: string;
}

// ==========================================
// LMS (Learning Management System) Interfaces
// ==========================================

export type LMSTipeMateri = "video" | "pdf" | "artikel" | "link";

export interface LMSMateri {
  id: string;
  judul: string;
  mapel: string;
  kelas: string;
  guruNama: string;
  guruId?: string;
  deskripsi: string;
  tipeKonten: LMSTipeMateri;
  urlKonten?: string; // YouTube embed URL / PDF URL / link
  fileLampiran?: string;
  pertemuanKe: number;
  durasiMenit?: number;
  createdAt: string;
  sudahDibacaSiswaIds: string[]; // List of student IDs who completed reading
}

export interface LMSTugas {
  id: string;
  judul: string;
  mapel: string;
  kelas: string;
  guruNama: string;
  guruId?: string;
  deskripsi: string;
  deadline: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  bobotPoin: number;
  filePetunjuk?: string;
  createdAt: string;
}

export type StatusSubmission = "Diserahkan" | "Terlambat" | "Dinilai";

export interface LMSSubmission {
  id: string;
  tugasId: string;
  siswaId: string;
  siswaNama: string;
  siswaNisn: string;
  kelas: string;
  tanggalKumpul: string;
  catatanSiswa: string;
  fileJawabanUrl?: string;
  status: StatusSubmission;
  nilai?: number;
  feedbackGuru?: string;
  dinilaiPada?: string;
}

export interface LMSSoal {
  id: string;
  pertanyaan: string;
  pilihan: string[]; // [A, B, C, D, E]
  kunciJawaban: number; // Index 0..4
  pembahasan?: string;
  poin: number;
}

export interface LMSKuis {
  id: string;
  judul: string;
  mapel: string;
  kelas: string;
  guruNama: string;
  durasiMenit: number;
  kkm: number;
  deadline: string;
  deskripsi: string;
  soalList: LMSSoal[];
  createdAt: string;
}

export interface LMSKuisAttempt {
  id: string;
  kuisId: string;
  siswaId: string;
  siswaNama: string;
  siswaNisn: string;
  kelas: string;
  jawaban: Record<string, number>; // { [soalId]: selectedOptionIndex }
  skor: number; // 0..100
  totalBenar: number;
  totalSoal: number;
  statusLulus: boolean;
  selesaiPada: string;
}

export interface LMSKomentarForum {
  id: string;
  penulisNama: string;
  penulisRole: UserRole;
  penulisAvatar: string;
  isi: string;
  tanggal: string;
}

export interface LMSForumDiskusi {
  id: string;
  judul: string;
  mapel: string;
  kelas: string;
  pembuatNama: string;
  pembuatRole: UserRole;
  pembuatAvatar: string;
  isi: string;
  tanggal: string;
  komentarList: LMSKomentarForum[];
}

export interface LMSVirtualMeeting {
  id: string;
  judul: string;
  mapel: string;
  kelas: string;
  guruNama: string;
  platform: "Google Meet" | "Zoom" | "Microsoft Teams";
  meetingUrl: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  status: "Akan Datang" | "Sedang Berlangsung" | "Selesai";
  keterangan?: string;
}

export type TingkatKesulitanSoal = "Mudah" | "Sedang" | "Sukar";

export interface LMSBankSoalItem {
  id: string;
  kode: string; // misal: "BS-01"
  pertanyaan: string;
  pilihan: string[]; // [A, B, C, D, E]
  kunciJawaban: number; // 0..4 (index)
  pembahasan: string;
  tingkatKesulitan: TingkatKesulitanSoal;
  poinDefault: number;
}

export interface LMSBankSoal {
  id: string;
  kode: string; // misal: "PKT-MAT-01"
  judul: string; // misal: "Bank Soal Matematika: Aljabar & Nilai Mutlak"
  deskripsi?: string;
  mapel: string;
  tingkatKelas: string; // misal: "X", "XI", "XII", "Semua"
  topik: string; // misal: "Persamaan Nilai Mutlak & Kuadrat"
  soalList: LMSBankSoalItem[];
  pembuatGuru: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LMSJadwalMateri {
  id: string;
  mingguKe: number;              // Pekan ke-1, 2, 3, dst.
  rentangTanggal: string;        // e.g. "01 - 06 September 2025"
  bulan: string;                 // e.g. "September"
  semester: "Ganjil" | "Genap";
  tahunAjaran: string;           // e.g. "2025/2026"
  mapel: string;                 // e.g. "Pendidikan Agama Islam", "Matematika"
  kelas: string;                 // e.g. "Kelas 6", "Kelas 1"
  bab: string;                   // e.g. "Bab 2: Fiqih Ibadah Shalat Jamak & Qashar"
  subBab: string[];              // e.g. ["2.1 Syarat Sah Jamak", "2.2 Praktik Qashar"]
  alokasiJP: number;             // e.g. 4 JP (Jam Pelajaran)
  indikatorKompetensi?: string;  // Capaian / Target pembelajaran
  materiTerkaitId?: string;      // Relasi opsional ke LMSMateri

  // Realisasi Pelaksanaan Mengajar
  sudahDiajarkan: boolean;       // Status centang
  tanggalRealisasi?: string;     // YYYY-MM-DD
  jamRealisasi?: string;         // e.g. "08.00 - 09.30 WIB"
  guruPengajar?: string;         // Guru yang mengajar
  guruId?: string;
  catatanPembelajaran?: string;  // Catatan jurnal, kendala, atau evaluasi santri
  createdAt?: string;
}

// =========================================================
// FITUR KHAS SEKOLAH ISLAM: TAHFIDZ & MUTABA'AH YAUMIYAH
// =========================================================

export type JenisSetoranTahfidz =
  | "Ziyadah (Hafalan Baru)"
  | "Muraja'ah (Mengulang)"
  | "Ujian Tasmi'"
  | "Tahsin (Iqra/Tilawati)";

export type PredikatKelancaran =
  | "Mutqin (Sangat Lancar)"
  | "Jayyid Jiddan (Lancar Sekali)"
  | "Jayyid (Lancar)"
  | "Maqbul (Cukup)"
  | "Dhaif (Perlu Diulang)";

export interface SurahJuz30Info {
  nomorSurah: number;
  namaLatin: string;
  namaArab: string;
  arti: string;
  jumlahAyat: number;
  tempatTurun: "Makkah" | "Madinah";
}

export interface TahfidzRecord {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  tanggal: string; // YYYY-MM-DD
  jenisSetoran: JenisSetoranTahfidz;
  juz: number; // e.g. 30, 29, 28, 1
  surah: string; // e.g. "An-Naba'"
  ayatMulai: number;
  ayatSelesai: number;
  halaman?: number;
  jilidIqra?: number;
  halamanIqra?: number;
  kelancaran: PredikatKelancaran;
  nilaiMakhraj: number; // 0 - 100
  nilaiTajwid: number; // 0 - 100
  catatanUstadz?: string;
  ustadzPengampu: string;
  ustadzId?: string;
  createdAt?: string;
}

export type MutabaahShalatStatus = "Ya" | "Tidak" | string;

export interface MutabaahShalatWajib {
  subuh: MutabaahShalatStatus;
  dzuhur: MutabaahShalatStatus;
  ashar: MutabaahShalatStatus;
  maghrib: MutabaahShalatStatus;
  isya: MutabaahShalatStatus;
}

export interface MutabaahIbadahSunnah {
  shalatDhuha: boolean;
  rawatib: boolean; // Shalat Sunnah Rawatib
  tilawahQuran: boolean; // Tilawah Al Qur'an
  jumlahHalamanTilawah?: number;
  qiyamulLail?: boolean;
  dzikirPagiPetang?: boolean;
  puasaSunnah?: boolean;
  infaqShadaqah?: boolean;
}

export interface MutabaahAkhlakKarakter {
  birrulWalidain: boolean; // Membantu Orang Tua
  belajarMandiri: boolean; // Belajar Mandiri di Rumah
  merapikanTempatTidur?: boolean;
  adabMakanMinum?: boolean;
}

export interface MutabaahRecord {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  kelas: string;
  tanggal: string; // YYYY-MM-DD
  shalatWajib: MutabaahShalatWajib;
  ibadahSunnah: MutabaahIbadahSunnah;
  akhlakKarakter: MutabaahAkhlakKarakter;
  catatanOrangTua?: string;
  skorKebaikan: number; // 0 - 100 poin
  statusVerifikasi: "Menunggu Verifikasi" | "Terverifikasi Guru" | "Diberi Bintang Kebaikan";
  catatanGuru?: string;
  verifiedByGuru?: string;
  createdAt?: string;
}



