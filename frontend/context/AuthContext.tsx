"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, fetchCurrentUser, loginUser, signupUser, logoutUser, getAuthToken, removeAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email_or_phone: string, password: string) => Promise<void>;
  signup: (full_name: string, email_or_phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await fetchCurrentUser();
      setUser(u);
    } catch (err) {
      console.warn("Failed to fetch user with stored token:", err);
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email_or_phone: string, password: string) => {
    const res = await loginUser({ email_or_phone, password });
    setUser(res.user);
  };

  const signup = async (full_name: string, email_or_phone: string, password: string) => {
    const res = await signupUser({ full_name, email_or_phone, password });
    setUser(res.user);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
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
