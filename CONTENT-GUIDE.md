# Content Guide · Obaidul Digital Lab

The site is intentionally designed so metadata is **optional**. Your normal workflow is simply: create a folder, put the material inside it, push to `main`.

## Project

```text
content/projects/modern-dashboard/
├── index.html                 # required
├── thumbnail.webp             # optional, recommended
├── project.json               # optional
├── material.md                # optional description/material
├── caption.txt                # optional image caption
└── assets/                    # optional project assets
```

Suggested `project.json`:

```json
{
  "title": "Modern Dashboard",
  "description": "A responsive dashboard with interactive data views.",
  "date": "2026-09-04",
  "updated": "2026-09-04",
  "category": "Web Application",
  "technologies": ["HTML", "CSS", "JavaScript"],
  "tags": ["dashboard", "ui", "frontend"],
  "live": "https://example.com",
  "github": "https://github.com/obaidhqbd/example",
  "featured": true,
  "pinned": false,
  "status": "published"
}
```

## Blog

```text
content/blogs/building-fast-static-sites/
├── index.html                 # required
├── cover.webp                 # optional, recommended
├── blog.json                  # optional
├── material.md                # optional
└── caption.txt                # optional
```

Suggested `blog.json`:

```json
{
  "title": "Building Fast Static Sites",
  "description": "A practical note on performance-first publishing.",
  "date": "2026-09-04",
  "updated": "2026-09-04",
  "category": "Web Development",
  "technologies": ["HTML", "CSS", "JavaScript"],
  "tags": ["performance", "static-site", "github-pages"],
  "featured": false,
  "status": "published"
}
```

## Fallback order

### Title
`project.json/blog.json` → `<h1>` → `<title>` → folder name

### Description/material
`description` metadata → `material.md` → `material.txt` → `description.txt` → `caption.txt` → first HTML paragraph → README → safe generated fallback

### Image
Metadata image → `thumbnail.*` → `cover.*` → `preview.*` → first media file → branded fallback SVG

### Date
Metadata date → `<time datetime>` → build-safe fallback

### Links
Explicit `live` / `github` → detectable external links in HTML. Missing links are not rendered as dead buttons.

## Important

Only `index.html` is required for a publishable item. Everything else is an enhancement.
