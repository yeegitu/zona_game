// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { Booking } from "@/models/types";

const PRICE_PER_HOUR = 5000;

const ACTIVE_STATUSES = ["pending", "paid","confirmed"] as const;

// helper bikin receipt number
function makeReceiptNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ZG-${y}${m}${day}-${rand}`;
}

function isValidDate(d: Date) {
  return d instanceof Date && !isNaN(d.getTime());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      ps: string;
      hours: number;
      customerName: string;
      customerPhone: string;

      // ✅ baru
      startAt: string; // ISO
      endAt: string; // ISO
    };

    if (
      !body?.ps ||
      !body?.customerName ||
      !body?.customerPhone ||
      !body?.startAt ||
      !body?.endAt
    ) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 12) {
      return NextResponse.json({ error: "Jam harus 1–12" }, { status: 400 });
    }

    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);

    if (!isValidDate(startAt) || !isValidDate(endAt)) {
      return NextResponse.json({ error: "Tanggal/jam tidak valid" }, { status: 400 });
    }

    if (endAt <= startAt) {
      return NextResponse.json({ error: "Jam selesai harus setelah jam mulai" }, { status: 400 });
    }

    // ✅ pastikan durasi sesuai hours (toleransi 1 menit)
    const diffMin = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
    const expectedMin = hours * 60;
    if (Math.abs(diffMin - expectedMin) > 1) {
      return NextResponse.json(
        { error: "Durasi tidak sesuai dengan jam yang dipilih" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // ✅ cek bentrok (overlap)
    // Bentrok kalau existing.startAt < newEnd && existing.endAt > newStart
    const conflict = await db.collection<Booking>("bookings").findOne({
      ps: body.ps,
      status: { $in: [...ACTIVE_STATUSES] as any },
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Jam yang dipilih sudah dibooking orang lain. Pilih jam lain." },
        { status: 409 }
      );
    }

    const receiptNo = makeReceiptNo();

    const doc: Booking = {
      receiptNo,
      ps: body.ps,
      hours,
      pricePerHour: PRICE_PER_HOUR,
      total: hours * PRICE_PER_HOUR,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      status: "pending",
      createdAt: new Date(),

      // ✅ simpan schedule
      startAt,
      endAt,
    } as any;

    const result = await db.collection<Booking>("bookings").insertOne(doc as any);

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      receiptNo,
      total: doc.total,
      startAt: doc.startAt,
      endAt: doc.endAt,
    });
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const list = await db
      .collection<Booking>("bookings")
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
