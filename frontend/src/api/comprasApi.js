import http from './http.js';

const URL_BASE = '/compras';

export async function listarCompras({ pesquisa, fornecedorId, dataInicio, dataFim } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      pesquisa: pesquisa || undefined,
      fornecedorId,
      dataInicio,
      dataFim,
    },
  });
  return resposta.data;
}

export async function obterCompra(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarCompra(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarCompra(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}
