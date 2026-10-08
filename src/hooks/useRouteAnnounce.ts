import { useEffect, useRef, useState } from 'react'
import type { Route } from '@/lib/routes'

/**
 * Anuncia a troca de rota e devolve o foco ao começo do conteúdo.
 *
 * Num site de várias páginas o navegador faz isso sozinho: recarrega, move o
 * foco para o topo e o leitor de tela lê o novo título. Com navegação pelo
 * cliente, nada disso acontece — o foco fica preso no link que a pessoa
 * acabou de acionar, dentro de um menu que já sumiu, e quem usa leitor de tela
 * não recebe nenhum sinal de que a página é outra.
 *
 * Duas correções, que é o padrão recomendado pelo WAI:
 *
 * · uma região `aria-live="polite"` recebe o nome da nova página;
 * · o foco vai para o container do conteúdo (com `tabIndex={-1}`), de onde a
 *   navegação por teclado recomeça na ordem certa.
 *
 * A primeira renderização é pulada de propósito: ali o navegador já fez o
 * trabalho, e roubar o foco na chegada seria pior do que não fazer nada.
 */
export function useRouteAnnounce(route: Route) {
  const alvoRef = useRef<HTMLDivElement>(null)
  const [aviso, setAviso] = useState('')
  const primeira = useRef(true)

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }

    // O título completo inclui a marca; para o anúncio basta a primeira parte.
    setAviso(`${route.title.split('·')[0].trim()} — página carregada`)
    alvoRef.current?.focus({ preventScroll: true })
  }, [route])

  return { alvoRef, aviso }
}
