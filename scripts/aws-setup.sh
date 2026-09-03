#!/usr/bin/env bash
# =============================================================================
#  Barbearia Silverado — provisionamento da infraestrutura AWS
# =============================================================================
#
#  Cria (de forma idempotente — pode rodar de novo sem quebrar nada):
#
#    1. Bucket S3 privado                         — os arquivos do site
#    2. Certificado ACM em us-east-1              — TLS para o domínio
#    3. Origin Access Control                     — S3 só responde ao CloudFront
#    4. CloudFront Function                       — 301 de www → domínio raiz
#    5. Response Headers Policy                   — HSTS, CSP, X-Content-Type…
#    6. Distribuição CloudFront                   — a CDN em si
#    7. Bucket policy                             — fecha o S3 para o resto do mundo
#    8. OIDC provider + IAM role para o GitHub    — deploy sem chave de acesso
#
#  Por que OIDC e não um usuário IAM com access key: este repositório é público
#  e o deploy roda no GitHub Actions. Com OIDC, a Action troca um token de curta
#  duração emitido pelo próprio GitHub por credenciais temporárias da AWS — não
#  existe segredo permanente para vazar, nem em disco nem em Secrets.
#
#  Pré-requisitos: AWS CLI v2 autenticado com permissão de S3, CloudFront, ACM e IAM.
#
#  Uso:
#    chmod +x scripts/aws-setup.sh
#    ./scripts/aws-setup.sh
# =============================================================================
set -euo pipefail

# ── Parâmetros ───────────────────────────────────────────────────────────────
DOMAIN="barbeariasilverado.com.br"
WWW_DOMAIN="www.${DOMAIN}"
BUCKET="barbeariasilverado-site-prod"
REGION="us-east-2"          # bucket e tags
CERT_REGION="us-east-1"     # obrigatório para CloudFront
PROJECT="Freelance"
GITHUB_REPO="ffneiva/barbeariasilverado"
ROLE_NAME="barbeariasilverado-github-deployer"
POLICY_NAME="barbeariasilverado-deploy"
OUT_FILE="./DEPLOY-SECRETS.txt"   # está no .gitignore

# ── Saída ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
die()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

command -v aws >/dev/null || die "AWS CLI não encontrado."
command -v python3 >/dev/null || command -v python >/dev/null || die "Python 3 não encontrado."
PY=$(command -v python3 || command -v python)

# Arquivos temporários ficam no próprio repositório, e não em /tmp.
# Motivo: no Git Bash do Windows o "/tmp" do shell não é o mesmo caminho que
# o AWS CLI nativo enxerga — `fileb:///tmp/x` vira `C:\tmp\x` e falha.
# Um caminho relativo funciona nos dois mundos.
TMP_DIR=".aws-tmp"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Barbearia Silverado — AWS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
info "Conta AWS : $ACCOUNT_ID"
info "Domínio   : $DOMAIN (+ $WWW_DOMAIN)"
info "Região    : $REGION"
echo ""

# ═════════════════════════════════════════════════════════════════════════════
# 1. Bucket S3 — privado, sem website hosting: quem serve é o CloudFront
# ═════════════════════════════════════════════════════════════════════════════
echo "━━━ 1/8  Bucket S3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  warn "Bucket $BUCKET já existe — pulando criação."
else
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" \
    --no-cli-pager >/dev/null
  ok "Bucket criado."
fi

aws s3api put-bucket-tagging --bucket "$BUCKET" \
  --tagging "TagSet=[{Key=Project,Value=$PROJECT},{Key=Name,Value=barbeariasilverado}]"

# Nada de ACL pública: o acesso vem exclusivamente do OAC do CloudFront.
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Criptografia em repouso (SSE-S3, sem custo).
aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

ok "s3://$BUCKET — privado, criptografado, com tags."

