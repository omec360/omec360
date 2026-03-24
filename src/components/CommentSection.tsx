"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Comment, Profile } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CommentSectionProps {
  postId: string;
  currentUser: Profile | null;
}

export default function CommentSection({ postId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(*)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) setComments(data as Comment[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setLoading(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUser.id,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      await fetchComments();
    }
    setLoading(false);
  }

  return (
    <section className="mt-6">
      <h3 className="font-bold text-white text-lg mb-4">
        תגובות ({comments.length})
      </h3>

      {/* Comment list */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">
            אין תגובות עדיין. היה הראשון להגיב!
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Link href={`/profile/${comment.profiles?.id}`}>
              <div className="avatar w-9 h-9 text-xs flex-shrink-0">
                {comment.profiles?.avatar_url ? (
                  <Image
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.full_name}
                    width={36}
                    height={36}
                    className="rounded-full w-full h-full object-cover"
                  />
                ) : (
                  getInitials(comment.profiles?.full_name || "?")
                )}
              </div>
            </Link>
            <div className="flex-1 bg-dark-200 rounded-xl px-4 py-3">
              <div className="flex items-baseline gap-2 mb-1">
                <Link
                  href={`/profile/${comment.profiles?.id}`}
                  className="font-semibold text-white text-sm hover:text-gold transition-colors"
                >
                  {comment.profiles?.full_name || "משתמש"}
                </Link>
                <span className="text-gray-600 text-xs">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New comment form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="avatar w-9 h-9 text-xs flex-shrink-0">
            {getInitials(currentUser.full_name)}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="הוסף תגובה..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="btn-gold px-4"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-gray-500 text-sm text-center">התחבר כדי להגיב</p>
      )}
    </section>
  );
}
