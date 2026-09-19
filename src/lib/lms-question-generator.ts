import { LMSBankSoalItem, TingkatKesulitanSoal } from "@/types/school";

// Rekomendasi Topik Kurikulum Populer per Mata Pelajaran
export const REKOMENDASI_TOPIK_MAPEL: Record<string, string[]> = {
  "Matematika": [
    "Operasi Hitung Campuran Bilangan Bulat & Pecahan",
    "FPB dan KPK Tiga Bilangan",
    "Lingkaran: Keliling dan Luas",
    "Bangun Ruang: Volume & Luas Kubus, Balok, Tabung",
    "Pengolahan Data: Rata-rata (Mean), Modus, Median",
    "Persamaan & Fungsi Kuadrat",
    "Trigonometri Dasar",
    "Statistika & Peluang",
  ],
  "Tematik": [
    "Selamatkan Makhluk Hidup (Perkembangbiakan Tumbuhan & Hewan)",
    "Persatuan dalam Perbedaan (Kerukunan & Proklamasi)",
    "Tokoh dan Penemuan (Rangkaian Listrik Seri & Paralel)",
    "Globalisasi dan Kerjasama Budaya ASEAN",
    "Wirausaha dan Karakteristik Magnet",
    "Menuju Masyarakat Sejahtera (Ciri Pubertas Remaja)",
    "Kepemimpinan & Menjaga Persatuan Bangsa",
    "Bumiku (Rotasi, Revolusi Bumi & Gerhana)",
    "Menjelajah Luar Angkasa (Tata Surya & Planet)",
  ],
  "Pendidikan Agama Islam": [
    "Membaca & Memahami Makna QS. Al-Kafirun & Al-Ma'idah",
    "Iman kepada Hari Akhir (Kiamat Sugra & Kubra)",
    "Mengenal Asmaul Husna (As-Samad, Al-Muqtadir, Al-Muqaddim)",
    "Zakat, Infaq, dan Sedekah",
    "Kisah Teladan Para Rasul Ulul Azmi",
    "Perilaku Akhlak Terpuji (Saling Menghargai & Berbaik Sangka)",
  ],
  "Matematika Wajib": [
    "Persamaan & Pertidaksamaan Nilai Mutlak",
    "Persamaan & Fungsi Kuadrat",
    "Sistem Persamaan Linear Tiga Variabel (SPLTV)",
    "Matriks & Determinan",
    "Trigonometri Dasar & Sudut Berelasi",
    "Barisan dan Deret Aritmatika/Geometri",
    "Limit Fungsi Aljabar",
    "Turunan Fungsi & Nilai Maksimum/Minimum",
    "Integral Tentu & Tak Tentu",
    "Statistika & Ukuran Pemusatan Data",
    "Peluang & Kaidah Pencacahan",
  ],
  "Fisika": [
    "Hukum Gerak Newton & Gaya Gesek",
    "Gerak Lurus (GLB & GLBB)",
    "Gerak Parabola & Melingkar",
    "Usaha & Hukum Kekekalan Energi Mekanik",
    "Momentum, Impuls & Tumbukan",
    "Dinamika Rotasi & Kesetimbangan Benda Tegar",
    "Fluida Statis & Dinamis (Hukum Bernoulli)",
    "Suhu, Kalor & Azas Black",
    "Hukum Termodinamika & Efisiensi Mesin Carnot",
    "Gelombang Mekanik & Gelombang Bunyi (Efek Doppler)",
    "Listrik Dinamis & Hukum Kirchhoff",
    "Induksi Elektromagnetik & Hukum Faraday",
  ],
  "Biologi": [
    "Struktur Sel & Fungsi Organel Seluler",
    "Transpor Membran (Difusi & Osmosis)",
    "Metabolisme Sel: Enzim & Jalur Respirasi Seluler",
    "Fotosintesis (Reaksi Terang & Siklus Calvin)",
    "Sistem Peredaran Darah Manusia",
    "Sistem Pencernaan & Nutrisi",
    "Sistem Respirasi & Ekskresi Manusia",
    "Sistem Regulasi (Saraf & Hormon)",
    "Genetika: DNA, RNA & Sintesis Protein",
    "Pola Hereditas & Hukum Pewarisan Sifat Mendel",
    "Evolusi Biologi & Seleksi Alam",
    "Bioteknologi Konvensional & Modern",
  ],
  "Kimia": [
    "Struktur Atom & Sistem Periodik Unsur",
    "Konfigurasi Elektron & Bilangan Kuantum",
    "Ikatan Kimia (Kovalen, Ion, Logam)",
    "Bentuk Molekul & Gaya Antarmolekul",
    "Stoikiometri & Konsep Mol",
    "Larutan Elektrolit & Reaksi Redoks",
    "Termokimia & Perubahan Entalpi (Hukum Hess)",
    "Laju Reaksi & Faktor yang Memengaruhinya",
    "Kesetimbangan Kimia & Asas Le Chatelier",
    "Teori Asam Basa & Perhitungan pH Larutan",
    "Larutan Penyangga (Buffer) & Hidrolisis Garam",
    "Elektrokimia: Sel Volta & Elektrolisis",
  ],
  "Bahasa Indonesia": [
    "Teks Laporan Hasil Observasi (LHO)",
    "Teks Anekdot & Struktur Kritik Sosial",
    "Teks Negosiasi & Strategi Kompromi",
    "Teks Eksplanasi Sebab-Akibat Fenomena",
    "Teks Editorial & Analisis Opini Redaksi",
    "Karya Tulis Ilmiah & Sistematika Penulisan",
    "Resensi Buku & Teks Ulasan Kritis",
    "Kaidah Kebahasaan EYD/PUEBI & Kalimat Efektif",
    "Majas, Diksi & Gaya Bahasa Puisi",
  ],
  "Bahasa Inggris": [
    "Descriptive & Report Text Structure",
    "Narrative Text & Moral Values",
    "Passive Voice in Various Tenses",
    "Analytical & Hortatory Exposition Text",
    "Conditional Sentences (Type 1, 2, 3)",
    "Modals of Deduction & Polite Request",
    "Grammar: Subject-Verb Agreement",
    "Vocabulary in Academic & Scientific Context",
    "Reading Comprehension: Inference & Main Idea",
  ],
  "Sejarah": [
    "Kehidupan Manusia Praaksara di Indonesia",
    "Pengaruh Kebudayaan Hindu-Buddha di Nusantara",
    "Perkembangan Kerajaan-Kerajaan Islam",
    "Kolonialisme Bangsa Barat & Perlawanan Rakyat",
    "Kebangkitan Nasional & Sumpah Pemuda 1928",
    "Peristiwa Proklamasi Kemerdekaan RI 1945",
    "Masa Demokrasi Terpimpin & Orde Baru",
    "Perkembangan Reformasi di Indonesia",
  ],
  "Pendidikan Agama Islam (PAI)": [
    "Iman kepada Kitab-Kitab Allah SWT",
    "Iman kepada Hari Akhir & Tanda-Tandanya",
    "Iman kepada Qada dan Qadar",
    "Perilaku Akhlak Terpuji (Syaja'ah, Jujur, Tawakal)",
    "Hukum Bacaan Tajwid (Idgham, Iqlab, Mad)",
    "Hukum Islam tentang Muamalah (Jual Beli, Riba)",
    "Pernikahan dalam Perspektif Syariat Islam",
    "Sejarah Peradaban Islam Masa Keemasan",
  ],
  "Informatika": [
    "Berpikir Komputasional & Dekomposisi Masalah",
    "Struktur Data: Stack, Queue, Array, Tree",
    "Algoritma Pemrograman & Flowchart",
    "Jaringan Komputer & Protokol TCP/IP",
    "Keamanan Siber, Kriptografi & Phishing",
    "Basis Data Relasional & Sintaks SQL",
    "Pengembangan Aplikasi Web Modern",
  ],
  "Ekonomi": [
    "Konsep Dasar Ilmu Ekonomi & Kelangkaan",
    "Mekanisme Pasar: Permintaan & Penawaran",
    "Bentuk-Bentuk Pasar (Persaingan Sempurna & Monopoli)",
    "Kebijakan Moneter & Kebijakan Fiskal",
    "Pendapatan Nasional & Inflasi",
    "Perdagangan Internasional & Neraca Pembayaran",
    "Akuntansi Dasar: Jurnal Umum & Buku Besar",
  ],
  "Sosiologi": [
    "Fungsi Sosiologi dalam Pengkajian Gejala Sosial",
    "Interaksi Sosial & Pembentukan Identitas Diri",
    "Nilai & Norma Sosial dalam Kehidupan Masyarakat",
    "Diferensiasi & Stratifikasi Sosial",
    "Konflik Sosial & Upaya Resolusi Damai",
    "Perubahan Sosial & Dampak Globalisasi",
  ],
  "Geografi": [
    "Konsep Dasar & Prinsip-Prinsip Geografi",
    "Penginderaan Jauh & Sistem Informasi Geografis (SIG)",
    "Dinamika Litosfer & Dampak Terhadap Kehidupan",
    "Dinamika Atmosfer & Pengaruh Iklim",
    "Dinamika Hidrosfer & Pengelolaan DAS",
    "Persebaran Flora dan Fauna di Indonesia dan Dunia",
    "Dinamika Kependudukan & Bonus Demografi",
  ],
};

