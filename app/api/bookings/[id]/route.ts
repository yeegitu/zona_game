// app/api/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { Booking, BookingStatus, PsStatus } from "@/models/types";

const ALLOWED: BookingStatus[] = ["pending", "paid", "confirmed", "cancelled"];

function isNowWithin(booking: any) {
  if (!booking?.startAt || !booking?.endAt) return false;
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const now = new Date();
  return now >= start && now < end;
}

export async function PATCH(req: Request, _ctx: { params: { id: string } }) {
  try {
    const body = (await req.json()) as {
      status: BookingStatus;
      paidAmount?: number;
    };

    if (!body?.status) {
      return NextResponse.json({ error: "Status wajib" }, { status: 400 });
    }
    if (!ALLOWED.includes(body.status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    // 🔹 Ambil ID dari URL path: /api/bookings/:id
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const rawId = segments[segments.length - 1]?.trim();

    console.log("PATCH /api/bookings rawId =", rawId);

    if (!rawId) {
      return NextResponse.json({ error: "ID kosong" }, { status: 400 });
    }

    const db = await getDb();

    // 🔹 Cari booking: coba pakai _id dulu
    let booking: Booking | null = null;

    if (/^[0-9a-fA-F]{24}$/.test(rawId)) {
      try {
        const _id = new ObjectId(rawId);
        booking = await db.collection<Booking>("bookings").findOne({ _id } as any);
      } catch (e) {
        console.error("Gagal buat ObjectId dari rawId:", rawId, e);
      }
    }

    // 🔹 Kalau belum ketemu, coba pakai receiptNo (fallback)
    if (!booking) {
      booking = await db.collection<Booking>("bookings").findOne({
        receiptNo: rawId,
      } as any);
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    const _id = (booking as any)._id as any; // sudah pasti ada di dokumen

    const $set: Partial<Booking> = { status: body.status };

    if (body.status === "paid") {
      $set.paidAt = new Date();
      $set.paidAmount =
        typeof body.paidAmount === "number" && body.paidAmount > 0
          ? body.paidAmount
          : (booking as any).total;
    }

    await db.collection<Booking>("bookings").updateOne({ _id } as any, { $set });

    // ✅ sync ps_status (real-time, bukan jadwal future)
    if (body.status === "cancelled") {
      // kalau booking ini sedang jalan, kosongkan
      if (isNowWithin(booking as any)) {
        await db.collection<PsStatus>("ps_status").updateOne(
          { ps: (booking as any).ps },
          { $set: { status: "kosong" } }
        );
      }
    }

    if (body.status === "confirmed") {
      // kalau confirmed dan sedang dalam sesi, set terisi
      const updatedBooking = await db
        .collection<Booking>("bookings")
        .findOne({ _id } as any);
      if (updatedBooking && isNowWithin(updatedBooking as any)) {
        await db.collection<PsStatus>("ps_status").updateOne(
          { ps: (updatedBooking as any).ps },
          { $set: { status: "terisi" } }
        );
      }
    }

    const updated = await db.collection<Booking>("bookings").findOne({ _id } as any);
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error("PATCH /api/bookings/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

