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
  // A textura de couro entra a 18–28% de opacidade sobre um fundo quase preto:
  // detalhe nenhum sobrevive a isso. Comprimir forte é literalmente invisível e
  // derruba o maior asset do caminho crítico de 268 kB para ~26 kB.
  texture: { widths: [960, 1280], quality: 30 },
}

function profileFor(name) {
  if (name.startsWith('corte-')) return PROFILES.cut
  if (name === 'leather') return PROFILES.texture
  return PROFILES.hero
}

/**
 * Os logos agora vêm do kit oficial da marca: PNG com canal alpha correto.
 *
 * A versão anterior recebia um JPG cinza sobre fundo branco (extraído do
 * Google Sites) e recortava o fundo por limiar de luminância — heurística que
 * funcionava, mas perdia a palavra "BARBEARIA" do lockup e comia a borda do
 * "o" final. Com o arquivo de origem certo, o trabalho aqui virou o mínimo:
 * recortar a moldura transparente e redimensionar.
 *
 * O RGB é forçado para branco puro porque o <Logo> usa este arquivo como
 * `mask-image` — ali só o alpha conta, e um RGB previsível evita surpresa se
 * algum dia ele for exibido direto. A versão prateada do kit é preservada
 * separadamente, para o cartão de compartilhamento.
 */
async function logoToMaskPng(inputPath, outPath, width, { keepColor = false } = {}) {
  const base = sharp(inputPath).trim({ threshold: 1 }).resize({ width, withoutEnlargement: true })

  if (keepColor) {
    await base.png({ compressionLevel: 9 }).toFile(outPath)
    return
  }

  const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
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
      // A variante prateada mantém a cor: ela é composta direto sobre a foto
      // de couro no cartão de compartilhamento, sem máscara CSS por cima.
      const keepColor = name.endsWith('-prata')
      const width = name === 'logo-mark' ? 512 : 1400
      await logoToMaskPng(input, path.join(OUT, `${name}.png`), width, { keepColor })
      console.log(`✓ ${name}.png (${keepColor ? 'cor original' : 'máscara'})`)
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