// Basis Pengetahuan Kurikulum Spesifik untuk Topik Terpilih
const TOPIC_KNOWLEDGE_BASE: Record<
  string,
  Array<{
    pertanyaan: string;
    pilihan: string[];
    kunciJawaban: number;
    pembahasan: string;
    tingkatKesulitan: TingkatKesulitanSoal;
    poinDefault: number;
  }>
> = {
  "persamaan & pertidaksamaan nilai mutlak": [
    {
      pertanyaan: "Himpunan penyelesaian dari persamaan nilai mutlak |3x - 6| = 9 adalah...",
      pilihan: ["{-1, 5}", "{1, 5}", "{-5, 1}", "{-1, -5}", "{2, 5}"],
      kunciJawaban: 0,
      pembahasan: "Berdasarkan definisi nilai mutlak:\n1) 3x - 6 = 9 => 3x = 15 => x = 5\n2) 3x - 6 = -9 => 3x = -3 => x = -1.\nMaka HP = {-1, 5}.",
      tingkatKesulitan: "Mudah",
      poinDefault: 10,
    },
    {
      pertanyaan: "Nilai x yang memenuhi pertidaksamaan nilai mutlak |2x + 1| < 7 adalah...",
      pilihan: ["-4 < x < 3", "-3 < x < 4", "x < -4 atau x > 3", "x < -3 atau x > 4", "-7 < x < 7"],
      kunciJawaban: 0,
      pembahasan: "Sifat pertidaksamaan |f(x)| < a: -a < f(x) < a.\n-7 < 2x + 1 < 7\nKurangi 1 pada semua ruas: -8 < 2x < 6\nBagi 2: -4 < x < 3.",
      tingkatKesulitan: "Sedang",
      poinDefault: 15,
    },
    {
      pertanyaan: "Batas-batas nilai x yang memenuhi pertidaksamaan |x - 2| ≥ |2x + 1| adalah...",
      pilihan: ["-3 ≤ x ≤ 1/3", "x ≤ -3 atau x ≥ 1/3", "-1/3 ≤ x ≤ 3", "x ≤ -1/3 atau x ≥ 3", "x ≤ -3"],
      kunciJawaban: 0,
      pembahasan: "Kedua ruas bernilai non-negatif, kuadratkan kedua ruas:\n(x - 2)² ≥ (2x + 1)²\n(x - 2)² - (2x + 1)² ≥ 0\n[(x - 2) + (2x + 1)][(x - 2) - (2x + 1)] ≥ 0\n(3x - 1)(-x - 3) ≥ 0 => -(3x - 1)(x + 3) ≥ 0 => (3x - 1)(x + 3) ≤ 0.\nPembuat nol: x = -3 dan x = 1/3. Maka daerah penyelesaian adalah -3 ≤ x ≤ 1/3.",
      tingkatKesulitan: "Sukar",
      poinDefault: 20,
    },
  ],
  "hukum gerak newton": [
    {
      pertanyaan: "Sebuah balok bermassa 5 kg diam di atas lantai licin. Balok tersebut didorong dengan gaya konstan 25 N selama 4 sekon. Kecepatan balok pada akhir sekon ke-4 adalah...",
      pilihan: ["10 m/s", "15 m/s", "20 m/s", "25 m/s", "30 m/s"],
      kunciJawaban: 2,
      pembahasan: "Percepatan a = F / m = 25 N / 5 kg = 5 m/s².\nKecepatan akhir v = v₀ + a·t = 0 + (5)(4) = 20 m/s.",
      tingkatKesulitan: "Mudah",
      poinDefault: 10,
    },
    {
      pertanyaan: "Sebuah kotak bermassa 10 kg ditarik pada lantai kasar mendatar dengan koefisien gesekan kinetik μk = 0,2 menggunakan gaya tarik mendatar F = 50 N (g = 10 m/s²). Besar gaya gesek kinetik yang bekerja pada balok adalah...",
      pilihan: ["10 N", "20 N", "30 N", "40 N", "50 N"],
      kunciJawaban: 1,
      pembahasan: "Gaya normal N = m·g = 10 kg × 10 m/s² = 100 N.\nGaya gesek kinetik fk = μk · N = 0,2 × 100 N = 20 N.",
      tingkatKesulitan: "Sedang",
      poinDefault: 15,
    },
    {
      pertanyaan: "Dua benda bermassa m₁ = 2 kg dan m₂ = 3 kg dihubungkan dengan tali ringan melalui sebuah katrol licin tanpa gesekan (pesawat Atwood). Jika g = 10 m/s², besar tegangan tali penggantung adalah...",
      pilihan: ["12 N", "18 N", "24 N", "30 N", "36 N"],
      kunciJawaban: 2,
      pembahasan: "Percepatan sistem: a = (m₂ - m₁)·g / (m₁ + m₂) = (3 - 2)·10 / (2 + 3) = 10/5 = 2 m/s².\nTegangan tali: T = m₁(g + a) = 2(10 + 2) = 24 N. Atau T = m₂(g - a) = 3(10 - 2) = 24 N.",
      tingkatKesulitan: "Sukar",
      poinDefault: 20,
    },
  ],
  "struktur sel & fungsi organel seluler": [
    {
      pertanyaan: "Organel sel eukariotik yang berfungsi sebagai tempat terjadinya respirasi seluler dan pembentukan energi dalam bentuk ATP adalah...",
      pilihan: ["Ribosom", "Lisosom", "Mitokondria", "Badan Golgi", "Sentriol"],
      kunciJawaban: 2,
      pembahasan: "Mitokondria sering disebut 'the powerhouse of the cell' karena merupakan organel tempat terjadinya siklus Krebs dan rantai transpor elektron yang menghasilkan ATP dalam respirasi aerob.",
      tingkatKesulitan: "Mudah",
      poinDefault: 10,
    },
    {
      pertanyaan: "Perbedaan utama antara struktur sel tumbuhan dan sel hewan yang menyebabkan sel tumbuhan memiliki bentuk kaku dan tetap adalah adanya...",
      pilihan: ["Dinding sel yang mengandung selulosa", "Membran plasma yang elastis", "Mitokondria dalam jumlah banyak", "Ribosom yang menempel pada retikulum endoplasma", "Sentriol untuk pembelahan sel"],
      kunciJawaban: 0,
      pembahasan: "Sel tumbuhan memiliki dinding sel kaku yang tersusun atas serat-serat selulosa, pektin, dan hemiselulosa yang mempertahankan bentuk sel serta melindungi sel dari tekanan turgor tinggi.",
      tingkatKesulitan: "Sedang",
      poinDefault: 15,
    },
    {
      pertanyaan: "Jika sel leukosit mengalami gangguan pada enzim hidrolitik di dalam organel lisosomnya, dampak klinis/seluler langsung yang akan terjadi adalah...",
      pilihan: ["Kegagalan replikasi DNA dalam inti sel", "Ketidakmampuan menghancurkan patogen asing melalui fagositosis", "Penghentian produksi protein pada ribosom", "Terhentinya sintesis lipid oleh retikulum endoplasma halus", "Kegagalan sekresi vesikel oleh aparatus Golgi"],
      kunciJawaban: 1,
      pembahasan: "Lisosom mengandung enzim hidrolase asam yang berfungsi mencerna materi intraseluler dan partikel asing. Pada sel fagositik seperti leukosit/makrofag, rusaknya enzim lisosom akan melumpuhkan kemampuan mendegradasi kuman/bakteri.",
      tingkatKesulitan: "Sukar",
      poinDefault: 20,
    },
  ],
  "struktur atom & konfigurasi elektron": [
    {
      pertanyaan: "Menurut teori atom mekanika kuantum, orbital s memiliki bentuk bola simetris dan dapat menampung elektron maksimum sebanyak...",
      pilihan: ["2 elektron", "6 elektron", "10 elektron", "14 elektron", "8 elektron"],
      kunciJawaban: 0,
      pembahasan: "Subkulit s memiliki 1 orbital sehingga berdasarkan asas larangan Pauli, orbital s dapat menampung maksimal 2 elektron dengan arah spin berlawanan.",
      tingkatKesulitan: "Mudah",
      poinDefault: 10,
    },
    {
      pertanyaan: "Konfigurasi elektron ion Fe³⁺ (nomor atom Fe = 26) pada keadaan dasar adalah...",
      pilihan: ["[Ar] 4s² 3d³", "[Ar] 3d⁵", "[Ar] 4s¹ 3d⁴", "[Ar] 3d⁶", "[Ar] 4s² 3d⁶"],
      kunciJawaban: 1,
      pembahasan: "Atom netral Fe (26): [Ar] 4s² 3d⁶. Ketika membentuk ion Fe³⁺, 3 elektron dilepas: 2 elektron dari kulit terluar 4s dan 1 elektron dari subkulit 3d. Sehingga konfigurasinya menjadi [Ar] 3d⁵.",
      tingkatKesulitan: "Sedang",
      poinDefault: 15,
    },
    {
      pertanyaan: "Suatu unsur memiliki elektron terakhir dengan bilangan kuantum n = 3, l = 2, m = 0, s = -1/2. Letak unsur tersebut dalam sistem periodik unsur adalah...",
      pilihan: ["Golongan VIIIB, Periode 4", "Golongan VIIIB, Periode 3", "Golongan IIB, Periode 4", "Golongan VIA, Periode 3", "Golongan VB, Periode 4"],
      kunciJawaban: 0,
      pembahasan: "n = 3, l = 2 mengindikasikan subkulit 3d. Orbital m = -2, -1, 0, +1, +2. Dengan s = -1/2, orbital telah terisi elektron kedua (spin bawah) sampai m = 0, yaitu terisi 8 elektron (3d⁸). Konfigurasi lengkap: [Ar] 4s² 3d⁸. Jumlah elektron valensi 4s² 3d⁸ = 10 elektron -> Golongan VIIIB, Periode 4.",
      tingkatKesulitan: "Sukar",
      poinDefault: 20,
    },
  ],
  "passive voice in various tenses": [
    {
      pertanyaan: "Change this sentence into passive voice: 'The students clean the chemistry laboratory every Friday.'",
      pilihan: [
        "The chemistry laboratory is cleaned by the students every Friday.",
        "The chemistry laboratory was cleaned by the students every Friday.",
        "The chemistry laboratory has been cleaned by the students every Friday.",
        "The chemistry laboratory is being cleaned by the students every Friday.",
        "The chemistry laboratory will be cleaned by the students every Friday."
      ],
      kunciJawaban: 0,
      pembahasan: "Kalimat aktif menggunakan Simple Present Tense ('clean'). Rumus passive voice: Subject + is/am/are + V3 (Past Participle). Karena 'laboratory' tunggal, kita gunakan 'is cleaned'.",
      tingkatKesulitan: "Mudah",
      poinDefault: 10,
    },
    {
      pertanyaan: "Identify the correct passive sentence for: 'The architect was designing the modern library when the earthquake struck.'",
      pilihan: [
        "The modern library had been designed by the architect when the earthquake struck.",
        "The modern library was being designed by the architect when the earthquake struck.",
        "The modern library was designed by the architect when the earthquake struck.",
        "The modern library is being designed by the architect when the earthquake struck.",
        "The modern library would be designed by the architect when the earthquake struck."
      ],
      kunciJawaban: 1,
      pembahasan: "Kalimat aktif menggunakan Past Continuous Tense ('was designing'). Pola pasifnya adalah: Subject + was/were + being + V3. Maka bentuk yang tepat adalah 'was being designed'.",
      tingkatKesulitan: "Sedang",
      poinDefault: 15,
    },
  ],
};

