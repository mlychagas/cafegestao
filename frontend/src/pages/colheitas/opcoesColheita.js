export const UNIDADES_COLHEITA = {
  Quilograma: { rotulo: 'Quilograma (kg)', sigla: 'kg' },
  Tonelada: { rotulo: 'Tonelada (t)', sigla: 't' },
};

export function paraQuilogramas(quantidade, unidade) {
  if (!quantidade) return 0;
  return unidade === 'Tonelada' ? quantidade * 1000 : quantidade;
}

export const OPCOES_UNIDADE_COLHEITA = Object.entries(UNIDADES_COLHEITA).map(([valor, unidade]) => ({
  value: valor,
  label: unidade.rotulo,
}));

export function siglaUnidadeColheita(unidade) {
  return UNIDADES_COLHEITA[unidade]?.sigla ?? '';
}

export const SUGESTOES_FORMA_COLHEITA = ['Manual', 'Derriça no pano', 'Semimecanizada', 'Mecanizada'].map((forma) => ({
  value: forma,
}));

export const STATUS_ATIVIDADE_COM_COLHEITA = ['EmAndamento', 'Concluida'];
