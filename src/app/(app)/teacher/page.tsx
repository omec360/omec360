import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Users, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, PROGRAM_LABELS, type SubmissionStatus } from "@/types";

export default async function TeacherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  // Fetch teacher's assignments + submission counts
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, submissions(id, status, profiles(full_name))")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  const totalAssignments = assignments?.length ?? 0;
  const totalSubmissions = assignments?.reduce((sum, a) => sum + (a.submissions?.length ?? 0), 0) ?? 0;
  const pendingFeedback = assignments?.reduce((sum, a) =>
    sum + (a.submissions?.filter((s: any) => s.status === "submitted" || s.status === "pending_feedback").length ?? 0), 0) ?? 0;

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title mb-0">פאנל מחנך</h1>
        <Link href="/teacher/assignments/new" className="btn-gold flex items-center gap-2 text-sm">
          <PlusCircle size={16} />
          משימה חדשה
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-white">{totalAssignments}</p>
          <p className="text-gray-400 text-sm">משימות</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-400">{totalSubmissions}</p>
          <p className="text-gray-400 text-sm">הגשות</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-400">{pendingFeedback}</p>
          <p className="text-gray-400 text-sm">ממתינות לפידבק</p>
        </div>
      </div>

      {/* Assignments list */}
      {assignments?.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <p className="mb-4">עדיין לא יצרת משימות</p>
          <Link href="/teacher/assignments/new" className="btn-gold inline-flex items-center gap-2">
            <PlusCircle size={16} /> צור משימה ראשונה
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments?.map((a) => {
            const subs = a.submissions ?? [];
            const pending = subs.filter((s: any) => s.status === "submitted" || s.status === "pending_feedback").length;
            const done = subs.filter((s: any) => s.status === "done").length;
            const revision = subs.filter((s: any) => s.status === "needs_revision").length;

            return (
              <Link key={a.id} href={`/teacher/assignments/${a.id}`}
                className="card hover:border-gold/30 transition-colors block">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white">{a.title}</h3>
                      <span className="badge badge-gold text-xs">
                        {PROGRAM_LABELS[a.program] ?? a.program}
                      </span>
                      {!a.is_active && (
                        <span className="badge bg-dark-300 text-gray-500 text-xs">לא פעיל</span>
                      )}
                    </div>
                    {a.description && (
                      <p className="text-sm text-gray-500 truncate mb-2">{a.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {subs.length} הגשות
                      </span>
                      {pending > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Clock size={12} /> {pending} ממתינות
                        </span>
                      )}
                      {revision > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertCircle size={12} /> {revision} לתיקון
                        </span>
                      )}
                      {done > 0 && (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle size={12} /> {done} הושלמו
                        </span>
                      )}
                    </div>
                  </div>
                  {a.due_date && (
                    <p className="text-xs text-gray-500 flex-shrink-0">
                      עד {new Date(a.due_date).toLocaleDateString("he-IL")}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
