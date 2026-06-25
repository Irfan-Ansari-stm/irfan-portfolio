"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Clock, Calendar, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { publicApi } from "@/lib/api";
import type { BlogPost, Tag } from "@/types";
import { formatDate, truncate, cn } from "@/lib/utils";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async (q: string, tag: string, pg: number) => {
    setLoading(true);
    try {
      const params: any = { page: pg, limit: 9 };
      if (q) params.search = q;
      if (tag !== "all") params.tag = tag;
      const res = await publicApi.getBlogPosts(params);
      if (pg === 1) setPosts(res.data.data || []);
      else setPosts((p) => [...p, ...(res.data.data || [])]);
      setHasMore(res.data.pagination?.hasNext || false);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    publicApi.getTags().then((r) => setTags(r.data.data || [])).catch(() => {});
    loadPosts("", "all", 1);
    publicApi.trackEvent("page_view", "/blog");
  }, [loadPosts]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadPosts(search, activeTag, 1); }, 400);
    return () => clearTimeout(t);
  }, [search, activeTag, loadPosts]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-400 text-sm mb-6 transition-colors">
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <p className="text-brand-400 font-mono text-sm mb-2">// articles & thoughts</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Blog</h1>
            <div className="w-12 h-1 bg-brand-500 rounded-full mb-4" />
            <p className="text-slate-400 max-w-xl">Writings on web development, software architecture, and the tools I use.</p>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 text-sm"
                placeholder="Search articles..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", ...tags.map((t) => t.name)].map((tag) => (
                <button key={tag} onClick={() => { setActiveTag(tag); setPage(1); }}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeTag === tag ? "bg-brand-500 text-dark-900" : "glass text-slate-400 hover:text-white")}>
                  {tag === "all" ? "All" : tags.find((t) => t.name === tag)?.label || tag}
                </button>
              ))}
            </div>
          </div>

          {/* Posts grid */}
          {loading && posts.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="h-72 rounded-xl bg-white/[0.02] animate-pulse" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg mb-3">No articles found.</p>
              <p className="text-slate-600 text-sm">Try a different search term or tag.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="card card-hover group block overflow-hidden"
                  onClick={() => publicApi.trackEvent("blog_view", `/blog/${post.slug}`, post.id)}>
                  {post.cover_image_url && (
                    <div className="h-44 overflow-hidden">
                      <img src={post.cover_image_url} alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags?.slice(0, 3).map((t) => (
                        <span key={t.id} className="tag-badge"
                          style={{ background: `${t.color}15`, color: t.color }}>
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-white font-bold text-base mb-2 group-hover:text-brand-400 transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{truncate(post.excerpt, 110)}</p>
                    <div className="flex items-center gap-3 text-slate-500 text-xs">
                      {post.published_at && <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(post.published_at)}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} />{post.reading_time_mins} min</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-10">
              <button onClick={() => { const np = page + 1; setPage(np); loadPosts(search, activeTag, np); }}
                className="btn-outline">
                Load More Articles
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
