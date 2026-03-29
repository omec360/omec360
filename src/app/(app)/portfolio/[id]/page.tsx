import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";
import { notFound } from "next/navigation";
import { PROGRAM_LABELS, STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from "@/types";
import { getInitials } from "@/lib/utils";

export default async function PortfolioPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!student) notFound();

  // Get all submissions with assignment details
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, assignments(title, program, module_number)")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  // Also get their posts
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, media_urls, created_at")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const doneCount = submissions?.filter(s => s.status === "done").length ?? 0;
  const totalSubmissions = submissions?.length ?? 0;

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/feed" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <h1 className="section-title mb-0">תיק עבודות</h1>
      </div>

      {/* Student header */}
      <div className="card flex items-center gap-5 mb-8">
        <div className="avatar w-16 h-16 text-xl">
          {getInitials(student.full_name)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{student.full_name}</h2>
          {student.program && (
            <p className="text-gold text-sm">{PROGRAM_LABELS[student.program] ?? student.program}</p>
          )}
          {student.school && (
            <p className="text-gray-400 text-sm">{student.school}</p>
          )}
          {student.bio && <p className="text-gray-500 text-sm mt-1">{student.bio}</p>}
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{doneCount}</p>
          <p className="text-xs text-gray-500">הושלמו</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{totalSubmissions}</p>
          <p className="text-xs text-gray-500">הגשות</p>
        </div>
      </div>

      {/* Completed submissions */}
      {submissions && submissions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">עבודות שהוגשו</h3>
          <div className="space-y-3">
            {submissions.map((sub) => {
              const status = sub.status as SubmissionStatus;
              return (
                <div key={sub.id} className="card">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <p className="font-medium text-white">{sub.assignments?.title}</p>
                      <p className="text-xs text-gray-500">
                        {sub.assignments?.program ? PROGRAM_LABELS[sub.assignments.program] ?? sub.assignments.program : ""}
                        {sub.assignments?.module_number ? ` · מודול ${sub.assignments.module_number}` : ""}
                      </p>
                    </div>
                    <span className={`badge border text-xs ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>

                  {sub.media_urls?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(sub.media_urls as string[]).map((url: string, i: number) => {
                        const isVideo = url.match(/\.(mp4|mov|webm|avi)/i);
                        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)/i);
                        return isImage ? (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`עבודה ${i + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border border-dark-400 hover:border-gold/40 transition-colors" />
                          </a>
                        ) : (
                          <a key={i} href={url} target="_blank" rel="noreferrer"
                            className="w-24 h-24 rounded-lg border border-dark-400 flex flex-col items-center justify-center gap-1 hover:border-gold/40 transition-colors bg-dark-300">
                            <Film size={20} className="text-gray-400" />
                            <span className="text-xs text-gray-500">וידאו</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Posts gallery */}
      {posts && posts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">פוסטים בפיד</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {posts.map((post) => {
              const firstMedia = post.media_urls?.[0];
              const isImage = firstMedia?.match(/\.(jpg|jpeg|png|gif|webp)/i);
              return (
                <Link key={post.id} href={`/post/${post.id}`}
                  className="relative aspect-square rounded-xl overflow-hidden bg-dark-300 border border-dark-400 hover:border-gold/30 transition-colors group">
                  {firstMedia && isImage ? (
                    <img src={firstMedia} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500">
                      <Film size={24} />
                      <span className="text-xs text-center px-2">{post.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <p className="text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                      {post.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {(!submissions || submissions.length === 0) && (!posts || posts.length === 0) && (
        <div className="card text-center py-20 text-gray-500">
          <Film className="mx-auto mb-3 opacity-30" size={40} />
          <p>עדיין אין עבודות בתיק</p>
        </div>
      )}
    </div>
  );
}
