// app/api/ps/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { PsStatus, PsStatusValue } from "@/models/types";

// daftar ruang PS default
const DEFAULT_PS_ROOMS = ["PS1", "PS2", "PS3", "PS4"];

export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection<PsStatus>("ps_status");

    // ambil semua data ruang
    let statusList = await collection.find({}).toArray();

    // kalau belum ada data sama sekali → seed default
    if (statusList.length === 0) {
      const docs: Omit<PsStatus, "_id">[] = DEFAULT_PS_ROOMS.map((psName) => ({
        ps: psName,
        status: "kosong" as PsStatusValue,
      }));

      await collection.insertMany(docs);

      // baca ulang supaya dapat _id
      statusList = await collection.find({}).toArray();
    }

    return NextResponse.json(statusList);
  } catch (err: any) {
    console.error("GET /api/ps error:", err);
    // untuk dev: kirim pesan error asli biar kelihatan di browser
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

// PATCH tetap sama seperti sebelumnya
export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { ps: string; status: PsStatusValue };

    const db = await getDb();
    const result = await db.collection<PsStatus>("ps_status").updateOne(
      { ps: body.ps },
      { $set: { status: body.status } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("PATCH /api/ps error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
