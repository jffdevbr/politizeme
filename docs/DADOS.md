# Dados

Regra do projeto: **todo dado mostra de onde veio e se é real ou simulado.** Esta página é espelhada na tela `/sobre-os-dados` da aplicação.

- **REAL:** coletado de fonte oficial pública, com data de coleta. Pode ser conferido na fonte.
- **SIMULADO:** criado pelo grupo só para ilustrar uma funcionalidade cuja fonte real ainda não foi integrada. Nunca usa nomes de pessoas reais ligados a valores inventados.

## 1. Matriz real × simulado

| Conjunto | Origem | Fonte | Período |
| --- | --- | --- | --- |
| Deputados federais de SP em exercício | REAL | API Câmara v2 | legislatura 57 (2023–2027) |
| Senadores de SP | REAL | API Senado | mandatos atuais |
| Cota parlamentar dos deputados (CEAP) | REAL | Câmara – arquivo anual da cota | 2025 e 2026 (até a coleta) |
| Cota dos senadores (CEAPS) | REAL | Senado – transparência | 2025 e 2026 (até a coleta) |
| Votações nominais do plenário + votos dos deputados de SP + orientação dos partidos | REAL | API Câmara v2 | 20 votações de mérito mais recentes (2025–2026) |
| Participação nas votações | REAL (derivado) | Calculado a partir dos votos | votações selecionadas |
| Municípios de SP | REAL | IBGE – localidades | atual |
| CEP → município | REAL (consulta em tempo real) | ViaCEP | atual |
| Emendas parlamentares por município | **SIMULADO** | – (real: Portal da Transparência/CGU, exige chave de API) | – |
| Financiamento e gastos de campanha | **SIMULADO** | – (real: TSE, prestação de contas) | – |
| Resumo por IA das votações | REAL quando é a ementa oficial; marcado "Resumo por IA" quando gerado | Câmara + Claude (opcional) | – |
| Contas de usuário, quem cada um segue | Dados da própria aplicação | Banco do PolitizeMe | – |

"Participação" substitui "presença": a presença oficial em sessões exige outra coleta. O rótulo na tela explica o cálculo: *votou em X das Y votações selecionadas*.

## 2. Fontes reais

### 2.1 Câmara dos Deputados – Dados Abertos

- **Link:** https://dadosabertos.camara.leg.br/swagger/api.html
- **Endpoints:** `/deputados?siglaUf=SP`, `/deputados/{id}`, `/votacoes`, `/votacoes/{id}`, `/votacoes/{id}/votos`, `/votacoes/{id}/orientacoes`
- **Variáveis:** id, nome, partido, UF, foto, e-mail; data, descrição e proposição da votação; voto de cada deputado; orientação de cada partido/bloco.
- **Por que:** é a fonte oficial dos votos, o centro da funcionalidade "Votações explicadas".

### 2.2 Câmara – Cota para o Exercício da Atividade Parlamentar (CEAP)

- **Link:** `https://www.camara.leg.br/cotas/Ano-<ANO>.csv.zip` (2025 ≈ 7 MB, 2026 ≈ 4,7 MB compactados; ~48 MB descompactado)
- **Variáveis usadas:** `nuDeputadoId`, `txNomeParlamentar`, `sgUF`, `sgPartido`, `txtDescricao` (categoria), `txtFornecedor`, `txtCNPJCPF`, `datEmissao`, `vlrLiquido`, `numMes`, `numAno`, `urlDocumento` (link da nota fiscal).
- **Tratamento:** filtrar `sgUF = SP` e os deputados em exercício (cruzando `ideCadastro` com o id da API); descartar lideranças e ex-deputados; converter valores; manter valores negativos (estornos), que entram na soma; traduzir categorias para linguagem simples (ver 4.1); agregar por deputado × mês × categoria.
- **Por que:** responde "quanto meu representante gastou e com quê", com link para cada nota.

**Achados durante a coleta (18/11/2026)**

| Achado | Como tratamos |
| --- | --- |
| O arquivo anual de **2026 não inclui as passagens aéreas emitidas pelo SIGEPA** (sistema de passagens da própria Câmara); o de 2025 inclui. A API `/deputados/{id}/despesas` inclui. | O ETL detecta os anos sem nenhuma linha SIGEPA no arquivo e complementa só esses pela API (hoje, 2026), para não contar em dobro. |
| Na API, o campo `valorLiquido` vem **com sinal invertido** para documentos comuns (ex.: documento de R$ 301,61 sem glosa aparece como −301,61). | Usamos `valorDocumento − valorGlosa` em todas as fontes. |
| No arquivo anual, a **complementação do auxílio-moradia** (paga com saldo da cota, fornecedor = a própria Câmara) tem `vlrDocumento` positivo e `vlrLiquido` negativo, o que fazia deputados parecerem ter "gasto negativo". | Pela mesma regra (`documento − glosa`) ela entra como gasto da cota, na categoria "Auxílio-moradia". **Interpretação nossa**, a confirmar com a Câmara. |
| Ainda há meses com total negativo (ex.: set/2026, período eleitoral): cancelamentos de passagens reembolsados superam os gastos do mês. | Mantidos, porque é o dado oficial. A tela explica que valores negativos são estornos e cancelamentos. |
| Votações secretas (ex.: escolha de ministro do TCU) aparecem na API com votos sem valor (`null`). | Excluídas da seleção: não existe voto individual público. |
| De setembro a novembro de 2026 (período eleitoral) houve poucas votações nominais. | A seleção cobre 2025–2026 e pega as 20 mais recentes de mérito. |

