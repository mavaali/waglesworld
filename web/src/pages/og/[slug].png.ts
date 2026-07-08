import type {APIRoute} from 'astro'
import {sanityClient} from 'sanity:client'
import {postsQuery, readingTime} from '../../utils/sanity'
import {renderOgImage} from '../../utils/og'

export async function getStaticPaths() {
  const posts = await sanityClient.fetch(postsQuery)
  return posts.map((post: any) => ({
    params: {slug: post.slug.current},
    props: {post},
  }))
}

export const GET: APIRoute = async ({props}) => {
  const {post} = props as {post: any}
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})
    : null
  const meta = [date, post.body ? `${readingTime(post.body)} min read` : null].filter(Boolean).join(' · ')

  const png = await renderOgImage({title: post.title, meta})
  return new Response(png, {headers: {'Content-Type': 'image/png'}})
}
