"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  Siswa,
  Guru,
  Kelas,
  MataPelajaran,
  JadwalPelajaran,
  PresensiRecord,
  NilaiSiswa,
  TagihanSPP,
  TagihanSiswa,
  KategoriTagihan,
  MetodePembayaranTagihan,
  Pengumuman,
  SchoolProfile,
  StatusKehadiran,
  TabunganSiswa,
  TransaksiTabungan,
  JenisTagihan,
  BulanSPP,
  PesertaTransportasi,
  RecordSPPTransportTahunAjaran,
  TransaksiSPPTransport,
  LMSMateri,
  LMSTugas,
  LMSSubmission,
  StatusSubmission,
  LMSKuis,
  LMSKuisAttempt,
  LMSForumDiskusi,
  LMSKomentarForum,
  LMSVirtualMeeting,
  LMSBankSoal,
  LMSBankSoalItem,
  LMSJadwalMateri,
  TahfidzRecord,
  MutabaahRecord,
  User,
} from "@/types/school";
import { SupabaseSchoolService, SupabaseHealthStatus } from "@/lib/supabase/services/schoolService";
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_SISWA,
  INITIAL_GURU,
  INITIAL_KELAS,
  INITIAL_MAPEL,
  INITIAL_JADWAL,
  INITIAL_PRESENSI,
  INITIAL_NILAI,
  INITIAL_SPP,
  INITIAL_JENIS_TAGIHAN,
  INITIAL_PENGUMUMAN,
  INITIAL_TABUNGAN,
  INITIAL_TRANSAKSI_TABUNGAN,
  INITIAL_PESERTA_TRANSPORT,
  INITIAL_SPP_TRANSPORT_RECORDS,
  INITIAL_TRANSAKSI_SPP_TRANSPORT,
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
  generateStudentYearRecord,
} from "@/lib/mock-data";

export interface DatabaseBackupSummary {
  siswaCount: number;
  guruCount: number;
  kelasCount: number;
  mapelCount: number;
  jadwalCount: number;
  presensiCount: number;
  nilaiCount: number;
  jenisTagihanCount: number;
  sppCount: number;
  tabunganCount: number;
  transaksiTabunganCount: number;
  pesertaTransportCount: number;
  sppTransportCount: number;
  pengumumanCount: number;
  lmsMateriCount: number;
  lmsTugasCount: number;
  lmsKuisCount: number;
  lmsBankSoalCount: number;
  tahfidzCount: number;
  mutabaahCount: number;
  userCount: number;
}

export interface DatabaseBackupFile {
  version: "1.0";
  system: string;
  appName: string;
  schoolName: string;
  npsn?: string;
  exportedAt: string;
  exportedBy?: string;
  summary: DatabaseBackupSummary;
  data: {
    profile: SchoolProfile;
    siswa: Siswa[];
    guru: Guru[];
    kelas: Kelas[];
    mapel: MataPelajaran[];
    jadwal: JadwalPelajaran[];
    presensi: PresensiRecord[];
    nilai: NilaiSiswa[];
    jenisTagihan: JenisTagihan[];
    spp: TagihanSPP[];
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
    tahfidz: TahfidzRecord[];
    mutabaah: MutabaahRecord[];
    users?: User[];
  };
}

interface SchoolDataContextType {
  profile: SchoolProfile;
  updateProfile: (profile: SchoolProfile) => Promise<boolean> | void;
  siswaList: Siswa[];
  addSiswa: (siswa: Omit<Siswa, "id">) => void;
  importSiswaList: (siswaList: Omit<Siswa, "id">[]) => void;
  updateSiswa: (id: string, siswa: Partial<Siswa>) => void;
  deleteSiswa: (id: string) => void;
  bulkDeleteSiswa: (ids: string[]) => void;
  guruList: Guru[];
  addGuru: (guru: Omit<Guru, "id">) => void;
  updateGuru: (id: string, guru: Partial<Guru>) => void;
  deleteGuru: (id: string) => void;
  kelasList: Kelas[];
  addKelas: (kelas: Omit<Kelas, "id" | "jumlahSiswa">) => void;
  updateKelas: (id: string, kelas: Partial<Kelas>) => void;
  deleteKelas: (id: string, targetKelasForStudents?: string) => void;
  mapelList: MataPelajaran[];
  addMapel: (mapel: Omit<MataPelajaran, "id">) => void;
  updateMapel: (id: string, mapel: Partial<MataPelajaran>) => void;
  deleteMapel: (id: string) => void;
  jadwalList: JadwalPelajaran[];
  addJadwal: (jadwal: Omit<JadwalPelajaran, "id">) => void;
  bulkAddJadwal: (items: Omit<JadwalPelajaran, "id">[]) => void;
  updateJadwal: (id: string, jadwal: Partial<JadwalPelajaran>) => void;
  deleteJadwal: (id: string) => void;
  bulkDeleteJadwal: (ids: string[]) => void;
  resetJadwalToDefault: () => void;
  presensiList: PresensiRecord[];
  updatePresensi: (siswaId: string, status: StatusKehadiran, keterangan?: string, tanggal?: string) => void;
  nilaiList: NilaiSiswa[];
  saveNilai: (nilai: Omit<NilaiSiswa, "id"> & { id?: string }) => void;
  bulkSaveNilai: (items: (Omit<NilaiSiswa, "id"> & { id?: string })[]) => void;
  deleteNilai: (id: string) => void;
  deleteNilaiBySiswa: (siswaId: string) => void;
  sppList: TagihanSPP[];
  jenisTagihanList: JenisTagihan[];
  addJenisTagihan: (data: Omit<JenisTagihan, "id">) => void;
  updateJenisTagihan: (id: string, data: Partial<JenisTagihan>) => void;
  deleteJenisTagihan: (id: string, fallbackNama?: string) => void;
  addTagihan: (data: Omit<TagihanSiswa, "id">) => void;
  bulkAddTagihan: (
    kelas: string,
    judul: string,
    kategori: KategoriTagihan,
    nominal: number,
    jatuhTempo: string,
    keterangan?: string
  ) => void;
  bayarSPP: (id: string, metode: MetodePembayaranTagihan) => void;
  bayarTagihanDariTabungan: (
    tagihanId: string,
    petugas?: string
  ) => { success: boolean; message?: string };
  bulkBayarTagihanDariTabungan: (
    kelas?: string
  ) => { successCount: number; failCount: number };
  pengumumanList: Pengumuman[];
  addPengumuman: (pengumuman: Omit<Pengumuman, "id" | "tanggal">) => void;
  deletePengumuman: (id: string) => void;
  tabunganList: TabunganSiswa[];
  transaksiTabunganList: TransaksiTabungan[];
  setorTabungan: (siswaId: string, nominal: number, keterangan?: string, petugas?: string, tanggal?: string) => void;
  tarikTabungan: (siswaId: string, nominal: number, keterangan?: string, petugas?: string, tanggal?: string) => { success: boolean; message?: string };
  bulkSetorTabungan: (items: { siswaId: string; nominal: number; keterangan?: string }[], petugas?: string, tanggal?: string) => void;
  clearAllTabungan: () => Promise<void>;
  pesertaTransportList: PesertaTransportasi[];
  sppTransportRecords: RecordSPPTransportTahunAjaran[];
  transaksiSPPTransportList: TransaksiSPPTransport[];
  updatePesertaTransport: (siswaId: string, isAktif: boolean, biayaBulanan?: number, rute?: string) => void;
  bayarSPPTransport: (params: {
    siswaId: string;
    tahunAjaran: string;
    jenis: "SPP" | "Transportasi" | "Paket Keduanya";
    bulan: BulanSPP[];
    metodePembayaran: MetodePembayaranTagihan;
    tanggalBayar?: string;
    petugas?: string;
    keterangan?: string;
  }) => { success: boolean; message?: string; noKuitansi?: string };
  bulkBayarSPPTransportDariTabungan: (params: {
    kelas?: string;
    tahunAjaran: string;
    bulan: BulanSPP;
    jenis: "SPP" | "Transportasi" | "Paket Keduanya";
    petugas?: string;
  }) => {
    successCount: number;
    skippedCount: number;
    insufficientCount: number;
    totalAmount: number;
    insufficientNames: string[];
  };
  getStudentSPPTransportRecord: (siswaId: string, tahunAjaran: string) => RecordSPPTransportTahunAjaran;

  // LMS Methods & States
  lmsMateriList: LMSMateri[];
  addMateri: (materi: Omit<LMSMateri, "id" | "createdAt" | "sudahDibacaSiswaIds">) => LMSMateri;
  updateMateri: (id: string, materi: Partial<LMSMateri>) => void;
  deleteMateri: (id: string) => void;
  toggleBacaMateri: (materiId: string, siswaId: string) => void;

  lmsTugasList: LMSTugas[];
  addTugas: (tugas: Omit<LMSTugas, "id" | "createdAt">) => LMSTugas;
  updateTugas: (id: string, tugas: Partial<LMSTugas>) => void;
  deleteTugas: (id: string) => void;

  lmsSubmissionList: LMSSubmission[];
  submitTugas: (data: {
    tugasId: string;
    siswaId: string;
    siswaNama: string;
    siswaNisn: string;
    kelas: string;
    catatanSiswa: string;
    fileJawabanUrl?: string;
  }) => LMSSubmission;
  nilaiSubmission: (submissionId: string, nilai: number, feedback?: string) => void;

  lmsKuisList: LMSKuis[];
  addKuis: (kuis: Omit<LMSKuis, "id" | "createdAt">) => LMSKuis;
  deleteKuis: (id: string) => void;

  lmsKuisAttemptList: LMSKuisAttempt[];
  submitKuisAttempt: (attempt: Omit<LMSKuisAttempt, "id" | "selesaiPada">) => LMSKuisAttempt;

  lmsForumList: LMSForumDiskusi[];
  addForumTopik: (topik: Omit<LMSForumDiskusi, "id" | "tanggal" | "komentarList">) => LMSForumDiskusi;
  addKomentarForum: (topikId: string, komentar: Omit<LMSKomentarForum, "id" | "tanggal">) => void;

  lmsMeetingList: LMSVirtualMeeting[];
  addMeeting: (meeting: Omit<LMSVirtualMeeting, "id">) => LMSVirtualMeeting;
  deleteMeeting: (id: string) => void;

  // LMS Bank Soal
  lmsBankSoalList: LMSBankSoal[];
  addBankSoal: (bank: Omit<LMSBankSoal, "id" | "createdAt">) => LMSBankSoal;
  updateBankSoal: (id: string, bank: Partial<LMSBankSoal>) => void;
  deleteBankSoal: (id: string) => void;
  addSoalToBank: (bankId: string, soal: Omit<LMSBankSoalItem, "id">) => void;
  updateSoalInBank: (bankId: string, soalId: string, soal: Partial<LMSBankSoalItem>) => void;
  deleteSoalFromBank: (bankId: string, soalId: string) => void;
  generateKuisFromBankSoal: (params: {
    judul: string;
    mapel: string;
    kelas: string;
    durasiMenit: number;
    kkm: number;
    deadline: string;
    deskripsi: string;
    soalItems: LMSBankSoalItem[];
    guruNama: string;
  }) => LMSKuis;

  lmsJadwalMateriList: LMSJadwalMateri[];
  addJadwalMateri: (data: Omit<LMSJadwalMateri, "id">) => LMSJadwalMateri;
  updateJadwalMateri: (id: string, data: Partial<LMSJadwalMateri>) => void;
  deleteJadwalMateri: (id: string) => void;
  toggleRealisasiJadwal: (
    id: string,
    payload?: {
      sudahDiajarkan?: boolean;
      catatanPembelajaran?: string;
      tanggalRealisasi?: string;
      jamRealisasi?: string;
      guruPengajar?: string;
    }
  ) => void;

  // Islamic School Flagship Features
  tahfidzList: TahfidzRecord[];
  addTahfidzRecord: (record: Omit<TahfidzRecord, "id" | "createdAt">) => void;
  updateTahfidzRecord: (id: string, data: Partial<TahfidzRecord>) => void;
  deleteTahfidzRecord: (id: string) => void;

  mutabaahList: MutabaahRecord[];
  addOrUpdateMutabaahRecord: (record: Omit<MutabaahRecord, "id" | "createdAt">) => void;
  batchAddOrUpdateMutabaahRecords: (records: Array<Omit<MutabaahRecord, "id" | "createdAt">>) => void;
  verifyMutabaahRecord: (
    id: string,
    guruNama: string,
    catatan?: string,
    status?: "Terverifikasi Guru" | "Diberi Bintang Kebaikan"
  ) => void;
  deleteMutabaahRecord: (id: string) => void;

  resetToDefault: () => void;

  // Supabase Cloud State & Sync
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  supabaseError: string | null;
  syncWithSupabase: () => Promise<void>;
  seedDatabaseToCloud: (options?: { silent?: boolean }) => Promise<boolean>;
  testSupabaseHealth: () => Promise<SupabaseHealthStatus>;

  // Automatic Push Database Engine
  isAutoPushEnabled: boolean;
  toggleAutoPush: (enabled?: boolean) => void;
  isAutoPushing: boolean;
  lastAutoPushTime: Date | null;
  autoPushStatus: "idle" | "pushing" | "success" | "error";
  forceAutoPushNow: () => Promise<boolean>;

  // Backup & Restore Database
  exportDatabaseBackup: (options?: { exportedBy?: string }) => { success: boolean; filename: string; summary: DatabaseBackupSummary };
  importDatabaseBackup: (
    rawBackup: DatabaseBackupFile | any,
    options?: { syncToCloud?: boolean }
  ) => Promise<{ success: boolean; message: string; counts?: Record<string, number> }>;
  clearAllDatabase: (options?: { syncToCloud?: boolean }) => Promise<void>;
}



// Tombstone tracker to ensure deleted items (kelas, siswa, guru, mapel, jadwal, nilai, dll)
// are permanently deleted across refreshes and never resurrected by defaults or cloud sync
export const getDeletedIds = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("sim_deleted_ids");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};

export const recordDeletedId = (id: string | string[]) => {
  if (typeof window === "undefined") return;
  try {
    const ids = Array.isArray(id) ? id : [id];
    const current = getDeletedIds();
    ids.forEach((i) => {
      if (i && typeof i === "string") current.add(i.trim());
    });
    localStorage.setItem("sim_deleted_ids", JSON.stringify(Array.from(current)));
  } catch {}
};

export const removeDeletedId = (id: string | string[]) => {
  if (typeof window === "undefined") return;
  try {
    const ids = Array.isArray(id) ? id : [id];
    const current = getDeletedIds();
    ids.forEach((i) => {
      if (i && typeof i === "string") current.delete(i.trim());
    });
    localStorage.setItem("sim_deleted_ids", JSON.stringify(Array.from(current)));
  } catch {}
};

const SchoolDataContext = createContext<SchoolDataContextType | undefined>(undefined);

