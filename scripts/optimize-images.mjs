/**
 * Pipeline de imagens: assets-src/*.jpg → public/images/*.{avif,webp,jpg}
 *
 * Roda no pré-commit do desenvolvedor, não no CI: o resultado é versionado em
 * public/images para que o build do GitHub Actions continue sendo só `vite build`
 * (sem sharp, que é uma dependência binária pesada e lenta em runner frio).
 *
 *   npm run assets
 */
import sharp from 'sharp'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SRC = path.resolve(import.meta.dirname, '../assets-src')
const OUT = path.resolve(import.meta.dirname, '../public/images')

/** Larguras geradas por imagem, por finalidade. */
const PROFILES = {
  cut: { widths: [640, 960, 1280], quality: 62 },
  hero: { widths: [960, 1440, 1920], quality: 60 },
  texture: { widths: [1280, 1920], quality: 55 },
}

function profileFor(name) {
  if (name.startsWith('corte-')) return PROFILES.cut
  if (name === 'leather') return PROFILES.texture
  return PROFILES.hero
}

/**
 * Os logos vieram em JPG com fundo branco chapado. Como o site é escuro, o
 * branco precisa virar alpha.
 *
 * Um `alpha = 1 - luminância` ingênuo não serve: o logotipo é um degradê
 * prateado cujo topo chega perto de #d0d0d0, e ele sairia semitransparente.
 * O histograma do arquivo original separa bem as duas populações — corpo do
 * traço entre 128 e 223, fundo acima de 240 —, então o corte é feito por
 * limiar com uma rampa estreita no meio, que preserva o antialiasing das bordas
 * sem comer o miolo das letras.
 *
 * O RGB é reescrito como prata clara para o PNG também funcionar sozinho (é
 * assim que ele entra no cartão de compartilhamento). No site, o componente
 * <Logo> usa este arquivo apenas como `mask-image`, então lá só o alpha conta.
 */
const SOLID_BELOW = 200 // abaixo disto é traço puro
const CLEAR_ABOVE = 244 // acima disto é fundo puro

async function logoToTransparentPng(inputPath, outPath, width) {
  const img = sharp(inputPath).resize({ width, withoutEnlargement: true })
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels } = info

  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0, p = 0; i < data.length; i += channels, p += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

    const alpha =
      lum <= SOLID_BELOW ? 1 : lum >= CLEAR_ABOVE ? 0 : (CLEAR_ABOVE - lum) / (CLEAR_ABOVE - SOLID_BELOW)

    // Reescala 128–200 para 170–255: mantém a direção do degradê original,
    // mas num prata que aparece sobre preto.
    const shade = Math.round(170 + Math.min(1, Math.max(0, (lum - 128) / 72)) * 85)

    rgba[p] = shade
    rgba[p + 1] = shade
    rgba[p + 2] = Math.min(255, shade + 4) // um fio de azul: aço, não cinza
    rgba[p + 3] = Math.round(alpha * 255)
  }

  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(outPath)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f))
  const manifest = {}

  for (const file of files) {
    const name = path.parse(file).name
    const input = path.join(SRC, file)

    if (name.startsWith('logo-')) {
      await logoToTransparentPng(input, path.join(OUT, `${name}.png`), name === 'logo-mark' ? 512 : 1024)
      console.log(`✓ ${name}.png (alpha)`)
      continue
    }

    const { widths, quality } = profileFor(name)
    const meta = await sharp(input).metadata()
    const sizes = []

    for (const width of widths) {
      if (width > meta.width * 1.2) continue
      const base = sharp(input).resize({ width, withoutEnlargement: true })
      await base.clone().avif({ quality, effort: 6 }).toFile(path.join(OUT, `${name}-${width}.avif`))
      await base.clone().webp({ quality: quality + 8 }).toFile(path.join(OUT, `${name}-${width}.webp`))
      sizes.push(width)
    }

    // Fallback universal, na maior largura do perfil.
    const fallbackWidth = sizes.at(-1) ?? widths[0]
    await sharp(input)
      .resize({ width: fallbackWidth, withoutEnlargement: true })
      .jpeg({ quality: quality + 12, mozjpeg: true })
      .toFile(path.join(OUT, `${name}.jpg`))

    // Placeholder LQIP embutido no bundle — evita o "flash" cinza no lazy load.
    const lqip = await sharp(input).resize({ width: 20 }).blur(1.2).webp({ quality: 40 }).toBuffer()

    manifest[name] = {
      widths: sizes,
      aspect: +(meta.width / meta.height).toFixed(4),
      lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    }
    console.log(`✓ ${name} → ${sizes.join(', ')}`)
  }

  await writeFile(
    path.resolve(import.meta.dirname, '../src/lib/image-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
  console.log(`\n${Object.keys(manifest).length} imagens no manifest.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
