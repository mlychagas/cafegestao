import http from './http.js';

const URL_BASE = '/pessoas';

export async function listarPessoas({ pesquisa, ativo } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      pesquisa: pesquisa || undefined,
      ativo,
    },
  });
  return resposta.data;
}

export async function obterPessoa(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarPessoa(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarPessoa(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function inativarPessoa(id) {
  await http.patch(`${URL_BASE}/${id}/inativar`);
}

export async function reativarPessoa(id) {
  await http.patch(`${URL_BASE}/${id}/reativar`);
}
