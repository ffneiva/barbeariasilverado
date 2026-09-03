/**
 * Gera os assets de identidade que não são componentes React:
 *   public/og.jpg              — cartão de compartilhamento 1200×630
 *   public/favicon.svg         — a navalha em vetor (tema escuro/claro)
 *   public/favicon-32.png      — fallback raster
 *   public/apple-touch-icon.png
 *   public/site.webmanifest
 *
 * Roda localmente (`npm run og`) e o resultado é versionado — o CI não precisa
 * de sharp.
 */
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ROUTES, canonicalFor } from '../src/lib/routes.ts'

const ROOT = path.resolve(import.meta.dirname, '..')
const PUB = path.join(ROOT, 'public')

const SITE = {
  name: 'Barbearia Silverado',
  tagline: 'O TALENTO DA LÂMINA',
  address: 'JARDIM AMÉRICA · GOIÂNIA/GO',
  url: 'barbeariasilverado.com.br',
}

/** A navalha da marca — mesmo traçado do <BladeIcon /> em src/components/Logo.tsx. */
const BLADE_PATH =
  'M8 14h74c3 0 5 2 5 4s-2 4-5 4H30l42 30c3 2 3 6 0 8L20 92c-3 2-7 0-7-4 0-2 1-3 2-4l44-26L9 22c-3-2-3-8-1-8z'

async function buildOg() {
  const leather = await sharp(path.join(ROOT, 'assets-src/leather.jpg'))
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .modulate({ brightness: 0.62 })
    .toBuffer()

  // A variante prateada do kit, e não a máscara branca: aqui o logo é composto
  // direto sobre a foto, sem CSS por cima para dar o acabamento metálico.
  const wordmark = await sharp(path.join(PUB, 'images/logo-wordmark-prata.png'))
    .resize({ width: 660 })
    .toBuffer()

  // Camadas de texto e vinheta em SVG — nitidez de vetor sobre a foto.
  const overlay = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <radialGradient id="vig" cx="50%" cy="45%" r="70%">
          <stop offset="45%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#030304" stop-opacity="0.92"/>
        </radialGradient>
        <linearGradient id="rule" x1="0" x2="1">
          <stop offset="0%" stop-color="#35383f" stop-opacity="0"/>
          <stop offset="50%" stop-color="#d3d7de"/>
          <stop offset="100%" stop-color="#35383f" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="630" fill="url(#vig)"/>

      <text x="600" y="438" text-anchor="middle"
            font-family="Georgia, 'Times New Roman', serif" font-size="27" letter-spacing="11"
            fill="#b2b8c2">${SITE.tagline}</text>

      <rect x="360" y="472" width="480" height="1.5" fill="url(#rule)"/>

      <text x="600" y="522" text-anchor="middle"
            font-family="Consolas, 'Courier New', monospace" font-size="19" letter-spacing="6"
            fill="#8b929e">${SITE.address}</text>

      <text x="600" y="572" text-anchor="middle"
            font-family="Consolas, 'Courier New', monospace" font-size="17" letter-spacing="4"
            fill="#6b7280">${SITE.url}</text>

      <g transform="translate(566, 74) scale(0.68)" fill="none" stroke="#6b7280" stroke-width="3" stroke-linejoin="round">
        <path d="${BLADE_PATH}"/>
      </g>
    </svg>
  `)

  await sharp(leather)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: wordmark, top: 168, left: 270 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(PUB, 'og.jpg'))

  console.log('✓ og.jpg')
}

async function buildIcons() {
  // Favicon vetorial: fundo preto + navalha prateada. Nítido em qualquer zoom
  // e leve o bastante para ficar inline no HTML se um dia for preciso.
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="18" fill="#08080a"/>
  <g transform="translate(4 2) scale(0.92)" fill="#d3d7de" fill-opacity="0.16" stroke="#e9ebef" stroke-width="4" stroke-linejoin="round">
    <path d="${BLADE_PATH}"/>
  </g>
  <circle cx="21" cy="19" r="2.8" fill="#e9ebef"/>
</svg>
`
  await writeFile(path.join(PUB, 'favicon.svg'), favicon)

  const svg = Buffer.from(favicon)
  await sharp(svg, { density: 384 }).resize(32, 32).png().toFile(path.join(PUB, 'favicon-32.png'))
  await sharp(svg, { density: 384 }).resize(180, 180).png().toFile(path.join(PUB, 'apple-touch-icon.png'))
  await sharp(svg, { density: 384 }).resize(192, 192).png().toFile(path.join(PUB, 'icon-192.png'))
  await sharp(svg, { density: 384 }).resize(512, 512).png().toFile(path.join(PUB, 'icon-512.png'))

  console.log('✓ favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192/512.png')
}

async function buildManifest() {
  const manifest = {
    name: SITE.name,
    short_name: 'Silverado',
    description:
      'Barbearia no Jardim América, em Goiânia. Degradê, navalhado e barba com acabamento de lâmina.',
    start_url: '/',
    display: 'standalone',
    background_color: '#030304',
    theme_color: '#030304',
    lang: 'pt-BR',
    categories: ['lifestyle', 'business'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  await writeFile(path.join(PUB, 'site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('✓ site.webmanifest')
}

async function buildSeoFiles() {
  const today = new Date().toISOString().slice(0, 10)

  await writeFile(
    path.join(PUB, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: https://${SITE.url}/sitemap.xml\n`,
  )

  // O sitemap é derivado de src/lib/routes.ts — a mesma lista que o roteador e
  // o gerador de HTML por rota consomem. Rota nova entra no sitemap sozinha; a
  // alternativa (manter uma cópia aqui) é a que envelhece calada.
  const prioridade = { '/': '1.0', '/agendar': '0.9', '/loja': '0.8' }
  const frequencia = { '/politica-de-privacidade': 'yearly' }

  const urls = ROUTES.map(
    (route) => `  <url>
    <loc>${canonicalFor(route)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${frequencia[route.path] ?? 'monthly'}</changefreq>
    <priority>${prioridade[route.path] ?? '0.3'}</priority>
  </url>`,
  ).join('\n')

  await writeFile(
    path.join(PUB, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
  )

  console.log('✓ robots.txt, sitemap.xml')
}

await buildOg()
await buildIcons()
await buildManifest()
await buildSeoFiles()
