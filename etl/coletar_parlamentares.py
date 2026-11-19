"""Coleta os deputados federais de SP em exercício (Câmara) e os senadores de SP (Senado)."""
from comum import get_json, gravar

CAMARA = "https://dadosabertos.camara.leg.br/api/v2"
SENADO = "https://legis.senado.leg.br/dadosabertos"


def deputados():
    dados = get_json(f"{CAMARA}/deputados?siglaUf=SP&itens=100&ordem=ASC&ordenarPor=nome")["dados"]
    return [
        {
            "id": f"camara-{d['id']}",
            "idOficial": str(d["id"]),
            "casa": "CAMARA",
            "cargo": "Deputado(a) federal",
            "nome": d["nome"],
            "partido": d["siglaPartido"],
            "uf": d["siglaUf"],
            "foto": d["urlFoto"],
            "email": d.get("email"),
            "paginaOficial": f"https://www.camara.leg.br/deputados/{d['id']}",
        }
        for d in dados
    ]


def senadores():
    lista = get_json(f"{SENADO}/senador/lista/atual.json")
    parlamentares = lista["ListaParlamentarEmExercicio"]["Parlamentares"]["Parlamentar"]
    saida = []
    for p in parlamentares:
        i = p["IdentificacaoParlamentar"]
        if i.get("UfParlamentar") != "SP":
            continue
        saida.append(
            {
                "id": f"senado-{i['CodigoParlamentar']}",
                "idOficial": str(i["CodigoParlamentar"]),
                "casa": "SENADO",
                "cargo": "Senador(a)",
                "nome": i["NomeParlamentar"],
                "partido": i.get("SiglaPartidoParlamentar"),
                "uf": "SP",
                "foto": i.get("UrlFotoParlamentar"),
                "email": i.get("EmailParlamentar"),
                "paginaOficial": i.get("UrlPaginaParlamentar")
                or f"https://www25.senado.leg.br/web/senadores/senador/-/perfil/{i['CodigoParlamentar']}",
            }
        )
    return saida


def executar():
    print("Parlamentares")
    deps = deputados()
    gravar("deputados", deps, origem="REAL", fonte="Câmara dos Deputados – Dados Abertos",
           fonte_url="https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf=SP",
           observacao="Deputados federais de SP em exercício na data da coleta (legislatura 57, 2023–2027).")
    sens = senadores()
    gravar("senadores", sens, origem="REAL", fonte="Senado Federal – Dados Abertos",
           fonte_url="https://legis.senado.leg.br/dadosabertos/senador/lista/atual",
           observacao="Senadores de SP em exercício na data da coleta.")
    return deps, sens


if __name__ == "__main__":
    executar()
