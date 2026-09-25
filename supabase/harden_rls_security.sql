-- ==============================================================================
-- SIM SEKOLAH PRO - MASTER ROW LEVEL SECURITY (RLS) HARDENING SCRIPT (V2)
-- ==============================================================================
-- Skrip ini dirancang IDEMPOTEN (Bisa dijalankan berkali-kali tanpa error).
-- Secara otomatis membersihkan kebijakan (policy) lama sebelum memasang kebijakan baru.
--
-- CARA PENGGUNAAN:
-- 1. Buka dashboard proyek Supabase Anda: https://supabase.com/dashboard
-- 2. Pilih menu "SQL Editor" di bilah navigasi kiri.
-- 3. Klik "New Query", paste SELURUH isi skrip ini, lalu klik tombol "Run".
-- ==============================================================================

-- 1. Pastikan kolom auth_id tersedia dan terindeks di public.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN auth_id UUID UNIQUE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users (auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- ==============================================================================
-- 2. BERSIHKAN SEMUA KEBIJAKAN LAMA (Mencegah Error "policy already exists")
-- ==============================================================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN (
            'users', 
            'tagihan_siswa', 
            'jenis_tagihan', 
            'tabungan_siswa', 
            'transaksi_tabungan', 
            'peserta_transportasi', 
            'spp_transport_records', 
            'transaksi_spp_transport', 
            'presensi', 
            'nilai_siswa', 
            'siswa', 
            'guru', 
            'kelas', 
            'mata_pelajaran', 
            'jadwal_pelajaran', 
            'school_profile', 
            'pengumuman'
          )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;


-- ==============================================================================
-- 3. AKTIFKAN RLS PADA SELURUH TABEL PANGKALAN DATA
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabungan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_tabungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta_transportasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spp_transport_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_spp_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 4. KEBIJAKAN PENGGUNA (public.users)
-- ==============================================================================
-- Baca: Pengguna terautentikasi dapat membaca direktori pengguna
CREATE POLICY "Users Read Authenticated"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Baca: Klien publik (anon) hanya dapat membaca profil untuk verifikasi login awal
CREATE POLICY "Users Read Anon Lookup"
ON public.users FOR SELECT
TO anon
USING (true);

-- Update: Pengguna sendiri atau Administrator
CREATE POLICY "Users Update Self Or Admin"
ON public.users FOR UPDATE
TO authenticated
USING (
    auth.uid() = auth_id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    auth.uid() = auth_id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Tambah & Hapus Pengguna: Hanya Administrator
CREATE POLICY "Users Insert Admin Only"
ON public.users FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Users Delete Admin Only"
ON public.users FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- ==============================================================================
-- 5. KEBIJAKAN KEUANGAN (SPP, Tagihan, Kas, Tabungan, Transportasi)
-- ==============================================================================
-- Baca: Pengguna terautentikasi
CREATE POLICY "Read Tagihan" ON public.tagihan_siswa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Jenis Tagihan" ON public.jenis_tagihan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Tabungan" ON public.tabungan_siswa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Transaksi Tabungan" ON public.transaksi_tabungan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Transportasi" ON public.peserta_transportasi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read SPP Transport Records" ON public.spp_transport_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Transaksi SPP Transport" ON public.transaksi_spp_transport FOR SELECT TO authenticated USING (true);

-- Kelola Keuangan: Hanya Administrator dan Bendahara
CREATE POLICY "Manage Tagihan" ON public.tagihan_siswa FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));

CREATE POLICY "Manage Jenis Tagihan" ON public.jenis_tagihan FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));

CREATE POLICY "Manage Tabungan" ON public.tabungan_siswa FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));

CREATE POLICY "Manage Transaksi Tabungan" ON public.transaksi_tabungan FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));

CREATE POLICY "Manage Transportasi" ON public.peserta_transportasi FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));

CREATE POLICY "Manage SPP Transport Records" ON public.spp_transport_records FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));

CREATE POLICY "Manage Transaksi SPP Transport" ON public.transaksi_spp_transport FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));


-- ==============================================================================
-- 6. KEBIJAKAN AKADEMIK (Presensi & Nilai Siswa)
-- ==============================================================================
CREATE POLICY "Read Presensi" ON public.presensi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Nilai" ON public.nilai_siswa FOR SELECT TO authenticated USING (true);

-- Kelola Presensi & Nilai: Hanya Admin dan Guru
CREATE POLICY "Manage Presensi" ON public.presensi FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'));

CREATE POLICY "Manage Nilai" ON public.nilai_siswa FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'));


-- ==============================================================================
-- 7. KEBIJAKAN MASTER DATA (Siswa, Guru, Kelas, Mapel, Jadwal)
-- ==============================================================================
CREATE POLICY "Read Siswa" ON public.siswa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Guru" ON public.guru FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Kelas" ON public.kelas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Mapel" ON public.mata_pelajaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read Jadwal" ON public.jadwal_pelajaran FOR SELECT TO authenticated USING (true);

-- Kelola Master Data: Hanya Administrator
CREATE POLICY "Manage Siswa" ON public.siswa FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Manage Guru" ON public.guru FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Manage Kelas" ON public.kelas FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Manage Mapel" ON public.mata_pelajaran FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Manage Jadwal" ON public.jadwal_pelajaran FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- ==============================================================================
-- 8. KEBIJAKAN PROFIL SEKOLAH & PENGUMUMAN
-- ==============================================================================
-- Profil Sekolah dapat dibaca publik (untuk logo, nama sekolah di halaman login)
CREATE POLICY "Read School Profile" ON public.school_profile FOR SELECT TO anon, authenticated USING (true);

-- Hanya Admin yang boleh mengubah profil sekolah
CREATE POLICY "Manage School Profile" ON public.school_profile FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Pengumuman dapat dibaca semua pengguna
CREATE POLICY "Read Pengumuman" ON public.pengumuman FOR SELECT TO authenticated USING (true);

-- Buat/Edit Pengumuman: Hanya Admin dan Guru
CREATE POLICY "Manage Pengumuman" ON public.pengumuman FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'));
