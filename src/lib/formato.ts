export const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const reaisCentavos = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const reaisCompacto = (v: number) =>
  v >= 1_000_000
    ? `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`
    : v >= 1_000
      ? `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`
      : reais(v);

export const data = (d: Date | string) =>
  new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
