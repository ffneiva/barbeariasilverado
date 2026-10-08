import { useEffect, useRef, useState } from 'react'

/**
 * Leitura de scroll sem GSAP.
 *
 * O ScrollTrigger era usado aqui para três coisas triviais — o fundo do
 * cabeçalho, a barra de progresso e o botão flutuante do WhatsApp. Nenhuma
 * precisa de linha do tempo, easing ou pin; todas são "onde está a página
 * agora?". Um listener passivo com throttle de quadro faz o mesmo e não
 * obriga /agendar e /loja a baixar uma biblioteca de animação inteira.
 *
 * O throttle por `requestAnimationFrame` importa: o evento de scroll dispara
 * dezenas de vezes por quadro em trackpad, e escrever no DOM em cada um deles
 * é a receita clássica de scroll travado.
 */
function onScrollFrame(handler: () => void): () => void {
  let agendado = false

  const disparar = () => {
    if (agendado) return
    agendado = true
    requestAnimationFrame(() => {
      agendado = false
      handler()
    })
  }

  window.addEventListener('scroll', disparar, { passive: true })
  window.addEventListener('resize', disparar, { passive: true })
  handler() // estado inicial, sem esperar o primeiro scroll
  return () => {
    window.removeEventListener('scroll', disparar)
    window.removeEventListener('resize', disparar)
  }
}

/** `true` depois que a página passa de `limite` pixels do topo. */
export function useScrolledPast(limite: number): boolean {
  const [passou, setPassou] = useState(false)

  useEffect(() => {
    return onScrollFrame(() => setPassou(window.scrollY > limite))
  }, [limite])

  return passou
}

/**
 * Progresso de leitura da página, de 0 a 1, escrito direto no elemento.
 *
 * Devolve uma ref em vez de estado: atualizar estado a cada quadro de scroll
 * re-renderizaria a árvore inteira sessenta vezes por segundo para mexer numa
 * transformação. Escrever no `style` do nó pula o React e vai direto ao
 * compositor.
 */
export function useScrollProgressRef<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    return onScrollFrame(() => {
      const rolavel = document.documentElement.scrollHeight - window.innerHeight
      const progresso = rolavel > 0 ? Math.min(1, Math.max(0, window.scrollY / rolavel)) : 0
      el.style.transform = `scaleX(${progresso})`
    })
  }, [])

  return ref
}