# ═════════════════════════════════════════════════════════════════════════════
# 2. Certificado ACM (us-east-1)
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 2/8  Certificado ACM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CERT_ARN=$(aws acm list-certificates --region "$CERT_REGION" \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" --output text)

if [ "$CERT_ARN" = "None" ] || [ -z "$CERT_ARN" ]; then
  CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN" \
    --subject-alternative-names "$WWW_DOMAIN" \
    --validation-method DNS \
    --region "$CERT_REGION" \
    --tags "Key=Project,Value=$PROJECT" \
    --query CertificateArn --output text)
  ok "Certificado solicitado."
  info "Aguardando a AWS publicar os registros de validação..."
  sleep 12
else
  warn "Certificado já existe para $DOMAIN — reaproveitando."
fi

CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$CERT_REGION"   --query Certificate.Status --output text)

if [ "$CERT_STATUS" = "ISSUED" ]; then
  CERT_READY=1
  ok "Certificado ISSUED — o domínio já será anexado à distribuição."
else
  CERT_READY=0
  echo ""
  warn "╔════════════════════════════════════════════════════════════════════╗"
  warn "║  AÇÃO NECESSÁRIA — adicione estes CNAMEs no Cloudflare (DNS only)  ║"
  warn "╚════════════════════════════════════════════════════════════════════╝"
  echo ""
  aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$CERT_REGION"     --query 'Certificate.DomainValidationOptions[].ResourceRecord' --output json |
    "$PY" -c "
import json, sys
seen = set()
for r in json.load(sys.stdin):
    if r['Name'] in seen: continue
    seen.add(r['Name'])
    print(f\"  Tipo  : {r['Type']}\")
    print(f\"  Nome  : {r['Name']}\")
    print(f\"  Valor : {r['Value']}\")
    print()
"
  warn "No Cloudflare, deixe estes registros com a nuvem CINZA (DNS only)."
  warn "Proxiados, o Cloudflare responde no lugar deles e a validação nunca conclui."
  echo ""
  info "O script segue sem travar: a distribuição sobe funcionando no domínio"
  info "*.cloudfront.net. Depois que o certificado ficar ISSUED, rode:"
  info "    ./scripts/aws-attach-domain.sh"
  echo ""
fi

# ═════════════════════════════════════════════════════════════════════════════
# 3. Origin Access Control
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 3/8  Origin Access Control ━━━━━━━━━━━━━━━━━━━━━━━━━━━"

OAC_ID=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='${BUCKET}-oac'].Id | [0]" --output text)

if [ "$OAC_ID" = "None" ] || [ -z "$OAC_ID" ]; then
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
      "Name=${BUCKET}-oac,Description=OAC para ${DOMAIN},SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
    --query 'OriginAccessControl.Id' --output text)
  ok "OAC criado: $OAC_ID"
else
  warn "OAC já existe: $OAC_ID"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 4. CloudFront Function — www → raiz
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 4/8  CloudFront Function (redirect www) ━━━━━━━━━━━━━━"

FUNCTION_NAME="barbeariasilverado-redirect"

cat > "$TMP_DIR/silverado-redirect.js" <<EOF
/**
 * Roda na borda, antes de qualquer requisição chegar ao S3.
 *
 * 1. Consolida o tráfego em https://$DOMAIN — duas URLs servindo o mesmo
 *    conteúdo dividem sinal de SEO.
 *
 * 2. Traduz URL de diretório para o objeto real no S3. O build gera
 *    dist/agendar/index.html, mas o anúncio aponta para /agendar.
 *
 * 3. Normaliza a caixa das URLs de página. O S3 é sensível a maiúsculas, e
 *    /Agendar não encontraria /agendar/index.html. Vale só para caminhos SEM
 *    extensão: os nomes dos assets têm hash com maiúsculas.
 */
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  if (host === '$WWW_DOMAIN') {
    var query = '';
    if (request.querystring) {
      var parts = [];
      for (var key in request.querystring) {
        parts.push(key + '=' + request.querystring[key].value);
      }
      if (parts.length) query = '?' + parts.join('&');
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://$DOMAIN' + request.uri + query } }
    };
  }

  var uri = request.uri;
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);

  if (uri.charAt(uri.length - 1) === '/') {
    request.uri = uri.toLowerCase() + 'index.html';
  } else if (lastSegment.indexOf('.') === -1) {
    request.uri = uri.toLowerCase() + '/index.html';
  }

  return request;
}
EOF

