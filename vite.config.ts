import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { buildJsonLd } from './src/lib/seo.ts'

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

export default defineConfig({
  plugins: [react(), tailwindcss(), jsonLdPlugin()],
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
