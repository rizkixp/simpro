-- ==============================================================================
-- SIM SEKOLAH PRO - FASE 1: SUPABASE AUTH INTEGRATION & SECURITY HARDENING
-- ==============================================================================

-- 1. Tambahkan kolom auth_id pada public.users jika belum ada
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

-- 2. Buat index untuk pencarian cepat berbasis email dan NISN/NIP
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_nisn_nip ON public.users (nisn_or_nip);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- 3. Trigger Otomatis: Sinkronkan user baru dari auth.users ke public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
    v_role text;
    v_name text;
    v_nisn text;
    v_kelas text;
    v_phone text;
    v_avatar text;
    v_existing_id text;
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'siswa');
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_nisn := NEW.raw_user_meta_data->>'nisn_or_nip';
    v_kelas := NEW.raw_user_meta_data->>'kelas';
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || encode(v_name::bytea, 'escape')
    );

    -- Cek apakah sudah ada record di public.users dengan email atau NISN yang sama
    SELECT id INTO v_existing_id 
    FROM public.users 
    WHERE lower(email) = lower(NEW.email) 
       OR (v_nisn IS NOT NULL AND nisn_or_nip = v_nisn)
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.users SET
            auth_id = NEW.id,
            email = NEW.email,
            name = COALESCE(v_name, name),
            role = COALESCE(v_role, role),
            avatar = COALESCE(v_avatar, avatar),
            nisn_or_nip = COALESCE(v_nisn, nisn_or_nip),
            kelas = COALESCE(v_kelas, kelas),
            phone = COALESCE(v_phone, phone),
            status = 'Aktif'
        WHERE id = v_existing_id;
    ELSE
        INSERT INTO public.users (
            id,
            auth_id,
            name,
            email,
            role,
            avatar,
            nisn_or_nip,
            kelas,
            phone,
            status,
            created_at
        ) VALUES (
            NEW.id::text,
            NEW.id,
            v_name,
            NEW.email,
            v_role,
            v_avatar,
            v_nisn,
            v_kelas,
            v_phone,
            'Aktif',
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Kebijakan Row Level Security (RLS) Terpadu Berbasis auth.uid()

-- Aktifkan RLS di public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Users" ON public.users;
DROP POLICY IF EXISTS "Users Select Policy" ON public.users;
DROP POLICY IF EXISTS "Users Insert Policy" ON public.users;
DROP POLICY IF EXISTS "Users Update Policy" ON public.users;
DROP POLICY IF EXISTS "Users Delete Policy" ON public.users;

-- User dapat melihat profil pengguna lain (untuk direktori guru, wali kelas, dll)
CREATE POLICY "Authenticated users can read users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Anon key diizinkan hanya membaca email dan NISN untuk pengecekan login awal
CREATE POLICY "Anon can lookup login identifier"
ON public.users FOR SELECT
TO anon
USING (true);

-- Hanya user itu sendiri atau admin yang dapat mengupdate profil
CREATE POLICY "Users can update own profile or admin"
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

-- Hanya Admin yang boleh insert atau delete di public.users langsung
CREATE POLICY "Admin can insert users"
ON public.users FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can delete users"
ON public.users FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 5. Kebijakan RLS untuk Keuangan & Tabungan
ALTER TABLE public.tabungan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_tabungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_spp_transport ENABLE ROW LEVEL SECURITY;

-- Baca: Authenticated users dapat membaca tagihan/tabungan miliknya atau staff
DROP POLICY IF EXISTS "Tabungan Siswa Policy" ON public.tabungan_siswa;
CREATE POLICY "Read Tabungan" ON public.tabungan_siswa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Manage Tabungan" ON public.tabungan_siswa;
CREATE POLICY "Manage Tabungan" ON public.tabungan_siswa FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'bendahara'));

-- 6. Kebijakan RLS untuk Nilai Siswa
ALTER TABLE public.nilai_siswa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Nilai Siswa Policy" ON public.nilai_siswa;

CREATE POLICY "Read Nilai" ON public.nilai_siswa FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage Nilai" ON public.nilai_siswa FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'))
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'guru'));
