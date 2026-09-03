#!/usr/bin/env bash
#
# Recria o repositório no GitHub do zero, preservando toda a configuração.
#
# ── Por que isto existe ─────────────────────────────────────────────────────
#
# A barra lateral do repositório lista um contribuidor que não pertence a este
# projeto. O histórico local está limpo, `git log` não tem uma linha sequer com
# aquele nome, e a API REST de contributors devolve só o dono — mas o fragmento
# HTML que a barra lateral renderiza continua mostrando o nome antigo.
#
# A explicação é que são duas contagens diferentes. A API percorre os commits
# alcançáveis; a barra lateral usa um índice que o GitHub mantém por repositório
# e que continua contando **commits órfãos** — aqueles que um force-push tirou
# do histórico mas que continuam existindo no servidor, porque o GitHub não faz
# coleta de lixo sob demanda. Reescrever o histórico de novo não resolve: os
# órfãos que sobraram do primeiro rewrite continuam lá, e o novo rewrite só
# acrescenta mais.
#
# Apagar e recriar o repositório destrói o índice junto com ele. É a única forma
# garantida sem abrir chamado no suporte do GitHub.
#
# ── O que é preservado ──────────────────────────────────────────────────────
#
# Tudo que este script lê antes de apagar e reescreve depois: descrição, site,
# tópicos, visibilidade, o environment `production` e as quatro variáveis que o
# deploy consome. O que se perde é o histórico de execuções do Actions, que não
# tem valor nenhum aqui.
#
# O deploy continua funcionando sem tocar na AWS: a trust policy da role OIDC
# deixa o ID do repositório como curinga justamente porque ele muda quando o
# repositório é recriado (ver scripts/aws-setup.sh).
#
# ── Como rodar ──────────────────────────────────────────────────────────────
#
#   GITHUB_TOKEN=ghp_xxx bash scripts/github-reset.sh
#
# O token precisa dos escopos `repo`, `delete_repo` e `workflow`. Um token
# clássico em github.com/settings/tokens resolve; apague-o depois.
#
set -euo pipefail

REPO="${REPO:-ffneiva/barbeariasilverado}"
INDESEJADO="${INDESEJADO:-harcaengenharia}"
API="https://api.github.com"

VERDE=$'\033[32m'; AMARELO=$'\033[33m'; VERMELHO=$'\033[31m'; CINZA=$'\033[90m'; FIM=$'\033[0m'
info() { echo "${CINZA}·${FIM} $*"; }
ok()   { echo "${VERDE}✓${FIM} $*"; }
warn() { echo "${AMARELO}!${FIM} $*"; }
erro() { echo "${VERMELHO}✗${FIM} $*" >&2; exit 1; }

PY=$(command -v python3 || command -v python) || erro "Preciso de python no PATH."

[ -n "${GITHUB_TOKEN:-}" ] || erro "Defina GITHUB_TOKEN (escopos: repo, delete_repo, workflow)."

api() {
  local metodo=$1 caminho=$2; shift 2
  curl -fsS -X "$metodo" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$API$caminho" "$@"
}

# ── 1. Conferir que o histórico local está limpo ────────────────────────────
#
# Recriar o repositório com o nome ainda presente nos commits só reconstruiria
# o problema. Esta é a única verificação que impede o script de rodar.
info "Conferindo o histórico local..."
if git log --format='%an %ae %cn %ce %B' | grep -iq "$INDESEJADO"; then
  erro "O histórico local ainda menciona '$INDESEJADO'. Limpe-o antes de recriar."
fi
ok "Nenhuma menção a '$INDESEJADO' em autor, committer ou mensagem."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMITS=$(git rev-list --count HEAD)
info "Branch '$BRANCH', $COMMITS commits."

# ── 2. Guardar a configuração atual ─────────────────────────────────────────
info "Lendo a configuração atual de $REPO..."
META=$(api GET "/repos/$REPO")

DESC=$("$PY" -c "import sys,json;print(json.load(sys.stdin).get('description') or '')" <<<"$META")
HOME_URL=$("$PY" -c "import sys,json;print(json.load(sys.stdin).get('homepage') or '')" <<<"$META")
PRIVADO=$("$PY" -c "import sys,json;print(str(json.load(sys.stdin)['private']).lower())" <<<"$META")
TOPICOS=$("$PY" -c "import sys,json;print(json.dumps(json.load(sys.stdin).get('topics') or []))" <<<"$META")

VARIAVEIS=$(api GET "/repos/$REPO/actions/variables?per_page=100" \
  | "$PY" -c "import sys,json;print(json.dumps({v['name']: v['value'] for v in json.load(sys.stdin)['variables']}))")

