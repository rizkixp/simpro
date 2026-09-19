"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolData } from "@/contexts/SchoolDataContext";
import { User, UserRole } from "@/types/school";
import {
  ShieldCheck,
  UserCheck,
  BookOpen,
  HeartHandshake,
  Search,
  Plus,
  KeyRound,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  X,
  Lock,
  UserPlus,
  ShieldAlert,
  Wallet,
} from "lucide-react";

export default function PenggunaPage() {
  const { user: currentUser, userList, addUser, updateUser, deleteUser, resetPassword, resetUsersToDefault } = useAuth();
  const { guruList, siswaList, kelasList } = useSchoolData();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetDefaultConfirmOpen, setIsResetDefaultConfirmOpen] = useState(false);

  // Selected User for Modals
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Visible Passwords Set (for table peek)
  const [visiblePasswords, setVisiblePasswords] = useState<{ [userId: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Add User Form State
  const [addRole, setAddRole] = useState<UserRole>("guru");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addNisnOrNip, setAddNisnOrNip] = useState("");
  const [addKelas, setAddKelas] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addStatus, setAddStatus] = useState<"Aktif" | "Nonaktif">("Aktif");

  // Edit User Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("guru");
  const [editNisnOrNip, setEditNisnOrNip] = useState("");
  const [editKelas, setEditKelas] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<"Aktif" | "Nonaktif">("Aktif");

  // Reset Password Form State
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [copyAfterReset, setCopyAfterReset] = useState(true);

  // Generator Helper
  const generateRandomPassword = (role?: UserRole) => {
    const prefixes = ["Smart", "Juara", "Bintang", "Hebat", "Cerdas", "Prestasi", "Sekolah"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const symbols = ["#", "!", "@", "$"];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    return `${prefix}${symbol}${randomNum}`;
  };

  // Quick Autofill from existing Guru / Siswa
  const handleAutofillGuru = (guruId: string) => {
    const found = guruList.find((g) => g.id === guruId);
    if (!found) return;
    setAddName(`${found.nama}${found.gelar ? `, ${found.gelar}` : ""}`);
    setAddEmail(found.email || `guru.${found.nip.slice(-4)}@sekolah.id`);
    setAddNisnOrNip(found.nip);
    setAddKelas(found.kelasWali || "");
    setAddPhone(found.noHp || "");
    setAddPassword(generateRandomPassword("guru"));
  };

  const handleAutofillSiswa = (siswaId: string) => {
    const found = siswaList.find((s) => s.id === siswaId);
    if (!found) return;
    if (addRole === "siswa") {
      setAddName(found.nama);
      setAddEmail(`siswa.${found.nisn}@sekolah.id`);
      setAddNisnOrNip(found.nisn);
      setAddKelas(found.kelas);
      setAddPhone(found.noHpWali || "");
      setAddPassword(generateRandomPassword("siswa"));
    } else if (addRole === "ortu") {
      setAddName(`${found.namaWali} (Wali ${found.nama})`);
      setAddEmail(`wali.${found.nisn}@sekolah.id`);
      setAddNisnOrNip(found.nisn);
      setAddKelas(found.kelas);
      setAddPhone(found.noHpWali || "");
      setAddPassword(generateRandomPassword("ortu"));
    }
  };

  // Open Add Modal
  const handleOpenAddModal = (initialRole: UserRole = "guru") => {
    setAddRole(initialRole);
    setAddName("");
    setAddEmail("");
    setAddPassword(generateRandomPassword(initialRole));
    setShowAddPassword(false);
    setAddNisnOrNip("");
    setAddKelas("");
    setAddPhone("");
    setAddStatus("Aktif");
    setIsAddModalOpen(true);
  };

  // Handle Submit Add User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      showToast("Nama, Email, dan Password wajib diisi!", "error");
      return;
    }

    // Check duplicate email
    const emailExists = userList.some((u) => u.email.toLowerCase() === addEmail.trim().toLowerCase());
    if (emailExists) {
      showToast(`Email ${addEmail} sudah terdaftar pada pengguna lain.`, "error");
      return;
    }

    const defaultAvatars: Record<UserRole, string> = {
      admin: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      bendahara: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
      guru: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      siswa: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      ortu: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    };

    addUser({
      name: addName.trim(),
      email: addEmail.trim().toLowerCase(),
      role: addRole,
      password: addPassword.trim(),
      nisnOrNip: addNisnOrNip.trim() || undefined,
      kelas: addKelas.trim() || undefined,
      phone: addPhone.trim() || undefined,
      status: addStatus,
      avatar: defaultAvatars[addRole],
      createdAt: new Date().toISOString().split("T")[0],
    });

    setIsAddModalOpen(false);
    showToast(`Akun ${getRoleLabel(addRole)} "${addName}" berhasil dibuat dengan password: ${addPassword}`, "success");
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: User) => {
    setTargetUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditNisnOrNip(u.nisnOrNip || "");
    setEditKelas(u.kelas || "");
    setEditPhone(u.phone || "");
    setEditStatus(u.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      showToast("Nama dan Email tidak boleh kosong.", "error");
      return;
    }

    // Check duplicate email with another user
    const duplicate = userList.find(
      (u) => u.id !== targetUser.id && u.email.toLowerCase() === editEmail.trim().toLowerCase()
    );
    if (duplicate) {
      showToast(`Email ${editEmail} sudah digunakan oleh ${duplicate.name}.`, "error");
      return;
    }

    updateUser(targetUser.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      nisnOrNip: editNisnOrNip.trim() || undefined,
      kelas: editKelas.trim() || undefined,
      phone: editPhone.trim() || undefined,
      status: editStatus,
    });

    setIsEditModalOpen(false);
    showToast(`Data pengguna "${editName}" berhasil diperbarui!`, "success");
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (u: User) => {
    setTargetUser(u);
    const gen = generateRandomPassword(u.role);
    setNewPassword(gen);
    setShowNewPassword(true);
    setCopyAfterReset(true);
    setIsResetModalOpen(true);
  };

  const handleExecuteResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      showToast("Password baru minimal 4 karakter.", "error");
      return;
    }

    const resPassword = resetPassword(targetUser.id, newPassword.trim());
    if (resPassword) {
      if (copyAfterReset) {
        navigator.clipboard.writeText(resPassword);
      }
      setIsResetModalOpen(false);
      showToast(
        `Password untuk ${targetUser.name} berhasil direset! ${copyAfterReset ? "(Tersalin ke clipboard)" : ""}`,
        "success"
      );
    }
  };

  // Toggle Password Peek in Table
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Copy to Clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Tersalin ke clipboard: ${text}`, "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle Status
  const handleToggleStatus = (u: User) => {
    if (u.id === currentUser?.id) {
      showToast("Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan.", "error");
      return;
    }
    const nextStatus = u.status === "Aktif" ? "Nonaktif" : "Aktif";
    updateUser(u.id, { status: nextStatus });
    showToast(`Status akun ${u.name} diubah menjadi ${nextStatus}.`, "info");
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (u: User) => {
    if (u.id === currentUser?.id || u.email === currentUser?.email) {
      showToast("Anda tidak dapat menghapus akun Anda sendiri saat sedang login!", "error");
      return;
    }
    setTargetUser(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetUser) return;
    deleteUser(targetUser.id);
    setIsDeleteModalOpen(false);
    showToast(`Akun "${targetUser.name}" berhasil dihapus.`, "success");
    setTargetUser(null);
  };

  // Helper Labels & Icons
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return {
          label: "Admin / Kepala Sekolah",
          badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          icon: ShieldCheck,
        };
      case "bendahara":
        return {
          label: "Bendahara Sekolah",
          badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
          icon: Wallet,
        };
      case "guru":
        return {
          label: "Guru / Pendidik",
          badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          icon: GraduationCap,
        };
      case "siswa":
        return {
          label: "Siswa",
          badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          icon: BookOpen,
        };
      case "ortu":
        return {
          label: "Wali Murid / Ortu",
          badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          icon: HeartHandshake,
        };
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "bendahara":
        return "Bendahara";
      case "guru":
        return "Guru";
      case "siswa":
        return "Siswa";
      case "ortu":
        return "Wali Murid";
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const adminCount = userList.filter((u) => u.role === "admin").length;
    const bendaharaCount = userList.filter((u) => u.role === "bendahara").length;
    const guruCount = userList.filter((u) => u.role === "guru").length;
    const siswaCount = userList.filter((u) => u.role === "siswa").length;
    const ortuCount = userList.filter((u) => u.role === "ortu").length;
    const activeCount = userList.filter((u) => u.status === "Aktif").length;

    return {
      admin: adminCount,
      bendahara: bendaharaCount,
      guru: guruCount,
      siswa: siswaCount,
      ortu: ortuCount,
      total: userList.length,
      active: activeCount,
    };
  }, [userList]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      // Role Filter
      if (selectedRoleFilter !== "all" && u.role !== selectedRoleFilter) {
        return false;
      }
      // Status Filter
      if (selectedStatusFilter !== "all" && u.status !== selectedStatusFilter) {
        return false;
      }
      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchId = u.nisnOrNip ? u.nisnOrNip.toLowerCase().includes(q) : false;
        const matchPhone = u.phone ? u.phone.toLowerCase().includes(q) : false;
        const matchKelas = u.kelas ? u.kelas.toLowerCase().includes(q) : false;
        return matchName || matchEmail || matchId || matchPhone || matchKelas;
      }
      return true;
    });
  }, [userList, selectedRoleFilter, selectedStatusFilter, searchTerm]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/80 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-800"
              : "bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
          {toast.type === "info" && <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Manajemen Akun & Pengguna
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tambah pengguna baru dengan kata sandi, dan reset password mandiri untuk 4 peran: Admin, Guru, Siswa, dan Wali Murid.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsResetDefaultConfirmOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            title="Kembalikan semua akun ke data demo default"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data Default
          </button>

          <button
            onClick={() => handleOpenAddModal("guru")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* 5 Role KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Admin Card */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "admin" ? "all" : "admin")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            selectedRoleFilter === "admin"
              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-md ring-2 ring-blue-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              Hak Penuh
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Peran Admin
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.admin}</h3>
              <span className="text-xs text-slate-400">Akun Superuser</span>
            </div>
          </div>
        </div>

        {/* Bendahara Card */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "bendahara" ? "all" : "bendahara")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            selectedRoleFilter === "bendahara"
              ? "bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 shadow-md ring-2 ring-teal-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
              Keuangan
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Peran Bendahara
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.bendahara}</h3>
              <span className="text-xs text-slate-400">Kas & SPP</span>
            </div>
          </div>
        </div>

        {/* Guru Card */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "guru" ? "all" : "guru")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            selectedRoleFilter === "guru"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Pendidik
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Peran Guru
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.guru}</h3>
              <span className="text-xs text-slate-400">Pengajar & Wali</span>
            </div>
          </div>
        </div>

        {/* Siswa Card */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "siswa" ? "all" : "siswa")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            selectedRoleFilter === "siswa"
              ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 shadow-md ring-2 ring-purple-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
              Peserta Didik
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Peran Siswa
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.siswa}</h3>
              <span className="text-xs text-slate-400">Portal Siswa</span>
            </div>
          </div>
        </div>

        {/* Ortu / Wali Card */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "ortu" ? "all" : "ortu")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            selectedRoleFilter === "ortu"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-md ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Wali Murid
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Peran Wali Murid
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.ortu}</h3>
              <span className="text-xs text-slate-400">Monitoring Anak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, NISN/NIP, kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Pills & Status Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setSelectedRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRoleFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("admin")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRoleFilter === "admin"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600"
              }`}
            >
              Admin ({stats.admin})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("bendahara")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRoleFilter === "bendahara"
                  ? "bg-teal-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-teal-600"
              }`}
            >
              Bendahara ({stats.bendahara})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("guru")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRoleFilter === "guru"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
              }`}
            >
              Guru ({stats.guru})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("siswa")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRoleFilter === "siswa"
                  ? "bg-purple-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
              }`}
            >
              Siswa ({stats.siswa})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("ortu")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRoleFilter === "ortu"
                  ? "bg-amber-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-600"
              }`}
            >
              Wali ({stats.ortu})
            </button>
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="Aktif">Hanya Aktif</option>
            <option value="Nonaktif">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Identitas & Info</th>
                <th className="py-3.5 px-4">Kata Sandi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShieldAlert className="w-12 h-12 mb-3 stroke-1 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300 text-base">
                        Tidak ada data pengguna yang cocok
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Coba ubah kata kunci pencarian atau sesuaikan filter peran dan status di atas.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedRoleFilter("all");
                          setSelectedStatusFilter("all");
                        }}
                        className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const RoleIcon = roleBadge.icon;
                  const isPeeked = !!visiblePasswords[u.id];
                  const isCurrentSelf = currentUser?.id === u.id || currentUser?.email === u.email;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Avatar & User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D8ABC&color=fff`
                            }
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {u.name}
                              </span>
                              {isCurrentSelf && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Mail className="w-3 h-3" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${roleBadge.badgeClass}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Identitas / Kelas / Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {u.nisnOrNip && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                {u.role === "guru" ? "NIP:" : "NISN:"} {u.nisnOrNip}
                              </span>
                            </div>
                          )}
                          {u.kelas && (
                            <div className="inline-block font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                              {u.kelas}
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Password with Peek & Copy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 min-w-[100px] flex items-center justify-between">
                            <span>{isPeeked ? u.password || "-" : "••••••••"}</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title={isPeeked ? "Sembunyikan password" : "Lihat password"}
                            >
                              {isPeeked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {u.password && (
                            <button
                              type="button"
                              onClick={() => handleCopy(u.password || "", u.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                              title="Salin password"
                            >
                              {copiedId === u.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          title="Klik untuk ubah status"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            u.status === "Aktif"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === "Aktif" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {u.status}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {u.createdAt || "-"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetModal(u)}
                            className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-xl transition-colors"
                            title="Reset Password Pengguna"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit User Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(u)}
                            disabled={isCurrentSelf}
                            className={`p-2 rounded-xl transition-colors ${
                              isCurrentSelf
                                ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            }`}
                            title={isCurrentSelf ? "Akun Anda sendiri tidak dapat dihapus" : "Hapus Akun Pengguna"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>
            Menampilkan <strong className="text-slate-700 dark:text-slate-200">{filteredUsers.length}</strong> dari{" "}
            <strong className="text-slate-700 dark:text-slate-200">{userList.length}</strong> total pengguna
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Aktif: {stats.active}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Nonaktif: {userList.length - stats.active}
            </span>
          </div>
        </div>
      </div>

      {/* ================= MODAL: TAMBAH PENGGUNA BARU ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    Tambah Pengguna & Buat Password
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih salah satu dari 4 peran akun: Admin, Guru, Siswa, atau Wali Murid.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Role Selection Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Pilih Peran Akun (Role)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { role: "admin", label: "Admin", icon: ShieldCheck, color: "blue" },
                      { role: "bendahara", label: "Bendahara", icon: Wallet, color: "teal" },
                      { role: "guru", label: "Guru", icon: GraduationCap, color: "emerald" },
                      { role: "siswa", label: "Siswa", icon: BookOpen, color: "purple" },
                      { role: "ortu", label: "Wali Murid", icon: HeartHandshake, color: "amber" },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const isSelected = addRole === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => {
                          setAddRole(item.role);
                          setAddPassword(generateRandomPassword(item.role));
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Autofill Helper */}
              {addRole === "guru" && guruList.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autofill Cepat dari Database Guru:</span>
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAutofillGuru(e.target.value);
                    }}
                    defaultValue=""
                    className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Guru untuk Isi Otomatis --</option>
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.nip}) - Wali {g.kelasWali || "Non-Wali"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(addRole === "siswa" || addRole === "ortu") && siswaList.length > 0 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {addRole === "siswa"
                        ? "Autofill Cepat dari Database Siswa:"
                        : "Autofill dari Data Siswa & Wali:"}
                    </span>
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAutofillSiswa(e.target.value);
                    }}
                    defaultValue=""
                    className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">-- Pilih Siswa untuk Isi Otomatis --</option>
                    {siswaList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.nisn}) - {s.kelas} {s.namaWali ? `[Wali: ${s.namaWali}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati, S.Pd / Ahmad Pratama"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email Login */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Login (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@sekolah.id"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password Initial with Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi Awal <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddPassword(generateRandomPassword(addRole))}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    🎲 Buat Password Acak
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full pl-3 pr-10 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Row: NISN/NIP & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {addRole === "guru" ? "NIP Guru" : addRole === "siswa" || addRole === "ortu" ? "NISN Siswa" : "NIP / Nomor Identitas"}
                  </label>
                  <input
                    type="text"
                    placeholder="Opsional (misal: 1985... atau 0078...)"
                    value={addNisnOrNip}
                    onChange={(e) => setAddNisnOrNip(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas Terkait
                  </label>
                  <select
                    value={addKelas}
                    onChange={(e) => setAddKelas(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Tidak Terikat / Umum --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row: Phone & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as "Aktif" | "Nonaktif")}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif (Dapat Login)</option>
                    <option value="Nonaktif">Nonaktif (Diblokir)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                >
                  Simpan & Buat Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PASSWORD ================= */}
      {isResetModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Reset Password Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atur kata sandi baru untuk akses login akun.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Info */}
            <form onSubmit={handleExecuteResetPassword} className="p-5 space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <img
                  src={
                    targetUser.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.name)}&background=0D8ABC&color=fff`
                  }
                  alt={targetUser.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                    {targetUser.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{targetUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Peran: {getRoleLabel(targetUser.role)}
                    </span>
                    {targetUser.password && (
                      <span className="text-[11px] text-slate-400">
                        Password lama: <span className="font-mono">{targetUser.password}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password Baru
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword(targetUser.role))}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    🎲 Buat Acak
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full pl-3 pr-10 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Copy Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyAfterReset}
                  onChange={(e) => setCopyAfterReset(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                />
                <span>Salin password baru otomatis ke clipboard setelah disimpan</span>
              </label>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PENGGUNA ================= */}
      {isEditModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Edit Informasi Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbarui profil, hak akses peran, atau status aktif akun.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleUpdateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Login
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Admin / Kepala Sekolah</option>
                    <option value="bendahara">Bendahara Sekolah</option>
                    <option value="guru">Guru / Pendidik</option>
                    <option value="siswa">Siswa</option>
                    <option value="ortu">Wali Murid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "Aktif" | "Nonaktif")}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NISN / NIP
                  </label>
                  <input
                    type="text"
                    value={editNisnOrNip}
                    onChange={(e) => setEditNisnOrNip(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas
                  </label>
                  <select
                    value={editKelas}
                    onChange={(e) => setEditKelas(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Umum / Tanpa Kelas --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS ================= */}
      {isDeleteModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Akun Pengguna?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-slate-900 dark:text-white">{targetUser.name}</strong> ({targetUser.email}) dengan
              peran <strong className="capitalize">{getRoleLabel(targetUser.role)}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI RESET DEFAULT ================= */}
      {isResetDefaultConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Semua Pengguna ke Default?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data pengguna kustom akan dikembalikan ke 4 akun demo awal.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Semua password dan akun yang baru ditambahkan akan direset kembali ke akun bawaan:
              <br />
              • Admin: <code className="text-blue-600">admin@sekolah.id / admin123</code>
              <br />
              • Guru: <code className="text-emerald-600">guru@sekolah.id / guru123</code>
              <br />
              • Siswa: <code className="text-purple-600">siswa@sekolah.id / siswa123</code>
              <br />
              • Wali: <code className="text-amber-600">ortu@sekolah.id / ortu123</code>
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetDefaultConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetUsersToDefault();
                  setIsResetDefaultConfirmOpen(false);
                  showToast("Semua akun pengguna telah direset ke data demo default.", "info");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm"
              >
                Ya, Reset ke Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
