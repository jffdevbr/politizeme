"""Coleta os 645 municípios do estado de SP (IBGE)."""
from comum import get_json, gravar


def executar():
    print("Municípios")
    dados = get_json("https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios")
    municipios = sorted(({"codigoIbge": str(m["id"]), "nome": m["nome"]} for m in dados), key=lambda m: m["nome"])
    gravar("municipios", municipios, origem="REAL", fonte="IBGE – API de localidades",
           fonte_url="https://servicodados.ibge.gov.br/api/docs/localidades",
           observacao="Municípios do estado de São Paulo (código IBGE 35).")
    return municipios
