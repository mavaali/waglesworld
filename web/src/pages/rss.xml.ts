import rss from '@astrojs/rss'
import type {APIContext} from 'astro'
import {sanityClient} from 'sanity:client'
import {postsQuery} from '../utils/sanity'

export async function GET(context: APIContext) {
  const posts = await sanityClient.fetch(postsQuery)

  return rss({
    title: 'waglesworld',
    description: 'A personal blog by Mihir Wagle',
    site: context.site!,
    items: posts.map((post: any) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt),
      link: `/blog/${post.slug.current}/`,
    })),
  })
}
