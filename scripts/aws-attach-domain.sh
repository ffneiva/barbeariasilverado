#!/usr/bin/env bash
# =============================================================================
#  Barbearia Silverado — anexa o domínio próprio à distribuição CloudFront
# =============================================================================
#
#  Rode DEPOIS de criar, no Cloudflare, os CNAMEs de validação que o
#  aws-setup.sh imprimiu. O script:
#
#    1. confere se o certificado ACM já está ISSUED (e espera, se pedir);
#    2. adiciona barbeariasilverado.com.br e www.… como aliases;
#    3. troca o certificado padrão do CloudFront pelo do ACM.
#
#  É seguro rodar mais de uma vez: ele lê a configuração atual, altera só os
#  dois campos e devolve o restante intacto.
#
#  Uso:
#    chmod +x scripts/aws-attach-domain.sh
#    ./scripts/aws-attach-domain.sh
# =============================================================================
set -euo pipefail

DOMAIN="barbeariasilverado.com.br"
WWW_DOMAIN="www.${DOMAIN}"
CERT_REGION="us-east-1"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
die()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

PY=$(command -v python3 || command -v python) || die "Python 3 não encontrado."

# Arquivos temporários ficam no próprio repositório, e não em /tmp.
# Motivo: no Git Bash do Windows o "/tmp" do shell não é o mesmo caminho que
# o AWS CLI nativo enxerga — `fileb:///tmp/x` vira `C:\tmp\x` e falha.
# Um caminho relativo funciona nos dois mundos.
TMP_DIR=".aws-tmp"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Anexando $DOMAIN ao CloudFront"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Certificado ──────────────────────────────────────────────────────────────
CERT_ARN=$(aws acm list-certificates --region "$CERT_REGION" \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" --output text)
[ "$CERT_ARN" = "None" ] && die "Nenhum certificado encontrado para $DOMAIN. Rode antes o aws-setup.sh."

CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$CERT_REGION" \
  --query Certificate.Status --output text)

if [ "$CERT_STATUS" != "ISSUED" ]; then
  warn "Certificado ainda em $CERT_STATUS."
  info "Registros CNAME de validação que precisam existir no Cloudflare:"
  echo ""
  aws acm describe-certificate --certificate-arn "$CERT_ARN" --region "$CERT_REGION" \
    --query 'Certificate.DomainValidationOptions[].ResourceRecord' --output json |
    "$PY" -c "
import json, sys
seen = set()
for r in json.load(sys.stdin):
    if r['Name'] in seen: continue
    seen.add(r['Name'])
    print(f\"  {r['Type']}  {r['Name']}  ->  {r['Value']}\")
"
  echo ""
  info "Aguardando emissão (Ctrl+C para sair e tentar depois)..."
  aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region "$CERT_REGION"
fi
ok "Certificado ISSUED."

# ── Distribuição ─────────────────────────────────────────────────────────────
DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='Barbearia Silverado - $DOMAIN'].Id | [0]" --output text)
[ "$DIST_ID" = "None" ] && die "Distribuição não encontrada. Rode antes o aws-setup.sh."
info "Distribuição: $DIST_ID"

ETAG=$(aws cloudfront get-distribution-config --id "$DIST_ID" --query ETag --output text)
aws cloudfront get-distribution-config --id "$DIST_ID" --query DistributionConfig --output json \
  > "$TMP_DIR/silverado-dist-current.json"

# Altera só Aliases e ViewerCertificate; todo o resto da config é devolvido como
# veio, para não perder cache policy, function association ou error responses.
"$PY" - "$CERT_ARN" "$DOMAIN" "$WWW_DOMAIN" <<'EOF'
import json, sys

cert_arn, domain, www_domain = sys.argv[1], sys.argv[2], sys.argv[3]

with open('.aws-tmp/silverado-dist-current.json') as f:
    cfg = json.load(f)

cfg['Aliases'] = {'Quantity': 2, 'Items': [domain, www_domain]}
cfg['ViewerCertificate'] = {
    'ACMCertificateArn': cert_arn,
    'SSLSupportMethod': 'sni-only',
    'MinimumProtocolVersion': 'TLSv1.2_2021',
    'Certificate': cert_arn,
    'CertificateSource': 'acm',
}

with open('.aws-tmp/silverado-dist-updated.json', 'w') as f:
    json.dump(cfg, f)

print('Config ajustada: aliases + certificado ACM.')
EOF

info "Atualizando a distribuição (a propagação leva alguns minutos)..."
aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --if-match "$ETAG" \
  --distribution-config file://$TMP_DIR/silverado-dist-updated.json \
  --query 'Distribution.{Id:Id,Status:Status}' --output table

DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)

echo ""
ok "Domínio anexado."
echo ""
echo "  Falta apontar o DNS no Cloudflare (zona $DOMAIN):"
echo ""
echo "    CNAME  @     $DIST_DOMAIN   ·  DNS only (nuvem cinza)"
echo "    CNAME  www   $DIST_DOMAIN   ·  DNS only (nuvem cinza)"
echo ""
echo "  Depois da propagação: https://$DOMAIN"
echo ""
