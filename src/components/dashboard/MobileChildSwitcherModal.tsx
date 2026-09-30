"use client";

import React, { useState, useRef } from "react";
import {
  X,
  CheckCircle2,
  Users,
  PlusCircle,
  ChevronRight,
  Flame,
  Award,
  Wallet,
  Clock,
  Sparkles,
} from "lucide-react";
import { Siswa } from "@/types/school";

export interface ChildAccount {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: "L" | "P";
  avatar: string;
  streak: number;
  presensiStatus: "Hadir" | "Belum Presensi";
  presensiWaktu?: string;
  sppStatus: "Lunas" | "Ada Tagihan";
}

export const DEFAULT_CHILDREN: ChildAccount[] = [
  {
    id: "sis-default",
    nisn: "20230015",
    nama: "Ahmad Fauzan",
    kelas: "3 - Al Farabi",
    jenisKelamin: "L",
    avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
    streak: 14,
    presensiStatus: "Hadir",
    presensiWaktu: "07:05 WIB",
    sppStatus: "Lunas",
  },
  {
    id: "sis-child-2",
    nisn: "20250042",
    nama: "Fatimah Azzahra",
    kelas: "1 - Ibnu Sina",
    jenisKelamin: "P",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    streak: 9,
    presensiStatus: "Hadir",
    presensiWaktu: "07:12 WIB",
    sppStatus: "Lunas",
  },
  {
    id: "sis-child-3",
    nisn: "20210088",
    nama: "Zaidan Al-Ghifari",
    kelas: "5 - Al Khawarizmi",
    jenisKelamin: "L",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
    streak: 21,
    presensiStatus: "Hadir",
    presensiWaktu: "06:58 WIB",
    sppStatus: "Lunas",
  },
];

interface MobileChildSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChildId: string;
  onSelectChild: (child: ChildAccount) => void;
  childrenList?: ChildAccount[];
}

export default function MobileChildSwitcherModal({
  isOpen,
  onClose,
  activeChildId,
  onSelectChild,
  childrenList = DEFAULT_CHILDREN,
}: MobileChildSwitcherModalProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNisn, setNewNisn] = useState("");
  const [newTtl, setNewTtl] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  // Drag-to-Dismiss State
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);

  if (!isOpen) return null;

  const triggerHaptic = (pattern: number | number[] = 12) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartYRef.current;
    if (delta > 0) {
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      triggerHaptic(10);
      onClose();
    }
    setDragY(0);
  };

  const handleLinkNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNisn) return;
    triggerHaptic(15);
    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      setIsAddingNew(false);
      setNewNisn("");
      setNewTtl("");
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-slideUp"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on top with Touch Gestures */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
        </div>

        {/* 1. Header with Touch Gestures */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 cursor-grab select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                Pilih Akun Santri
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Wali Murid: Kelola santri dalam 1 akun
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable List of Children */}
        <div className="overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {childrenList.map((child) => {
            const isSelected = child.id === activeChildId || child.nisn === activeChildId;

            return (
              <div
                key={child.id}
                onClick={() => {
                  triggerHaptic();
                  onSelectChild(child);
                  onClose();
                }}
                className={`p-3.5 rounded-3xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 dark:from-emerald-950/50 dark:to-slate-900 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
                    : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-emerald-500 shadow-xs">
                        <img
                          src={child.avatar}
                          alt={child.nama}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {child.nama}
                        </h4>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[8.5px] font-black uppercase tracking-tight">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {child.kelas} • NISN: {child.nisn}
                      </p>

                      {/* Micro Status Badges */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-orange-600 dark:text-orange-400">
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          <span>{child.streak} Hari</span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Hadir ({child.presensiWaktu || "07:05"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Switch Pill */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold group-hover:bg-emerald-50">
                        Pilih
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Child Form / Button */}
          {isAddingNew ? (
            <form
              onSubmit={handleLinkNew}
              className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 mt-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Tautkan NISN Santri Lain
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Batal
                </button>
              </div>

              {addSuccess ? (
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
                  ✓ Berhasil menautkan santri ke akun wali!
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Nomor Induk Siswa Nasional (NISN)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0078129035"
                      value={newNisn}
                      onChange={(e) => setNewNisn(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Tanggal Lahir Santri
                    </label>
                    <input
                      type="date"
                      value={newTtl}
                      onChange={(e) => setNewTtl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    Verifikasi & Tautkan Santri
                  </button>
                </>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Tautkan Akun Santri Lainnya</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
