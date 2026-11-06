import http from './http.js';

const URL_BASE = '/fornecedores';

export async function listarFornecedores({ pesquisa, ativo } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      pesquisa: pesquisa || undefined,
      ativo,
    },
  });
  return resposta.data;
}

export async function obterFornecedor(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarFornecedor(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarFornecedor(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function inativarFornecedor(id) {
  await http.patch(`${URL_BASE}/${id}/inativar`);
}

export async function reativarFornecedor(id) {
  await http.patch(`${URL_BASE}/${id}/reativar`);
}
