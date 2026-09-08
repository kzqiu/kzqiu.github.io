# Klog

Astro + Markdown + KaTeX, deployed as static HTML to GitHub Pages.

## Development

Use Node 24 (see `.nvmrc`), then:

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Astro. Changes refresh automatically.
`npm run check` checks types and templates; `npm test` verifies content publishing;
`npm run build` creates `dist/`; `npm run preview` serves the production build.
On Nix, you can run commands with `nix shell nixpkgs#nodejs_24 --command npm run dev`.

## Publish a post or project

Add a Markdown file to the appropriate directory:

| File | Page URL | Automatically listed in |
| --- | --- | --- |
| `src/content/posts/my-post.md` | `/posts/my-post/` | `/thoughts/` |
| `src/content/projects/my-project.md` | `/projects/my-project/` | `/projects/` |

Start with `templates/article.md`, or just write:

```markdown
---
title: "My first post"
date: 2026-09-07
description: "An optional short summary."
---

An introduction.

## A section

Your content here.
```

That's all: no layout field, imports, manual index edits, or route configuration.
The title and date are rendered automatically, so start body headings with `##`.
Use lowercase, hyphenated filenames for predictable URLs. Nested directories
also work: `posts/topic/my-post.md` becomes `/posts/topic/my-post/`.

`title` and `date` are required; invalid frontmatter fails the build.
`description` is optional and appears in the index and page metadata.
Both sections sort by date, newest first (ties use the filename).
Dates display in UTC to avoid shifting a calendar date across time zones.

Set `draft: true` to exclude an entry from both its index and generated routes,
including during local development. Remove it or set it to `false` to publish.
The supplied template starts as a draft. A future date does not schedule an entry;
use `draft` to control publication. New files appear locally during development
and on the live site after the next successful deployment.

## Equations, code, and images

Write `$E = mc^2$` for inline math, or put `$$` on separate lines around an
equation for display math. KaTeX renders LaTeX math syntax at build time; it is
not a full LaTeX document compiler. No client-side math renderer is loaded.

Use fenced code blocks with a language name such as `cpp`, `rust`, `js`, or `wgsl`.
Shiki highlights them automatically with a light theme. See `templates/article.md`
for working math and code examples. Markdown tables, links, and lists also work.

Put images in `public/images/` and reference them as `![Description](/images/name.png)`.
Use normal site URLs for links, such as `[My project](/projects/my-project/)`.

## Structure

```text
src/content/posts/       Blog posts (Markdown)
src/content/projects/    Project writeups (Markdown)
src/content.config.ts    Frontmatter validation and collection discovery
src/pages/               Homepage, indexes, and automatic article routes
src/layouts/             Shared site and article HTML
src/components/          Shared index list
src/styles/styles.css    Typography, colors, and content styles
public/                  Files copied unchanged to the site
templates/article.md     Copyable authoring example (not published)
```

The homepage stays a work-in-progress message. Fonts are local Crimson Text and
EB Garamond, with licenses in `public/fonts/`. The appearance is inspired by
https://en.algorithmica.org/hpc/.

The old `/thoughts.html` and `/projects.html` URLs redirect to the new section
URLs, so existing bookmarks still work.

## Future pages and demos

For a standalone page, add `src/pages/about.astro` and wrap its content in
`SiteLayout`. For a demo, add `src/pages/apps/my-demo.astro`, use
`<SiteLayout title="My demo" wide>`, and add the canvas, controls, and a `<script>`
there. Astro bundles imported JavaScript on that page. Place prebuilt Wasm and
other static app assets in `public/apps/my-demo/` and fetch them using
`/apps/my-demo/...` URLs. Fully prebuilt apps can also live in that directory with
their own index.html. Link or embed the demo from its Markdown writeup.

MDX and UI frameworks are not required or installed. They can be added later
if articles need imported interactive components. Shared-memory Wasm threads
require COOP/COEP headers; GitHub Pages does not offer native header configuration.

## GitHub Pages

One-time setup: in the repository's **Settings → Pages**, choose **GitHub Actions**
as the build and deployment source. Keep the custom domain `www.kevinzqiu.com`
and HTTPS enabled. The domain file is now `public/CNAME`; Astro copies it to dist.

The workflow checks and builds pull requests. Pushes to `main` also deploy `dist/`.
Do not deploy the repository root or commit generated output. Dependencies are
locked in package-lock.json. Update the `site` value in astro.config.mjs and
public/CNAME together if the domain changes.
