import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/business'

/**
 * Página de endereço inexistente.
 *
 * Antes, qualquer URL desconhecida caía na home com status 200 — o que o
 * Google classifica como *soft 404* e trata como sinal de site mal cuidado.
 * Agora a distribuição devolve 404 de verdade neste HTML, e ele traz
 * `noindex` no `<head>` (ver o plugin em vite.config.ts).
 *
 * Do lado de quem chegou aqui, o que importa é a saída: os dois caminhos que
 * resolvem o problema dele estão logo abaixo.
 */
export function NaoEncontrada({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <main id="conteudo" className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
      <Logo variant="mark" className="w-14 opacity-60" />

      <p className="label-mono mt-8">Erro 404</p>
      <h1 className="mt-4 text-[clamp(2.4rem,8vw,4.5rem)] text-steel-100">
        Esse endereço não existe
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-steel-400">
        O link pode ter mudado de lugar. A barbearia continua no mesmo — Avenida C-4, Jardim
        América.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => onNavigate('/agendar')} magnetic={false} external={false}>
          Agendar horário
          <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
        </Button>
        <Button
          href={whatsappUrl(WHATSAPP_DEFAULT_MESSAGE)}
          variant="outline"
          magnetic={false}
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
          Chamar no WhatsApp
        </Button>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="mt-8 font-mono text-[0.7rem] tracking-[0.18em] text-steel-500 uppercase transition-colors hover:text-steel-100"
      >
        Voltar para o início
      </button>
    </main>
  )
}
