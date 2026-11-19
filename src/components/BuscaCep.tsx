"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Municipio = { codigoIbge: string; nome: string };

// O CEP é consultado direto do navegador no ViaCEP e NÃO é enviado ao servidor do PolitizeMe (LGPD: minimização).
export function BuscaCep({ municipios }: { municipios: Municipio[] }) {
  const router = useRouter();
  const [cep, setCep] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function irPara(codigoIbge: string) {
    fetch("/api/uso", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tipo: "busca_municipio", municipioIbge: codigoIbge }),
    }).catch(() => {});
    router.push(`/minha-cidade?m=${codigoIbge}`);
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) {
      setErro("Digite os 8 números do CEP.");
      return;
    }
    setCarregando(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const d = await r.json();
      if (d.erro) setErro("Não encontramos esse CEP. Confira os números ou escolha o município na lista.");
      else if (d.uf !== "SP")
        setErro(`Esse CEP é de ${d.localidade} (${d.uf}). Por enquanto o PolitizeMe acompanha só o estado de São Paulo.`);
      else irPara(d.ibge);
    } catch {
      setErro("Não consegui consultar o CEP agora. Escolha o município na lista abaixo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={buscar} className="flex flex-col gap-2 sm:flex-row" aria-describedby="cep-ajuda">
        <label htmlFor="cep" className="sr-only">
          CEP
        </label>
        <input
          id="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Digite seu CEP, ex.: 08010-000"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          className="campo sm:max-w-xs"
        />
        <button className="botao" disabled={carregando}>
          {carregando ? "Buscando..." : "Ver meus representantes"}
        </button>
      </form>
      <p id="cep-ajuda" className="text-sm text-tinta-suave">
        O CEP serve só para descobrir sua cidade. Ele não é guardado.
      </p>
      {erro && (
        <p role="alert" className="rounded-md bg-argila-suave px-3 py-2 text-sm text-argila">
          {erro}
        </p>
      )}
      <div>
        <label htmlFor="municipio" className="mb-1 block text-sm font-semibold">
          Ou escolha o município
        </label>
        <select
          id="municipio"
          className="campo sm:max-w-xs"
          defaultValue=""
          onChange={(e) => e.target.value && irPara(e.target.value)}
        >
          <option value="" disabled>
            Selecione...
          </option>
          {municipios.map((m) => (
            <option key={m.codigoIbge} value={m.codigoIbge}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
