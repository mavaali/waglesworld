import type {APIRoute} from 'astro'
import {renderOgImage} from '../../utils/og'

export const GET: APIRoute = async () => {
  const png = await renderOgImage({
    title: "Mihir Wagle's blog",
    meta: 'agentic AI · data platforms · cricket',
  })
  return new Response(png, {headers: {'Content-Type': 'image/png'}})
}
