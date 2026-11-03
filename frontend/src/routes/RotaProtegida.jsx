import {Navigate, Outlet, useLocation} from "react-router-dom";
import {Spin} from "antd";
import {useAuth} from "../contexts/useAuth.js";

export function RotaProtegida() {
    const {carregando,autenticado} = useAuth();
    const location = useLocation();
    if (carregando) {
        return <Spin fullscreen />
    }else if (!autenticado) {
        return <Navigate to="/login" replace state={{ de: location }} />
    }
    return <Outlet />
}