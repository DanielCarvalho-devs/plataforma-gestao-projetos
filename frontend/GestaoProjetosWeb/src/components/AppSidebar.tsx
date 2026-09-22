import {
    ChevronLeft,
    ChevronRight,
    FolderKanban,
    History,
    LayoutDashboard,
    LogOut,
    Moon,
    Sun,
    UsersRound,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { apiBlob } from "../services/api";
import AppLoading from "./loading/AppLoading";

import "./AppSidebar.css";

type Tema = "light" | "dark";

const CHAVE_TEMA =
    "gestaoProjetosTema";

const CHAVE_SIDEBAR =
    "gestaoProjetosSidebarMinimizada";

const TEMPO_TRANSICAO_PAGINA = 320;

function obterSidebarInicial() {
    return (
        localStorage.getItem(
            CHAVE_SIDEBAR
        ) === "true"
    );
}

function obterTemaInicial(): Tema {
    const temaGuardado =
        localStorage.getItem(
            CHAVE_TEMA
        );

    if (
        temaGuardado === "dark" ||
        temaGuardado === "light"
    ) {
        return temaGuardado;
    }

    return "light";
}

export default function AppSidebar() {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const {
        utilizador,
        logout,
    } =
        useAuth();

    const [
        tema,
        setTema,
    ] =
        useState<Tema>(
            obterTemaInicial
        );

    const [
        sidebarMinimizada,
        setSidebarMinimizada,
    ] =
        useState<boolean>(
            obterSidebarInicial
        );

    const [
        urlFotoPerfil,
        setUrlFotoPerfil,
    ] =
        useState<string | null>(
            null
        );

    const [
        navegando,
        setNavegando,
    ] =
        useState(false);

    const eAdministrador =
        utilizador?.perfil ===
        "Administrador";

    const modoEscuro =
        tema === "dark";

    useEffect(() => {
        document.documentElement.setAttribute(
            "data-theme",
            tema
        );

        localStorage.setItem(
            CHAVE_TEMA,
            tema
        );
    }, [tema]);

    useEffect(() => {
        document.documentElement.setAttribute(
            "data-sidebar-collapsed",
            sidebarMinimizada
                ? "true"
                : "false"
        );

        localStorage.setItem(
            CHAVE_SIDEBAR,
            String(
                sidebarMinimizada
            )
        );
    }, [sidebarMinimizada]);

    const alternarSidebar =
        () => {
            setSidebarMinimizada(
                (valorAtual) =>
                    !valorAtual
            );
        };

    useEffect(() => {
        let ativo = true;

        let urlCriada:
            string | null = null;

        async function carregarFotoPerfil() {
            try {
                const blob =
                    await apiBlob(
                        "/Utilizadores/meu-perfil/foto"
                    );

                if (!ativo) {
                    return;
                }

                urlCriada =
                    URL.createObjectURL(
                        blob
                    );

                setUrlFotoPerfil(
                    urlCriada
                );
            } catch {
                if (ativo) {
                    setUrlFotoPerfil(
                        null
                    );
                }
            }
        }

        setUrlFotoPerfil(null);

        if (utilizador) {
            void carregarFotoPerfil();
        }

        return () => {
            ativo = false;

            if (urlCriada) {
                URL.revokeObjectURL(
                    urlCriada
                );
            }
        };
    }, [
        utilizador?.idUtilizador,
        location.pathname,
    ]);

    const estaAtivo = (
        caminho: string
    ) => {
        if (caminho === "/") {
            return (
                location.pathname === "/"
            );
        }

        if (
            caminho ===
            "/gestao-projetos"
        ) {
            return (
                location.pathname ===
                "/gestao-projetos" ||
                location.pathname.startsWith(
                    "/projetos/"
                )
            );
        }

        return (
            location.pathname.startsWith(
                caminho
            )
        );
    };

    const alternarTema =
        () => {
            setTema(
                modoEscuro
                    ? "light"
                    : "dark"
            );
        };

    const navegarComLoading =
        (caminho: string) => {
            if (
                navegando ||
                location.pathname === caminho
            ) {
                return;
            }

            setNavegando(true);

            window.setTimeout(
                () => {
                    navigate(caminho);
                },
                TEMPO_TRANSICAO_PAGINA
            );
        };

    const terminarSessao =
        () => {
            logout();

            navigate(
                "/login",
                {
                    replace: true,
                }
            );
        };

    const abrirMeuPerfil =
        () => {
            navegarComLoading(
                "/meu-perfil"
            );
        };

    return (
        <aside
            className= {
            sidebarMinimizada
            ? "app-sidebar app-sidebar-collapsed"
                : "app-sidebar"
        }
        >
        { navegando && (
            <AppLoading />
        )
}
<button
                    type="button"
className = "sidebar-collapse-button"
onClick = { alternarSidebar }
title = {
    sidebarMinimizada
    ? "Expandir menu"
        : "Minimizar menu"
}
    >
    {
        sidebarMinimizada?(
                        <ChevronRight size = { 17} />
                    ): (
                <ChevronLeft size = { 17 } />
                    )}
</button>

    < div className = "sidebar-brand" >
        <div className="sidebar-logo" >
            <FolderKanban
                            size={ 24 }
                        />
    </div>

    < div >
    <strong>
    Gestão
    </strong>

    <span>
Projetos
    </span>
    </div>
    </div>

    < nav className = "sidebar-navigation" >
        <span className="sidebar-section-title" >
            Principal
            </span>

            < button
type = "button"
className = {
    estaAtivo("/")
                                ?"sidebar-item active"
        : "sidebar-item"
}
onClick = {() =>
navegarComLoading("/")
                        }
title = "Dashboard"
    >
    <LayoutDashboard
                            size={ 20 }
                        />

    <span>
Dashboard
    </span>
    </button>

    < span className = "sidebar-section-title modules-title" >
        Plataforma
        </span>

        < button
type = "button"
className = {
    estaAtivo(
                                "/gestao-projetos"
    )
                                ?"sidebar-item active"
        : "sidebar-item"
}
onClick = {() =>
navegarComLoading(
    "/gestao-projetos"
)
                        }
title = "Gestão de Projetos"
    >
    <FolderKanban
                            size={ 19 }
                        />

    <span>
                            Gestão de Projetos
    </span>
    </button>

    < button
type = "button"
className = {
    estaAtivo(
                                "/historico"
    )
                                ?"sidebar-item active"
        : "sidebar-item"
}
onClick = {() =>
navegarComLoading(
    "/historico"
)
                        }
title = "Histórico"
    >
    <History
                            size={ 19 }
                        />

    <span>
Histórico
    </span>
    </button>

{
    eAdministrador && (
        <span className="sidebar-section-title modules-title" >
            Administração
            </span>
                    )
}

{
    eAdministrador && (
        <button
                            type="button"
    className = {
        estaAtivo(
                                    "/utilizadores"
        )
                                    ?"sidebar-item active"
            : "sidebar-item"
    }
    onClick = {() =>
    navegarComLoading(
        "/utilizadores"
    )
}
title = "Utilizadores"
    >
    <UsersRound
                                size={ 19 }
                            />

    <span>
Utilizadores
    </span>
    </button>
                    )}
</nav>

    < div className = "sidebar-footer" >
        <div className="sidebar-user" >
            <button
                            type="button"
className = "sidebar-user-profile"
onClick = {
    abrirMeuPerfil
}
title = "Abrir o meu perfil"
    >
    <div className="sidebar-user-avatar" >
    {
        urlFotoPerfil?(
                                    <img
                                        src = {
                urlFotoPerfil
            }
                                        alt = "Fotografia de perfil"
                />
                                ): (
                utilizador?.nome
                                        ?.trim()
                                        .charAt(0)
            .toUpperCase() ||
            "U"
                                )
    }
        </div>

        < div className = "sidebar-user-info" >
            <strong>
            { utilizador?.nome ||
            "Utilizador"}
</strong>

    <span>
{
    utilizador?.perfil ||
    ""
}
</span>
    </div>
    </button>

    < button
type = "button"
className = "sidebar-logout"
onClick = {
    alternarTema
}
title = {
    modoEscuro
    ? "Modo claro"
        : "Modo escuro"
}
    >
    {
        modoEscuro?(
                                <Sun
                                    size = { 18}
                />
                            ): (
                <Moon
                                    size = { 18 }
                                />
                            )}
</button>

    < button
type = "button"
className = "sidebar-logout"
onClick = {
    terminarSessao
}
title = "Terminar sessão"
    >
    <LogOut
                                size={ 18 }
                            />
    </button>
    </div>
    </div>
    </aside>
    );
}
