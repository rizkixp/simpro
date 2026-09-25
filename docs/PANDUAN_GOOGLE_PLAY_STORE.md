# 🚀 Panduan Lengkap Penerbitan SIM Sekolah PRO ke Google Play Store

Dokumen ini adalah panduan langkah-demi-langkah resmi untuk mengemas (*package*) dan merilis aplikasi **SIM Sekolah PRO** ke **Google Play Store** dalam format berkas **`.aab` (Android App Bundle)** menggunakan teknologi resmi Google **Trusted Web Activity (TWA)**.

---

## 🌟 Keunggulan Teknologi TWA Google Play Store
1. **Pembaruan Instan (Zero Re-submit)**:  
   Setiap kali Anda mengubah fitur atau memperbaiki kode dan men-deploy ke hosting web Anda, **aplikasi di HP seluruh guru dan wali murid langsung terupdate seketika**, tanpa Anda perlu mengunggah ulang berkas `.aab` ke Google Play Console!
2. **100% Tampilan Aplikasi Android Asli**:  
   Bilah URL Chrome hilang total (*Full-Screen Native Experience*). Aplikasi memiliki ikon di beranda HP, splash screen resmi, dan notifikasi layaknya aplikasi native Kotlin/Java.
3. **Ukuran Unduhan Sangat Kecil (< 3 MB)**:  
   Wali murid dapat mengunduh aplikasi dari Google Play Store hanya dalam hitungan detik tanpa menghabiskan kuota internet.

---

