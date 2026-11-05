function somenteDigitos(valor) {
  return (valor ?? '').replace(/\D/g, '');
}

export function mascararCpf(valor) {
  const d = somenteDigitos(valor).slice(0, 11);

  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascararCep(valor) {
  const d = somenteDigitos(valor).slice(0, 8);

  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function mascararTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);

  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;

  const ddd = d.slice(0, 2);
  const numero = d.slice(2);
  const antesDoHifen = d.length === 11 ? 5 : 4;

  if (numero.length <= antesDoHifen) return `(${ddd}) ${numero}`;
  return `(${ddd}) ${numero.slice(0, antesDoHifen)}-${numero.slice(antesDoHifen)}`;
}

export const REGEX_CPF = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const REGEX_CEP = /^\d{5}-\d{3}$/;
export const REGEX_TELEFONE = /^\(\d{2}\) \d{4,5}-\d{4}$/;