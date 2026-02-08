# waglesworld

Personal blog for Mihir Wagle.

## Architecture

| Component | Technology | URL |
|-----------|------------|-----|
| CMS | Sanity v5 | https://waglesworld.sanity.studio |
| Frontend | Astro (static) | https://waglesworld.com |
| Hosting | Vercel | https://vercel.com/mihir-wagles-projects/waglesworld |
| Repo | GitHub | https://github.com/mavaali/waglesworld |

## Project Structure

```
waglesworld/
├── schemaTypes/        # Sanity schema (post, author, category, blockContent)
├── sanity.config.ts    # Studio config (structure, vision, markdown plugins)
├── sanity.cli.ts       # CLI config (projectId, dataset, deployment appId)
├── web/                # Astro frontend
│   ├── src/
│   │   ├── layouts/    # Base layout
│   │   ├── pages/      # Home, /blog, /blog/[slug]
│   │   └── utils/      # Sanity client, GROQ queries, image helper
│   └── astro.config.mjs
└── package.json
```

## Sanity

- **Project ID:** 3xigt9u7
- **Dataset:** production
- **Workspace:** default
- Post body uses `markdown` type (not Portable Text)
- Old posts may still have Portable Text bodies - frontend handles both formats
- Schema deployed to cloud via `npx sanity@latest schema deploy`
- Studio deployed via `npx sanity@latest deploy`

## Content Pipeline

1. Write/edit in Sanity Studio (markdown body field)
2. Publish triggers webhook
3. Webhook calls Vercel deploy hook
4. Vercel rebuilds static Astro site from `web/` directory
5. Site goes live at waglesworld.com

## Key Decisions

- **Markdown over Portable Text** - Mihir prefers writing in markdown
- **Static output** - Astro builds static HTML, no SSR
- **Minimal design** - Clean typography-focused blog, iterate on styling later
- **Tags + reading time** - Added to post schema beyond defaults

## Commands

```bash
# Sanity Studio (from repo root)
npm run dev              # localhost:3333

# Astro frontend (from web/)
cd web && npm run dev    # localhost:4321

# Deploy Studio
npx sanity@latest deploy

# Manual Vercel deploy (from repo root)
vercel --prod --yes

# Export Sanity data backup
npx sanity@latest dataset export production
```

## Domain

- waglesworld.com hosted on GoDaddy
- DNS: A record @ -> 76.76.21.21, CNAME www -> cname.vercel-dns.com
