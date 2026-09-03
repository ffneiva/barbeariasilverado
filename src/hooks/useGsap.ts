import { useEffect, type RefObject } from 'react'
import { conectarAoLenis } from './useSmoothScroll'

/**
 * Roda uma animação GSAP com a biblioteca carregada sob demanda.
 *
 * O GSAP é necessário para três coisas que só existem na home — o texto que
 * acende palavra a palavra, a galeria pinada com scroll horizontal e o
 * logotipo que cresce no fim. Nenhuma delas aparece em /agendar ou /loja, que
 * são destino de anúncio pago; importar a biblioteca de forma estática
 * obrigaria essas páginas a baixar 44 kB comprimidos antes do primeiro paint,
 * para nunca usar.
 *
 * O import mora aqui dentro para que o bundler o mantenha num chunk separado,
 * buscado só quando este efeito roda de verdade. E como o `gsap.context` é
 * criado depois de um `await`, o hook precisa lidar com desmontagem no meio do
 * caminho — daí a bandeira `cancelado`.
 */
type Contexto = { revert: () => void }

type GsapModule = typeof import('gsap')['default']

export function useGsap(
  /** Recebe o gsap já com o ScrollTrigger registrado. Deve criar os tweens. */
  criar: (gsap: GsapModule) => void,
  scope: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
  /** Quando falso, nada é carregado nem animado. */
  ativo = true,
) {
  useEffect(() => {
    if (!ativo) return

    let cancelado = false
    let ctx: Contexto | undefined

    let desconectar: (() => void) | undefined

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        if (cancelado) return
        gsap.registerPlugin(ScrollTrigger)

        // Sem isto, Lenis e ScrollTrigger leem a posição em quadros diferentes
        // e a galeria pinada treme meio pixel a cada rolagem. A conexão vive
        // aqui — e não no hook do scroll — para que páginas sem animação de
        // scroll nunca precisem carregar o GSAP.
        desconectar = conectarAoLenis(ScrollTrigger.update)
        gsap.ticker.lagSmoothing(0)

        // Fontes trocam depois do primeiro paint e mudam a altura dos títulos;
        // sem reancorar, todo gatilho de scroll dispara no lugar errado.
        if ('fonts' in document) document.fonts.ready.then(() => ScrollTrigger.refresh())

        ctx = gsap.context(() => criar(gsap), scope)
      },
    )

    return () => {
      cancelado = true
      desconectar?.()
      ctx?.revert()
    }
    // `criar` é recriada a cada render de propósito: as dependências reais são
    // declaradas por quem chama, em `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, ...deps])
}
