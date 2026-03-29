import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClipboardList, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { PROGRAM_LABELS, STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from "@/types";

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch all active assignments + my submission for each
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, profiles(full_name)")
    .eq("is_active", true)
    .order("module_number", { ascending: true })
    .order("due_date", { ascending: true });

  const { data: mySubmissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", user.id);

  const submissionMap = new Map(mySubmissions?.map(s => [s.assignment_id, s]) ?? []);

  // Group by program
  const grouped: Record<string, typeof assignments> = {};
  for (const a of assignments ?? []) {
    const key = a.program ?? "general";
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(a);
  }

  const totalAssignments = assignments?.length ?? 0;
  const submittedCount = mySubmissions?.length ?? 0;
  const doneCount = mySubmissions?.filter(s => s.status === "done").length ?? 0;
  const needsRevision = mySubmissions?.filter(s => s.status === "needs_revision").length ?? 0;

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="text-gold" size={26} />
        <h1 className="section-title mb-0">המשימות שלי</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-white">{totalAssignments}</p>
          <p className="text-xs text-gray-400">סה"כ</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-green-400">{doneCount}</p>
          <p className="text-xs text-gray-400">הושלמו</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-yellow-400">{submittedCount - doneCount}</p>
          <p className="text-xs text-gray-400">בתהליך</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-red-400">{needsRevision}</p>
          <p className="text-xs text-gray-400">לתיקון</p>
        </div>
      </div>

      {/* Grouped by program */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <ClipboardList className="mx-auto mb-3 opacity-30" size={40} />
          <p>אין משימות פתוחות כרגע</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([program, programAssignments]) => (
            <div key={program}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                {PROGRAM_LABELS[program] ?? program}
              </h2>
              <div className="space-y-2">
                {programAssignments?.map((assignment) => {
                  const sub = submissionMap.get(assignment.id);
                  const status = sub?.status as SubmissionStatus | undefined;
                  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !sub;

                  return (
                    <Link key={assignment.id} href={`/assignments/${assignment.id}`}
                      className="card hover:border-gold/30 transition-colors flex items-center gap-4">
                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {status === "done" ? (
                          <CheckCircle className="text-green-400" size={22} />
                        ) : status === "needs_revision" ? (
                          <AlertCircle className="text-red-400" size={22} />
                        ) : status ? (
                          <Clock className="text-yellow-400" size={22} />
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 ${isOverdue ? "border-red-500" : "border-dark-400"}`} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white">{assignment.title}</p>
                          {assignment.module_number > 1 && (
                            <span className="text-xs text-gray-500">מודול {assignment.module_number}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {assignment.profiles?.full_name && `מדריך: ${assignment.profiles.full_name} · `}
                          {assignment.due_date
                            ? `עד ${new Date(assignment.due_date).toLocaleDateString("he-IL")}`
                            : "ללא תאריך יעד"}
                        </p>
                        {sub?.teacher_feedback && status === "needs_revision" && (
                          <p className="text-xs text-red-400 mt-1 truncate">
                            פידבק: {sub.teacher_feedback}
                          </p>
                        )}
                      </div>

                      {/* Badge */}
                      <div className="flex-shrink-0">
                        {status ? (
                          <span className={`badge border text-xs ${STATUS_COLORS[status]}`}>
                            {STATUS_LABELS[status]}
                          </span>
                        ) : (
                          <span className={`badge border text-xs ${isOverdue ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-dark-300 text-gray-400 border-dark-400"}`}>
                            {isOverdue ? "פג תוקף" : "לא הוגשה"}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
