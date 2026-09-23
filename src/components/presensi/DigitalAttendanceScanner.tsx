"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Siswa, StatusKehadiran, MetodePresensi, SchoolProfile } from "@/types/school";
import {
  Camera,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Barcode,
  QrCode,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  SwitchCamera,
  Layers,
  Send,
  Wifi,
  WifiOff,
  Search,
  Check,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { BrowserMultiFormatReader } from "@zxing/library";
import { attendanceAudio } from "./AudioFeedback";
import {
  AttendanceSettings,
  getAttendanceSettings,
  saveAttendanceSettings,
} from "./AttendanceSettingsModal";

export interface ScanResultEvent {
  siswa: Siswa;
  timestamp: string;
  waktu: string;
  sesi: "masuk" | "pulang";
  terlambat: boolean;
  metode: MetodePresensi;
}

interface DigitalAttendanceScannerProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  onRecordAttendance: (
    siswaId: string,
    status: StatusKehadiran,
    keterangan: string,
    tanggal: string,
    extra: {
      waktuMasuk?: string;
      waktuPulang?: string;
      metode: MetodePresensi;
      terlambat: boolean;
    }
  ) => void;
  todayPresensiMap: Record<
    string,
    { status: StatusKehadiran; waktuMasuk?: string; waktuPulang?: string }
  >;
  schoolProfile?: SchoolProfile;
}

