"use client";
import { useEffect, useState, useRef } from "react";
import {
  X, UploadCloud, Search, Check, Image as ImageIcon, Video as VideoIcon,
  FileText, Loader2, ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { cn, formatBytes, formatDate, resolveMediaUrl } from "@/lib/utils";
import type { MediaItem } from "@/types";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  defaultType?: "all" | "image" | "video";
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = "Select Media",
  defaultType = "all",
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>(defaultType);
  const [selectedUrl, setSelectedUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, filterType]);

  async function loadMedia(searchTerm?: string) {
    setLoading(true);
    try {
      const q = searchTerm !== undefined ? searchTerm : search;
      const res = await adminApi.getMedia({
        search: q || undefined,
        type: filterType !== "all" ? filterType : undefined,
        limit: 50,
      });
      setMediaList(res.data.data?.items || []);
    } catch {
      toast.error("Failed to load media items");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await adminApi.uploadMedia(formData);
      const data = res.data.data;
      toast.success("Media uploaded successfully");
      await loadMedia();
      setActiveTab("library");

      // Auto-select if single file
      if (data && !Array.isArray(data) && data.url) {
        setSelectedUrl(data.url);
      } else if (Array.isArray(data) && data[0]?.url) {
        setSelectedUrl(data[0].url);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container max-w-4xl max-h-[88vh] flex flex-col bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pick an asset from your library or upload a new one</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs & Controls */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("library")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === "library"
                  ? "bg-emerald-500 text-neutral-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              )}
            >
              Media Library ({mediaList.length})
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === "upload"
                  ? "bg-emerald-500 text-neutral-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              )}
            >
              <UploadCloud size={14} />
              Upload New
            </button>
          </div>

          {activeTab === "library" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search file name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    loadMedia(e.target.value);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[320px]">
          {activeTab === "upload" ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-white/[0.01]"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  {uploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {uploading ? "Uploading files..." : "Click to select or drag and drop"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-sm mb-4">
                  Supports Images (PNG, JPG, WebP, GIF, SVG) and Videos (MP4, WebM, MOV) up to 100MB
                </p>
                <button
                  type="button"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs shadow-sm transition-all"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : mediaList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-400 mx-auto mb-3">
                <ImageIcon size={22} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No media found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No uploaded media matches your filter. Upload assets by clicking "Upload New" above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {mediaList.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedUrl(item.url)}
                    className={cn(
                      "group relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col justify-between overflow-hidden",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/[0.06] ring-2 ring-emerald-500/20 shadow-md"
                        : "border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-800/80 hover:border-slate-300 dark:hover:border-white/20 shadow-sm"
                    )}
                  >
                    {/* Media thumbnail */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-neutral-950 flex items-center justify-center mb-2">
                      {item.file_type === "image" ? (
                        <img
                          src={resolveMediaUrl(item.url)}
                          alt={item.original_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : item.file_type === "video" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-white">
                          <VideoIcon size={24} className="text-emerald-400 mb-1" />
                          <span className="text-[10px] font-mono uppercase text-slate-300">Video</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <FileText size={24} className="text-emerald-500 mb-1" />
                          <span className="text-[10px] font-mono uppercase">Doc</span>
                        </div>
                      )}

                      {/* Selected checkmark badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-md">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">
                        {item.original_name}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>{formatBytes(item.size_bytes)}</span>
                        <span className="capitalize">{item.file_type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
            {selectedUrl ? (
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 truncate block">
                Selected: {selectedUrl}
              </span>
            ) : (
              "Select an item from the library to insert"
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={() => {
                if (selectedUrl) {
                  onSelect(selectedUrl);
                  onClose();
                }
              }}
              className="btn-primary py-2 px-5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Use Selected URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