### 2.3 Senado Federal – Dados Abertos e Transparência

- **Links:** `https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json` e `https://www.senado.leg.br/transparencia/LAI/verba/despesa_ceaps_<ANO>.csv`
- **Variáveis:** código, nome, partido, UF, foto; `ANO`, `MES`, `SENADOR`, `TIPO_DESPESA`, `CNPJ_CPF`, `FORNECEDOR`, `DATA`, `VALOR_REEMBOLSADO`.
- **Tratamento:** o CSV de despesas **não tem UF** e usa o nome parlamentar em caixa alta. Os 3 senadores de SP são identificados cruzando o nome normalizado (sem acento, caixa alta) com a lista oficial. Primeira linha do arquivo é a data de atualização e é descartada; valores com vírgula decimal.

### 2.4 IBGE e ViaCEP

- **IBGE:** `https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios` (645 municípios, código IBGE de 7 dígitos).
- **ViaCEP:** `https://viacep.com.br/ws/<CEP>/json/` devolve o município e o código IBGE. O CEP digitado **não é armazenado**; só o município, e só se a pessoa criar conta.

## 3. Camadas de armazenamento

| Camada | Onde | Conteúdo | Versionada no Git |
| --- | --- | --- | --- |
| Bruta | `data/raw/` | Arquivos exatamente como baixados | Não (grande e reproduzível) |
| Tratada | `data/snapshot/*.json` | Só SP, padronizado, agregado; cada registro com `origem`, `fonte`, `coletadoEm` | Sim |
| Modelo | PostgreSQL | Tabelas da aplicação, carregadas do snapshot pelo seed | Não (recriável) |

## 4. Modelo de dados (resumo)

Cada arquivo do snapshot vira um registro em `Conjunto` (origem REAL/SIMULADO, fonte, link, data de coleta, observação). É dali que saem os selos da interface e a página "Sobre os dados".

| Tabela | Principais campos |
| --- | --- |
| `Conjunto` | id (nome do arquivo), título, origem, fonte, fonteUrl, coletadoEm, observação, registros |
| `Parlamentar` | id, casa (CAMARA/SENADO), nome, partido, foto, email, página oficial |
| `DespesaMensal` | parlamentarId, ano, mês, categoria simples, valor (soma) |
| `Despesa` / `Fornecedor` | 20 despesas mais recentes e 5 principais fornecedores de cada parlamentar, com link da nota |
| `Votacao` | id, data, descrição, proposição, ementa, resumoIA (opcional), urlOficial |
| `Voto` | votacaoId, parlamentarId, voto (Sim/Não/Abstenção/Obstrução/Artigo 17) |
| `Orientacao` | votacaoId, partido/bloco, orientação |
| `Municipio` | codigoIbge, nome |
| `Emenda` | parlamentarId, municipioId, área, valor, **origem = SIMULADO** |
| `Campanha` | parlamentarId, receitas, despesas, **origem = SIMULADO** |
| `Usuario` | email, senhaHash, municipioId, canal, consentimentoEm, versaoTermo |
| `Seguindo` | usuarioId, parlamentarId, desde |

### 4.1 Categorias da cota em linguagem simples (exemplos)

| Categoria oficial | Como aparece no PolitizeMe |
| --- | --- |
| MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR | Escritório |
| COMBUSTÍVEIS E LUBRIFICANTES. | Combustível |
| PASSAGEM AÉREA - SIGEPA / RPA | Passagens aéreas |
| DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR. | Divulgação do mandato |
| LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES | Aluguel de veículos |
| TELEFONIA | Telefone |

O dicionário completo fica no ETL (`etl/categorias.py`) e a categoria oficial continua disponível em cada despesa.

## 5. Dados simulados: como são gerados

`etl/gerar_simulados.py` cria emendas e dados de campanha com semente fixa (resultado sempre igual), marcados `origem = SIMULADO`. **Os autores são fictícios** ("Deputada Exemplo A", "Senador Exemplo D"): um valor inventado nunca aparece ligado ao nome de um parlamentar real. Na interface aparecem com o selo **"Dado simulado – ilustrativo"** e um texto explicando qual seria a fonte real. Os valores são exibidos, mas nunca usados pelo Poli como fato.
