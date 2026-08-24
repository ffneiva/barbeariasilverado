# Deploy

Runbook da infraestrutura do site da Barbearia Silverado.

- **Produção:** https://barbeariasilverado.com.br
- **Origem:** S3 privado + CloudFront (Origin Access Control)
- **CI/CD:** GitHub Actions com OIDC — nenhum segredo de longa duração

---

## Dia a dia

```bash
git push origin main
```

É isso. O workflow [`deploy.yml`](.github/workflows/deploy.yml) roda lint,
type-check, build, sobe para o S3, invalida o CloudFront e confere se o site
respondeu `200` antes de marcar o job como verde.

O `concurrency` está configurado para cancelar deploys em andamento: se dois
commits caírem juntos, só interessa o estado final.

### Mudar um preço, horário ou texto

Tudo vive em [`src/lib/business.ts`](src/lib/business.ts). Edite, commite,
pronto — a página, o JSON-LD do Google e a mensagem do WhatsApp saem todos
daquele arquivo.

### Trocar uma foto de corte

1. Substitua o arquivo em `assets-src/` mantendo o nome (`corte-degrade.jpg`…).
2. `npm run assets` — regenera AVIF/WebP/JPEG e o manifest com o placeholder.
3. Commite `assets-src/`, `public/images/` e `src/lib/image-manifest.json`.

---

## Provisionamento inicial

Só precisa ser feito uma vez. Requer AWS CLI v2 autenticado com permissão de
S3, CloudFront, ACM e IAM.

```bash
chmod +x scripts/*.sh
./scripts/aws-setup.sh
```

O script é idempotente — pode ser rodado de novo sem duplicar recursos. Ele cria:

| # | Recurso | Papel |
|---|---------|-------|
| 1 | Bucket S3 privado | guarda os arquivos; sem acesso público, criptografado (SSE-S3) |
| 2 | Certificado ACM (us-east-1) | TLS do domínio — precisa estar nessa região para o CloudFront aceitar |
| 3 | Origin Access Control | faz o S3 responder só ao CloudFront |
| 4 | CloudFront Function | 301 de `www` para o domínio raiz, na borda |
| 5 | Response Headers Policy | HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy` |
| 6 | Distribuição CloudFront | a CDN (HTTP/3, Brotli, `PriceClass_All`) |
| 7 | Bucket policy | fecha o S3 para tudo que não seja aquela distribuição |
| 8 | OIDC provider + IAM role | deixa o GitHub Actions assumir credenciais temporárias |

Ao final, um resumo com todos os IDs é impresso e salvo em `DEPLOY-SECRETS.txt`
(que está no `.gitignore` — este repositório é público).

> **Nota:** enquanto o certificado ACM não é emitido, a distribuição sobe **sem
> domínio associado**, funcionando no endereço `*.cloudfront.net`. O site já
> fica no ar; o domínio entra depois, sem recriar nada.

---

## Configurar o GitHub

`Settings → Secrets and variables → Actions → aba Variables`:

| Variável | Valor |
|----------|-------|
| `AWS_REGION` | `us-east-2` |
| `AWS_ROLE_ARN` | ARN da role impresso pelo `aws-setup.sh` |
| `S3_BUCKET_NAME` | `barbeariasilverado-site-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID impresso pelo `aws-setup.sh` |

**Nenhum Secret é necessário.** O deploy usa OIDC: a Action apresenta um token
assinado pelo GitHub, o STS valida a trust policy
(`repo:ffneiva/barbeariasilverado:ref:refs/heads/main`) e devolve credenciais
que expiram em uma hora.

Se o workflow usa um GitHub Environment chamado `production`, crie-o em
`Settings → Environments` — ou remova o bloco `environment:` do YAML.

---

## Configurar o DNS no Cloudflare

### 1. Validar o certificado

O `aws-setup.sh` imprime dois CNAMEs de validação (um para o domínio raiz, um
para o `www`). Crie os dois na zona do Cloudflare com a **nuvem cinza
(DNS only)**.

> Proxiados (nuvem laranja), o Cloudflare responde no lugar do registro e a
> validação nunca conclui.

Acompanhe:

```bash
aws acm describe-certificate \
  --certificate-arn <ARN> --region us-east-1 \
  --query Certificate.Status --output text
```

### 2. Anexar o domínio à distribuição

Assim que o status virar `ISSUED`:

```bash
./scripts/aws-attach-domain.sh
```

O script lê a configuração atual da distribuição, troca apenas `Aliases` e
`ViewerCertificate` e devolve o resto intacto — cache policy, function
association e error responses continuam como estão.

### 3. Apontar o tráfego

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| CNAME | `@` | `<distribuição>.cloudfront.net` | DNS only (cinza) |
| CNAME | `www` | `<distribuição>.cloudfront.net` | DNS only (cinza) |

