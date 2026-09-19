"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types/school";
import { DEMO_USERS } from "@/lib/mock-data";

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
  addUser: (userData: Omit<User, "id">) => User;
  updateUser: (id: string, data: Partial<User>) => void;
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
    try {
      // Load user list from localStorage
      const savedUsers = localStorage.getItem("sim_auth_users");
      if (savedUsers) {
        const parsed: User[] = JSON.parse(savedUsers);
        const merged = [...parsed];
        for (const demoU of DEMO_USERS) {
          if (!merged.some((u) => u.id === demoU.id)) {
            merged.push(demoU);
          }
        }
        setUserList(merged);
        localStorage.setItem("sim_auth_users", JSON.stringify(merged));
      } else {
        setUserList(DEMO_USERS);
        localStorage.setItem("sim_auth_users", JSON.stringify(DEMO_USERS));
      }

      // Check localStorage for active session
      const savedUser = localStorage.getItem("sim_auth_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(DEMO_USERS[0]);
        localStorage.setItem("sim_auth_user", JSON.stringify(DEMO_USERS[0]));
      }
    } catch (e) {
      console.error("Failed to load auth data", e);
      setUser(DEMO_USERS[0]);
    }
    setIsLoading(false);
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

    // Password verification if provided
    if (password && matchedUser.password) {
      if (password !== matchedUser.password) {
        return {
          success: false,
          message: "Kata sandi yang Anda masukkan salah. Coba lagi atau hubungi Admin.",
        };
      }
    }

    const updatedUser: User = {
      ...matchedUser,
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

  const addUser = (userData: Omit<User, "id">): User => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      password: userData.password || "sekolah123",
      avatar:
        userData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      status: userData.status || "Aktif",
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [newUser, ...userList];
    setUserList(updated);
    localStorage.setItem("sim_auth_users", JSON.stringify(updated));
    return newUser;
  };

  const updateUser = (id: string, data: Partial<User>) => {
    const updated = userList.map((u) => (u.id === id ? { ...u, ...data } : u));
    setUserList(updated);
    localStorage.setItem("sim_auth_users", JSON.stringify(updated));

    if (user?.id === id) {
      const updatedCurr = { ...user, ...data };
      setUser(updatedCurr);
      localStorage.setItem("sim_auth_user", JSON.stringify(updatedCurr));
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

    const updated = userList.map((u) =>
      u.id === userId ? { ...u, password: passwordToSet } : u
    );
    setUserList(updated);
    localStorage.setItem("sim_auth_users", JSON.stringify(updated));

    if (user?.id === userId) {
      const updatedCurr = { ...user, password: passwordToSet };
      setUser(updatedCurr);
      localStorage.setItem("sim_auth_user", JSON.stringify(updatedCurr));
    }

    return passwordToSet;
  };

  const resetUsersToDefault = () => {
    setUserList(DEMO_USERS);
    localStorage.setItem("sim_auth_users", JSON.stringify(DEMO_USERS));
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
