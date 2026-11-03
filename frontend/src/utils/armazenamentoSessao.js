const CHAVE_TOKEN = 'cafegestao.token';
const CHAVE_EXPIRACAO = 'cafegestao.expiracao';

export function obterToken(){
    return localStorage.getItem(CHAVE_TOKEN);
}

export function salvarSessao(token, expiracao) {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_EXPIRACAO, expiracao);
}

export function limparSessao() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_EXPIRACAO);
}

export function obterExpiracao() {
    return localStorage.getItem(CHAVE_EXPIRACAO);
}