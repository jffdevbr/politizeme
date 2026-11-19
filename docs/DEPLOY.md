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

> Instruções completas serão preenchidas no bloco 2.

```bash
git clone https://github.com/jffdevbr/politizeme.git
cd politizeme
cp .env.example .env      # opcional: adicione ANTHROPIC_API_KEY
docker compose up --build
# abra http://localhost:3000
```

## Vercel + Neon

> Será preenchido no bloco 5.