// Generator Soal Berbasis Topik & Algoritma Pedagogis
export function generateBankSoalQuestions(params: {
  mapel: string;
  tingkatKelas: string;
  topik: string;
  jumlahSoal: number;
  kesulitan?: "Campuran" | "Mudah" | "Sedang" | "Sukar";
}): LMSBankSoalItem[] {
  const { mapel, tingkatKelas, topik, jumlahSoal, kesulitan = "Campuran" } = params;
  const normalizedTopic = topik.toLowerCase().trim();

  // 1. Cek apakah ada matching dalam basis pengetahuan kurikulum
  let matchedQuestions: Array<{
    pertanyaan: string;
    pilihan: string[];
    kunciJawaban: number;
    pembahasan: string;
    tingkatKesulitan: TingkatKesulitanSoal;
    poinDefault: number;
  }> = [];

  for (const [key, questions] of Object.entries(TOPIC_KNOWLEDGE_BASE)) {
    if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
      matchedQuestions = [...questions];
      break;
    }
  }

  const result: LMSBankSoalItem[] = [];
  const targetCount = Math.max(1, Math.min(jumlahSoal, 10));

  // Tentukan urutan tingkat kesulitan
  const difficulties: TingkatKesulitanSoal[] = [];
  for (let i = 0; i < targetCount; i++) {
    if (kesulitan === "Mudah") difficulties.push("Mudah");
    else if (kesulitan === "Sedang") difficulties.push("Sedang");
    else if (kesulitan === "Sukar") difficulties.push("Sukar");
    else {
      // Campuran
      if (i % 3 === 0) difficulties.push("Mudah");
      else if (i % 3 === 1) difficulties.push("Sedang");
      else difficulties.push("Sukar");
    }
  }

  // Gunakan matched questions yang sesuai jika tersedia
  let matchIndex = 0;
  for (let i = 0; i < targetCount; i++) {
    const diff = difficulties[i];
    const timestamp = Date.now() + i;

    if (matchIndex < matchedQuestions.length) {
      const q = matchedQuestions[matchIndex++];
      result.push({
        id: `gen-${timestamp}-${i + 1}`,
        kode: `BS-GEN-${(i + 1).toString().padStart(2, "0")}`,
        pertanyaan: q.pertanyaan,
        pilihan: q.pilihan,
        kunciJawaban: q.kunciJawaban,
        pembahasan: q.pembahasan,
        tingkatKesulitan: q.tingkatKesulitan,
        poinDefault: q.poinDefault,
      });
      continue;
    }

    // 2. Generator Konseptual Dinamis Berbasis Topik (Context-Aware Bloom Taxonomy)
    const points = diff === "Mudah" ? 10 : diff === "Sedang" ? 15 : 20;
    const generatedQuestion = buildDynamicCurriculumQuestion(mapel, tingkatKelas, topik, diff, i + 1);

    result.push({
      id: `gen-${timestamp}-${i + 1}`,
      kode: `BS-GEN-${(i + 1).toString().padStart(2, "0")}`,
      pertanyaan: generatedQuestion.pertanyaan,
      pilihan: generatedQuestion.pilihan,
      kunciJawaban: generatedQuestion.kunciJawaban,
      pembahasan: generatedQuestion.pembahasan,
      tingkatKesulitan: diff,
      poinDefault: points,
    });
  }

  return result;
}

