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

    // pakai any supaya TS nggak rewel soal Date | undefined
    const anyBooking: any = booking;

    const start = new Date(anyBooking.startAt ?? new Date());
    const end = new Date(anyBooking.endAt ?? new Date());

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
      id: (anyBooking._id || "").toString(),
      receiptNo: anyBooking.receiptNo ?? rawId,
      ps: anyBooking.ps,
      customerName: anyBooking.customerName,
      customerPhone: anyBooking.customerPhone,
      status: anyBooking.status,
      total: anyBooking.total,
      hours: anyBooking.hours,

      startAt: anyBooking.startAt ?? null,
      endAt: anyBooking.endAt ?? null,

      startTime: formatTime(start),
      endTime: formatTime(end),
      date: formatDate(start),

      paidAt: anyBooking.paidAt ?? null,
      paidAmount: anyBooking.paidAmount ?? anyBooking.total,
      createdAt: anyBooking.createdAt ?? null,
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
