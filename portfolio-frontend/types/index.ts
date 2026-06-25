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
}

export interface SocialLink {
  id: string;
  platform: "github" | "linkedin" | "twitter" | "instagram" | "youtube" | "website" | "other";
  url: string;
  label?: string;
  display_order: number;
  is_visible: boolean;
}

export interface Tag {
  id: string;
  name: string;
  label: string;
  color: string;
}

export interface SkillCategory {
  category_id: string;
  category_name: string;
  category_order: number;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  icon_url?: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  display_order: number;
  is_visible: boolean;
}

export interface Experience {
  id: string;
  type: "work" | "education" | "certification" | "achievement";
  title: string;
  organization: string;
  location?: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  logo_url?: string;
  display_order: number;
}

export interface ProjectScreenshot {
  id: string;
  url: string;
  alt_text?: string;
  display_order: number;
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
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  display_order: number;
  created_at: string;
  tags: Tag[];
  screenshots: ProjectScreenshot[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url?: string;
  reading_time_mins: number;
  status: "draft" | "published" | "archived";
  published_at?: string;
  created_at: string;
  tags: Tag[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  ip_address?: string;
  created_at: string;
}

export interface ContactStats {
  unread: string;
  read: string;
  replied: string;
  archived: string;
  total: string;
  last_7_days: string;
}

export interface AnalyticsDashboard {
  events: {
    page_views: string;
    project_clicks: string;
    blog_views: string;
    contact_submissions: string;
    resume_downloads: string;
    last_24h: string;
    last_7_days: string;
    last_30_days: string;
  };
  unread_contacts: number;
  published_projects: number;
  published_posts: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