if aws cloudfront describe-function --name "$FUNCTION_NAME" >/dev/null 2>&1; then
  ETAG=$(aws cloudfront describe-function --name "$FUNCTION_NAME" --query ETag --output text)
  aws cloudfront update-function \
    --name "$FUNCTION_NAME" \
    --if-match "$ETAG" \
    --function-config "Comment=Redireciona www normaliza caixa e reescreve URL de diretorio,Runtime=cloudfront-js-2.0" \
    --function-code fileb://$TMP_DIR/silverado-redirect.js >/dev/null
  warn "Function já existia — código atualizado."
else
  aws cloudfront create-function \
    --name "$FUNCTION_NAME" \
    --function-config "Comment=Redireciona www normaliza caixa e reescreve URL de diretorio,Runtime=cloudfront-js-2.0" \
    --function-code fileb://$TMP_DIR/silverado-redirect.js >/dev/null
  ok "Function criada."
fi

# Publicar em LIVE (sem isso a versão fica só em DEVELOPMENT)
ETAG=$(aws cloudfront describe-function --name "$FUNCTION_NAME" --query ETag --output text)
aws cloudfront publish-function --name "$FUNCTION_NAME" --if-match "$ETAG" >/dev/null
FUNCTION_ARN=$(aws cloudfront describe-function --name "$FUNCTION_NAME" \
  --query FunctionSummary.FunctionMetadata.FunctionARN --output text)
ok "Function publicada: $FUNCTION_ARN"

# ═════════════════════════════════════════════════════════════════════════════
# 5. Response Headers Policy
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 5/8  Response Headers Policy ━━━━━━━━━━━━━━━━━━━━━━━━━"

RHP_NAME="barbeariasilverado-security"
RHP_ID=$(aws cloudfront list-response-headers-policies --type custom \
  --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='$RHP_NAME'].ResponseHeadersPolicy.Id | [0]" \
  --output text)

# A CSP reflete exatamente o que o site usa:
#   - tudo próprio ('self'), porque fontes, imagens e scripts são auto-hospedados;
#   - 'unsafe-inline' em style-src por causa dos style={{…}} do React (atributos
#     de estilo não passam por nonce/hash);
#   - os domínios do Google necessários para a tag do Ads. Sem eles, a tag seria
#     bloqueada em silêncio e as conversões da campanha nunca chegariam — o tipo
#     de falha que só aparece semanas depois, na conta do anúncio.
#
# Note que script-src NÃO tem 'unsafe-inline': o bootstrap do gtag mora no
# bundle da aplicação (ver src/lib/analytics.ts), e não num <script> inline
# colado no HTML como o e-mail do Google sugere.
GOOGLE_IMG="https://www.googletagmanager.com https://www.google.com https://www.google.com.br https://googleads.g.doubleclick.net https://www.googleadservices.com"
GOOGLE_CONNECT="https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://googleads.g.doubleclick.net https://www.googleadservices.com https://www.google.com https://www.google.com.br"

CSP="default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${GOOGLE_IMG}; font-src 'self'; connect-src 'self' ${GOOGLE_CONNECT}; frame-src https://maps.google.com https://www.google.com https://td.doubleclick.net; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"

cat > "$TMP_DIR/silverado-rhp.json" <<EOF
{
  "Name": "$RHP_NAME",
  "Comment": "Cabecalhos de seguranca do site da Barbearia Silverado",
  "SecurityHeadersConfig": {
    "StrictTransportSecurity": {
      "Override": true,
      "AccessControlMaxAgeSec": 31536000,
      "IncludeSubdomains": true,
      "Preload": false
    },
    "ContentTypeOptions": { "Override": true },
    "FrameOptions": { "Override": true, "FrameOption": "DENY" },
    "ReferrerPolicy": { "Override": true, "ReferrerPolicy": "strict-origin-when-cross-origin" },
    "ContentSecurityPolicy": { "Override": true, "ContentSecurityPolicy": "$CSP" }
  }
}
EOF

