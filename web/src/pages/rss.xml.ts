import rss from '@astrojs/rss'
import type {APIContext} from 'astro'
import {sanityClient} from 'sanity:client'
import {marked} from 'marked'
import {postsQuery, excerpt} from '../utils/sanity'

export async function GET(context: APIContext) {
  const posts = await sanityClient.fetch(postsQuery)

  return rss({
    title: 'waglesworld',
    description: 'A personal blog by Mihir Wagle',
    site: context.site!,
    customData: `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items: posts.map((post: any) => {
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
    }),
  })
}
