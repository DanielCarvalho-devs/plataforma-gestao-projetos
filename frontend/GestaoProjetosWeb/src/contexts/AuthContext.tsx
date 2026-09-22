import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import { apiRequest } from "../services/api";

export interface UtilizadorAutenticado {
    idUtilizador: number;
    nome: string;
    email: string;
    perfil: string;
}

interface LoginResponse {
    token: string;
    idUtilizador: number;
    nome: string;
    email: string;
    perfil: string;
}

interface AuthContextType {
    utilizador: UtilizadorAutenticado | null;
    autenticado: boolean;
    carregando: boolean;

    login: (
        email: string,
        password: string,
        manterSessao: boolean
    ) => Promise<void>;

    logout: () => void;

    atualizarUtilizador: (
        dados: Partial<UtilizadorAutenticado>
    ) => void;

    recarregarUtilizador: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

const TOKEN_KEY = "gestaoProjetosToken";
const USER_KEY = "gestaoProjetosUtilizador";

function obterToken() {
    return (
        localStorage.getItem(TOKEN_KEY) ??
        sessionStorage.getItem(TOKEN_KEY)
    );
}

function obterUtilizadorGuardado():
    UtilizadorAutenticado | null {
    const valor =
        localStorage.getItem(USER_KEY) ??
        sessionStorage.getItem(USER_KEY);

    if (!valor) {
        return null;
    }

    try {
        return JSON.parse(valor);
    } catch {
        return null;
    }
}

function obterStorageSessao() {
    if (localStorage.getItem(TOKEN_KEY)) {
        return localStorage;
    }

    if (sessionStorage.getItem(TOKEN_KEY)) {
        return sessionStorage;
    }

    return null;
}

function limparSessao() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [utilizador, setUtilizador] =
        useState<UtilizadorAutenticado | null>(
            obterUtilizadorGuardado()
        );

    const [carregando, setCarregando] =
        useState(true);

    async function recarregarUtilizador() {
        const token = obterToken();

        if (!token) {
            limparSessao();
            setUtilizador(null);
            return;
        }

        try {
            const dados =
                await apiRequest<UtilizadorAutenticado>(
                    "/Auth/me"
                );

            setUtilizador(dados);

            const storage =
                obterStorageSessao();

            if (storage) {
                storage.setItem(
                    USER_KEY,
                    JSON.stringify(dados)
                );
            }
        } catch {
            limparSessao();
            setUtilizador(null);
            throw new Error(
                "Não foi possível atualizar os dados da sessão."
            );
        }
    }

    function atualizarUtilizador(
        dados: Partial<UtilizadorAutenticado>
    ) {
        setUtilizador((atual) => {
            if (!atual) {
                return atual;
            }

            const atualizado: UtilizadorAutenticado = {
                ...atual,
                ...dados,
            };

            const storage =
                obterStorageSessao();

            if (storage) {
                storage.setItem(
                    USER_KEY,
                    JSON.stringify(atualizado)
                );
            }

            return atualizado;
        });
    }

    useEffect(() => {
        async function validarSessao() {
            const token = obterToken();

            if (!token) {
                setUtilizador(null);
                setCarregando(false);
                return;
            }

            try {
                const dados =
                    await apiRequest<UtilizadorAutenticado>(
                        "/Auth/me"
                    );

                setUtilizador(dados);

                const storage =
                    obterStorageSessao();

                if (storage) {
                    storage.setItem(
                        USER_KEY,
                        JSON.stringify(dados)
                    );
                }
            } catch {
                limparSessao();
                setUtilizador(null);
            } finally {
                setCarregando(false);
            }
        }

        validarSessao();
    }, []);

    async function login(
        email: string,
        password: string,
        manterSessao: boolean
    ) {
        const resposta =
            await apiRequest<LoginResponse>(
                "/Auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

        const utilizadorAutenticado:
            UtilizadorAutenticado = {
            idUtilizador: resposta.idUtilizador,
            nome: resposta.nome,
            email: resposta.email,
            perfil: resposta.perfil,
        };

        limparSessao();

        const storage =
            manterSessao
                ? localStorage
                : sessionStorage;

        storage.setItem(
            TOKEN_KEY,
            resposta.token
        );

        storage.setItem(
            USER_KEY,
            JSON.stringify(
                utilizadorAutenticado
            )
        );

        setUtilizador(
            utilizadorAutenticado
        );
    }

    function logout() {
        limparSessao();
        setUtilizador(null);
    }

    return (
        <AuthContext.Provider
            value= {{
        utilizador,
            autenticado:
        utilizador !== null,
            carregando,
            login,
            logout,
            atualizarUtilizador,
            recarregarUtilizador,
            }
}
        >
{ children }
    </AuthContext.Provider>
    );
}

export function useAuth() {
    const contexto =
        useContext(AuthContext);

    if (!contexto) {
        throw new Error(
            "useAuth deve ser utilizado dentro de AuthProvider."
        );
    }

    return contexto;
}
