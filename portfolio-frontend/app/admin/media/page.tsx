"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  UploadCloud, Search, Copy, Check, Trash2, Eye, ExternalLink,
  Image as ImageIcon, Video as VideoIcon, FileText, LayoutGrid,
  List, Loader2, RefreshCw, X, Play, Code, HardDrive, Film, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/api";
import { cn, formatBytes, formatDate, resolveMediaUrl } from "@/lib/utils";
import type { MediaItem } from "@/types";

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async (q?: string, type?: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getMedia({
        search: q !== undefined ? q : search,
        type: (type !== undefined ? type : typeFilter) !== "all" ? (type || typeFilter) : undefined,
        limit: 100,
      });
      setMediaList(res.data.data?.items || []);
    } catch {
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await adminApi.uploadMedia(formData);
      const count = Array.isArray(res.data.data) ? res.data.data.length : 1;
      toast.success(`${count} file(s) uploaded successfully!`);
      await fetchMedia();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteMedia(id);
      toast.success("File deleted");
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      if (previewItem?.id === id) setPreviewItem(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete file");
    }
  }

  function copyToClipboard(text: string, id: string, label = "URL copied to clipboard!") {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(label);
    setTimeout(() => setCopiedId(null), 2500);
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // Stats calculation
  const totalCount = mediaList.length;
  const imageCount = mediaList.filter((m) => m.file_type === "image").length;
  const videoCount = mediaList.filter((m) => m.file_type === "video").length;
  const totalBytes = mediaList.reduce((acc, m) => acc + (parseInt(String(m.size_bytes), 10) || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Film size={18} />
              </span>
              Media Library
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Upload images & videos, grab instant URLs, and use them anywhere across your projects, blog posts, and site.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchMedia()}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-colors shadow-sm"
              title="Refresh"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin text-emerald-500")} />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              <span>{uploading ? "Uploading..." : "Upload Media"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="card p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Film size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{totalCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Assets</div>
            </div>
          </div>

          <div className="card p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ImageIcon size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{imageCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Images</div>
            </div>
          </div>

          <div className="card p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <VideoIcon size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{videoCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Videos</div>
            </div>
          </div>

          <div className="card p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <HardDrive size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{formatBytes(totalBytes)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Storage</div>
            </div>
          </div>
        </div>

        {/* Drag & Drop Hero Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white dark:bg-neutral-900/60 shadow-sm",
            dragActive
              ? "border-emerald-500 bg-emerald-500/[0.04] scale-[1.01]"
              : "border-slate-300 dark:border-white/10 hover:border-emerald-500/70 dark:hover:border-emerald-400/60"
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2.5">
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
            {uploading ? "Uploading media files to library..." : "Drop images or videos here, or click to browse"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center max-w-md">
            Supports JPG, PNG, WebP, SVG, GIF, MP4, WebM, MOV, and PDF up to 100MB per file.
          </p>
        </div>

        {/* Search, Filter, and View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Media", count: totalCount },
              { id: "image", label: "Images", count: imageCount },
              { id: "video", label: "Videos", count: videoCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTypeFilter(tab.id);
                  fetchMedia(search, tab.id);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                  typeFilter === tab.id
                    ? "bg-emerald-500 text-neutral-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search & Layout toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search media by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  fetchMedia(e.target.value, typeFilter);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl p-0.5 bg-slate-50 dark:bg-neutral-800">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors",
                  viewMode === "grid"
                    ? "bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors",
                  viewMode === "list"
                    ? "bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
                title="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid / List Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
            <p className="text-xs text-slate-500">Loading media library...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="card p-12 text-center border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Film size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No media found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              {search
                ? `No files match your query "${search}". Try clearing the search.`
                : "Your media library is empty. Upload your project screenshots, banners, demo videos, and logos."}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud size={15} />
              <span>Upload First Asset</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaList.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  className="card group overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail / Video Preview */}
                  <div
                    className="relative aspect-video bg-slate-100 dark:bg-neutral-950 flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    {item.file_type === "image" ? (
                      <img
                        src={resolveMediaUrl(item.url)}
                        alt={item.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : item.file_type === "video" ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-neutral-950 text-white">
                        <video
                          src={resolveMediaUrl(item.url)}
                          className="w-full h-full object-cover opacity-80"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/90 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play size={18} className="fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText size={32} className="text-emerald-500 mb-1" />
                        <span className="text-[10px] font-mono uppercase">Document</span>
                      </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-sm">
                        {item.file_type}
                      </span>
                    </div>

                    {/* Quick view overlay button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewItem(item);
                        }}
                        className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white backdrop-blur-md shadow-sm transition-colors"
                        title="Expand view"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <h4
                        className="text-xs font-semibold text-slate-900 dark:text-white truncate"
                        title={item.original_name}
                      >
                        {item.original_name}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>{formatBytes(item.size_bytes)}</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    {/* Direct Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => copyToClipboard(item.url, item.id)}
                        className={cn(
                          "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm",
                          isCopied
                            ? "bg-emerald-500 text-neutral-950 font-bold"
                            : "bg-slate-100 dark:bg-white/[0.05] hover:bg-emerald-500/15 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-white/10"
                        )}
                        title="Copy direct file URL"
                      >
                        {isCopied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
                        <span>{isCopied ? "Copied!" : "Copy URL"}</span>
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(
                            `![${item.original_name}](${item.url})`,
                            `md-${item.id}`,
                            "Markdown snippet copied!"
                          )
                        }
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors shadow-sm"
                        title="Copy Markdown format"
                      >
                        <Code size={13} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id, item.original_name)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-white/10 transition-colors shadow-sm"
                        title="Delete asset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Table */
          <div className="card overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
                    <th className="px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Asset</th>
                    <th className="px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Size</th>
                    <th className="px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Uploaded</th>
                    <th className="px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.04]">
                  {mediaList.map((item) => {
                    const isCopied = copiedId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => setPreviewItem(item)}
                              className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 flex-shrink-0 cursor-pointer flex items-center justify-center"
                            >
                              {item.file_type === "image" ? (
                                <img src={resolveMediaUrl(item.url)} alt="" className="w-full h-full object-cover" />
                              ) : item.file_type === "video" ? (
                                <VideoIcon size={16} className="text-emerald-500" />
                              ) : (
                                <FileText size={16} className="text-emerald-500" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">{item.original_name}</div>
                              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.filename}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 capitalize">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                            {item.file_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                          {formatBytes(item.size_bytes)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => copyToClipboard(item.url, item.id)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1",
                                isCopied
                                  ? "bg-emerald-500 text-neutral-950 font-bold"
                                  : "bg-slate-100 dark:bg-white/[0.05] hover:bg-emerald-500/15 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-white/10"
                              )}
                            >
                              {isCopied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                              <span>{isCopied ? "Copied" : "Copy"}</span>
                            </button>

                            <button
                              onClick={() => setPreviewItem(item)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                              title="Preview"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              onClick={() => handleDelete(item.id, item.original_name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Asset Detail / Preview Modal */}
        {previewItem && (
          <div className="modal-backdrop" onClick={() => setPreviewItem(null)}>
            <div
              className="modal-container max-w-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="min-w-0 pr-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {previewItem.original_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {previewItem.file_type.toUpperCase()} • {formatBytes(previewItem.size_bytes)} • {formatDate(previewItem.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body preview */}
              <div className="p-6 space-y-5">
                <div className="w-full max-h-[420px] rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                  {previewItem.file_type === "image" ? (
                    <img
                      src={resolveMediaUrl(previewItem.url)}
                      alt={previewItem.original_name}
                      className="max-h-[420px] w-auto max-w-full object-contain"
                    />
                  ) : previewItem.file_type === "video" ? (
                    <video
                      src={resolveMediaUrl(previewItem.url)}
                      controls
                      autoPlay
                      className="max-h-[420px] w-full object-contain"
                    />
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      <FileText size={48} className="text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold">{previewItem.original_name}</p>
                    </div>
                  )}
                </div>

                {/* Direct Link Generator & Snippets */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Direct Asset URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={previewItem.url}
                        className="input font-mono text-xs py-2 text-slate-700 dark:text-slate-300 select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(previewItem.url, "modal-url")}
                        className="btn-primary py-2 px-3 text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5"
                      >
                        <Copy size={13} />
                        <span>Copy URL</span>
                      </button>
                      <a
                        href={previewItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                        title="Open in new tab"
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </div>

                  {/* Markdown & HTML Snippets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Markdown Syntax
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `![${previewItem.original_name}](${previewItem.url})`,
                              "modal-md",
                              "Markdown copied!"
                            )
                          }
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          Copy MD
                        </button>
                      </div>
                      <code className="text-[11px] font-mono text-slate-800 dark:text-slate-200 block truncate">
                        {`![${previewItem.original_name}](${previewItem.url})`}
                      </code>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          HTML Tag
                        </span>
                        <button
                          onClick={() => {
                            const snippet =
                              previewItem.file_type === "video"
                                ? `<video src="${previewItem.url}" controls></video>`
                                : `<img src="${previewItem.url}" alt="${previewItem.original_name}" />`;
                            copyToClipboard(snippet, "modal-html", "HTML tag copied!");
                          }}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          Copy HTML
                        </button>
                      </div>
                      <code className="text-[11px] font-mono text-slate-800 dark:text-slate-200 block truncate">
                        {previewItem.file_type === "video"
                          ? `<video src="${previewItem.url}" controls></video>`
                          : `<img src="${previewItem.url}" alt="" />`}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
                <button
                  onClick={() => handleDelete(previewItem.id, previewItem.original_name)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-500/10 border border-red-500/20 transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete File</span>
                </button>

                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

