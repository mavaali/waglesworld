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
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'completed',
      options: {
        list: [
          {title: 'Currently Reading', value: 'reading'},
          {title: 'Completed', value: 'completed'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'string',
      hidden: ({document}) => document?.status === 'reading',
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
      name: 'startedAt',
      title: 'Started reading',
      type: 'datetime',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      description: 'Date the review was published (set when completed)',
    }),
    defineField({
      name: 'currentPage',
      title: 'Current Page',
      type: 'number',
      hidden: ({document}) => document?.status !== 'reading',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'totalPages',
      title: 'Total Pages',
      type: 'number',
      hidden: ({document}) => document?.status !== 'reading',
      validation: (rule) => rule.min(1),
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
      author: 'bookAuthor',
      status: 'status',
      media: 'coverImage',
    },
    prepare({title, author, status, media}) {
      return {
        title,
        subtitle: status === 'reading' ? `📖 Reading · ${author}` : author,
        media,
      }
    },
  },
})
