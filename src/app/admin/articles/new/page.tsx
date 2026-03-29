"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, Save, Eye } from "lucide-react";

const CATEGORIES = [
  { value: "general", label: "כללי" },
  { value: "cinema", label: "קולנוע" },
  { value: "debate", label: "עיון" },
  { value: "inspiration", label: "השראה" },
  { value: "example", label: "דוגמאות עבודה" },
];

export default function NewArticlePage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(publish: boolean) {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: err } = await supabase.from("articles").insert({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      category,
      image_url: imageUrl.trim() || null,
      is_published: publish,
    });

    if (err) {
      setError("שגיאה בשמירת המאמר: " + err.message);
      setLoading(false);
    } else {
      router.push("/admin/articles");
    }
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <h1 className="section-title mb-0">מאמר חדש</h1>
      </div>

      <div className="space-y-5">
        <div className="card space-y-4">
          <div>
            <label className="label">כותרת *</label>
            <input
              type="text"
              className="input text-lg font-semibold"
              placeholder="כותרת המאמר..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={150}
            />
          </div>

          <div>
            <label className="label">קטגוריה</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">תמונה (URL, אופציונלי)</label>
            <input
              type="url"
              className="input"
              placeholder="https://..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <img src={imageUrl} alt="preview" className="mt-2 w-full h-40 object-cover rounded-lg" />
            )}
          </div>

          <div>
            <label className="label">תוכן המאמר *</label>
            <textarea
              className="input min-h-[300px] resize-y font-mono text-sm"
              placeholder="כתוב את תוכן המאמר כאן..."
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
            <p className="text-xs text-gray-600 mt-1 text-left">{body.length} תווים</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading || !title.trim() || !body.trim()}
            className="btn-gold flex-1 flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            {loading ? "שומר..." : "פרסם עכשיו"}
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading || !title.trim() || !body.trim()}
            className="btn-ghost flex items-center justify-center gap-2"
          >
            <Save size={16} />
            שמור כטיוטה
          </button>
          <Link href="/admin/articles" className="btn-ghost">ביטול</Link>
        </div>
      </div>
    </div>
  );
}
