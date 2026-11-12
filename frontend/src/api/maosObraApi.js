import http from './http.js';

function urlMaoObra(atividadeId) {
  return `/atividades-manejo/${atividadeId}/mao-obra`;
}

export async function listarMaoObra(atividadeId) {
  const resposta = await http.get(urlMaoObra(atividadeId));
  return resposta.data;
}

export async function salvarMaoObra(atividadeId, itens) {
  const resposta = await http.put(urlMaoObra(atividadeId), { itens });
  return resposta.data;
}
