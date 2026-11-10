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
import { Safras } from "../pages/safras/Safras.jsx";
import { SafraDetalhe } from "../pages/safras/SafraDetalhe.jsx";
import { AtividadesManejo } from "../pages/manejo/AtividadesManejo.jsx";
import { AtividadeManejoDetalhe } from "../pages/manejo/AtividadeManejoDetalhe.jsx";
import { Fornecedores } from "../pages/fornecedores/Fornecedores.jsx";
import { FornecedorDetalhe } from "../pages/fornecedores/FornecedorDetalhe.jsx";
import { Insumos } from "../pages/insumos/Insumos.jsx";
import { Compras } from "../pages/compras/Compras.jsx";
import { CompraDetalhe } from "../pages/compras/CompraDetalhe.jsx";
import { CompraFormulario } from "../pages/compras/CompraFormulario.jsx";

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
                    <Route path="safras" element={<Safras />} />
                    <Route path="safras/:id" element={<SafraDetalhe />} />
                    <Route path="atividades-manejo" element={<AtividadesManejo />} />
                    <Route path="atividades-manejo/:id" element={<AtividadeManejoDetalhe />} />
                    <Route path="fornecedores" element={<Fornecedores />} />
                    <Route path="fornecedores/:id" element={<FornecedorDetalhe />} />
                    <Route path="insumos" element={<Insumos />} />
                    <Route path="compras" element={<Compras />} />
                    <Route path="compras/nova" element={<CompraFormulario />} />
                    <Route path="compras/:id" element={<CompraDetalhe />} />
                    <Route path="compras/:id/editar" element={<CompraFormulario />} />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}