-- =========================================================
-- SIM SEKOLAH PRO - SUPABASE DATABASE SCHEMA MIGRATION
-- =========================================================

-- 1. Profil Sekolah
CREATE TABLE IF NOT EXISTS school_profile (
    id TEXT PRIMARY KEY DEFAULT 'default_profile',
    nama_sekolah TEXT NOT NULL,
    npsn TEXT,
    akreditasi TEXT,
    alamat TEXT,
    telepon TEXT,
    email TEXT,
    website TEXT,
    kepala_sekolah TEXT,
    tahun_ajaran_aktif TEXT DEFAULT '2025/2026',
    semester_aktif TEXT DEFAULT 'Ganjil',
    app_name TEXT DEFAULT 'SIM Sekolah PRO',
    app_tagline TEXT DEFAULT 'Sistem Informasi Manajemen Sekolah Terpadu',
    app_logo_url TEXT,
    app_icon_preset TEXT DEFAULT 'graduation',
    landing_hero_badge TEXT DEFAULT 'Platform Manajemen Sekolah Generasi Terbaru #1',
    landing_hero_title TEXT DEFAULT 'Transformasi Digital Pendidikan yang Cerdas, Efisien & Terpadu',
    landing_hero_subtitle TEXT,
    landing_cta_text TEXT DEFAULT 'Buka Portal & Form Login',
    landing_show_demo_button BOOLEAN DEFAULT TRUE,
    landing_footer_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Akun Pengguna Sistem)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL, -- admin, guru, siswa, ortu, bendahara
    avatar TEXT,
    nisn_or_nip TEXT,
    kelas TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Aktif',
    password TEXT,
    last_login TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Data Master: Siswa
CREATE TABLE IF NOT EXISTS siswa (
    id TEXT PRIMARY KEY,
    nisn TEXT UNIQUE,
    nama TEXT NOT NULL,
    jenis_kelamin TEXT NOT NULL, -- L / P
    kelas TEXT NOT NULL,
    jurusan TEXT,
    tanggal_lahir TEXT,
    tempat_lahir TEXT,
    alamat TEXT,
    nama_wali TEXT,
    no_hp_wali TEXT,
    status TEXT DEFAULT 'Aktif', -- Aktif, Alumni, Mutasi
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Data Master: Guru
CREATE TABLE IF NOT EXISTS guru (
    id TEXT PRIMARY KEY,
    nip TEXT,
    nama TEXT NOT NULL,
    gelar TEXT,
    jenis_kelamin TEXT NOT NULL,
    mata_pelajaran JSONB DEFAULT '[]'::jsonb,
    kelas_wali TEXT,
    pendidikan_terakhir TEXT,
    status_kepegawaian TEXT DEFAULT 'Tetap Yayasan',
    email TEXT,
    no_hp TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Data Master: Kelas
CREATE TABLE IF NOT EXISTS kelas (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    tingkat TEXT,
    wali_kelas_id TEXT,
    wali_kelas_nama TEXT,
    kapasitas INTEGER DEFAULT 30,
    jumlah_siswa INTEGER DEFAULT 0,
    ruangan TEXT
);

-- 6. Data Master: Mata Pelajaran
CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id TEXT PRIMARY KEY,
    kode TEXT NOT NULL,
    nama TEXT NOT NULL,
    kategori TEXT DEFAULT 'Wajib',
    kkm NUMERIC DEFAULT 75
);

-- 7. Jadwal Pelajaran
CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id TEXT PRIMARY KEY,
    hari TEXT NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    kelas TEXT NOT NULL,
    mapel TEXT NOT NULL,
    guru_nama TEXT NOT NULL,
    ruangan TEXT
);

