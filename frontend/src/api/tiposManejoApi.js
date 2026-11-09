import http from './http.js';

const URL_BASE = '/tipos-manejo';

export async function listarTiposManejo({ nome } = {}) {
  const resposta = await http.get(URL_BASE, { params: { nome: nome || undefined } });
  return resposta.data;
}

export async function cadastrarTipoManejo(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarTipoManejo(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}

export async function excluirTipoManejo(id) {
  await http.delete(`${URL_BASE}/${id}`);
}
