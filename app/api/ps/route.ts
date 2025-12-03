// app/api/ps/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { PsStatus, PsStatusValue } from "@/models/types";

export async function GET() {
  try {
    const db = await getDb();
    const statusList = await db
      .collection<PsStatus>("ps_status")
      .find({})
      .toArray();

    return NextResponse.json(statusList);
  } catch (err) {
    console.error("GET /api/ps error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// body: { ps: "PS1", status: "terisi" | "kosong" }
export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { ps: string; status: PsStatusValue };

    const db = await getDb();
    const result = await db.collection<PsStatus>("ps_status").updateOne(
      { ps: body.ps },
      { $set: { status: body.status } },
      { upsert: true } // kalau belum ada, dibuat
    );

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("PATCH /api/ps error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
