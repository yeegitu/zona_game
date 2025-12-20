// app/api/receipt/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { Booking } from "@/models/types";

// GET /api/receipt/[id]
// id bisa berupa ObjectId booking atau receiptNo
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const rawId = id?.trim();

    if (!rawId) {
      return NextResponse.json({ error: "ID kosong" }, { status: 400 });
    }

    const db = await getDb();

    let booking: Booking | null = null;

    // coba cari pakai _id dulu
    if (/^[0-9a-fA-F]{24}$/.test(rawId)) {
      try {
        const _id = new ObjectId(rawId);
        booking = await db.collection<Booking>("bookings").findOne({ _id } as any);
      } catch (e) {
        console.error("Gagal buat ObjectId dari rawId di receipt:", rawId, e);
      }
    }

    // kalau belum ketemu, coba pakai receiptNo
    if (!booking) {
      booking = await db
        .collection<Booking>("bookings")
        .findOne({ receiptNo: rawId } as any);
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 }
      );
    }

    // ==========================
    // Data untuk struk
    // ==========================
    const start = new Date((booking as any).startAt ?? new Date());
    const end = new Date((booking as any).endAt ?? new Date());

    const formatTime = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}`;

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${dd}-${mm}-${yyyy}`;
    };

    const receiptData = {
      id: ((booking as any)._id || "").toString(),
      receiptNo: booking.receiptNo ?? rawId,
      ps: booking.ps,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      status: booking.status,
      total: booking.total,
      hours: booking.hours,

      startAt: (booking as any).startAt ?? null,
      endAt: (booking as any).endAt ?? null,

      startTime: formatTime(start),
      endTime: formatTime(end),
      date: formatDate(start),

      paidAt: (booking as any).paidAt ?? null,
      paidAmount: (booking as any).paidAmount ?? booking.total,
      createdAt: (booking as any).createdAt ?? null,
    };

    return NextResponse.json({
      success: true,
      receipt: receiptData,
    });
  } catch (err) {
    console.error("GET /api/receipt/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