QUANTAS=$("$PY" -c "import sys,json;print(len(json.load(sys.stdin)))" <<<"$VARIAVEIS")
[ "$QUANTAS" -gt 0 ] || erro "Não li nenhuma variável — o token provavelmente não tem escopo 'repo'."

ok "Guardadas $QUANTAS variáveis, tópicos e descrição."
echo "$VARIAVEIS" | "$PY" -c "import sys,json;[print('    ',k,'=',v) for k,v in json.load(sys.stdin).items()]"

BACKUP=".github-reset-backup.json"
"$PY" - "$BACKUP" "$DESC" "$HOME_URL" "$PRIVADO" "$TOPICOS" "$VARIAVEIS" <<'PY'
import json, sys
destino, desc, home, privado, topicos, variaveis = sys.argv[1:7]
json.dump(
    {
        "description": desc,
        "homepage": home,
        "private": privado == "true",
        "topics": json.loads(topicos),
        "variables": json.loads(variaveis),
    },
    open(destino, "w", encoding="utf-8"),
    ensure_ascii=False,
    indent=2,
)
PY
ok "Cópia de segurança em $BACKUP (não versionada)."

# ── 3. Confirmação explícita ────────────────────────────────────────────────
warn "Isto APAGA github.com/$REPO e o recria."
warn "Perde-se o histórico de execuções do Actions. O código está seguro: ele vem daqui."
printf "Digite o nome do repositório para confirmar: "
read -r CONFIRMA
[ "$CONFIRMA" = "${REPO##*/}" ] || erro "Não confirmado — nada foi alterado."

# ── 4. Apagar e recriar ─────────────────────────────────────────────────────
info "Apagando $REPO..."
api DELETE "/repos/$REPO" >/dev/null
ok "Apagado."

info "Recriando..."
"$PY" - "$DESC" "$HOME_URL" "$PRIVADO" "${REPO##*/}" > .github-reset-body.json <<'PY'
import json, sys
desc, home, privado, nome = sys.argv[1:5]
json.dump(
    {
        "name": nome,
        "description": desc,
        "homepage": home,
        "private": privado == "true",
        "has_issues": True,
        "has_wiki": False,
        "has_projects": False,
    },
    sys.stdout,
)
PY
api POST "/user/repos" -d @.github-reset-body.json >/dev/null
rm -f .github-reset-body.json
ok "Repositório recriado."

# O GitHub leva um instante para o repositório aceitar push logo após a criação.
for _ in 1 2 3 4 5; do
  curl -fsS -o /dev/null "$API/repos/$REPO" && break
  sleep 2
done

# ── 5. Devolver o código ────────────────────────────────────────────────────
info "Enviando $COMMITS commits..."
git push --force origin "$BRANCH:$BRANCH"
git push --force --tags origin 2>/dev/null || true
ok "Código no lugar."

# ── 6. Restaurar tópicos, environment e variáveis ───────────────────────────
info "Restaurando tópicos..."
api PUT "/repos/$REPO/topics" -d "{\"names\":$TOPICOS}" >/dev/null
ok "Tópicos restaurados."

# O workflow declara `environment: production`, e é isso que faz o GitHub emitir
# o subject OIDC com `:environment:` em vez de `:ref:` — que é a forma que a
# trust policy da role espera. Sem o environment, o deploy falha na hora de
# assumir a role.
info "Recriando o environment 'production'..."
api PUT "/repos/$REPO/environments/production" -d '{}' >/dev/null
ok "Environment recriado."

info "Restaurando as variáveis..."
echo "$VARIAVEIS" | "$PY" -c "
import json, sys
for nome, valor in json.load(sys.stdin).items():
    print(nome + '\t' + valor)
" | while IFS=$'\t' read -r NOME VALOR; do
  api POST "/repos/$REPO/actions/variables" \
    -d "$("$PY" -c "import json,sys;print(json.dumps({'name':sys.argv[1],'value':sys.argv[2]}))" "$NOME" "$VALOR")" >/dev/null
  echo "    $NOME"
done
ok "Variáveis restauradas."

# ── 7. Conferir o resultado ─────────────────────────────────────────────────
info "Conferindo a lista de contribuidores..."
sleep 5
FRAGMENTO=$(curl -fsS "https://github.com/$REPO/contributors_list?count=10&current_repository=${REPO##*/}&items_to_show=10" || echo "")

if echo "$FRAGMENTO" | grep -qi "$INDESEJADO"; then
  warn "'$INDESEJADO' ainda aparece. O índice pode levar alguns minutos —"
  warn "confira de novo em https://github.com/$REPO daqui a pouco."
else
  ok "'$INDESEJADO' não aparece mais na lista de contribuidores."
fi

echo
ok "Pronto. Falta só disparar o deploy:"
echo "    git commit --allow-empty -m 'chore: redeploy' && git push"
