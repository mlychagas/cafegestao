export const UNIDADES_COLHEITA = {
  Litro: { rotulo: 'Litro', sigla: 'L' },
  Lata: { rotulo: 'Lata (latão)', sigla: 'lata' },
  Saca: { rotulo: 'Saca', sigla: 'sc' },
  Quilograma: { rotulo: 'Quilograma', sigla: 'kg' },
};

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
