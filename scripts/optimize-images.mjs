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
 * Duas escolhas que derrubaram o arquivo de 51 kB para 10 kB:
 *
 * · **RGB uniforme.** O <Logo> usa este PNG como `mask-image`, onde só o canal
 *   alpha decide o que aparece — a cor vem de um degradê CSS por cima. Forçar
 *   todo o RGB para branco elimina variação que nunca seria vista e dá ao
 *   compressor uma imagem quase toda igual.
 *
 * · **Paleta em vez de RGBA.** Com o RGB constante, uma paleta de 96 entradas
 *   é, na prática, 96 níveis de alpha — mais que suficiente para as bordas
 *   antisserrilhadas continuarem lisas, e um quinto do tamanho.
 *
 * A largura também caiu: 800 px cobre o maior uso na tela (384 px no CTA
 * final) mesmo em telas de densidade dupla. 1400 era detalhe que ninguém vê.
 */
async function logoToMaskPng(inputPath, outPath, width) {
  const base = sharp(inputPath).trim({ threshold: 1 }).resize({ width, withoutEnlargement: true })

  const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 96, effort: 10 })
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
      // A variante prateada não vai para public/: ela só é lida em tempo de
      // build por scripts/generate-og.mjs, direto de assets-src. Publicá-la
      // seria mandar 190 kB para o bucket que nenhum visitante busca.
      if (name.endsWith('-prata')) continue

      await logoToMaskPng(input, path.join(OUT, `${name}.png`), name === 'logo-mark' ? 400 : 800)
      console.log(`✓ ${name}.png (máscara)`)
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
