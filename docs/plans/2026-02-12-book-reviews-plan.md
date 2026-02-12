# Book Reviews Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/books` section to waglesworld.com for book reviews and recommendations.

**Architecture:** New `bookReview` Sanity schema type with GROQ queries, three new Astro pages (`/books`, `/books/[slug]`), homepage "Recent reads" section, cover image resolution via ISBN + Open Library, and RSS integration. All within the existing Sanity project (3xigt9u7) and Astro frontend.

**Tech Stack:** Sanity v5, Astro (static), TypeScript, GROQ, Open Library Covers API

---

### Task 1: Add `bookReview` Sanity schema type

**Files:**
- Create: `schemaTypes/bookReview.ts`
- Modify: `schemaTypes/index.ts`

**Step 1: Create the schema file**

Create `schemaTypes/bookReview.ts`:

```ts
import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'bookReview',
  title: 'Book Review',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Book Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bookAuthor',
      title: 'Book Author',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isbn',
      title: 'ISBN',
      type: 'string',
      description: 'Used to auto-fetch cover art from Open Library',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image (override)',
      type: 'image',
      description: 'Optional manual cover. If empty, cover is fetched via ISBN.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'string',
      validation: (rule) => rule.required(),
      options: {
        list: [
          {title: 'Obsessed', value: 'Obsessed'},
          {title: 'Really liked it', value: 'Really liked it'},
          {title: 'It was fine', value: 'It was fine'},
          {title: 'DNF', value: 'DNF'},
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'body',
      title: 'Review',
      type: 'markdown',
    }),
    defineField({
      name: 'links',
      title: 'Buy / Borrow Links',
      type: 'object',
      fields: [
        defineField({
          name: 'amazon',
          title: 'Amazon',
          type: 'url',
        }),
        defineField({
          name: 'bookshop',
          title: 'Bookshop.org',
          type: 'url',
        }),
        defineField({
          name: 'libby',
          title: 'Libby',
          type: 'url',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'bookAuthor',
      media: 'coverImage',
    },
  },
})
```

**Step 2: Register the schema**

In `schemaTypes/index.ts`, add the import and export:

```ts
import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'
import bookReview from './bookReview'

export const schemaTypes = [post, author, category, blockContent, bookReview]
```

**Step 3: Verify Studio loads**

Run: `cd /Users/mihirwagle/projects/waglesworld && npm run dev`

Open `localhost:3333`. Confirm "Book Review" appears in the Studio sidebar. Create a test draft to verify all fields render correctly (dropdown for rating, tags input, markdown body, image upload, URL fields for links).

**Step 4: Deploy schema**

Run: `npx sanity@latest schema deploy`

**Step 5: Commit**

```bash
git add schemaTypes/bookReview.ts schemaTypes/index.ts
git commit -m "feat: add bookReview schema type"
```

---

### Task 2: Add GROQ queries and cover image utility

**Files:**
- Modify: `web/src/utils/sanity.ts`

**Step 1: Add GROQ queries**

Append to `web/src/utils/sanity.ts`:

```ts
export const bookReviewsQuery = groq`*[_type == "bookReview" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  bookAuthor,
  isbn,
  coverImage,
  rating,
  tags,
  publishedAt,
  body
}`

export const bookReviewQuery = groq`*[_type == "bookReview" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  bookAuthor,
  isbn,
  coverImage,
  rating,
  tags,
  publishedAt,
  body,
  links
}`
```

**Step 2: Add cover image resolver**

Append to `web/src/utils/sanity.ts`:

```ts
export function bookCoverUrl(review: {isbn?: string; coverImage?: SanityImageSource}): string | null {
  if (review.coverImage) {
    return urlFor(review.coverImage).width(300).url()
  }
  if (review.isbn) {
    return `https://covers.openlibrary.org/b/isbn/${review.isbn}-L.jpg`
  }
  return null
}
```

**Step 3: Commit**

```bash
git add web/src/utils/sanity.ts
git commit -m "feat: add book review GROQ queries and cover image resolver"
```

---

### Task 3: Create `/books` index page

**Files:**
- Create: `web/src/pages/books/index.astro`

**Step 1: Create the page**

Create `web/src/pages/books/index.astro`:

```astro
---
import Base from '../../layouts/Base.astro'
import {sanityClient} from 'sanity:client'
import {bookReviewsQuery, bookCoverUrl, readingTime} from '../../utils/sanity'

