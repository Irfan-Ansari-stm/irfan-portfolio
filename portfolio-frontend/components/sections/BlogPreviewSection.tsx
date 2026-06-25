"use client";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { BlogPost } from "@/types";
import { formatDate, truncate } from "@/lib/utils";

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}
      className="card card-hover group block overflow-hidden"
      onClick={() => publicApi.trackEvent("blog_view", `/blog/${post.slug}`, post.id)}>
      {post.cover_image_url && (
        <div className="h-44 overflow-hidden">
          <img src={post.cover_image_url} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags?.slice(0, 3).map((t) => (
            <span key={t.id} className="tag-badge text-xs"
              style={{ background: `${t.color}15`, color: t.color }}>
              {t.label}
            </span>
          ))}
        </div>
        <h3 className="text-white font-bold text-base mb-2 group-hover:text-brand-400 transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{truncate(post.excerpt, 120)}</p>
        <div className="flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-3">
            {post.published_at && (
              <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(post.published_at)}</span>
            )}
            <span className="flex items-center gap-1"><Clock size={11} />{post.reading_time_mins} min read</span>
          </div>
          <ArrowRight size={14} className="group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

export default function BlogPreviewSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    publicApi.getBlogPosts({ page: 1, limit: 3 })
      .then((r) => setPosts(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section id="blog" className="py-24 relative" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className={`flex items-end justify-between mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <p className="text-brand-400 font-mono text-sm mb-2">// articles</p>
            <h2 className="section-title">Latest Posts</h2>
            <div className="w-12 h-1 bg-brand-500 rounded-full" />
          </div>
          <Link href="/blog" className="btn-outline text-sm px-4 py-2 group">
            All Posts <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map((i) => <div key={i} className="h-72 rounded-xl bg-white/[0.02] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <div key={post.id} className={`transition-all duration-700`} style={{ transitionDelay: `${i * 100}ms` }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
