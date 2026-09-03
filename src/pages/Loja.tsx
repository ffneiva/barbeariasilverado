import { ArrowRight, MapPin, MessageCircle } from 'lucide-react'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { Button } from '@/components/Button'
import { Products } from '@/sections/Products'
import { BUSINESS, PRODUCTS, whatsappUrl } from '@/lib/business'

/**
 * Página dedicada da loja — o outro destino de anúncio.
 *
 * A prateleira é a mesma da landing page; o que muda é a moldura. O bloco do
 * fim responde a pergunta que um anúncio de produto sempre gera: "compro
 * como?". A resposta honesta é que não há carrinho — o produto sai no balcão
 * ou é reservado pelo WhatsApp —, e é melhor dizer isso do que deixar a pessoa
 * procurando um botão de comprar que não existe.
 */
export function Loja({ onNavigate }: { onNavigate: (path: string) => void }) {
  const menorPreco = Math.min(...PRODUCTS.map((p) => p.price))
  const maiorPreco = Math.max(...PRODUCTS.map((p) => p.price))

  return (
    <main id="conteudo">
      <PageHero
        eyebrow="Barbearia Silverado · Jardim América, Goiânia"
        title="A loja da Silverado"
        lead={
          <>
            Pomada, minoxidil manipulado, derma roller e óleo de barba — os mesmos produtos que o
            barbeiro usa na cadeira, de R$ {menorPreco} a R$ {maiorPreco}. Preço fechado, sem
            pacote e sem mensalidade.
          </>
        }
        showStatus={false}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            href={whatsappUrl('Olá! Queria saber se tem produto em estoque na Silverado.')}
            size="lg"
            magnetic={false}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
            Perguntar estoque
          </Button>
          <Button href={BUSINESS.mapsLink} variant="outline" size="lg" magnetic={false}>
            <MapPin className="h-4 w-4" strokeWidth={1.6} />
            Como chegar
          </Button>
        </div>
      </PageHero>

      <Products showHeading={false} />

      <section className="pb-20 sm:pb-28">
        <div className="container-x">
          <Reveal className="border border-steel-800 bg-white/[0.02] p-7 sm:p-10">
            <span className="label-mono">Como comprar</span>
            <h2 className="mt-4 max-w-2xl text-3xl text-steel-100 sm:text-4xl">
              Não tem carrinho — tem balcão
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-steel-400">
              Os produtos saem na hora do atendimento, sem precisar agendar nada a mais. Se quiser
              garantir que o seu está em estoque antes de vir, mande uma mensagem: o barbeiro
              confirma e separa. Retirada no {BUSINESS.address.street}, {BUSINESS.address.district}.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={() => onNavigate('/agendar')}
                magnetic={false}
                external={false}
              >
                Agendar um horário
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
              </Button>
              <Button
                onClick={() => onNavigate('/')}
                variant="outline"
                magnetic={false}
                external={false}
              >
                Ver o site completo
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
