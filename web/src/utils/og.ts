import satori from 'satori'
import {Resvg} from '@resvg/resvg-js'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'

// Resolved from the project root (web/) at build time; import.meta.url would
// point into the bundled output where the fonts don't exist.
const fontDir = join(process.cwd(), 'src/assets/fonts')
const fraunces = readFile(join(fontDir, 'fraunces-600.ttf'))
const inter = readFile(join(fontDir, 'inter-400.ttf'))
const interMedium = readFile(join(fontDir, 'inter-500.ttf'))

interface OgOptions {
  title: string
  meta?: string
}

// Mirrors the site's light theme: warm paper background, ember accent.
export async function renderOgImage({title, meta}: OgOptions): Promise<Buffer> {
  const titleSize = title.length <= 40 ? 76 : title.length <= 80 ? 62 : 50

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#faf9f7',
          padding: '64px 72px 56px',
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {display: 'flex', fontFamily: 'Fraunces', fontSize: 36, color: '#1c1917'},
              children: [
                {type: 'span', props: {children: 'waglesworld'}},
                {type: 'span', props: {style: {color: '#c2410c'}, children: '.'}},
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontFamily: 'Fraunces',
                fontSize: titleSize,
                lineHeight: 1.15,
                color: '#1c1917',
                letterSpacing: '-0.01em',
                maxWidth: '1000px',
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {display: 'flex', flexDirection: 'column'},
              children: [
                {
                  type: 'div',
                  props: {
                    style: {display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px'},
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {fontSize: 28, fontWeight: 500, color: '#1c1917'},
                          children: 'Mihir Wagle',
                        },
                      },
                      ...(meta
                        ? [
                            {
                              type: 'span',
                              props: {style: {fontSize: 26, color: '#57534e'}, children: `· ${meta}`},
                            },
                          ]
                        : []),
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      width: '160px',
                      height: '10px',
                      backgroundColor: '#c2410c',
                      borderRadius: '999px',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {name: 'Fraunces', data: await fraunces, weight: 600, style: 'normal'},
        {name: 'Inter', data: await inter, weight: 400, style: 'normal'},
        {name: 'Inter', data: await interMedium, weight: 500, style: 'normal'},
      ],
    }
  )

  const png = new Resvg(svg, {fitTo: {mode: 'width', value: 1200}}).render().asPng()
  return Buffer.from(png)
}
