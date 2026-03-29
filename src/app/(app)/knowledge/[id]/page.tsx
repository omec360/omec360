import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .eq("id", params.id)
    .single();

  if (!article) notFound();

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/knowledge" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <span className="badge badge-gold text-xs">{article.category}</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">{article.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {article.profiles?.full_name} · {formatDate(article.created_at)}
      </p>

      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full rounded-xl mb-6 object-cover max-h-80"
        />
      )}

      <div className="card">
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
          {article.body}
        </p>
      </div>

      <div className="mt-6">
        <Link href="/knowledge" className="text-gold hover:underline text-sm flex items-center gap-1">
          <ArrowRight size={14} /> חזרה למרכז ידע
        </Link>
      </div>
    </div>
  );
}
