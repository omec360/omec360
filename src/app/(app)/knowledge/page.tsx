import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  general: "כללי",
  cinema: "קולנוע",
  debate: "עיון",
  inspiration: "השראה",
  example: "דוגמאות עבודה",
};

export default async function KnowledgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const isEditor = profile?.role === "admin" || profile?.role === "teacher";

  const { data: articles } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Group by category
  const grouped: Record<string, typeof articles> = {};
  for (const a of articles ?? []) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category]!.push(a);
  }

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-gold" size={26} />
          <h1 className="section-title mb-0">מרכז ידע</h1>
        </div>
        {isEditor && (
          <Link href="/admin/articles/new" className="btn-gold text-sm flex items-center gap-2">
            + מאמר חדש
          </Link>
        )}
      </div>

      {(articles?.length ?? 0) === 0 ? (
        <div className="card text-center py-20 text-gray-500">
          <BookOpen className="mx-auto mb-3 opacity-30" size={40} />
          <p>אין מאמרים עדיין</p>
          {isEditor && (
            <Link href="/admin/articles/new" className="btn-gold inline-flex items-center gap-2 mt-4 text-sm">
              + פרסם את המאמר הראשון
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, catArticles]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {catArticles?.map((article) => (
                  <Link key={article.id} href={`/knowledge/${article.id}`}
                    className="card hover:border-gold/30 transition-colors block group">
                    {article.image_url && (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                    )}
                    <span className="badge badge-gold text-xs mb-2">
                      {CATEGORY_LABELS[article.category] ?? article.category}
                    </span>
                    <h3 className="font-semibold text-white group-hover:text-gold transition-colors leading-snug mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{article.body}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {article.profiles?.full_name} · {new Date(article.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
