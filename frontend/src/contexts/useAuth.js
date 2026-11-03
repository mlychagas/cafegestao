import { useContext } from "react";
import { AuthContexto } from "./authContexto.js";

export const useAuth = () => {
    const auth = useContext(AuthContexto);
    if (!auth) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return auth;
};