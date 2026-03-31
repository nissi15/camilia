"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { useTelegram } from "@/app/tg/providers";

interface CameraButtonProps {
  context: string;
  entityId?: string;
  onPhotoUploaded: (url: string) => void;
  className?: string;
}

export function CameraButton({ context, entityId, onPhotoUploaded, className }: CameraButtonProps) {
  const { initData } = useTelegram();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", context);
      if (entityId) formData.append("entityId", entityId);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `tma ${initData}` },
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        onPhotoUploaded(url);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Photo" className="w-full h-32 object-cover rounded-xl" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onPhotoUploaded("");
            }}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-outline-variant/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-on-surface-variant/60 active:bg-surface-low active:border-tertiary/40 transition-all duration-200"
        >
          <Camera className="w-5 h-5" />
          <span className="text-xs font-medium">Take Photo</span>
        </button>
      )}
    </div>
  );
}
