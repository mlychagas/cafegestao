const formatoArea = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

export function formatarArea(valor) {
  if (valor === null || valor === undefined) return '—';
  return `${formatoArea.format(valor)} ha`;
}

export function textoOuTraco(valor) {
  return valor ? valor : '—';
}