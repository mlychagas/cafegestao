import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutPrincipal } from "../layouts/LayoutPrincipal.jsx";
import { LayoutAuth } from "../layouts/LayoutAuth.jsx";
import { RotaProtegida } from "./RotaProtegida.jsx";
import { RotaPublica } from "./RotaPublica.jsx";
import { Inicio } from "../pages/inicio/Inicio.jsx";
import { Login } from "../pages/auth/Login.jsx";
import { Cadastro } from "../pages/auth/Cadastro.jsx";
import { Propriedades } from "../pages/propriedades/Propriedades.jsx";
import { PropriedadeDetalhe } from "../pages/propriedades/PropriedadeDetalhe.jsx";

export function AppRoutes() {
    return (
        <Routes>
            <Route element={<RotaPublica />}>
                <Route element={<LayoutAuth />}>
                    <Route path="login" element={<Login />} />
                    <Route path="cadastro" element={<Cadastro />} />
                </Route>
            </Route>
            <Route element={<RotaProtegida />}>
                <Route element={<LayoutPrincipal />}>
                    <Route index element={<Inicio />} />
                    <Route path="propriedades" element={<Propriedades />} />
                    <Route path="propriedades/:id" element={<PropriedadeDetalhe />} />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}