// app/api/receipt/[id]/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { getDb } from "@/lib/mongodb";
import type { Booking } from "@/models/types";

// Biar pasti pakai Node.js runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/receipt/[id]
// id bisa berupa ObjectId booking atau receiptNo
export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const rawId = (id ?? "").toString().trim();

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

    const anyBooking: any = booking;

    // safety: kalau nggak ada start/end pakai now
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

    const receiptNo = anyBooking.receiptNo ?? rawId;

    // ==========================
    // Generate PDF dengan pdf-lib
    // ==========================
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([420, 600]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 12;

    let y = 560;
    const marginX = 40;

    const drawText = (
      text: string,
      opts: { bold?: boolean; size?: number } = {}
    ) => {
      const usedFont = opts.bold ? fontBold : font;
      const size = opts.size ?? fontSize;
      page.drawText(text, { x: marginX, y, size, font: usedFont });
      y -= size + 6;
    };

    // Header
    drawText("ZONA GAME", { bold: true, size: 16 });
    drawText("STRUK PEMBAYARAN", { bold: true, size: 14 });
    y -= 10;

    drawText(`No. Struk : ${receiptNo}`);
    drawText(`Tanggal   : ${formatDate(start)}`);
    drawText(`Jam       : ${formatTime(start)} - ${formatTime(end)}`);
    y -= 10;

    // Garis pemisah
    page.drawLine({
      start: { x: marginX, y },
      end: { x: 380, y },
      thickness: 1,
    });
    y -= 14;

    // Detail pelanggan & booking
    drawText(`PS / Ruang : ${anyBooking.ps}`);
    drawText(`Nama       : ${anyBooking.customerName}`);
    drawText(`No. HP     : ${anyBooking.customerPhone ?? "-"}`);
    drawText(`Durasi     : ${anyBooking.hours} jam`);
    drawText(`Status     : ${anyBooking.status}`);
    y -= 10;

    page.drawLine({
      start: { x: marginX, y },
      end: { x: 380, y },
      thickness: 1,
    });
    y -= 14;

    const rupiah = (n: number) =>
      "Rp " + n.toLocaleString("id-ID", { minimumFractionDigits: 0 });

    drawText(`Total       : ${rupiah(anyBooking.total)}`, {
      bold: true,
      size: 13,
    });
    drawText(
      `Dibayar     : ${rupiah(
        anyBooking.paidAmount ?? anyBooking.total ?? 0
      )}`
    );
    y -= 10;

    page.drawLine({
      start: { x: marginX, y },
      end: { x: 380, y },
      thickness: 1,
    });
    y -= 20;

    drawText("Terima kasih telah bermain di Zona Game!", {
      bold: true,
      size: 12,
    });
    drawText("Harap simpan struk ini sebagai bukti pembayaran.");

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="struk-${receiptNo}.pdf"`,
      },
    });
  } catch (err) {
    console.error("GET /api/receipt/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
