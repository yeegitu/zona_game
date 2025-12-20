// app/admin/bookings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BookingStatus = "pending" | "paid" | "confirmed" | "cancelled";

type Booking = {
  _id: string;
  receiptNo: string;
  ps: string;
  hours: number;
  total: number;
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
  createdAt: string;
  paidAt?: string;

  // jadwal main
  startAt?: string;
  endAt?: string;
};

export default function AdminBookingsPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);
  const [bookingErr, setBookingErr] = useState(false);
  const [savingBooking, setSavingBooking] = useState<string | null>(null);

  // auth check
  useEffect(() => {
    const auth =
      typeof window !== "undefined" ? localStorage.getItem("admin_auth") : null;

    if (auth !== "true") {
      router.replace("/admin/login");
    } else {
      setAuthChecking(false);
    }
  }, [router]);

  async function loadBookings() {
    setLoadingBookings(true);
    setBookingMsg(null);
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      const data = (await res.json()) as Booking[];
      setBookings(data);
    } catch (e) {
      console.error("Error load bookings:", e);
      setBookingErr(true);
      setBookingMsg("Gagal memuat daftar booking");
    } finally {
      setLoadingBookings(false);
    }
  }

  async function updateBookingStatus(id: string, status: BookingStatus) {
    const yakin =
      status === "cancelled" ? confirm("Yakin mau cancel booking ini?") : true;
    if (!yakin) return;

    setSavingBooking(id);
    setBookingMsg(null);

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setBookingErr(true);
        setBookingMsg(data?.error || "Gagal update status booking");
        return;
      }

      setBookingErr(false);
      setBookingMsg("Status booking berhasil diupdate ✅");
      await loadBookings();
    } catch (e) {
      console.error("Error update booking:", e);
      setBookingErr(true);
      setBookingMsg("Terjadi kesalahan saat update booking");
    } finally {
      setSavingBooking(null);
    }
  }

  useEffect(() => {
    if (!authChecking) loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecking]);

  const rupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const dateTime = (d: string) =>
    new Date(d).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const timeOnly = (d: string) =>
    new Date(d).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusBadge = (s: BookingStatus) => {
    const base = "px-2 py-0.5 rounded-full text-[10px] font-semibold border ";
    if (s === "pending")
      return base + "text-amber-200 border-amber-300/40 bg-amber-500/10";
    if (s === "paid")
      return base + "text-emerald-200 border-emerald-300/40 bg-emerald-500/10";
    if (s === "confirmed")
      return base + "text-sky-200 border-sky-300/40 bg-sky-500/10";
    return base + "text-rose-200 border-rose-300/40 bg-rose-500/10";
  };

  const neutralButtonClass =
    "px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-100 " +
    "bg-white/5 border border-white/20 " +
    "hover:bg-white/10 hover:border-white/40 transition";

  const primaryButtonClass =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-sm " +
    "bg-gradient-to-r from-indigo-400/90 via-sky-400/90 to-cyan-300/90 text-slate-900 " +
    "shadow-[0_0_20px_rgba(56,189,248,0.8)] border border-cyan-200/60 " +
    "hover:shadow-[0_0_26px_rgba(56,189,248,1)] hover:translate-y-[1px] " +
    "active:scale-[0.97] transition";

  const dangerButtonClass =
    "px-2.5 py-1 rounded-xl text-[10px] font-semibold text-slate-50 " +
    "bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 " +
    "shadow-[0_0_14px_rgba(248,113,113,0.9)] border border-red-300/80 " +
    "hover:shadow-[0_0_20px_rgba(248,113,113,1)] hover:translate-y-[1px] " +
    "active:scale-[0.97] transition";

  // urutkan terbaru dulu
  const sortedBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bookings]);

  if (authChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-200">
        Checking access...
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 text-foreground">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-400">
            Admin
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white">
            Daftar Booking
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Kelola konfirmasi & pembatalan booking.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin" className={neutralButtonClass}>
            ← Kembali ke Dashboard
          </Link>
          <button onClick={loadBookings} className={neutralButtonClass}>
            Refresh
          </button>
        </div>
      </header>

      {bookingMsg && (
        <p
          className={`text-[11px] sm:text-xs ${
            bookingErr ? "text-rose-400" : "text-emerald-300"
          }`}
        >
          {bookingMsg}
        </p>
      )}

      <section className="p-4 sm:p-6 rounded-2xl shadow-[0_18px_45px_rgba(0,0,0,0.6)] w-full bg-white/5 backdrop-blur-xl border border-white/10">
        {loadingBookings ? (
          <p className="text-xs sm:text-sm text-slate-300">Memuat booking...</p>
        ) : sortedBookings.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-400">Belum ada booking.</p>
        ) : (
          // 🧩 grid: HP 2 kolom, tablet 3, laptop 4
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedBookings.map((b) => {
              const hasSchedule = !!b.startAt && !!b.endAt;

              return (
                <div
                  key={b._id}
                  className="rounded-2xl border border-white/12 bg-black/25 p-3 sm:p-4 shadow-[0_14px_38px_rgba(0,0,0,0.65)]"
                >
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                      {b.receiptNo}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm sm:text-base font-bold text-white">
                        {b.customerName}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        ({b.customerPhone})
                      </span>
                      <span className={statusBadge(b.status)}>{b.status}</span>
                    </div>

                    <p className="text-[11px] sm:text-sm text-slate-200">
                      {b.ps} • {b.hours} jam •{" "}
                      <span className="text-sky-200 font-semibold">
                        {rupiah(b.total)}
                      </span>
                    </p>

                    {/* jadwal main */}
                    {hasSchedule ? (
                      <p className="text-[10px] sm:text-[11px] text-slate-300">
                        Sesi:{" "}
                        <span className="text-sky-200 font-semibold">
                          {timeOnly(b.startAt!)} → {timeOnly(b.endAt!)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500">
                        Sesi:{" "}
                        <span className="italic">belum ada jadwal (legacy)</span>
                      </p>
                    )}

                    <p className="text-[10px] text-slate-500">
                      Dibuat: {dateTime(b.createdAt)}
                      {b.paidAt ? ` • Paid: ${dateTime(b.paidAt)}` : ""}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className={
                        primaryButtonClass +
                        " text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                      onClick={() => updateBookingStatus(b._id, "confirmed")}
                      disabled={
                        savingBooking === b._id ||
                        b.status === "confirmed" ||
                        b.status === "cancelled"
                      }
                    >
                      {savingBooking === b._id ? "..." : "Confirm"}
                    </button>

                    <button
                      className={
                        dangerButtonClass +
                        " disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                      onClick={() => updateBookingStatus(b._id, "cancelled")}
                      disabled={savingBooking === b._id || b.status === "cancelled"}
                    >
                      {savingBooking === b._id ? "..." : "Cancel"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
