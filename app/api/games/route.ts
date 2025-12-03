// app/api/games/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// GET semua game
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection("games").find({}).toArray();

    // pastikan _id sudah jadi string
    const games = docs.map((doc: any) => ({
      _id: doc._id.toString(),
      nama_game: doc.nama_game,
      gambar: doc.gambar,
    }));

    return NextResponse.json(games);
  } catch (err) {
    console.error("GET /api/games error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST tambah game
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama_game, gambar } = body;

    if (!nama_game || !gambar) {
      return NextResponse.json(
        { error: "nama_game dan gambar wajib diisi" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("games").insertOne({
      nama_game,
      gambar,
    });

    return NextResponse.json(
      {
        message: "Game berhasil ditambahkan",
        insertedId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/games error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
