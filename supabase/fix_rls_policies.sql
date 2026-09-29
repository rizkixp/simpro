-- ==============================================================================
-- SIM SEKOLAH PRO - TABUNGAN & KEUANGAN RLS POLICY FIX
-- Skrip ini memastikan operasi Tabungan & Transaksi Tabungan dapat diakses 
-- secara penuh oleh anon key maupun pengguna terautentikasi tanpa error 42501.
-- ==============================================================================

-- 1. Pastikan tabel Tabungan & Transaksi mengaktifkan Row Level Security
ALTER TABLE IF EXISTS public.tabungan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transaksi_tabungan ENABLE ROW LEVEL SECURITY;

-- 2. Bersihkan kebijakan lama pada tabel Tabungan
DROP POLICY IF EXISTS "Manage Tabungan" ON public.tabungan_siswa;
DROP POLICY IF EXISTS "Read Tabungan" ON public.tabungan_siswa;
DROP POLICY IF EXISTS "Tabungan Siswa Policy" ON public.tabungan_siswa;
DROP POLICY IF EXISTS "Tabungan Siswa Access Policy" ON public.tabungan_siswa;

-- 3. Bersihkan kebijakan lama pada tabel Transaksi Tabungan
DROP POLICY IF EXISTS "Manage Transaksi Tabungan" ON public.transaksi_tabungan;
DROP POLICY IF EXISTS "Read Transaksi Tabungan" ON public.transaksi_tabungan;
DROP POLICY IF EXISTS "Transaksi Tabungan Policy" ON public.transaksi_tabungan;
DROP POLICY IF EXISTS "Transaksi Tabungan Access Policy" ON public.transaksi_tabungan;

-- 4. Pasang kebijakan akses penuh (SELECT, INSERT, UPDATE, DELETE) untuk public (anon & authenticated)
CREATE POLICY "Tabungan Siswa Access Policy" 
ON public.tabungan_siswa 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Transaksi Tabungan Access Policy" 
ON public.transaksi_tabungan 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
