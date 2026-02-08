import type {APIContext} from 'astro'
import {sanityClient} from 'sanity:client'
import {postsQuery} from '../utils/sanity'

export async function GET(context: APIContext) {
  const posts = await sanityClient.fetch(postsQuery)

  const lines = [
    '# waglesworld',
    '',
    '> Personal blog by Mihir Wagle — technologist at Microsoft, IIT Bombay alum.',
    '> Writing about agentic AI, data platforms, supply chain intelligence, and cricket.',
    '',
    '## Author',
    '',
    '- Name: Mihir Wagle',
    '- Site: https://waglesworld.com',
    '- LinkedIn: https://www.linkedin.com/in/mihirwagle/',
    '- GitHub: https://github.com/mavaali',
    '- Bluesky: https://bsky.app/profile/waglesworld.com',
    '',
    '## Posts',
    '',
    ...posts.map((post: any) => {
      const url = new URL(`/blog/${post.slug.current}/`, context.site).href
      const tags = post.tags?.length ? ` [${post.tags.join(', ')}]` : ''
      return `- [${post.title}](${url})${tags}`
    }),
    '',
    '## Feeds',
    '',
    '- RSS: https://waglesworld.com/rss.xml',
    '- Sitemap: https://waglesworld.com/sitemap-index.xml',
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {'Content-Type': 'text/plain; charset=utf-8'},
  })
}
