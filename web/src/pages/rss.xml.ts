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
