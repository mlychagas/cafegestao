import { useAuth } from "../../contexts/useAuth.js";

export function Inicio() {
    const {usuario} = useAuth();
    return (
        <div>
            <h2>Bem-vindo, {usuario.nome}</h2>
        </div>
    );
}