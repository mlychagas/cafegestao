import http from "./http.js";

export async function login(dados) {
    const resposta = await http.post('/auth/login', dados);
    return resposta.data;
}
export async function cadastrar(dados) {
    const resposta = await http.post('/auth/cadastro', dados);
    return resposta.data;
}

export async function obterUsuarioLogado() {
    const resposta = await http.get('/auth/me');
    return resposta.data;
}

export async function logout() {
    const resposta = await http.post('/auth/logout');
    return resposta.data;
}