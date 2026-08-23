import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { BUSINESS } from '@/lib/business'

/**
 * Política de privacidade.
 *
 * O texto descreve o que o site realmente faz — que é quase nada: página
 * estática, sem formulário que salve dados, sem cookie próprio, sem analytics.
 * Documentar isso é mais útil (e mais defensável perante a LGPD) do que colar
 * um modelo genérico cheio de cláusulas sobre tratamentos que não existem.
 */
export function Privacy({ onBack }: { onBack: () => void }) {
  return (
    <main className="container-x py-24 sm:py-32">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-steel-500 uppercase transition-colors hover:text-steel-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
        Voltar ao site
      </button>

      <Logo variant="wordmark" className="mt-12 w-40" />

      <h1 className="mt-8 text-[clamp(2.2rem,6vw,3.75rem)] text-steel-100">Política de privacidade</h1>
      <p className="label-mono mt-4">Última atualização: agosto de 2026</p>

      <div className="mt-12 max-w-3xl space-y-10 text-steel-400">
        <section>
          <h2 className="text-2xl text-steel-100">1. Quem somos</h2>
          <p className="mt-4 leading-relaxed">
            Este site é mantido por {BUSINESS.legal.razaoSocial}, inscrita no CNPJ{' '}
            {BUSINESS.legal.cnpj} ({BUSINESS.legal.regime}), que atende sob o nome{' '}
            {BUSINESS.name}, na {BUSINESS.address.street}, {BUSINESS.address.district},{' '}
            {BUSINESS.address.city}/{BUSINESS.address.state}. Contato:{' '}
            <a href={`mailto:${BUSINESS.email}`} className="text-steel-200 underline underline-offset-4">
              {BUSINESS.email}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-steel-100">2. Quais dados coletamos</h2>
          <p className="mt-4 leading-relaxed">
            <strong className="text-steel-200">Nenhum.</strong> Este é um site estático: não há
            formulário que envie dados para nós, não há cadastro, não há área logada e não usamos
            cookies próprios nem ferramentas de análise de audiência.
          </p>
          <p className="mt-4 leading-relaxed">
            O que você digita no agendador (serviço, dia, horário, nome e observação) nunca sai do
            seu navegador. Esses campos só servem para montar o texto da mensagem; quando você
            toca em “Enviar pedido no WhatsApp”, é o seu próprio aplicativo que envia — não o site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-steel-100">3. Serviços de terceiros</h2>
          <ul className="mt-4 space-y-3 leading-relaxed">
            <li>
              <strong className="text-steel-200">WhatsApp (Meta).</strong> Ao clicar em qualquer
              botão de WhatsApp, você é levado ao aplicativo e passa a ser regido pela política de
              privacidade da Meta. A conversa fica registrada no aparelho do barbeiro, como qualquer
              conversa de WhatsApp.
            </li>
            <li>
              <strong className="text-steel-200">Google Maps.</strong> O mapa da página de
              localização só é carregado se você clicar em “Carregar mapa”. Antes disso, nenhuma
              requisição é feita ao Google. Ao carregá-lo, o Google poderá registrar seu IP,
              conforme a política de privacidade dele.
            </li>
            <li>
              <strong className="text-steel-200">Instagram (Meta).</strong> Os links levam ao perfil
              da barbearia; o site não embute conteúdo do Instagram nem carrega scripts dele.
            </li>
            <li>
              <strong className="text-steel-200">Hospedagem (Amazon Web Services).</strong> O site é
              servido por CloudFront/S3. Como qualquer servidor web, a AWS registra dados técnicos de
              acesso (IP, navegador, horário) para operação e segurança da rede.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-steel-100">4. Dados do atendimento</h2>
          <p className="mt-4 leading-relaxed">
            Os dados que você fornece pelo WhatsApp para marcar ou remarcar um horário (nome,
            telefone e preferências de corte) são usados apenas para prestar o serviço e organizar
            a agenda. Não são vendidos, alugados nem compartilhados com terceiros para publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-steel-100">5. Seus direitos</h2>
          <p className="mt-4 leading-relaxed">
            Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir a confirmação da
            existência de tratamento, o acesso, a correção ou a eliminação dos seus dados. Basta
            escrever para{' '}
            <a href={`mailto:${BUSINESS.email}`} className="text-steel-200 underline underline-offset-4">
              {BUSINESS.email}
            </a>{' '}
            ou falar com a barbearia pelo WhatsApp {BUSINESS.phoneDisplay}.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-steel-100">6. Alterações</h2>
          <p className="mt-4 leading-relaxed">
            Se esta política mudar, a data no topo é atualizada. O histórico completo de alterações
            fica público no repositório do site.
          </p>
        </section>
      </div>
    </main>
  )
}
