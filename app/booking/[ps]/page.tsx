"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PsStatus = "kosong" | "terisi";
type PsRoom = { ps: string; status: PsStatus };

// data dari /api/availability
type BusySlot = { startAt: string; endAt: string };

const PRICE_PER_HOUR = 5000;

// 24 jam buka
const OPEN_HOUR = 0;   // 00:00
const CLOSE_HOUR = 24; // 24:00 (hari yang sama)
const STEP_MINUTES = 30;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateInputValue(d: Date) {
  // YYYY-MM-DD (lokal)
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function fmtTime(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  // bentrok kalau start < otherEnd dan end > otherStart
  return aStart < bEnd && aEnd > bStart;
}

export default function BookingDetail({
  params,
}: {
  params: Promise<{ ps: string }>;
}) {
  // ✅ WAJIB unwrap
  const { ps } = use(params);
  const psName = decodeURIComponent(ps);

  const [room, setRoom] = useState<PsRoom | null>(null);
  const [loading, setLoading] = useState(true);

  const [hours, setHours] = useState(1);

  // tanggal booking (default hari ini)
  const [dateStr, setDateStr] = useState(() => toLocalDateInputValue(new Date()));

  // pilihan jam mulai (format "HH:MM")
  const [startTime, setStartTime] = useState<string>("");

  // slot sibuk dari server
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // setelah booking sukses
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);

  console.log("bookingId di UI =", bookingId);
  console.log("receiptNo di UI =", receiptNo);

  // ambil data PS
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ps", { cache: "no-store" });
        const data: PsRoom[] = await res.json();

        const key = psName.trim().toLowerCase();
        setRoom(data.find((r) => r.ps?.trim().toLowerCase() === key) || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [psName]);

  // ambil busy slots setiap PS / tanggal berubah
  useEffect(() => {
    if (!room) return;

    (async () => {
      setBusyLoading(true);
      try {
        const qs = new URLSearchParams({
          ps: room.ps,
          date: dateStr,
        });

        const res = await fetch(`/api/availability?${qs.toString()}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        // harapannya: { slots: BusySlot[] } atau langsung BusySlot[]
        const slots: BusySlot[] = Array.isArray(data) ? data : data.slots || [];
        setBusySlots(slots);
      } catch {
        // kalau endpoint belum ada/eror, jangan bikin UI mati total
        setBusySlots([]);
      } finally {
        setBusyLoading(false);
      }
    })();
  }, [room, dateStr]);

  const total = useMemo(() => hours * PRICE_PER_HOUR, [hours]);
  const rupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  // derive startAt & endAt dari date + startTime + hours
  const startAt = useMemo(() => {
    if (!startTime) return null;
    const [hh, mm] = startTime.split(":").map(Number);
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }, [dateStr, startTime]);

  const endAt = useMemo(() => {
    if (!startAt) return null;
    return addMinutes(startAt, hours * 60);
  }, [startAt, hours]);

  // generate semua pilihan jam mulai per STEP_MINUTES
  const startTimeOptions = useMemo(() => {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return [];

    const dayStart = new Date(y, m - 1, d, OPEN_HOUR, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, CLOSE_HOUR, 0, 0, 0);

    // ubah busySlots ke Date
    const busy = busySlots
      .map((s) => ({
        start: new Date(s.startAt),
        end: new Date(s.endAt),
      }))
      .filter((s) => !isNaN(s.start.getTime()) && !isNaN(s.end.getTime()));

    const opts: { value: string; disabled: boolean; reason?: string }[] = [];

    for (let t = new Date(dayStart); t < dayEnd; t = addMinutes(t, STEP_MINUTES)) {
      const candStart = t;
      const candEnd = addMinutes(candStart, hours * 60);

      // 24 jam buka → tidak perlu break walau candEnd lewat 24:00

      const conflict = busy.some((b) => overlaps(candStart, candEnd, b.start, b.end));

      opts.push({
        value: fmtTime(candStart),
        disabled: conflict,
        reason: conflict ? "Sudah dibooking (confirmed)" : undefined,
      });
    }

    return opts;
  }, [dateStr, busySlots, hours]);

  // set startTime default kalau belum ada / yang dipilih jadi invalid
  useEffect(() => {
    if (bookingId) return; // kalau sudah booking, jangan ubah
    if (!startTimeOptions.length) {
      setStartTime("");
      return;
    }

    const chosen = startTimeOptions.find((o) => o.value === startTime);
    if (!startTime || !chosen || chosen.disabled) {
      const firstValid = startTimeOptions.find((o) => !o.disabled);
      setStartTime(firstValid?.value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTimeOptions]);

  const isTerisi = room?.status === "terisi";

  const timeSummary = useMemo(() => {
    if (!startAt || !endAt) return null;

    const startDay = new Date(
      startAt.getFullYear(),
      startAt.getMonth(),
      startAt.getDate()
    ).getTime();
    const endDay = new Date(
      endAt.getFullYear(),
      endAt.getMonth(),
      endAt.getDate()
    ).getTime();
    const plusDays = Math.round(
      (endDay - startDay) / (24 * 60 * 60 * 1000)
    );

    return `${fmtTime(startAt)} → ${fmtTime(endAt)} (${hours} jam)${plusDays > 0 ? ` (+${plusDays} hari)` : ""
      }`;
  }, [startAt, endAt, hours]);

  const selectedTimeInvalid = useMemo(() => {
    if (!startAt || !endAt) return false;

    // cek lagi bentrok dari busySlots (front-end guard)
    const busy = busySlots
      .map((s) => ({ start: new Date(s.startAt), end: new Date(s.endAt) }))
      .filter((s) => !isNaN(s.start.getTime()) && !isNaN(s.end.getTime()));

    return busy.some((b) => overlaps(startAt, endAt, b.start, b.end));
  }, [startAt, endAt, busySlots]);

  async function submitBooking() {
    if (!room) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      setMsg("Nama dan nomor WA wajib diisi.");
      return;
    }

    if (!startAt || !endAt) {
      setMsg("Pilih jam mulai dulu.");
      return;
    }

    if (selectedTimeInvalid) {
      setMsg("Jam yang dipilih bentrok dengan booking lain. Pilih jam lain ya.");
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ps: room.ps,
          hours,
          total,
          customerName,
          customerPhone,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          date: dateStr,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error || "Gagal membuat booking");
        return;
      }

      setBookingId(data.id);
      setReceiptNo(data.receiptNo);

      setMsg("Booking dibuat ✅ Silakan bayar via QRIS lalu download struk.");
    } catch {
      setMsg("Terjadi kesalahan saat booking");
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-300">
        Loading...
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-300">
        Ruang tidak ditemukan.{" "}
        <Link className="text-sky-300 underline ml-2" href="/booking">
          Kembali
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/booking" className="text-sky-300 hover:underline text-sm">
          ← Kembali
        </Link>

        <p className="text-slate-300 text-sm">
          Ruang: <span className="text-white font-semibold">{room.ps}</span>
        </p>
        <div />
      </div>

      <section className="p-4 sm:p-6 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] bg-white/5 backdrop-blur-xl border border-white/10">
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          Booking Ruang
        </h2>

        <p className="text-slate-400 text-sm mt-1">
          Harga per jam:{" "}
          <span className="text-sky-200 font-semibold">
            {rupiah(PRICE_PER_HOUR)}
          </span>
        </p>

        {/* kalau status admin "terisi", blok (sesuai versi kamu) */}
        {isTerisi && !bookingId && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-red-200 text-sm">
            Ruang ini sedang dipakai (status dari admin). Silakan pilih ruang lain.
          </div>
        )}

        {/* Durasi + Total */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Durasi (1–12 jam)</label>
            <select
              disabled={isTerisi && !bookingId}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/15 text-white outline-none focus:border-sky-300/50 disabled:opacity-60"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} jam
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl p-4 bg-sky-500/10 border border-sky-300/20">
            <p className="text-slate-300 text-sm">Total</p>
            <p className="text-sky-200 font-extrabold text-2xl">
              {rupiah(total)}
            </p>
          </div>
        </div>

        {/* Tanggal + Jam mulai + Jam selesai */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Tanggal</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              disabled={isTerisi && !bookingId}
              className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/15 text-white outline-none focus:border-sky-300/50 disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-400">
              {busyLoading ? "Cek ketersediaan jam..." : "Pilih tanggal bermain."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Jam mulai</label>
            <select
              disabled={isTerisi && !bookingId}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/15 text-white outline-none focus:border-sky-300/50 disabled:opacity-60"
            >
              {!startTimeOptions.length && (
                <option value="">Tidak ada jam tersedia</option>
              )}
              {!!startTimeOptions.length && (
                <>
                  {startTimeOptions.map((o) => (
                    <option key={o.value} value={o.value} disabled={o.disabled}>
                      {o.value}
                      {o.disabled && o.reason ? ` — ${o.reason}` : ""}
                    </option>
                  ))}
                </>
              )}
            </select>

            {timeSummary && (
              <p className="text-[11px] text-slate-300">
                Sesi:{" "}
                <span className="text-sky-200 font-semibold">{timeSummary}</span>
              </p>
            )}

            {selectedTimeInvalid && (
              <p className="text-[11px] text-red-200">
                Jam ini bentrok dengan booking lain. Pilih jam lain.
              </p>
            )}
          </div>
        </div>

        {/* form */}
        <div className="space-y-2 mt-6">
          <label className="text-slate-300 text-sm">Nama</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/15 text-white outline-none"
            placeholder="Nama kamu"
            disabled={isTerisi && !bookingId}
          />

          <label className="text-slate-300 text-sm mt-2 block">
            No WhatsApp
          </label>
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/15 text-white outline-none"
            placeholder="08xxxx / +62xxxx"
            disabled={isTerisi && !bookingId}
          />

          <button
            onClick={submitBooking}
            disabled={
              (isTerisi && !bookingId) ||
              saving ||
              !!bookingId ||
              !startAt ||
              !endAt ||
              selectedTimeInvalid ||
              !startTimeOptions.some((o) => !o.disabled)
            }
            className={`mt-3 inline-flex w-full justify-center rounded-xl px-4 py-2.5
              bg-sky-500/20 border border-sky-300/30 hover:bg-sky-500/30 hover:border-sky-200/50
              text-sky-100 font-semibold transition
              ${saving ? "opacity-70" : ""}
              ${(isTerisi && !bookingId) || bookingId ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {saving
              ? "Membuat Booking..."
              : bookingId
                ? "Booking sudah dibuat"
                : "Buat Booking"}
          </button>

          {msg && <p className="text-xs text-slate-300 mt-2">{msg}</p>}
        </div>

        {/* QRIS + download struk */}
        {bookingId && (
          <div className="mt-6 rounded-2xl p-4 bg-emerald-500/10 border border-emerald-300/20">
            <p className="text-slate-200 font-semibold">Pembayaran QRIS</p>
            {/* ... QRIS & teks ... */}

            {receiptNo && (
              <p className="text-center text-xs text-slate-300 mt-3">
                Kode Struk:{" "}
                <span className="text-emerald-200 font-semibold">
                  {receiptNo}
                </span>
              </p>
            )}

            {bookingId && (
              <a
                href={`/api/receipt/${encodeURIComponent(bookingId)}`}
                className="mt-4 inline-flex w-full justify-center rounded-xl px-4 py-2.5
      bg-emerald-500/20 border border-emerald-300/30 hover:bg-emerald-500/30 hover:border-emerald-200/50
      text-emerald-100 font-semibold transition"
              >
                Saya sudah bayar — Download Struk
              </a>
            )}


            {/* tombol selesai dll */}
          </div>
        )}

      </section>
    </main>
  );
}
