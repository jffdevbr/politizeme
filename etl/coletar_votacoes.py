"""Coleta votações nominais de mérito do plenário da Câmara, os votos dos deputados de SP e a orientação dos partidos.

Critério de seleção (documentado em docs/DADOS.md):
  - órgão: Plenário (id 180), 2025 e 2026;
  - nominal: a descrição traz o placar ("Sim: N");
  - de mérito: aprovação/rejeição de projeto, PEC, MP, substitutivo ou redação final;
    requerimentos, destaques e emendas avulsas ficam de fora porque confundem quem não acompanha o processo;
  - votações secretas (sem voto individual público) ficam de fora;
  - uma votação por proposição (a mais recente), até LIMITE votações.
"""
import re
import time
from collections import Counter

from comum import get_json, gravar

API = "https://dadosabertos.camara.leg.br/api/v2"
LIMITE = 20
JANELAS = [
    ("2026-10-01", "2026-12-31"), ("2026-07-01", "2026-09-30"),
    ("2026-04-01", "2026-06-30"), ("2026-01-01", "2026-03-31"),
    ("2025-10-01", "2025-12-31"), ("2025-07-01", "2025-09-30"),
    ("2025-04-01", "2025-06-30"), ("2025-01-01", "2025-03-31"),
]
PLACAR = re.compile(r"Sim:\s*\d+")
MERITO = re.compile(
    r"Projeto de Lei|Proposta de Emenda|Medida Provis|Substitutivo|Projeto de Decreto|Reda[çc][ãa]o Final",
    re.I,
)
EXCLUIR = re.compile(r"Requerimento|Destaque|Emenda n|Emendas? de Plen|Emenda Aglutinativa|Parecer", re.I)


def listar_candidatas():
    candidatas = []
    for ini, fim in JANELAS:
        pagina = 1
        while True:
            url = (f"{API}/votacoes?idOrgao=180&dataInicio={ini}&dataFim={fim}"
                   f"&itens=100&pagina={pagina}&ordem=DESC&ordenarPor=dataHoraRegistro")
            dados = get_json(url, nao_encontrado={"dados": []})["dados"]
            for v in dados:
                d = v.get("descricao") or ""
                if PLACAR.search(d) and MERITO.search(d) and not EXCLUIR.search(d):
                    candidatas.append(v)
            if len(dados) < 100:
                break
            pagina += 1
            time.sleep(0.3)
    return candidatas


def detalhar(v, ids_sp):
    det = get_json(f"{API}/votacoes/{v['id']}")["dados"]
    props = det.get("proposicoesAfetadas") or []
    efeitos = det.get("efeitosRegistrados") or []
    prop = props[0] if props else {}
    titulo = (efeitos[0].get("tituloProposicao") if efeitos else None) or (
        f"{prop.get('siglaTipo')} {prop.get('numero')}/{prop.get('ano')}" if prop else None)
    votos_todos = get_json(f"{API}/votacoes/{v['id']}/votos", nao_encontrado={"dados": []})["dados"]
    orient = get_json(f"{API}/votacoes/{v['id']}/orientacoes", nao_encontrado={"dados": []})["dados"]

    placar = Counter(x["tipoVoto"] for x in votos_todos)
    if None in placar:
        return None  # votação secreta (ex.: escolha de autoridades): não há voto individual público
    votos_sp = [
        {"votacaoId": v["id"], "parlamentarId": ids_sp[str(x["deputado_"]["id"])],
         "voto": x["tipoVoto"], "partidoNaEpoca": x["deputado_"].get("siglaPartido")}
        for x in votos_todos
        if x["deputado_"].get("siglaUf") == "SP" and str(x["deputado_"]["id"]) in ids_sp
    ]
    votacao = {
        "id": v["id"],
        "data": v["data"],
        "descricao": v["descricao"],
        "aprovada": bool(det.get("aprovacao")),
        "proposicao": titulo,
        "proposicaoId": prop.get("id"),
        "ementa": prop.get("ementa"),
        "urlOficial": (f"https://www.camara.leg.br/propostas-legislativas/{prop['id']}" if prop.get("id")
                       else f"https://www.camara.leg.br/busca-portal?contextoBusca=BuscaProposicoes&q={v['id']}"),
        "placar": dict(placar),
        "totalVotosSP": sum(1 for x in votos_todos if x["deputado_"].get("siglaUf") == "SP"),
    }
    orientacoes = [
        {"votacaoId": v["id"], "sigla": o.get("siglaPartidoBloco"), "orientacao": o.get("orientacaoVoto")}
        for o in orient if o.get("siglaPartidoBloco")
    ]
    return votacao, votos_sp, orientacoes


def executar(deputados):
    print("Votações")
    ids_sp = {d["idOficial"]: d["id"] for d in deputados}
    candidatas = listar_candidatas()
    print(f"  {len(candidatas)} votações nominais de mérito encontradas")
    votacoes, votos, orientacoes, vistas = [], [], [], set()
    for v in candidatas:
        if len(votacoes) >= LIMITE:
            break
        resultado = detalhar(v, ids_sp)
        if resultado is None:
            continue
        votacao, vs, os_ = resultado
        chave = votacao["proposicaoId"] or votacao["proposicao"] or v["id"]
        if chave in vistas or not vs:
            continue
        vistas.add(chave)
        votacoes.append(votacao)
        votos.extend(vs)
        orientacoes.extend(os_)
        time.sleep(0.3)
    fonte = "Câmara dos Deputados – Dados Abertos (votações do Plenário)"
    url = "https://dadosabertos.camara.leg.br/api/v2/votacoes"
    obs = "Votações nominais de mérito do Plenário em 2025–2026; uma por proposição, as mais recentes."
    gravar("votacoes", votacoes, origem="REAL", fonte=fonte, fonte_url=url, observacao=obs)
    gravar("votos", votos, origem="REAL", fonte=fonte, fonte_url=url,
           observacao="Votos dos deputados de SP em exercício na data da coleta.")
    gravar("orientacoes", orientacoes, origem="REAL", fonte=fonte, fonte_url=url, observacao=obs)
