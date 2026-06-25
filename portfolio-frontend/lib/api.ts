import axios from "axios";
import Cookies from "js-cookie";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken") || (typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = Cookies.get("refreshToken") || localStorage.getItem("refreshToken");
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/refresh`, { refreshToken: refresh });
          const token = data.data.accessToken;
          Cookies.set("accessToken", token, { expires: 1 });
          localStorage.setItem("accessToken", token);
          Cookies.set("refreshToken", data.data.refreshToken, { expires: 7 });
          localStorage.setItem("refreshToken", data.data.refreshToken);
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        } catch {
          Cookies.remove("accessToken");
          Cookies.remove("refreshToken");
          localStorage.clear();
          window.location.href = "/admin/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Public API calls ──────────────────────────────────────────
export const publicApi = {
  getSettings: () => api.get("/settings"),
  getSocialLinks: () => api.get("/social?visible=true"),
  getTags: () => api.get("/tags"),
  getSkills: () => api.get("/skills?visible=true"),
  getExperiences: (type?: string) => api.get(`/experiences?visible=true${type ? `&type=${type}` : ""}`),
  getProjects: (params?: Record<string, any>) => api.get("/projects", { params: { status: "published", ...params } }),
  getFeaturedProjects: () => api.get("/projects/featured"),
  getProjectBySlug: (slug: string) => api.get(`/projects/slug/${slug}`),
  getBlogPosts: (params?: Record<string, any>) => api.get("/blog", { params }),
  getBlogPostBySlug: (slug: string) => api.get(`/blog/slug/${slug}`),
  submitContact: (data: ContactFormData) => api.post("/contacts", data),
  trackEvent: (event_type: string, path?: string, ref_id?: string) =>
    api.post("/analytics/track", { event_type, path, ref_id }).catch(() => {}),
};

// ── Admin API calls ───────────────────────────────────────────
export const adminApi = {
  // Auth
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/auth/password", { currentPassword, newPassword }),

  // Settings
  updateSettings: (data: Record<string, any>) => api.put("/settings", data),

  // Social
  createSocialLink: (data: any) => api.post("/social", data),
  updateSocialLink: (id: string, data: any) => api.put(`/social/${id}`, data),
  deleteSocialLink: (id: string) => api.delete(`/social/${id}`),

  // Tags
  createTag: (data: any) => api.post("/tags", data),
  updateTag: (id: string, data: any) => api.put(`/tags/${id}`, data),
  deleteTag: (id: string) => api.delete(`/tags/${id}`),

  // Skills
  getCategories: () => api.get("/skills/categories"),
  createCategory: (data: any) => api.post("/skills/categories", data),
  updateCategory: (id: string, data: any) => api.put(`/skills/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/skills/categories/${id}`),
  createSkill: (data: any) => api.post("/skills", data),
  updateSkill: (id: string, data: any) => api.put(`/skills/${id}`, data),
  deleteSkill: (id: string) => api.delete(`/skills/${id}`),

  // Experiences
  createExperience: (data: any) => api.post("/experiences", data),
  updateExperience: (id: string, data: any) => api.put(`/experiences/${id}`, data),
  deleteExperience: (id: string) => api.delete(`/experiences/${id}`),

  // Projects
  getAllProjects: (params?: any) => api.get("/projects", { params }),
  createProject: (data: any) => api.post("/projects", data),
  updateProject: (id: string, data: any) => api.put(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
  addScreenshot: (id: string, data: any) => api.post(`/projects/${id}/screenshots`, data),
  deleteScreenshot: (pid: string, sid: string) => api.delete(`/projects/${pid}/screenshots/${sid}`),

  // Blog
  getAllPosts: (params?: any) => api.get("/blog/admin/all", { params }),
  createPost: (data: any) => api.post("/blog", data),
  updatePost: (id: string, data: any) => api.put(`/blog/${id}`, data),
  deletePost: (id: string) => api.delete(`/blog/${id}`),
  publishPost: (id: string) => api.patch(`/blog/${id}/publish`),

  // Contacts
  getContacts: (params?: any) => api.get("/contacts", { params }),
  getContactById: (id: string) => api.get(`/contacts/${id}`),
  updateContactStatus: (id: string, status: string) => api.patch(`/contacts/${id}/status`, { status }),
  deleteContact: (id: string) => api.delete(`/contacts/${id}`),
  getContactStats: () => api.get("/contacts/stats"),

  // Analytics
  getDashboard: () => api.get("/analytics/dashboard"),
  getTimeline: (days?: number) => api.get(`/analytics/timeline?days=${days || 30}`),
  getTopPages: () => api.get("/analytics/top-pages"),
  getTopProjects: () => api.get("/analytics/top-projects"),
};

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
