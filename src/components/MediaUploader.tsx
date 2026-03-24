"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Image as ImageIcon, Film } from "lucide-react";
import Image from "next/image";

interface MediaUploaderProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MediaUploader({ onUpload, maxFiles = 5 }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function uploadFiles(files: FileList) {
    if (uploadedUrls.length + files.length > maxFiles) {
      alert(`ניתן להעלות עד ${maxFiles} קבצים`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file, { upsert: false });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(data.path);
        newUrls.push(urlData.publicUrl);
      }
    }

    const updated = [...uploadedUrls, ...newUrls];
    setUploadedUrls(updated);
    onUpload(updated);
    setUploading(false);
  }

  function removeFile(url: string) {
    const updated = uploadedUrls.filter((u) => u !== url);
    setUploadedUrls(updated);
    onUpload(updated);
  }

  function isVideo(url: string) {
    return url.match(/\.(mp4|mov|webm|avi)$/i);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-gold bg-gold/5"
            : "border-dark-400 hover:border-gold/50 hover:bg-dark-200"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="mx-auto mb-2 text-gray-500" size={24} />
        <p className="text-gray-400 text-sm">
          {uploading ? "מעלה..." : "גרור קבצים לכאן, או לחץ לבחירה"}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          תמונות (JPG, PNG, WebP) ווידאו (MP4, MOV) — עד {maxFiles} קבצים
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          multiple
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Preview */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {uploadedUrls.map((url) => (
            <div key={url} className="relative group aspect-square bg-dark-300 rounded-lg overflow-hidden">
              {isVideo(url) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="text-gray-400" size={32} />
                  <span className="absolute bottom-1 left-1 text-xs text-gray-400">וידאו</span>
                </div>
              ) : (
                <Image src={url} alt="" fill className="object-cover" />
              )}
              <button
                onClick={() => removeFile(url)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