const reviews = await sanityClient.fetch(bookReviewsQuery)
---

<Base title="Books - waglesworld" description="Book reviews and recommendations by Mihir Wagle.">
  <h1>Books</h1>
  {
    reviews.length === 0 ? (
      <p class="empty">No reviews yet. Check back soon.</p>
    ) : (
      <ul class="reviews">
        {reviews.map((review: any) => {
          const cover = bookCoverUrl(review)
          return (
            <li>
              <a href={`/books/${review.slug.current}`}>
                {cover && <img src={cover} alt={review.title} class="cover" loading="lazy" />}
                <div class="info">
                  <span class="book-title">{review.title}</span>
                  <span class="book-author">by {review.bookAuthor}</span>
                  <div class="post-meta">
                    <span class={`rating rating-${review.rating.toLowerCase().replace(/\s+/g, '-')}`}>{review.rating}</span>
                    {review.publishedAt &&
                      new Date(review.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    {review.body && ` · ${readingTime(review.body)} min read`}
                  </div>
                  {review.tags && review.tags.length > 0 && (
                    <div class="tags">
                      {review.tags.map((tag: string) => (
                        <span class="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            </li>
          )
        })}
      </ul>
    )
  }
</Base>

<style>
  .empty {
    color: #666;
    margin-top: 1rem;
  }

  .reviews {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .reviews a {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f0f0;
    align-items: flex-start;
  }

  .cover {
    width: 60px;
    height: auto;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .book-title {
    font-weight: 500;
    font-size: 1.1rem;
  }

  .book-author {
    color: #666;
    font-size: 0.9rem;
  }

  .post-meta {
    color: #666;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .rating {
    background: #f0f0f0;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.75rem;
    margin-right: 0.5rem;
  }

  .rating-obsessed {
    background: #fef3c7;
    color: #92400e;
  }

  .rating-really-liked-it {
    background: #d1fae5;
    color: #065f46;
  }

  .rating-it-was-fine {
    background: #f0f0f0;
    color: #555;
  }

  .rating-dnf {
    background: #fee2e2;
    color: #991b1b;
  }

  .tags {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.25rem;
    flex-wrap: wrap;
  }

  .tag {
    background: #f0f0f0;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.75rem;
  }
</style>
```

**Step 2: Commit**

```bash
git add web/src/pages/books/index.astro
git commit -m "feat: add /books index page"
```

---

### Task 4: Create `/books/[slug]` detail page

**Files:**
- Create: `web/src/pages/books/[slug].astro`

**Step 1: Create the page**

Create `web/src/pages/books/[slug].astro`:

```astro
---
import Base from '../../layouts/Base.astro'
import {sanityClient} from 'sanity:client'
import {marked} from 'marked'
import {bookReviewQuery, bookReviewsQuery, bookCoverUrl, readingTime, excerpt} from '../../utils/sanity'

export async function getStaticPaths() {
  const reviews = await sanityClient.fetch(bookReviewsQuery)
  return reviews.map((review: any) => ({
    params: {slug: review.slug.current},
  }))
}

const {slug} = Astro.params
const review = await sanityClient.fetch(bookReviewQuery, {slug})

if (!review) {
  return Astro.redirect('/404')
}

const isMarkdown = typeof review.body === 'string'
const htmlBody = isMarkdown ? marked(review.body) : null
const minRead = review.body ? readingTime(review.body) : null
const cover = bookCoverUrl(review)
const description = review.body ? excerpt(review.body) : `${review.rating} — a book review by Mihir Wagle`
---

<Base title={`${review.title} - waglesworld`} description={description} image={cover || undefined} type="article">
  <article>
    <header>
      <div class="book-header">
        {cover && <img src={cover} alt={review.title} class="cover" />}
        <div class="book-info">
          <h1>{review.title}</h1>
          <p class="book-author">by {review.bookAuthor}</p>
          <span class={`rating rating-${review.rating.toLowerCase().replace(/\s+/g, '-')}`}>{review.rating}</span>
          <div class="meta">
            {review.publishedAt && (
              <time datetime={review.publishedAt}>
                {new Date(review.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            {minRead && <span>{minRead} min read</span>}
          </div>
          {review.tags && review.tags.length > 0 && (
            <div class="tags">
              {review.tags.map((tag: string) => (
                <span class="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>

    {review.body && isMarkdown && (
      <div class="body">
        <Fragment set:html={htmlBody} />
      </div>
    )}

    {review.links && (review.links.amazon || review.links.bookshop || review.links.libby) && (
      <div class="buy-links">
        <h3>Get this book</h3>
        <div class="link-list">
          {review.links.amazon && <a href={review.links.amazon} target="_blank" rel="noopener noreferrer">Amazon</a>}
          {review.links.bookshop && <a href={review.links.bookshop} target="_blank" rel="noopener noreferrer">Bookshop.org</a>}
          {review.links.libby && <a href={review.links.libby} target="_blank" rel="noopener noreferrer">Libby</a>}
        </div>
      </div>
    )}
  </article>

  <a href="/books" class="back">&larr; Back to books</a>
</Base>

<style>
  .book-header {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .cover {
    width: 150px;
    height: auto;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .book-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .book-author {
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .rating {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 3px;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    width: fit-content;
  }

  .rating-obsessed {
    background: #fef3c7;
    color: #92400e;
  }

  .rating-really-liked-it {
    background: #d1fae5;
    color: #065f46;
  }

  .rating-it-was-fine {
    background: #f0f0f0;
    color: #555;
  }

  .rating-dnf {
    background: #fee2e2;
    color: #991b1b;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #666;
    font-size: 0.875rem;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .tag {
    background: #f0f0f0;
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
    font-size: 0.8rem;
    color: #555;
  }

  .body {
    font-size: 1.05rem;
    line-height: 1.8;
    margin-top: 2rem;
  }

  .body :global(p) {
    margin-bottom: 1.25rem;
  }

  .body :global(h2) {
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }

  .body :global(blockquote) {
    border-left: 3px solid #ddd;
    padding-left: 1rem;
    color: #555;
    margin: 1.5rem 0;
  }

  .body :global(a) {
    color: #0066cc;
    text-decoration: underline;
  }

  .buy-links {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }

  .buy-links h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .link-list {
    display: flex;
    gap: 1rem;
  }

  .link-list a {
    color: #0066cc;
    text-decoration: underline;
    font-size: 0.95rem;
  }

  .back {
    display: inline-block;
    margin-top: 3rem;
    color: #666;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    .book-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .cover {
      width: 120px;
    }

    .book-info {
      align-items: center;
    }

    .tags {
      justify-content: center;
    }
  }
</style>
```

**Step 2: Commit**

```bash
git add web/src/pages/books/\[slug\].astro
git commit -m "feat: add /books/[slug] detail page"
```

---

### Task 5: Add "Recent reads" to homepage and "books" to nav

**Files:**
- Modify: `web/src/pages/index.astro`
- Modify: `web/src/layouts/Base.astro`

**Step 1: Update the homepage**

In `web/src/pages/index.astro`, add the import for `bookReviewsQuery` and `bookCoverUrl`, fetch recent reviews, and add a "Recent reads" section after "Recent posts":

Import line (update existing import):
```ts
import {postsQuery, bookReviewsQuery, urlFor, readingTime} from '../utils/sanity'
```

Add fetch:
```ts
const allReviews = await sanityClient.fetch(bookReviewsQuery)
const recentReviews = allReviews.slice(0, 5)
```

Add section after the "Recent posts" section closing tag and before the subscribe section:

```astro
{
  recentReviews.length > 0 && (
    <section class="recent-reads">
      <h2>Recent reads</h2>
      <ul>
        {recentReviews.map((review: any) => (
          <li>
            <a href={`/books/${review.slug.current}`}>
              <span class="post-title">{review.title}</span>
              <span class="post-meta">
                <span class={`rating rating-${review.rating.toLowerCase().replace(/\s+/g, '-')}`}>{review.rating}</span>
                {review.bookAuthor}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <a href="/books" class="see-all">See all books &rarr;</a>
    </section>
  )
}
```

Add styles for the rating badges (same colors as /books page) inside the existing `<style>` block:

```css
.recent-reads ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.recent-reads a {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.5rem 0;
}

.recent-reads .see-all {
  display: inline-block;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.875rem;
}

.rating {
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  margin-right: 0.25rem;
}

.rating-obsessed { background: #fef3c7; color: #92400e; }
.rating-really-liked-it { background: #d1fae5; color: #065f46; }
.rating-it-was-fine { background: #f0f0f0; color: #555; }
.rating-dnf { background: #fee2e2; color: #991b1b; }
```

**Step 2: Add "books" to nav**

In `web/src/layouts/Base.astro`, add the books link to the nav (line 40):

```html
<a href="/blog">blog</a>
<a href="/books">books</a>
<a href="/about">about</a>
```

**Step 3: Commit**

```bash
git add web/src/pages/index.astro web/src/layouts/Base.astro
git commit -m "feat: add recent reads to homepage and books to nav"
```

---

### Task 6: Add book reviews to RSS feed

**Files:**
- Modify: `web/src/pages/rss.xml.ts`

**Step 1: Update the RSS feed**

In `web/src/pages/rss.xml.ts`, import the book reviews query, fetch reviews, merge with posts, sort by date, and map to RSS items.

Updated file:

```ts
import rss from '@astrojs/rss'
import type {APIContext} from 'astro'
import {sanityClient} from 'sanity:client'
import {marked} from 'marked'
import markedKatex from 'marked-katex-extension'
import {postsQuery, bookReviewsQuery, excerpt} from '../utils/sanity'

marked.use(markedKatex({throwOnError: false}))

export async function GET(context: APIContext) {
  const [posts, reviews] = await Promise.all([
    sanityClient.fetch(postsQuery),
    sanityClient.fetch(bookReviewsQuery),
  ])

  const postItems = posts.map((post: any) => {
    const isMarkdown = typeof post.body === 'string'
    const content = isMarkdown ? marked(post.body) : undefined
    return {
      title: post.title,
      pubDate: new Date(post.publishedAt),
      link: `/blog/${post.slug.current}/`,
      description: excerpt(post.body),
      content: content as string | undefined,
      author: post.author?.name || 'Mihir Wagle',
      categories: post.tags || [],
    }
  })

  const reviewItems = reviews.map((review: any) => {
    const isMarkdown = typeof review.body === 'string'
    const content = isMarkdown ? marked(review.body) : undefined
    return {
      title: `Book Review: ${review.title}`,
      pubDate: new Date(review.publishedAt),
      link: `/books/${review.slug.current}/`,
      description: review.body ? excerpt(review.body) : `${review.rating} — ${review.title} by ${review.bookAuthor}`,
      content: content as string | undefined,
      author: 'Mihir Wagle',
      categories: ['book-review', ...(review.tags || [])],
    }
  })

  const allItems = [...postItems, ...reviewItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
  )

  return rss({
    title: 'waglesworld',
    description: 'A personal blog by Mihir Wagle',
    site: context.site!,
    customData: `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items: allItems,
  })
}
```

**Step 2: Commit**

```bash
git add web/src/pages/rss.xml.ts
git commit -m "feat: add book reviews to RSS feed"
```

---

### Task 7: Create a test book review and verify end-to-end

**Step 1: Create a test book review in Sanity Studio**

Open `localhost:3333`, create a new Book Review:
- Title: "The Pragmatic Programmer"
- Book Author: "David Thomas, Andrew Hunt"
- ISBN: "9780135957059"
- Rating: "Obsessed"
- Tags: "programming", "career"
- Published At: today
- Body: "A classic that holds up. Every developer should read this at least once."
- Links > Amazon: any valid URL
- Links > Bookshop.org: any valid URL

Publish the document.

**Step 2: Verify the frontend**

Run: `cd /Users/mihirwagle/projects/waglesworld/web && npm run dev`

Check:
- `localhost:4321/books` — review appears with cover thumbnail, rating badge, tags
- `localhost:4321/books/the-pragmatic-programmer` — full review with cover, rating, body, buy links
- `localhost:4321` — "Recent reads" section shows the review
- `localhost:4321/rss.xml` — review appears in the feed
- Nav bar shows "books" link on all pages

**Step 3: Delete the test review (or keep it)**

If keeping it, no action needed. If removing, delete from Sanity Studio.
