import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Eye, EyeOff, BookOpen } from "lucide-react";

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
    redirect("/dashboard");
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-gold" size={24} />
          <h1 className="section-title mb-0">ניהול מאמרים</h1>
        </div>
        <Link href="/admin/articles/new" className="btn-gold flex items-center gap-2 text-sm">
          <PlusCircle size={16} />
          מאמר חדש
        </Link>
      </div>

      {(articles?.length ?? 0) === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <BookOpen className="mx-auto mb-3 opacity-30" size={40} />
          <p>אין מאמרים עדיין</p>
          <Link href="/admin/articles/new" className="btn-gold inline-flex items-center gap-2 mt-4 text-sm">
            <PlusCircle size={16} /> פרסם מאמר ראשון
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles?.map((article) => (
            <Link key={article.id} href={`/admin/articles/${article.id}`}
              className="card hover:border-gold/30 transition-colors flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white truncate">{article.title}</h3>
                  <span className="badge badge-gold text-xs">{article.category}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {article.profiles?.full_name} · {new Date(article.created_at).toLocaleDateString("he-IL")}
                </p>
              </div>
              <div className="flex-shrink-0">
                {article.is_published ? (
                  <span className="flex items-center gap-1 text-green-400 text-xs">
                    <Eye size={12} /> מפורסם
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <EyeOff size={12} /> טיוטה
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
