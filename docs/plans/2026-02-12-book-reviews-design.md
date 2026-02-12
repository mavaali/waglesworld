# Book Reviews Section Design

Add a `/books` section to waglesworld.com for book reviews and recommendations.

## Sanity Schema

New `bookReview` document type:

| Field | Type | Notes |
|-------|------|-------|
| `title` | string, required | Book title |
| `slug` | slug, from title | URL path |
| `bookAuthor` | string, required | The book's author |
| `isbn` | string | For auto-fetching cover art |
| `coverImage` | image, optional | Manual override for cover |
| `rating` | string, required | Dropdown: "Obsessed", "Really liked it", "It was fine", "DNF" |
| `tags` | array of strings | Freeform, same pattern as blog posts |
| `publishedAt` | datetime | Review publish date |
| `body` | markdown | The review (short blurb or full essay) |
| `links` | object | Optional fields: `amazon`, `bookshop`, `libby` |

No separate `book` entity. The review is the book record.

## Rating System (The Wagle Scale)

Four tiers, rendered as a dropdown in Sanity Studio:

- **Obsessed** -- must read
- **Really liked it** -- recommended
- **It was fine** -- no strong feelings
- **DNF** -- did not finish

## Frontend Pages

### `/books` (index)

Lists all book reviews, newest first. Each entry shows:

- Book title and book author
- Rating badge
- Date and tags
- Cover thumbnail (if available)

### `/books/[slug]` (individual review)

- Cover image (auto or manual)
- Book title, book author, rating badge
- Tags
- Review body (markdown)
- Buy/borrow links (Amazon, Bookshop.org, Libby) -- only those provided
- Date and reading time

### Homepage update

Add "Recent reads" section below "Recent posts." Show 3-5 recent book reviews with a "See all books" link. Same visual style as the posts list.

## Cover Image Strategy

Resolved at build time, baked into static HTML:

1. If `coverImage` exists in Sanity, use it (manual override wins).
2. Else if `isbn` exists, fetch from Open Library: `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg`. If the response is a 1x1 placeholder, treat as missing.
3. Else, render without a cover.

Utility function lives in `web/src/utils/` alongside existing Sanity helpers.

## Navigation and RSS

- Add "Books" link to site navigation.
- Include book reviews in the existing RSS feed.

## What This Design Excludes

- No tag index pages (add later if the collection grows).
- No search or AI recommendations (save for the wife's app).
- No separate Sanity project or dataset.
- No separate `book` document type.
