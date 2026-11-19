# Como rodar e publicar

## Docker ou Vercel?

| | Docker Compose (caminho principal) | Vercel (link público) |
| --- | --- | --- |
| Para quem | Quem clonou o repositório (professor, colegas) | Quem só vai abrir um link (vídeo, avaliação) |
| O que precisa | Docker Desktop | Conta Vercel + banco Postgres gerenciado (Neon, plano gratuito) |
| Persistência | Postgres em volume do Docker: os dados continuam depois de `docker compose down` | O Vercel não guarda arquivos entre requisições (serverless); por isso o banco precisa ser externo |
| Relação com as disciplinas | É o mesmo contêiner que iria para o Azure Container Apps | Mostra hospedagem gerenciada |
| Funciona sem internet | Sim, depois da primeira build (o snapshot de dados está no repositório) | Não se aplica |

**Recomendação:** use o Docker para avaliar e desenvolver, e o Vercel só para ter um link público no vídeo. O código é o mesmo; só muda a variável `DATABASE_URL`.

## Docker (local)

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto.

```bash
git clone https://github.com/jffdevbr/politizeme.git
cd politizeme
cp .env.example .env      # opcional: adicione ANTHROPIC_API_KEY para o modo LLM do Poli
docker compose up --build
# abra http://localhost:3000
```

O que acontece ao subir:
1. `db`: PostgreSQL 16 com o volume `pgdata` (os dados ficam salvos entre reinícios).
2. `app`: aplica o esquema (`prisma db push`), carrega o snapshot de `data/snapshot/` **só se o banco estiver vazio** e inicia o site.

| Tarefa | Comando |
| --- | --- |
| Parar | `docker compose down` (os dados continuam no volume) |
| Apagar tudo e começar do zero | `docker compose down -v` |
| Atualizar os dados oficiais | `python etl/executar_tudo.py` e depois `docker compose exec app node prisma/seed.mjs --force` |
| Backup | `sh scripts/backup.sh` |

O ETL usa só a biblioteca padrão do Python 3.10+ e não precisa de nenhuma instalação.

### Sem Docker (desenvolvimento)

Requer **Node 20.19+** (o Tailwind 4 não funciona em versões anteriores).

```bash
docker compose up -d db
cp .env.example .env
npm install
npx prisma db push && npm run db:seed
npm run dev
```

## Vercel + Neon

> Será preenchido no bloco 5.
