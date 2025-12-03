"use client";

import { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (password === "Merahmuda") {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      setError("Password salah!");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="bg-white/5 backdrop-blur-xl border border-white/20 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_25px_rgba(255,255,255,0.1)]"
      >
        <h1 className="text-center text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-purple-300" />
          Admin Login
        </h1>

        <input
          type="password"
          placeholder="Masukkan password"
          className="w-full p-3 rounded-lg bg-black/40 text-white border border-white/20 focus:border-purple-400 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-300 text-sm mt-2">{error}</p>
        )}

        <button
          type="submit"
          className="
            mt-4 w-full py-2 rounded-lg 
            bg-purple-600/40 hover:bg-purple-600/60 
            border border-purple-300/40 
            text-white font-semibold
            flex items-center justify-center gap-2
            transition shadow-[0_0_15px_rgba(168,85,247,0.5)]
          "
        >
          <LogIn className="w-4 h-4" />
          Login
        </button>
      </form>
    </main>
  );
}