if [ "$RHP_ID" = "None" ] || [ -z "$RHP_ID" ]; then
  RHP_ID=$(aws cloudfront create-response-headers-policy \
    --response-headers-policy-config file://$TMP_DIR/silverado-rhp.json \
    --query 'ResponseHeadersPolicy.Id' --output text)
  ok "Policy criada: $RHP_ID"
else
  RHP_ETAG=$(aws cloudfront get-response-headers-policy --id "$RHP_ID" --query ETag --output text)
  aws cloudfront update-response-headers-policy \
    --id "$RHP_ID" --if-match "$RHP_ETAG" \
    --response-headers-policy-config file://$TMP_DIR/silverado-rhp.json >/dev/null
  warn "Policy já existia — atualizada: $RHP_ID"
fi

# ═════════════════════════════════════════════════════════════════════════════
# 6. Distribuição CloudFront
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 6/8  Distribuição CloudFront ━━━━━━━━━━━━━━━━━━━━━━━━━"

# A busca é pelo Comment, e não pelo alias: enquanto o certificado não sai, a
# distribuição existe sem nenhum domínio associado.
DIST_MATCHES=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='Barbearia Silverado - $DOMAIN'].Id" --output text)
DIST_COUNT=$(echo "$DIST_MATCHES" | wc -w)
if [ "$DIST_COUNT" -gt 1 ]; then
  die "Há $DIST_COUNT distribuições com este Comment ($DIST_MATCHES). Remova as duplicadas antes de continuar."
fi
DIST_ID=$(echo "$DIST_MATCHES" | awk '{print $1}')

# Sem certificado válido, a distribuição sobe sem alias e com o certificado
# padrão do CloudFront: o site já fica no ar em *.cloudfront.net e o domínio é
# anexado depois, sem recriar nada.
if [ "$CERT_READY" = "1" ]; then
  ALIASES_JSON="{ \"Quantity\": 2, \"Items\": [\"$DOMAIN\", \"$WWW_DOMAIN\"] }"
  VIEWER_CERT_JSON="{ \"ACMCertificateArn\": \"$CERT_ARN\", \"SSLSupportMethod\": \"sni-only\", \"MinimumProtocolVersion\": \"TLSv1.2_2021\" }"
else
  ALIASES_JSON="{ \"Quantity\": 0 }"
  VIEWER_CERT_JSON="{ \"CloudFrontDefaultCertificate\": true }"
fi

if [ -z "$DIST_ID" ]; then
  cat > "$TMP_DIR/silverado-cf.json" <<EOF
{
  "CallerReference": "barbeariasilverado-$DOMAIN",
  "Comment": "Barbearia Silverado - $DOMAIN",
  "DefaultRootObject": "index.html",
  "Aliases": $ALIASES_JSON,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-$BUCKET",
      "DomainName": "$BUCKET.s3.$REGION.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" },
      "OriginAccessControlId": "$OAC_ID"
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "ResponseHeadersPolicyId": "$RHP_ID",
    "Compress": true,
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "FunctionAssociations": {
      "Quantity": 1,
      "Items": [{ "EventType": "viewer-request", "FunctionARN": "$FUNCTION_ARN" }]
    }
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 10 },
      { "ErrorCode": 404, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 10 }
    ]
  },
  "ViewerCertificate": $VIEWER_CERT_JSON,
  "PriceClass": "PriceClass_All",
  "Enabled": true,
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true
}
EOF

  if DIST_JSON=$(aws cloudfront create-distribution --distribution-config file://$TMP_DIR/silverado-cf.json \
       --query 'Distribution.Id' --output text 2>"$TMP_DIR/create-err.txt"); then
    DIST_ID="$DIST_JSON"
    ok "Distribuição criada: $DIST_ID"
  else
    # "Already exists: EXXXX" — o CLI repetiu a chamada por conta própria. Como
    # o CallerReference é fixo, a AWS devolve o ID da primeira tentativa.
    DIST_ID=$(grep -oE 'Already exists: [A-Z0-9]+' "$TMP_DIR/create-err.txt" | awk '{print $3}' || true)
    if [ -z "$DIST_ID" ]; then
      cat "$TMP_DIR/create-err.txt"
      die "Falha ao criar a distribuição."
    fi
    warn "A criação foi repetida pelo CLI — reaproveitando $DIST_ID."
  fi

  DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)
  DIST_ARN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.ARN' --output text)
  aws cloudfront tag-resource --resource "$DIST_ARN" --tags "Items=[{Key=Project,Value=$PROJECT}]"