// Pembantu pembuatan soal kontekstual dinamis
function buildDynamicCurriculumQuestion(
  mapel: string,
  tingkatKelas: string,
  topik: string,
  kesulitan: TingkatKesulitanSoal,
  index: number
): {
  pertanyaan: string;
  pilihan: string[];
  kunciJawaban: number;
  pembahasan: string;
} {
  const cleanTopic = topik.trim() || "Materi Pelajaran";

  if (kesulitan === "Mudah") {
    return {
      pertanyaan: `Dalam pembelajaran ${mapel} materi "${cleanTopic}", prinsip fundamental atau definisi dasar yang paling tepat menjelaskan konsep tersebut adalah...`,
      pilihan: [
        `Konsep utama yang mengkaji karakteristik sistematis, hukum dasar, dan sifat esensial dari fenomena "${cleanTopic}".`,
        `Sekumpulan hipotesis alternatif yang belum teruji secara ilmiah pada bidang ${mapel}.`,
        `Pendekatan pragmatis yang hanya mengabaikan variabel dasar materi ${cleanTopic}.`,
        `Proses manipulasi data tanpa mengacu pada teori baku ${cleanTopic}.`,
        `Asumsi terbalik yang menolak relasi sebab-akibat dalam kajian ${cleanTopic}.`
      ],
      kunciJawaban: 0,
      pembahasan: `Pada tingkat pemahaman dasar materi "${cleanTopic}", penguasaan definisi esensial dan karakteristik konseptual menjadi fondasi utama sebelum melangkah ke analisis terapan yang lebih kompleks.`,
    };
  }

  if (kesulitan === "Sedang") {
    return {
      pertanyaan: `Perhatikan aplikasi konsep "${cleanTopic}" dalam suatu studi kasus atau fenomena nyata. Jika terjadi peningkatan parameter atau perubahan variabel pada sistem tersebut, dampak analisis yang paling logis menurut kaidah ${mapel} adalah...`,
      pilihan: [
        `Sistem mengalami penyesuaian seimbang yang memperkuat keterkaitan antar-komponen sesuai hukum baku "${cleanTopic}".`,
        `Nilai efektivitas sistem akan langsung menurun drastis menjadi nol tanpa dipengaruhi variabel luar.`,
        `Semua indikator pengukuran kehilangan validitas secara permanen.`,
        `Konsep "${cleanTopic}" tidak lagi dapat diterapkan pada sistem terbuka tersebut.`,
        `Terjadi pembatalan seluruh hukum konservasi atau kaidah tata bahasa yang berlaku.`
      ],
      kunciJawaban: 0,
      pembahasan: `Berdasarkan prinsip kerja dan hukum yang melandasi "${cleanTopic}", perubahan besaran variabel akan direspons oleh sistem melalui mekanisme proporsional guna menjaga konsistensi hukum ilmiah yang relevan.`,
    };
  }

  // Sukar / HOTS
  return {
    pertanyaan: `[Soal Analisis HOTS] Seorang peneliti/analis menguji sebuah model lanjutan dari "${cleanTopic}" pada kondisi batas. Berdasarkan integrasi prinsip ${mapel} kelas ${tingkatKelas}, simpulan evaluatif manakah yang paling akurat dan bernilai ilmiah tinggi?`,
    pilihan: [
      `Kesesuaian parameter empiris membuktikan bahwa integrasi teori "${cleanTopic}" konsisten dalam memprediksi arah dinamika sistem secara terukur.`,
      `Variabel pengganggu sepenuhnya meniadakan relevansi teoritis dari "${cleanTopic}" pada semua skala pengamatan.`,
      `Model tersebut hanya berlaku secara acak tanpa adanya relasi kausalitas antar-faktor penentu.`,
      `Seluruh pembuktian matematis/konseptual terdahulu harus digugurkan karena bertentangan dengan asumsi lokal.`,
      `Tidak terdapat korelasi sama sekali antara rumusan teori dasar dengan hasil pengamatan lanjutan.`
    ],
    kunciJawaban: 0,
    pembahasan: `Soal analisis HOTS pada materi "${cleanTopic}" menguji kemampuan evaluasi kritis dalam memvalidasi hipotesis dan menghubungkan bukti empiris dengan kerangka teoretis yang baku di kelas ${tingkatKelas}.`,
  };
}
