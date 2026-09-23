"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types/school";
import { DEMO_USERS } from "@/lib/mock-data";
import { SupabaseSchoolService } from "@/lib/supabase/services/schoolService";
import { hashPassword, verifyPassword, generateSessionToken } from "@/lib/security";

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
  deleteUser: (id: string) => { success: boolean; message?: string };
  resetPassword: (userId: string, newPassword?: string) => string;
  resetUsersToDefault: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userList, setUserList] = useState<User[]>(DEMO_USERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Instant hydration from localStorage
        let currentUsers = DEMO_USERS;
        let deletedIds = new Set<string>();
        try {
          const rawDel = localStorage.getItem("sim_deleted_ids");
          if (rawDel) {
            const arr = JSON.parse(rawDel);
            if (Array.isArray(arr)) deletedIds = new Set(arr);
          }
        } catch {}

        const savedUsers = localStorage.getItem("sim_auth_users");
        if (savedUsers !== null) {
          try {
            const parsed: User[] = JSON.parse(savedUsers);
            const filtered = parsed.filter((u) => !deletedIds.has(u.id));
            currentUsers = filtered;
            setUserList(filtered);
          } catch {
            const isCleared = typeof window !== "undefined" && localStorage.getItem("sim_database_cleared") === "true";
            currentUsers = isCleared ? [] : DEMO_USERS.filter((u) => !deletedIds.has(u.id));
            setUserList(currentUsers);
          }
        } else {
          const isCleared = typeof window !== "undefined" && localStorage.getItem("sim_database_cleared") === "true";
          currentUsers = isCleared ? [] : DEMO_USERS.filter((u) => !deletedIds.has(u.id));
          setUserList(currentUsers);
        }

        const savedUser = localStorage.getItem("sim_auth_user");
        if (savedUser) {
          try {
            const parsedUser: User = JSON.parse(savedUser);
            // Session integrity guard: verify against authentic user record
            const verified = currentUsers.find((u) => u.id === parsedUser.id);
            if (verified) {
              if (verified.status === "Nonaktif") {
                setUser(null);
                localStorage.removeItem("sim_auth_user");
              } else {
                // Keep authentic role from authentic record, prevent local tampering
                setUser({
                  ...verified,
                  sessionToken: parsedUser.sessionToken || generateSessionToken(),
                  lastLogin: parsedUser.lastLogin || verified.lastLogin,
                });
              }
            } else {
              setUser(null);
              localStorage.removeItem("sim_auth_user");
            }
          } catch {
            setUser(null);
            localStorage.removeItem("sim_auth_user");
          }
        } else {
          setUser(null);
        }

        // 2. Fetch and sync with Supabase cloud users table
        if (SupabaseSchoolService.isConfigured()) {
          const remoteUsers = await SupabaseSchoolService.getUsers();
          if (remoteUsers && remoteUsers.length > 0) {
            const stale = remoteUsers.filter((u) => deletedIds.has(u.id)).map((u) => u.id);
            if (stale.length > 0) {
              stale.forEach((id) => SupabaseSchoolService.deleteUser(id).catch(() => {}));
            }
            const filteredUsers = remoteUsers.filter((u) => !deletedIds.has(u.id));
            setUserList(filteredUsers);
            localStorage.setItem("sim_auth_users", JSON.stringify(filteredUsers));

            // Anti-tamper recheck against remote authoritative source
            setUser((activeUser) => {
              if (!activeUser) return null;
              const remoteMatched = filteredUsers.find((u) => u.id === activeUser.id);
              if (remoteMatched) {
                if (remoteMatched.status === "Nonaktif") {
                  localStorage.removeItem("sim_auth_user");
                  return null;
                }
                const updatedSession = {
                  ...activeUser,
                  role: remoteMatched.role,
                  status: remoteMatched.status,
                  name: remoteMatched.name,
                };
                localStorage.setItem("sim_auth_user", JSON.stringify(updatedSession));
                return updatedSession;
              }
              return activeUser;
            });
          } else if (remoteUsers && remoteUsers.length === 0) {
            const isExplicitlyCleared = typeof window !== "undefined" && localStorage.getItem("sim_database_cleared") === "true";
            if (!isExplicitlyCleared) {
              // Table is empty, seed DEMO_USERS into Supabase with hashed passwords
              for (const u of DEMO_USERS) {
                const secureHash = await hashPassword(u.password || "password123");
                await SupabaseSchoolService.upsertUser({ ...u, password: secureHash });
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load auth data", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    email: string,
    role?: UserRole,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Search in userList
    let matchedUser = userList.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (u.nisnOrNip && u.nisnOrNip === email.trim()) ||
        (role && u.role === role && !email)
    );

    if (!matchedUser && role) {
      matchedUser = userList.find((u) => u.role === role);
    }

    if (!matchedUser) {
      return {
        success: false,
        message: "Akun tidak ditemukan. Periksa kembali email atau NISN/NIP Anda.",
      };
    }

    // Check account status
    if (matchedUser.status === "Nonaktif") {
      return {
        success: false,
        message: "Akun Anda berstatus Nonaktif. Hubungi Administrator untuk aktivasi.",
      };
    }

    // Cryptographic password verification with transparent auto-upgrade
    if (password && matchedUser.password) {
      const verification = await verifyPassword(password, matchedUser.password);
      if (!verification.valid) {
        return {
          success: false,
          message: "Kata sandi yang Anda masukkan salah. Coba lagi atau hubungi Admin.",
        };
      }

      // If password was plaintext, automatically upgrade to salted SHA-256 hash
      if (verification.needsUpgrade) {
        const secureHashedPassword = await hashPassword(password);
        matchedUser = {
          ...matchedUser,
          password: secureHashedPassword,
        };
        const updatedList = userList.map((u) =>
          u.id === matchedUser!.id ? matchedUser! : u
        );
        setUserList(updatedList);
        localStorage.setItem("sim_auth_users", JSON.stringify(updatedList));
        if (SupabaseSchoolService.isConfigured()) {
          SupabaseSchoolService.upsertUser(matchedUser).catch((err) =>
            console.warn("Gagal auto-upgrade hash kata sandi di cloud:", err)
          );
        }
      }
    }

    const sessionToken = generateSessionToken();
    const updatedUser: User = {
      ...matchedUser,
      sessionToken,
      lastLogin: new Date().toISOString(),
    };

    setUser(updatedUser);
    localStorage.setItem("sim_auth_user", JSON.stringify(updatedUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sim_auth_user");
  };

  const switchRole = (role: UserRole) => {
    const matched =
      userList.find((u) => u.role === role && u.status === "Aktif") ||
      DEMO_USERS.find((u) => u.role === role);
    if (matched) {
      setUser(matched);
      localStorage.setItem("sim_auth_user", JSON.stringify(matched));
    }
  };

  const switchUser = (userId: string) => {
    const matched =
      userList.find((u) => u.id === userId && u.status === "Aktif") ||
      DEMO_USERS.find((u) => u.id === userId);
    if (matched) {
      setUser(matched);
      localStorage.setItem("sim_auth_user", JSON.stringify(matched));
    }
  };

  const addUser = async (userData: Omit<User, "id">): Promise<User> => {
    const rawPassword = userData.password || "sekolah123";
    const securePassword = await hashPassword(rawPassword);

    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      password: securePassword,
      avatar:
        userData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      status: userData.status || "Aktif",
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [newUser, ...userList];
    setUserList(updated);
    localStorage.setItem("sim_auth_users", JSON.stringify(updated));
    try {
      const raw = localStorage.getItem("sim_deleted_ids");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const filtered = arr.filter((i) => i !== newUser.id);
          localStorage.setItem("sim_deleted_ids", JSON.stringify(filtered));
        }
      }
    } catch {}

    if (SupabaseSchoolService.isConfigured()) {
      SupabaseSchoolService.upsertUser(newUser).catch((err) =>
        console.warn("Gagal menyimpan user baru ke Supabase:", err)
      );
    }
    return newUser;
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    let toUpdate = { ...data };
    if (data.password && !data.password.startsWith("s256:")) {
      toUpdate.password = await hashPassword(data.password);
    }

    const updated = userList.map((u) => (u.id === id ? { ...u, ...toUpdate } : u));
    setUserList(updated);
    localStorage.setItem("sim_auth_users", JSON.stringify(updated));

    const updatedTarget = updated.find((u) => u.id === id);
    if (user?.id === id && updatedTarget) {
      setUser(updatedTarget);
      localStorage.setItem("sim_auth_user", JSON.stringify(updatedTarget));
    }

    if (SupabaseSchoolService.isConfigured() && updatedTarget) {
      SupabaseSchoolService.upsertUser(updatedTarget).catch((err) =>
        console.warn("Gagal memperbarui user di Supabase:", err)
      );
    }
  };

  const deleteUser = (id: string): { success: boolean; message?: string } => {
    if (user?.id === id) {
      return {
        success: false,
        message: "Tidak dapat menghapus akun yang sedang Anda gunakan saat ini!",
      };
    }
    const updated = userList.filter((u) => u.id !== id);
    setUserList(updated);
    localStorage.setItem("sim_auth_users", JSON.stringify(updated));
    try {
      const raw = localStorage.getItem("sim_deleted_ids");
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr) && !arr.includes(id)) {
        arr.push(id);
        localStorage.setItem("sim_deleted_ids", JSON.stringify(arr));
      }
    } catch {}

    if (SupabaseSchoolService.isConfigured()) {
      SupabaseSchoolService.deleteUser(id).catch((err) =>
        console.warn("Gagal menghapus user di Supabase:", err)
      );
    }
    return { success: true };
  };

  const resetPassword = (userId: string, customPassword?: string): string => {
    const passwordToSet =
      customPassword && customPassword.trim()
        ? customPassword.trim()
        : (() => {
            const prefixes = ["Smart", "Bintang", "Hebat", "Cerdas", "Prestasi", "Sekolah"];
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const num = Math.floor(100 + Math.random() * 900);
            return `${prefix}#${num}`;
          })();

    // Asynchronously hash the password before saving to storage & database
    hashPassword(passwordToSet).then((hashedPassword) => {
      setUserList((prev) => {
        const updated = prev.map((u) =>
          u.id === userId ? { ...u, password: hashedPassword } : u
        );
        localStorage.setItem("sim_auth_users", JSON.stringify(updated));
        return updated;
      });

      setUser((prevUser) => {
        if (prevUser?.id === userId) {
          const updated = { ...prevUser, password: hashedPassword };
          localStorage.setItem("sim_auth_user", JSON.stringify(updated));
          return updated;
        }
        return prevUser;
      });

      if (SupabaseSchoolService.isConfigured()) {
        const target = userList.find((u) => u.id === userId);
        if (target) {
          SupabaseSchoolService.upsertUser({ ...target, password: hashedPassword }).catch((err) =>
            console.warn("Gagal memperbarui password user di Supabase:", err)
          );
        }
      }
    });

    return passwordToSet;
  };

  const resetUsersToDefault = async () => {
    const secureDemoUsers = await Promise.all(
      DEMO_USERS.map(async (u) => ({
        ...u,
        password: await hashPassword(u.password || "password123"),
      }))
    );
    setUserList(secureDemoUsers);
    localStorage.setItem("sim_auth_users", JSON.stringify(secureDemoUsers));
    try {
      const raw = localStorage.getItem("sim_deleted_ids");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const demoIds = new Set(DEMO_USERS.map((u) => u.id));
          const filtered = arr.filter((i) => !demoIds.has(i));
          localStorage.setItem("sim_deleted_ids", JSON.stringify(filtered));
        }
      }
    } catch {}

    if (SupabaseSchoolService.isConfigured()) {
      for (const u of secureDemoUsers) {
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
