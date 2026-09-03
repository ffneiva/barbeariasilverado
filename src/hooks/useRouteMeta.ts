import { useEffect } from 'react'
import { canonicalFor, type Route } from '@/lib/routes'
import { loadAds, trackConversion } from '@/lib/analytics'

/**
 * Mantém `<title>`, description e canonical em dia a cada troca de rota — e
 * dispara a conversão do Google Ads daquela rota.
 *
 * Num site de várias páginas isso viria de graça do servidor. Aqui a navegação
 * é do cliente, então o `<head>` precisa ser atualizado na mão: sem isso, quem
 * chega em /loja pela navegação interna compartilharia o link com o título da
 * home. O HTML inicial de cada rota já vem correto do build (ver o plugin em
 * vite.config.ts); este hook cobre as navegações que acontecem depois.
 */
function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

export function useRouteMeta(route: Route) {
  // A tag do Ads é carregada uma vez, quando a página fica ociosa.
  useEffect(() => {
    loadAds()
  }, [])

  useEffect(() => {
    document.title = route.title
    setMeta('meta[name="description"]', 'content', route.description)
    setMeta('link[rel="canonical"]', 'href', canonicalFor(route))
    setMeta('meta[property="og:title"]', 'content', route.title)
    setMeta('meta[property="og:description"]', 'content', route.description)
    setMeta('meta[property="og:url"]', 'content', canonicalFor(route))
    setMeta('meta[name="twitter:title"]', 'content', route.title)
    setMeta('meta[name="twitter:description"]', 'content', route.description)

    trackConversion(route.adsConversion)
  }, [route])
}
