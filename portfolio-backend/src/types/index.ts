import { Request } from 'express';

// ─── Enums ────────────────────────────────────────────────────
export type ProjectStatus = 'draft' | 'published' | 'archived';
export type PostStatus = 'draft' | 'published' | 'archived';
export type ContactStatus = 'unread' | 'read' | 'replied' | 'archived';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ExperienceType = 'work' | 'education' | 'certification' | 'achievement';
export type SocialPlatform = 'github' | 'linkedin' | 'twitter' | 'instagram' | 'youtube' | 'website' | 'other';

// ─── DB Row Types ─────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url?: string;
  refresh_token?: string;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SiteSettings {
  id: string;
  owner_name: string;
  owner_title: string;
  owner_email: string;
  owner_location?: string;
  owner_avatar_url?: string;
  owner_resume_url?: string;
  hero_taglines: string[];
  hero_bio_short?: string;
  about_bio?: string;
  about_years_exp: number;
  about_projects_count: number;
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  notify_email?: string;
  updated_at: Date;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
  display_order: number;
  is_visible: boolean;
  created_at: Date;
}

export interface Tag {
  id: string;
  name: string;
  label: string;
  color: string;
  created_at: Date;
}

export interface SkillCategory {
  id: string;
  name: string;
  display_order: number;
  is_visible: boolean;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  icon_url?: string;
  level: SkillLevel;
  display_order: number;
  is_visible: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Experience {
  id: string;
  type: ExperienceType;
  title: string;
  organization: string;
  location?: string;
  description?: string;
  start_date: Date;
  end_date?: Date;
  is_current: boolean;
  logo_url?: string;
  display_order: number;
  is_visible: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  short_desc: string;
  long_desc?: string;
  thumbnail_url?: string;
  github_url?: string;
  demo_url?: string;
  status: ProjectStatus;
  is_featured: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  tags?: Tag[];
  screenshots?: ProjectScreenshot[];
}

export interface ProjectScreenshot {
  id: string;
  project_id: string;
  url: string;
  alt_text?: string;
  display_order: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url?: string;
  reading_time_mins: number;
  status: PostStatus;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  tags?: Tag[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  ip_address?: string;
  created_at: Date;
}

export interface AnalyticsEvent {
  id: number;
  event_type: string;
  path?: string;
  ref_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// ─── Request Extensions ───────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
  };
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