else
  DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)
  DIST_ARN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.ARN' --output text)
  warn "Distribuição já existe: $DIST_ID"
fi

ok "CloudFront: $DIST_DOMAIN"

# ═════════════════════════════════════════════════════════════════════════════
# 7. Bucket policy — só o CloudFront desta distribuição pode ler
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 7/8  Bucket policy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$TMP_DIR/silverado-bucket-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontOAC",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET/*",
    "Condition": { "StringEquals": { "AWS:SourceArn": "$DIST_ARN" } }
  }]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET" --policy file://$TMP_DIR/silverado-bucket-policy.json
ok "S3 acessível apenas via CloudFront."

# ═════════════════════════════════════════════════════════════════════════════
# 8. OIDC + IAM role para o GitHub Actions
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 8/8  GitHub OIDC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" >/dev/null 2>&1; then
  warn "Provider OIDC do GitHub já existe."
else
  # A AWS valida a cadeia do certificado do próprio GitHub desde 2023, então a
  # thumbprint virou formalidade — mas a API ainda a exige.
  aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
    --tags "Key=Project,Value=$PROJECT" >/dev/null
  ok "Provider OIDC criado."
fi

# A condição `sub` amarra a role a este repositório: um fork, um PR de terceiro
# ou outro repositório não conseguem assumi-la.
#
# São dois formatos aceitos porque o GitHub emite o `sub` de duas maneiras e a
# documentação clássica só descreve a primeira:
#
#   repo:owner/repo:environment:production
#   repo:owner@<ownerId>/repo@<repoId>:environment:production   ← subject imutável
#
# O segundo formato inclui os IDs numéricos e é o que este repositório recebe.
# Ele é, aliás, o mais seguro dos dois: nomes de usuário e de repositório podem
# ser abandonados e registrados por outra pessoa; IDs, não.
#
# Note também o `:environment:` no lugar do `:ref:`. Quando o job declara
# `environment:`, é assim que o GitHub monta o subject — usar só a forma de
# branch faz o deploy falhar com um lacônico "Not authorized to perform
# sts:AssumeRoleWithWebIdentity", sem dizer o motivo. Quando isso acontecer, o
# `sub` real aparece no CloudTrail, no campo userIdentity.userName do evento
# AssumeRoleWithWebIdentity.
info "Consultando os IDs numéricos de $GITHUB_REPO na API do GitHub..."
REPO_META=$(curl -fsS "https://api.github.com/repos/${GITHUB_REPO}" 2>/dev/null || echo "")

if [ -n "$REPO_META" ]; then
  OWNER_ID=$(echo "$REPO_META" | "$PY" -c "import sys,json; print(json.load(sys.stdin)['owner']['id'])")
  REPO_ID=$(echo "$REPO_META" | "$PY" -c "import sys,json; print(json.load(sys.stdin)['id'])")
  OWNER_NAME=${GITHUB_REPO%%/*}
  REPO_NAME=${GITHUB_REPO##*/}
  # O ID do repositório entra como curinga de propósito. Ele muda se o
  # repositório for apagado e recriado — e um deploy que quebra por isso é
  # exatamente o tipo de armadilha que não se lembra na hora. Pinar o ID do
  # DONO e o nome do repositório já fecha o acesso: ninguém mais consegue criar
  # um repositório "barbeariasilverado" sob a conta 95257914.
  IMMUTABLE_SUB="repo:${OWNER_NAME}@${OWNER_ID}/${REPO_NAME}@*:*"
  echo "  (id do repo atual: ${REPO_ID}, deixado como curinga)" >/dev/null
  ok "Subject imutável: $IMMUTABLE_SUB"
