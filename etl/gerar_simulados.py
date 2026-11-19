"""Gera os dados SIMULADOS do MVP: emendas por município e um exemplo de prestação de contas de campanha.

Regra: dados simulados NUNCA são associados a parlamentares reais. Os autores são fictícios
("Deputada Exemplo A"), como no protótipo. A semente é fixa para o resultado ser sempre o mesmo.
"""
import random

from comum import gravar

AUTORES = ["Deputada Exemplo A", "Deputado Exemplo B", "Deputada Exemplo C", "Senador Exemplo D"]
AREAS = ["Saúde", "Educação", "Infraestrutura urbana", "Assistência social", "Agricultura", "Esporte e lazer"]
OBS = ("Dado SIMULADO para ilustrar a funcionalidade. Autores e valores são fictícios. "
       "Fonte real prevista: Portal da Transparência (CGU) – emendas parlamentares por município.")


def emendas(municipios):
    rnd = random.Random(2026)
    saida = []
    for m in municipios:
        for _ in range(rnd.choice([0, 1, 1, 2, 3])):
            valor = rnd.choice([100, 150, 200, 250, 300, 500, 750, 1000]) * 1000
            empenhado = round(valor * rnd.choice([1, 1, 0.8, 0.5]), 2)
            saida.append({
                "municipioIbge": m["codigoIbge"],
                "autor": rnd.choice(AUTORES),
                "area": rnd.choice(AREAS),
                "ano": rnd.choice([2025, 2026]),
                "valorIndicado": float(valor),
                "valorPago": round(empenhado * rnd.choice([1, 0.6, 0.3, 0]), 2),
            })
    return saida


def campanha():
    return [
        {"autor": "Deputada Exemplo A", "tipo": "receita", "categoria": "Fundo eleitoral (FEFC)", "valor": 1_200_000.0},
        {"autor": "Deputada Exemplo A", "tipo": "receita", "categoria": "Fundo partidário", "valor": 300_000.0},
        {"autor": "Deputada Exemplo A", "tipo": "receita", "categoria": "Pessoas físicas", "valor": 180_000.0},
        {"autor": "Deputada Exemplo A", "tipo": "receita", "categoria": "Recursos próprios", "valor": 50_000.0},
        {"autor": "Deputada Exemplo A", "tipo": "despesa", "categoria": "Publicidade e material", "valor": 820_000.0},
        {"autor": "Deputada Exemplo A", "tipo": "despesa", "categoria": "Pessoal", "valor": 410_000.0},
        {"autor": "Deputada Exemplo A", "tipo": "despesa", "categoria": "Eventos e deslocamento", "valor": 260_000.0},
        {"autor": "Deputada Exemplo A", "tipo": "despesa", "categoria": "Outros", "valor": 140_000.0},
    ]


def executar(municipios):
    print("Simulados")
    gravar("emendas_simuladas", emendas(municipios), origem="SIMULADO", fonte="Simulação PolitizeMe",
           fonte_url="https://portaldatransparencia.gov.br/emendas", observacao=OBS)
    gravar("campanha_simulada", campanha(), origem="SIMULADO", fonte="Simulação PolitizeMe",
           fonte_url="https://dadosabertos.tse.jus.br/",
           observacao="Dado SIMULADO: exemplo genérico de prestação de contas. Fonte real prevista: TSE.")
