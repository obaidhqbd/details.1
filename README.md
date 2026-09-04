# Obaidul Digital Lab

A performance-first, self-publishing personal site for **Mohammed Obaidul Hoque · Full Stack Web Developer · Web Development Mentor**.

This is deliberately more than a conventional portfolio. The homepage behaves like a small product: it has a personal identity layer, a command center, local-first AI-style intelligence, visitor lenses, a project console, a thought lab, crawlable detail pages, and an automated content pipeline.

## What you change

Almost never touch the site UI after the initial setup.

Add a project here:

```text
content/projects/<project-name>/
```

Add a blog here:

```text
content/blogs/<article-name>/
```

`index.html` is the only required file inside either folder. Metadata files, descriptions and images are optional because the builder has multi-level fallbacks.

## What GitHub Actions does

On every push to `main`, the workflow:

1. scans project and blog folders
2. validates available files
3. extracts or falls back metadata
4. copies runnable project previews
5. generates canonical pages
6. builds a static search index
7. creates `sitemap.xml`, `robots.txt`, and `feed.xml`
8. generates the local-first AI profile
9. publishes the result to GitHub Pages

## Extraordinary features

### Visitor lenses
Visitors can choose **Explore**, **Collaborate**, or **Learn** to change how the site frames the same work.

### Command center
`Ctrl + K` / `⌘ K` opens the site search and navigation layer.

### OB/AI
The default assistant is **local-first** and uses the generated content index. It does not expose an API key and does not require a paid model. The configuration also reserves an `aiEndpoint` field for an optional same-origin proxy later. Never put a private provider key in this repository.

### Project x-ray
Each project gets a canonical context page plus a preserved runnable preview.

### Graceful degradation
Missing thumbnails, descriptions, dates and links do not break the site. Broken or incomplete items are skipped safely instead of taking the whole deployment down.

## GitHub Pages

In repository settings, set Pages to use **GitHub Actions**. The supplied workflow handles the build and deployment.

## Site URL

Set `siteUrl` in `site.config.json` when you use a custom domain. Leave it blank for automatic GitHub Pages URL detection.

## Branding

The default identity is configured for:

- Mohammed Obaidul Hoque
- Full Stack Web Developer
- Web Development Mentor
- GitHub: https://github.com/obaidhqbd

The included portrait is `assets/images/mentor.webp` and can be replaced without changing the template.
