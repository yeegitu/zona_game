// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Leaf, Wifi, Sofa, CupSoda, MapPin, Car, Instagram, Music2, PhoneCall, Gamepad2, ShieldCheck } from "lucide-react";

type Game = {
  _id?: string;
  nama_game: string;
  gambar: string;
};

type PsStatus = {
  _id?: string;
  ps: string;
  status: "kosong" | "terisi";
};

export default function UserPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [rooms, setRooms] = useState<PsStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gamesRes, psRes] = await Promise.all([
          fetch("/api/games", { cache: "no-store" }),
          fetch("/api/ps", { cache: "no-store" }),
        ]);

        setGames(await gamesRes.json());
        setRooms(await psRes.json());
      } catch (err) {
        console.error("Error fetch data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center text-slate-300">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-10 text-foreground">

      {/* ADMIN BUTTON (TOP RIGHT) */}
      <a
        href="/admin/login"
        className="
          fixed top-4 right-4
          z-50
          flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10
          rounded-full 
          bg-white/5 
          border border-white/20
          hover:bg-white/10
          shadow-[0_0_12px_rgba(56,189,248,0.45)]
          backdrop-blur-xl
          transition
        "
      >
        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
      </a>

      {/* HEADER */}
      <header className="text-center space-y-2 relative pt-6">

        {/* Glow Background */}
        <div className="absolute inset-0 -top-4 flex justify-center pointer-events-none">
          <div className="w-64 sm:w-96 h-24 bg-gradient-radial from-sky-500/30 via-transparent to-transparent blur-3xl" />
        </div>

        <h1
          className="
    text-4xl sm:text-5xl font-extrabold tracking-wide 
    text-transparent bg-clip-text
    bg-[linear-gradient(135deg,_#a855f7_20%,_#60a5fa_45%,_rgba(255,255,255,0.4)_55%,_#3b0764_80%)]
    drop-shadow-[0_0_25px_rgba(147,51,234,0.55)]
    flex items-center justify-center gap-2
  "
        >
          <Gamepad2
            className="
      w-8 h-8 sm:w-10 sm:h-10
      text-purple-300 
      drop-shadow-[0_0_12px_rgba(167,139,250,0.8)]
    "
          />
          Playstation
        </h1>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-wide text-white drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]">
          Zona Game
        </h1>

        <p className="text-[11px] sm:text-sm text-slate-400 tracking-wide">
          Pilih game favorit & cek ketersediaan ruang.
        </p>
      </header>


      {/* ============================
          STATUS RUANG PS
      ============================ */}
      <section className="p-4 sm:p-6 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] bg-white/5 backdrop-blur-xl border border-white/10">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="h-2 w-2 bg-fuchsia-300 rounded-full shadow-[0_0_10px_rgba(232,121,249,1)]" />
          Status Ruang PS
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          {rooms.map((room) => {
            const isTerisi = room.status === "terisi";

            return (
              <div
                key={room._id}
                className={`
                  rounded-2xl p-3 sm:p-4 text-center shadow-[0_14px_38px_rgba(0,0,0,0.7)]
                  border
                  ${isTerisi
                    ? "border-red-400/70 bg-red-400/20 shadow-[0_0_20px_rgba(248,113,113,0.8)]"
                    : "border-sky-400/70 bg-sky-400/20 shadow-[0_0_20px_rgba(56,189,248,0.8)]"
                  }
                  backdrop-blur-xl transition hover:-translate-y-[3px]
                `}
              >
                <p className="text-xs uppercase tracking-wide text-slate-200">
                  Playstation
                </p>

                <p className="text-sm sm:text-lg font-bold text-white mt-1">
                  {room.ps}
                </p>

                <p
                  className={`mt-1 text-[11px] sm:text-xs font-semibold ${isTerisi ? "text-red-200" : "text-sky-200"
                    }`}
                >
                  {isTerisi ? "SEDANG DIPAKAI" : "KOSONG"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* GARIS PEMISAH */}
      <div className="w-full border-t border-white/10 mt-6 pt-6" />

      {/* BUTTON BOOKING WHATSAPP */}
      <div className="flex justify-center mt-3">
        <a
          href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20ingin%20booking%20ruang%20PS.%20Masih%20tersedia?"
          target="_blank"
          rel="noreferrer"
          className="
      flex items-center gap-2 px-5 py-2
      rounded-full 
      bg-green-500/20 
      border border-green-400/40 
      hover:border-green-300
      hover:bg-green-500/30
      shadow-[0_0_20px_rgba(74,222,128,0.35)]
      text-green-200 font-semibold 
      backdrop-blur-xl transition
      text-sm sm:text-base
    "
        >
          <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 drop-shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
          Booking via WhatsApp
        </a>
      </div>

      {/* INFO HARGA */}

      <div className="text-center space-y-1">
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-slate-400">
          Harga Sewa
        </p>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]">
          1 JAM — 5K
        </h2>

        <p className="text-lg sm:text-2xl font-bold tracking-wide text-sky-200 drop-shadow-[0_0_6px_rgba(125,211,252,0.6)]">
          SEWA KONSOL 12 JAM — 80K
        </p>
      </div>

      {/* GARIS PEMISAH */}
      <div className="w-full border-t border-white/10 mt-6 pt-6" />

      {/* ============================
          DAFTAR GAME
      ============================ */}
      <section className="p-4 sm:p-6 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] bg-white/5 backdrop-blur-xl border border-white/10">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="h-2 w-2 bg-sky-300 rounded-full shadow-[0_0_10px_rgba(56,189,248,1)]" />
          Daftar Game
        </h2>

        {games.length === 0 ? (
          <p className="text-slate-400 text-sm">Belum ada game.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 w-full">
            {games.map((g) => (
              <div
                key={g._id}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_14px_38px_rgba(0,0,0,0.7)] hover:-translate-y-1 transition"
              >
                {/* THUMBNAIL */}
                <div className="relative w-full h-20 sm:h-24 bg-black/30">
                  <img
                    src={g.gambar}
                    alt={g.nama_game}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                </div>

                {/* NAMA GAME */}
                <div className="p-2 text-center">
                  <p className="text-[10px] sm:text-xs text-slate-100 font-semibold line-clamp-2">
                    {g.nama_game}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================
    FASILITAS ZONA GAME (PRO)
============================ */}
      <section className="p-4 sm:p-6 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] bg-white/5 backdrop-blur-xl border border-white/10">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="h-2 w-2 bg-emerald-300 rounded-full shadow-[0_0_10px_rgba(52,211,153,1)]" />
          Fasilitas di Zona Game
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">

          {/* TEMPAT TEDUH & SEJUK */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            <Leaf className="w-7 h-7 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <div>
              <p className="text-sm font-semibold text-slate-50">Tempat Teduh & Sejuk</p>
              <p className="text-[11px] text-slate-400">
                Dekat pepohonan & sawah, suasana adem dan nyaman.
              </p>
            </div>
          </div>

          {/* FREE WIFI */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            <Wifi className="w-7 h-7 text-sky-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            <div>
              <p className="text-sm font-semibold text-slate-50">Free WiFi</p>
              <p className="text-[11px] text-slate-400">
                Internet cepat untuk mabar online.
              </p>
            </div>
          </div>

          {/* SOFA NYAMAN */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            <Sofa className="w-7 h-7 text-purple-300 drop-shadow-[0_0_6px_rgba(216,180,254,0.8)]" />
            <div>
              <p className="text-sm font-semibold text-slate-50">Sofa Nyaman</p>
              <p className="text-[11px] text-slate-400">
                Duduk empuk & enak buat lama-lama main.
              </p>
            </div>
          </div>

          {/* SNACK */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            <CupSoda className="w-7 h-7 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            <div>
              <p className="text-sm font-semibold text-slate-50">Snack & Minuman</p>
              <p className="text-[11px] text-slate-400">
                Camilan buat nemenin push rank.
              </p>
            </div>
          </div>

          {/* LOKASI STRATEGIS */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            <MapPin className="w-7 h-7 text-red-300 drop-shadow-[0_0_6px_rgba(252,165,165,0.8)]" />
            <div>
              <p className="text-sm font-semibold text-slate-50">Lokasi Strategis</p>
              <p className="text-[11px] text-slate-400">
                Dekat jalan besar, mudah ditemukan.
              </p>
            </div>
          </div>

          {/* PARKIR LUAS */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            <Car className="w-7 h-7 text-blue-300 drop-shadow-[0_0_6px_rgba(147,197,253,0.8)]" />
            <div>
              <p className="text-sm font-semibold text-slate-50">Parkir Luas</p>
              <p className="text-[11px] text-slate-400">
                Area parkir aman dan dekat lokasi.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative pt-6 mt-8 border-t border-white/10">
        {/* Glow background tipis di atas footer */}
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-24 w-56 sm:w-80 bg-gradient-radial from-sky-500/30 via-transparent to-transparent blur-3xl" />

        <p className="text-[11px] sm:text-xs text-slate-400 text-center mb-3">
          Follow & hubungi kami:
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@playstation_zone"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs sm:text-sm text-slate-100 hover:bg-white/10 hover:border-sky-400/60 shadow-[0_0_18px_rgba(56,189,248,0.35)] backdrop-blur-xl transition"
          >
            <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
            <span className="font-medium">@playstation_zone</span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/playstation_zone"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs sm:text-sm text-slate-100 hover:bg-white/10 hover:border-pink-400/60 shadow-[0_0_18px_rgba(244,114,182,0.35)] backdrop-blur-xl transition"
          >
            <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-pink-300" />
            <span className="font-medium">@playstation_zone</span>
          </a>
        </div>

        <p className="mt-4 text-[10px] sm:text-[11px] text-slate-600 text-center">
          © {new Date().getFullYear()} Playstation Zona Game
        </p>
      </footer>

    </main>
  );
}
