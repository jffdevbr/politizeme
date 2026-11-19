#!/bin/sh
# Prepara o banco e inicia a aplicação.
set -e
echo "[politizeme] aplicando esquema do banco..."
./node_modules/.bin/prisma db push --skip-generate
echo "[politizeme] carregando dados (só se o banco estiver vazio)..."
node prisma/seed.mjs
echo "[politizeme] iniciando em http://localhost:${PORT:-3000}"
exec ./node_modules/.bin/next start -p "${PORT:-3000}"
