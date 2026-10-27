# SEO, GEO e AEO da Barbearia Silverado

Objetivo: aparecer quando alguém procura barbearia no Jardim América (Google,
Google Maps) e quando pergunta a um assistente de IA (ChatGPT, Gemini,
Perplexity, Claude, Copilot) por uma barbearia em Goiânia.

## O que está no site

- **Conteúdo no HTML.** Cada página é pré-renderizada no build
  (`scripts/prerender.mjs`, Chromium): o texto vai no HTML, porque robôs de IA
  não executam JavaScript. Antes, o corpo era vazio para eles.
- **Páginas que respondem perguntas.**
  - 12 serviços em `/servicos/<serviço>`, com preço, duração, como é feito e perguntas.
  - 9 cortes em `/cortes/<corte>`, com foto.
  - `/servicos`, `/cortes` e `/perguntas-frequentes`.
  - O conteúdo sai de `src/lib/paginas.ts` e de `business.ts`. Preço e horário vêm de uma fonte só.
- **Dados estruturados (`src/lib/seo.ts`).**
  - `HairSalon` com endereço, coordenadas, horário, faixa de preço, pagamento, `sameAs` (Instagram, Threads e perfil do Google) e catálogo de serviços.
  - Por página: `Service` com `Offer`, `FAQPage` (só onde as perguntas aparecem na tela), `ImageObject`, `BreadcrumbList` e `WebPage`.
  - Avaliações do Google NÃO são marcadas: é proibido republicar como dado estruturado.
- **Para assistentes de IA.**
  - `/llms.txt` (resumo) e `/llms-full.txt` (tudo por extenso), gerados no build.
  - `robots.txt` libera GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended e outros, e bloqueia `/painel/`.
- **Prévias.** Título, descrição e imagem próprios em cada página: WhatsApp, Instagram e Google.
- **Sitemap** gerado das rotas, com `lastmod` do último commit.
- **IndexNow.** Chave em `public/e85b8f0df860ea9d95cebf836dd9472b.txt`. Script em `D:\dev\LP\_infra-sites\indexnow-silverado.sh`.

## Como manter

```bash
npm run build      # tsc + vite + pré-render + validar-seo (falha se algo quebrar)
git push origin main   # publica (GitHub Actions → S3 + CloudFront)
bash ../_infra-sites/indexnow-silverado.sh   # avisa Bing/IndexNow das páginas
```

- **Mudou preço, horário ou texto?** Edite só `src/lib/business.ts`: a página, o JSON-LD, o `llms.txt` e as perguntas acompanham.
- **Serviço novo?** Entre em `SERVICES` e acrescente um texto em `DETALHE` (`src/lib/paginas.ts`). A página nova nasce sozinha.
- **O que `scripts/validar-seo.mjs` barra:** mais de um `h1`, título acima de 60 caracteres, descrição fora de 50 a 160, canonical ausente, `og:image` inexistente, imagem sem `alt`, JSON-LD quebrado e travessão.

## O que só a barbearia pode fazer (pesa mais que o site)

### Agora

1. **Perfil da Empresa no Google (Google Meu Negócio).**
   - Categoria principal "Barbearia". Adicionais: "Salão de cabeleireiro masculino" e "Serviço de barbearia".
   - Horário igual ao do site.
   - Link do site com UTM, para o painel separar quem vem do perfil:
     `https://barbeariasilverado.com.br/?utm_source=google&utm_medium=organic&utm_campaign=perfil-google`
   - Link de agendamento: `https://barbeariasilverado.com.br/agendar?utm_source=google&utm_medium=organic&utm_campaign=perfil-google-agendar`
2. **Serviços e produtos no Perfil**, com os mesmos nomes e preços do site.
3. **Bing Places e Bing Webmaster Tools.** Importam do Google em minutos. O Bing alimenta o ChatGPT e o Copilot.
4. **Apple Business Connect** (Mapas do iPhone).

### Toda semana

- **Pedir avaliação no Google depois do corte.** Um link curto no WhatsApp, e responder todas as avaliações.
  - Avaliação com o serviço e o bairro no texto ("degradê no Jardim América") é o que mais pesa no Maps.
- **Fotos novas no Perfil:** cortes, fachada, ambiente.
- **Uma postagem no Perfil.** Pode ser a mesma do Instagram, com link para a página do serviço.

### Sempre

- **Mesmo nome, endereço e telefone** em todo lugar: Instagram, Google, Bing, Apple, WhatsApp Business.
- **Bio do Instagram com o link do site** com UTM: `?utm_source=instagram&utm_medium=bio`.

## Ideias de próximas páginas

- Equipe: cada barbeiro com foto e especialidade (precisa de nomes e fotos reais).
- Antes e depois por corte (precisa de fotos com autorização).
- Bairros vizinhos: só com conteúdo real (trajeto, referência). Página de bairro vazia é penalizada.
