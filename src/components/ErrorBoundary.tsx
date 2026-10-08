import { Component, type ErrorInfo, type ReactNode } from 'react'
import { BUSINESS, whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'

/**
 * Último recurso quando um componente quebra em produção.
 *
 * Sem isto, um erro de render em qualquer lugar da árvore deixa a página em
 * branco — e a pessoa que chegou por um anúncio pago vê um retângulo preto e
 * vai embora. O prejuízo não é o bug: é o clique já comprado.
 *
 * A tela de contingência não tenta consertar nada nem pedir desculpas em três
 * parágrafos. Ela entrega o que o visitante veio buscar: telefone, WhatsApp,
 * endereço e horário. São dados estáticos, importados de um módulo sem
 * dependência de UI, então é improvável que o próprio fallback quebre junto.
 */
type Props = { children: ReactNode }
type State = { erro: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // Sem serviço de monitoramento contratado, o console é o que há — e é
    // onde alguém vai olhar ao receber a reclamação.
    console.error('[Silverado] erro de render:', erro, info.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-20 text-center">
        <div>
          <p className="font-mono text-[0.7rem] tracking-[0.22em] text-steel-600 uppercase">
            Barbearia Silverado
          </p>
          <h1 className="mt-4 font-display text-4xl text-steel-100 uppercase sm:text-5xl">
            O site deu um nó
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-steel-400">
            Alguma coisa quebrou por aqui. O atendimento continua normal — é só chamar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)}
            className="rounded-full bg-steel-100 px-7 py-3.5 font-mono text-[0.75rem] tracking-[0.16em] text-void uppercase"
          >
            Chamar no WhatsApp
          </a>
          <a
            href={`tel:+${BUSINESS.whatsapp}`}
            className="rounded-full border border-steel-700 px-7 py-3.5 font-mono text-[0.75rem] tracking-[0.16em] text-steel-200 uppercase"
          >
            {BUSINESS.phoneDisplay}
          </a>
        </div>

        <address className="text-sm text-steel-500 not-italic">
          {BUSINESS.address.street}
          <br />
          {BUSINESS.address.district} · {BUSINESS.address.city}/{BUSINESS.address.state}
          <br />
          <span className="text-steel-600">Seg a sex 9h–20h · Sáb 9h–19h</span>
        </address>
      </main>
    )
  }
}
