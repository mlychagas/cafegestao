export const OPCOES_CATEGORIA = [
  { value: 'Adubo', label: 'Adubo' },
  { value: 'Defensivo', label: 'Defensivo' },
  { value: 'Corretivo', label: 'Corretivo' },
  { value: 'Fertilizante', label: 'Fertilizante' },
];

export const UNIDADES = {
  Quilograma: { nome: 'Quilograma', sigla: 'kg' },
  Grama: { nome: 'Grama', sigla: 'g' },
  Litro: { nome: 'Litro', sigla: 'L' },
  Mililitro: { nome: 'Mililitro', sigla: 'mL' },
  Unidade: { nome: 'Unidade', sigla: 'un' },
  Saco: { nome: 'Saco', sigla: 'sc' },
};

export const OPCOES_UNIDADE = Object.entries(UNIDADES).map(([valor, unidade]) => ({
  value: valor,
  label: `${unidade.nome} (${unidade.sigla})`,
}));

export function siglaUnidade(unidade) {
  return UNIDADES[unidade]?.sigla ?? '';
}
