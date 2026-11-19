"""Coleta a cota parlamentar: CEAP (Câmara) e CEAPS (Senado), filtrada para os parlamentares de SP.

Grava três visões por casa:
  - cota_<casa>_mensal:       parlamentar × ano × mês × categoria simples (soma)
  - cota_<casa>_recentes:     as 20 despesas mais recentes de cada parlamentar
  - cota_<casa>_fornecedores: os 5 fornecedores com maior valor somado de cada parlamentar
"""
import csv
import io
import zipfile
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from categorias import simples_camara, simples_senado
from comum import RAW, baixar, get_json, gravar, normalizar, para_float

ANOS = [2025, 2026]


def _agregar(linhas):
    """linhas: dicts com parlamentarId, ano, mes, data, categoria, categoriaOficial, fornecedor, cnpjCpf, valor, urlDocumento."""
    mensal = defaultdict(float)
    por_parlamentar = defaultdict(list)
    fornecedores = defaultdict(lambda: {"total": 0.0, "qtd": 0, "nome": ""})
    for l in linhas:
        mensal[(l["parlamentarId"], l["ano"], l["mes"], l["categoria"])] += l["valor"]
        por_parlamentar[l["parlamentarId"]].append(l)
        f = fornecedores[(l["parlamentarId"], l["cnpjCpf"] or l["fornecedor"])]
        f["total"] += l["valor"]
        f["qtd"] += 1
        f["nome"] = l["fornecedor"]
        f["cnpjCpf"] = l["cnpjCpf"]

    mensal_lista = [
        {"parlamentarId": p, "ano": a, "mes": m, "categoria": c, "valor": round(v, 2)}
        for (p, a, m, c), v in sorted(mensal.items())
    ]
    recentes = []
    for p, ls in por_parlamentar.items():
        ls.sort(key=lambda x: (x["data"] or "", x["valor"]), reverse=True)
        recentes.extend(ls[:20])
    top = defaultdict(list)
    for (p, _), f in fornecedores.items():
        top[p].append({"parlamentarId": p, "fornecedor": f["nome"], "cnpjCpf": f["cnpjCpf"],
                       "total": round(f["total"], 2), "qtd": f["qtd"]})
    fornecedores_lista = []
    for p, fs in top.items():
        fs.sort(key=lambda x: x["total"], reverse=True)
        fornecedores_lista.extend(fs[:5])
    return mensal_lista, recentes, fornecedores_lista


def camara(deputados):
    ids = {d["idOficial"]: d["id"] for d in deputados}
    linhas, ignoradas = [], 0
    for ano in ANOS:
        zip_path = baixar(f"https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip", RAW / f"cota_camara_{ano}.zip")
        with zipfile.ZipFile(zip_path) as z:
            nome = next(n for n in z.namelist() if n.endswith(".csv"))
            texto = io.TextIOWrapper(z.open(nome), encoding="utf-8-sig")
            for r in csv.DictReader(texto, delimiter=";"):
                if r["sgUF"] != "SP":
                    continue
                pid = ids.get(r["ideCadastro"]) or ids.get(r["nuDeputadoId"])
                if not pid:
                    ignoradas += 1  # deputado de SP que não está mais em exercício
                    continue
                linhas.append({
                    "parlamentarId": pid,
                    "ano": int(r["numAno"]),
                    "mes": int(r["numMes"]),
                    "data": (r["datEmissao"] or "")[:10] or None,
                    "categoria": simples_camara(r["txtDescricao"]),
                    "categoriaOficial": r["txtDescricao"],
                    "fornecedor": r["txtFornecedor"].strip(),
                    "cnpjCpf": r["txtCNPJCPF"].strip(),
                    "valor": para_float(r["vlrLiquido"]),
                    "urlDocumento": r["urlDocumento"] or None,
                })
    print(f"  Câmara: {len(linhas)} despesas de SP; {ignoradas} de ex-deputados ignoradas")
    sigepa = passagens_sigepa(deputados)
    print(f"  Câmara: {len(sigepa)} passagens aéreas SIGEPA complementadas pela API")
    return linhas + sigepa


