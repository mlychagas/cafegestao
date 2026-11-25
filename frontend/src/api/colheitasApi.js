import http from './http.js';

const URL_BASE = '/colheitas';

export async function listarColheitas({ safraId, atividadeId, propriedadeId, dataInicio, dataFim } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      safraId,
      atividadeId,
      propriedadeId,
      dataInicio,
      dataFim,
    },
  });
  return resposta.data;
}

export async function obterColheita(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarColheita(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarColheita(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}
