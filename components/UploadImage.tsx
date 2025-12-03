"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export default function UploadImage({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  return (
    <UploadButton<OurFileRouter, "gameImage">
      endpoint="gameImage"
      appearance={{
        button: {
          // ukuran dan gaya tombol
          background: "linear-gradient(135deg, #6b21a8, #9333ea)",
          color: "white",
          padding: "10px 16px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "14px",
          cursor: "pointer",
          border: "none",
          boxShadow: "0 0 12px rgba(147, 51, 234, 0.5)",
        },
        allowedContent: {
          color: "#ddd",
          fontSize: "12px",
        },
      }}
      onClientUploadComplete={(res) => {
        const url = res[0].url;
        onUploaded(url);
      }}
      onUploadError={(err) => {
        alert(`Upload gagal: ${err.message}`);
      }}
    />
  );
}
