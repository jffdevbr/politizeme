#!/bin/sh
# Backup do banco do PolitizeMe (contas de usuário + dados carregados).
# Uso:        sh scripts/backup.sh
# Restaurar:  docker compose exec -T db psql -U politizeme politizeme < backups/<arquivo>.sql
set -e
mkdir -p backups
ARQ="backups/politizeme_$(date +%Y%m%d_%H%M%S).sql"
docker compose exec -T db pg_dump -U politizeme --clean --if-exists politizeme > "$ARQ"
echo "Backup salvo em $ARQ"
