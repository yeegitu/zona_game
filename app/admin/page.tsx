// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/UploadImage";

type Game = {
  _id: string;
  nama_game: string;
  gambar: string;
};

type PsStatus = "kosong" | "terisi";

type PsRoom = {
  ps: string;
  status: PsStatus;
};

export default function AdminPage() {
  const router = useRouter();

  // cek dulu auth admin
  const [authChecking, setAuthChecking] = useState(true);

  // ================================
  // STATE & LOGIC UNTUK GAME
  // ================================
  const [namaGame, setNamaGame] = useState("");
  const [gambar, setGambar] = useState("");
  const [message, setMessage] = useState("");
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingGame, setSavingGame] = useState(false);

  async function loadGames() {
    try {
      const res = await fetch("/api/games", { cache: "no-store" });

      let gamesData: Game[] = [];

      try {
        const raw = await res.json();
        console.log("RAW /api/games (admin):", raw);

        if (Array.isArray(raw)) {
          gamesData = raw;
        } else if (raw && Array.isArray((raw as any).games)) {
          // kalau backend suatu saat pakai { games: [...] }
          gamesData = (raw as any).games;
        } else {
          console.warn(
            "Format /api/games (admin) tidak sesuai (bukan array), status:",
            res.status
          );
        }
      } catch (e) {
        console.error("Gagal parse JSON /api/games (admin), status:", res.status);
      }

      setGames(gamesData);
    } catch (err) {
      console.error("Error load games:", err);
      setIsErrorMessage(true);
      setMessage("Gagal memuat daftar game");
      setGames([]); // fallback aman
    } finally {
      setLoading(false);
    }
  }

  async function simpanGame() {
    if (!namaGame || !gambar) {
      setIsErrorMessage(true);
      setMessage("Nama game dan gambar wajib diisi");
      return;
    }

    setSavingGame(true);
    setMessage("");

    try {
      let res: Response;

      if (editingId) {
        res = await fetch("/api/games/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            nama_game: namaGame,
            gambar: gambar,
          }),
        });
      } else {
        res = await fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama_game: namaGame,
            gambar: gambar,
          }),
        });
      }

      if (res.ok) {
        setIsErrorMessage(false);
        setMessage(editingId ? "Game berhasil diupdate!" : "Game berhasil ditambahkan!");
        setNamaGame("");
        setGambar("");
        setEditingId(null);
        await loadGames();
      } else {
        const errJson = await res.json().catch(() => null);
        console.error("Error simpanGame:", errJson);
        setIsErrorMessage(true);
        setMessage("Gagal menyimpan game");
      }
    } catch (err) {
      console.error(err);
      setIsErrorMessage(true);
      setMessage("Terjadi kesalahan saat menyimpan");
    } finally {
      setSavingGame(false);
    }
  }

  function mulaiEdit(game: Game) {
    setEditingId(game._id);
    setNamaGame(game.nama_game);
    setGambar(game.gambar);
    setIsErrorMessage(false);
    setMessage("");
  }

  async function hapusGame(id: string) {
    if (!id) {
      setIsErrorMessage(true);
      setMessage("ID game tidak valid");
      return;
    }

    const yakin = confirm("Yakin mau hapus game ini?");
    if (!yakin) return;

    try {
      const res = await fetch("/api/games/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setIsErrorMessage(false);
        setMessage("Game berhasil dihapus");
        await loadGames();
      } else {
        const errJson = await res.json().catch(() => null);
        console.error("Error hapus:", errJson);
        setIsErrorMessage(true);
        setMessage("Gagal menghapus game");
      }
    } catch (err) {
      console.error(err);
      setIsErrorMessage(true);
      setMessage("Terjadi kesalahan saat hapus");
    }
  }

  // ================================
  // STATE & LOGIC UNTUK STATUS RUANG PS
  // ================================
  const [psRooms, setPsRooms] = useState<PsRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<PsRoom | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PsStatus>("kosong");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  async function loadPsRooms() {
    try {
      const res = await fetch("/api/ps", { cache: "no-store" });
      const raw = await res.json();

      let roomsData: PsRoom[] = [];

      if (Array.isArray(raw)) {
        roomsData = raw as PsRoom[];
      }

      setPsRooms(roomsData);

      if (roomsData.length > 0) {
        setSelectedRoom(roomsData[0]);
        setSelectedStatus(roomsData[0].status);
      }
    } catch (err) {
      console.error("Error load ps rooms:", err);
      setStatusError(true);
      setStatusMessage("Gagal memuat status ruang");
      setPsRooms([]);
    }
  }


  async function updateStatus() {
    if (!selectedRoom) return;

    setSavingStatus(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/ps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ps: selectedRoom.ps,
          status: selectedStatus,
        }),
      });

      if (res.ok) {
        setStatusError(false);
        setStatusMessage(`Status ${selectedRoom.ps} berhasil diupdate`);

        setPsRooms((prev) =>
          prev.map((room) =>
            room.ps === selectedRoom.ps ? { ...room, status: selectedStatus } : room
          )
        );
      } else {
        setStatusError(true);
        setStatusMessage("Gagal update status ruang");
      }
    } catch (err) {
      console.error("Error update status ruang:", err);
      setStatusError(true);
      setStatusMessage("Terjadi kesalahan saat update status");
    } finally {
      setSavingStatus(false);
    }
  }

  // AUTH CHECK
  useEffect(() => {
    const auth =
      typeof window !== "undefined" ? localStorage.getItem("admin_auth") : null;

    if (auth !== "true") {
      router.replace("/admin/login");
    } else {
      setAuthChecking(false);
    }
  }, [router]);

  // LOAD DATA GAME + PS
  useEffect(() => {
    loadGames();
    loadPsRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper class tombol glossy
  const primaryButtonClass =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-sm " +
    "bg-gradient-to-r from-indigo-400/90 via-sky-400/90 to-cyan-300/90 text-slate-900 " +
    "shadow-[0_0_20px_rgba(56,189,248,0.8)] border border-cyan-200/60 " +
    "hover:shadow-[0_0_26px_rgba(56,189,248,1)] hover:translate-y-[1px] " +
    "active:scale-[0.97] transition";

  const neutralButtonClass =
    "px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-100 " +
    "bg-white/5 border border-white/20 " +
    "hover:bg-white/10 hover:border-white/40 transition";

  const warningButtonClass =
    "px-2.5 py-1 rounded-xl text-[10px] font-semibold text-slate-900 " +
    "bg-gradient-to-r from-amber-300/90 via-yellow-300/90 to-orange-300/90 " +
    "shadow-[0_0_12px_rgba(251,191,36,0.9)] border border-amber-100/80 " +
    "hover:shadow-[0_0_18px_rgba(251,191,36,1)] hover:translate-y-[1px] " +
    "active:scale-[0.97] transition";

  const dangerButtonClass =
    "px-2.5 py-1 rounded-xl text-[10px] font-semibold text-slate-50 " +
    "bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 " +
    "shadow-[0_0_14px_rgba(248,113,113,0.9)] border border-red-300/80 " +
    "hover:shadow-[0_0_20px_rgba(248,113,113,1)] hover:translate-y-[1px] " +
    "active:scale-[0.97] transition";

  if (authChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-200">
        Checking access...
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-10 text-foreground">
      <header className="space-y-2">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-400">
          Dashboard Admin
        </p>

        <h1 className="text-2xl sm:text-4xl font-bold">
          Panel Game <span className="text-sky-300">Playstation</span>
        </h1>

        <div className="flex items-center justify-end gap-2 mt-2 flex-wrap">
          <Link href="/admin/bookings" className={neutralButtonClass}>
            Kelola Booking →
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem("admin_auth");
              router.replace("/admin/login");
            }}
            className="
              px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-semibold
              bg-white/5 border border-white/20
              hover:bg-white/10 hover:border-rose-400/60
              text-rose-300
              shadow-[0_0_12px_rgba(244,63,94,0.4)]
              backdrop-blur-xl transition
            "
          >
            Logout
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
          Kelola daftar game dan status ruang dalam satu layar.
        </p>
      </header>

      {/* FORM TAMBAH / EDIT GAME */}
      <section className="p-4 sm:p-6 space-y-4 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            {editingId ? "Edit Game" : "Tambah Game Baru"}
          </h2>

          {games.length > 0 && (
            <p className="text-[11px] sm:text-xs text-slate-300">
              Total game terdaftar:{" "}
              <span className="font-semibold text-sky-300">{games.length}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 md:gap-6 items-start w-full">
          <div className="space-y-3">
            <label className="text-xs sm:text-sm space-y-1">
              <span className="block text-slate-200">Nama game</span>
              <input
                type="text"
                placeholder="Contoh: PES 2021, GTA V, Naruto Storm, dll."
                value={namaGame}
                onChange={(e) => {
                  setNamaGame(e.target.value);
                  setMessage("");
                }}
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-xs sm:text-sm
                           placeholder:text-slate-500 focus:outline-none focus:ring-2
                           focus:ring-sky-400/70 focus:border-sky-300/70 transition"
              />
            </label>

            <div className="space-y-2">
              <p className="font-semibold text-xs sm:text-sm text-slate-200">Upload Gambar</p>
              <p className="text-[11px] text-slate-400">
                Gunakan cover game atau gambar yang mudah dikenali pengunjung.
              </p>
              <UploadImage
                onUploaded={(url) => {
                  setGambar(url);
                  setMessage("");
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-300">Preview</p>
            <div className="relative aspect-[4/3] w-full rounded-2xl border border-white/15 bg-black/20 flex items-center justify-center overflow-hidden">
              {gambar ? (
                <img src={gambar} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[11px] text-slate-500 text-center px-4">
                  Gambar akan muncul di sini setelah diupload
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={simpanGame}
                disabled={savingGame}
                className={primaryButtonClass + (savingGame ? " opacity-70 cursor-not-allowed" : "")}
              >
                {savingGame ? "Menyimpan..." : editingId ? "Update Game" : "Simpan Game"}
              </button>

              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setNamaGame("");
                    setGambar("");
                    setMessage("");
                    setIsErrorMessage(false);
                  }}
                  className={neutralButtonClass}
                >
                  Batal Edit
                </button>
              )}
            </div>

            {message && (
              <p className={`mt-2 text-[11px] sm:text-xs ${isErrorMessage ? "text-rose-400" : "text-emerald-300"}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* DAFTAR GAME */}
      <section className="p-4 sm:p-6 space-y-4 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
            Daftar Game
          </h2>
        </div>

        {loading ? (
          <p className="text-xs sm:text-sm text-slate-300">Memuat data game...</p>
        ) : games.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-400">
            Belum ada game. Tambahkan game terlebih dahulu di form atas.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            {games.map((g) => (
              <div
                key={g._id}
                className="rounded-2xl border border-white/12 bg-white/5
                           shadow-[0_14px_38px_rgba(0,0,0,0.65)]
                           overflow-hidden flex flex-col"
              >
                <div className="relative w-full h-16 sm:h-20 bg-black/30">
                  <img src={g.gambar} alt={g.nama_game} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>

                <div className="p-2 space-y-2 flex-1 flex flex-col justify-between">
                  <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-slate-50 line-clamp-2">
                    {g.nama_game}
                  </p>
                  <div className="flex gap-1 pt-1">
                    <button onClick={() => mulaiEdit(g)} className={warningButtonClass}>
                      Edit
                    </button>

                    <button onClick={() => hapusGame(g._id)} className={dangerButtonClass}>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* STATUS RUANG PS */}
      <section className="p-4 sm:p-6 space-y-4 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.9)]" />
            Status Ruang PS
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Klik salah satu ruang untuk mengubah statusnya.
          </p>
        </div>

        {psRooms.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-400">
            Belum ada data ruang. Pastikan API <code>/api/ps</code> mengembalikan data.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
            {psRooms.map((room) => {
              const isTerisi = room.status === "terisi";
              const isSelected = selectedRoom?.ps === room.ps;

              return (
                <button
                  key={room.ps}
                  type="button"
                  onClick={() => {
                    setSelectedRoom(room);
                    setSelectedStatus(room.status);
                    setStatusMessage("");
                  }}
                  className={`
                    group relative rounded-2xl p-2 sm:p-3 text-left 
                    bg-white/5 border 
                    flex flex-col justify-between
                    shadow-[0_14px_38px_rgba(0,0,0,0.7)]
                    transition transform hover:-translate-y-[3px]
                    ${isTerisi
                      ? "border-emerald-400/80 shadow-[0_0_22px_rgba(52,211,153,0.9)]"
                      : "border-sky-400/80 shadow-[0_0_22px_rgba(56,189,248,0.9)]"
                    }
                    ${isSelected ? "ring-2 ring-yellow-300/80" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      Playstation
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${isTerisi
                        ? "bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,1)]"
                        : "bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,1)]"
                        }`}
                    />
                  </div>

                  <p className="mt-2 text-sm sm:text-lg font-bold text-slate-50">{room.ps}</p>

                  <p className="mt-1 text-[11px] sm:text-xs font-semibold text-slate-200">
                    Status:{" "}
                    <span className={isTerisi ? "text-emerald-300" : "text-sky-300"}>
                      {isTerisi ? "Terisi" : "Kosong"}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {selectedRoom && (
          <div className="mt-4 sm:mt-6 border-t border-white/10 pt-3 sm:pt-4 space-y-3">
            <p className="font-semibold text-xs sm:text-sm md:text-base">
              Ubah status untuk{" "}
              <span className="underline decoration-sky-300">{selectedRoom.ps}</span>
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-slate-200">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as PsStatus)}
                  className="border border-white/25 bg-black/30 rounded-xl px-3 py-1.5 text-xs sm:text-sm
                             focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:border-sky-300/70
                             transition text-slate-100"
                >
                  <option value="kosong">Kosong</option>
                  <option value="terisi">Terisi</option>
                </select>
              </label>

              <button
                onClick={updateStatus}
                disabled={savingStatus}
                className={
                  primaryButtonClass +
                  " text-xs sm:text-sm" +
                  (savingStatus ? " opacity-70 cursor-not-allowed" : "")
                }
              >
                {savingStatus ? "Menyimpan..." : "Simpan Status"}
              </button>
            </div>

            {statusMessage && (
              <p className={`text-[11px] sm:text-xs md:text-sm ${statusError ? "text-rose-400" : "text-emerald-300"}`}>
                {statusMessage}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
