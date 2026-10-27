/**
 * Confere o SEO de cada HTML do dist/ depois do build. Falha o build se algo
 * quebrar, porque um erro aqui só apareceria semanas depois, no Search Console.
 *
 * Por página: um <h1> só e com texto (o conteúdo vem do pré-render), título e
 * description no tamanho que o Google mostra inteiro, canonical, og:image que
 * existe de verdade, alt em toda imagem, JSON-LD que é JSON válido e cujas
 * referências (`{ "@id": … }`) apontam para nós que existem no mesmo grafo, e
 * nenhum travessão no texto visível nem nos metadados.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('dist')
const erros = []
const avisos = []

function htmls(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const p = path.join(dir, nome)
    if (statSync(p).isDirectory()) return htmls(p)
    return nome.endsWith('.html') && !nome.startsWith('google') ? [p] : []
  })
}

function referencias(no, achadas = []) {
  if (Array.isArray(no)) for (const v of no) referencias(v, achadas)
  else if (no && typeof no === 'object') {
    const chaves = Object.keys(no)
    if (chaves.length === 1 && chaves[0] === '@id') achadas.push(no['@id'])
    else for (const v of Object.values(no)) referencias(v, achadas)
  }
  return achadas
}

function ids(no, achados = new Set()) {
  if (Array.isArray(no)) for (const v of no) ids(v, achados)
  else if (no && typeof no === 'object') {
    if (no['@id'] && Object.keys(no).length > 1) achados.add(no['@id'])
    for (const v of Object.values(no)) ids(v, achados)
  }
  return achados
}

for (const arquivo of htmls(DIST)) {
  const rel = path.relative(DIST, arquivo).replaceAll('\\', '/')
  const html = readFileSync(arquivo, 'utf8')
  const cabeca = html.slice(0, html.indexOf('<body'))
  const corpo = html.slice(html.indexOf('<body'))
  const falha = (msg) => erros.push(`${rel}: ${msg}`)

  const titulo = cabeca.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
  const descricao = cabeca.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? ''
  if (!titulo) falha('sem <title>')
  else if (titulo.length > 60)
    avisos.push(`${rel}: título com ${titulo.length} caracteres (o Google corta perto de 60)`)
  if (descricao.length < 50 || descricao.length > 160)
    falha(`description com ${descricao.length} caracteres (50 a 160)`)
  if (!/<link rel="canonical" href="https:\/\/barbeariasilverado.com.br/.test(cabeca))
    falha('sem canonical')

  const og = cabeca.match(
    /<meta\s+property="og:image"\s+content="https:\/\/barbeariasilverado.com.br\/([^"]+)"/,
  )?.[1]
  if (!og) falha('sem og:image')
  else if (!existsSync(path.join(DIST, og))) falha(`og:image /${og} não existe no dist`)

  const h1 = (corpo.match(/<h1[\s>]/g) ?? []).length
  if (h1 !== 1) falha(`${h1} <h1> no HTML (esperado 1, vindo do pré-render)`)

  for (const img of corpo.match(/<img\s[^>]*>/g) ?? [])
    if (!/\salt=/.test(img)) falha(`imagem sem alt: ${img.slice(0, 80)}`)

  for (const bloco of cabeca.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ??
    []) {
    let dado
    try {
      dado = JSON.parse(bloco.replace(/^<script[^>]*>|<\/script>$/g, ''))
    } catch {
      falha('JSON-LD inválido')
      continue
    }
    const existentes = ids(dado)
    for (const ref of referencias(dado))
      if (!existentes.has(ref)) falha(`JSON-LD aponta para ${ref}, que não existe nesta página`)
  }

  const visivel = corpo.replace(
    /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/g,
    ' ',
  )
  const metas = [titulo, ...(cabeca.match(/content="[^"]*"/g) ?? [])].join(' ')
  if (/[–—]/.test(visivel + metas)) falha('travessão (— ou –) no texto visível ou nos metadados')
}

if (!existsSync(path.join(DIST, 'llms-full.txt'))) erros.push('llms-full.txt não foi gerado')

for (const a of avisos) console.warn(`aviso: ${a}`)
if (erros.length) {
  for (const e of erros) console.error(`erro: ${e}`)
  process.exit(1)
}
console.log(`validar-seo: ${htmls(DIST).length} páginas conferidas, nenhum erro`)