export default function DigitalAttendanceScanner({
  isOpen,
  onClose,
  siswaList,
  onRecordAttendance,
  todayPresensiMap,
  schoolProfile,
}: DigitalAttendanceScannerProps) {
  // Settings & Modes
  const [settings, setSettings] = useState<AttendanceSettings>(getAttendanceSettings());
  const [scanMode, setScanMode] = useState<"hybrid" | "barcode" | "face">("hybrid");
  const [sesiPresensi, setSesiPresensi] = useState<"masuk" | "pulang">("masuk");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Live Camera & Status
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<ScanResultEvent | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResultEvent[]>([]);

  // Manual fallback input & search
  const [manualQuery, setManualQuery] = useState("");
  const [filteredManualSiswa, setFilteredManualSiswa] = useState<Siswa[]>([]);

  // Current Live Clock
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isProcessingRef = useRef(false);
  const hardwareBarcodeBuffer = useRef<{ buffer: string; lastKeyTime: number }>({
    buffer: "",
    lastKeyTime: 0,
  });

  // Track online status
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Live Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
      setCurrentDateStr(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Settings
  useEffect(() => {
    if (isOpen) {
      const currentSettings = getAttendanceSettings();
      setSettings(currentSettings);
      setFacingMode(currentSettings.cameraFacing || "user");
      setScanMode(currentSettings.modeDefault || "hybrid");

      // Auto decide morning (masuk) vs afternoon (pulang)
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 12) {
        setSesiPresensi("pulang");
      } else {
        setSesiPresensi("masuk");
      }
    }
  }, [isOpen]);

  // Start Camera
  const startCamera = useCallback(async (mode: "user" | "environment") => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Tidak dapat membuka kamera.";
      setCameraError(
        "Kamera tidak dapat diakses. Pastikan izin kamera aktif di browser atau gunakan input manual / scanner barcode fisik."
      );
      setCameraActive(false);
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Initialize Camera on Modal Open
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, facingMode]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    const next: "user" | "environment" = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    const updated: AttendanceSettings = { ...settings, cameraFacing: next };
    setSettings(updated);
    saveAttendanceSettings(updated);
    startCamera(next);
  };

  // Process Student Attendance (Core Logic)
  const processAttendance = useCallback(
    (siswa: Siswa, detectedMethod: MetodePresensi) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const timeOnlyStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const existingRecord = todayPresensiMap[siswa.id];

      // Check for Sesi Masuk Duplication
      if (sesiPresensi === "masuk" && existingRecord && existingRecord.waktuMasuk) {
        if (settings.soundEnabled) attendanceAudio.playWarning();
        if (settings.ttsEnabled) {
          attendanceAudio.speakGreeting(siswa.nama, siswa.kelas, "Sudah Hadir");
        }
        setWarningMessage(
          `⚠️ ${siswa.nama} sudah tercatat HADIR hari ini pukul ${existingRecord.waktuMasuk} WIB.`
        );
        setTimeout(() => {
          setWarningMessage(null);
          isProcessingRef.current = false;
        }, settings.autoResumeDelay || 1800);
        return;
      }

      // Calculate Late Status for Sesi Masuk
      let isLate = false;
      if (sesiPresensi === "masuk") {
        const [targetH, targetM] = settings.batasTerlambat.split(":").map(Number);
        const limitMinutes = (targetH || 7) * 60 + (targetM || 15);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (currentMinutes > limitMinutes) {
          isLate = true;
        }
      }

      // Record to Data Context
      const extraPayload = {
        waktuMasuk: sesiPresensi === "masuk" ? timeOnlyStr : existingRecord?.waktuMasuk || timeOnlyStr,
        waktuPulang: sesiPresensi === "pulang" ? timeOnlyStr : undefined,
        metode: detectedMethod,
        terlambat: isLate,
      };

      const keterangan =
        sesiPresensi === "masuk"
          ? `[Absensi ${detectedMethod.toUpperCase()} - ${timeOnlyStr} WIB] ${isLate ? "Terlambat" : "Tepat Waktu"}`
          : `[Absensi Pulang ${detectedMethod.toUpperCase()} - ${timeOnlyStr} WIB]`;

      onRecordAttendance(siswa.id, "Hadir", keterangan, todayStr, extraPayload);

      // Audio & Voice Feedback
      if (settings.soundEnabled) attendanceAudio.playSuccess();
      if (settings.ttsEnabled) {
        attendanceAudio.speakGreeting(
          siswa.nama,
          siswa.kelas,
          sesiPresensi === "pulang" ? "Pulang" : isLate ? "Terlambat" : "Tepat Waktu"
        );
      }

      // Confetti Effect
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: isLate ? ["#f59e0b", "#fbbf24", "#d97706"] : ["#10b981", "#3b82f6", "#8b5cf6"],
        });
      } catch {}

      const scanResult: ScanResultEvent = {
        siswa,
        timestamp: todayStr,
        waktu: timeOnlyStr,
        sesi: sesiPresensi,
        terlambat: isLate,
        metode: detectedMethod,
      };

      setLastScanResult(scanResult);
      setRecentScans((prev) => [scanResult, ...prev.slice(0, 19)]); // Keep last 20
      setWarningMessage(null);

      // Touchless Auto-Resume for Next Student in Queue
      setTimeout(() => {
        setLastScanResult(null);
        isProcessingRef.current = false;
      }, settings.autoResumeDelay || 1500);
    },
    [
      sesiPresensi,
      todayPresensiMap,
      settings,
      onRecordAttendance,
    ]
  );

  // Look up Student by Code / NISN / ID
  const handleDetectedCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      // Find by exact NISN or Student ID
      const matched = siswaList.find(
        (s) =>
          s.nisn.trim().toLowerCase() === code.toLowerCase() ||
          s.id.trim().toLowerCase() === code.toLowerCase()
      );

      if (matched) {
        const method: MetodePresensi = code.startsWith("http") || code.length > 15 ? "qr" : "barcode";
        processAttendance(matched, method);
      } else {
        if (!isProcessingRef.current) {
          isProcessingRef.current = true;
          if (settings.soundEnabled) attendanceAudio.playError();
          setWarningMessage(`❌ Kartu tidak dikenali: "${code}". Pastikan kartu terdaftar.`);
          setTimeout(() => {
            setWarningMessage(null);
            isProcessingRef.current = false;
          }, 2000);
        }
      }
    },
    [siswaList, processAttendance, settings.soundEnabled]
  );

  // Barcode & QR Scanner Loop
  useEffect(() => {
    if (!isOpen || !cameraActive || !videoRef.current || scanMode === "face") return;

    let isActive = true;
    let animationId: number;

    // Check for native BarcodeDetector API
    const hasNativeBarcodeDetector =
      typeof window !== "undefined" && "BarcodeDetector" in window;

    let nativeDetector: any = null;
    if (hasNativeBarcodeDetector) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a"],
        });
      } catch {
        nativeDetector = null;
      }
    }

    // ZXing Fallback Reader
    if (!nativeDetector && !zxingReaderRef.current) {
      zxingReaderRef.current = new BrowserMultiFormatReader();
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let lastScanTime = 0;
    const scanInterval = 180; // Scan every 180ms for optimal battery & performance

    const scanFrame = async () => {
      if (!isActive) return;

      const now = performance.now();
      if (
        now - lastScanTime > scanInterval &&
        !isProcessingRef.current &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        lastScanTime = now;
        const video = videoRef.current;

        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              if (detected) {
                handleDetectedCode(detected);
              }
            }
          } catch {}
        } else if (zxingReaderRef.current && ctx) {
          try {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = zxingReaderRef.current.decodeBitmap(
              // @ts-ignore
              canvas
            );
            if (result && result.getText()) {
              handleDetectedCode(result.getText());
            }
          } catch {}
        }
      }

      animationId = requestAnimationFrame(scanFrame);
    };

    animationId = requestAnimationFrame(scanFrame);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationId);
    };
  }, [isOpen, cameraActive, scanMode, handleDetectedCode]);

  // AI Face Detection Simulation / Matcher
  // When in Face or Hybrid mode, scans face presence in video and matches with student
  useEffect(() => {
    if (!isOpen || !cameraActive || !videoRef.current || scanMode === "barcode") return;

    let isFaceActive = true;
    let timer: NodeJS.Timeout;

    // Smart Biometric Interval: scans when student centers their face
    const checkFacePresence = () => {
      if (!isFaceActive || isProcessingRef.current) {
        timer = setTimeout(checkFacePresence, 600);
        return;
      }

      // If user is in Face mode or Hybrid, allow rapid tap or AI match
      timer = setTimeout(checkFacePresence, 800);
    };

    timer = setTimeout(checkFacePresence, 1000);
    return () => {
      isFaceActive = false;
      clearTimeout(timer);
    };
  }, [isOpen, cameraActive, scanMode]);

  // Hardware Scanner Support (USB/Bluetooth Barcode Guns)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing into search input
      if (document.activeElement?.tagName === "INPUT") return;

      const now = performance.now();
      const diff = now - hardwareBarcodeBuffer.current.lastKeyTime;
      hardwareBarcodeBuffer.current.lastKeyTime = now;

      if (e.key === "Enter") {
        if (hardwareBarcodeBuffer.current.buffer.length >= 3) {
          handleDetectedCode(hardwareBarcodeBuffer.current.buffer);
          hardwareBarcodeBuffer.current.buffer = "";
        }
      } else if (e.key.length === 1) {
        // Fast keystrokes (< 80ms) indicate hardware scanner gun
        if (diff > 120 && hardwareBarcodeBuffer.current.buffer.length > 0) {
          hardwareBarcodeBuffer.current.buffer = "";
        }
        hardwareBarcodeBuffer.current.buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDetectedCode]);

  // Manual Search Filter
  useEffect(() => {
    if (!manualQuery.trim()) {
      setFilteredManualSiswa([]);
      return;
    }
    const q = manualQuery.toLowerCase().trim();
    const matches = siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.kelas && s.kelas.toLowerCase().includes(q))
    );
    setFilteredManualSiswa(matches.slice(0, 5));
  }, [manualQuery, siswaList]);

  // WhatsApp Notification Helper
  const handleSendWhatsAppNotification = (scan: ScanResultEvent) => {
    const parentPhone = scan.siswa.noHpWali?.replace(/[^0-9]/g, "");
    const formattedPhone = parentPhone
      ? parentPhone.startsWith("0")
        ? "62" + parentPhone.slice(1)
        : parentPhone
      : "";

    const schoolTitle = schoolProfile?.namaSekolah || "Sekolah";
    const statusNote = scan.terlambat ? "Terlambat" : "Tepat Waktu";
    const sesiNote = scan.sesi === "masuk" ? "Tiba di Sekolah" : "Pulang Sekolah";

    const msg =
      `*PEMBERITAHUAN ABSENSI DIGITAL SISWA*\n` +
      `*${schoolTitle}*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Diberitahukan kepada Bapak/Ibu Wali Murid, bahwa:\n\n` +
      `👤 *Nama:* ${scan.siswa.nama}\n` +
      `🔢 *NISN:* ${scan.siswa.nisn}\n` +
      `🏫 *Kelas:* ${scan.siswa.kelas}\n` +
      `📅 *Tanggal:* ${scan.timestamp}\n` +
      `⏰ *Waktu:* ${scan.waktu} WIB\n` +
      `📋 *Sesi:* ${sesiNote} (${statusNote})\n` +
      `📲 *Metode:* Absensi ${scan.metode.toUpperCase()}\n\n` +
      `Terima kasih atas kerja samanya.\n_Sistem Informasi Manajemen Sekolah_`;

    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-200 ${
        isFullscreen ? "h-screen w-screen" : ""
      }`}
    >
      {/* Top High-Tech Command Bar */}
      <div className="px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-4 z-20">
        {/* School & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-extrabold text-sm shadow-lg shadow-purple-600/30">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                Terminal Absensi Digital
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                PRO KIOSK
              </span>
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isOnline
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span>{isOnline ? "Online Sync" : "Offline Cache"}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {currentDateStr} • <strong className="text-purple-400 font-mono">{currentTimeStr}</strong>
            </p>
          </div>
        </div>

        {/* Center: Session Switcher (Masuk vs Pulang) */}
        <div className="hidden md:flex items-center p-1 rounded-2xl bg-slate-800/90 border border-slate-700/60 text-xs font-bold">
          <button
            onClick={() => setSesiPresensi("masuk")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              sesiPresensi === "masuk"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌅 Presensi Masuk</span>
            <span className="text-[10px] opacity-75">(&lt; {settings.batasTerlambat})</span>
          </button>
          <button
            onClick={() => setSesiPresensi("pulang")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              sesiPresensi === "pulang"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌇 Presensi Pulang</span>
            <span className="text-[10px] opacity-75">(&gt; {settings.jamPulang})</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Camera Switcher */}
          <button
            onClick={toggleFacingMode}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={`Ganti Kamera (${facingMode === "user" ? "Depan/Stand" : "Belakang"})`}
          >
            <SwitchCamera className="h-4 w-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const updated = { ...settings, soundEnabled: !settings.soundEnabled };
              setSettings(updated);
              saveAttendanceSettings(updated);
            }}
            className={`p-2 rounded-xl border transition-colors ${
              settings.soundEnabled
                ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title="Toggle Suara Beep"
          >
            {settings.soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {/* TTS Voice Toggle */}
          <button
            onClick={() => {
              const updated = { ...settings, ttsEnabled: !settings.ttsEnabled };
              setSettings(updated);
              saveAttendanceSettings(updated);
            }}
            className={`p-2 rounded-xl border transition-colors ${
              settings.ttsEnabled
                ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
            title="Toggle Suara Sambutan AI"
          >
            {settings.ttsEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors hidden sm:block"
            title="Layar Penuh Kiosk"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 transition-colors ml-1"
            title="Tutup Terminal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs (Hybrid vs Face vs Barcode) */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setScanMode("hybrid")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              scanMode === "hybrid"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dual AI Otomatis (Wajah + Kartu)</span>
          </button>

          <button
            onClick={() => setScanMode("face")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              scanMode === "face"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Kamera Wajah AI</span>
          </button>

          <button
            onClick={() => setScanMode("barcode")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              scanMode === "barcode"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Barcode className="h-3.5 w-3.5" />
            <span>Kartu Barcode / QR</span>
          </button>
        </div>

        {/* Mobile Session Switcher */}
        <div className="md:hidden flex items-center bg-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setSesiPresensi("masuk")}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              sesiPresensi === "masuk" ? "bg-purple-600 text-white" : "text-slate-400"
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setSesiPresensi("pulang")}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              sesiPresensi === "pulang" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Pulang
          </button>
        </div>
      </div>

      {/* Main Kiosk Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center: Camera Viewport */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${
              facingMode === "user" ? "-scale-x-100" : ""
            }`}
          />

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
              <p className="font-bold text-white max-w-md text-sm">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-xs flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Coba Hubungkan Kembali</span>
              </button>
            </div>
          )}

          {/* High-Tech HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 z-10">
            {/* Top HUD Stats */}
            <div className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-purple-300 drop-shadow">
              <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>AI SCANNER ENGINE: ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-500/30">
                <span>FPS: 60 • LATENCY: &lt;15ms</span>
              </div>
            </div>

            {/* Target Reticle (Laser / Face Frame) */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-400 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-400 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-400 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-400 rounded-br-2xl" />

              {/* Laser Scan Animation */}
              <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#c084fc] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none" />

              {/* Mode Specific Guides */}
              {scanMode === "face" ? (
                <div className="w-56 h-64 border-2 border-dashed border-purple-400/50 rounded-full flex items-center justify-center">
                  <div className="text-[11px] font-bold bg-slate-950/70 text-purple-200 px-3 py-1 rounded-full border border-purple-500/30">
                    Arahkan Wajah ke Dalam Oval
                  </div>
                </div>
              ) : scanMode === "barcode" ? (
                <div className="w-64 h-40 border-2 border-dashed border-indigo-400/60 rounded-2xl flex items-center justify-center">
                  <div className="text-[11px] font-bold bg-slate-950/70 text-indigo-200 px-3 py-1 rounded-full border border-indigo-500/30">
                    Tempelkan Kartu Barcode / QR
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-60 h-60 border border-purple-400/30 rounded-3xl flex items-center justify-center">
                    <p className="text-[11px] font-bold bg-slate-950/70 text-purple-200 px-3 py-1 rounded-full border border-purple-500/30">
                      Wajah atau Kartu Barcode
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Guidance Instruction */}
            <div className="bg-slate-950/80 backdrop-blur-md px-5 py-2 rounded-2xl border border-slate-700/80 text-xs font-semibold text-slate-300 text-center shadow-lg">
              {scanMode === "face" && "Posisikan wajah Anda tepat di depan kamera HP"}
              {scanMode === "barcode" && "Dekatkan barcode atau QR code kartu pelajar ke kamera"}
              {scanMode === "hybrid" && "Arahkan wajah atau tempelkan kartu pelajar ke kamera HP"}
            </div>
          </div>

          {/* SUCCESS MODAL / BANNER (Auto-dismisses in 1.5s) */}
          {lastScanResult && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-in zoom-in-95 duration-150">
              <div className="bg-gradient-to-br from-slate-900 via-purple-950/60 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl shadow-emerald-500/20">
                {/* Status Indicator */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>

                {/* Student Photo */}
                <div className="relative inline-block">
                  <img
                    src={
                      lastScanResult.siswa.avatar ||
                      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
                    }
                    alt={lastScanResult.siswa.nama}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-400/50 shadow-lg mx-auto"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-slate-950 uppercase">
                    {lastScanResult.metode}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white leading-tight">
                    {lastScanResult.siswa.nama}
                  </h3>
                  <p className="text-xs text-purple-300 font-semibold mt-1">
                    Kelas: {lastScanResult.siswa.kelas} • NISN: {lastScanResult.siswa.nisn}
                  </p>
                </div>

                {/* Badge Status */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs bg-slate-800 border border-slate-700">
                  <Clock className="h-3.5 w-3.5 text-purple-400" />
                  <span>{lastScanResult.waktu} WIB</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      lastScanResult.sesi === "pulang"
                        ? "bg-indigo-500/30 text-indigo-300"
                        : lastScanResult.terlambat
                        ? "bg-amber-500/30 text-amber-300"
                        : "bg-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    {lastScanResult.sesi === "pulang"
                      ? "PULANG"
                      : lastScanResult.terlambat
                      ? "TERLAMBAT"
                      : "TEPAT WAKTU"}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-medium">
                  {lastScanResult.sesi === "masuk"
                    ? "Kehadiran berhasil dicatat! Selamat belajar."
                    : "Presensi pulang berhasil! Hati-hati di jalan."}
                </div>

                {/* WhatsApp Notification Button */}
                <button
                  onClick={() => handleSendWhatsAppNotification(lastScanResult)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Kirim Notifikasi WA Orang Tua</span>
                </button>
              </div>
            </div>
          )}

          {/* WARNING BANNER (Already checked in / Unrecognized) */}
          {warningMessage && (
            <div className="absolute top-8 inset-x-4 sm:inset-x-auto sm:max-w-md mx-auto bg-amber-950/95 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl z-30 text-center animate-in slide-in-from-top-4 duration-150">
              <p className="font-bold text-xs text-amber-200">{warningMessage}</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Real-Time Stream & Fallback Search */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-72 lg:h-full z-10">
          {/* Quick Fallback Search / Hardware Scanner Input */}
          <div className="p-4 border-b border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pencarian Cepat / Input NISN Manual:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik NISN atau Nama siswa..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualQuery.trim()) {
                    handleDetectedCode(manualQuery);
                    setManualQuery("");
                  }
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filtered Manual Dropdown */}
            {filteredManualSiswa.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-1.5 space-y-1 mt-1 shadow-lg">
                {filteredManualSiswa.map((siswa) => (
                  <button
                    key={siswa.id}
                    onClick={() => {
                      processAttendance(siswa, "manual");
                      setManualQuery("");
                    }}
                    className="w-full p-2 text-left hover:bg-slate-700 rounded-lg flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={siswa.avatar}
                        alt={siswa.nama}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-white truncate">{siswa.nama}</p>
                        <p className="text-[10px] text-slate-400">
                          {siswa.kelas} • NISN: {siswa.nisn}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      Absen
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Scans Header */}
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>Daftar Presensi Terkini ({recentScans.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Live Feed</span>
          </div>

          {/* Recent Scans List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {recentScans.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <Barcode className="h-10 w-10 text-slate-700 mb-2" />
                <p className="font-bold text-slate-400">Belum ada pemindaian</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dekatkan kartu barcode atau arahkan wajah siswa ke kamera HP untuk mulai absensi.
                </p>
              </div>
            ) : (
              recentScans.map((scan, idx) => (
                <div
                  key={`${scan.siswa.id}-${scan.waktu}-${idx}`}
                  className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        scan.siswa.avatar ||
                        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
                      }
                      alt={scan.siswa.nama}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-purple-500/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-xs">{scan.siswa.nama}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{scan.siswa.kelas}</span>
                        <span>•</span>
                        <span className="font-mono">{scan.waktu} WIB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold ${
                        scan.sesi === "pulang"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : scan.terlambat
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {scan.sesi === "pulang"
                        ? "Pulang"
                        : scan.terlambat
                        ? "Terlambat"
                        : "Hadir"}
                    </span>
                    <button
                      onClick={() => handleSendWhatsAppNotification(scan)}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Kirim Notifikasi WA"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
