import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContexto } from "./authContexto.js";
import { logout, login, obterUsuarioLogado } from "../api/authApi.js";
import { salvarSessao, obterToken, limparSessao, obterExpiracao } from "../utils/armazenamentoSessao.js";
import { registrarAoNaoAutorizado } from "../api/http.js";

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function verificarSessao() {
            const token = obterToken();
            const expiracao = obterExpiracao();
            if (!token) {
                setCarregando(false);
                return;
            }
            else if (!expiracao || new Date() > new Date(expiracao)) {
                limparSessao();
                setCarregando(false);
                return;
            }
            try {
                const dados = await obterUsuarioLogado();
                setUsuario(dados);
            }
            catch {
                limparSessao();
            } finally {
                setCarregando(false);
            }

        }
        verificarSessao();
    }, [])

    useEffect(() => {
        registrarAoNaoAutorizado(() => {
            setUsuario(null);
            navigate('/login', { replace: true });
        })
    }, [navigate])

    async function entrar(email, senha) {
        const resposta = await login({ email, senha });
        salvarSessao(resposta.token, resposta.expiracao);
        setUsuario(resposta.usuario);
    }
    async function sair() {
        try {
            await logout();
        } catch {
            console.error("Erro ao sair");
        } finally {
            limparSessao();
            setUsuario(null);
            navigate('/login', { replace: true });
        }

    }

    const valor = { usuario, autenticado: usuario !== null, carregando, entrar, sair };
    return (
        <AuthContexto.Provider value={valor}>
            {children}
        </AuthContexto.Provider>
    )
}