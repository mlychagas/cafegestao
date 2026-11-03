export function tratarErroApi(erro) {
    if (!erro.response) {
        return "Não foi possível conectar ao servidor. Tente novamente mais tarde.";
    }
    if (erro.response.data?.mensagem) {
        return erro.response.data.mensagem;
    }
    if(erro.response.data?.errors){
        return Object.values(erro.response.data.errors).flat().join(', ');
    }
    return "Ocorreu um erro inesperado.";
} 