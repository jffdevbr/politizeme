"""Executa o ETL completo: fontes oficiais -> data/raw -> data/snapshot.

Uso:  python etl/executar_tudo.py
Depois, recarregue o banco com:  docker compose exec app npm run db:seed -- --force
"""
import coletar_cotas
import coletar_ibge
import coletar_parlamentares
import coletar_votacoes
import gerar_simulados

if __name__ == "__main__":
    deputados, senadores = coletar_parlamentares.executar()
    municipios = coletar_ibge.executar()
    coletar_cotas.executar(deputados, senadores)
    coletar_votacoes.executar(deputados)
    gerar_simulados.executar(municipios)
    print("ETL concluído.")
