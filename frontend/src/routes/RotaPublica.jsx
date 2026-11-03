import {Navigate, Outlet, useLocation} from "react-router-dom";
import {Spin} from "antd";
import {useAuth} from "../contexts/useAuth.js";


export function RotaPublica() {
    const {carregando,autenticado} = useAuth();
    const location = useLocation();
    if (carregando) {
        return <Spin fullscreen />
    }
    if (autenticado) {
        return <Navigate to={location.state?.de?.pathname ?? '/'} replace />
    }
    return <Outlet />
}