import http from './http.js';

const URL_BASE = '/safras';

export async function listarSafras({ propriedadeId, anoAgricola, status } = {}) {
  const resposta = await http.get(URL_BASE, {
    params: {
      propriedadeId,
      anoAgricola: anoAgricola || undefined,
      status,
    },
  });
  return resposta.data;
}

export async function obterSafra(id) {
  const resposta = await http.get(`${URL_BASE}/${id}`);
  return resposta.data;
}

export async function cadastrarSafra(dados) {
  const resposta = await http.post(URL_BASE, dados);
  return resposta.data;
}

export async function atualizarSafra(id, dados) {
  await http.put(`${URL_BASE}/${id}`, dados);
}
