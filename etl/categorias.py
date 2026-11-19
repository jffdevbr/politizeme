"""Tradução das categorias oficiais da cota parlamentar para linguagem simples.

A categoria oficial continua guardada em cada despesa; esta é só a forma de exibição.
"""
from comum import normalizar

# Câmara (CEAP) – chave normalizada (sem acento, caixa alta) -> categoria simples
CAMARA = {
    "MANUTENCAO DE ESCRITORIO DE APOIO A ATIVIDADE PARLAMENTAR": "Escritório",
    "COMBUSTIVEIS E LUBRIFICANTES.": "Combustível",
    "SERVICO DE TAXI, PEDAGIO E ESTACIONAMENTO": "Táxi, pedágio e estacionamento",
    "TELEFONIA": "Telefone",
    "DIVULGACAO DA ATIVIDADE PARLAMENTAR.": "Divulgação do mandato",
    "LOCACAO OU FRETAMENTO DE VEICULOS AUTOMOTORES": "Aluguel de veículos",
    "HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL.": "Hospedagem",
    "FORNECIMENTO DE ALIMENTACAO DO PARLAMENTAR": "Alimentação",
    "COMPLEMENTACAO DO AUXILIO-MORADIA": "Auxílio-moradia",
    "SERVICO DE SEGURANCA PRESTADO POR EMPRESA ESPECIALIZADA.": "Segurança",
    "SERVICOS POSTAIS": "Correios",
    "ASSINATURA DE PUBLICACOES": "Assinaturas",
    "PASSAGEM AEREA - REEMBOLSO": "Passagens aéreas",
    "PASSAGEM AEREA - RPA": "Passagens aéreas",
    "PASSAGEM AEREA - SIGEPA": "Passagens aéreas",
    "PASSAGENS TERRESTRES, MARITIMAS OU FLUVIAIS": "Passagens terrestres e outras",
    "CONSULTORIAS, PESQUISAS E TRABALHOS TECNICOS.": "Consultorias",
    "PARTICIPACAO EM CURSO, PALESTRA OU EVENTO SIMILAR": "Cursos e eventos",
    "LOCACAO OU FRETAMENTO DE AERONAVES": "Aluguel de aeronaves",
    "LOCACAO OU FRETAMENTO DE EMBARCACOES": "Aluguel de embarcações",
    "AQUISICAO DE TOKENS E CERTIFICADOS DIGITAIS": "Certificado digital",
}

# Senado (CEAPS) – começo do texto normalizado -> categoria simples
SENADO = [
    ("LOCOMOCAO, HOSPEDAGEM, ALIMENTACAO", "Locomoção, hospedagem e alimentação"),
    ("ALUGUEL DE IMOVEIS", "Escritório"),
    ("PASSAGENS AEREAS", "Passagens aéreas"),
    ("CONTRATACAO DE CONSULTORIAS", "Consultorias"),
    ("DIVULGACAO DA ATIVIDADE PARLAMENTAR", "Divulgação do mandato"),
    ("AQUISICAO DE MATERIAL DE CONSUMO", "Material de escritório"),
    ("SERVICOS DE SEGURANCA PRIVADA", "Segurança"),
]


def simples_camara(oficial: str) -> str:
    return CAMARA.get(normalizar(oficial), "Outros")


def simples_senado(oficial: str) -> str:
    n = normalizar(oficial)
    for prefixo, simples in SENADO:
        if n.startswith(prefixo):
            return simples
    return "Outros"
