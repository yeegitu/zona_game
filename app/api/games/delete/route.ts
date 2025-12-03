// app/api/games/delete/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json({ error: "ID wajib ada" }, { status: 400 });
    }

    const db = await getDb();
    const objectId = new ObjectId(id);

    const result = await db
      .collection("games")
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Game tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Game berhasil dihapus" });
  } catch (err) {
    console.error("POST /api/games/delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
