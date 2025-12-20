// app/api/availability/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { Booking } from "@/models/types";

const ACTIVE_STATUSES = ["pending", "paid", "confirmed"] as const;

// samakan dengan frontend (durasi max)
const MAX_HOURS = 12;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ps = searchParams.get("ps");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!ps || !date) {
      return NextResponse.json({ error: "ps dan date wajib" }, { status: 400 });
    }

    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) {
      return NextResponse.json({ error: "Format date harus YYYY-MM-DD" }, { status: 400 });
    }

    // ✅ Rental 24 jam:
    // Ambil window 00:00 hari itu sampai (24 + MAX_HOURS) jam,
    // supaya booking yang start hari itu tapi selesai besok tetap ke-detect,
    // dan booking yang start besok dini hari tapi overlap dengan sesi malam juga keambil.
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 24 + MAX_HOURS, 0, 0, 0); // 36 jam window

    const db = await getDb();

    const list = await db
      .collection<Booking>("bookings")
      .find({
        ps,
        status: { $in: [...ACTIVE_STATUSES] as any },
        // overlap:
        // existing.startAt < windowEnd AND existing.endAt > windowStart
        startAt: { $lt: dayEnd },
        endAt: { $gt: dayStart },
      })
      .project({ startAt: 1, endAt: 1 })
      .sort({ startAt: 1 })
      .toArray();

    const slots = list
      .map((b: any) => ({
        startAt: b?.startAt ? new Date(b.startAt).toISOString() : null,
        endAt: b?.endAt ? new Date(b.endAt).toISOString() : null,
      }))
      .filter((s) => s.startAt && s.endAt);

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("GET /api/availability error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
