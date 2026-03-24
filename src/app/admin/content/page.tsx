"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/types";
import { formatDate } from "@/lib/utils";
import { Trash2, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as Post[]);
  }

  async function deletePost(id: string) {
    if (!confirm("למחוק פוסט זה לצמיתות?")) return;
    await supabase.from("posts").delete().eq("id", id);
    await fetchPosts();
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <h1 className="section-title mb-0">ניהול תוכן ({posts.length})</h1>
      </div>

      <div className="card">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">אין פוסטים עדיין</p>
        ) : (
          <div className="divide-y divide-dark-400">
            {posts.map((post) => (
              <div key={post.id} className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{post.title}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {post.profiles?.full_name} · {formatDate(post.created_at)}
                  </p>
                  {post.body && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-1">{post.body}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/post/${post.id}`}
                    className="text-gray-500 hover:text-gold p-1.5 rounded-lg hover:bg-dark-300 transition-colors"
                    title="צפה בפוסט"
                  >
                    <ExternalLink size={15} />
                  </Link>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-dark-300 transition-colors"
                    title="מחק"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
