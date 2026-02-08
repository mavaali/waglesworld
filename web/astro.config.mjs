// @ts-check
import {defineConfig} from 'astro/config'
import sanity from '@sanity/astro'

// https://astro.build/config
export default defineConfig({
  site: 'https://waglesworld.com',
  integrations: [
    sanity({
      projectId: '3xigt9u7',
      dataset: 'production',
      useCdn: false,
    }),
  ],
})
