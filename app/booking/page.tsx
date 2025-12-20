// app/booking/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PsStatus = "kosong" | "terisi";
type PsRoom = { ps: string; status: PsStatus };

export default function BookingPage() {
  const [rooms, setRooms] = useState<PsRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ps", { cache: "no-store" });

        let data: unknown = [];
        try {
          data = await res.json();
          console.log("RAW /api/ps (booking):", data);
        } catch (e) {
          console.error("Gagal parse JSON /api/ps (booking), status:", res.status);
        }

        if (Array.isArray(data)) {
          setRooms(data as PsRoom[]);
        } else {
          console.warn(
            "Format /api/ps (booking) tidak sesuai (bukan array), status:",
            res.status
          );
          setRooms([]);
        }
      } catch (err) {
        console.error("Error fetch /api/ps (booking):", err);
        setError("Gagal memuat daftar ruang. Coba refresh halaman.");
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-300">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sky-300 hover:underline text-sm">
          ← Kembali
        </Link>
        <h1 className="text-white font-bold text-lg sm:text-xl">Pilih Ruang PS</h1>
        <div />
      </div>

      {error && (
        <p className="text-xs sm:text-sm text-rose-400">
          {error}
        </p>
      )}

      {rooms.length === 0 ? (
        <p className="text-xs sm:text-sm text-slate-400">
          Belum ada data ruang. Pastikan admin sudah mengatur ruang di dashboard, atau cek API <code>/api/ps</code>.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          {rooms.map((room) => {
            const isTerisi = room.status === "terisi";

            return (
              <div key={room.ps}>
                {isTerisi ? (
                  <div
                    className="
                      rounded-2xl p-3 sm:p-4 text-center
                      border border-red-400/70 bg-red-400/20
                      opacity-70 cursor-not-allowed
                    "
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-200">
                      Playstation
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-white mt-1">
                      {room.ps}
                    </p>
                    <p className="mt-1 text-[11px] sm:text-xs font-semibold text-red-200">
                      SEDANG DIPAKAI
                    </p>
                  </div>
                ) : (
                  <Link href={`/booking/${encodeURIComponent(room.ps)}`}>
                    <div
                      className="
                        rounded-2xl p-3 sm:p-4 text-center
                        border border-sky-400/70 bg-sky-400/20
                        hover:-translate-y-[3px] transition cursor-pointer
                      "
                    >
                      <p className="text-xs uppercase tracking-wide text-slate-200">
                        Playstation
                      </p>
                      <p className="text-sm sm:text-lg font-bold text-white mt-1">
                        {room.ps}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs font-semibold text-sky-200">
                        KOSONG
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
