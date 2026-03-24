import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CommentSection from "@/components/CommentSection";
import { formatDate, getInitials } from "@/lib/utils";
import { ArrowRight, Calendar, Film } from "lucide-react";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: { user } }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!post) notFound();

  const { data: currentProfile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const author = post.profiles;
  const isVideo = (url: string) => url.match(/\.(mp4|mov|webm|avi)$/i);

  return (
    <div className="page-container">
      {/* Back */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors"
      >
        <ArrowRight size={16} />
        חזרה לפיד
      </Link>

      {/* Post */}
      <article className="card mb-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-5">
          <Link href={`/profile/${author?.id}`} className="avatar w-11 h-11 text-sm">
            {author?.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.full_name}
                width={44}
                height={44}
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
              getInitials(author?.full_name || "?")
            )}
          </Link>
          <div>
            <Link
              href={`/profile/${author?.id}`}
              className="font-semibold text-white hover:text-gold transition-colors"
            >
              {author?.full_name}
            </Link>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
              <Calendar size={10} />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Title & Body */}
        <h1 className="text-2xl font-bold text-white mb-3 leading-tight">{post.title}</h1>
        {post.body && (
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-5">{post.body}</p>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="space-y-3">
            {post.media_urls.map((url: string, i: number) =>
              isVideo(url) ? (
                <video
                  key={i}
                  src={url}
                  controls
                  className="w-full rounded-xl bg-dark-300"
                />
              ) : (
                <div key={i} className="relative rounded-xl overflow-hidden bg-dark-300">
                  <Image
                    src={url}
                    alt={`מדיה ${i + 1}`}
                    width={800}
                    height={500}
                    className="w-full h-auto object-contain max-h-[600px]"
                  />
                </div>
              )
            )}
          </div>
        )}
      </article>

      {/* Comments */}
      <div className="card">
        <CommentSection postId={post.id} currentUser={currentProfile} />
      </div>
    </div>
  );
}
