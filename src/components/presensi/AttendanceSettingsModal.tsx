"use client";

import React, { useState, useEffect } from "react";
import { Settings, Clock, Volume2, VolumeX, Mic, MicOff, Camera, Check, X, ShieldAlert } from "lucide-react";

export interface AttendanceSettings {
  jamMasuk: string; // e.g. "07:00"
  batasTerlambat: string; // e.g. "07:15"
  jamPulang: string; // e.g. "14:00"
  soundEnabled: boolean;
  ttsEnabled: boolean;
  autoResumeDelay: number; // in ms, e.g. 1500
  cameraFacing: "user" | "environment";
  modeDefault: "hybrid" | "barcode" | "face";
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  jamMasuk: "07:00",
  batasTerlambat: "07:15",
  jamPulang: "14:00",
  soundEnabled: true,
  ttsEnabled: true,
  autoResumeDelay: 1500,
  cameraFacing: "user",
  modeDefault: "hybrid",
};

const STORAGE_KEY = "sdipro_attendance_settings_v1";

export function getAttendanceSettings(): AttendanceSettings {
  if (typeof window === "undefined") return DEFAULT_ATTENDANCE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ATTENDANCE_SETTINGS;
    return { ...DEFAULT_ATTENDANCE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ATTENDANCE_SETTINGS;
  }
}

export function saveAttendanceSettings(settings: AttendanceSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

interface AttendanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: AttendanceSettings) => void;
}

export default function AttendanceSettingsModal({
  isOpen,
  onClose,
  onSave,
}: AttendanceSettingsModalProps) {
  const [settings, setSettings] = useState<AttendanceSettings>(DEFAULT_ATTENDANCE_SETTINGS);
  const [savedAlert, setSavedAlert] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getAttendanceSettings());
      setSavedAlert(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveAttendanceSettings(settings);
    if (onSave) onSave(settings);
    setSavedAlert(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Absensi Digital
              </h2>
              <p className="text-xs text-slate-500">
                Atur jam batas sekolah, toleransi terlambat, suara, dan kamera
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {savedAlert && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span className="font-semibold">Pengaturan berhasil disimpan!</span>
            </div>
          )}

          {/* Jam Sekolah & Toleransi */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-[13px]">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>Jam Masuk & Batas Keterlambatan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Jam Masuk Standar
                </label>
                <input
                  type="time"
                  value={settings.jamMasuk}
                  onChange={(e) => setSettings({ ...settings, jamMasuk: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Waktu mulai KBM</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Batas Toleransi
                </label>
                <input
                  type="time"
                  value={settings.batasTerlambat}
                  onChange={(e) => setSettings({ ...settings, batasTerlambat: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-amber-600 dark:text-amber-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">&gt; Jam ini = Terlambat</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Jam Pulang
                </label>
                <input
                  type="time"
                  value={settings.jamPulang}
                  onChange={(e) => setSettings({ ...settings, jamPulang: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-purple-600 dark:text-purple-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Mulai sesi pulang</span>
              </div>
            </div>
          </div>

          {/* Konfigurasi Audio & Sambutan */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-[13px]">
              <Volume2 className="h-4 w-4 text-purple-600" />
              <span>Efek Suara & Sambutan AI (Voice Greeting)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  {settings.soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-white block">
                      Suara Beep / Chime
                    </span>
                    <span className="text-[10px] text-slate-400">Efek nada sukses/peringatan</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="h-4 w-4 accent-purple-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  {settings.ttsEnabled ? (
                    <Mic className="h-4 w-4 text-purple-600" />
                  ) : (
                    <MicOff className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-white block">
                      Suara Sambutan AI (TTS)
                    </span>
                    <span className="text-[10px] text-slate-400">Ucapkan nama siswa otomatis</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ttsEnabled}
                  onChange={(e) => setSettings({ ...settings, ttsEnabled: e.target.checked })}
                  className="h-4 w-4 accent-purple-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Kamera & Kecepatan Antrean */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-[13px]">
              <Camera className="h-4 w-4 text-purple-600" />
              <span>Preferensi Kamera & Kecepatan Kiosk</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Kamera Default HP/Stand
                </label>
                <select
                  value={settings.cameraFacing}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cameraFacing: e.target.value as "user" | "environment",
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="user">Kamera Depan (Selfie / Stand Tripod HP)</option>
                  <option value="environment">Kamera Belakang (Dipegang Guru)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Jeda Siap Scan Siswa Berikutnya
                </label>
                <select
                  value={settings.autoResumeDelay}
                  onChange={(e) =>
                    setSettings({ ...settings, autoResumeDelay: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                >
                  <option value={1000}>1.0 Detik (Sangat Cepat / Antrean Ramai)</option>
                  <option value={1500}>1.5 Detik (Rekomendasi Standar Industri)</option>
                  <option value={2000}>2.0 Detik (Lebih Santai)</option>
                  <option value={3000}>3.0 Detik (Tampilan Info Lebih Lama)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/80 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
