"use client";

import React, { useState, useRef, useEffect } from "react";
import { Siswa, Kelas } from "@/types/school";
import {
  Camera,
  Upload,
  Check,
  X,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  RotateCcw,
  Sparkles,
  SwitchCamera,
} from "lucide-react";

interface FaceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  kelasList: Kelas[];
  onUpdateSiswa: (id: string, data: Partial<Siswa>) => void;
}

export default function FaceRegistrationModal({
  isOpen,
  onClose,
  siswaList,
  kelasList,
  onUpdateSiswa,
}: FaceRegistrationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [activeSiswa, setActiveSiswa] = useState<Siswa | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter students
  const filteredStudents = React.useMemo(() => {
    return siswaList.filter((s) => {
      const matchKelas =
        selectedKelas === "Semua" ||
        s.kelas?.trim().toLowerCase() === selectedKelas.trim().toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.kelas && s.kelas.toLowerCase().includes(q));
      return matchKelas && matchQuery;
    });
  }, [siswaList, selectedKelas, searchQuery]);

  // Start Camera
  const startCamera = async (mode: "user" | "environment") => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCapturing(true);
    } catch {
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Open camera for specific student
  const handleOpenCapture = (siswa: Siswa) => {
    setActiveSiswa(siswa);
    setCapturedPhoto(null);
    setSaveSuccessMsg(null);
    startCamera(facingMode);
  };

  const handleToggleFacing = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from video
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw square center crop
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;

    if (facingMode === "user") {
      // Mirror if front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, siswa: Siswa) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateSiswa(siswa.id, { avatar: dataUrl });
        setSaveSuccessMsg(`Foto untuk ${siswa.nama} berhasil diperbarui!`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save captured photo
  const handleSaveCapture = () => {
    if (!activeSiswa || !capturedPhoto) return;
    onUpdateSiswa(activeSiswa.id, { avatar: capturedPhoto });
    setSaveSuccessMsg(`Foto biometrik untuk ${activeSiswa.nama} berhasil disimpan!`);
    setActiveSiswa(null);
    setCapturedPhoto(null);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Registrasi Foto & Biometrik Wajah Siswa</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {siswaList.length} Total Siswa
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ambil foto langsung dari kamera HP atau upload file untuk referensi absensi wajah AI
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Alert Notification */}
        {saveSuccessMsg && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
            <Check className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {/* Camera Overlay Modal if Capturing */}
        {activeSiswa && (isCapturing || capturedPhoto) && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white text-center space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="text-left">
                  <h3 className="font-bold text-sm">Ambil Foto Wajah Biometrik</h3>
                  <p className="text-xs text-slate-400">{activeSiswa.nama} ({activeSiswa.kelas})</p>
                </div>
                <button
                  onClick={() => {
                    stopCamera();
                    setActiveSiswa(null);
                    setCapturedPhoto(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Viewport / Frame */}
              <div className="relative mx-auto w-64 h-64 rounded-3xl overflow-hidden bg-slate-950 border-2 border-purple-500/50 shadow-inner flex items-center justify-center">
                {isCapturing && (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                    />
                    {/* Oval Face Guide */}
                    <div className="absolute inset-4 border-2 border-dashed border-purple-400/70 rounded-full pointer-events-none flex items-center justify-center">
                      <div className="text-[10px] bg-black/50 px-2 py-0.5 rounded-full text-purple-200">
                        Posisikan Wajah Disini
                      </div>
                    </div>
                  </>
                )}

                {capturedPhoto && (
                  <img
                    src={capturedPhoto}
                    alt="Captured Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {isCapturing ? (
                  <>
                    <button
                      onClick={handleToggleFacing}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Ganti Kamera Depan / Belakang"
                    >
                      <SwitchCamera className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleSnapPhoto}
                      className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-lg shadow-purple-600/30 flex items-center gap-2"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Jepret Foto</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setCapturedPhoto(null);
                        startCamera(facingMode);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-2 text-xs"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Ulangi</span>
                    </button>
                    <button
                      onClick={handleSaveCapture}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 text-xs"
                    >
                      <Check className="h-4 w-4" />
                      <span>Simpan Foto Wajah</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-white"
              >
                <option value="Semua">Semua Kelas ({siswaList.length})</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white w-52 sm:w-64"
              />
            </div>
          </div>

          <div className="text-slate-500 font-medium">
            Menampilkan <strong className="text-purple-600">{filteredStudents.length}</strong> siswa
          </div>
        </div>

        {/* Student Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Foto Wajah</th>
                  <th className="px-5 py-3.5">Nama & NISN</th>
                  <th className="px-4 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5 text-center">Status Biometrik</th>
                  <th className="px-5 py-3.5 text-right">Aksi Registrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      Tidak ada siswa ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((siswa) => {
                    const hasCustomAvatar =
                      siswa.avatar &&
                      siswa.avatar.length > 0 &&
                      !siswa.avatar.includes("placeholder");

                    return (
                      <tr
                        key={siswa.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <img
                            src={siswa.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                            alt={siswa.nama}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{siswa.nama}</p>
                          <p className="font-mono text-[11px] text-slate-400">{siswa.nisn}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                          {siswa.kelas || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasCustomAvatar ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="h-3 w-3" />
                              <span>Foto Siap</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <AlertCircle className="h-3 w-3" />
                              <span>Perlu Foto</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenCapture(siswa)}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1.5"
                              title="Buka kamera dan ambil foto"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              <span>Foto Kamera</span>
                            </button>

                            <label className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5">
                              <Upload className="h-3.5 w-3.5" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, siswa)}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
