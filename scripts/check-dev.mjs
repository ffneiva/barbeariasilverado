/**
 * Smoke test do servidor de desenvolvimento.
 *
 * `vite build` e `vite dev` resolvem módulos por caminhos diferentes: o build
 * passa pelo bundler, o dev pelo servidor de transformação sob demanda. Dá para
 * ter um build verde e um `npm run dev` que quebra no primeiro import — foi
 * exatamente o que aconteceu aqui, com um "Failed to resolve import
 * @/components/Preloader" que nenhuma das outras verificações pegava.
 *
 * Este script sobe o dev server de verdade, pede a página e o módulo de
 * entrada, e falha se qualquer import ficar sem resolver.
 *
 *   npm run check:dev
 */
import { createServer } from 'vite'

const ENTRY = '/src/main.tsx'
const PORT = 5199

/** Módulos que precisam necessariamente aparecer resolvidos no grafo. */
const MUST_RESOLVE = [
  '/src/App.tsx',
  '/src/components/Preloader.tsx',
  '/src/sections/Hero.tsx',
  '/src/lib/business.ts',
]

let fails = 0
function check(name, ok, detail = '') {
  if (!ok) fails++
  console.log(`${ok ? '  ok ' : 'FALHA'}  ${name}`)
  if (!ok && detail) console.log(`         ${detail}`)
}

const server = await createServer({
  server: { port: PORT, strictPort: true, host: '127.0.0.1' },
  logLevel: 'error',
})

try {
  await server.listen()
  const base = `http://127.0.0.1:${PORT}`
  console.log('\n── servidor de desenvolvimento ──────────────────────────')

  const html = await fetch(`${base}/`)
  check('GET / responde 200', html.status === 200, `veio ${html.status}`)
  const body = await html.text()
  check('HTML traz o script de entrada', body.includes(ENTRY))

  // Transforma o grafo a partir da entrada. É aqui que um alias quebrado
  // aparece: o Vite responde com um erro de import-analysis, não com 404.
  const seen = new Set()
  const queue = [ENTRY]

  while (queue.length) {
    const url = queue.shift()
    if (seen.has(url)) continue
    seen.add(url)

    const res = await fetch(base + url)
    if (res.status !== 200) {
      check(`${url} responde 200`, false, `veio ${res.status}`)
      continue
    }

    const code = await res.text()
    if (/Failed to resolve import/.test(code)) {
      check(`${url} sem import quebrado`, false, code.slice(0, 300))
      continue
    }

    // Segue só os módulos do próprio projeto; node_modules não interessa aqui.
    for (const m of code.matchAll(/from\s+"(\/src\/[^"]+)"/g)) {
      queue.push(m[1].split('?')[0])
    }
  }

  check(`grafo transformado sem erros (${seen.size} módulos)`, true)

  for (const mod of MUST_RESOLVE) {
    check(`${mod} está no grafo`, seen.has(mod), 'não foi alcançado a partir da entrada')
  }
} finally {
  await server.close()
}

console.log('')
console.log(fails === 0 ? '✅ O dev server sobe e resolve tudo.' : `❌ ${fails} verificação(ões) falharam.`)
process.exit(fails === 0 ? 0 : 1)
