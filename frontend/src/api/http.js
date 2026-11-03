import axios from 'axios';
import { obterToken, limparSessao } from '../utils/armazenamentoSessao.js';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL });

let aoNaoAutorizado = () => { };

export function registrarAoNaoAutorizado(funcao) {
    aoNaoAutorizado = funcao;
}

http.interceptors.request.use((config) => {
    const token = obterToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        const ehNaoAutorizado = error.response?.status === 401;
        const ehRotaDeLogin = error.config?.url?.includes('/auth/login');
        if (ehNaoAutorizado && !ehRotaDeLogin) {
            limparSessao();
            aoNaoAutorizado();
        }
        return Promise.reject(error);
    }
);

export default http;