export const STATUS_ATIVIDADE = {
  Agendada: { rotulo: 'Agendada', cor: 'blue' },
  EmAndamento: { rotulo: 'Em andamento', cor: 'gold' },
  Concluida: { rotulo: 'Concluída', cor: 'green' },
  Cancelada: { rotulo: 'Cancelada', cor: undefined },
};

export const OPCOES_STATUS_ATIVIDADE = Object.entries(STATUS_ATIVIDADE).map(([valor, status]) => ({
  value: valor,
  label: status.rotulo,
}));

export const OPCOES_STATUS_EDITAVEIS = OPCOES_STATUS_ATIVIDADE.filter((opcao) => opcao.value !== 'Cancelada');

export const CONSEQUENCIA_CANCELAR_ATIVIDADE =
  'A atividade continuará no histórico, mas não poderá ser editada nem receber colheita até ser reaberta.';

export const CONSEQUENCIA_REABRIR_ATIVIDADE = 'A atividade voltará ao status Agendada e poderá ser editada.';

export function rotuloSafra(safra) {
  return `${safra.anoAgricola} · ${safra.nomePropriedade}`;
}