## 📋 DAFTAR ISI
1. [Langkah 1: Persiapan Akun Google Play Developer](#langkah-1-persiapan-akun-google-play-developer)
2. [Langkah 2: Menghubungkan Domain Sekolah (Digital Asset Links)](#langkah-2-menghubungkan-domain-sekolah-digital-asset-links)
3. [Langkah 3: Dua Cara Mudah Membuat Berkas `.aab`](#langkah-3-dua-cara-mudah-membuat-berkas-aab)
   - [Opsi 3A: Menggunakan PWABuilder (Cara Termudah - 1 Klik Tanpa Install Alat)](#opsi-3a-menggunakan-pwabuilder-cara-termudah---1-klik-online)
   - [Opsi 3B: Menggunakan Google CLI Bubblewrap (Cara Developer / Terminal)](#opsi-3b-menggunakan-google-cli-bubblewrap-terminal)
4. [Langkah 4: Checklist Pengisian di Google Play Console](#langkah-4-checklist-pengisian-di-google-play-console)
5. [Langkah 5: Rilis & Publikasi](#langkah-5-rilis--publikasi)

---

## Langkah 1: Persiapan Akun Google Play Developer
1. Buka [Google Play Console](https://play.google.com/console/signup).
2. Masuk menggunakan akun Google yayasan atau sekolah Anda.
3. Bayar biaya registrasi **$25 USD (sekitar Rp 390.000,-)**. Biaya ini dibayar **hanya 1 kali seumur hidup** dan akun Anda dapat digunakan untuk menerbitkan aplikasi sekolah tanpa batas.
4. Lengkapi verifikasi identitas (KTP penanggung jawab atau dokumen legalitas yayasan/madrasah).

---

## Langkah 2: Menghubungkan Domain Sekolah (Digital Asset Links)
Agar peramban Chrome di Android menyembunyikan bilah alamat URL dan menjadikan aplikasi berlayar penuh murni (*True Native Fullscreen*), Google mewajibkan verifikasi kepemilikan domain:

1. Berkas verifikasi telah kami buatkan di:  
   📁 [`public/.well-known/assetlinks.json`](file:///c:/Users/User/OneDrive/Documents/AntiGravity/3.%20SDIPRO/public/.well-known/assetlinks.json)
2. Ketika aplikasi Anda telah di-hosting ke domain sekolah Anda (misal `https://sim.sekolah.id`), pastikan berkas tersebut dapat diakses publik melalui browser di:  
   `https://sim.sekolah.id/.well-known/assetlinks.json`
3. Salin nilai **SHA-256 Fingerprint** dari Google Play Console (Menu **Setup > App Signing**) dan tempelkan ke dalam daftar `sha256_cert_fingerprints` di file `assetlinks.json` tersebut.

---

## Langkah 3: Dua Cara Mudah Membuat Berkas `.aab`

### Opsi 3A: Menggunakan PWABuilder (Cara Termudah - 1 Klik Online)
*Direkomendasikan oleh Google & Microsoft bagi yang tidak ingin repot menginstall Android Studio atau Java SDK.*

1. Buka situs resmi: **[https://www.pwabuilder.com/](https://www.pwabuilder.com/)**
2. Masukkan URL domain aplikasi Anda yang sudah aktif (misal `https://sim.sekolah.id` atau domain Vercel Anda), lalu klik **Start**.
3. PWABuilder akan memvalidasi *Manifest*, *Service Worker (v2.0 yang sudah kita buat)*, dan *Keamanan HTTPS*. Skor Anda akan mencapai **100/100 (PWA Ready)**.
4. Klik tombol **Package for Stores**, lalu pilih kartu **Google Play (Android)**.
5. Klik **Generate**:
   - Package ID: `id.sekolah.simpro` (atau sesuaikan)
   - App Name: `SIM Sekolah PRO`
   - Launcher Name: `SDI Smart`
6. Unduh paket `.zip` yang dihasilkan. Di dalamnya sudah terdapat:
   - Berkas **`app-release.aab`** (Berkas yang diunggah ke Google Play Store)
   - Berkas **`assetlinks.json`** yang sudah berisi fingerprint kunci tanda tangan Anda.

---

### Opsi 3B: Menggunakan Google CLI Bubblewrap (Terminal)
*Bagi pengembang yang ingin membuat bundel langsung dari komputer lokal.*

1. Pastikan komputer Anda terpasang **Node.js** dan **Java JDK 17+**.
2. Install alat resmi Google:
   ```bash
   npm install -g @bubblewrap/cli
   ```
3. Inisialisasi proyek dari file `twa-manifest.json` yang telah kami siapkan di root folder:
   ```bash
   bubblewrap init --manifest="https://sim.sekolah.id/manifest.webmanifest"
   ```
4. Bangun paket rilis Android Bundle:
   ```bash
   bubblewrap build
   ```
5. File `app-release-bundle.aab` siap diunggah ke Google Play Console!

---

## Langkah 4: Checklist Pengisian di Google Play Console

Saat membuat aplikasi baru di Google Play Console, Anda akan diminta mengisi beberapa kuesioner wajib:

| Formulir di Play Console | Pilihan Jawaban yang Benar |
| :--- | :--- |
| **Nama Aplikasi** | `SIM Sekolah PRO` (atau nama sekolah Anda, misal: `SIM SD Islam Smart`) |
| **Bahasa Default** | Bahasa Indonesia (id) |
| **Aplikasi atau Game?** | Aplikasi (*App*) |
| **Gratis atau Berbayar?** | Gratis (*Free*) |
| **Kebijakan Privasi (Privacy Policy)** | Masukkan URL resmi yang telah kita buat: <br>`https://domain-anda.com/privasi` |
| **Akses Aplikasi (App Access)** | Pilih *"Sebagian fungsi dibatasi"* &rarr; berikan 1 akun demo untuk penguji Google (misal: `guru@sekolah.id` / `guru123`). |
| **Iklan (Ads)** | Pilih **"Tidak, aplikasi saya tidak berisi iklan"** (*Zero Ads*). |
| **Target Audiens & Konten Keluarga** | Pilih rentang usia siswa sekolah Anda (misal: 6-12 tahun untuk SD, atau 13+ untuk wali murid & guru). Karena ini aplikasi pendidikan resmi, pilih kategori **Education**. |
| **Keamanan Data (Data Safety)** | Centang bahwa aplikasi mengumpulkan Data Nama, Kontak (No. HP untuk notifikasi kehadiran WA), dan Info Finansial (SPP via Midtrans), serta tegaskan bahwa data **tidak dibagikan ke pihak ketiga dan tidak dijual**. |

---

## Langkah 5: Rilis & Publikasi

1. Di Google Play Console, buka menu **Testing > Internal testing** atau langsung ke **Production**.
2. Klik tombol **Create new release**.
3. Unggah (*upload*) berkas **`.aab`** yang Anda dapatkan dari Langkah 3.
4. Beri nama rilis: `1.0.0 (Peluncuran Resmi Madrasah Digital)`.
5. Klik **Save** &rarr; **Review Release** &rarr; **Start rollout to Production**.
6. Google biasanya membutuhkan waktu tinjauan (*review*) sekitar **1 s.d. 3 hari kerja**.
7. Begitu disetujui, aplikasi SIM Sekolah PRO Anda akan resmi tayang di Google Play Store dan dapat diunduh oleh seluruh wali murid dan guru di seluruh dunia! 🚀