-- 8. Presensi Harian Siswa
CREATE TABLE IF NOT EXISTS presensi (
    id TEXT PRIMARY KEY,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    kelas TEXT NOT NULL,
    tanggal TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL,  -- Hadir, Sakit, Izin, Alpa
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Nilai Akademik Siswa
CREATE TABLE IF NOT EXISTS nilai_siswa (
    id TEXT PRIMARY KEY,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    mapel TEXT NOT NULL,
    semester TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    uh1 NUMERIC,
    uh2 NUMERIC,
    tugas NUMERIC DEFAULT 0,
    uts NUMERIC DEFAULT 0,
    uas NUMERIC DEFAULT 0,
    nilai_mid NUMERIC,
    predikat_mid TEXT,
    catatan_mid TEXT,
    nilai_akhir NUMERIC DEFAULT 0,
    predikat TEXT DEFAULT 'C',
    catatan TEXT,
    jenis_rapor TEXT DEFAULT 'semua'
);

-- 10. Jenis Tagihan
CREATE TABLE IF NOT EXISTS jenis_tagihan (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kode TEXT NOT NULL,
    nominal_default NUMERIC DEFAULT 0,
    keterangan TEXT,
    warna_badge TEXT
);

-- 11. Tagihan Siswa (SPP & Non-SPP)
CREATE TABLE IF NOT EXISTS tagihan_siswa (
    id TEXT PRIMARY KEY,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL,
    nominal NUMERIC NOT NULL,
    jatuh_tempo TEXT NOT NULL,
    status TEXT DEFAULT 'Belum Lunas', -- Lunas, Belum Lunas, Jatuh Tempo
    tanggal_bayar TEXT,
    metode_pembayaran TEXT,
    no_kuitansi TEXT,
    keterangan TEXT,
    bulan TEXT,
    tahun INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabungan Siswa
CREATE TABLE IF NOT EXISTS tabungan_siswa (
    id TEXT PRIMARY KEY,
    siswa_id TEXT NOT NULL UNIQUE,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    saldo NUMERIC DEFAULT 0,
    terakhir_update TEXT
);

-- 13. Transaksi Tabungan
CREATE TABLE IF NOT EXISTS transaksi_tabungan (
    id TEXT PRIMARY KEY,
    tabungan_id TEXT,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    tipe TEXT NOT NULL, -- Setor, Tarik
    nominal NUMERIC NOT NULL,
    saldo_akhir NUMERIC NOT NULL,
    tanggal TEXT NOT NULL,
    keterangan TEXT,
    petugas TEXT,
    no_referensi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Peserta Transportasi
CREATE TABLE IF NOT EXISTS peserta_transportasi (
    siswa_id TEXT PRIMARY KEY,
    is_aktif BOOLEAN DEFAULT false,
    biaya_bulanan NUMERIC DEFAULT 0,
    rute TEXT
);

-- 15. Record SPP Transport Tahun Ajaran
CREATE TABLE IF NOT EXISTS spp_transport_records (
    id TEXT PRIMARY KEY,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    bulan JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 16. Transaksi SPP & Transport
CREATE TABLE IF NOT EXISTS transaksi_spp_transport (
    id TEXT PRIMARY KEY,
    no_kuitansi TEXT NOT NULL,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    jenis TEXT NOT NULL,
    bulan JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_nominal NUMERIC NOT NULL,
    metode_pembayaran TEXT NOT NULL,
    tanggal_bayar TEXT NOT NULL,
    petugas TEXT NOT NULL,
    keterangan TEXT
);

-- 17. Pengumuman
CREATE TABLE IF NOT EXISTS pengumuman (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    konten TEXT NOT NULL,
    kategori TEXT NOT NULL,
    prioritas TEXT DEFAULT 'Normal',
    tanggal TEXT NOT NULL,
    penulis TEXT NOT NULL,
    target_role TEXT DEFAULT 'Semua',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. LMS: Materi
CREATE TABLE IF NOT EXISTS lms_materi (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    mapel TEXT NOT NULL,
    kelas TEXT NOT NULL,
    guru_nama TEXT NOT NULL,
    guru_id TEXT,
    deskripsi TEXT,
    tipe_konten TEXT NOT NULL,
    url_konten TEXT,
    file_lampiran TEXT,
    pertemuan_ke INTEGER DEFAULT 1,
    durasi_menit INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sudah_dibaca_siswa_ids JSONB DEFAULT '[]'::jsonb
);

-- 19. LMS: Tugas
CREATE TABLE IF NOT EXISTS lms_tugas (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    mapel TEXT NOT NULL,
    kelas TEXT NOT NULL,
    guru_nama TEXT NOT NULL,
    guru_id TEXT,
    deskripsi TEXT,
    deadline TEXT NOT NULL,
    bobot_poin NUMERIC DEFAULT 100,
    file_petunjuk TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. LMS: Pengumpulan Tugas (Submissions)
CREATE TABLE IF NOT EXISTS lms_submissions (
    id TEXT PRIMARY KEY,
    tugas_id TEXT NOT NULL,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    siswa_nisn TEXT,
    kelas TEXT NOT NULL,
    tanggal_kumpul TEXT NOT NULL,
    catatan_siswa TEXT,
    file_jawaban_url TEXT,
    status TEXT DEFAULT 'Diserahkan',
    nilai NUMERIC,
    feedback_guru TEXT,
    dinilai_pada TEXT
);

-- 21. LMS: Kuis Online
CREATE TABLE IF NOT EXISTS lms_kuis (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    mapel TEXT NOT NULL,
    kelas TEXT NOT NULL,
    guru_nama TEXT NOT NULL,
    durasi_menit INTEGER DEFAULT 30,
    kkm NUMERIC DEFAULT 75,
    deadline TEXT NOT NULL,
    deskripsi TEXT,
    soal_list JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. LMS: Pengerjaan Kuis (Quiz Attempts)
CREATE TABLE IF NOT EXISTS lms_attempts (
    id TEXT PRIMARY KEY,
    kuis_id TEXT NOT NULL,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    siswa_nisn TEXT,
    kelas TEXT NOT NULL,
    jawaban JSONB DEFAULT '{}'::jsonb,
    skor NUMERIC DEFAULT 0,
    total_benar INTEGER DEFAULT 0,
    total_soal INTEGER DEFAULT 0,
    status_lulus BOOLEAN DEFAULT false,
    selesai_pada TEXT
);

-- 23. LMS: Forum Diskusi
CREATE TABLE IF NOT EXISTS lms_forum (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    mapel TEXT NOT NULL,
    kelas TEXT NOT NULL,
    pembuat_nama TEXT NOT NULL,
    pembuat_role TEXT NOT NULL,
    pembuat_avatar TEXT,
    isi TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    komentar_list JSONB DEFAULT '[]'::jsonb
);

-- 24. LMS: Virtual Meeting
CREATE TABLE IF NOT EXISTS lms_meetings (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    mapel TEXT NOT NULL,
    kelas TEXT NOT NULL,
    guru_nama TEXT NOT NULL,
    platform TEXT NOT NULL,
    meeting_url TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    status TEXT DEFAULT 'Akan Datang',
    keterangan TEXT
);

-- 25. LMS: Bank Soal
CREATE TABLE IF NOT EXISTS lms_bank_soal (
    id TEXT PRIMARY KEY,
    kode TEXT NOT NULL,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    mapel TEXT NOT NULL,
    tingkat_kelas TEXT NOT NULL,
    topik TEXT NOT NULL,
    soal_list JSONB DEFAULT '[]'::jsonb,
    pembuat_guru TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TEXT
);

-- 26. LMS: Jadwal & Jurnal Materi
CREATE TABLE IF NOT EXISTS lms_jadwal_materi (
    id TEXT PRIMARY KEY,
    minggu_ke INTEGER NOT NULL,
    rentang_tanggal TEXT NOT NULL,
    bulan TEXT NOT NULL,
    semester TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    mapel TEXT NOT NULL,
    kelas TEXT NOT NULL,
    bab TEXT NOT NULL,
    sub_bab JSONB DEFAULT '[]'::jsonb,
    alokasi_jp INTEGER DEFAULT 2,
    indikator_kompetensi TEXT,
    materi_terkait_id TEXT,
    sudah_diajarkan BOOLEAN DEFAULT false,
    tanggal_realisasi TEXT,
    jam_realisasi TEXT,
    guru_pengajar TEXT,
    guru_id TEXT,
    catatan_pembelajaran TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS) & IZIN AKSES (POLICIES)
-- =========================================================

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Full access to all" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Full access to all" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;

-- 27. Tahfidz Siswa (Jurnal Setoran Hafalan Al-Qur'an)
CREATE TABLE IF NOT EXISTS tahfidz_siswa (
    id TEXT PRIMARY KEY,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    jenis_setoran TEXT NOT NULL,
    juz INTEGER DEFAULT 30,
    surah TEXT NOT NULL,
    ayat_mulai INTEGER DEFAULT 1,
    ayat_selesai INTEGER DEFAULT 1,
    halaman INTEGER,
    jilid_iqra INTEGER,
    halaman_iqra INTEGER,
    kelancaran TEXT NOT NULL,
    nilai_makhraj NUMERIC DEFAULT 85,
    nilai_tajwid NUMERIC DEFAULT 85,
    catatan_ustadz TEXT,
    ustadz_pengampu TEXT NOT NULL,
    ustadz_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Mutaba'ah Siswa (Ibadah Harian Digital)
CREATE TABLE IF NOT EXISTS mutabaah_siswa (
    id TEXT PRIMARY KEY,
    siswa_id TEXT NOT NULL,
    siswa_nama TEXT NOT NULL,
    nisn TEXT,
    kelas TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    shalat_wajib JSONB DEFAULT '{}'::jsonb,
    ibadah_sunnah JSONB DEFAULT '{}'::jsonb,
    akhlak_karakter JSONB DEFAULT '{}'::jsonb,
    catatan_orang_tua TEXT,
    skor_kebaikan INTEGER DEFAULT 0,
    status_verifikasi TEXT DEFAULT 'Menunggu Verifikasi',
    catatan_guru TEXT,
    verified_by_guru TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
