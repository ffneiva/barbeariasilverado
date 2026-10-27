/**
 * Pré-renderização: grava o conteúdo de cada página dentro do HTML estático.
 *
 * O site é um app React: o HTML do `vite build` traz o <head> (título,
 * descrição, JSON-LD) e um <div id="root"> vazio. O Google executa JavaScript
 * com atraso; os robôs de IA (GPTBot, ClaudeBot, PerplexityBot) não executam:
 * para eles a barbearia não tinha nenhum texto.
 *
 * Cada rota é aberta num Chromium sem tela (o `vite preview`), rolada até o
 * fim para as seções sob demanda montarem, e o conteúdo do #root vai para o
 * HTML com `data-pre`. Para quem visita nada muda: o CSS esconde esse conteúdo
 * (`#root[data-pre]`) e o React, ao montar, põe o conteúdo vivo no lugar e
 * tira o atributo (ver main.tsx).
 *
 * Mesmo modelo da Abram Digital (abramdigital/scripts/prerender.mjs).
 * Sem navegador, avisa e segue; com PRERENDER_OBRIGATORIO=1 (no deploy), falha.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { preview } from 'vite'

const DIST = path.resolve(import.meta.dirname, '..', 'dist')
const obrigatorio = process.env.PRERENDER_OBRIGATORIO === '1'

function paginas(dir = DIST, saida = []) {
  for (const nome of readdirSync(dir)) {
    const c = path.join(dir, nome)
    if (statSync(c).isDirectory()) paginas(c, saida)
    else if (nome === 'index.html') saida.push(c)
  }
  return saida
}

let browser
try {
  const { chromium } = await import('playwright')
  browser = await chromium.launch()
} catch (e) {
  const msg = `prerender: sem navegador (${e.message.split('\n')[0]}).`
  if (obrigatorio) throw new Error(msg)
  console.warn(`${msg} As páginas saem sem o conteúdo gravado.`)
  process.exit(0)
}

const servidor = await preview({ preview: { port: 4398, strictPort: false }, logLevel: 'warn' })
const base = servidor.resolvedUrls.local[0].replace(/\/$/, '')
// Movimento reduzido: sem abertura nem animações de entrada; o texto já nasce
// na posição final. ?sem=marca: o 3D não monta (o canvas sairia de qualquer jeito).
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' })

const alvos = [
  ...paginas().map((arquivo) => {
    const rel = path.relative(DIST, path.dirname(arquivo)).replaceAll('\\', '/')
    return { arquivo, rel, url: `${base}/${rel}${rel ? '/' : ''}?sem=marca` }
  }),
  // O preview (SPA) devolve o index.html para endereço inexistente; o app lê
  // /404 e mostra a página "não encontrada".
  { arquivo: path.join(DIST, '404.html'), rel: '404', url: `${base}/404?sem=marca` },
]

let total = 0
for (const { arquivo, rel, url } of alvos) {
  const p = await ctx.newPage()
  await p.goto(url, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('#root main h1, #root h1', { timeout: 20000 })
  await p.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 50))
    }
    window.scrollTo(0, 0)
  })
  await p.waitForTimeout(500)
  const html = await p.evaluate(() => {
    const raiz = document.getElementById('root').cloneNode(true)
    // Camadas decorativas (3D, cursor, grão, abertura) e o que não é conteúdo.
    for (const el of raiz.querySelectorAll('canvas, script, iframe, div[aria-hidden].fixed')) el.remove()
    return raiz.innerHTML
  })
  await p.close()
  const original = readFileSync(arquivo, 'utf8')
  if (!original.includes('<div id="root"></div>')) throw new Error(`prerender: #root vazio não encontrado em ${arquivo}`)
  writeFileSync(arquivo, original.replace('<div id="root"></div>', `<div id="root" data-pre="">${html}</div>`))
  const palavras = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  console.log(`prerender: /${rel}${rel && rel !== '404' ? '/' : ''} (${palavras} palavras)`)
  total++
}

await browser.close()
await new Promise((r) => servidor.httpServer.close(r))
console.log(`prerender: ${total} páginas gravadas.`)
