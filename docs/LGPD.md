# Uso responsável dos dados (LGPD, segurança e vieses)

Um serviço sobre política precisa ser confiável para pessoas de qualquer posição. As regras abaixo são parte do produto e estão refletidas no código.

## 1. Que dados pessoais o PolitizeMe trata

| Dado | Por quê | Obrigatório | Base legal (LGPD) |
| --- | --- | --- | --- |
| E-mail | Identificar a conta | Só para quem cria conta | Consentimento (art. 7º, I) |
| Senha | Acesso à conta; guardada **só como hash bcrypt** | Só para quem cria conta | Consentimento |
| Município | Mostrar "Minha cidade" e alertas da cidade | Opcional | Consentimento |
| Canal preferido (site/WhatsApp) | Preferência de aviso | Opcional | Consentimento |
| Quem a pessoa segue | Montar resumo e alertas | Só para quem segue | Consentimento |
| Data e versão do termo aceito | Provar o consentimento | Sim, para quem cria conta | Cumprimento de obrigação |

**Consultar não exige conta.** O fluxo principal funciona sem cadastro e sem cookies de rastreamento.

## 2. O que nunca coletamos

- **Em quem a pessoa votou** e **partido de preferência**: opinião política é **dado pessoal sensível** (art. 5º, II).
- CPF, endereço completo, telefone, localização precisa.
- O **CEP** digitado na busca é usado só para descobrir o município e **não é armazenado**.

### Atenção: "quem eu sigo" pode revelar opinião

Seguir um parlamentar pode sugerir preferência política. Por isso:
- a lista de quem a pessoa segue é visível **só para ela**;
- o painel de uso mostra apenas **agregados** e esconde qualquer grupo com menos de 5 pessoas;
- esse dado nunca é compartilhado com parceiros.

## 3. Direitos do titular (implementados)

| Direito | Como exercer na aplicação |
| --- | --- |
| Acesso | Página "Minha conta" mostra todos os dados guardados |
| Eliminação | Botão "Excluir minha conta" apaga a conta e tudo o que a pessoa segue |
| Revogação do consentimento | Mesmo botão; também é possível deixar de seguir a qualquer momento |

## 4. Segurança

| Medida | MVP | Evolução (Azure) |
| --- | --- | --- |
| Senhas | Hash bcrypt (custo 10) | Idem + Entra ID External ID |
| Sessão | Cookie `httpOnly`, `sameSite=lax`, assinado, expira em 7 dias | Idem + `secure` sob HTTPS |
| Segredos | `.env` fora do Git; `.env.example` sem valores reais | Key Vault + identidade gerenciada |
| Separação | Tabelas de usuário separadas dos dados públicos | Bancos separados, acesso por função |
| Criptografia | Em trânsito via HTTPS no Vercel | Em repouso e em trânsito em todos os serviços |
| Logs do Poli | Não guardam a pergunta junto com a conta | Amostras anonimizadas para revisão de qualidade |

## 5. Backup e recuperação

- `scripts/backup.sh` gera `backups/politizeme_<data>.sql` com `pg_dump`, a partir do contêiner do banco.
- Os **dados públicos** podem ser recriados a qualquer momento a partir do snapshot versionado. O backup protege principalmente as **contas de usuário**.
- Restauração: `docker compose exec -T db psql -U politizeme politizeme < backups/<arquivo>.sql`.
- Evolução: backup automático diário com retenção de 7 a 35 dias e cópia em outra região.

## 6. Vieses e neutralidade

| Risco | Cuidado |
| --- | --- |
| Interface parecer tomar partido | Votos "Sim" e "Não" com o mesmo peso visual; nenhuma cor de partido; nada de verde/vermelho para certo/errado |
| Comparações virarem ranking | Sem notas, medalhas ou ordenação por "melhor/pior"; listas em ordem alfabética |
| Gastos parecerem acusação | Mostramos o valor, a categoria e a nota oficial; sem adjetivos ("gastou demais") |
| IA opinar ou alucinar | O Poli responde só com dados do banco e cita a fonte; recusa indicar voto; sem dado, diz que não sabe e indica a fonte oficial |
| Excluir quem tem menos acesso | Linguagem simples, contraste ≥ 4,5:1, alvos de toque ≥ 44 px, WhatsApp como canal (simulado no MVP) |
| Dados simulados confundidos com reais | Selo "Dado simulado" em todo bloco simulado e página "Sobre os dados" |
