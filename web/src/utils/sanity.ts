import {sanityClient} from 'sanity:client'
import imageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'
import groq from 'groq'

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export const postsQuery = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  estimatedReadingTime,
  tags,
  mainImage,
  author->{name, image}
}`

export const postQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  estimatedReadingTime,
  tags,
  mainImage,
  body,
  author->{name, slug, image, bio},
  categories[]->{title}
}`