else
  # Sem rede ou repositório privado: cai para o formato clássico apenas.
  IMMUTABLE_SUB="repo:${GITHUB_REPO}:*"
  warn "Não consegui ler os IDs na API do GitHub — usando só o formato clássico."
fi

cat > "$TMP_DIR/silverado-trust.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "$OIDC_ARN" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": [
          "$IMMUTABLE_SUB",
          "repo:${GITHUB_REPO}:*"
        ]
      }
    }
  }]
}
EOF

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document file://$TMP_DIR/silverado-trust.json
  warn "Role já existia — trust policy atualizada."
else
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --description "Deploy do site da Barbearia Silverado via GitHub Actions (OIDC)" \
    --assume-role-policy-document file://$TMP_DIR/silverado-trust.json \
    --max-session-duration 3600 \
    --tags "Key=Project,Value=$PROJECT" >/dev/null
  ok "Role criada."
fi

cat > "$TMP_DIR/silverado-perms.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SyncSite",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::$BUCKET/*"
    },
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::$BUCKET"
    },
    {
      "Sid": "Invalidate",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      "Resource": "$DIST_ARN"
    },
    {
      "Sid": "ReadDistribution",
      "Effect": "Allow",
      "Action": "cloudfront:GetDistribution",
      "Resource": "$DIST_ARN"
    }
  ]
}
EOF

aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" \
  --policy-document file://$TMP_DIR/silverado-perms.json
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query Role.Arn --output text)
ok "Permissões mínimas aplicadas."


# ═════════════════════════════════════════════════════════════════════════════
# Resumo
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  ✅  INFRAESTRUTURA PRONTA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUMMARY=$(cat <<EOF

Barbearia Silverado — infraestrutura AWS
Gerado em: $(date)
================================================================

  Conta AWS        : $ACCOUNT_ID
  Bucket S3        : $BUCKET ($REGION)
  Certificado ACM  : $CERT_ARN
  CloudFront ID    : $DIST_ID
  CloudFront domain: $DIST_DOMAIN
  OAC              : $OAC_ID
  Headers policy   : $RHP_ID
  Function         : $FUNCTION_NAME
  IAM role (OIDC)  : $ROLE_ARN

----------------------------------------------------------------
GitHub → Settings → Secrets and variables → Actions → Variables
----------------------------------------------------------------
  AWS_REGION                 = $REGION
  AWS_ROLE_ARN               = $ROLE_ARN
  S3_BUCKET_NAME             = $BUCKET
  CLOUDFRONT_DISTRIBUTION_ID = $DIST_ID

  (Nenhum Secret é necessário — o deploy usa OIDC.)

----------------------------------------------------------------
Cloudflare → DNS de $DOMAIN
----------------------------------------------------------------
  Tipo   Nome    Conteúdo                       Proxy
  CNAME  @       $DIST_DOMAIN   DNS only (nuvem cinza)
  CNAME  www     $DIST_DOMAIN   DNS only (nuvem cinza)

  O Cloudflare achata o CNAME na raiz automaticamente (CNAME flattening).

  Por que "DNS only": com o proxy ligado, o Cloudflare termina o TLS e
  encaminha ao CloudFront; se o SSL/TLS não estiver em "Full (strict)",
  isso vira um loop de redirecionamento. Cinza funciona de primeira — o
  CloudFront já é a CDN, então não se perde nada.
================================================================
EOF
)

echo "$SUMMARY"
echo "$SUMMARY" > "$OUT_FILE"
ok "Resumo salvo em $OUT_FILE (ignorado pelo git)."
echo ""
