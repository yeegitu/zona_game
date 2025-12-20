// app/api/bookings/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { Booking, BookingStatus, PsStatus } from "@/models/types";

const ALLOWED: BookingStatus[] = ["pending", "paid", "confirmed", "cancelled"];

type PsStatusDoc = {
  ps: string;
  status: PsStatus;
};

function isNowWithin(booking: any) {
  if (!booking?.startAt || !booking?.endAt) return false;
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const now = new Date();
  return now >= start && now < end;
}

// PATCH /api/bookings/[id]
// id = _id (ObjectId) dari dokumen booking
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }   // 👈 perhatikan ini
) {
  try {
    // ⬇️ params itu Promise → harus di-`await`
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "ID kosong" }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      status?: BookingStatus;
      paidAmount?: number;
    };

    if (!body.status) {
      return NextResponse.json({ error: "Status wajib" }, { status: 400 });
    }

    if (!ALLOWED.includes(body.status)) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const bookingsCol = db.collection<Booking>("bookings");
    const psStatusCol = db.collection<PsStatusDoc>("ps_status");

    const _id = new ObjectId(id);

    const booking = await bookingsCol.findOne({ _id } as any);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 }
      );
    }

    const $set: Partial<Booking> = { status: body.status };

    if (body.status === "paid") {
      $set.paidAt = new Date();
      $set.paidAmount =
        typeof body.paidAmount === "number" && body.paidAmount > 0
          ? body.paidAmount
          : (booking as any).total;
    }

    await bookingsCol.updateOne({ _id } as any, { $set });

    // sync ps_status kalau cancelled
    if (body.status === "cancelled") {
      if (isNowWithin(booking as any)) {
        await psStatusCol.updateOne(
          { ps: (booking as any).ps },
          { $set: { status: "kosong" } as any }
        );
      }
    }

    // sync ps_status kalau confirmed
    if (body.status === "confirmed") {
      const updatedBooking = await bookingsCol.findOne({ _id } as any);
      if (updatedBooking && isNowWithin(updatedBooking as any)) {
        await psStatusCol.updateOne(
          { ps: (updatedBooking as any).ps },
          { $set: { status: "terisi" } as any }
        );
      }
    }

    const updated = await bookingsCol.findOne({ _id } as any);

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (err) {
    console.error("PATCH /api/bookings/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
