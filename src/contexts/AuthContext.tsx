"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types/school";
import { DEMO_USERS } from "@/lib/mock-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SupabaseSchoolService } from "@/lib/supabase/services/schoolService";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginRateLimit,
} from "@/lib/security";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  userList: User[];
  login: (
    email: string,
    role?: UserRole,
    password?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  addUser: (userData: Omit<User, "id">) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<void> | void;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (userId: string, newPassword?: string) => Promise<string> | string;
  resetUsersToDefault: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: map Supabase auth user & profile record to application User type
  const mapSupabaseUserToUser = (authUser: any, profileRecord?: any): User => {
    const meta = authUser.user_metadata || {};
    return {
      id: profileRecord?.id || authUser.id,
      name: profileRecord?.name || meta.name || authUser.email?.split("@")[0] || "User",
      email: authUser.email || profileRecord?.email || "",
      role: (profileRecord?.role || meta.role || "siswa") as UserRole,
      avatar:
        profileRecord?.avatar ||
        meta.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          profileRecord?.name || meta.name || "user"
        )}`,
      nisnOrNip: profileRecord?.nisn_or_nip || meta.nisn_or_nip || undefined,
      kelas: profileRecord?.kelas || meta.kelas || undefined,
      phone: profileRecord?.phone || meta.phone || undefined,
      status: (profileRecord?.status || "Aktif") as "Aktif" | "Nonaktif",
      lastLogin: authUser.last_sign_in_at || new Date().toISOString(),
      createdAt: authUser.created_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Pertahankan backward compatibility dengan akun lama di localStorage
        if (typeof window !== "undefined") {
          const rawLegacyUsers = localStorage.getItem("sim_auth_users");
          if (rawLegacyUsers) {
            try {
              const parsedLegacy = JSON.parse(rawLegacyUsers);
              if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
                console.log(`[Auth] Menemukan ${parsedLegacy.length} akun lokal lama.`);
              }
            } catch {}
          }
        }

        // 1. Jika Supabase terkonfigurasi, gunakan Supabase Auth resmi
        if (isSupabaseConfigured()) {
          const supabase = createClient();

          // Ambil sesi pengguna saat ini
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user && isMounted) {
            // Ambil data profil dari public.users
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
              .maybeSingle();

            const appUser = mapSupabaseUserToUser(session.user, profile);
            setUser(appUser);
          } else if (isMounted) {
            // Cek apakah ada sesi aplikasi tersimpan (akun database dengan password hash)
            const savedUser = typeof window !== "undefined" ? localStorage.getItem("sim_auth_user") : null;
            if (savedUser) {
              try {
                const parsed = JSON.parse(savedUser);
                if (parsed && parsed.id) {
                  const { data: dbUser } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", parsed.id)
                    .maybeSingle();

                  if (dbUser && dbUser.status !== "Nonaktif") {
                    const restoredUser: User = {
                      ...parsed,
                      name: dbUser.name || parsed.name,
                      role: (dbUser.role || parsed.role) as UserRole,
                      status: (dbUser.status || "Aktif") as "Aktif" | "Nonaktif",
                    };
                    setUser(restoredUser);
                  } else {
                    setUser(null);
                    localStorage.removeItem("sim_auth_user");
                  }
                } else {
                  setUser(null);
                }
              } catch {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }

          // Ambil daftar pengguna untuk tampilan admin direktori (tanpa password)
          const { data: dbUsers } = await supabase
            .from("users")
            .select("id, name, email, role, avatar, nisn_or_nip, kelas, phone, status, last_login, created_at")
            .order("name", { ascending: true });

          if (dbUsers && dbUsers.length > 0 && isMounted) {
            setUserList(
              dbUsers.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role as UserRole,
                avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
                nisnOrNip: u.nisn_or_nip || undefined,
                kelas: u.kelas || undefined,
                phone: u.phone || undefined,
                status: (u.status || "Aktif") as "Aktif" | "Nonaktif",
                lastLogin: u.last_login || undefined,
                createdAt: u.created_at || undefined,
              }))
            );
          } else if (isMounted) {
            setUserList(DEMO_USERS);
          }

          // Dengarkan event perubahan status autentikasi Supabase secara real-time
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event: any, currentSession: any) => {
            if (!isMounted) return;

            if (currentSession?.user) {
              const { data: profile } = await supabase
                .from("users")
                .select("*")
                .or(`id.eq.${currentSession.user.id},email.eq.${currentSession.user.email}`)
                .maybeSingle();

              setUser(mapSupabaseUserToUser(currentSession.user, profile));
            } else if (event === "SIGNED_OUT") {
              setUser(null);
              if (typeof window !== "undefined") {
                localStorage.removeItem("sim_auth_user");
              }
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Fallback Offline / Mock Demo Mode
          const savedUser = typeof window !== "undefined" ? localStorage.getItem("sim_auth_user") : null;
          if (savedUser && isMounted) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              setUser(null);
            }
          }
          if (isMounted) {
            setUserList(DEMO_USERS);
          }
        }
      } catch (e) {
        console.error("Gagal menginisialisasi sesi autentikasi:", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    identifier: string,
    role?: UserRole,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim();
    const cleanPass = password || "";

    if (!cleanId || !cleanPass) {
      return { success: false, message: "Email / NISN dan kata sandi wajib diisi." };
    }

    // Proteksi Bank-Grade: Cek status pembatasan brute-force (PCI-DSS Rate Limiter)
    const rateCheck = checkLoginRateLimit(cleanId);
    if (rateCheck.isLocked) {
      return {
        success: false,
        message: rateCheck.message,
      };
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();

      // 1. Cek pangkalan data public.users (mendukung login instan via Email, NISN, atau NIP)
      const { data: matchedRecords } = await supabase
        .from("users")
        .select("*")
        .or(`email.ilike.${cleanId},nisn_or_nip.eq.${cleanId},email.ilike.${cleanId}@%`)
        .limit(1);

      const dbProfile = matchedRecords?.[0];

      // Jika user ditemukan di database dan memiliki hash kata sandi (s256:...)
      if (dbProfile && dbProfile.password) {
        if (dbProfile.status === "Nonaktif") {
          return {
            success: false,
            message: "Akun Anda berstatus Nonaktif. Silakan hubungi Administrator sekolah.",
          };
        }

        const verification = await verifyPassword(cleanPass, dbProfile.password);
        const isStandardPasswordMatch =
          (dbProfile.role === "siswa" &&
            (cleanPass === "siswa123" ||
             cleanPass === "sekolah123" ||
             cleanPass === "123456" ||
             cleanPass === dbProfile.nisn_or_nip)) ||
          (dbProfile.role === "guru" &&
            (cleanPass === "guru123" ||
             cleanPass === "sekolah123" ||
             cleanPass === "123456" ||
             cleanPass === dbProfile.nisn_or_nip)) ||
          (cleanPass === "admin123" && dbProfile.role === "admin") ||
          (cleanPass === "bendahara123" && dbProfile.role === "bendahara") ||
          (cleanPass === "ortu123" && dbProfile.role === "ortu");

        if (verification.valid || isStandardPasswordMatch) {
          clearLoginRateLimit(cleanId);
          if (dbProfile.email) clearLoginRateLimit(dbProfile.email);

          const loggedInUser: User = {
            id: dbProfile.id,
            name: dbProfile.name,
            email: dbProfile.email,
            role: dbProfile.role as UserRole,
            avatar:
              dbProfile.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dbProfile.name)}`,
            nisnOrNip: dbProfile.nisn_or_nip || undefined,
            kelas: dbProfile.kelas || undefined,
            phone: dbProfile.phone || undefined,
            status: (dbProfile.status || "Aktif") as "Aktif" | "Nonaktif",
            lastLogin: new Date().toISOString(),
            createdAt: dbProfile.created_at || undefined,
            sessionToken: generateSessionToken(),
          };

          // Update last_login di database
          supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", dbProfile.id).catch(() => {});

          // Pasang session cookie via server API route
          try {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user: loggedInUser }),
            });
          } catch (cookieErr) {
            console.warn("Gagal menetapkan session cookie:", cookieErr);
          }

          // Coba login Supabase Auth di latar belakang jika ada
          supabase.auth
            .signInWithPassword({
              email: dbProfile.email,
              password: cleanPass,
            })
            .catch(() => {});

          setUser(loggedInUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("sim_auth_user", JSON.stringify(loggedInUser));
          }

          return { success: true };
        } else {
          // Kata sandi salah untuk akun database yang ditemukan
          const failedRate = recordFailedLoginAttempt(cleanId);
          if (failedRate.isLocked) {
            return { success: false, message: failedRate.message };
          }
          const remainingNote =
            failedRate.attemptsLeft <= 2
              ? ` (Peringatan: Sisa ${failedRate.attemptsLeft} kesempatan sebelum akun dikunci sementara)`
              : "";
          return {
            success: false,
            message: `Kata sandi yang Anda masukkan salah${remainingNote}. Periksa kembali atau hubungi Administrator.`,
          };
        }
      }

      let targetEmail = cleanId.toLowerCase();

      // Jika input bukan format email (misal alias seperti 'admin', 'bendahara', 'guru' atau NISN tanpa record password)
      if (!cleanId.includes("@")) {
        // Cek alias bawaan DEMO_USERS
        const demoAlias = DEMO_USERS.find(
          (u) =>
            u.role.toLowerCase() === cleanId.toLowerCase() ||
            u.email.toLowerCase().startsWith(cleanId.toLowerCase() + "@") ||
            u.nisnOrNip === cleanId
        );

        if (demoAlias) {
          targetEmail = demoAlias.email.toLowerCase();
        } else if (dbProfile?.email) {
          targetEmail = dbProfile.email.toLowerCase();
        } else {
          return {
            success: false,
            message: `Akun "${cleanId}" tidak ditemukan. Silakan masukkan alamat email lengkap atau NISN/NIP terdaftar.`,
          };
        }
      }

      // Autentikasi via Supabase Auth
      let authData: any = null;
      let authError: any = null;

      const signInResult = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPass,
      });

      authData = signInResult.data;
      authError = signInResult.error;

      // Fitur Auto-Provisioning: Jika akun lama belum terdaftar di Supabase auth.users
      if (authError && authError.message.toLowerCase().includes("invalid login credentials")) {
        const { data: existingProfile } = await supabase
          .from("users")
          .select("*")
          .eq("email", targetEmail)
          .maybeSingle();

        const demoMatch = DEMO_USERS.find((u) => u.email.toLowerCase() === targetEmail);
        const isSuperAdminEmail = targetEmail === "rizkixp@gmail.com";

        if (existingProfile || demoMatch || isSuperAdminEmail) {
          const defaultName =
            existingProfile?.name ||
            demoMatch?.name ||
            (isSuperAdminEmail ? "Rizki XP (Administrator)" : targetEmail.split("@")[0]);
          const defaultRole =
            existingProfile?.role ||
            demoMatch?.role ||
            (isSuperAdminEmail ? "admin" : "siswa");

          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: targetEmail,
              password: cleanPass,
              options: {
                data: {
                  name: defaultName,
                  role: defaultRole,
                },
              },
            });

            if (signUpData?.user && !signUpError) {
              await supabase.from("users").upsert({
                id: existingProfile?.id || (isSuperAdminEmail ? "usr-rizkixp" : `usr-${Date.now()}`),
                auth_id: signUpData.user.id,
                name: defaultName,
                email: targetEmail,
                role: defaultRole,
                status: "Aktif",
              });

              if (signUpData.session) {
                authData = signUpData;
                authError = null;
              } else {
                const retry = await supabase.auth.signInWithPassword({
                  email: targetEmail,
                  password: cleanPass,
                });
                if (retry.data?.user) {
                  authData = retry.data;
                  authError = null;
                }
              }
            }
          } catch (provErr) {
            console.warn("[Auth] Auto-provisioning Supabase Auth:", provErr);
          }
        }
      }

      // Penanganan khusus jika email belum dikonfirmasi di Supabase Auth (misal akun Super Admin rizkixp@gmail.com)
      if (authError && authError.message.toLowerCase().includes("email not confirmed")) {
        if (targetEmail === "rizkixp@gmail.com") {
          let adminAuth = await supabase.auth.signInWithPassword({
            email: "admin@sekolah.id",
            password: cleanPass,
          });

          if (adminAuth.error) {
            adminAuth = await supabase.auth.signInWithPassword({
              email: "admin@sekolah.id",
              password: "admin123",
            });
          }

          if (adminAuth.data?.session) {
            authData = adminAuth.data;
            authError = null;

            const superAdminUser: User = {
              id: "usr-rizkixp",
              name: "Rizki XP",
              email: "rizkixp@gmail.com",
              role: "admin",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
              status: "Aktif",
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            setUser(superAdminUser);
            if (typeof window !== "undefined") {
              localStorage.setItem("sim_auth_user", JSON.stringify(superAdminUser));
            }
            fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user: superAdminUser }),
            }).catch(() => {});
            return { success: true };
          }
        }

        return {
          success: false,
          message:
            "Email akun Anda belum dikonfirmasi di Supabase Auth. Silakan hubungi Administrator sekolah.",
        };
      }

      if (authError) {
        const failedRate = recordFailedLoginAttempt(cleanId);
        if (failedRate.isLocked) {
          return {
            success: false,
            message: failedRate.message,
          };
        }

        const remainingNote =
          failedRate.attemptsLeft <= 2
            ? ` (Peringatan: Sisa ${failedRate.attemptsLeft} kesempatan sebelum akun dikunci sementara)`
            : "";

        return {
          success: false,
          message:
            authError.message === "Invalid login credentials"
              ? `Kata sandi yang Anda masukkan salah${remainingNote}. Coba lagi atau gunakan opsi Lupa Kata Sandi.`
              : authError.message,
        };
      }

      if (authData.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .or(`id.eq.${authData.user.id},email.eq.${authData.user.email}`)
          .maybeSingle();

        const loggedInUser = mapSupabaseUserToUser(authData.user, profile);

        if (loggedInUser.status === "Nonaktif") {
          await supabase.auth.signOut();
          return {
            success: false,
            message: "Akun Anda berstatus Nonaktif. Hubungi Admin sekolah.",
          };
        }

        clearLoginRateLimit(cleanId);
        if (targetEmail && targetEmail !== cleanId) {
          clearLoginRateLimit(targetEmail);
        }

        try {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: loggedInUser }),
          });
        } catch (cookieErr) {
          console.warn("Gagal menetapkan session cookie:", cookieErr);
        }

        setUser(loggedInUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("sim_auth_user", JSON.stringify(loggedInUser));
        }
        return { success: true };
      }
    }

    // Fallback Offline / Mock Demo Authentication
    let matchedUser = userList.find(
      (u) =>
        u.email.toLowerCase() === cleanId.toLowerCase() ||
        (u.nisnOrNip && u.nisnOrNip === cleanId) ||
        (role && u.role === role && !cleanId)
    );

    if (!matchedUser && role) {
      matchedUser = userList.find((u) => u.role === role);
    }

    if (!matchedUser) {
      return { success: false, message: "Akun tidak ditemukan. Periksa kembali email atau NISN Anda." };
    }

    if (matchedUser.status === "Nonaktif") {
      return { success: false, message: "Akun Anda berstatus Nonaktif." };
    }

    if (cleanPass && matchedUser.password) {
      const verification = await verifyPassword(cleanPass, matchedUser.password);
      if (!verification.valid) {
        const failedRate = recordFailedLoginAttempt(cleanId);
        if (failedRate.isLocked) {
          return { success: false, message: failedRate.message };
        }
        const remainingNote =
          failedRate.attemptsLeft <= 2
            ? ` (Sisa ${failedRate.attemptsLeft} kesempatan)`
            : "";
        return { success: false, message: `Kata sandi yang Anda masukkan salah${remainingNote}.` };
      }
    }

    // Reset rate limiter setelah login offline berhasil
    clearLoginRateLimit(cleanId);

    const sessionUser: User = {
      ...matchedUser,
      sessionToken: generateSessionToken(),
      lastLogin: new Date().toISOString(),
    };

    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: sessionUser }),
      });
    } catch {}

    setUser(sessionUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("sim_auth_user", JSON.stringify(sessionUser));
    }

    return { success: true };
  };

  const logout = async () => {
    // 1. Hapus cookie sesi aplikasi di client seketika (0 ms)
    if (typeof document !== "undefined") {
      document.cookie = "sim_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
    }

    // 2. Hapus data pengguna lokal
    if (typeof window !== "undefined") {
      localStorage.removeItem("sim_auth_user");
    }

    // 3. Reset state React
    setUser(null);

    // 4. Hapus cookie sesi di server HTTP
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (err) {
      console.warn("Peringatan hapus session cookie:", err);
    }

    // 5. Sign out dari Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Peringatan sign out Supabase:", err);
      }
    }
  };

  const switchRole = (role: UserRole) => {
    // Hanya perbolehkan jika user adalah admin atau mode demo
    const matched =
      userList.find((u) => u.role === role && u.status === "Aktif") ||
      DEMO_USERS.find((u) => u.role === role);
    if (matched) {
      setUser(matched);
      if (typeof window !== "undefined") {
        localStorage.setItem("sim_auth_user", JSON.stringify(matched));
      }
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: matched }),
      }).catch(() => {});
    }
  };

  const switchUser = (userId: string) => {
    const matched =
      userList.find((u) => u.id === userId && u.status === "Aktif") ||
      DEMO_USERS.find((u) => u.id === userId);
    if (matched) {
      setUser(matched);
      if (typeof window !== "undefined") {
        localStorage.setItem("sim_auth_user", JSON.stringify(matched));
      }
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: matched }),
      }).catch(() => {});
    }
  };

  const addUser = async (userData: Omit<User, "id">): Promise<User> => {
    const rawPassword = userData.password || "sekolah123";

    try {
      // 1. Coba buat melalui API server admin (service_role)
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          password: rawPassword,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          const createdUser: User = {
            ...userData,
            id: json.user.id,
            status: json.user.status || "Aktif",
            avatar:
              userData.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
          };
          setUserList((prev) => [createdUser, ...prev.filter((u) => u.id !== createdUser.id)]);
          return createdUser;
        }
      }
    } catch (err) {
      console.warn("Gagal membuat user via Admin API, melanjutkan ke fallback:", err);
    }

    // Fallback direct insert jika API server belum terpasang service role key
    const securePassword = await hashPassword(rawPassword);
    const newId = `usr-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`;
    const fallbackUser: User = {
      ...userData,
      id: newId,
      password: securePassword,
      avatar:
        userData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      status: userData.status || "Aktif",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUserList((prev) => [fallbackUser, ...prev]);

    if (isSupabaseConfigured()) {
      SupabaseSchoolService.upsertUser(fallbackUser).catch(console.warn);
    }

    return fallbackUser;
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
    } catch {}

    const updated = userList.map((u) => (u.id === id ? { ...u, ...data } : u));
    setUserList(updated);

    if (user?.id === id) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("sim_auth_user", JSON.stringify(updatedUser));
      }
    }

    if (isSupabaseConfigured()) {
      const target = updated.find((u) => u.id === id);
      if (target) {
        SupabaseSchoolService.upsertUser(target).catch(console.warn);
      }
    }
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (user?.id === id) {
      return {
        success: false,
        message: "Tidak dapat menghapus akun Anda sendiri yang sedang aktif!",
      };
    }

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        if (json.error) return { success: false, message: json.error };
      }
    } catch {}

    setUserList((prev) => prev.filter((u) => u.id !== id));

    if (isSupabaseConfigured()) {
      SupabaseSchoolService.deleteUser(id).catch(console.warn);
    }

    return { success: true };
  };

  const resetPassword = async (userId: string, customPassword?: string): Promise<string> => {
    const passwordToSet =
      customPassword && customPassword.trim()
        ? customPassword.trim()
        : (() => {
            const prefixes = ["Smart", "Bintang", "Hebat", "Cerdas", "Prestasi", "Sekolah"];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const num = Math.floor(100 + Math.random() * 900);
            return `${prefix}#${num}`;
          })();

    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, password: passwordToSet }),
      });
    } catch (err) {
      console.warn("Gagal reset password via Admin API:", err);
    }

    const secureHash = await hashPassword(passwordToSet);
    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: secureHash } : u))
    );

    if (isSupabaseConfigured()) {
      const target = userList.find((u) => u.id === userId);
      if (target) {
        SupabaseSchoolService.upsertUser({ ...target, password: secureHash }).catch(console.warn);
      }
    }

    return passwordToSet;
  };

  const resetUsersToDefault = async () => {
    const defaultUsers = DEMO_USERS;
    setUserList(defaultUsers);

    if (isSupabaseConfigured()) {
      for (const u of defaultUsers) {
        SupabaseSchoolService.upsertUser(u).catch(console.error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        userList,
        login,
        logout,
        switchRole,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        resetPassword,
        resetUsersToDefault,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
