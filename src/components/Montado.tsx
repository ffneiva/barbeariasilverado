import { useLayoutEffect } from 'react'

/**
 * O HTML vem com o conteúdo da página gravado no build (scripts/prerender.mjs),
 * escondido por `#root[data-pre]` no CSS: ele existe para robôs que não rodam
 * JavaScript. O React substitui pelo conteúdo vivo e, já montado, tira o
 * atributo.
 */
export function Montado() {
  useLayoutEffect(() => {
    document.getElementById('root')?.removeAttribute('data-pre')
  }, [])
  return null
}
