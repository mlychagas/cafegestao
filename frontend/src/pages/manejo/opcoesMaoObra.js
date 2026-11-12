export const UNIDADES_MAO_OBRA = {
  Lata: { rotulo: 'Lata (latão)', sigla: 'lata' },
  Saca: { rotulo: 'Saca', sigla: 'sc' },
  Litro: { rotulo: 'Litro', sigla: 'L' },
  Quilograma: { rotulo: 'Quilograma', sigla: 'kg' },
  Hora: { rotulo: 'Hora', sigla: 'h' },
  Diaria: { rotulo: 'Diária', sigla: 'diária' },
};

export const OPCOES_UNIDADE_MAO_OBRA = Object.entries(UNIDADES_MAO_OBRA).map(([valor, unidade]) => ({
  value: valor,
  label: unidade.rotulo,
}));

export function siglaUnidadeMaoObra(unidade) {
  return UNIDADES_MAO_OBRA[unidade]?.sigla ?? '';
}

export function calcularSubtotal(quantidade, valorUnitario) {
  if (!quantidade || valorUnitario === null || valorUnitario === undefined) return 0;
  return Math.round(quantidade * valorUnitario * 100) / 100;
}

export function calcularTotal(itens) {
  return (itens ?? []).reduce((total, item) => total + calcularSubtotal(item.quantidade, item.valorUnitario), 0);
}

export function formatarValorUnitario(valor, unidade, formatarMoeda) {
  const sigla = siglaUnidadeMaoObra(unidade);
  return sigla ? `${formatarMoeda(valor)} / ${sigla}` : formatarMoeda(valor);
}
