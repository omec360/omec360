import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClipboardList, BookOpen, Film, ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { PROGRAM_LABELS, STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";

  // Fetch data in parallel
  const [
    { data: nextAssignments },
    { data: mySubmissions },
    { data: latestArticle },
    { data: recentPosts },
    { data: pendingSubmissions },
  ] = await Promise.all([
    // Next due assignments (for students)
    isTeacher
      ? { data: null }
      : supabase
          .from("assignments")
          .select("*, profiles(full_name)")
          .eq("is_active", true)
          .order("due_date", { ascending: true })
          .limit(3),

    // My recent submissions (for students)
    isTeacher
      ? { data: null }
      : supabase
          .from("submissions")
          .select("*, assignments(title, program)")
          .eq("student_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5),

    // Latest published article
    supabase
      .from("articles")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),

    // Recent feed posts
    supabase
      .from("posts")
      .select("id, title, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(3),

    // Pending submissions for teacher
    isTeacher
      ? supabase
          .from("submissions")
          .select("id, status, assignments!inner(teacher_id, title)")
          .eq("assignments.teacher_id", user.id)
          .in("status", ["submitted", "needs_revision"])
          .limit(5)
      : { data: null },
  ]);

  const submittedCount = mySubmissions?.filter(s => s.status === "submitted").length ?? 0;
  const doneCount = mySubmissions?.filter(s => s.status === "done").length ?? 0;
  const needsRevisionCount = mySubmissions?.filter(s => s.status === "needs_revision").length ?? 0;

  return (
    <div className="page-container max-w-4xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          שלום, {profile?.full_name?.split(" ")[0] ?? "שלום"} 👋
        </h1>
        <p className="text-gray-400">
          {profile?.program ? `מסלול ${PROGRAM_LABELS[profile.program]}` : "עומק 360"} · {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ===== STUDENT VIEW ===== */}
      {!isTeacher && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card text-center">
              <CheckCircle className="mx-auto mb-1 text-green-400" size={20} />
              <p className="text-2xl font-bold text-white">{doneCount}</p>
              <p className="text-xs text-gray-400">הושלמו</p>
            </div>
            <div className="card text-center">
              <Clock className="mx-auto mb-1 text-yellow-400" size={20} />
              <p className="text-2xl font-bold text-white">{submittedCount}</p>
              <p className="text-xs text-gray-400">ממתינות</p>
            </div>
            <div className="card text-center">
              <AlertCircle className="mx-auto mb-1 text-red-400" size={20} />
              <p className="text-2xl font-bold text-white">{needsRevisionCount}</p>
              <p className="text-xs text-gray-400">לתיקון</p>
            </div>
          </div>

          {/* Next assignments */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">משימות פתוחות</h2>
              <Link href="/assignments" className="text-gold text-sm flex items-center gap-1 hover:underline">
                כל המשימות <ArrowLeft size={14} />
              </Link>
            </div>
            {nextAssignments && nextAssignments.length > 0 ? (
              <div className="space-y-2">
                {nextAssignments.map((a) => {
                  const mySub = mySubmissions?.find(s => s.assignment_id === a.id);
                  return (
                    <Link key={a.id} href={`/assignments/${a.id}`}
                      className="card hover:border-gold/30 transition-colors flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {PROGRAM_LABELS[a.program] ?? a.program}
                          {a.due_date && ` · עד ${new Date(a.due_date).toLocaleDateString("he-IL")}`}
                        </p>
                      </div>
                      {mySub ? (
                        <span className={`badge border text-xs ${STATUS_COLORS[mySub.status as SubmissionStatus]}`}>
                          {STATUS_LABELS[mySub.status as SubmissionStatus]}
                        </span>
                      ) : (
                        <span className="badge bg-dark-300 text-gray-400 border border-dark-400 text-xs">
                          לא הוגשה
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="card text-center py-8 text-gray-500">
                אין משימות פתוחות כרגע
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== TEACHER VIEW ===== */}
      {isTeacher && (
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Link href="/teacher/assignments/new" className="card hover:border-gold/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <ClipboardList className="text-gold" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">משימה חדשה</h3>
                  <p className="text-gray-500 text-sm">צור משימה לתלמידים</p>
                </div>
              </div>
            </Link>
            <Link href="/teacher" className="card hover:border-gold/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Film className="text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">הגשות לבדיקה</h3>
                  <p className="text-gray-500 text-sm">
                    {pendingSubmissions?.length ?? 0} ממתינות לפידבק
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom row: Knowledge + Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Latest article */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">מרכז ידע</h2>
            <Link href="/knowledge" className="text-gold text-sm flex items-center gap-1 hover:underline">
              עוד <ArrowLeft size={14} />
            </Link>
          </div>
          {latestArticle ? (
            <Link href={`/knowledge/${latestArticle.id}`}
              className="card hover:border-gold/30 transition-colors block">
              {latestArticle.image_url && (
                <img src={latestArticle.image_url} alt={latestArticle.title}
                  className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <span className="badge badge-gold text-xs mb-2">{latestArticle.category}</span>
              <h3 className="font-semibold text-white leading-snug">{latestArticle.title}</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{latestArticle.body}</p>
            </Link>
          ) : (
            <div className="card text-center py-6 text-gray-500 text-sm">
              <BookOpen className="mx-auto mb-2 opacity-30" size={24} />
              אין מאמרים עדיין
            </div>
          )}
        </div>

        {/* Recent feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">פיד אחרון</h2>
            <Link href="/feed" className="text-gold text-sm flex items-center gap-1 hover:underline">
              לפיד <ArrowLeft size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentPosts && recentPosts.length > 0 ? recentPosts.map((p: any) => (
              <Link key={p.id} href={`/post/${p.id}`}
                className="card hover:border-gold/30 transition-colors flex items-center gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.profiles?.full_name}</p>
                </div>
              </Link>
            )) : (
              <div className="card text-center py-6 text-gray-500 text-sm">אין פוסטים עדיין</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