O Cloudflare achata o CNAME na raiz automaticamente (*CNAME flattening*), então
não é preciso registro `A`.

**Por que DNS only:** com o proxy ligado, o Cloudflare termina o TLS e
reencaminha ao CloudFront. Se o modo SSL/TLS não estiver em **Full (strict)**,
isso vira um laço de redirecionamento. Cinza funciona de primeira — e não se
perde nada, porque o CloudFront já é a CDN.

Se preferir manter o proxy do Cloudflare ligado, é obrigatório:
`SSL/TLS → Overview → Full (strict)`.

---

## Cache

| Caminho | `Cache-Control` | Motivo |
|---------|-----------------|--------|
| `/assets/*` | `max-age=31536000, immutable` | nome contém hash do conteúdo |
| `/fonts/*`, `/images/*` | `max-age=31536000, immutable` | trocados junto com uma invalidação |
| `/index.html` | `no-cache, must-revalidate` | referencia os assets com hash |
| `robots.txt`, `sitemap.xml` | `max-age=3600` | mudam raramente, mas precisam propagar |
| `site.webmanifest` | `max-age=86400` | idem |

O workflow faz uma segunda passada corrigindo o `Content-Type` de `.webp` e
`.woff2` — o AWS CLI adivinha o tipo pelo `mimetypes` do Python, que não conhece
esses dois, e sem isso eles subiriam como `binary/octet-stream`.

---

## Rotas da SPA

A distribuição mapeia `403` e `404` para `/index.html` com status `200`, o que
faz `/politica-de-privacidade` funcionar quando digitado direto na barra de
endereços. O roteador do site (~20 linhas sobre a History API, em
[`src/App.tsx`](src/App.tsx)) assume dali.

---

## Verificações rápidas

```bash
# O site responde?
curl -s -o /dev/null -w "%{http_code}\n" https://barbeariasilverado.com.br/

# Cabeçalhos de segurança
curl -sI https://barbeariasilverado.com.br/ | grep -iE "strict-transport|content-security|x-content-type"

# Compressão
curl -sI -H "Accept-Encoding: br" https://barbeariasilverado.com.br/ | grep -i content-encoding

# Rota da SPA
curl -s -o /dev/null -w "%{http_code}\n" https://barbeariasilverado.com.br/politica-de-privacidade

# Redirect do www
curl -sI https://www.barbeariasilverado.com.br/ | grep -iE "^HTTP|location"
```

---

## Quando algo dá errado

**O deploy passou mas o site continua velho.**
A invalidação do CloudFront é assíncrona; o workflow já espera ela terminar. Se
ainda assim persistir, é cache do navegador — teste em janela anônima.

**`403` no site inteiro.**
Bucket policy provavelmente aponta para a distribuição errada. Confira que o
`AWS:SourceArn` da policy bate com o ARN da distribuição em uso.

**A Action falha com "Not authorized to perform sts:AssumeRoleWithWebIdentity".**

A mensagem não diz o motivo, mas o CloudTrail diz. O `sub` que o GitHub
realmente apresentou fica no campo `userIdentity.userName` do evento:

```bash
aws cloudtrail lookup-events --region us-east-2   --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity   --max-results 5 --output json   | python -c "import sys,json;[print(json.loads(e['CloudTrailEvent'])['userIdentity'].get('userName')) for e in json.load(sys.stdin)['Events']]"
```

Compare o resultado com a `StringLike` da trust policy. Duas armadilhas comuns:

1. **`:environment:` e não `:ref:`.** Quando o job declara `environment:`, o
   subject vira `repo:owner/repo:environment:production`. Uma policy que só
   aceita a forma de branch rejeita tudo.
2. **Subject imutável.** O GitHub também emite
   `repo:owner@<ownerId>/repo@<repoId>:...`, com IDs numéricos. Foi o caso
   aqui. A policy aceita os dois formatos.

O ID do **repositório** entra na policy como curinga (`barbeariasilverado@*`),
enquanto o ID do **dono** fica fixo. Motivo: se o repositório for apagado e
recriado, ele ganha um ID novo e um subject pinado deixaria o deploy morto sem
explicação. Pinar o dono e o nome já fecha o acesso — ninguém além da conta
95257914 consegue ter um repositório com esse nome.

**O certificado não sai de `PENDING_VALIDATION`.**
Quase sempre é o CNAME de validação proxiado no Cloudflare. Coloque a nuvem
cinza e aguarde.

---

## Custo

S3 (~8 MB) mais CloudFront dentro do free tier perpétuo (1 TB de transferência e
10 milhões de requisições por mês). ACM é gratuito. GitHub Actions é gratuito em
repositório público. Na prática, o único custo recorrente é o registro do
domínio `.com.br`.
