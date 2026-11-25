import { paraQuilogramas } from '../colheitas/opcoesColheita.js';

export const FORMAS_PROCESSAMENTO = {
  ViaSeca: { rotulo: 'Via seca', detalhe: 'Natural / café de terreiro' },
  ViaUmida: { rotulo: 'Via úmida', detalhe: 'Despolpado / lavado' },
  Semiumido: { rotulo: 'Semiúmido', detalhe: 'Cereja descascado' },
};

export const OPCOES_PROCESSAMENTO = Object.entries(FORMAS_PROCESSAMENTO).map(([valor, forma]) => ({
  value: valor,
  label: `${forma.rotulo} (${forma.detalhe})`,
}));

export function rotuloProcessamento(forma) {
  return FORMAS_PROCESSAMENTO[forma]?.rotulo ?? forma;
}

export const CONSEQUENCIA_INATIVAR_LOTE = 'O lote não aparecerá para novas vendas. Os dados serão mantidos.';

export const CONSEQUENCIA_REATIVAR_LOTE = 'O lote voltará a ficar disponível para novas vendas.';

export function calcularRendimento(totalLotesKg, totalColhidoKg) {
  if (!totalColhidoKg) return null;
  return (totalLotesKg / totalColhidoKg) * 100;
}

export function formatarPercentual(valor) {
  if (valor === null || valor === undefined) return '—';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)}%`;
}

export function pesoDoLoteKg(lote) {
  return paraQuilogramas(lote.quantidade, lote.unidadeMedida);
}
