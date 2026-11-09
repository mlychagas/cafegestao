export const STATUS_SAFRA = {
  Planejada: { rotulo: 'Planejada', cor: 'blue' },
  EmAndamento: { rotulo: 'Em andamento', cor: 'green' },
  Encerrada: { rotulo: 'Encerrada', cor: undefined },
};

export const OPCOES_STATUS_SAFRA = Object.entries(STATUS_SAFRA).map(([valor, status]) => ({
  value: valor,
  label: status.rotulo,
}));

export const UNIDADES_PRODUTIVIDADE = {
  SacasPorHectare: { nome: 'Sacas por hectare', sigla: 'sc/ha' },
  Sacas: { nome: 'Sacas (60 kg)', sigla: 'sc' },
  Quilogramas: { nome: 'Quilogramas', sigla: 'kg' },
  Toneladas: { nome: 'Toneladas', sigla: 't' },
};

export const OPCOES_UNIDADE_PRODUTIVIDADE = Object.entries(UNIDADES_PRODUTIVIDADE).map(([valor, unidade]) => ({
  value: valor,
  label: `${unidade.nome} (${unidade.sigla})`,
}));

export function siglaProdutividade(unidade) {
  return UNIDADES_PRODUTIVIDADE[unidade]?.sigla ?? '';
}
