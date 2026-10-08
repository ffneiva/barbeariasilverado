import { CONVERSIONS, trackConversion, trackEvent } from './analytics'
import { trackMeta } from './meta'

/**
 * Um único observador de cliques, dois destinos.
 *
 * O site tem mais de vinte links de WhatsApp espalhados por seções, cards de
 * serviço, cards de produto, galeria e rodapé — e vai ganhar mais. Um
 * `addEventListener` no documento pega todos, inclusive os que ainda nem foram
 * escritos, e não deixa nenhum de fora por esquecimento.
 *
 * Google e Meta saem do mesmo lugar de propósito. Dois listeners independentes
 * divergiriam na primeira vez que alguém acrescentasse um caso a um só deles, e
 * o sintoma seria uma plataforma medindo mais conversões que a outra sem
 * explicação aparente.
 *
 * Roda na fase de captura, para acontecer antes de qualquer `preventDefault`, e
 * usa `closest` para funcionar quando o clique cai num ícone dentro do link.
 */
export function watchOutboundClicks(): () => void {
  const onClick = (event: MouseEvent) => {
    const alvo = event.target as HTMLElement | null
    const link = alvo?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!link) return

    const href = link.getAttribute('href') ?? ''

    if (href.includes('wa.me') || href.includes('api.whatsapp.com')) {
      // O contexto separa "clicou no botão do topo" de "mandou o pedido montado
      // no agendador" quando o relatório for lido depois.
      const contexto = link.dataset.track ?? 'link'
      const agendamento = contexto === 'agendamento'

      trackConversion(CONVERSIONS.whatsapp)
      trackEvent('contato_whatsapp', { contexto })

      // `Schedule` é o evento padrão da Meta para "marcou um horário", e
      // `Contact` para "iniciou contato". A distinção importa: o pedido saindo
      // do agendador já tem serviço, dia e hora escolhidos, e vale muito mais
      // como sinal de otimização que um clique no botão do topo.
      trackMeta(agendamento ? 'Schedule' : 'Contact', { contexto })

      if (agendamento) trackConversion(CONVERSIONS.agendamento)
      return
    }

    if (href.startsWith('tel:')) {
      trackConversion(CONVERSIONS.telefone)
      trackEvent('contato_telefone')
      trackMeta('Contact', { contexto: 'telefone' })
      return
    }

    // Quem pede a rota está decidindo ir até lá. Para barbearia de bairro isso
    // é sinal de intenção tão bom quanto o clique no WhatsApp, e a Meta tem
    // evento padrão para exatamente isso.
    if (href.includes('google.com/maps') || href.includes('maps.google.com')) {
      trackEvent('abrir_mapa')
      trackMeta('FindLocation')
    }
  }

  document.addEventListener('click', onClick, { capture: true })
  return () => document.removeEventListener('click', onClick, { capture: true })
}
