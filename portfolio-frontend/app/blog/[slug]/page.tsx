"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Clock, Calendar, Share2, MessageCircle, Users, Link2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { publicApi } from "@/lib/api";
import type { BlogPost } from "@/types";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    publicApi.getBlogPostBySlug(slug)
      .then((r) => {
        setPost(r.data.data);
        publicApi.trackEvent("blog_view", `/blog/${slug}`, r.data.data.id);
      })
      .catch(() => router.push("/blog"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  function share(platform: string) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || "");
    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
      return;
    }
    window.open(links[platform], "_blank");
  }

  if (loading) return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 max-w-3xl mx-auto px-6">
        <div className="h-8 w-32 bg-white/[0.03] rounded animate-pulse mb-8" />
        <div className="h-12 w-3/4 bg-white/[0.03] rounded animate-pulse mb-4" />
        <div className="space-y-3 mt-10">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-4 bg-white/[0.02] rounded animate-pulse" style={{ width: `${80 + Math.random() * 20}%` }} />)}
        </div>
      </main>
    </div>
  );

  if (!post) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-400 text-sm mb-8 transition-colors">
            <ArrowLeft size={14} /> All Articles
          </Link>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags?.map((t) => (
              <span key={t.id} className="tag-badge" style={{ background: `${t.color}15`, color: t.color }}>{t.label}</span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm mb-8 pb-8 border-b border-white/[0.07]">
            {post.published_at && <span className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(post.published_at)}</span>}
            <span className="flex items-center gap-1.5"><Clock size={13} />{post.reading_time_mins} min read</span>
            {/* Share */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="flex items-center gap-1 text-slate-600 text-xs"><Share2 size={12} />Share:</span>
              <button onClick={() => share("twitter")} className="w-7 h-7 rounded glass flex items-center justify-center text-slate-400 hover:text-sky-400 transition-colors" aria-label="Share on Twitter"><MessageCircle size={13} /></button>
              <button onClick={() => share("linkedin")} className="w-7 h-7 rounded glass flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors" aria-label="Share on LinkedIn"><Users size={13} /></button>
              <button onClick={() => share("copy")} className="w-7 h-7 rounded glass flex items-center justify-center text-slate-400 hover:text-brand-400 transition-colors" aria-label="Copy link"><Link2 size={13} /></button>
            </div>
          </div>

          {/* Cover image */}
          {post.cover_image_url && (
            <div className="mb-10 rounded-xl overflow-hidden border border-white/[0.07]">
              <img src={post.cover_image_url} alt={post.title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          {/* Content */}
          <article className="prose prose-invert prose-sm md:prose-base max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content || post.excerpt}
            </ReactMarkdown>
          </article>

          {/* Bottom share */}
          <div className="mt-16 pt-8 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold mb-1">Found this helpful?</p>
              <p className="text-slate-400 text-sm">Share it with others who might benefit.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => share("twitter")} className="btn-outline text-xs px-4 py-2"><MessageCircle size={13} />Twitter</button>
              <button onClick={() => share("linkedin")} className="btn-outline text-xs px-4 py-2"><Users size={13} />LinkedIn</button>
              <button onClick={() => share("copy")} className="btn-outline text-xs px-4 py-2"><Link2 size={13} />Copy Link</button>
            </div>
          </div>

          {/* Back to blog */}
          <div className="mt-8 text-center">
            <Link href="/blog" className="btn-outline text-sm px-5 py-2.5">
              <ArrowLeft size={14} /> Back to Blog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
