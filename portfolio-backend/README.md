# Portfolio Backend API

Production-ready Express.js + TypeScript REST API for Irfan Ansari's portfolio.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg` pool)
- **Auth**: JWT (access + refresh tokens) + bcrypt
- **Validation**: Zod
- **File Uploads**: Multer + Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate limiting

---

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Fill in your values
```

### 3. Database

```bash
# Run schema migration
npx ts-node src/db/migrate.ts

# (Optional) Seed demo data
npx ts-node src/db/migrate.ts seed
```

### 4. Dev Server

```bash
npm run dev
```

Server starts at **http://localhost:5000**

---

## API Routes

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/setup` | Public (once) | Create first admin |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Admin | Logout |
| GET | `/api/auth/me` | Admin | Get current admin |
| PUT | `/api/auth/password` | Admin | Change password |

### Site Settings
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/settings` | Public | Get site settings |
| PUT | `/api/settings` | Admin | Update settings |
| POST | `/api/settings/avatar` | Admin | Upload avatar image |

### Social Links
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/social` | Public | Get all social links |
| POST | `/api/social` | Admin | Create social link |
| PUT | `/api/social/:id` | Admin | Update social link |
| PUT | `/api/social/reorder` | Admin | Reorder links |
| DELETE | `/api/social/:id` | Admin | Delete social link |

### Tags
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/tags` | Public | Get all tags |
| POST | `/api/tags` | Admin | Create tag |
| PUT | `/api/tags/:id` | Admin | Update tag |
| DELETE | `/api/tags/:id` | Admin | Delete tag |

### Skills
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/skills` | Public | Get skills grouped by category |
| GET | `/api/skills/categories` | Public | Get all categories |
| POST | `/api/skills/categories` | Admin | Create category |
| PUT | `/api/skills/categories/:id` | Admin | Update category |
| PUT | `/api/skills/categories/reorder` | Admin | Reorder categories |
| DELETE | `/api/skills/categories/:id` | Admin | Delete category |
| POST | `/api/skills` | Admin | Create skill |
| PUT | `/api/skills/:id` | Admin | Update skill |
| DELETE | `/api/skills/:id` | Admin | Delete skill |

### Experiences
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/experiences` | Public | Get all experiences |
| GET | `/api/experiences/:id` | Public | Get single experience |
| POST | `/api/experiences` | Admin | Create experience |
| PUT | `/api/experiences/:id` | Admin | Update experience |
| DELETE | `/api/experiences/:id` | Admin | Delete experience |

### Projects
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/projects` | Public | List projects (paginated, filterable) |
| GET | `/api/projects/featured` | Public | Get featured projects |
| GET | `/api/projects/slug/:slug` | Public | Get project by slug |
| GET | `/api/projects/:id` | Public | Get project by ID |
| POST | `/api/projects` | Admin | Create project |
| PUT | `/api/projects/:id` | Admin | Update project + tags |
| DELETE | `/api/projects/:id` | Admin | Soft delete project |
| POST | `/api/projects/:id/screenshots` | Admin | Add screenshot |
| DELETE | `/api/projects/:id/screenshots/:sid` | Admin | Remove screenshot |
| PUT | `/api/projects/:id/screenshots/reorder` | Admin | Reorder screenshots |
| POST | `/api/projects/:id/thumbnail` | Admin | Upload thumbnail |

### Blog Posts
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/blog` | Public | List posts (paginated) |
| GET | `/api/blog/slug/:slug` | Public | Get post by slug |
| GET | `/api/blog/:id` | Public | Get post by ID |
| GET | `/api/blog/admin/all` | Admin | List all posts incl. drafts |
| POST | `/api/blog` | Admin | Create post |
| PUT | `/api/blog/:id` | Admin | Update post |
| DELETE | `/api/blog/:id` | Admin | Soft delete post |
| PATCH | `/api/blog/:id/publish` | Admin | Publish post |
| POST | `/api/blog/:id/cover` | Admin | Upload cover image |

### Contacts
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/contacts` | Public (rate-limited) | Submit contact form |
| GET | `/api/contacts` | Admin | List contacts (paginated) |
| GET | `/api/contacts/stats` | Admin | Contact stats |
| GET | `/api/contacts/:id` | Admin | Get contact (auto-marks read) |
| PATCH | `/api/contacts/:id/status` | Admin | Update status |
| DELETE | `/api/contacts/:id` | Admin | Delete contact |

### Analytics
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/analytics/track` | Public | Track an event |
| GET | `/api/analytics/dashboard` | Admin | Dashboard stats |
| GET | `/api/analytics/timeline` | Admin | Event timeline |
| GET | `/api/analytics/top-pages` | Admin | Top pages |
| GET | `/api/analytics/top-projects` | Admin | Top clicked projects |

---

## Query Parameters

### Filtering & Pagination (projects, blog, contacts)
- `page` — page number (default: 1)
- `limit` — items per page (default: 10, max: 100)
- `status` — filter by status
- `tag` — filter by tag name or UUID
- `search` — search by title/name
- `featured` — `true` for featured only

---

## Authentication

All admin routes require:
```
Authorization: Bearer <accessToken>
```

Get tokens from `POST /api/auth/login`.

---

## Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

See `.env.example` for all required variables.
