"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, CheckCircle, AlertCircle, MessageSquare, Save } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, type Assignment, type Submission, type SubmissionStatus } from "@/types";
import { getInitials } from "@/lib/utils";

export default function TeacherAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [newStatus, setNewStatus] = useState<SubmissionStatus>("pending_feedback");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase
        .from("assignments").select("*").eq("id", id).single();
      const { data: subs } = await supabase
        .from("submissions")
        .select("*, profiles(full_name, avatar_url)")
        .eq("assignment_id", id)
        .order("created_at", { ascending: false });

      setAssignment(a);
      setSubmissions(subs ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function saveFeedback(subId: string) {
    setSaving(true);
    await supabase.from("submissions").update({
      teacher_feedback: feedback || null,
      status: newStatus,
    }).eq("id", subId);

    // Refresh submissions
    const { data: subs } = await supabase
      .from("submissions")
      .select("*, profiles(full_name, avatar_url)")
      .eq("assignment_id", id)
      .order("created_at", { ascending: false });
    setSubmissions(subs ?? []);
    setActiveSubId(null);
    setFeedback("");
    setSaving(false);
  }

  function openFeedback(sub: Submission) {
    setActiveSubId(sub.id);
    setFeedback(sub.teacher_feedback ?? "");
    setNewStatus(sub.status as SubmissionStatus);
  }

  if (loading) return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-gray-500">טוען...</div>
    </div>
  );

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/teacher" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">ניהול הגשות</p>
          <h1 className="text-xl font-bold text-white">{assignment?.title}</h1>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <MessageSquare className="mx-auto mb-3 opacity-30" size={36} />
          <p>אין הגשות עדיין</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">{submissions.length} הגשות</p>

          {submissions.map((sub) => {
            const status = sub.status as SubmissionStatus;
            const isOpen = activeSubId === sub.id;

            return (
              <div key={sub.id} className={`card border ${STATUS_COLORS[status]}`}>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar w-9 h-9 text-xs">
                      {getInitials(sub.profiles?.full_name ?? "?")}
                    </div>
                    <div>
                      <p className="font-medium text-white">{sub.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <span className={`badge border text-xs ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>

                {sub.note && (
                  <p className="text-sm text-gray-400 mb-3 bg-dark-300 rounded-lg px-3 py-2">
                    הערת תלמיד: {sub.note}
                  </p>
                )}

                {sub.media_urls?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sub.media_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="text-xs bg-dark-300 text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg transition-colors">
                        קובץ {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {sub.teacher_feedback && !isOpen && (
                  <p className="text-sm text-current opacity-80 mb-2">
                    <span className="font-semibold">פידבק שלך: </span>{sub.teacher_feedback}
                  </p>
                )}

                {/* Feedback panel */}
                {isOpen ? (
                  <div className="space-y-3 mt-3 pt-3 border-t border-current/20">
                    <div>
                      <label className="label">סטטוס</label>
                      <select
                        className="input text-sm"
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value as SubmissionStatus)}
                      >
                        <option value="pending_feedback">ממתין לפידבק</option>
                        <option value="needs_revision">נדרש תיקון</option>
                        <option value="done">הושלמה</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">פידבק לתלמיד</label>
                      <textarea
                        className="input min-h-[80px] resize-y text-sm"
                        placeholder="כתוב פידבק מפורט..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        maxLength={1000}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveFeedback(sub.id)}
                        disabled={saving}
                        className="btn-gold flex items-center gap-2 text-sm"
                      >
                        <Save size={14} />
                        {saving ? "שומר..." : "שמור פידבק"}
                      </button>
                      <button
                        onClick={() => setActiveSubId(null)}
                        className="btn-ghost text-sm"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openFeedback(sub)}
                    className="text-xs text-gray-400 hover:text-gold transition-colors flex items-center gap-1 mt-1"
                  >
                    <MessageSquare size={12} />
                    {sub.teacher_feedback ? "ערוך פידבק" : "הוסף פידבק"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