def passagens_sigepa(deputados):
    """O arquivo anual não traz as passagens emitidas pelo sistema SIGEPA da Câmara; a API traz.

    Na API o campo valorLiquido vem com o sinal invertido para documentos comuns, então usamos
    valorDocumento - valorGlosa, que confere com o arquivo anual nas demais categorias.
    """
    def do_deputado(d, ano):
        saida, pagina = [], 1
        while True:
            url = (f"https://dadosabertos.camara.leg.br/api/v2/deputados/{d['idOficial']}/despesas"
                   f"?ano={ano}&itens=100&pagina={pagina}")
            dados = get_json(url, nao_encontrado={"dados": []})["dados"]
            for x in dados:
                if "SIGEPA" not in (x.get("tipoDespesa") or ""):
                    continue
                saida.append({
                    "parlamentarId": d["id"],
                    "ano": int(x["ano"]),
                    "mes": int(x["mes"]),
                    "data": (x.get("dataDocumento") or "")[:10] or None,
                    "categoria": simples_camara(x["tipoDespesa"]),
                    "categoriaOficial": x["tipoDespesa"],
                    "fornecedor": (x.get("nomeFornecedor") or "").strip(),
                    "cnpjCpf": (x.get("cnpjCpfFornecedor") or "").strip(),
                    "valor": round(float(x.get("valorDocumento") or 0) - float(x.get("valorGlosa") or 0), 2),
                    "urlDocumento": x.get("urlDocumento") or None,
                })
            if len(dados) < 100:
                return saida
            pagina += 1

    tarefas = [(d, ano) for d in deputados for ano in ANOS]
    linhas = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        for resultado in ex.map(lambda t: do_deputado(*t), tarefas):
            linhas.extend(resultado)
    return linhas


def senado(senadores):
    por_nome = {normalizar(s["nome"]): s["id"] for s in senadores}
    linhas = []
    for ano in ANOS:
        caminho = baixar(f"https://www.senado.leg.br/transparencia/LAI/verba/despesa_ceaps_{ano}.csv",
                         RAW / f"cota_senado_{ano}.csv")
        with open(caminho, encoding="latin-1") as f:
            next(f)  # primeira linha: "ULTIMA ATUALIZACAO"
            for r in csv.DictReader(f, delimiter=";"):
                pid = por_nome.get(normalizar(r["SENADOR"]))
                if not pid:
                    continue
                try:
                    data = datetime.strptime(r["DATA"], "%d/%m/%Y").strftime("%Y-%m-%d")
                except ValueError:
                    data = None
                linhas.append({
                    "parlamentarId": pid,
                    "ano": int(r["ANO"]),
                    "mes": int(r["MES"]),
                    "data": data,
                    "categoria": simples_senado(r["TIPO_DESPESA"]),
                    "categoriaOficial": r["TIPO_DESPESA"].strip(),
                    "fornecedor": r["FORNECEDOR"].strip(),
                    "cnpjCpf": r["CNPJ_CPF"].strip(),
                    "valor": para_float(r["VALOR_REEMBOLSADO"]),
                    "urlDocumento": None,
                })
    print(f"  Senado: {len(linhas)} despesas dos senadores de SP")
    return linhas


def executar(deputados, senadores):
    print("Cotas parlamentares")
    fontes = {
        "camara": ("Câmara dos Deputados – Cota parlamentar (CEAP)",
                   "https://www.camara.leg.br/transparencia/gastos-parlamentares", camara(deputados)),
        "senado": ("Senado Federal – Cota parlamentar (CEAPS)",
                   "https://www12.senado.leg.br/transparencia/sen/gastos-dos-senadores", senado(senadores)),
    }
    obs = ("Valores líquidos de 2025 e 2026 até a data da coleta. Valores negativos são estornos e "
           "entram na soma. Câmara: arquivo anual + passagens SIGEPA complementadas pela API.")
    for casa, (fonte, url, linhas) in fontes.items():
        mensal, recentes, fornecedores = _agregar(linhas)
        gravar(f"cota_{casa}_mensal", mensal, origem="REAL", fonte=fonte, fonte_url=url, observacao=obs)
        gravar(f"cota_{casa}_recentes", recentes, origem="REAL", fonte=fonte, fonte_url=url, observacao=obs)
        gravar(f"cota_{casa}_fornecedores", fornecedores, origem="REAL", fonte=fonte, fonte_url=url, observacao=obs)
