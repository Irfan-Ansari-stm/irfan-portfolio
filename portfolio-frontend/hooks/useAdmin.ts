"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { saveTokens, clearTokens, saveAdminUser, getAdminUser } from "@/lib/auth";
import toast from "react-hot-toast";

interface AdminUser { id: string; email: string; name: string; avatar_url?: string }
interface AdminCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

import React from "react";
export const AdminContext = createContext<AdminCtx>({} as AdminCtx);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = getAdminUser();
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await adminApi.login(email, password);
    const { accessToken, refreshToken, admin } = res.data.data;
    saveTokens(accessToken, refreshToken);
    saveAdminUser(admin);
    setUser(admin);
    router.push("/admin");
  }

  function logout() {
    adminApi.logout().catch(() => {});
    clearTokens();
    setUser(null);
    router.push("/admin/login");
  }

  return React.createElement(AdminContext.Provider, { value: { user, loading, login, logout } }, children);
}

export function useAdmin() {
  return useContext(AdminContext);
}
