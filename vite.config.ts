import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { buildJsonLd } from './src/lib/seo.ts'
import { ROUTES, canonicalFor } from './src/lib/routes.ts'

/**
 * Injeta o JSON-LD no index.html em tempo de build.
 *
 * O schema é derivado de src/lib/business.ts — a mesma fonte que alimenta a
 * página —, então preço, horário e endereço não podem divergir entre o que o
 * visitante lê e o que o Google indexa. E como a injeção acontece no build, o
 * dado chega estático no HTML, sem depender de o crawler executar JavaScript.
 */
function jsonLdPlugin(): Plugin {
  return {
    name: 'silverado-jsonld',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(buildJsonLd()),
          injectTo: 'head',
        },
      ]
    },
  }
}


/**
 * Gera um HTML estático por rota, a partir do index.html já construído.
 *
 * Sem isto, /agendar e /loja seriam servidos com o mesmo `<head>` da home: o
 * mesmo título, a mesma description, a mesma canonical. Três consequências
 * concretas — o robô do Google Ads avalia a página de destino e veria conteúdo
 * genérico; o Search Console acusaria títulos duplicados; e o link colado no
 * WhatsApp mostraria a prévia errada.
 *
 * O truque é barato: o app continua sendo uma SPA (mesmo bundle, mesmo CSS),
 * só o `<head>` muda por arquivo. Cada rota vira `dist/<rota>/index.html`, e
 * uma CloudFront Function reescreve a URL sem extensão para esse caminho.
 */
function perRouteHtmlPlugin(): Plugin {
  return {
    name: 'silverado-rotas-estaticas',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') return
      const base = String(index.source)

      for (const route of ROUTES) {
        if (route.path === '/') continue

        const html = base
          .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
          .replace(
            /(<meta\s+name="description"\s+content=")[^"]*(")/,
            `$1${escapeHtml(route.description)}$2`,
          )
          .replace(
            /(<link rel="canonical" href=")[^"]*(")/,
            `$1${canonicalFor(route)}$2`,
          )
          .replace(
            /(<meta property="og:title" content=")[^"]*(")/,
            `$1${escapeHtml(route.title)}$2`,
          )
          .replace(
            /(<meta property="og:url" content=")[^"]*(")/,
            `$1${canonicalFor(route)}$2`,
          )
          .replace(
            /(<meta name="twitter:title" content=")[^"]*(")/,
            `$1${escapeHtml(route.title)}$2`,
          )
          // Dados estruturados próprios: trilha de navegação em todas as
          // rotas filhas, lista de produtos em /loja, ação de reserva em
          // /agendar. Sem isto as três páginas repetiriam o JSON-LD da home.
          .replace(
            /(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/,
            `$1${JSON.stringify(buildJsonLd(route.path))}$2`,
          )

        this.emitFile({
          type: 'asset',
          fileName: `${route.path.replace(/^\//, '')}/index.html`,
          source: html,
        })
      }
    },
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default defineConfig({
  plugins: [react(), tailwindcss(), jsonLdPlugin(), perRouteHtmlPlugin()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // O único chunk acima de 500 kB é o do three.js, e ele é carregado sob
    // demanda depois que a página já está interativa. O aviso padrão do Vite
    // aqui seria ruído — mas o teto continua existindo para pegar regressões.
    chunkSizeWarningLimit: 950,
    rollupOptions: {
      output: {
        // O three.js NÃO entra aqui de propósito.
        //
        // Declará-lo como manualChunk o promove a chunk compartilhado, e o Vite
        // passa a emitir <link rel="modulepreload"> para ele no index.html — ou
        // seja, os ~890 kB seriam baixados no primeiro paint, exatamente o que o
        // lazy import do Hero existe para evitar. Deixando o Rollup decidir, o
        // three fica dentro do chunk dinâmico do BladeScene e só é buscado quando
        // a cena é realmente montada.
        //
        // O gsap é o oposto: é usado pela navegação e pelas revelações desde o
        // primeiro quadro, então isolá-lo num chunk estável melhora o cache entre
        // deploys (ele muda muito menos que o código do site).
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'gsap'
        },
      },
    },
  },
})