export function SchoolDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<SchoolProfile>(() => {
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem("sim_data_profile");
        if (item) return JSON.parse(item);
      } catch (e) {
        console.warn("Failed to load profile from localStorage", e);
      }
    }
    return INITIAL_SCHOOL_PROFILE;
  });
  const [siswaList, setSiswaList] = useState<Siswa[]>(INITIAL_SISWA);
  const [guruList, setGuruList] = useState<Guru[]>(INITIAL_GURU);
  const [kelasList, setKelasList] = useState<Kelas[]>(INITIAL_KELAS);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>(INITIAL_MAPEL);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>(INITIAL_JADWAL);
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>(INITIAL_PRESENSI);
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>(INITIAL_NILAI);
  const [sppList, setSppList] = useState<TagihanSPP[]>(INITIAL_SPP);
  const [jenisTagihanList, setJenisTagihanList] = useState<JenisTagihan[]>(INITIAL_JENIS_TAGIHAN);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>(INITIAL_PENGUMUMAN);
  const [tabunganList, setTabunganList] = useState<TabunganSiswa[]>(INITIAL_TABUNGAN);
  const [transaksiTabunganList, setTransaksiTabunganList] = useState<TransaksiTabungan[]>(INITIAL_TRANSAKSI_TABUNGAN);
  const [pesertaTransportList, setPesertaTransportList] = useState<PesertaTransportasi[]>(INITIAL_PESERTA_TRANSPORT);
  const [sppTransportRecords, setSppTransportRecords] = useState<RecordSPPTransportTahunAjaran[]>(INITIAL_SPP_TRANSPORT_RECORDS);
  const [transaksiSPPTransportList, setTransaksiSPPTransportList] = useState<TransaksiSPPTransport[]>(INITIAL_TRANSAKSI_SPP_TRANSPORT);

  // LMS States
  const [lmsMateriList, setLmsMateriList] = useState<LMSMateri[]>(INITIAL_LMS_MATERI);
  const [lmsTugasList, setLmsTugasList] = useState<LMSTugas[]>(INITIAL_LMS_TUGAS);
  const [lmsSubmissionList, setLmsSubmissionList] = useState<LMSSubmission[]>(INITIAL_LMS_SUBMISSIONS);
  const [lmsKuisList, setLmsKuisList] = useState<LMSKuis[]>(INITIAL_LMS_KUIS);
  const [lmsKuisAttemptList, setLmsKuisAttemptList] = useState<LMSKuisAttempt[]>(INITIAL_LMS_ATTEMPTS);
  const [lmsForumList, setLmsForumList] = useState<LMSForumDiskusi[]>(INITIAL_LMS_FORUM);
  const [lmsMeetingList, setLmsMeetingList] = useState<LMSVirtualMeeting[]>(INITIAL_LMS_MEETINGS);
  const [lmsBankSoalList, setLmsBankSoalList] = useState<LMSBankSoal[]>(INITIAL_LMS_BANK_SOAL);
  const [lmsJadwalMateriList, setLmsJadwalMateriList] = useState<LMSJadwalMateri[]>(INITIAL_LMS_JADWAL_MATERI);

  // Islamic School Flagship States
  const [tahfidzList, setTahfidzList] = useState<TahfidzRecord[]>(INITIAL_TAHFIDZ_RECORDS);
  const [mutabaahList, setMutabaahList] = useState<MutabaahRecord[]>(INITIAL_MUTABAAH_RECORDS);

  // Supabase Cloud Integration States
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Automatic Push Database States (Default AKTIF jika Supabase terkonfigurasi)
  const [isAutoPushEnabled, setIsAutoPushEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sim_auto_push_db_enabled");
      if (saved !== null) return saved === "true";
      return SupabaseSchoolService.isConfigured();
    }
    return false;
  });
  const [isAutoPushing, setIsAutoPushing] = useState<boolean>(false);
  const [lastAutoPushTime, setLastAutoPushTime] = useState<Date | null>(null);
  const [autoPushStatus, setAutoPushStatus] = useState<"idle" | "pushing" | "success" | "error">("idle");
  const autoPushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reference holding the latest live in-memory state to avoid stale React closures in timers/intervals
  const latestDataRef = useRef({
    profile,
    siswaList,
    guruList,
    kelasList,
    mapelList,
    jadwalList,
    presensiList,
    nilaiList,
    jenisTagihanList,
    sppList,
    tabunganList,
    transaksiTabunganList,
    pesertaTransportList,
    sppTransportRecords,
    transaksiSPPTransportList,
    pengumumanList,
    lmsMateriList,
    lmsTugasList,
    lmsSubmissionList,
    lmsKuisList,
    lmsKuisAttemptList,
    lmsForumList,
    lmsMeetingList,
    lmsBankSoalList,
    lmsJadwalMateriList,
    tahfidzList,
    mutabaahList,
  });

  // Keep latestDataRef fresh on every render cycle
  latestDataRef.current = {
    profile,
    siswaList,
    guruList,
    kelasList,
    mapelList,
    jadwalList,
    presensiList,
    nilaiList,
    jenisTagihanList,
    sppList,
    tabunganList,
    transaksiTabunganList,
    pesertaTransportList,
    sppTransportRecords,
    transaksiSPPTransportList,
    pengumumanList,
    lmsMateriList,
    lmsTugasList,
    lmsSubmissionList,
    lmsKuisList,
    lmsKuisAttemptList,
    lmsForumList,
    lmsMeetingList,
    lmsBankSoalList,
    lmsJadwalMateriList,
    tahfidzList,
    mutabaahList,
  };

  // Load from LocalStorage on client mount
  useEffect(() => {
    try {
      const load = <T,>(key: string, fallback: T): T => {
        const item = localStorage.getItem(`sim_data_${key}`);
        if (item === null) return fallback;
        try {
          return JSON.parse(item);
        } catch {
          return fallback;
        }
      };

      const isCleared = typeof window !== "undefined" && localStorage.getItem("sim_database_cleared") === "true";
      if (isCleared) {
        setProfile(load("profile", INITIAL_SCHOOL_PROFILE));
        setSiswaList(load("siswa", []));
        setGuruList(load("guru", []));
        setKelasList(load("kelas", []));
        setMapelList(load("mapel", []));
        setJadwalList(load("jadwal", []));
        setPresensiList(load("presensi", []));
        setNilaiList(load("nilai", []));
        setJenisTagihanList(load("jenis_tagihan", []));
        setSppList(load("spp", []));
        setTabunganList(load("tabungan", []));
        setTransaksiTabunganList(load("transaksi_tabungan", []));
        setPesertaTransportList(load("peserta_transport", []));
        setSppTransportRecords(load("spp_transport_records", []));
        setTransaksiSPPTransportList(load("transaksi_spp_transport", []));
        setPengumumanList(load("pengumuman", []));
        setLmsMateriList(load("lms_materi", []));
        setLmsTugasList(load("lms_tugas", []));
        setLmsSubmissionList(load("lms_submissions", []));
        setLmsKuisList(load("lms_kuis", []));
        setLmsKuisAttemptList(load("lms_attempts", []));
        setLmsForumList(load("lms_forum", []));
        setLmsMeetingList(load("lms_meetings", []));
        setLmsBankSoalList(load("lms_bank_soal", []));
        setLmsJadwalMateriList(load("lms_jadwal_materi", []));
        setTahfidzList(load("tahfidz", []));
        setMutabaahList(load("mutabaah", []));
        latestDataRef.current = {
          profile: load("profile", INITIAL_SCHOOL_PROFILE),
          siswaList: load("siswa", []),
          guruList: load("guru", []),
          kelasList: load("kelas", []),
          mapelList: load("mapel", []),
          jadwalList: load("jadwal", []),
          presensiList: load("presensi", []),
          nilaiList: load("nilai", []),
          jenisTagihanList: load("jenis_tagihan", []),
          sppList: load("spp", []),
          tabunganList: load("tabungan", []),
          transaksiTabunganList: load("transaksi_tabungan", []),
          pesertaTransportList: load("peserta_transport", []),
          sppTransportRecords: load("spp_transport_records", []),
          transaksiSPPTransportList: load("transaksi_spp_transport", []),
          pengumumanList: load("pengumuman", []),
          lmsMateriList: load("lms_materi", []),
          lmsTugasList: load("lms_tugas", []),
          lmsSubmissionList: load("lms_submissions", []),
          lmsKuisList: load("lms_kuis", []),
          lmsKuisAttemptList: load("lms_attempts", []),
          lmsForumList: load("lms_forum", []),
          lmsMeetingList: load("lms_meetings", []),
          lmsBankSoalList: load("lms_bank_soal", []),
          lmsJadwalMateriList: load("lms_jadwal_materi", []),
          tahfidzList: load("tahfidz", []),
          mutabaahList: load("mutabaah", []),
        };
      } else {
        const deletedIds = getDeletedIds();

        // 1. Profile
        const loadedProfile = load("profile", INITIAL_SCHOOL_PROFILE);
        setProfile(loadedProfile);

        // 2. Siswa
        const rawSiswa = localStorage.getItem("sim_data_siswa");
        let baseSiswaList: Siswa[] = rawSiswa !== null ? (JSON.parse(rawSiswa) || []) : INITIAL_SISWA;
        baseSiswaList = baseSiswaList.filter((s) => !deletedIds.has(s.id));
        const waliCleanMigrationKey = "sim_data_siswa_wali_cleared_v1";
        const hasMigratedWali = typeof window !== "undefined" && localStorage.getItem(waliCleanMigrationKey) === "true";
        const dummyWalies = new Set([
          "Wali Murid",
          "Ir. Bambang Sudirman",
          "Drs. Hendra Setiawan",
          "Agus Santoso",
          "Sri Wahyuni",
          "Suparman",
          "Rachmat Hidayat",
          "Erwin Ardiansyah",
          "Mulyadi",
        ]);
        const sanitizedSiswa = baseSiswaList.map((s: any) => {
          if (!hasMigratedWali && (dummyWalies.has(s.namaWali) || (s.id?.startsWith("sis-00") && dummyWalies.has(s.namaWali)))) {
            return {
              ...s,
              namaWali: "",
              noHpWali: "",
            };
          }
          if (s.namaWali === "Wali Murid") {
            return {
              ...s,
              namaWali: "",
              noHpWali: s.noHpWali === "0812-0000-0000" ? "" : s.noHpWali,
            };
          }
          return s;
        });
        if (typeof window !== "undefined" && !hasMigratedWali) {
          localStorage.setItem(waliCleanMigrationKey, "true");
          localStorage.setItem("sim_data_siswa", JSON.stringify(sanitizedSiswa));
        }
        setSiswaList(sanitizedSiswa);

        // 3. Guru
        const rawGuru = localStorage.getItem("sim_data_guru");
        let baseGuruList: Guru[] = rawGuru !== null ? (JSON.parse(rawGuru) || []) : INITIAL_GURU;
        baseGuruList = baseGuruList.filter((g) => !deletedIds.has(g.id));
        const sanitizedGuru = baseGuruList.map((g: any) => ({
          ...g,
          id: g.id || `gur-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          nama: g.nama || "Tenaga Pendidik",
          nip: g.nip || "198001012005011001",
          gelar: g.gelar || "",
          jenisKelamin: g.jenisKelamin === "P" ? "P" : "L",
          mataPelajaran: Array.isArray(g.mataPelajaran)
            ? g.mataPelajaran
            : typeof g.mataPelajaran === "string" && g.mataPelajaran.trim()
            ? g.mataPelajaran.split(",").map((s: string) => s.trim())
            : ["Umum"],
          kelasWali: g.kelasWali || "",
          pendidikanTerakhir: g.pendidikanTerakhir || "S1 Pendidikan",
          statusKepegawaian: g.statusKepegawaian || "PNS",
          email: g.email || `${(g.nama || "guru").toLowerCase().replace(/[^a-z0-9]/g, "")}@sekolah.id`,
          noHp: g.noHp || "0812-3456-7890",
          avatar: g.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(g.nama || "Guru")}`,
        }));
        setGuruList(sanitizedGuru);

        // 4. Kelas (Otoritatif dari localStorage tanpa re-injeksi INITIAL_KELAS)
        const rawKelas = localStorage.getItem("sim_data_kelas");
        let baseKelasList: Kelas[] = rawKelas !== null ? (JSON.parse(rawKelas) || []) : INITIAL_KELAS;
        baseKelasList = baseKelasList.filter((k) => !deletedIds.has(k.id));
        setKelasList(baseKelasList);

        // 5. Mapel (Otoritatif dari localStorage tanpa re-injeksi INITIAL_MAPEL)
        const rawMapel = localStorage.getItem("sim_data_mapel");
        let baseMapelList: MataPelajaran[] = rawMapel !== null ? (JSON.parse(rawMapel) || []) : INITIAL_MAPEL;
        baseMapelList = baseMapelList.filter((m) => !deletedIds.has(m.id));
        setMapelList(baseMapelList);

        // 6. Jadwal (Otoritatif dari localStorage tanpa re-injeksi INITIAL_JADWAL)
        const rawJadwal = localStorage.getItem("sim_data_jadwal");
        let baseJadwalList: JadwalPelajaran[] = rawJadwal !== null ? (JSON.parse(rawJadwal) || []) : INITIAL_JADWAL;
        baseJadwalList = baseJadwalList.filter((j) => !deletedIds.has(j.id));
        baseJadwalList = baseJadwalList.map((j) => {
          if (j.id === "jdw-01" && j.mapel === "Upacara & PAI") {
            return { ...j, mapel: "Pendidikan Agama Islam" };
          }
          if (j.id === "jdw-08" && j.mapel === "Kajian Islam & Tahfidz") {
            return { ...j, mapel: "Pendidikan Lingkungan & Budaya (PLBJ)" };
          }
          return j;
        });
        setJadwalList(baseJadwalList);

        // 7. Presensi
        const rawPresensi = localStorage.getItem("sim_data_presensi");
        let basePresensiList: PresensiRecord[] = rawPresensi !== null ? (JSON.parse(rawPresensi) || []) : INITIAL_PRESENSI;
        basePresensiList = basePresensiList.filter((p) => !deletedIds.has(p.id));
        setPresensiList(basePresensiList);

        // 8. Nilai (Otoritatif dari localStorage tanpa re-injeksi INITIAL_NILAI)
        const rawNilai = localStorage.getItem("sim_data_nilai");
        let mergedNilai: NilaiSiswa[] = rawNilai !== null ? (JSON.parse(rawNilai) || []) : INITIAL_NILAI;
        mergedNilai = mergedNilai.filter((n) => !deletedIds.has(n.id));

        // Migration: Kosongkan nilai default SAS (Ganjil & Genap) pada browser pengguna
        const sasMigrationKey = "sim_data_nilai_sas_cleared_v1";
        if (typeof window !== "undefined" && localStorage.getItem(sasMigrationKey) !== "true") {
          mergedNilai = mergedNilai.map((n) => {
            if (n.id.startsWith("nil-") || !n.hasSas) {
              return {
                ...n,
                uas: 0,
                nilaiAkhir: 0,
                predikat: undefined,
                hasSas: false,
                hasSts: typeof n.nilaiMid === "number" || (typeof n.uts === "number" && n.uts > 0),
              };
            }
            return n;
          });
          localStorage.setItem(sasMigrationKey, "true");
          localStorage.setItem("sim_data_nilai", JSON.stringify(mergedNilai));
        }

        // Migration: Bersihkan rekaman nilai IPAS untuk Kelas 1 yang tidak ada dalam kurikulum/jadwal
        const ipasCleanMigrationKey = "sim_data_nilai_ipas_k1_cleared_v1";
        if (typeof window !== "undefined" && localStorage.getItem(ipasCleanMigrationKey) !== "true") {
          mergedNilai = mergedNilai.filter((n) => {
            const isK1 = n.kelas && (n.kelas.toLowerCase().includes("kelas 1") || n.kelas.trim() === "1");
            const isIpas = n.mapel && n.mapel.toLowerCase().includes("ilmu pengetahuan alam");
            return !(isK1 && isIpas);
          });
          localStorage.setItem(ipasCleanMigrationKey, "true");
          localStorage.setItem("sim_data_nilai", JSON.stringify(mergedNilai));
        }
        setNilaiList(mergedNilai);

        // 9. SPP & Jenis Tagihan
        const rawSpp = localStorage.getItem("sim_data_spp");
        const loadedSpp: TagihanSiswa[] = (rawSpp !== null ? (JSON.parse(rawSpp) || []) : INITIAL_SPP).filter((s: any) => !deletedIds.has(s.id));
        setSppList(loadedSpp);

        const rawJenisTagihan = localStorage.getItem("sim_data_jenis_tagihan");
        const loadedJenisTagihan: JenisTagihan[] = (rawJenisTagihan !== null ? (JSON.parse(rawJenisTagihan) || []) : INITIAL_JENIS_TAGIHAN).filter((j: any) => !deletedIds.has(j.id));
        setJenisTagihanList(loadedJenisTagihan);

        // 10. Pengumuman
        const rawPengumuman = localStorage.getItem("sim_data_pengumuman");
        const loadedPengumuman: Pengumuman[] = (rawPengumuman !== null ? (JSON.parse(rawPengumuman) || []) : INITIAL_PENGUMUMAN).filter((p: any) => !deletedIds.has(p.id));
        setPengumumanList(loadedPengumuman);

        // 11. Tabungan
        const savedTab = localStorage.getItem("sim_data_tabungan");
        let loadedTabungan: TabunganSiswa[] = [];
        let loadedTransaksiTabungan: TransaksiTabungan[] = [];
        if (savedTab && (savedTab.includes("tab-001") || savedTab.includes("Ahmad Rizky"))) {
          localStorage.setItem("sim_data_tabungan", JSON.stringify([]));
          localStorage.setItem("sim_data_transaksi_tabungan", JSON.stringify([]));
          loadedTabungan = [];
          loadedTransaksiTabungan = [];
        } else {
          loadedTabungan = load("tabungan", INITIAL_TABUNGAN);
          loadedTransaksiTabungan = load("transaksi_tabungan", INITIAL_TRANSAKSI_TABUNGAN);
        }
        setTabunganList(loadedTabungan);
        setTransaksiTabunganList(loadedTransaksiTabungan);

        // 12. Transport
        const loadedPesertaTransport = load("peserta_transport", INITIAL_PESERTA_TRANSPORT);
        const loadedSppTransportRecords = load("spp_transport_records", INITIAL_SPP_TRANSPORT_RECORDS);
        const loadedTransaksiSPPTransportList = load("transaksi_spp_transport", INITIAL_TRANSAKSI_SPP_TRANSPORT);
        setPesertaTransportList(loadedPesertaTransport);
        setSppTransportRecords(loadedSppTransportRecords);
        setTransaksiSPPTransportList(loadedTransaksiSPPTransportList);

        // 13. LMS Data (Otoritatif tanpa re-injeksi default yang telah dihapus)
        const rawMateri = localStorage.getItem("sim_data_lms_materi");
        const baseMateri: LMSMateri[] = (rawMateri !== null ? (JSON.parse(rawMateri) || []) : INITIAL_LMS_MATERI).filter((m: any) => !deletedIds.has(m.id));
        setLmsMateriList(baseMateri);

        const rawTugas = localStorage.getItem("sim_data_lms_tugas");
        const baseTugas: LMSTugas[] = (rawTugas !== null ? (JSON.parse(rawTugas) || []) : INITIAL_LMS_TUGAS).filter((t: any) => !deletedIds.has(t.id));
        setLmsTugasList(baseTugas);

        const loadedSubmissions: LMSSubmission[] = load("lms_submissions", INITIAL_LMS_SUBMISSIONS);
        setLmsSubmissionList(loadedSubmissions);

        const rawKuis = localStorage.getItem("sim_data_lms_kuis");
        const baseKuis: LMSKuis[] = (rawKuis !== null ? (JSON.parse(rawKuis) || []) : INITIAL_LMS_KUIS).filter((k: any) => !deletedIds.has(k.id));
        setLmsKuisList(baseKuis);

        const loadedAttempts: LMSKuisAttempt[] = load("lms_attempts", INITIAL_LMS_ATTEMPTS);
        setLmsKuisAttemptList(loadedAttempts);

        const loadedForum: LMSForumDiskusi[] = load("lms_forum", INITIAL_LMS_FORUM);
        setLmsForumList(loadedForum);

        const loadedMeetings: LMSVirtualMeeting[] = load("lms_meetings", INITIAL_LMS_MEETINGS);
        setLmsMeetingList(loadedMeetings);

        const rawBank = localStorage.getItem("sim_data_lms_bank_soal");
        let baseBank: LMSBankSoal[] = [];
        if (rawBank !== null) {
          try {
            baseBank = JSON.parse(rawBank);
          } catch {
            baseBank = INITIAL_LMS_BANK_SOAL;
          }
        } else {
          baseBank = INITIAL_LMS_BANK_SOAL;
        }
        baseBank = baseBank.filter((b: any) => !deletedIds.has(b.id));
        setLmsBankSoalList(baseBank);

        const rawJadwalMateri = localStorage.getItem("sim_data_lms_jadwal_materi");
        const baseJadwalMateri: LMSJadwalMateri[] = (rawJadwalMateri !== null ? (JSON.parse(rawJadwalMateri) || []) : INITIAL_LMS_JADWAL_MATERI).filter((j: any) => !deletedIds.has(j.id));
        setLmsJadwalMateriList(baseJadwalMateri);

        // 14. Islamic School Flagship (Tahfidz & Mutaba'ah)
        const rawTahfidz = localStorage.getItem("sim_data_tahfidz");
        const baseTahfidz: TahfidzRecord[] = (rawTahfidz !== null ? (JSON.parse(rawTahfidz) || []) : INITIAL_TAHFIDZ_RECORDS).filter((t: any) => !deletedIds.has(t.id));
        setTahfidzList(baseTahfidz);

        const rawMutabaah = localStorage.getItem("sim_data_mutabaah");
        const baseMutabaah: MutabaahRecord[] = (rawMutabaah !== null ? (JSON.parse(rawMutabaah) || []) : INITIAL_MUTABAAH_RECORDS).filter((m: any) => !deletedIds.has(m.id));
        setMutabaahList(baseMutabaah);

        // Populate latestDataRef immediately for thread safety and sync alignment
        latestDataRef.current = {
          profile: loadedProfile,
          siswaList: sanitizedSiswa,
          guruList: sanitizedGuru,
          kelasList: baseKelasList,
          mapelList: baseMapelList,
          jadwalList: baseJadwalList,
          presensiList: basePresensiList,
          nilaiList: mergedNilai,
          jenisTagihanList: loadedJenisTagihan,
          sppList: loadedSpp,
          tabunganList: loadedTabungan,
          transaksiTabunganList: loadedTransaksiTabungan,
          pesertaTransportList: loadedPesertaTransport,
          sppTransportRecords: loadedSppTransportRecords,
          transaksiSPPTransportList: loadedTransaksiSPPTransportList,
          pengumumanList: loadedPengumuman,
          lmsMateriList: baseMateri,
          lmsTugasList: baseTugas,
          lmsSubmissionList: loadedSubmissions,
          lmsKuisList: baseKuis,
          lmsKuisAttemptList: loadedAttempts,
          lmsForumList: loadedForum,
          lmsMeetingList: loadedMeetings,
          lmsBankSoalList: baseBank,
          lmsJadwalMateriList: baseJadwalMateri,
          tahfidzList: baseTahfidz,
          mutabaahList: baseMutabaah,
        };
      }

      // Automatic Push ke Supabase Cloud: aktif secara default jika Supabase terkonfigurasi
      const savedAutoPush = typeof window !== "undefined" ? localStorage.getItem("sim_auto_push_db_enabled") : null;
      if (savedAutoPush !== null) {
        setIsAutoPushEnabled(savedAutoPush === "true");
      } else {
        const isConfigured = SupabaseSchoolService.isConfigured();
        setIsAutoPushEnabled(isConfigured);
        if (typeof window !== "undefined" && isConfigured) {
          localStorage.setItem("sim_auto_push_db_enabled", "true");
        }
      }
    } catch (e) {
      console.warn("Could not read from local storage", e);
    }

    // Connect to Supabase Cloud on initial mount
    if (SupabaseSchoolService.isConfigured()) {
      syncWithSupabase();
    }
  }, []);

  // Automatic Push Engine & Helpers
  const triggerAutoPush = (reason: string = "mutation") => {
    if (!isAutoPushEnabled || !SupabaseSchoolService.isConfigured()) return;
    if (autoPushTimerRef.current) clearTimeout(autoPushTimerRef.current);
    autoPushTimerRef.current = setTimeout(async () => {
      setIsAutoPushing(true);
      setAutoPushStatus("pushing");
      try {
        const ok = await seedDatabaseToCloud({ silent: true });
        setIsAutoPushing(false);
        if (ok) {
          setLastAutoPushTime(new Date());
          setAutoPushStatus("success");
        } else {
          setAutoPushStatus("error");
        }
      } catch (err) {
        console.warn("[AutoPush Database] Error during auto-push:", err);
        setIsAutoPushing(false);
        setAutoPushStatus("error");
      }
    }, 1500);
  };

  const forceAutoPushNow = async (): Promise<boolean> => {
    setIsAutoPushing(true);
    setAutoPushStatus("pushing");
    try {
      const ok = await seedDatabaseToCloud({ silent: true });
      setIsAutoPushing(false);
      if (ok) {
        setLastAutoPushTime(new Date());
        setAutoPushStatus("success");
      } else {
        setAutoPushStatus("error");
      }
      return ok;
    } catch (err) {
      console.error("[AutoPush Database] Force auto-push failed:", err);
      setIsAutoPushing(false);
      setAutoPushStatus("error");
      return false;
    }
  };

  const toggleAutoPush = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !isAutoPushEnabled;
    setIsAutoPushEnabled(nextVal);
    saveState("auto_push_db_enabled", nextVal, true);
    if (nextVal) {
      triggerAutoPush("manual-enable");
    }
  };

  // 60-second periodic background push fallback when auto-push is enabled
  useEffect(() => {
    if (!isAutoPushEnabled || !SupabaseSchoolService.isConfigured()) return;
    const interval = setInterval(() => {
      triggerAutoPush("periodic-interval");
    }, 60000);
    return () => clearInterval(interval);
  }, [isAutoPushEnabled]);

  // Helper for background Supabase persistence without blocking UI
  const persistSupabase = (action: () => Promise<boolean | any>) => {
    if (SupabaseSchoolService.isConfigured()) {
      action().catch((err) => {
        console.warn("[Supabase] Background persistence warning:", err);
      });
    }
  };

  // Health check
  const testSupabaseHealth = async (): Promise<SupabaseHealthStatus> => {
    return await SupabaseSchoolService.testConnection();
  };

  // Seed current in-memory data to Supabase
  const seedDatabaseToCloud = async (options?: { silent?: boolean }): Promise<boolean> => {
    if (!SupabaseSchoolService.isConfigured()) {
      setSupabaseError("Supabase belum dikonfigurasi di .env.local");
      return false;
    }
    const silent = options?.silent ?? false;
    if (!silent) setIsSyncing(true);
    try {
      const current = latestDataRef.current;
      const deletedIds = Array.from(getDeletedIds());
      const res = await SupabaseSchoolService.seedInitialDataToSupabase({
        profile: current.profile || INITIAL_SCHOOL_PROFILE,
        siswa: current.siswaList || [],
        guru: current.guruList || [],
        kelas: current.kelasList || [],
        mapel: current.mapelList || [],
        jadwal: current.jadwalList || [],
        presensi: current.presensiList || [],
        nilai: current.nilaiList || [],
        jenisTagihan: current.jenisTagihanList || [],
        tagihan: (current.sppList || []).map((s) => ({
          id: s.id,
          siswaId: s.siswaId,
          siswaNama: s.siswaNama,
          nisn: s.nisn,
          kelas: s.kelas,
          judul: `SPP ${s.bulan} ${s.tahun}`,
          kategori: "SPP" as const,
          nominal: s.nominal,
          jatuhTempo: s.jatuhTempo,
          status: s.status,
          tanggalBayar: s.tanggalBayar,
          metodePembayaran: s.metodePembayaran,
          noKuitansi: s.noKuitansi,
          keterangan: s.keterangan,
          bulan: s.bulan,
          tahun: s.tahun,
        })),
        tabungan: current.tabunganList || [],
        transaksiTabungan: current.transaksiTabunganList || [],
        pesertaTransport: current.pesertaTransportList || [],
        sppTransportRecords: current.sppTransportRecords || [],
        transaksiSPPTransport: current.transaksiSPPTransportList || [],
        pengumuman: current.pengumumanList || [],
        lmsMateri: current.lmsMateriList || [],
        lmsTugas: current.lmsTugasList || [],
        lmsSubmissions: current.lmsSubmissionList || [],
        lmsKuis: current.lmsKuisList || [],
        lmsAttempts: current.lmsKuisAttemptList || [],
        lmsForum: current.lmsForumList || [],
        lmsMeetings: current.lmsMeetingList || [],
        lmsBankSoal: current.lmsBankSoalList || [],
        lmsJadwalMateri: current.lmsJadwalMateriList || [],
        tahfidz: current.tahfidzList || [],
        mutabaah: current.mutabaahList || [],
        deletedIds,
      });

      if (res.success) {
        setIsSupabaseConnected(true);
        setLastSyncTime(new Date());
        setLastAutoPushTime(new Date());
        setAutoPushStatus("success");
        setSupabaseError(null);
      } else {
        setAutoPushStatus("error");
        setSupabaseError(res.message);
      }
      return res.success;
    } catch (err: any) {
      console.error("[Supabase] Gagal seed database:", err);
      setAutoPushStatus("error");
      setSupabaseError(err.message || "Gagal seed database ke cloud Supabase");
      return false;
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Full bi-directional sync with Supabase Cloud
  const syncWithSupabase = async (): Promise<void> => {
    if (!SupabaseSchoolService.isConfigured()) {
      setIsSupabaseConnected(false);
      return;
    }

    setIsSyncing(true);
    setSupabaseError(null);

    try {
      const data = await SupabaseSchoolService.fetchAllSchoolData();
      if (!data) {
        setIsSupabaseConnected(false);
        setSupabaseError("Tidak dapat menghubungkan ke Supabase cloud.");
        setIsSyncing(false);
        return;
      }

      const hasCloudData = Boolean(
        (data.siswa && data.siswa.length > 0) ||
        (data.guru && data.guru.length > 0) ||
        (data.kelas && data.kelas.length > 0) ||
        data.profile
      );

      if (!hasCloudData) {
        const isExplicitlyCleared = typeof window !== "undefined" && localStorage.getItem("sim_database_cleared") === "true";
        if (isExplicitlyCleared) {
          console.log("[Supabase] Database sekolah dalam status dikosongkan. Menjaga cloud tetap kosong.");
          setIsSupabaseConnected(true);
          setLastSyncTime(new Date());
          setIsSyncing(false);
          return;
        }
        // First-time connected to fresh Supabase: auto seed so it's ready!
        console.log("[Supabase] Database cloud masih kosong. Menjalankan auto-seeding awal...");
        await seedDatabaseToCloud();
        return;
      }

      // Hydrate all states with data from Supabase
      if (data.profile) {
        const remoteProfile = data.profile;
        setProfile((prevProfile) => {
          const merged: SchoolProfile = {
            ...prevProfile,
            ...remoteProfile,
            appName: remoteProfile.appName !== undefined ? remoteProfile.appName : (prevProfile?.appName ?? INITIAL_SCHOOL_PROFILE.appName),
            appTagline: remoteProfile.appTagline !== undefined ? remoteProfile.appTagline : (prevProfile?.appTagline ?? INITIAL_SCHOOL_PROFILE.appTagline),
            appLogoUrl: remoteProfile.appLogoUrl !== undefined ? remoteProfile.appLogoUrl : (prevProfile?.appLogoUrl ?? ""),
            appIconPreset: remoteProfile.appIconPreset !== undefined ? remoteProfile.appIconPreset : (prevProfile?.appIconPreset ?? INITIAL_SCHOOL_PROFILE.appIconPreset),
            landingHeroBadge: remoteProfile.landingHeroBadge !== undefined ? remoteProfile.landingHeroBadge : (prevProfile?.landingHeroBadge ?? INITIAL_SCHOOL_PROFILE.landingHeroBadge),
            landingHeroTitle: remoteProfile.landingHeroTitle !== undefined ? remoteProfile.landingHeroTitle : (prevProfile?.landingHeroTitle ?? INITIAL_SCHOOL_PROFILE.landingHeroTitle),
            landingHeroSubtitle: remoteProfile.landingHeroSubtitle !== undefined ? remoteProfile.landingHeroSubtitle : (prevProfile?.landingHeroSubtitle ?? INITIAL_SCHOOL_PROFILE.landingHeroSubtitle),
            landingCtaText: remoteProfile.landingCtaText !== undefined ? remoteProfile.landingCtaText : (prevProfile?.landingCtaText ?? INITIAL_SCHOOL_PROFILE.landingCtaText),
            landingShowDemoButton: remoteProfile.landingShowDemoButton !== undefined ? remoteProfile.landingShowDemoButton : (prevProfile?.landingShowDemoButton !== undefined ? prevProfile.landingShowDemoButton : true),
            landingFooterText: remoteProfile.landingFooterText !== undefined ? remoteProfile.landingFooterText : (prevProfile?.landingFooterText ?? INITIAL_SCHOOL_PROFILE.landingFooterText),
          };
          latestDataRef.current.profile = merged;
          saveState("profile", merged, true);
          return merged;
        });
      }
      const deletedIds = getDeletedIds();

      if (Array.isArray(data.siswa)) {
        const localSiswa = latestDataRef.current.siswaList || [];
        const stale = data.siswa.filter((s) => deletedIds.has(s.id)).map((s) => s.id);
        if (stale.length > 0) SupabaseSchoolService.bulkDeleteSiswa(stale).catch(() => {});
        const remoteSiswa = data.siswa.filter((s) => !deletedIds.has(s.id));
        const mergedSiswa = [...remoteSiswa];
        localSiswa.forEach((loc) => {
          if (deletedIds.has(loc.id)) return;
          const exists = mergedSiswa.some(
            (rem) => rem.id === loc.id || (Boolean(loc.nisn?.trim()) && Boolean(rem.nisn?.trim()) && rem.nisn.trim() === loc.nisn.trim())
          );
          if (!exists) {
            mergedSiswa.push(loc);
          }
        });
        setSiswaList(mergedSiswa);
        latestDataRef.current.siswaList = mergedSiswa;
        saveState("siswa", mergedSiswa, true);
      }
      if (Array.isArray(data.guru)) {
        const localGuru = latestDataRef.current.guruList || [];
        const stale = data.guru.filter((g) => deletedIds.has(g.id)).map((g) => g.id);
        if (stale.length > 0) {
          stale.forEach((id) => SupabaseSchoolService.deleteGuru(id).catch(() => {}));
        }
        const remoteGuru = data.guru.filter((g) => !deletedIds.has(g.id));
        const mergedGuru = [...remoteGuru];
        localGuru.forEach((loc) => {
          if (deletedIds.has(loc.id)) return;
          const exists = mergedGuru.some(
            (rem) => rem.id === loc.id || (Boolean(loc.nip?.trim()) && Boolean(rem.nip?.trim()) && rem.nip.trim() === loc.nip.trim())
          );
          if (!exists) {
            mergedGuru.push(loc);
          }
        });
        setGuruList(mergedGuru);
        latestDataRef.current.guruList = mergedGuru;
        saveState("guru", mergedGuru, true);
      }
      if (Array.isArray(data.kelas)) {
        const localKelas = latestDataRef.current.kelasList || [];
        const stale = data.kelas.filter((k) => deletedIds.has(k.id)).map((k) => k.id);
        if (stale.length > 0) {
          stale.forEach((id) => SupabaseSchoolService.deleteKelas(id).catch(() => {}));
        }
        const remoteKelas = data.kelas.filter((k) => !deletedIds.has(k.id));
        const mergedKelas = [...remoteKelas];
        localKelas.forEach((loc) => {
          if (deletedIds.has(loc.id)) return;
          const exists = mergedKelas.some(
            (rem) => rem.id === loc.id || (Boolean(rem.nama) && Boolean(loc.nama) && rem.nama.toLowerCase().trim() === loc.nama.toLowerCase().trim())
          );
          if (!exists) {
            mergedKelas.push(loc);
          }
        });
        setKelasList(mergedKelas);
        latestDataRef.current.kelasList = mergedKelas;
        saveState("kelas", mergedKelas, true);
      }
      if (Array.isArray(data.mapel)) {
        const localMapel = latestDataRef.current.mapelList || [];
        const stale = data.mapel.filter((m) => deletedIds.has(m.id)).map((m) => m.id);
        if (stale.length > 0) {
          stale.forEach((id) => SupabaseSchoolService.deleteMapel(id).catch(() => {}));
        }
        const remoteMapel = data.mapel.filter((m) => !deletedIds.has(m.id));
        const mergedMapel = [...remoteMapel];
        localMapel.forEach((loc) => {
          if (deletedIds.has(loc.id)) return;
          const exists = mergedMapel.some(
            (rem) => rem.id === loc.id || (Boolean(rem.nama) && Boolean(loc.nama) && rem.nama.toLowerCase().trim() === loc.nama.toLowerCase().trim())
          );
          if (!exists) {
            mergedMapel.push(loc);
          }
        });
        setMapelList(mergedMapel);
        latestDataRef.current.mapelList = mergedMapel;
        saveState("mapel", mergedMapel, true);
      }
      if (Array.isArray(data.jadwal)) {
        const localJadwal = latestDataRef.current.jadwalList || [];
        const stale = data.jadwal.filter((j) => deletedIds.has(j.id)).map((j) => j.id);
        if (stale.length > 0) {
          SupabaseSchoolService.bulkDeleteJadwal(stale).catch(() => {});
        }
        const remoteJadwal = data.jadwal.filter((j) => !deletedIds.has(j.id));
        const mergedJadwal = [...remoteJadwal];
        localJadwal.forEach((loc) => {
          if (deletedIds.has(loc.id)) return;
          const exists = mergedJadwal.some((rem) => rem.id === loc.id);
          if (!exists) {
            mergedJadwal.push(loc);
          }
        });
        setJadwalList(mergedJadwal);
        latestDataRef.current.jadwalList = mergedJadwal;
        saveState("jadwal", mergedJadwal, true);
      }
      if (Array.isArray(data.presensi)) {
        const localPresensi = latestDataRef.current.presensiList || [];
        const remotePresensi = data.presensi.filter((p) => !deletedIds.has(p.id));
        const mergedPresensi = [...remotePresensi];
        localPresensi.forEach((loc) => {
          if (deletedIds.has(loc.id)) return;
          const exists = mergedPresensi.some(
            (rem) => rem.id === loc.id || (rem.siswaId === loc.siswaId && rem.tanggal === loc.tanggal)
          );
          if (!exists) {
            mergedPresensi.push(loc);
          }
        });
        setPresensiList(mergedPresensi);
        latestDataRef.current.presensiList = mergedPresensi;
        saveState("presensi", mergedPresensi, true);
      }
      if (Array.isArray(data.nilai)) {
        const localNilai = latestDataRef.current.nilaiList || [];
        const stale = data.nilai.filter((n) => deletedIds.has(n.id)).map((n) => n.id);
        if (stale.length > 0) {
          stale.forEach((id) => SupabaseSchoolService.deleteNilai(id).catch(() => {}));
        }
        const remoteNilai = data.nilai.filter((n) => !deletedIds.has(n.id));
        const mergedNilai = [...remoteNilai];
        localNilai.forEach((loc) => {
          if (deletedIds.has(loc.id)) return;
          const idx = mergedNilai.findIndex(
            (rem) =>
              rem.id === loc.id ||
              (rem.siswaId === loc.siswaId &&
                rem.mapel?.trim().toLowerCase() === loc.mapel?.trim().toLowerCase() &&
                (rem.semester || "Ganjil").trim().toLowerCase() === (loc.semester || "Ganjil").trim().toLowerCase())
          );
          if (idx >= 0) {
            if (loc.hasSts || loc.hasSas || (typeof loc.uts === "number" && loc.uts > 0) || (typeof loc.uas === "number" && loc.uas > 0)) {
              mergedNilai[idx] = { ...mergedNilai[idx], ...loc };
            }
          } else {
            mergedNilai.push(loc);
          }
        });
        setNilaiList(mergedNilai);
        latestDataRef.current.nilaiList = mergedNilai;
        saveState("nilai", mergedNilai, true);
      }
      if (Array.isArray(data.jenisTagihan)) {
        const stale = data.jenisTagihan.filter((t) => deletedIds.has(t.id)).map((t) => t.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteJenisTagihan(id).catch(() => {}));
        const filtered = data.jenisTagihan.filter((t) => !deletedIds.has(t.id));
        setJenisTagihanList(filtered);
        latestDataRef.current.jenisTagihanList = filtered;
        saveState("jenis_tagihan", filtered, true);
      }
      if (Array.isArray(data.tabungan)) {
        setTabunganList(data.tabungan);
        latestDataRef.current.tabunganList = data.tabungan;
        saveState("tabungan", data.tabungan, true);
      }
      if (Array.isArray(data.transaksiTabungan)) {
        setTransaksiTabunganList(data.transaksiTabungan);
        latestDataRef.current.transaksiTabunganList = data.transaksiTabungan;
        saveState("transaksi_tabungan", data.transaksiTabungan, true);
      }
      if (Array.isArray(data.pesertaTransport)) {
        setPesertaTransportList(data.pesertaTransport);
        latestDataRef.current.pesertaTransportList = data.pesertaTransport;
        saveState("peserta_transport", data.pesertaTransport, true);
      }
      if (Array.isArray(data.sppTransportRecords)) {
        setSppTransportRecords(data.sppTransportRecords);
        latestDataRef.current.sppTransportRecords = data.sppTransportRecords;
        saveState("spp_transport_records", data.sppTransportRecords, true);
      }
      if (Array.isArray(data.transaksiSPPTransport)) {
        setTransaksiSPPTransportList(data.transaksiSPPTransport);
        latestDataRef.current.transaksiSPPTransportList = data.transaksiSPPTransport;
        saveState("transaksi_spp_transport", data.transaksiSPPTransport, true);
      }
      if (Array.isArray(data.pengumuman)) {
        const stale = data.pengumuman.filter((p) => deletedIds.has(p.id)).map((p) => p.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deletePengumuman(id).catch(() => {}));
        const filtered = data.pengumuman.filter((p) => !deletedIds.has(p.id));
        setPengumumanList(filtered);
        latestDataRef.current.pengumumanList = filtered;
        saveState("pengumuman", filtered, true);
      }
      if (Array.isArray(data.lmsMateri)) {
        const stale = data.lmsMateri.filter((m) => deletedIds.has(m.id)).map((m) => m.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteLMSMateri(id).catch(() => {}));
        const filtered = data.lmsMateri.filter((m) => !deletedIds.has(m.id));
        setLmsMateriList(filtered);
        latestDataRef.current.lmsMateriList = filtered;
        saveState("lms_materi", filtered, true);
      }
      if (Array.isArray(data.lmsTugas)) {
        const stale = data.lmsTugas.filter((t) => deletedIds.has(t.id)).map((t) => t.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteLMSTugas(id).catch(() => {}));
        const filtered = data.lmsTugas.filter((t) => !deletedIds.has(t.id));
        setLmsTugasList(filtered);
        latestDataRef.current.lmsTugasList = filtered;
        saveState("lms_tugas", filtered, true);
      }
      if (Array.isArray(data.lmsSubmissions)) {
        setLmsSubmissionList(data.lmsSubmissions);
        latestDataRef.current.lmsSubmissionList = data.lmsSubmissions;
        saveState("lms_submissions", data.lmsSubmissions, true);
      }
      if (Array.isArray(data.lmsKuis)) {
        const stale = data.lmsKuis.filter((k) => deletedIds.has(k.id)).map((k) => k.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteLMSKuis(id).catch(() => {}));
        const filtered = data.lmsKuis.filter((k) => !deletedIds.has(k.id));
        setLmsKuisList(filtered);
        latestDataRef.current.lmsKuisList = filtered;
        saveState("lms_kuis", filtered, true);
      }
      if (Array.isArray(data.lmsAttempts)) {
        setLmsKuisAttemptList(data.lmsAttempts);
        latestDataRef.current.lmsKuisAttemptList = data.lmsAttempts;
        saveState("lms_attempts", data.lmsAttempts, true);
      }
      if (Array.isArray(data.lmsForum)) {
        setLmsForumList(data.lmsForum);
        latestDataRef.current.lmsForumList = data.lmsForum;
        saveState("lms_forum", data.lmsForum, true);
      }
      if (Array.isArray(data.lmsMeetings)) {
        const stale = data.lmsMeetings.filter((m) => deletedIds.has(m.id)).map((m) => m.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteLMSMeeting(id).catch(() => {}));
        const filtered = data.lmsMeetings.filter((m) => !deletedIds.has(m.id));
        setLmsMeetingList(filtered);
        latestDataRef.current.lmsMeetingList = filtered;
        saveState("lms_meetings", filtered, true);
      }
      if (Array.isArray(data.lmsBankSoal)) {
        const stale = data.lmsBankSoal.filter((b) => deletedIds.has(b.id)).map((b) => b.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteLMSBankSoal(id).catch(() => {}));
        const filtered = data.lmsBankSoal.filter((b) => !deletedIds.has(b.id));
        setLmsBankSoalList(filtered);
        latestDataRef.current.lmsBankSoalList = filtered;
        saveState("lms_bank_soal", filtered, true);
      }
      if (Array.isArray(data.lmsJadwalMateri)) {
        const stale = data.lmsJadwalMateri.filter((j) => deletedIds.has(j.id)).map((j) => j.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteLMSJadwalMateri(id).catch(() => {}));
        const filtered = data.lmsJadwalMateri.filter((j) => !deletedIds.has(j.id));
        setLmsJadwalMateriList(filtered);
        latestDataRef.current.lmsJadwalMateriList = filtered;
        saveState("lms_jadwal_materi", filtered, true);
      }
      if (Array.isArray(data.tahfidz)) {
        const stale = data.tahfidz.filter((t) => deletedIds.has(t.id)).map((t) => t.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteTahfidzRecord(id).catch(() => {}));
        const filtered = data.tahfidz.filter((t) => !deletedIds.has(t.id));
        setTahfidzList(filtered);
        latestDataRef.current.tahfidzList = filtered;
        saveState("tahfidz", filtered, true);
      }
      if (Array.isArray(data.mutabaah)) {
        const stale = data.mutabaah.filter((m) => deletedIds.has(m.id)).map((m) => m.id);
        if (stale.length > 0) stale.forEach((id) => SupabaseSchoolService.deleteMutabaahRecord(id).catch(() => {}));
        const filtered = data.mutabaah.filter((m) => !deletedIds.has(m.id));
        setMutabaahList(filtered);
        latestDataRef.current.mutabaahList = filtered;
        saveState("mutabaah", filtered, true);
      }

      setIsSupabaseConnected(true);
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error("[Supabase] Gagal mengambil data sekolah dari Supabase:", err);
      setIsSupabaseConnected(false);
      setSupabaseError(err.message || "Gagal sinkronisasi data cloud");
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync to LocalStorage
  const saveState = (key: string, value: unknown, skipAutoPush: boolean = false) => {
    try {
      localStorage.setItem(`sim_data_${key}`, JSON.stringify(value));
    } catch (e: any) {
      console.warn(`Failed to persist ${key} to localStorage:`, e?.message || e);
      // Quota exceeded fallback: if saving profile, strip massive appLogoUrl if it was causing the overflow
      if (key === "profile" && value && typeof value === "object") {
        try {
          const safeCopy = { ...(value as any), appLogoUrl: "" };
          localStorage.setItem(`sim_data_${key}`, JSON.stringify(safeCopy));
        } catch {}
      }
    }
    if (!skipAutoPush && isAutoPushEnabled && key !== "auto_push_db_enabled") {
      triggerAutoPush(`saveState-${key}`);
    }
  };

  const updateProfile = async (newProfile: SchoolProfile): Promise<boolean> => {
    latestDataRef.current.profile = newProfile;
    setProfile(newProfile);
    saveState("profile", newProfile);
    if (isAutoPushEnabled && SupabaseSchoolService.isConfigured()) {
      try {
        const ok = await SupabaseSchoolService.updateProfile(newProfile);
        if (ok) {
          setLastSyncTime(new Date());
          setLastAutoPushTime(new Date());
          setAutoPushStatus("success");
          setIsSupabaseConnected(true);
        }
        return ok;
      } catch (err) {
        console.warn("[updateProfile] Error updating profile to Supabase:", err);
        return false;
      }
    }
    return true;
  };

  // Siswa Actions
  const addSiswa = (siswaData: Omit<Siswa, "id">) => {
    const newSiswa: Siswa = {
      ...siswaData,
      id: `sis-${Date.now()}`,
      avatar:
        siswaData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(siswaData.nama)}`,
    };
    removeDeletedId(newSiswa.id);
    if (newSiswa.nisn) removeDeletedId(newSiswa.nisn);
    const updated = [newSiswa, ...siswaList];
    latestDataRef.current.siswaList = updated;
    setSiswaList(updated);
    saveState("siswa", updated);
    persistSupabase(() => SupabaseSchoolService.upsertSiswa(newSiswa));
  };

  const importSiswaList = (newStudents: Omit<Siswa, "id">[]) => {
    const now = Date.now();
    const created: Siswa[] = newStudents.map((s, idx) => ({
      ...s,
      id: `sis-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      avatar:
        s.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.nama)}`,
    }));
    created.forEach((s) => {
      removeDeletedId(s.id);
      if (s.nisn) removeDeletedId(s.nisn);
    });
    setSiswaList((prev) => {
      const updated = [...created, ...prev];
      latestDataRef.current.siswaList = updated;
      saveState("siswa", updated);
      if (SupabaseSchoolService.isConfigured()) {
        SupabaseSchoolService.bulkUpsertSiswa(created).catch((err) => {
          console.warn("[Supabase] Import siswa persistence warning:", err);
        });
      }
      return updated;
    });
  };

  const updateSiswa = (id: string, updatedData: Partial<Siswa>) => {
    const updated = siswaList.map((s) => (s.id === id ? { ...s, ...updatedData } : s));
    latestDataRef.current.siswaList = updated;
    setSiswaList(updated);
    saveState("siswa", updated);
    const target = updated.find((s) => s.id === id);
    if (target) {
      persistSupabase(() => SupabaseSchoolService.upsertSiswa(target));
    }
  };

  const deleteSiswa = (id: string) => {
    const siswaToDelete = siswaList.find((s) => s.id === id);
    recordDeletedId(id);
    if (siswaToDelete?.nisn) recordDeletedId(siswaToDelete.nisn);
    const updated = siswaList.filter((s) => s.id !== id);
    latestDataRef.current.siswaList = updated;
    setSiswaList(updated);
    saveState("siswa", updated);
    persistSupabase(() => SupabaseSchoolService.deleteSiswa(id));
  };

  const bulkDeleteSiswa = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const nisnList = siswaList
      .filter((s) => idSet.has(s.id) && s.nisn)
      .map((s) => s.nisn);
    recordDeletedId([...ids, ...nisnList]);
    const updated = siswaList.filter((s) => !idSet.has(s.id));
    latestDataRef.current.siswaList = updated;
    setSiswaList(updated);
    saveState("siswa", updated);
    persistSupabase(() => SupabaseSchoolService.bulkDeleteSiswa(ids));
  };

  // Guru Actions
  const addGuru = (guruData: Omit<Guru, "id">) => {
    const newGuru: Guru = {
      ...guruData,
      id: `gur-${Date.now()}`,
      avatar:
        guruData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guruData.nama)}`,
    };
    removeDeletedId(newGuru.id);
    if (newGuru.nip) removeDeletedId(newGuru.nip);
    const updated = [newGuru, ...guruList];
    latestDataRef.current.guruList = updated;
    setGuruList(updated);
    saveState("guru", updated);
    persistSupabase(() => SupabaseSchoolService.upsertGuru(newGuru));
  };

  const updateGuru = (id: string, updatedData: Partial<Guru>) => {
    const updated = guruList.map((g) => (g.id === id ? { ...g, ...updatedData } : g));
    latestDataRef.current.guruList = updated;
    setGuruList(updated);
    saveState("guru", updated);
    const target = updated.find((g) => g.id === id);
    if (target) {
      persistSupabase(() => SupabaseSchoolService.upsertGuru(target));
    }
  };

  const deleteGuru = (id: string) => {
    const guruToDelete = guruList.find((g) => g.id === id);
    recordDeletedId(id);
    if (guruToDelete?.nip) recordDeletedId(guruToDelete.nip);
    const updated = guruList.filter((g) => g.id !== id);
    latestDataRef.current.guruList = updated;
    setGuruList(updated);
    saveState("guru", updated);
    persistSupabase(() => SupabaseSchoolService.deleteGuru(id));
  };

  // Kelas Actions
  const addKelas = (kelasData: Omit<Kelas, "id" | "jumlahSiswa">) => {
    const newKelas: Kelas = {
      ...kelasData,
      id: `cls-${Date.now()}`,
      jumlahSiswa: 0,
    };
    removeDeletedId(newKelas.id);
    if (newKelas.nama) removeDeletedId(newKelas.nama);
    const updated = [...kelasList, newKelas];
    latestDataRef.current.kelasList = updated;
    setKelasList(updated);
    saveState("kelas", updated);
    persistSupabase(() => SupabaseSchoolService.upsertKelas(newKelas));

    // If waliKelasId was assigned, sync guru's kelasWali
    if (newKelas.waliKelasId) {
      const updatedGuru = guruList.map((g) =>
        g.id === newKelas.waliKelasId ? { ...g, kelasWali: newKelas.nama } : g
      );
      latestDataRef.current.guruList = updatedGuru;
      setGuruList(updatedGuru);
      saveState("guru", updatedGuru);
    }
  };

  const updateKelas = (id: string, updatedData: Partial<Kelas>) => {
    const oldKelas = kelasList.find((k) => k.id === id);
    if (!oldKelas) return;

    const oldNama = oldKelas.nama;
    const newNama = updatedData.nama || oldNama;
    const oldWaliId = oldKelas.waliKelasId;
    const newWaliId = updatedData.waliKelasId;

    const updated = kelasList.map((k) => (k.id === id ? { ...k, ...updatedData } : k));
    latestDataRef.current.kelasList = updated;
    setKelasList(updated);
    saveState("kelas", updated);
    const targetKelas = updated.find((k) => k.id === id);
    if (targetKelas) {
      persistSupabase(() => SupabaseSchoolService.upsertKelas(targetKelas));
    }

    // If class name changed, cascade update to Siswa, Jadwal, Presensi, Nilai
    if (oldNama !== newNama) {
      const updatedSiswa = siswaList.map((s) =>
        s.kelas === oldNama ? { ...s, kelas: newNama } : s
      );
      latestDataRef.current.siswaList = updatedSiswa;
      setSiswaList(updatedSiswa);
      saveState("siswa", updatedSiswa);

      const updatedJadwal = jadwalList.map((j) =>
        j.kelas === oldNama ? { ...j, kelas: newNama } : j
      );
      latestDataRef.current.jadwalList = updatedJadwal;
      setJadwalList(updatedJadwal);
      saveState("jadwal", updatedJadwal);

      const updatedPresensi = presensiList.map((p) =>
        p.kelas === oldNama ? { ...p, kelas: newNama } : p
      );
      latestDataRef.current.presensiList = updatedPresensi;
      setPresensiList(updatedPresensi);
      saveState("presensi", updatedPresensi);

      const updatedNilai = nilaiList.map((n) =>
        n.kelas === oldNama ? { ...n, kelas: newNama } : n
      );
      latestDataRef.current.nilaiList = updatedNilai;
      setNilaiList(updatedNilai);
      saveState("nilai", updatedNilai);
    }

    // Update Guru wali assignment if changed
    if (newWaliId !== undefined && newWaliId !== oldWaliId) {
      const updatedGuru = guruList.map((g) => {
        if (g.id === newWaliId) {
          return { ...g, kelasWali: newNama };
        }
        if (g.id === oldWaliId && g.kelasWali === oldNama) {
          const { kelasWali, ...rest } = g;
          return rest as Guru;
        }
        return g;
      });
      latestDataRef.current.guruList = updatedGuru;
      setGuruList(updatedGuru);
      saveState("guru", updatedGuru);
    }
  };

  const deleteKelas = (id: string, targetKelasForStudents?: string) => {
    const kelasToDelete = kelasList.find((k) => k.id === id);
    if (!kelasToDelete) return;

    recordDeletedId(id);
    if (kelasToDelete.nama) {
      recordDeletedId(kelasToDelete.nama);
    }
    const targetNama = targetKelasForStudents || "Belum Ditentukan";

    // Remove from kelasList
    const updatedKelasList = kelasList.filter((k) => k.id !== id);
    latestDataRef.current.kelasList = updatedKelasList;
    setKelasList(updatedKelasList);
    saveState("kelas", updatedKelasList);
    persistSupabase(() => SupabaseSchoolService.deleteKelas(id));

    // Reassign students belonging to this class
    const updatedSiswa = siswaList.map((s) =>
      s.kelas === kelasToDelete.nama ? { ...s, kelas: targetNama } : s
    );
    latestDataRef.current.siswaList = updatedSiswa;
    setSiswaList(updatedSiswa);
    saveState("siswa", updatedSiswa);
    const affectedStudents = updatedSiswa.filter((s) => s.kelas === targetNama);
    if (affectedStudents.length > 0) {
      persistSupabase(async () => {
        for (const s of affectedStudents) {
          await SupabaseSchoolService.upsertSiswa(s);
        }
        return true;
      });
    }

    // Reassign schedule belonging to this class
    const deletedScheduleIds = jadwalList.filter((j) => j.kelas === kelasToDelete.nama).map((j) => j.id);
    if (deletedScheduleIds.length > 0) {
      recordDeletedId(deletedScheduleIds);
      persistSupabase(() => SupabaseSchoolService.bulkDeleteJadwal(deletedScheduleIds));
    }
    const updatedJadwal = jadwalList.filter((j) => j.kelas !== kelasToDelete.nama);
    latestDataRef.current.jadwalList = updatedJadwal;
    setJadwalList(updatedJadwal);
    saveState("jadwal", updatedJadwal);

    // Clear waliKelas from the previously assigned guru
    if (kelasToDelete.waliKelasId) {
      const updatedGuru = guruList.map((g) =>
        g.id === kelasToDelete.waliKelasId && g.kelasWali === kelasToDelete.nama
          ? (() => {
              const { kelasWali, ...rest } = g;
              return rest as Guru;
            })()
          : g
      );
      latestDataRef.current.guruList = updatedGuru;
      setGuruList(updatedGuru);
      saveState("guru", updatedGuru);
    }
  };

  // Mata Pelajaran Actions
  const addMapel = (mapelData: Omit<MataPelajaran, "id">) => {
    const rawKode = mapelData.kode?.trim() || mapelData.nama.substring(0, 3).toUpperCase();
    const newMapel: MataPelajaran = {
      ...mapelData,
      id: `mpl-${Date.now()}`,
      kode: rawKode.toUpperCase(),
      nama: mapelData.nama.trim(),
      kategori: mapelData.kategori || "Wajib",
      kkm: Number(mapelData.kkm) || 75,
    };
    removeDeletedId(newMapel.id);
    if (newMapel.nama) removeDeletedId(newMapel.nama);
    const updated = [...mapelList, newMapel];
    latestDataRef.current.mapelList = updated;
    setMapelList(updated);
    saveState("mapel", updated);
    persistSupabase(() => SupabaseSchoolService.upsertMapel(newMapel));
  };

  const updateMapel = (id: string, updatedData: Partial<MataPelajaran>) => {
    const oldMapel = mapelList.find((m) => m.id === id);
    if (!oldMapel) return;

    const oldNama = oldMapel.nama.trim();
    const newNama = updatedData.nama !== undefined ? updatedData.nama.trim() : oldNama;

    const targetMapel: MataPelajaran = {
      ...oldMapel,
      ...updatedData,
      nama: newNama,
      kode: updatedData.kode !== undefined ? updatedData.kode.trim().toUpperCase() : oldMapel.kode,
      kkm: updatedData.kkm !== undefined ? Number(updatedData.kkm) : oldMapel.kkm,
    };

    const updated = mapelList.map((m) => (m.id === id ? targetMapel : m));
    latestDataRef.current.mapelList = updated;
    setMapelList(updated);
    saveState("mapel", updated);
    persistSupabase(() => SupabaseSchoolService.upsertMapel(targetMapel));

    // If mapel name changed, cascade update to Jadwal, Nilai, and Guru
    if (oldNama !== newNama) {
      // 1. Cascade update Jadwal Pelajaran
      const updatedJadwal = jadwalList.map((j) =>
        j.mapel.trim().toLowerCase() === oldNama.toLowerCase() ? { ...j, mapel: newNama } : j
      );
      latestDataRef.current.jadwalList = updatedJadwal;
      setJadwalList(updatedJadwal);
      saveState("jadwal", updatedJadwal);

      // 2. Cascade update Nilai Siswa
      const updatedNilai = nilaiList.map((n) =>
        n.mapel.trim().toLowerCase() === oldNama.toLowerCase() ? { ...n, mapel: newNama } : n
      );
      latestDataRef.current.nilaiList = updatedNilai;
      setNilaiList(updatedNilai);
      saveState("nilai", updatedNilai);

      // 3. Cascade update Guru mataPelajaran array
      const updatedGuru = guruList.map((g) => {
        if (g.mataPelajaran.some((mp) => mp.trim().toLowerCase() === oldNama.toLowerCase())) {
          return {
            ...g,
            mataPelajaran: g.mataPelajaran.map((mp) =>
              mp.trim().toLowerCase() === oldNama.toLowerCase() ? newNama : mp
            ),
          };
        }
        return g;
      });
      latestDataRef.current.guruList = updatedGuru;
      setGuruList(updatedGuru);
      saveState("guru", updatedGuru);
    }
  };

  const deleteMapel = (id: string) => {
    const mapelToDelete = mapelList.find((m) => m.id === id);
    if (!mapelToDelete) return;

    recordDeletedId(id);
    if (mapelToDelete.nama) {
      recordDeletedId(mapelToDelete.nama);
    }
    const updated = mapelList.filter((m) => m.id !== id);
    latestDataRef.current.mapelList = updated;
    setMapelList(updated);
    saveState("mapel", updated);
    persistSupabase(() => SupabaseSchoolService.deleteMapel(id));
  };

  // Jadwal Actions
  const addJadwal = (jadwalData: Omit<JadwalPelajaran, "id">) => {
    const newJadwal: JadwalPelajaran = {
      ...jadwalData,
      id: `jdw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    removeDeletedId(newJadwal.id);
    const updated = [...jadwalList, newJadwal];
    latestDataRef.current.jadwalList = updated;
    setJadwalList(updated);
    saveState("jadwal", updated);
    persistSupabase(() => SupabaseSchoolService.upsertJadwal(newJadwal));
  };

  const bulkAddJadwal = (items: Omit<JadwalPelajaran, "id">[]) => {
    const newItems: JadwalPelajaran[] = items.map((item, idx) => ({
      ...item,
      id: `jdw-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    }));
    removeDeletedId(newItems.map((i) => i.id));
    const updated = [...jadwalList, ...newItems];
    latestDataRef.current.jadwalList = updated;
    setJadwalList(updated);
    saveState("jadwal", updated);
    persistSupabase(() => SupabaseSchoolService.bulkUpsertJadwal(newItems));
  };

  const updateJadwal = (id: string, updatedData: Partial<JadwalPelajaran>) => {
    const updated = jadwalList.map((j) => (j.id === id ? { ...j, ...updatedData } : j));
    latestDataRef.current.jadwalList = updated;
    setJadwalList(updated);
    saveState("jadwal", updated);
    const target = updated.find((j) => j.id === id);
    if (target) {
      persistSupabase(() => SupabaseSchoolService.upsertJadwal(target));
    }
  };

  const deleteJadwal = (id: string) => {
    recordDeletedId(id);
    const updated = jadwalList.filter((j) => j.id !== id);
    latestDataRef.current.jadwalList = updated;
    setJadwalList(updated);
    saveState("jadwal", updated);
    persistSupabase(() => SupabaseSchoolService.deleteJadwal(id));
  };

  const bulkDeleteJadwal = (ids: string[]) => {
    recordDeletedId(ids);
    const idSet = new Set(ids);
    const updated = jadwalList.filter((j) => !idSet.has(j.id));
    latestDataRef.current.jadwalList = updated;
    setJadwalList(updated);
    saveState("jadwal", updated);
    persistSupabase(() => SupabaseSchoolService.bulkDeleteJadwal(ids));
  };

  const resetJadwalToDefault = () => {
    latestDataRef.current.jadwalList = INITIAL_JADWAL;
    setJadwalList(INITIAL_JADWAL);
    saveState("jadwal", INITIAL_JADWAL);
  };

  // Presensi Actions
  const updatePresensi = (
    siswaId: string,
    status: StatusKehadiran,
    keterangan?: string,
    tanggal?: string
  ) => {
    const targetDate = tanggal || new Date().toISOString().split("T")[0];
    const existingIndex = presensiList.findIndex(
      (p) => p.siswaId === siswaId && p.tanggal === targetDate
    );

    let updated: PresensiRecord[];
    const siswa = siswaList.find((s) => s.id === siswaId);
    if (!siswa) return;

    if (existingIndex >= 0) {
      updated = [...presensiList];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        keterangan: keterangan !== undefined ? keterangan : updated[existingIndex].keterangan,
      };
    } else {
      const newPresensi: PresensiRecord = {
        id: `prs-${Date.now()}-${siswaId}`,
        siswaId,
        siswaNama: siswa.nama,
        kelas: siswa.kelas,
        tanggal: targetDate,
        status,
        keterangan,
      };
      updated = [newPresensi, ...presensiList];
    }
    setPresensiList(updated);
    saveState("presensi", updated);
    const targetRec = updated.find((p) => p.siswaId === siswaId && p.tanggal === targetDate);
    if (targetRec) {
      persistSupabase(() => SupabaseSchoolService.upsertPresensi(targetRec));
    }
  };

  // Nilai Actions
  const saveNilai = (data: Omit<NilaiSiswa, "id"> & { id?: string }) => {
    let updated = [...nilaiList];
    let savedItem: NilaiSiswa;

    const existingIndex = data.id
      ? updated.findIndex((n) => n.id === data.id)
      : updated.findIndex(
          (n) =>
            n.siswaId === data.siswaId &&
            n.mapel.toLowerCase() === data.mapel.toLowerCase() &&
            (n.semester || "Ganjil").toLowerCase() === (data.semester || "Ganjil").toLowerCase()
        );

    if (existingIndex >= 0) {
      savedItem = {
        ...updated[existingIndex],
        ...data,
      } as NilaiSiswa;
      updated[existingIndex] = savedItem;
    } else {
      savedItem = {
        ...data,
        id: data.id || `nil-${Date.now()}`,
      } as NilaiSiswa;
      updated = [savedItem, ...updated];
    }

    setNilaiList(updated);
    saveState("nilai", updated);
    persistSupabase(() => SupabaseSchoolService.upsertNilai(savedItem));
  };

  const bulkSaveNilai = (items: (Omit<NilaiSiswa, "id"> & { id?: string })[]) => {
    let updated = [...nilaiList];
    const toUpsert: NilaiSiswa[] = [];

    items.forEach((item, index) => {
      const existingIndex = updated.findIndex((n) => {
        if (item.id && n.id === item.id) return true;
        const sameSiswa = n.siswaId === item.siswaId;
        const sameMapel =
          n.mapel && item.mapel && n.mapel.trim().toLowerCase() === item.mapel.trim().toLowerCase();
        const sameSem =
          (n.semester || "Ganjil").trim().toLowerCase() ===
          (item.semester || "Ganjil").trim().toLowerCase();
        return sameSiswa && Boolean(sameMapel) && Boolean(sameSem);
      });

      if (existingIndex >= 0) {
        const merged = {
          ...updated[existingIndex],
          ...item,
          id: updated[existingIndex].id, // Pertahankan ID asli
        } as NilaiSiswa;
        updated[existingIndex] = merged;
        toUpsert.push(merged);
      } else {
        const newNilai: NilaiSiswa = {
          ...item,
          id: item.id || `nil-${Date.now()}-${index}`,
        } as NilaiSiswa;
        updated = [newNilai, ...updated];
        toUpsert.push(newNilai);
      }
    });

    setNilaiList(updated);
    latestDataRef.current.nilaiList = updated;
    saveState("nilai", updated);
    if (toUpsert.length > 0) {
      persistSupabase(() => SupabaseSchoolService.bulkUpsertNilai(toUpsert));
    }
  };

  const deleteNilai = (id: string) => {
    recordDeletedId(id);
    const updated = nilaiList.filter((n) => n.id !== id);
    latestDataRef.current.nilaiList = updated;
    setNilaiList(updated);
    saveState("nilai", updated);
    persistSupabase(() => SupabaseSchoolService.deleteNilai(id));
  };

  const deleteNilaiBySiswa = (siswaId: string) => {
    const deletedIds = nilaiList.filter((n) => n.siswaId === siswaId).map((n) => n.id);
    if (deletedIds.length > 0) recordDeletedId(deletedIds);
    const updated = nilaiList.filter((n) => n.siswaId !== siswaId);
    latestDataRef.current.nilaiList = updated;
    setNilaiList(updated);
    saveState("nilai", updated);
    persistSupabase(() => SupabaseSchoolService.deleteNilaiBySiswa(siswaId));
  };

  // Jenis Tagihan (Billing Categories) Actions
  const addJenisTagihan = (data: Omit<JenisTagihan, "id">) => {
    const newJenis: JenisTagihan = {
      ...data,
      id: `jt-${Date.now()}`,
    };
    removeDeletedId(newJenis.id);
    const updated = [...jenisTagihanList, newJenis];
    latestDataRef.current.jenisTagihanList = updated;
    setJenisTagihanList(updated);
    saveState("jenis_tagihan", updated);
    persistSupabase(() => SupabaseSchoolService.upsertJenisTagihan(newJenis));
  };

  const updateJenisTagihan = (id: string, data: Partial<JenisTagihan>) => {
    const oldItem = jenisTagihanList.find((j) => j.id === id);
    if (!oldItem) return;

    const oldNama = oldItem.nama;
    const newNama = data.nama || oldNama;

    const updated = jenisTagihanList.map((j) => (j.id === id ? { ...j, ...data } : j));
    latestDataRef.current.jenisTagihanList = updated;
    setJenisTagihanList(updated);
    saveState("jenis_tagihan", updated);
    const target = updated.find((j) => j.id === id);
    if (target) {
      persistSupabase(() => SupabaseSchoolService.upsertJenisTagihan(target));
    }

    // If name changed, cascade update existing bills in sppList
    if (oldNama !== newNama) {
      const updatedBills = sppList.map((b) =>
        b.kategori === oldNama ? { ...b, kategori: newNama } : b
      );
      latestDataRef.current.sppList = updatedBills;
      setSppList(updatedBills);
      saveState("spp", updatedBills);
    }
  };

  const deleteJenisTagihan = (id: string, fallbackNama: string = "Lainnya") => {
    const itemToDelete = jenisTagihanList.find((j) => j.id === id);
    if (!itemToDelete) return;

    recordDeletedId(id);
    const updated = jenisTagihanList.filter((j) => j.id !== id);
    latestDataRef.current.jenisTagihanList = updated;
    setJenisTagihanList(updated);
    saveState("jenis_tagihan", updated);
    persistSupabase(() => SupabaseSchoolService.deleteJenisTagihan(id));

    // Cascade update existing bills with deleted category to fallbackNama
    const updatedBills = sppList.map((b) =>
      b.kategori === itemToDelete.nama ? { ...b, kategori: fallbackNama } : b
    );
    latestDataRef.current.sppList = updatedBills;
    setSppList(updatedBills);
    saveState("spp", updatedBills);
  };

  // Tagihan & SPP Actions
  const addTagihan = (data: Omit<TagihanSiswa, "id">) => {
    const newTagihan: TagihanSiswa = {
      ...data,
      id: `tag-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    };
    const updated = [newTagihan, ...sppList];
    setSppList(updated);
    saveState("spp", updated);
    persistSupabase(() => SupabaseSchoolService.upsertTagihan(newTagihan));
  };

  const bulkAddTagihan = (
    kelas: string,
    judul: string,
    kategori: KategoriTagihan,
    nominal: number,
    jatuhTempo: string,
    keterangan?: string
  ) => {
    const studentsInClass = siswaList.filter((s) => s.kelas === kelas);
    if (studentsInClass.length === 0) return;

    const newBills: TagihanSiswa[] = studentsInClass.map((s, idx) => ({
      id: `tag-${Date.now()}-${idx}`,
      siswaId: s.id,
      siswaNama: s.nama,
      nisn: s.nisn,
      kelas: s.kelas,
      judul,
      kategori,
      nominal,
      jatuhTempo,
      status: "Belum Lunas",
      keterangan,
    }));

    const updated = [...newBills, ...sppList];
    setSppList(updated);
    saveState("spp", updated);
    persistSupabase(() => SupabaseSchoolService.bulkUpsertTagihan(newBills));
  };

  const bayarSPP = (id: string, metode: MetodePembayaranTagihan) => {
    const now = new Date();
    const invoiceNum = `KW-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const todayStr = now.toISOString().split("T")[0];

    const updated = sppList.map((item) =>
      item.id === id
        ? {
            ...item,
            status: "Lunas" as const,
            tanggalBayar: todayStr,
            metodePembayaran: metode,
            noKuitansi: invoiceNum,
          }
        : item
    );
    setSppList(updated);
    saveState("spp", updated);
    const target = updated.find((s) => s.id === id);
    if (target) {
      persistSupabase(() => SupabaseSchoolService.upsertTagihan(target));
    }
  };

  const bayarTagihanDariTabungan = (
    tagihanId: string,
    petugas?: string
  ): { success: boolean; message?: string } => {
    const tagihan = sppList.find((item) => item.id === tagihanId);
    if (!tagihan) {
      return { success: false, message: "Data tagihan tidak ditemukan." };
    }
    if (tagihan.status === "Lunas") {
      return { success: false, message: "Tagihan ini sudah lunas sebelumnya." };
    }

    const tabungan = tabunganList.find((t) => t.siswaId === tagihan.siswaId);
    const saldoSaatIni = tabungan ? tabungan.saldo : 0;

    if (saldoSaatIni < tagihan.nominal) {
      return {
        success: false,
        message: `Saldo tabungan ${tagihan.siswaNama} (Rp ${saldoSaatIni.toLocaleString("id-ID")}) tidak cukup untuk melunasi tagihan sebesar Rp ${tagihan.nominal.toLocaleString("id-ID")}. Kurang Rp ${(tagihan.nominal - saldoSaatIni).toLocaleString("id-ID")}.`,
      };
    }

    // Tarik saldo dari tabungan
    const tarikResult = tarikTabungan(
      tagihan.siswaId,
      tagihan.nominal,
      `Pelunasan Tagihan: ${tagihan.judul}`,
      petugas || "Autodebet Tabungan Siswa"
    );

    if (!tarikResult.success) {
      return tarikResult;
    }

    // Tandai tagihan sebagai lunas
    const now = new Date();
    const invoiceNum = `KW-TB-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const todayStr = now.toISOString().split("T")[0];

    const updatedSpp = sppList.map((item) =>
      item.id === tagihanId
        ? {
            ...item,
            status: "Lunas" as const,
            tanggalBayar: todayStr,
            metodePembayaran: "Potong Tabungan Siswa" as MetodePembayaranTagihan,
            noKuitansi: invoiceNum,
          }
        : item
    );

    setSppList(updatedSpp);
    saveState("spp", updatedSpp);

    return { success: true };
  };

  const bulkBayarTagihanDariTabungan = (
    kelasFilter?: string
  ): { successCount: number; failCount: number } => {
    let successCount = 0;
    let failCount = 0;

    const unpaidBills = sppList.filter(
      (b) =>
        b.status !== "Lunas" &&
        (!kelasFilter || kelasFilter === "Semua" || b.kelas === kelasFilter)
    );

    unpaidBills.forEach((b) => {
      const tab = tabunganList.find((t) => t.siswaId === b.siswaId);
      if (tab && tab.saldo >= b.nominal) {
        const res = bayarTagihanDariTabungan(b.id, "Autodebet Massal");
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        failCount++;
      }
    });

    return { successCount, failCount };
  };

  // Pengumuman Actions
  const addPengumuman = (data: Omit<Pengumuman, "id" | "tanggal">) => {
    const today = new Date().toISOString().split("T")[0];
    const newPengumuman: Pengumuman = {
      ...data,
      id: `ann-${Date.now()}`,
      tanggal: today,
    };
    removeDeletedId(newPengumuman.id);
    const updated = [newPengumuman, ...pengumumanList];
    latestDataRef.current.pengumumanList = updated;
    setPengumumanList(updated);
    saveState("pengumuman", updated);
    persistSupabase(() => SupabaseSchoolService.upsertPengumuman(newPengumuman));
  };

  const deletePengumuman = (id: string) => {
    recordDeletedId(id);
    const updated = pengumumanList.filter((p) => p.id !== id);
    latestDataRef.current.pengumumanList = updated;
    setPengumumanList(updated);
    saveState("pengumuman", updated);
    persistSupabase(() => SupabaseSchoolService.deletePengumuman(id));
  };

  // Tabungan Actions
  const setorTabungan = (
    siswaId: string,
    nominal: number,
    keterangan?: string,
    petugas?: string,
    tanggal?: string
  ) => {
    if (nominal <= 0) return;
    const today = tanggal || new Date().toISOString().split("T")[0];
    const siswa = siswaList.find((s) => s.id === siswaId);
    if (!siswa) return;

    let updatedTabungan: TabunganSiswa[];
    const targetTabungan = tabunganList.find((t) => t.siswaId === siswaId);
    let tabId = `tab-${Date.now()}`;
    let newSaldo = nominal;

    if (targetTabungan) {
      tabId = targetTabungan.id;
      newSaldo = targetTabungan.saldo + nominal;
      updatedTabungan = tabunganList.map((t) =>
        t.siswaId === siswaId ? { ...t, saldo: newSaldo, terakhirUpdate: today } : t
      );
    } else {
      const newTab: TabunganSiswa = {
        id: tabId,
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
        saldo: nominal,
        terakhirUpdate: today,
      };
      updatedTabungan = [newTab, ...tabunganList];
    }

    const newTrx: TransaksiTabungan = {
      id: `trx-${Date.now()}`,
      tabunganId: tabId,
      siswaId: siswa.id,
      siswaNama: siswa.nama,
      nisn: siswa.nisn,
      kelas: siswa.kelas,
      tipe: "Setor",
      nominal,
      saldoAkhir: newSaldo,
      tanggal: today,
      keterangan: keterangan || "Setoran tabungan tunai",
      petugas: petugas || "Petugas Tata Usaha",
      noReferensi: `TB-${today.replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
    };

    const updatedTrx = [newTrx, ...transaksiTabunganList];
    setTabunganList(updatedTabungan);
    setTransaksiTabunganList(updatedTrx);
    saveState("tabungan", updatedTabungan);
    saveState("transaksi_tabungan", updatedTrx);
  };

  const tarikTabungan = (
    siswaId: string,
    nominal: number,
    keterangan?: string,
    petugas?: string,
    tanggal?: string
  ) => {
    if (nominal <= 0)
      return { success: false, message: "Nominal penarikan harus lebih dari Rp 0" };
    const targetTabungan = tabunganList.find((t) => t.siswaId === siswaId);
    if (!targetTabungan || targetTabungan.saldo < nominal) {
      return {
        success: false,
        message: "Saldo tabungan siswa tidak mencukupi untuk penarikan ini!",
      };
    }

    const today = tanggal || new Date().toISOString().split("T")[0];
    const newSaldo = targetTabungan.saldo - nominal;

    const updatedTabungan = tabunganList.map((t) =>
      t.siswaId === siswaId ? { ...t, saldo: newSaldo, terakhirUpdate: today } : t
    );

    const newTrx: TransaksiTabungan = {
      id: `trx-${Date.now()}`,
      tabunganId: targetTabungan.id,
      siswaId: targetTabungan.siswaId,
      siswaNama: targetTabungan.siswaNama,
      nisn: targetTabungan.nisn,
      kelas: targetTabungan.kelas,
      tipe: "Tarik",
      nominal,
      saldoAkhir: newSaldo,
      tanggal: today,
      keterangan: keterangan || "Penarikan tabungan siswa",
      petugas: petugas || "Petugas Tata Usaha",
      noReferensi: `TR-${today.replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
    };

    const updatedTrx = [newTrx, ...transaksiTabunganList];
    setTabunganList(updatedTabungan);
    setTransaksiTabunganList(updatedTrx);
    saveState("tabungan", updatedTabungan);
    saveState("transaksi_tabungan", updatedTrx);

    return { success: true };
  };

  const bulkSetorTabungan = (
    items: { siswaId: string; nominal: number; keterangan?: string }[],
    petugas?: string,
    tanggal?: string
  ) => {
    const today = tanggal || new Date().toISOString().split("T")[0];
    const validItems = items.filter((item) => item.nominal > 0);
    if (validItems.length === 0) return;

    let currentTabungan = [...tabunganList];
    const newTransactions: TransaksiTabungan[] = [];

    validItems.forEach((item, idx) => {
      const siswa = siswaList.find((s) => s.id === item.siswaId);
      if (!siswa) return;

      const existingIndex = currentTabungan.findIndex((t) => t.siswaId === item.siswaId);
      let newSaldo = item.nominal;
      let tabId = `tab-${Date.now()}-${idx}`;

      if (existingIndex >= 0) {
        newSaldo = currentTabungan[existingIndex].saldo + item.nominal;
        tabId = currentTabungan[existingIndex].id;
        currentTabungan[existingIndex] = {
          ...currentTabungan[existingIndex],
          saldo: newSaldo,
          terakhirUpdate: today,
        };
      } else {
        const newTab: TabunganSiswa = {
          id: tabId,
          siswaId: siswa.id,
          siswaNama: siswa.nama,
          nisn: siswa.nisn,
          kelas: siswa.kelas,
          saldo: item.nominal,
          terakhirUpdate: today,
        };
        currentTabungan = [newTab, ...currentTabungan];
      }

      newTransactions.push({
        id: `trx-${Date.now()}-${idx}`,
        tabunganId: tabId,
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
        tipe: "Setor",
        nominal: item.nominal,
        saldoAkhir: newSaldo,
        tanggal: today,
        keterangan: item.keterangan || "Setoran tabungan kelas (Bulk)",
        petugas: petugas || "Dewan Guru / Petugas",
        noReferensi: `BK-${today.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}-${idx + 1}`,
      });
    });

    const updatedTrx = [...newTransactions, ...transaksiTabunganList];
    setTabunganList(currentTabungan);
    setTransaksiTabunganList(updatedTrx);
    saveState("tabungan", currentTabungan);
    saveState("transaksi_tabungan", updatedTrx);
  };

  const clearAllTabungan = async (): Promise<void> => {
    setTabunganList([]);
    setTransaksiTabunganList([]);
    saveState("tabungan", []);
    saveState("transaksi_tabungan", []);
    if (SupabaseSchoolService.isConfigured()) {
      try {
        const client = (await import("@/lib/supabase/client")).getSupabaseBrowserClient();
        if (client) {
          await client.from("transaksi_tabungan").delete().neq("id", "___none___");
          await client.from("tabungan_siswa").delete().neq("id", "___none___");
        }
      } catch (err) {
        console.warn("Gagal menghapus data tabungan di Supabase:", err);
      }
    }
  };

  // SPP & Transportasi Actions
  const getStudentSPPTransportRecord = (siswaId: string, tahunAjaran: string): RecordSPPTransportTahunAjaran => {
    const existing = sppTransportRecords.find(
      (r) => r.siswaId === siswaId && r.tahunAjaran === tahunAjaran
    );
    if (existing) return existing;

    const targetSiswa = siswaList.find((s) => s.id === siswaId);
    if (!targetSiswa) {
      throw new Error("Siswa tidak ditemukan");
    }
    const transportCfg = pesertaTransportList.find((t) => t.siswaId === siswaId);
    const isTransport = transportCfg ? transportCfg.isAktif : false;
    const biayaTransport = transportCfg ? transportCfg.biayaBulanan : 100000;
    const newRecord = generateStudentYearRecord(targetSiswa, tahunAjaran, isTransport, biayaTransport, 0);

    const updated = [newRecord, ...sppTransportRecords];
    setSppTransportRecords(updated);
    saveState("spp_transport_records", updated);
    return newRecord;
  };

  const updatePesertaTransport = (
    siswaId: string,
    isAktif: boolean,
    biayaBulanan: number = 100000,
    rute: string = "-"
  ) => {
    const existingIndex = pesertaTransportList.findIndex((t) => t.siswaId === siswaId);
    let updatedList: PesertaTransportasi[];
    if (existingIndex >= 0) {
      updatedList = pesertaTransportList.map((t) =>
        t.siswaId === siswaId ? { ...t, isAktif, biayaBulanan, rute } : t
      );
    } else {
      updatedList = [...pesertaTransportList, { siswaId, isAktif, biayaBulanan, rute }];
    }
    setPesertaTransportList(updatedList);
    saveState("peserta_transport", updatedList);

    // Update ongoing SPPTransportRecords that haven't been paid for transport
    const updatedRecords = sppTransportRecords.map((rec) => {
      if (rec.siswaId !== siswaId) return rec;
      const updatedBulan = { ...rec.bulan };
      (Object.keys(updatedBulan) as BulanSPP[]).forEach((b) => {
        const item = updatedBulan[b];
        if (item.transportStatus !== "Lunas") {
          updatedBulan[b] = {
            ...item,
            isTransport: isAktif,
            transportNominal: isAktif ? biayaBulanan : 0,
            transportStatus: isAktif ? "Belum Bayar" : "Tidak Menggunakan",
          };
        } else {
          updatedBulan[b] = {
            ...item,
            isTransport: isAktif,
          };
        }
      });
      return { ...rec, bulan: updatedBulan };
    });
    setSppTransportRecords(updatedRecords);
    saveState("spp_transport_records", updatedRecords);
  };

  const bayarSPPTransport = (params: {
    siswaId: string;
    tahunAjaran: string;
    jenis: "SPP" | "Transportasi" | "Paket Keduanya";
    bulan: BulanSPP[];
    metodePembayaran: MetodePembayaranTagihan;
    tanggalBayar?: string;
    petugas?: string;
    keterangan?: string;
  }): { success: boolean; message?: string; noKuitansi?: string } => {
    const targetSiswa = siswaList.find((s) => s.id === params.siswaId);
    if (!targetSiswa) return { success: false, message: "Siswa tidak ditemukan" };

    const record = getStudentSPPTransportRecord(params.siswaId, params.tahunAjaran);
    const today = params.tanggalBayar || new Date().toISOString().split("T")[0];
    const noKwt = `KW-${params.jenis === "SPP" ? "SPP" : params.jenis === "Transportasi" ? "TRN" : "BYR"}-${params.tahunAjaran.replace("/", "")}-${Date.now().toString().slice(-6)}`;

    // Hitung total nominal yang perlu dibayar
    let totalNominal = 0;
    const bulanCopy = { ...record.bulan };

    params.bulan.forEach((b) => {
      const current = bulanCopy[b];
      if (!current) return;
      if (params.jenis === "SPP" || params.jenis === "Paket Keduanya") {
        if (current.sppStatus !== "Lunas") {
          totalNominal += current.sppNominal; // Rp 100.000 / bulan
        }
      }
      if (params.jenis === "Transportasi" || params.jenis === "Paket Keduanya") {
        if (current.isTransport && current.transportStatus !== "Lunas") {
          totalNominal += current.transportNominal;
        }
      }
    });

    if (totalNominal <= 0) {
      return { success: false, message: "Bulan yang dipilih sudah lunas seluruhnya." };
    }

    // Jika metode pembayaran potong tabungan siswa
    if (params.metodePembayaran === "Potong Tabungan Siswa") {
      const studentTab = tabunganList.find((t) => t.siswaId === params.siswaId);
      const studentSaldo = studentTab ? studentTab.saldo : 0;
      if (studentSaldo < totalNominal) {
        return {
          success: false,
          message: `Saldo tabungan siswa tidak mencukupi (Saldo: Rp ${studentSaldo.toLocaleString("id-ID")}, Total Tagihan: Rp ${totalNominal.toLocaleString("id-ID")})`,
        };
      }
      tarikTabungan(
        params.siswaId,
        totalNominal,
        `Pembayaran ${params.jenis} ${params.bulan.join(", ")} (${params.tahunAjaran})`,
        params.petugas || "Sistem Autodebet SPP",
        today
      );
    }

    // Perbarui record bulan
    params.bulan.forEach((b) => {
      const cur = bulanCopy[b];
      if (!cur) return;
      const newCur = { ...cur };

      if (params.jenis === "SPP" || params.jenis === "Paket Keduanya") {
        newCur.sppStatus = "Lunas";
        newCur.sppTanggalBayar = today;
        newCur.sppMetode = params.metodePembayaran;
        newCur.sppNoKuitansi = noKwt;
      }

      if (params.jenis === "Transportasi" || params.jenis === "Paket Keduanya") {
        if (cur.isTransport) {
          newCur.transportStatus = "Lunas";
          newCur.transportTanggalBayar = today;
          newCur.transportMetode = params.metodePembayaran;
          newCur.transportNoKuitansi = noKwt;
        }
      }

      bulanCopy[b] = newCur;
    });

    const updatedRecord: RecordSPPTransportTahunAjaran = {
      ...record,
      bulan: bulanCopy,
    };

    const newRecords = sppTransportRecords.map((r) =>
      r.siswaId === params.siswaId && r.tahunAjaran === params.tahunAjaran ? updatedRecord : r
    );
    const exists = newRecords.some(
      (r) => r.siswaId === params.siswaId && r.tahunAjaran === params.tahunAjaran
    );
    const finalRecords = exists ? newRecords : [updatedRecord, ...newRecords];

    setSppTransportRecords(finalRecords);
    saveState("spp_transport_records", finalRecords);

    // Tambah log mutasi kuitansi
    const newTrx: TransaksiSPPTransport = {
      id: `trx-spp-${Date.now()}`,
      noKuitansi: noKwt,
      siswaId: targetSiswa.id,
      siswaNama: targetSiswa.nama,
      nisn: targetSiswa.nisn,
      kelas: targetSiswa.kelas,
      tahunAjaran: params.tahunAjaran,
      jenis: params.jenis,
      bulan: params.bulan,
      totalNominal,
      metodePembayaran: params.metodePembayaran,
      tanggalBayar: today,
      petugas: params.petugas || "Petugas Keuangan",
      keterangan: params.keterangan || `Pembayaran ${params.jenis} ${params.bulan.join(", ")}`,
    };

    const updatedTrx = [newTrx, ...transaksiSPPTransportList];
    setTransaksiSPPTransportList(updatedTrx);
    saveState("transaksi_spp_transport", updatedTrx);

    return {
      success: true,
      message: `Pembayaran ${params.jenis} untuk ${params.bulan.length} bulan berhasil disimpan!`,
      noKuitansi: noKwt,
    };
  };

  const bulkBayarSPPTransportDariTabungan = (params: {
    kelas?: string;
    tahunAjaran: string;
    bulan: BulanSPP;
    jenis: "SPP" | "Transportasi" | "Paket Keduanya";
    petugas?: string;
  }): {
    successCount: number;
    skippedCount: number;
    insufficientCount: number;
    totalAmount: number;
    insufficientNames: string[];
  } => {
    let successCount = 0;
    let skippedCount = 0;
    let insufficientCount = 0;
    let totalAmount = 0;
    const insufficientNames: string[] = [];

    const targetStudents = siswaList.filter(
      (s) =>
        !params.kelas ||
        params.kelas === "Semua" ||
        s.kelas.toLowerCase() === params.kelas.toLowerCase()
    );

    targetStudents.forEach((s) => {
      const rec = getStudentSPPTransportRecord(s.id, params.tahunAjaran);
      const detail = rec.bulan[params.bulan];
      const transCfg = pesertaTransportList.find((t) => t.siswaId === s.id);
      const isTrans = transCfg ? transCfg.isAktif : false;

      const needsSPP =
        (params.jenis === "SPP" || params.jenis === "Paket Keduanya") &&
        detail.sppStatus !== "Lunas";
      const needsTrans =
        (params.jenis === "Transportasi" || params.jenis === "Paket Keduanya") &&
        isTrans &&
        detail.transportStatus !== "Lunas";

      if (!needsSPP && !needsTrans) {
        skippedCount++;
        return;
      }

      let required = 0;
      if (needsSPP) required += detail.sppNominal;
      if (needsTrans) required += detail.transportNominal;

      const studentTab = tabunganList.find((t) => t.siswaId === s.id);
      const studentSaldo = studentTab ? studentTab.saldo : 0;

      if (studentSaldo < required) {
        insufficientCount++;
        insufficientNames.push(
          `${s.nama} (${s.kelas}) - Saldo: Rp ${studentSaldo.toLocaleString("id-ID")}`
        );
        return;
      }

      const res = bayarSPPTransport({
        siswaId: s.id,
        tahunAjaran: params.tahunAjaran,
        jenis: needsSPP && needsTrans ? "Paket Keduanya" : needsSPP ? "SPP" : "Transportasi",
        bulan: [params.bulan],
        metodePembayaran: "Potong Tabungan Siswa",
        petugas: params.petugas || "Autodebet Kas Rombel",
        keterangan: `Autodebet ${params.jenis} bulan ${params.bulan} dari tabungan`,
      });

      if (res.success) {
        successCount++;
        totalAmount += required;
      }
    });

    return {
      successCount,
      skippedCount,
      insufficientCount,
      totalAmount,
      insufficientNames,
    };
  };

  // LMS Action Handlers
  const addMateri = (materiData: Omit<LMSMateri, "id" | "createdAt" | "sudahDibacaSiswaIds">): LMSMateri => {
    const newMateri: LMSMateri = {
      ...materiData,
      id: `mat-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      sudahDibacaSiswaIds: [],
    };
    const updated = [newMateri, ...lmsMateriList];
    setLmsMateriList(updated);
    saveState("lms_materi", updated);
    return newMateri;
  };

  const updateMateri = (id: string, data: Partial<LMSMateri>) => {
    const updated = lmsMateriList.map((m) => (m.id === id ? { ...m, ...data } : m));
    setLmsMateriList(updated);
    saveState("lms_materi", updated);
  };

  const deleteMateri = (id: string) => {
    recordDeletedId(id);
    const updated = lmsMateriList.filter((m) => m.id !== id);
    latestDataRef.current.lmsMateriList = updated;
    setLmsMateriList(updated);
    saveState("lms_materi", updated);
    persistSupabase(() => SupabaseSchoolService.deleteLMSMateri(id));
  };

  const toggleBacaMateri = (materiId: string, siswaId: string) => {
    const updated = lmsMateriList.map((m) => {
      if (m.id !== materiId) return m;
      const already = m.sudahDibacaSiswaIds.includes(siswaId);
      const newIds = already
        ? m.sudahDibacaSiswaIds.filter((sid) => sid !== siswaId)
        : [...m.sudahDibacaSiswaIds, siswaId];
      return { ...m, sudahDibacaSiswaIds: newIds };
    });
    setLmsMateriList(updated);
    saveState("lms_materi", updated);
  };

  const addTugas = (tugasData: Omit<LMSTugas, "id" | "createdAt">): LMSTugas => {
    const newTugas: LMSTugas = {
      ...tugasData,
      id: `tgs-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    removeDeletedId(newTugas.id);
    const updated = [newTugas, ...lmsTugasList];
    latestDataRef.current.lmsTugasList = updated;
    setLmsTugasList(updated);
    saveState("lms_tugas", updated);
    return newTugas;
  };

  const updateTugas = (id: string, data: Partial<LMSTugas>) => {
    const updated = lmsTugasList.map((t) => (t.id === id ? { ...t, ...data } : t));
    latestDataRef.current.lmsTugasList = updated;
    setLmsTugasList(updated);
    saveState("lms_tugas", updated);
  };

  const deleteTugas = (id: string) => {
    recordDeletedId(id);
    const updated = lmsTugasList.filter((t) => t.id !== id);
    latestDataRef.current.lmsTugasList = updated;
    setLmsTugasList(updated);
    saveState("lms_tugas", updated);
    persistSupabase(() => SupabaseSchoolService.deleteLMSTugas(id));
  };

  const submitTugas = (data: {
    tugasId: string;
    siswaId: string;
    siswaNama: string;
    siswaNisn: string;
    kelas: string;
    catatanSiswa: string;
    fileJawabanUrl?: string;
  }): LMSSubmission => {
    const now = new Date();
    const targetTugas = lmsTugasList.find((t) => t.id === data.tugasId);
    let status: StatusSubmission = "Diserahkan";
    if (targetTugas?.deadline) {
      const deadlineDate = new Date(targetTugas.deadline);
      if (now > deadlineDate) {
        status = "Terlambat";
      }
    }
    const existingIndex = lmsSubmissionList.findIndex(
      (s) => s.tugasId === data.tugasId && s.siswaId === data.siswaId
    );
    let updated: LMSSubmission[];
    let resSubmission: LMSSubmission;
    const formattedDate = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
    if (existingIndex >= 0) {
      resSubmission = {
        ...lmsSubmissionList[existingIndex],
        ...data,
        tanggalKumpul: formattedDate,
        status,
      };
      updated = [...lmsSubmissionList];
      updated[existingIndex] = resSubmission;
    } else {
      resSubmission = {
        id: `sub-${Date.now()}`,
        ...data,
        tanggalKumpul: formattedDate,
        status,
      };
      updated = [resSubmission, ...lmsSubmissionList];
    }
    setLmsSubmissionList(updated);
    saveState("lms_submissions", updated);
    return resSubmission;
  };

  const nilaiSubmission = (submissionId: string, nilai: number, feedback?: string) => {
    const formattedDate = new Date().toISOString().split("T")[0];
    const updated = lmsSubmissionList.map((s) => {
      if (s.id !== submissionId) return s;
      return {
        ...s,
        nilai,
        feedbackGuru: feedback || s.feedbackGuru,
        status: "Dinilai" as StatusSubmission,
        dinilaiPada: formattedDate,
      };
    });
    setLmsSubmissionList(updated);
    saveState("lms_submissions", updated);
  };

  const addKuis = (kuisData: Omit<LMSKuis, "id" | "createdAt">): LMSKuis => {
    const newKuis: LMSKuis = {
      ...kuisData,
      id: `quiz-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    removeDeletedId(newKuis.id);
    const updated = [newKuis, ...lmsKuisList];
    latestDataRef.current.lmsKuisList = updated;
    setLmsKuisList(updated);
    saveState("lms_kuis", updated);
    return newKuis;
  };

  const deleteKuis = (id: string) => {
    recordDeletedId(id);
    const updated = lmsKuisList.filter((q) => q.id !== id);
    latestDataRef.current.lmsKuisList = updated;
    setLmsKuisList(updated);
    saveState("lms_kuis", updated);
    persistSupabase(() => SupabaseSchoolService.deleteLMSKuis(id));
  };

  const submitKuisAttempt = (attemptData: Omit<LMSKuisAttempt, "id" | "selesaiPada">): LMSKuisAttempt => {
    const formattedDate = `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().slice(0, 5)}`;
    const newAttempt: LMSKuisAttempt = {
      ...attemptData,
      id: `att-${Date.now()}`,
      selesaiPada: formattedDate,
    };
    const updated = [newAttempt, ...lmsKuisAttemptList];
    setLmsKuisAttemptList(updated);
    saveState("lms_attempts", updated);
    return newAttempt;
  };

  const addForumTopik = (topikData: Omit<LMSForumDiskusi, "id" | "tanggal" | "komentarList">): LMSForumDiskusi => {
    const formattedDate = `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().slice(0, 5)}`;
    const newTopik: LMSForumDiskusi = {
      ...topikData,
      id: `frm-${Date.now()}`,
      tanggal: formattedDate,
      komentarList: [],
    };
    const updated = [newTopik, ...lmsForumList];
    setLmsForumList(updated);
    saveState("lms_forum", updated);
    return newTopik;
  };

  const addKomentarForum = (topikId: string, komentarData: Omit<LMSKomentarForum, "id" | "tanggal">) => {
    const formattedDate = `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().slice(0, 5)}`;
    const newKomentar: LMSKomentarForum = {
      ...komentarData,
      id: `kom-${Date.now()}`,
      tanggal: formattedDate,
    };
    const updated = lmsForumList.map((f) => {
      if (f.id !== topikId) return f;
      return {
        ...f,
        komentarList: [...f.komentarList, newKomentar],
      };
    });
    setLmsForumList(updated);
    saveState("lms_forum", updated);
  };

  const addMeeting = (meetingData: Omit<LMSVirtualMeeting, "id">): LMSVirtualMeeting => {
    const newMeeting: LMSVirtualMeeting = {
      ...meetingData,
      id: `meet-${Date.now()}`,
    };
    removeDeletedId(newMeeting.id);
    const updated = [newMeeting, ...lmsMeetingList];
    latestDataRef.current.lmsMeetingList = updated;
    setLmsMeetingList(updated);
    saveState("lms_meetings", updated);
    return newMeeting;
  };

  const deleteMeeting = (id: string) => {
    recordDeletedId(id);
    const updated = lmsMeetingList.filter((m) => m.id !== id);
    latestDataRef.current.lmsMeetingList = updated;
    setLmsMeetingList(updated);
    saveState("lms_meetings", updated);
    persistSupabase(() => SupabaseSchoolService.deleteLMSMeeting(id));
  };

  // Bank Soal Handlers
  const addBankSoal = (bankData: Omit<LMSBankSoal, "id" | "createdAt">): LMSBankSoal => {
    const newBank: LMSBankSoal = {
      ...bankData,
      id: `pkt-bs-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    removeDeletedId(newBank.id);
    const updated = [newBank, ...lmsBankSoalList];
    latestDataRef.current.lmsBankSoalList = updated;
    setLmsBankSoalList(updated);
    saveState("lms_bank_soal", updated);
    return newBank;
  };

  const updateBankSoal = (id: string, updatedData: Partial<LMSBankSoal>) => {
    const updated = lmsBankSoalList.map((b) =>
      b.id === id ? { ...b, ...updatedData, updatedAt: new Date().toISOString().split("T")[0] } : b
    );
    latestDataRef.current.lmsBankSoalList = updated;
    setLmsBankSoalList(updated);
    saveState("lms_bank_soal", updated);
  };

  const deleteBankSoal = (id: string) => {
    recordDeletedId(id);
    const updated = lmsBankSoalList.filter((b) => b.id !== id);
    latestDataRef.current.lmsBankSoalList = updated;
    setLmsBankSoalList(updated);
    saveState("lms_bank_soal", updated);
    persistSupabase(() => SupabaseSchoolService.deleteLMSBankSoal(id));
  };

  const addSoalToBank = (bankId: string, soalData: Omit<LMSBankSoalItem, "id">) => {
    const newSoal: LMSBankSoalItem = {
      ...soalData,
      id: `bs-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = lmsBankSoalList.map((b) => {
      if (b.id === bankId) {
        return {
          ...b,
          soalList: [...b.soalList, newSoal],
          updatedAt: new Date().toISOString().split("T")[0],
        };
      }
      return b;
    });
    setLmsBankSoalList(updated);
    saveState("lms_bank_soal", updated);
  };

  const updateSoalInBank = (bankId: string, soalId: string, updatedSoal: Partial<LMSBankSoalItem>) => {
    const updated = lmsBankSoalList.map((b) => {
      if (b.id === bankId) {
        return {
          ...b,
          soalList: b.soalList.map((s) => (s.id === soalId ? { ...s, ...updatedSoal } : s)),
          updatedAt: new Date().toISOString().split("T")[0],
        };
      }
      return b;
    });
    setLmsBankSoalList(updated);
    saveState("lms_bank_soal", updated);
  };

  const deleteSoalFromBank = (bankId: string, soalId: string) => {
    const updated = lmsBankSoalList.map((b) => {
      if (b.id === bankId) {
        return {
          ...b,
          soalList: b.soalList.filter((s) => s.id !== soalId),
          updatedAt: new Date().toISOString().split("T")[0],
        };
      }
      return b;
    });
    setLmsBankSoalList(updated);
    saveState("lms_bank_soal", updated);
  };

  const generateKuisFromBankSoal = (params: {
    judul: string;
    mapel: string;
    kelas: string;
    durasiMenit: number;
    kkm: number;
    deadline: string;
    deskripsi: string;
    soalItems: LMSBankSoalItem[];
    guruNama: string;
  }): LMSKuis => {
    const convertedSoalList = params.soalItems.map((b, idx) => ({
      id: `soal-gen-${Date.now()}-${idx + 1}`,
      pertanyaan: b.pertanyaan,
      pilihan: b.pilihan,
      kunciJawaban: b.kunciJawaban,
      pembahasan: b.pembahasan,
      poin: b.poinDefault || 20,
    }));

    const newKuis: LMSKuis = {
      id: `quiz-${Date.now()}`,
      judul: params.judul,
      mapel: params.mapel,
      kelas: params.kelas,
      guruNama: params.guruNama,
      durasiMenit: params.durasiMenit,
      kkm: params.kkm,
      deadline: params.deadline,
      deskripsi: params.deskripsi,
      soalList: convertedSoalList,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newKuis, ...lmsKuisList];
    setLmsKuisList(updated);
    saveState("lms_kuis", updated);
    return newKuis;
  };

  // LMS Jadwal Pelaksanaan Materi Actions
  const addJadwalMateri = (data: Omit<LMSJadwalMateri, "id">): LMSJadwalMateri => {
    const newItem: LMSJadwalMateri = {
      ...data,
      id: `jdw-mat-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    removeDeletedId(newItem.id);
    const updated = [newItem, ...lmsJadwalMateriList];
    latestDataRef.current.lmsJadwalMateriList = updated;
    setLmsJadwalMateriList(updated);
    saveState("lms_jadwal_materi", updated);
    return newItem;
  };

  const updateJadwalMateri = (id: string, data: Partial<LMSJadwalMateri>) => {
    const updated = lmsJadwalMateriList.map((item) => (item.id === id ? { ...item, ...data } : item));
    latestDataRef.current.lmsJadwalMateriList = updated;
    setLmsJadwalMateriList(updated);
    saveState("lms_jadwal_materi", updated);
  };

  const deleteJadwalMateri = (id: string) => {
    recordDeletedId(id);
    const updated = lmsJadwalMateriList.filter((item) => item.id !== id);
    latestDataRef.current.lmsJadwalMateriList = updated;
    setLmsJadwalMateriList(updated);
    saveState("lms_jadwal_materi", updated);
    persistSupabase(() => SupabaseSchoolService.deleteLMSJadwalMateri(id));
  };

  const toggleRealisasiJadwal = (
    id: string,
    payload?: {
      sudahDiajarkan?: boolean;
      catatanPembelajaran?: string;
      tanggalRealisasi?: string;
      jamRealisasi?: string;
      guruPengajar?: string;
    }
  ) => {
    const updated = lmsJadwalMateriList.map((item) => {
      if (item.id !== id) return item;
      const nextStatus = payload?.sudahDiajarkan !== undefined ? payload.sudahDiajarkan : !item.sudahDiajarkan;
      return {
        ...item,
        sudahDiajarkan: nextStatus,
        tanggalRealisasi: nextStatus
          ? payload?.tanggalRealisasi || item.tanggalRealisasi || new Date().toISOString().split("T")[0]
          : undefined,
        jamRealisasi: nextStatus
          ? payload?.jamRealisasi || item.jamRealisasi || "08.00 - 09.30 WIB"
          : undefined,
        guruPengajar: nextStatus
          ? payload?.guruPengajar || item.guruPengajar || "Ust. Pengampu"
          : undefined,
        catatanPembelajaran: payload?.catatanPembelajaran !== undefined
          ? payload.catatanPembelajaran
          : item.catatanPembelajaran,
      };
    });
    setLmsJadwalMateriList(updated);
    saveState("lms_jadwal_materi", updated);
  };

  // ==================== TAHFIDZ & TAHZIN METHODS ====================
  const addTahfidzRecord = (record: Omit<TahfidzRecord, "id" | "createdAt">) => {
    const newRecord: TahfidzRecord = {
      ...record,
      id: `thf-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      createdAt: new Date().toISOString(),
    };
    removeDeletedId(newRecord.id);
    const updated = [newRecord, ...tahfidzList];
    latestDataRef.current.tahfidzList = updated;
    setTahfidzList(updated);
    saveState("tahfidz", updated);
    persistSupabase(() => SupabaseSchoolService.upsertTahfidzRecord(newRecord));
  };

  const updateTahfidzRecord = (id: string, data: Partial<TahfidzRecord>) => {
    const updated = tahfidzList.map((t) => (t.id === id ? { ...t, ...data } : t));
    latestDataRef.current.tahfidzList = updated;
    setTahfidzList(updated);
    saveState("tahfidz", updated);
    const target = updated.find((t) => t.id === id);
    if (target) {
      persistSupabase(() => SupabaseSchoolService.upsertTahfidzRecord(target));
    }
  };

  const deleteTahfidzRecord = (id: string) => {
    recordDeletedId(id);
    const updated = tahfidzList.filter((t) => t.id !== id);
    latestDataRef.current.tahfidzList = updated;
    setTahfidzList(updated);
    saveState("tahfidz", updated);
    persistSupabase(() => SupabaseSchoolService.deleteTahfidzRecord(id));
  };

  // ==================== MUTABA'AH YAUMIYAH METHODS ====================
  const addOrUpdateMutabaahRecord = (record: Omit<MutabaahRecord, "id" | "createdAt">) => {
    const existingIndex = mutabaahList.findIndex(
      (m) => m.siswaId === record.siswaId && m.tanggal === record.tanggal
    );

    if (existingIndex >= 0) {
      const existing = mutabaahList[existingIndex];
      const updatedRecord: MutabaahRecord = {
        ...existing,
        ...record,
      };
      const updatedList = [...mutabaahList];
      updatedList[existingIndex] = updatedRecord;
      setMutabaahList(updatedList);
      saveState("mutabaah", updatedList);
      persistSupabase(() => SupabaseSchoolService.upsertMutabaahRecord(updatedRecord));
    } else {
      const newRecord: MutabaahRecord = {
        ...record,
        id: `mtb-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
        createdAt: new Date().toISOString(),
      };
      const updatedList = [newRecord, ...mutabaahList];
      setMutabaahList(updatedList);
      saveState("mutabaah", updatedList);
      persistSupabase(() => SupabaseSchoolService.upsertMutabaahRecord(newRecord));
    }
  };

  const batchAddOrUpdateMutabaahRecords = (records: Array<Omit<MutabaahRecord, "id" | "createdAt">>) => {
    let updatedList = [...mutabaahList];
    const recordsToPersist: MutabaahRecord[] = [];

    records.forEach((record) => {
      const existingIndex = updatedList.findIndex(
        (m) => m.siswaId === record.siswaId && m.tanggal === record.tanggal
      );

      if (existingIndex >= 0) {
        const existing = updatedList[existingIndex];
        const updatedRecord: MutabaahRecord = {
          ...existing,
          ...record,
        };
        updatedList[existingIndex] = updatedRecord;
        recordsToPersist.push(updatedRecord);
      } else {
        const newRecord: MutabaahRecord = {
          ...record,
          id: `mtb-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          createdAt: new Date().toISOString(),
        };
        updatedList = [newRecord, ...updatedList];
        recordsToPersist.push(newRecord);
      }
    });

    setMutabaahList(updatedList);
    saveState("mutabaah", updatedList);
    persistSupabase(async () => {
      for (const rec of recordsToPersist) {
        await SupabaseSchoolService.upsertMutabaahRecord(rec);
      }
      return true;
    });
  };

  const verifyMutabaahRecord = (
    id: string,
    guruNama: string,
    catatan?: string,
    status: "Terverifikasi Guru" | "Diberi Bintang Kebaikan" = "Terverifikasi Guru"
  ) => {
    const updated = mutabaahList.map((m) =>
      m.id === id
        ? {
            ...m,
            statusVerifikasi: status,
            verifiedByGuru: guruNama,
            catatanGuru: catatan || m.catatanGuru,
          }
        : m
    );
    setMutabaahList(updated);
    saveState("mutabaah", updated);
    const target = updated.find((m) => m.id === id);
    if (target) {
      persistSupabase(() => SupabaseSchoolService.upsertMutabaahRecord(target));
    }
  };

  const deleteMutabaahRecord = (id: string) => {
    recordDeletedId(id);
    const updated = mutabaahList.filter((m) => m.id !== id);
    latestDataRef.current.mutabaahList = updated;
    setMutabaahList(updated);
    saveState("mutabaah", updated);
    persistSupabase(() => SupabaseSchoolService.deleteMutabaahRecord(id));
  };

  const resetToDefault = () => {
    setProfile(INITIAL_SCHOOL_PROFILE);
    setSiswaList(INITIAL_SISWA);
    setGuruList(INITIAL_GURU);
    setKelasList(INITIAL_KELAS);
    setMapelList(INITIAL_MAPEL);
    setJadwalList(INITIAL_JADWAL);
    setPresensiList(INITIAL_PRESENSI);
    setNilaiList(INITIAL_NILAI);
    setSppList(INITIAL_SPP);
    setJenisTagihanList(INITIAL_JENIS_TAGIHAN);
    setPengumumanList(INITIAL_PENGUMUMAN);
    setTabunganList(INITIAL_TABUNGAN);
    setTransaksiTabunganList(INITIAL_TRANSAKSI_TABUNGAN);
    setPesertaTransportList(INITIAL_PESERTA_TRANSPORT);
    setSppTransportRecords(INITIAL_SPP_TRANSPORT_RECORDS);
    setTransaksiSPPTransportList(INITIAL_TRANSAKSI_SPP_TRANSPORT);

    // Reset LMS Data
    setLmsMateriList(INITIAL_LMS_MATERI);
    setLmsTugasList(INITIAL_LMS_TUGAS);
    setLmsSubmissionList(INITIAL_LMS_SUBMISSIONS);
    setLmsKuisList(INITIAL_LMS_KUIS);
    setLmsKuisAttemptList(INITIAL_LMS_ATTEMPTS);
    setLmsForumList(INITIAL_LMS_FORUM);
    setLmsMeetingList(INITIAL_LMS_MEETINGS);
    setLmsBankSoalList(INITIAL_LMS_BANK_SOAL);
    setLmsJadwalMateriList(INITIAL_LMS_JADWAL_MATERI);

    // Reset Islamic School Data
    setTahfidzList(INITIAL_TAHFIDZ_RECORDS);
    setMutabaahList(INITIAL_MUTABAAH_RECORDS);

    if (typeof window !== "undefined") {
      localStorage.clear();
      localStorage.removeItem("sim_database_cleared");
      localStorage.removeItem("sim_deleted_ids");
    }
  };

  // ==================== KOSONGKAN SEMUA DATABASE (100% BERSIH) ====================
  const clearAllDatabase = async (options?: { syncToCloud?: boolean }): Promise<void> => {
    // 1. Emergency snapshot in case of accidental clear
    try {
      if (typeof window !== "undefined") {
        const emergencySnapshot = {
          savedAt: new Date().toISOString(),
          state: latestDataRef.current,
        };
        localStorage.setItem("sim_emergency_snapshot_pre_clear", JSON.stringify(emergencySnapshot));
      }
    } catch (e) {
      console.warn("Emergency pre-clear snapshot warning:", e);
    }

    // 2. Set all in-memory lists to empty arrays
    setSiswaList([]);
    setGuruList([]);
    setKelasList([]);
    setMapelList([]);
    setJadwalList([]);
    setPresensiList([]);
    setNilaiList([]);
    setJenisTagihanList([]);
    setSppList([]);
    setTabunganList([]);
    setTransaksiTabunganList([]);
    setPesertaTransportList([]);
    setSppTransportRecords([]);
    setTransaksiSPPTransportList([]);
    setPengumumanList([]);
    setLmsMateriList([]);
    setLmsTugasList([]);
    setLmsSubmissionList([]);
    setLmsKuisList([]);
    setLmsKuisAttemptList([]);
    setLmsForumList([]);
    setLmsMeetingList([]);
    setLmsBankSoalList([]);
    setLmsJadwalMateriList([]);
    setTahfidzList([]);
    setMutabaahList([]);

    // 3. Update live ref
    latestDataRef.current = {
      ...latestDataRef.current,
      siswaList: [],
      guruList: [],
      kelasList: [],
      mapelList: [],
      jadwalList: [],
      presensiList: [],
      nilaiList: [],
      jenisTagihanList: [],
      sppList: [],
      tabunganList: [],
      transaksiTabunganList: [],
      pesertaTransportList: [],
      sppTransportRecords: [],
      transaksiSPPTransportList: [],
      pengumumanList: [],
      lmsMateriList: [],
      lmsTugasList: [],
      lmsSubmissionList: [],
      lmsKuisList: [],
      lmsKuisAttemptList: [],
      lmsForumList: [],
      lmsMeetingList: [],
      lmsBankSoalList: [],
      lmsJadwalMateriList: [],
      tahfidzList: [],
      mutabaahList: [],
    };

    // 4. Mark database as explicitly cleared in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sim_database_cleared", "true");
      localStorage.removeItem("sim_deleted_ids");
      const keysToClear = [
        "siswa",
        "guru",
        "kelas",
        "mapel",
        "jadwal",
        "presensi",
        "nilai",
        "jenis_tagihan",
        "spp",
        "tabungan",
        "transaksi_tabungan",
        "peserta_transport",
        "spp_transport_records",
        "transaksi_spp_transport",
        "pengumuman",
        "lms_materi",
        "lms_tugas",
        "lms_submissions",
        "lms_kuis",
        "lms_attempts",
        "lms_forum",
        "lms_meetings",
        "lms_bank_soal",
        "lms_jadwal_materi",
        "tahfidz",
        "mutabaah",
      ];
      keysToClear.forEach((k) => {
        localStorage.setItem(`sim_data_${k}`, JSON.stringify([]));
      });
    }

    // 5. Cloud Supabase clear if connected
    const shouldSync = options?.syncToCloud ?? (isSupabaseConnected && SupabaseSchoolService.isConfigured());
    if (shouldSync && SupabaseSchoolService.isConfigured()) {
      try {
        await SupabaseSchoolService.clearAllSchoolData();
      } catch (err) {
        console.warn("Gagal mengosongkan Supabase Cloud:", err);
      }
    }
  };

  // ==================== BACKUP & RESTORE DATABASE ====================
  const exportDatabaseBackup = (options?: {
    exportedBy?: string;
  }): { success: boolean; filename: string; summary: DatabaseBackupSummary } => {
    const current = latestDataRef.current;

    let savedUsers: any[] = [];
    try {
      if (typeof window !== "undefined") {
        const rawUsers = localStorage.getItem("sim_auth_users");
        if (rawUsers) {
          savedUsers = JSON.parse(rawUsers);
        }
      }
    } catch (err) {
      console.warn("Could not read users for backup:", err);
    }

    const summary: DatabaseBackupSummary = {
      siswaCount: current.siswaList?.length || 0,
      guruCount: current.guruList?.length || 0,
      kelasCount: current.kelasList?.length || 0,
      mapelCount: current.mapelList?.length || 0,
      jadwalCount: current.jadwalList?.length || 0,
      presensiCount: current.presensiList?.length || 0,
      nilaiCount: current.nilaiList?.length || 0,
      jenisTagihanCount: current.jenisTagihanList?.length || 0,
      sppCount: current.sppList?.length || 0,
      tabunganCount: current.tabunganList?.length || 0,
      transaksiTabunganCount: current.transaksiTabunganList?.length || 0,
      pesertaTransportCount: current.pesertaTransportList?.length || 0,
      sppTransportCount: current.sppTransportRecords?.length || 0,
      pengumumanCount: current.pengumumanList?.length || 0,
      lmsMateriCount: current.lmsMateriList?.length || 0,
      lmsTugasCount: current.lmsTugasList?.length || 0,
      lmsKuisCount: current.lmsKuisList?.length || 0,
      lmsBankSoalCount: current.lmsBankSoalList?.length || 0,
      tahfidzCount: current.tahfidzList?.length || 0,
      mutabaahCount: current.mutabaahList?.length || 0,
      userCount: savedUsers.length,
    };

    const schoolName = current.profile?.namaSekolah || "SIM Sekolah PRO";
    const safeSchoolSlug = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 30);

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");
    const filename = `simpro_backup_${safeSchoolSlug}_${dateStr}_${timeStr}.json`;

    const backupPayload: DatabaseBackupFile = {
      version: "1.0",
      system: "SIM PRO - Sistem Informasi Manajemen Sekolah",
      appName: current.profile?.appName || "SIM Sekolah PRO",
      schoolName: schoolName,
      npsn: current.profile?.npsn || "",
      exportedAt: now.toISOString(),
      exportedBy: options?.exportedBy || "Administrator",
      summary,
      data: {
        profile: current.profile,
        siswa: current.siswaList || [],
        guru: current.guruList || [],
        kelas: current.kelasList || [],
        mapel: current.mapelList || [],
        jadwal: current.jadwalList || [],
        presensi: current.presensiList || [],
        nilai: current.nilaiList || [],
        jenisTagihan: current.jenisTagihanList || [],
        spp: current.sppList || [],
        tabungan: current.tabunganList || [],
        transaksiTabungan: current.transaksiTabunganList || [],
        pesertaTransport: current.pesertaTransportList || [],
        sppTransportRecords: current.sppTransportRecords || [],
        transaksiSPPTransport: current.transaksiSPPTransportList || [],
        pengumuman: current.pengumumanList || [],
        lmsMateri: current.lmsMateriList || [],
        lmsTugas: current.lmsTugasList || [],
        lmsSubmissions: current.lmsSubmissionList || [],
        lmsKuis: current.lmsKuisList || [],
        lmsAttempts: current.lmsKuisAttemptList || [],
        lmsForum: current.lmsForumList || [],
        lmsMeetings: current.lmsMeetingList || [],
        lmsBankSoal: current.lmsBankSoalList || [],
        lmsJadwalMateri: current.lmsJadwalMateriList || [],
        tahfidz: current.tahfidzList || [],
        mutabaah: current.mutabaahList || [],
        users: savedUsers,
      },
    };

    if (typeof window !== "undefined") {
      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { success: true, filename, summary };
  };

  const importDatabaseBackup = async (
    rawBackup: DatabaseBackupFile | any,
    options?: { syncToCloud?: boolean }
  ): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> => {
    if (!rawBackup || typeof rawBackup !== "object") {
      return { success: false, message: "File cadangan tidak valid (format data rusak)." };
    }

    const data = rawBackup.data ? rawBackup.data : rawBackup;

    if (
      !data.siswa &&
      !data.guru &&
      !data.kelas &&
      !data.profile &&
      !data.nilai &&
      !data.jadwal
    ) {
      return {
        success: false,
        message: "Format file tidak sesuai standar SIM Sekolah PRO. Pastikan memilih file cadangan .json yang benar.",
      };
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("sim_database_cleared");
      localStorage.removeItem("sim_deleted_ids");
    }

    // Emergency snapshot before restoring in case user wants to roll back
    try {
      if (typeof window !== "undefined") {
        const emergencySnapshot = {
          savedAt: new Date().toISOString(),
          state: latestDataRef.current,
        };
        localStorage.setItem("sim_emergency_snapshot_pre_restore", JSON.stringify(emergencySnapshot));
      }
    } catch (e) {
      console.warn("Emergency pre-restore snapshot warning:", e);
    }

    const restoredCounts: Record<string, number> = {};

    // 1. Profile
    if (data.profile) {
      setProfile(data.profile);
      latestDataRef.current.profile = data.profile;
      saveState("profile", data.profile, true);
      restoredCounts["Profil Sekolah"] = 1;
    }

    // 2. Siswa
    if (Array.isArray(data.siswa)) {
      setSiswaList(data.siswa);
      latestDataRef.current.siswaList = data.siswa;
      saveState("siswa", data.siswa, true);
      restoredCounts["Siswa"] = data.siswa.length;
    }

    // 3. Guru
    if (Array.isArray(data.guru)) {
      setGuruList(data.guru);
      latestDataRef.current.guruList = data.guru;
      saveState("guru", data.guru, true);
      restoredCounts["Guru & PTK"] = data.guru.length;
    }

    // 4. Kelas
    if (Array.isArray(data.kelas)) {
      setKelasList(data.kelas);
      latestDataRef.current.kelasList = data.kelas;
      saveState("kelas", data.kelas, true);
      restoredCounts["Kelas"] = data.kelas.length;
    }

    // 5. Mapel
    if (Array.isArray(data.mapel)) {
      setMapelList(data.mapel);
      latestDataRef.current.mapelList = data.mapel;
      saveState("mapel", data.mapel, true);
      restoredCounts["Mata Pelajaran"] = data.mapel.length;
    }

    // 6. Jadwal
    if (Array.isArray(data.jadwal)) {
      setJadwalList(data.jadwal);
      latestDataRef.current.jadwalList = data.jadwal;
      saveState("jadwal", data.jadwal, true);
      restoredCounts["Jadwal KBM"] = data.jadwal.length;
    }

    // 7. Presensi
    if (Array.isArray(data.presensi)) {
      setPresensiList(data.presensi);
      latestDataRef.current.presensiList = data.presensi;
      saveState("presensi", data.presensi, true);
      restoredCounts["Presensi"] = data.presensi.length;
    }

    // 8. Nilai
    if (Array.isArray(data.nilai)) {
      setNilaiList(data.nilai);
      latestDataRef.current.nilaiList = data.nilai;
      saveState("nilai", data.nilai, true);
      restoredCounts["Nilai Siswa"] = data.nilai.length;
    }

    // 9. Jenis Tagihan
    if (Array.isArray(data.jenisTagihan)) {
      setJenisTagihanList(data.jenisTagihan);
      latestDataRef.current.jenisTagihanList = data.jenisTagihan;
      saveState("jenis_tagihan", data.jenisTagihan, true);
    }

    // 10. SPP
    if (Array.isArray(data.spp)) {
      setSppList(data.spp);
      latestDataRef.current.sppList = data.spp;
      saveState("spp", data.spp, true);
      restoredCounts["Tagihan SPP"] = data.spp.length;
    }

    // 11. Tabungan
    if (Array.isArray(data.tabungan)) {
      setTabunganList(data.tabungan);
      latestDataRef.current.tabunganList = data.tabungan;
      saveState("tabungan", data.tabungan, true);
    }

    // 12. Transaksi Tabungan
    if (Array.isArray(data.transaksiTabungan)) {
      setTransaksiTabunganList(data.transaksiTabungan);
      latestDataRef.current.transaksiTabunganList = data.transaksiTabungan;
      saveState("transaksi_tabungan", data.transaksiTabungan, true);
      restoredCounts["Transaksi Tabungan"] = data.transaksiTabungan.length;
    }

    // 13. Peserta Transport
    if (Array.isArray(data.pesertaTransport)) {
      setPesertaTransportList(data.pesertaTransport);
      latestDataRef.current.pesertaTransportList = data.pesertaTransport;
      saveState("peserta_transport", data.pesertaTransport, true);
    }

    // 14. SPP Transport Records
    if (Array.isArray(data.sppTransportRecords)) {
      setSppTransportRecords(data.sppTransportRecords);
      latestDataRef.current.sppTransportRecords = data.sppTransportRecords;
      saveState("spp_transport_records", data.sppTransportRecords, true);
    }

    // 15. Transaksi SPP Transport
    if (Array.isArray(data.transaksiSPPTransport)) {
      setTransaksiSPPTransportList(data.transaksiSPPTransport);
      latestDataRef.current.transaksiSPPTransportList = data.transaksiSPPTransport;
      saveState("transaksi_spp_transport", data.transaksiSPPTransport, true);
    }

    // 16. Pengumuman
    if (Array.isArray(data.pengumuman)) {
      setPengumumanList(data.pengumuman);
      latestDataRef.current.pengumumanList = data.pengumuman;
      saveState("pengumuman", data.pengumuman, true);
    }

    // 17-25. LMS
    if (Array.isArray(data.lmsMateri)) {
      setLmsMateriList(data.lmsMateri);
      latestDataRef.current.lmsMateriList = data.lmsMateri;
      saveState("lms_materi", data.lmsMateri, true);
      restoredCounts["LMS Materi"] = data.lmsMateri.length;
    }
    if (Array.isArray(data.lmsTugas)) {
      setLmsTugasList(data.lmsTugas);
      latestDataRef.current.lmsTugasList = data.lmsTugas;
      saveState("lms_tugas", data.lmsTugas, true);
      restoredCounts["LMS Tugas"] = data.lmsTugas.length;
    }
    if (Array.isArray(data.lmsSubmissions)) {
      setLmsSubmissionList(data.lmsSubmissions);
      latestDataRef.current.lmsSubmissionList = data.lmsSubmissions;
      saveState("lms_submissions", data.lmsSubmissions, true);
    }
    if (Array.isArray(data.lmsKuis)) {
      setLmsKuisList(data.lmsKuis);
      latestDataRef.current.lmsKuisList = data.lmsKuis;
      saveState("lms_kuis", data.lmsKuis, true);
      restoredCounts["LMS Kuis"] = data.lmsKuis.length;
    }
    if (Array.isArray(data.lmsAttempts)) {
      setLmsKuisAttemptList(data.lmsAttempts);
      latestDataRef.current.lmsKuisAttemptList = data.lmsAttempts;
      saveState("lms_attempts", data.lmsAttempts, true);
    }
    if (Array.isArray(data.lmsForum)) {
      setLmsForumList(data.lmsForum);
      latestDataRef.current.lmsForumList = data.lmsForum;
      saveState("lms_forum", data.lmsForum, true);
    }
    if (Array.isArray(data.lmsMeetings)) {
      setLmsMeetingList(data.lmsMeetings);
      latestDataRef.current.lmsMeetingList = data.lmsMeetings;
      saveState("lms_meetings", data.lmsMeetings, true);
    }
    if (Array.isArray(data.lmsBankSoal)) {
      setLmsBankSoalList(data.lmsBankSoal);
      latestDataRef.current.lmsBankSoalList = data.lmsBankSoal;
      saveState("lms_bank_soal", data.lmsBankSoal, true);
    }
    if (Array.isArray(data.lmsJadwalMateri)) {
      setLmsJadwalMateriList(data.lmsJadwalMateri);
      latestDataRef.current.lmsJadwalMateriList = data.lmsJadwalMateri;
      saveState("lms_jadwal_materi", data.lmsJadwalMateri, true);
    }

    // 26-27. Tahfidz & Mutabaah
    if (Array.isArray(data.tahfidz)) {
      setTahfidzList(data.tahfidz);
      latestDataRef.current.tahfidzList = data.tahfidz;
      saveState("tahfidz", data.tahfidz, true);
      restoredCounts["Tahfidz"] = data.tahfidz.length;
    }
    if (Array.isArray(data.mutabaah)) {
      setMutabaahList(data.mutabaah);
      latestDataRef.current.mutabaahList = data.mutabaah;
      saveState("mutabaah", data.mutabaah, true);
      restoredCounts["Mutabaah"] = data.mutabaah.length;
    }

    // 28. Users
    if (Array.isArray(data.users) && data.users.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem("sim_auth_users", JSON.stringify(data.users));
        restoredCounts["Akun Pengguna"] = data.users.length;
      } catch (e) {
        console.warn("Could not save users from backup:", e);
      }
    }

    // Cloud synchronization
    const shouldSync = options?.syncToCloud ?? (isSupabaseConnected && SupabaseSchoolService.isConfigured());
    if (shouldSync && SupabaseSchoolService.isConfigured()) {
      try {
        await seedDatabaseToCloud();
      } catch (cloudErr) {
        console.warn("Gagal menyinkronkan data pemulihan ke cloud:", cloudErr);
      }
    }

    return {
      success: true,
      message: "Seluruh database berhasil dipulihkan dari file cadangan!",
      counts: restoredCounts,
    };
  };

  return (
    <SchoolDataContext.Provider
      value={{
        profile,
        updateProfile,
        siswaList,
        addSiswa,
        importSiswaList,
        updateSiswa,
        deleteSiswa,
        bulkDeleteSiswa,
        guruList,
        addGuru,
        updateGuru,
        deleteGuru,
        kelasList,
        addKelas,
        updateKelas,
        deleteKelas,
        mapelList,
        addMapel,
        updateMapel,
        deleteMapel,
        jadwalList,
        addJadwal,
        bulkAddJadwal,
        updateJadwal,
        deleteJadwal,
        bulkDeleteJadwal,
        resetJadwalToDefault,
        presensiList,
        updatePresensi,
        nilaiList,
        saveNilai,
        bulkSaveNilai,
        deleteNilai,
        deleteNilaiBySiswa,
        sppList,
        jenisTagihanList,
        addJenisTagihan,
        updateJenisTagihan,
        deleteJenisTagihan,
        addTagihan,
        bulkAddTagihan,
        bayarSPP,
        bayarTagihanDariTabungan,
        bulkBayarTagihanDariTabungan,
        pengumumanList,
        addPengumuman,
        deletePengumuman,
        tabunganList,
        transaksiTabunganList,
        setorTabungan,
        tarikTabungan,
        bulkSetorTabungan,
        clearAllTabungan,
        pesertaTransportList,
        sppTransportRecords,
        transaksiSPPTransportList,
        updatePesertaTransport,
        bayarSPPTransport,
        bulkBayarSPPTransportDariTabungan,
        getStudentSPPTransportRecord,

        // LMS States & Actions
        lmsMateriList,
        addMateri,
        updateMateri,
        deleteMateri,
        toggleBacaMateri,
        lmsTugasList,
        addTugas,
        updateTugas,
        deleteTugas,
        lmsSubmissionList,
        submitTugas,
        nilaiSubmission,
        lmsKuisList,
        addKuis,
        deleteKuis,
        lmsKuisAttemptList,
        submitKuisAttempt,
        lmsForumList,
        addForumTopik,
        addKomentarForum,
        lmsMeetingList,
        addMeeting,
        deleteMeeting,
        lmsBankSoalList,
        addBankSoal,
        updateBankSoal,
        deleteBankSoal,
        addSoalToBank,
        updateSoalInBank,
        deleteSoalFromBank,
        generateKuisFromBankSoal,
        lmsJadwalMateriList,
        addJadwalMateri,
        updateJadwalMateri,
        deleteJadwalMateri,
        toggleRealisasiJadwal,

        // Islamic School Flagship Features
        tahfidzList,
        addTahfidzRecord,
        updateTahfidzRecord,
        deleteTahfidzRecord,
        mutabaahList,
        addOrUpdateMutabaahRecord,
        batchAddOrUpdateMutabaahRecords,
        verifyMutabaahRecord,
        deleteMutabaahRecord,

        resetToDefault,

        // Supabase Cloud State & Sync
        isSupabaseConnected,
        isSyncing,
        lastSyncTime,
        supabaseError,
        syncWithSupabase,
        seedDatabaseToCloud,
        testSupabaseHealth,

        // Automatic Push Database Engine
        isAutoPushEnabled,
        toggleAutoPush,
        isAutoPushing,
        lastAutoPushTime,
        autoPushStatus,
        forceAutoPushNow,

        // Backup & Restore Database
        exportDatabaseBackup,
        importDatabaseBackup,
        clearAllDatabase,
      }}


    >
      {children}
    </SchoolDataContext.Provider>
  );
}

export function useSchoolData() {
  const context = useContext(SchoolDataContext);
  if (!context) {
    throw new Error("useSchoolData must be used within a SchoolDataProvider");
  }
  return context;
}
