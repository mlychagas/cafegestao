import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.js";
import { Button } from "antd";


export function LayoutPrincipal() {
    const {usuario, sair} = useAuth();
    return (
        <div>
            <h1>CaféGestão</h1>
            <p>Bem-vindo, {usuario.nome}!</p>
            <Button onClick={sair}>Sair</Button>
            <Outlet />
        </div>
    );
}