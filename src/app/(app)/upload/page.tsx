"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MediaUploader from "@/components/MediaUploader";
import VideoEditor from "@/components/VideoEditor";
import { ArrowRight, Film, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

type ContentMode = "images" | "video-editor";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [contentMode, setContentMode] = useState<ContentMode>("images");
  const [exportedVideo, setExportedVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Called by VideoEditor after export
  async function handleVideoExport(file: File) {
    setLoading(true);
    setError(null);
    setExportedVideo(file);

    // Auto-upload the exported video to Supabase storage
    const fileName = `edited-${Date.now()}.mp4`;
    const { data, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      setError("שגיאה בהעלאת הוידאו. נסה שנית.");
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(data.path);

    setMediaUrls([urlData.publicUrl]);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title: title.trim(),
        body: body.trim() || null,
        media_urls: mediaUrls,
      })
      .select()
      .single();

    if (insertError) {
      setError("שגיאה בשמירת הפוסט, נסה שנית");
      setLoading(false);
    } else {
      router.push(`/post/${data.id}`);
    }
  }

  const canPublish = title.trim() && !loading;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/feed"
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors"
        >
          <ArrowRight size={20} />
        </Link>
        <h1 className="section-title mb-0">פוסט חדש</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="label">כותרת *</label>
              <input
                type="text"
                className="input text-lg font-semibold"
                placeholder="כותרת הפוסט..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div>
              <label className="label">תוכן (אופציונלי)</label>
              <textarea
                className="input min-h-[100px] resize-y"
                placeholder="תאר את הפרויקט, שתף מחשבות..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
              />
              <p className="text-xs text-gray-600 mt-1 text-left">{body.length}/2000</p>
            </div>
          </div>
        </div>

        {/* Content type toggle */}
        <div>
          <div className="flex rounded-lg bg-dark-300 p-1 mb-4 w-fit">
            <button
              type="button"
              onClick={() => setContentMode("images")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                contentMode === "images"
                  ? "bg-gold text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ImageIcon size={14} />
              תמונות / וידאו פשוט
            </button>
            <button
              type="button"
              onClick={() => setContentMode("video-editor")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                contentMode === "video-editor"
                  ? "bg-gold text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Film size={14} />
              עורך וידאו
            </button>
          </div>

          {/* Simple media uploader */}
          {contentMode === "images" && (
            <MediaUploader onUpload={setMediaUrls} maxFiles={5} />
          )}

          {/* Full video editor */}
          {contentMode === "video-editor" && (
            <div className="space-y-3">
              <VideoEditor onExport={handleVideoExport} />
              {loading && (
                <p className="text-xs text-gold text-center">
                  מעלה וידאו...
                </p>
              )}
              {exportedVideo && !loading && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                  <span>✓</span>
                  הוידאו מוכן: <span className="font-mono">{exportedVideo.name}</span>
                  <span className="text-gray-500 text-xs">({(exportedVideo.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!canPublish}
            className="btn-gold flex-1"
          >
            {loading ? "שומר..." : "פרסם פוסט"}
          </button>
          <Link href="/feed" className="btn-ghost">
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}
