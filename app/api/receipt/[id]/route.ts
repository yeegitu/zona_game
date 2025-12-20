import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { Booking } from "@/models/types";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Ambil ID dari path /api/receipt/:id
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const rawId = segments[segments.length - 1]?.trim();

    if (!rawId) {
      return new Response(JSON.stringify({ error: "ID kosong" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await getDb();
    const col = db.collection<Booking>("bookings");

    let booking: Booking | null = null;

    // Coba cari pakai _id
    if (/^[0-9a-fA-F]{24}$/.test(rawId)) {
      try {
        const _id = new ObjectId(rawId);
        booking = await col.findOne({ _id } as any);
      } catch (e) {
        console.error("Error ObjectId dari rawId:", rawId, e);
      }
    }

    // Kalau belum ketemu, coba pakai receiptNo
    if (!booking) {
      booking = await col.findOne({ receiptNo: rawId } as any);
    }

    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ==========================
    // Data untuk struk
    // ==========================
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);

    const formatTime = (d: Date) =>
      `${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    const tanggal = start.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // ==========================
    // Buat PDF dengan pdf-lib
    // ==========================
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    // helper untuk center text
    function centerText(text: string, size: number, y: number, bold = false) {
      const usedFont = bold ? titleFont : font;
      const textWidth = usedFont.widthOfTextAtSize(text, size);
      const x = (width - textWidth) / 2;

      page.drawText(text, {
        x,
        y,
        size,
        font: usedFont,
        color: rgb(0, 0, 0), // teks hitam
      });
    }

    // posisi awal (dari atas)
    let y = height - 80;

    // ---------- TITLE ----------
    centerText("Zona Game", 20, y, true);
    y -= 26;
    centerText(`Struk Booking - ${booking.receiptNo}`, 12, y);
    y -= 40;

    // margin kiri untuk isi
    const labelX = 80;
    const valueX = 220;
    const lineGap = 18;

    function row(label: string, value: string) {
      page.drawText(label, {
        x: labelX,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(`: ${value}`, {
        x: valueX,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineGap;
    }

    // data utama
    row("Nama", booking.customerName);
    row("No WhatsApp", booking.customerPhone);
    row("Ruang", booking.ps);

    y -= 8;
    row("Tanggal", tanggal);
    row(
      "Jam",
      `${formatTime(start)} - ${formatTime(end)} (${booking.hours} jam)`
    );

    y -= 8;
    row(
      "Harga / jam",
      `Rp ${booking.pricePerHour.toLocaleString("id-ID")}`
    );

    // ---------- TOTAL ----------
    y -= 10;
    page.drawText("TOTAL", {
      x: labelX,
      y,
      size: 13,
      font: titleFont,
      color: rgb(0, 0, 1), // biru
    });
    page.drawText(
      `: Rp ${booking.total.toLocaleString("id-ID")}`,
      {
        x: valueX,
        y,
        size: 13,
        font: titleFont,
        color: rgb(0, 0, 0),
      }
    );

    // ---------- FOOTER ----------
    y -= 40;
    centerText(
      "Terima kasih telah bermain di Zona Game.",
      10,
      y
    );
    y -= 14;
    centerText(
      "Tunjukkan struk ini kepada penjaga sebagai bukti booking.",
      10,
      y
    );



    const pdfBytes = await pdfDoc.save();

    // Kirim sebagai file PDF download
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Struk-${booking.receiptNo}.pdf"`,
      },
    });
  } catch (err) {
    console.error("GET /api/receipt error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
