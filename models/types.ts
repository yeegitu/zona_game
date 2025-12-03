// models/types.ts
import { ObjectId } from "mongodb";

export interface Game {
  _id?: ObjectId;
  name: string;
  image: string; // url gambar
}

export type PsStatusValue = "kosong" | "terisi";

export interface PsStatus {
  _id?: ObjectId;
  ps: string;            // contoh: "PS1", "PS2", "PS3", "PS4"
  status: PsStatusValue; // "kosong" | "terisi"
}
