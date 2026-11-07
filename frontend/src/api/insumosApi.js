import http from './http.js';

const URL_BASE = '/insumos';

export async function listarInsumos({ nome, categoria, ativo } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      nome: nome || undefined,
      categoria: categoria || undefined,
      ativo,
    },
  });
  return resposta.data;
}

export async function obterInsumo(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarInsumo(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarInsumo(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function inativarInsumo(id) {
  await http.patch(`${URL_BASE}/${id}/inativar`);
}

export async function reativarInsumo(id) {
  await http.patch(`${URL_BASE}/${id}/reativar`);
}
