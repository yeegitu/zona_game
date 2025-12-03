// app/api/games/update/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, nama_game, gambar } = body as {
      id?: string;
      nama_game?: string;
      gambar?: string;
    };

    if (!id) {
      return NextResponse.json({ error: "ID wajib ada" }, { status: 400 });
    }

    const db = await getDb();
    const objectId = new ObjectId(id);

    const result = await db.collection("games").updateOne(
      { _id: objectId },
      {
        $set: {
          nama_game,
          gambar,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Game tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Game berhasil diupdate" });
  } catch (err) {
    console.error("PATCH /api/games/update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
