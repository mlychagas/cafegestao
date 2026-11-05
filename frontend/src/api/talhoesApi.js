import http from './http.js';

const URL_BASE = '/talhoes';

export async function listarTalhoes({ propriedadeId, nome, ativo } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      propriedadeId,
      nome: nome || undefined,
      ativo,
    },
  });
  return resposta.data;
}

export async function obterTalhao(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarTalhao(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarTalhao(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function inativarTalhao(id) {
  await http.patch(`${URL_BASE}/${id}/inativar`);
}

export async function reativarTalhao(id) {
  await http.patch(`${URL_BASE}/${id}/reativar`);
}