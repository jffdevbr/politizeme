# Fluxo principal do pitch (proposta)

> **Status: proposta para validação da equipe.** Na documentação do projeto este item estava "a definir".

Orientação do professor: mostrar **um fluxo principal bem executado, de ponta a ponta, sem tela de login**. O fluxo abaixo continua a história da Parte 1 do vídeo: Carla viu a manchete sobre uma votação e quer saber como votaram os deputados que a representam.

## Os passos

| # | Tela | O que Carla faz | O que o PolitizeMe mostra | Dado |
| --- | --- | --- | --- | --- |
| 1 | **Início** | Digita o CEP | "Você mora em São Paulo (SP). Quem representa você: 70 deputados federais e 3 senadores" | REAL (ViaCEP + Câmara + Senado) |
| 2 | **Votações** | Toca na votação da manchete | Resumo em linguagem simples, link para o texto oficial, quantos deputados de SP votaram Sim, Não e se abstiveram (mesmo peso visual) | REAL (Câmara) |
| 3 | **Detalhe da votação** | Procura pelo nome, filtra por partido | O voto de cada deputado de SP e a orientação de cada partido, como dado, sem julgamento | REAL |
| 4 | **Perfil** | Toca em um nome | Partido, participação nas votações, gastos da cota por categoria e mês a mês, nota fiscal de cada despesa | REAL |
| 5 | **Assistente Poli** | Pergunta "o que é cota parlamentar?" | Explicação curta + fonte | REAL (glossário + banco) |
| 6 | **Seguir** | Toca em "Seguir" | Prévia do que vai receber no WhatsApp: resumo semanal e alertas | SIMULAÇÃO de canal com dados reais |

O cadastro existe e funciona, mas aparece no vídeo só como "crie uma conta para receber avisos". O fluxo do pitch não depende dele.

## Por que este fluxo

- Responde exatamente a pergunta da Carla na Parte 1 ("quem votou contra?").
- Usa **só dados reais** nos passos 1 a 5. O único passo simulado (6) é o canal WhatsApp, e ele é rotulado.
- Mostra os diferenciais: ligação com a cidade (passo 1), IA com fonte (passo 5), neutralidade (passos 2 e 3) e acompanhamento contínuo (passo 6).

## Votação usada no vídeo (decidida em 18/11/2026)

**PEC 221/2019 – redução da jornada de trabalho para 36 horas semanais.** Dado real, conferível na fonte:

| Campo | Valor |
| --- | --- |
| O que foi votado | Aprovada, em segundo turno, a Proposta de Emenda à Constituição nº 221, de 2019 |
| Data | 27/05/2026, Plenário da Câmara |
| Placar geral | Sim 461 · Não 19 |
| Deputados de SP em exercício hoje | Sim 61 · Não 4 (os demais sem voto registrado) |
| Texto oficial | https://www.camara.leg.br/propostas-legislativas/2233802 |
| No app | `/votacoes/2233802-438` |

**Ajuste no roteiro da Parte 1:** a manchete que a Carla vê deixa de ser sobre salário mínimo (fictícia) e passa a ser sobre a votação real da jornada de 36 horas. Sugestão de texto, sem adjetivos e sem lado: *"Câmara aprova PEC que reduz jornada de trabalho para 36 horas semanais"*. A pergunta dela continua a mesma: "Como votaram os deputados que me representam?"
