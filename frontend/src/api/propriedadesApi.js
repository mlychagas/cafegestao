import http from './http.js';

const URL_BASE = '/propriedades';

export async function listarPropriedades({ nome, ativo } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      nome: nome || undefined,
      ativo,
    },
  });
  return resposta.data;
}

export async function obterPropriedade(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarPropriedade(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarPropriedade(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function inativarPropriedade(id) {
  await http.patch(`${URL_BASE}/${id}/inativar`);
}

export async function reativarPropriedade(id) {
  await http.patch(`${URL_BASE}/${id}/reativar`);
}