// models/types.ts
import { ObjectId } from "mongodb";

export type PsStatusValue = "kosong" | "terisi";

export interface PsStatus {
  _id?: ObjectId;
  ps: string;
  status: PsStatusValue;
}

export type BookingStatus = "pending" | "paid" | "confirmed" | "cancelled";

export interface Booking {
  _id?: ObjectId;
  receiptNo: string;

  ps: string;
  hours: number;
  pricePerHour: number;
  total: number;

  customerName: string;
  customerPhone: string;

  status: BookingStatus;

  // ✅ waktu dibuat booking (waktu submit)
  createdAt: Date;

  // ✅ jadwal main (baru)
  // NOTE: dibuat optional biar data booking lama tetap aman
  startAt?: Date;
  endAt?: Date;

  // ✅ pembayaran
  paidAt?: Date;
  paidAmount?: number;
}
