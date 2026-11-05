import dayjs from 'dayjs';

const formatoArea = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

const formatoMedida = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

const formatoInteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function formatarArea(valor) {
  if (valor === null || valor === undefined) return '—';
  return `${formatoArea.format(valor)} ha`;
}

export function formatarData(valor) {
  if (!valor) return '—';
  return dayjs(valor).format('DD/MM/YYYY');
}

export function formatarEspacamento(linha, planta) {
  if (!linha && !planta) return '—';
  const textoLinha = linha ? formatoMedida.format(linha) : '—';
  const textoPlanta = planta ? formatoMedida.format(planta) : '—';
  return `${textoLinha} × ${textoPlanta} m`;
}

export function formatarInteiro(valor) {
  if (valor === null || valor === undefined) return '—';
  return formatoInteiro.format(valor);
}

export function textoOuTraco(valor) {
  return valor ? valor : '—';
}