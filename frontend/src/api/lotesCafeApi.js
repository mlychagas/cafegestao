import http from './http.js';

const URL_BASE = '/lotes-cafe';

export async function listarLotesCafe({ pesquisa, safraId, formaProcessamento, ativo } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      pesquisa: pesquisa || undefined,
      safraId,
      formaProcessamento,
      ativo,
    },
  });
  return resposta.data;
}

export async function obterLoteCafe(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarLoteCafe(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarLoteCafe(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function inativarLoteCafe(id) {
  await http.patch(`${URL_BASE}/${id}/inativar`);
}

export async function reativarLoteCafe(id) {
  await http.patch(`${URL_BASE}/${id}/reativar`);
}
