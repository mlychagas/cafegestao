import http from './http.js';

const URL_BASE = '/atividades-manejo';

export async function listarAtividadesManejo({ pesquisa, safraId, tipoManejoId, status, dataInicio, dataFim } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      pesquisa: pesquisa || undefined,
      safraId,
      tipoManejoId,
      status,
      dataInicio,
      dataFim,
    },
  });
  return resposta.data;
}

export async function obterAtividadeManejo(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarAtividadeManejo(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarAtividadeManejo(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function cancelarAtividadeManejo(id) {
  await http.patch(`${URL_BASE}/${id}/cancelar`);
}

export async function reabrirAtividadeManejo(id) {
  await http.patch(`${URL_BASE}/${id}/reabrir`);
}
