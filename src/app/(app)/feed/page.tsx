import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Post } from "@/types";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles(*),
      comment_count:comments(count)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // Flatten count
  const formattedPosts: Post[] = (posts ?? []).map((p) => ({
    ...p,
    comment_count: p.comment_count?.[0]?.count ?? 0,
  }));

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title mb-0">פיד</h1>
        <Link href="/upload" className="btn-gold flex items-center gap-2 text-sm">
          <PlusCircle size={16} />
          <span>פוסט חדש</span>
        </Link>
      </div>

      {formattedPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">עדיין אין פוסטים</p>
          <Link href="/upload" className="btn-gold inline-flex items-center gap-2">
            <PlusCircle size={16} />
            היה הראשון להעלות
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {formattedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
