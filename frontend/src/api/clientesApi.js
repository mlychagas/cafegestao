import http from './http.js';

const URL_BASE = '/clientes';

export async function listarClientes({ pesquisa, ativo } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      pesquisa: pesquisa || undefined,
      ativo,
    },
  });
  return resposta.data;
}

export async function obterCliente(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarCliente(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarCliente(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function inativarCliente(id) {
  await http.patch(`${URL_BASE}/${id}/inativar`);
}

export async function reativarCliente(id) {
  await http.patch(`${URL_BASE}/${id}/reativar`);
}
