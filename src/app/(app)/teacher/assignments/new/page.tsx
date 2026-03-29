"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, Save } from "lucide-react";
import { PROGRAM_LABELS } from "@/types";

export default function NewAssignmentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [program, setProgram] = useState("general");
  const [moduleNumber, setModuleNumber] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: err } = await supabase.from("assignments").insert({
      teacher_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      program,
      module_number: moduleNumber,
      due_date: dueDate || null,
      is_active: true,
    });

    if (err) {
      setError("שגיאה ביצירת המשימה: " + err.message);
      setLoading(false);
    } else {
      router.push("/teacher");
    }
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/teacher" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <h1 className="section-title mb-0">משימה חדשה</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <div>
            <label className="label">כותרת המשימה *</label>
            <input
              type="text"
              className="input"
              placeholder="לדוגמה: סרט קצר על זהות"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className="label">תיאור המשימה</label>
            <textarea
              className="input min-h-[120px] resize-y"
              placeholder="הסבר מה על התלמידים לעשות, מה הציפיות, קריטריונים לציון..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">מסלול</label>
              <select
                className="input"
                value={program}
                onChange={e => setProgram(e.target.value)}
              >
                {Object.entries(PROGRAM_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">מספר מודול</label>
              <input
                type="number"
                className="input"
                min={1}
                max={20}
                value={moduleNumber}
                onChange={e => setModuleNumber(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="label">תאריך יעד (אופציונלי)</label>
            <input
              type="datetime-local"
              className="input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="btn-gold flex-1 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {loading ? "שומר..." : "פרסם משימה"}
          </button>
          <Link href="/teacher" className="btn-ghost">ביטול</Link>
        </div>
      </form>
    </div>
  );
}
