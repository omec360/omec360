"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MediaUploader from "@/components/MediaUploader";
import Link from "next/link";
import { ArrowRight, CheckCircle, AlertCircle, Clock, Send } from "lucide-react";
import { PROGRAM_LABELS, STATUS_LABELS, STATUS_COLORS, type Assignment, type Submission, type SubmissionStatus } from "@/types";

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const [{ data: a }, { data: s }] = await Promise.all([
        supabase.from("assignments").select("*, profiles(full_name)").eq("id", id).single(),
        supabase.from("submissions").select("*").eq("assignment_id", id).eq("student_id", user.id).maybeSingle(),
      ]);

      setAssignment(a);
      setSubmission(s);
      if (s?.note) setNote(s.note);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);

    if (submission) {
      // Update existing submission
      const { error: err } = await supabase
        .from("submissions")
        .update({ media_urls: mediaUrls.length ? mediaUrls : submission.media_urls, note, status: "submitted" })
        .eq("id", submission.id);
      if (err) { setError("שגיאה בעדכון ההגשה"); setSubmitting(false); return; }
    } else {
      // New submission
      const { error: err } = await supabase
        .from("submissions")
        .insert({ assignment_id: id, student_id: userId, media_urls: mediaUrls, note, status: "submitted" });
      if (err) { setError("שגיאה בשמירת ההגשה"); setSubmitting(false); return; }
    }

    setSuccess(true);
    setSubmitting(false);
    router.refresh();
    // Reload submission
    const { data: s } = await supabase.from("submissions").select("*").eq("assignment_id", id).eq("student_id", userId).maybeSingle();
    setSubmission(s);
  }

  if (loading) return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-gray-500">טוען...</div>
    </div>
  );

  if (!assignment) return (
    <div className="page-container">
      <p className="text-gray-500">המשימה לא נמצאה</p>
    </div>
  );

  const status = submission?.status as SubmissionStatus | undefined;
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const canResubmit = status === "needs_revision";

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assignments" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {PROGRAM_LABELS[assignment.program] ?? assignment.program} · מודול {assignment.module_number}
          </p>
          <h1 className="text-xl font-bold text-white">{assignment.title}</h1>
        </div>
      </div>

      {/* Assignment details */}
      <div className="card mb-5">
        {assignment.description && (
          <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">{assignment.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {assignment.profiles?.full_name && (
            <span>מדריך: {assignment.profiles.full_name}</span>
          )}
          {assignment.due_date && (
            <span className={isOverdue ? "text-red-400" : ""}>
              עד: {new Date(assignment.due_date).toLocaleDateString("he-IL")}
              {isOverdue && " (פג תוקף)"}
            </span>
          )}
        </div>
      </div>

      {/* Submission status */}
      {submission && (
        <div className={`card mb-5 border ${STATUS_COLORS[status!]}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {status === "done" ? <CheckCircle size={18} /> : status === "needs_revision" ? <AlertCircle size={18} /> : <Clock size={18} />}
              <span className="font-semibold">{STATUS_LABELS[status!]}</span>
            </div>
            <span className="text-xs text-gray-500">
              עודכן: {new Date(submission.updated_at).toLocaleDateString("he-IL")}
            </span>
          </div>
          {submission.teacher_feedback && (
            <div className="mt-2 pt-2 border-t border-current/20">
              <p className="text-xs font-semibold text-gray-400 mb-1">פידבק מהמדריך:</p>
              <p className="text-sm leading-relaxed">{submission.teacher_feedback}</p>
            </div>
          )}
          {submission.media_urls?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {submission.media_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline">
                  קובץ {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit / Re-submit form */}
      {(!submission || canResubmit) && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-semibold text-white">
            {canResubmit ? "הגשה מחדש" : "הגש עבודה"}
          </h2>

          <div>
            <label className="label">העלה קבצים (וידאו / תמונות)</label>
            <MediaUploader onUpload={setMediaUrls} maxFiles={5} />
          </div>

          <div>
            <label className="label">הערה (אופציונלי)</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="הוסף הערה למדריך..."
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={500}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> ההגשה נשמרה בהצלחה!
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || mediaUrls.length === 0}
            className="btn-gold w-full flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {submitting ? "שומר..." : canResubmit ? "הגש מחדש" : "הגש עבודה"}
          </button>
        </form>
      )}

      {/* Submitted + not needs revision */}
      {submission && !canResubmit && status !== "done" && (
        <div className="card text-center py-6 text-gray-400 text-sm">
          ההגשה נשלחה ומחכה לפידבק מהמדריך
        </div>
      )}
      {status === "done" && (
        <div className="card text-center py-6 text-green-400 text-sm flex items-center justify-center gap-2">
          <CheckCircle size={18} /> המשימה הושלמה בהצלחה!
        </div>
      )}
    </div>
  );
}
