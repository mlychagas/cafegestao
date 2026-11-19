import http from './http.js';

function urlInsumos(atividadeId) {
  return `/atividades-manejo/${atividadeId}/insumos`;
}

export async function listarInsumosAtividade(atividadeId) {
  const resposta = await http.get(urlInsumos(atividadeId));
  return resposta.data;
}

export async function salvarInsumosAtividade(atividadeId, itens) {
  const resposta = await http.put(urlInsumos(atividadeId), { itens });
  return resposta.data;
}
