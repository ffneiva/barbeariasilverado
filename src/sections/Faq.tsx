import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Section, SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { FAQ, whatsappUrl } from '@/lib/business'
import { cn } from '@/lib/utils'

/**
 * Acordeão de dúvidas.
 *
 * A altura anima via `grid-template-rows: 0fr → 1fr`, que dá transição suave
 * sem precisar medir o conteúdo em JS (o velho truque do `max-height` chutado
 * sempre erra em texto que quebra em número diferente de linhas).
 *
 * O mesmo conteúdo é publicado como `FAQPage` no JSON-LD (ver lib/seo).
 */
export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <Section id="duvidas">
      <div className="container-x grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <SectionHeading eyebrow="06 — Dúvidas" title="Antes de você perguntar" />
          <Reveal delay={0.1}>
            <a
              href={whatsappUrl('Olá! Tenho uma dúvida sobre os serviços da Silverado.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block text-sm text-steel-400 underline decoration-steel-800 underline-offset-4 transition-colors hover:text-steel-100 hover:decoration-steel-400"
            >
              Não achou sua dúvida? Pergunte no WhatsApp →
            </a>
          </Reveal>
        </div>

        <ul className="divide-y divide-steel-900 border-y border-steel-900">
          {FAQ.map((item, i) => {
            const open = openIndex === i
            return (
              <li key={item.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-start justify-between gap-6 py-6 text-left"
                  >
                    <span
                      className={cn(
                        'font-sans text-base leading-snug font-medium normal-case transition-colors duration-300 sm:text-lg',
                        open ? 'text-steel-50' : 'text-steel-300',
                      )}
                    >
                      {item.q}
                    </span>
                    <Plus
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0 text-steel-600 transition-transform duration-500 ease-[var(--ease-blade)]',
                        open && 'rotate-45 text-steel-200',
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                </h3>

                <div
                  id={`faq-panel-${i}`}
                  className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-blade)]"
                  style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="pr-12 pb-6 text-sm leading-relaxed text-steel-400">{item.a}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}
