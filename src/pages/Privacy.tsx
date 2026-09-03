import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { BUSINESS } from '@/lib/business'

/**
 * Política de privacidade.
 *
 * O texto descreve o que o site realmente faz, e só isso: página estática, sem
 * formulário que salve dados e sem cookie próprio — mas COM a tag do Google
 * Ads, que grava cookie de terceiro e é a única coleta que existe aqui.
 *
 * Descrever o tratamento real é mais útil (e mais defensável perante a LGPD)
 * do que colar um modelo genérico. E é por isso que este arquivo precisa ser
 * revisado toda vez que uma ferramenta de terceiro entra no site: a versão
 * anterior dizia "não usamos ferramentas de análise", o que deixou de ser
 * verdade no minuto em que a tag do Ads foi adicionada.
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
      <p className="label-mono mt-4">Última atualização: setembro de 2026</p>

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
            <strong className="text-steel-200">Nós, diretamente, nenhum.</strong> Este é um site
            estático: não há formulário que envie dados para nós, não há cadastro, não há área
            logada e não usamos cookies próprios.
          </p>
          <p className="mt-4 leading-relaxed">
            Existe, porém, uma exceção que precisa ficar clara: o site carrega a{' '}
            <strong className="text-steel-200">tag do Google Ads</strong>, usada para medir se
            quem clicou num anúncio da barbearia chegou até aqui. Ela grava cookies do Google no
            seu navegador e informa ao Google a página visitada, a data e o horário. Os detalhes
            estão na seção seguinte.
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
              <strong className="text-steel-200">Google Maps.</strong> A seção de localização
              embute um mapa do Google. Ele é carregado de forma preguiçosa — só quando você
              rola até ele —, mas a partir daí o Google poderá registrar seu IP e seus dados
              de navegação, conforme a política de privacidade dele.
            </li>
            <li>
              <strong className="text-steel-200">Google Ads.</strong> A barbearia anuncia no
              Google, e a tag de conversão (<code className="text-steel-300">gtag.js</code>)
              registra que uma visita chegou a esta página. Isso permite ao Google atribuir a
              visita a um anúncio e cobrar corretamente por ela. A tag grava cookies do Google e
              pode ser usada para publicidade personalizada. Você pode desativar a personalização
              de anúncios em{' '}
              <a
                href="https://myadcenter.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-steel-200 underline underline-offset-4"
              >
                myadcenter.google.com
              </a>
              , ou bloquear cookies de terceiros nas configurações do seu navegador — o site
              continua funcionando igual.
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
