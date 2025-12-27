"use client";

import { useState, useEffect } from "react";
import { Login } from "@/components/Login";
import { AdminDashboard } from "@/components/AdminDashboard";
import { InternDashboard } from "@/components/InternDashboard";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string; role: 'admin' | 'intern' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("team_intrasphere_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: { id: string; name: string; role: 'admin' | 'intern' }) => {
    setUser(userData);
    localStorage.setItem("team_intrasphere_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("team_intrasphere_user");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <main>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <InternDashboard user={user} onLogout={handleLogout} />
      )}
      <Toaster position="top-center" />
    </main>
  );
}
