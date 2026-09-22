import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppLoading from "./loading/AppLoading";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({
    children,
}: ProtectedRouteProps) {
    const {
        autenticado,
        carregando,
    } = useAuth();

    if (carregando) {
        return <AppLoading />;
    }

    if (!autenticado) {
        return (
            <Navigate
                to= "/login"
        replace
            />
        );
    }

    return <>{ children } </>;
}
