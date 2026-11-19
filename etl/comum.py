"""Funções compartilhadas do ETL: HTTP com retry, caminhos e gravação do snapshot.

Só usa a biblioteca padrão do Python, para rodar em qualquer máquina sem instalar nada.
"""
import http.client
import json
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"
SNAPSHOT = RAIZ / "data" / "snapshot"
RAW.mkdir(parents=True, exist_ok=True)
SNAPSHOT.mkdir(parents=True, exist_ok=True)

COLETADO_EM = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
UA = {"Accept": "application/json", "User-Agent": "PolitizeMe-ETL/1.0 (projeto academico FIAP)"}


def get_json(url, tentativas=4, nao_encontrado=None):
    """GET com retry exponencial. Se `nao_encontrado` for dado, um 404 devolve esse valor."""
    for i in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404 and nao_encontrado is not None:
                return nao_encontrado
            if e.code < 500 and e.code != 429:
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError,
                http.client.IncompleteRead, json.JSONDecodeError):
            pass
        time.sleep(2 ** i)
    raise RuntimeError(f"Falha ao buscar {url}")


def baixar(url, destino: Path):
    """Baixa um arquivo para a camada bruta (data/raw), reaproveitando se já existir."""
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    print(f"  baixando {url}")
    req = urllib.request.Request(url, headers={"User-Agent": UA["User-Agent"]})
    with urllib.request.urlopen(req, timeout=300) as r, open(destino, "wb") as f:
        f.write(r.read())
    return destino


def normalizar(texto: str) -> str:
    """Caixa alta e sem acentos, para cruzar nomes entre bases."""
    sem_acento = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode()
    return " ".join(sem_acento.upper().split())


def para_float(valor: str) -> float:
    v = (valor or "0").strip()
    if "," in v:
        v = v.replace(".", "").replace(",", ".")
    return float(v or 0)


def gravar(nome: str, dados, *, origem: str, fonte: str, fonte_url: str, observacao: str = ""):
    """Grava data/snapshot/<nome>.json com os metadados de origem exigidos pelo projeto."""
    caminho = SNAPSHOT / f"{nome}.json"
    meta = {
        "origem": origem,
        "fonte": fonte,
        "fonteUrl": fonte_url,
        "coletadoEm": COLETADO_EM,
        "observacao": observacao,
        "registros": len(dados),
    }
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "dados": dados}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  -> {caminho.relative_to(RAIZ)} ({len(dados)} registros, {origem})")
