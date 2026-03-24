import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";
import PostCard from "@/components/PostCard";
import { Post } from "@/types";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: profile },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(*), comment_count:comments(count)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const formattedPosts: Post[] = (posts ?? []).map((p) => ({
    ...p,
    comment_count: p.comment_count?.[0]?.count ?? 0,
  }));

  return (
    <div className="page-container">
      <ProfileHeader
        profile={profile}
        postCount={formattedPosts.length}
        isOwnProfile={user?.id === id}
      />

      <h2 className="font-bold text-white text-lg mb-4">פוסטים</h2>

      {formattedPosts.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">
          עדיין לא פורסמו פוסטים
        </p>
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
