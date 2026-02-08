import {sanityClient} from 'sanity:client'
import imageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'
import groq from 'groq'

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export function excerpt(body: unknown, maxLength = 155): string {
  let text = ''
  if (typeof body === 'string') {
    text = body
  } else if (Array.isArray(body)) {
    text = body
      .filter((block: any) => block._type === 'block')
      .map((block: any) => block.children?.map((c: any) => c.text).join('') ?? '')
      .join(' ')
  }
  // Strip markdown formatting
  text = text.replace(/[#*_\[\]()>`~]/g, '').replace(/\s+/g, ' ').trim()
  // Skip cross-post preamble and heading lines
  const lines = text.split(/\.\s+|!\s+/)
  const contentStart = lines.findIndex(
    (l) => !/originally published on LinkedIn/i.test(l) && !/Read it there/i.test(l) && l.trim().length > 30
  )
  if (contentStart > 0) {
    text = lines.slice(contentStart).join('. ').trim()
  }
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s\S*$/, '') + '...'
}

export function readingTime(body: unknown): number {
  let text = ''
  if (typeof body === 'string') {
    text = body
  } else if (Array.isArray(body)) {
    text = body
      .filter((block: any) => block._type === 'block')
      .map((block: any) => block.children?.map((c: any) => c.text).join('') ?? '')
      .join(' ')
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 225))
}

export const postsQuery = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  tags,
  body,
  mainImage,
  author->{name, image}
}`

export const postQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  tags,
  mainImage,
  body,
  author->{name, slug, image, bio},
  categories[]->{title}
}`
