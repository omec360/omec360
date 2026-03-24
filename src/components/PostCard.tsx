import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Calendar } from "lucide-react";
import { Post } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const author = post.profiles;
  const hasMedia = post.media_urls && post.media_urls.length > 0;
  const firstImage = hasMedia
    ? post.media_urls.find((url) => !url.match(/\.(mp4|mov|webm)$/i))
    : null;

  return (
    <Link href={`/post/${post.id}`}>
      <article className="card hover:border-gold/30 hover:bg-dark-200 transition-all duration-200 cursor-pointer">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/profile/${author?.id}`}
            className="avatar w-10 h-10 text-sm hover:ring-2 hover:ring-gold/30 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {author?.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.full_name}
                width={40}
                height={40}
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
              getInitials(author?.full_name || "?")
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${author?.id}`}
              className="font-semibold text-white text-sm hover:text-gold transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {author?.full_name || "משתמש לא ידוע"}
            </Link>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
              <Calendar size={10} />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <h2 className="font-bold text-white text-lg mb-2 leading-tight">{post.title}</h2>
        {post.body && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-3">
            {post.body}
          </p>
        )}

        {/* First image preview */}
        {firstImage && (
          <div className="relative rounded-lg overflow-hidden mb-3 aspect-video bg-dark-300">
            <Image
              src={firstImage}
              alt={post.title}
              fill
              className="object-cover"
            />
            {post.media_urls.length > 1 && (
              <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-0.5 text-xs text-white">
                +{post.media_urls.length - 1} קבצים
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 text-gray-500 text-sm pt-3 border-t border-dark-400">
          <div className="flex items-center gap-1.5">
            <MessageCircle size={14} />
            <span>{post.comment_count ?? 0} תגובות</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
