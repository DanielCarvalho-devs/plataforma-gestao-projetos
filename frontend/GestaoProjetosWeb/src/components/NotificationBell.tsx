import {
    AlertCircle,
    Bell,
    CalendarClock,
    CheckCircle2,
    FilePenLine,
    LoaderCircle,
    X,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./NotificationBell.css";

interface Notificacao {
    id: string;
    tipo: string;
    nivel: string;
    titulo: string;
    mensagem: string;
    detalhe: string;
    idProjeto: number | null;
    idTarefa: number | null;
    idAlteracao: number | null;
    dataReferencia: string;
    prioridade: string | null;
}

interface NotificacoesResponse {
    total: number;
    notificacoes: Notificacao[];
}

interface ContadorResponse {
    total: number;
}

export default function NotificationBell() {
    const navigate = useNavigate();

    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const [aberto, setAberto] =
        useState(false);

    const [total, setTotal] =
        useState(0);

    const [notificacoes, setNotificacoes] =
        useState<Notificacao[]>([]);

    const [carregando, setCarregando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const carregarContador =
        useCallback(async () => {
            try {
                const resposta =
                    await apiRequest<ContadorResponse>(
                        "/Notificacoes/contador"
                    );

                setTotal(resposta.total ?? 0);
            } catch {
                // O sino não deve impedir o carregamento
                // da página caso a API esteja indisponível.
            }
        }, []);

    const carregarNotificacoes =
        useCallback(async () => {
            try {
                setCarregando(true);
                setErro("");

                const resposta =
                    await apiRequest<NotificacoesResponse>(
                        "/Notificacoes"
                    );

                setNotificacoes(
                    resposta.notificacoes ?? []
                );

                setTotal(
                    resposta.total ?? 0
                );
            } catch {
                setErro(
                    "Não foi possível carregar as notificações."
                );
            } finally {
                setCarregando(false);
            }
        }, []);

    useEffect(() => {
        void carregarContador();

        const intervalo =
            window.setInterval(
                () => {
                    void carregarContador();
                },
                60000
            );

        return () => {
            window.clearInterval(intervalo);
        };
    }, [carregarContador]);

    useEffect(() => {
        const fecharAoClicarFora = (
            event: MouseEvent
        ) => {
            const alvo =
                event.target as Node;

            if (
                containerRef.current &&
                !containerRef.current.contains(alvo)
            ) {
                setAberto(false);
            }
        };

        document.addEventListener(
            "mousedown",
            fecharAoClicarFora
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                fecharAoClicarFora
            );
        };
    }, []);

    useEffect(() => {
        const fecharComEscape = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                setAberto(false);
            }
        };

        document.addEventListener(
            "keydown",
            fecharComEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                fecharComEscape
            );
        };
    }, []);

    const alternarPainel = async () => {
        if (aberto) {
            setAberto(false);
            return;
        }

        setAberto(true);

        await carregarNotificacoes();
    };

    const abrirNotificacao = (
        notificacao: Notificacao
    ) => {
        setAberto(false);

        if (notificacao.idProjeto !== null) {
            navigate(
                `/projetos/${notificacao.idProjeto}`
            );
        }
    };

    const obterIcone = (
        notificacao: Notificacao
    ) => {
        switch (notificacao.tipo) {
            case "TarefaAtrasada":
                return (
                    <AlertCircle size= { 18} />
                );

            case "PrazoProximo":
    return (
        <CalendarClock size= { 18} />
                );

            case "TarefaUrgente":
    return (
        <AlertCircle size= { 18} />
                );

            case "Alteracao":
    return (
        <FilePenLine size= { 18} />
                );

            default:
    return (
        <Bell size= { 18} />
                );
}
    };

const obterClasseNivel = (
    nivel: string
) => {
    switch (nivel) {
        case "Critico":
            return "notification-level-critical";

        case "Aviso":
            return "notification-level-warning";

        case "Informacao":
            return "notification-level-info";

        default:
            return "notification-level-info";
    }
};

const obterClassePrioridade = (
    prioridade: string
) => {
    return prioridade
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
        );
};

const formatarData = (
    data: string
) => {
    if (!data) {
        return "";
    }

    const valor =
        new Date(data);

    if (
        Number.isNaN(
            valor.getTime()
        )
    ) {
        return "";
    }

    return valor.toLocaleDateString(
        "pt-PT",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    );
};

const textoBadge =
    total > 99
        ? "99+"
        : String(total);

return (
    <div
            className= "notification-bell"
ref = { containerRef }
    >
    <button
                type="button"
className = "topbar-icon-button notification-bell-button"
title = "Notificações"
aria-label="Notificações"
aria-expanded={ aberto }
onClick = {() => {
    void alternarPainel();
}}
            >
    <Bell size={ 19 } />

{
    total > 0 && (
        <span className="notification-badge" >
        { textoBadge }
            </span>
                )
}
</button>

{
    aberto && (
        <div
                    className="notification-panel"
    role = "dialog"
    aria-label="Notificações"
        >
        <div className="notification-panel-header" >
            <div>
            <span className="notification-panel-eyebrow" >
                Centro de alertas
                    </span>

                    <h3>
    Notificações
        </h3>

        <p>
    {
        total === 0
        ? "Nenhum alerta ativo"
        : total === 1
            ? "1 alerta ativo"
            : `${total} alertas ativos`
    }
    </p>
        </div>

        <button
    type = "button"
    className = "notification-close-button"
    title = "Fechar"
    aria-label="Fechar notificações"
    onClick = {() => {
        setAberto(false);
    }
}
                        >
    <X size={ 18 } />
        </button>
        </div>

        <div className = "notification-panel-body" >
        { carregando && (
                <div className="notification-state" >
                    <LoaderCircle
                                    className="notification-spinner"
size = { 24}
    />

    <span>
    A carregar notificações...
</span>
    </div>
                        )}

{
    !carregando && erro && (
        <div className="notification-state notification-state-error" >
            <AlertCircle size={ 24 } />

                <span>
    { erro }
    </span>

        <button
    type = "button"
    onClick = {() => {
        void carregarNotificacoes();
    }
}
                                >
    Tentar novamente
        </button>
        </div>
                        )}

{
    !carregando &&
    !erro &&
    notificacoes.length === 0 && (
        <div className="notification-state notification-state-empty" >
            <CheckCircle2 size={ 28 } />

                <strong>
                                        Tudo em dia
        </strong>

        <span>
                                        Não existem alertas que
                                        necessitem da sua atenção.
                                    </span>
        </div>
                            )
}

{
    !carregando &&
    !erro &&
    notificacoes.length > 0 && (
        <div className="notification-list" >
        {
            notificacoes.map(
                (notificacao) => (
                    <button
                                                key= { notificacao.id }
                                                type = "button"
                                                className = "notification-item"
                                                onClick = {() => {
                abrirNotificacao(
                    notificacao
                );
            }}
            >
            <span
                                                    className={
        `notification-item-icon ${obterClasseNivel(
            notificacao.nivel
        )}`
    }
                                                >
    {
        obterIcone(
            notificacao
        )
    }
        </span>

        <span className = "notification-item-content" >
            <span className="notification-item-top" >
                <strong>
                {
                    notificacao.titulo
                }
                </strong>

                <span>
    {
        formatarData(
            notificacao.dataReferencia
        )
    }
    </span>
        </span>

        <span className = "notification-item-message" >
        {
            notificacao.mensagem
        }
            </span>

            <span className = "notification-item-detail" >
            {
                notificacao.detalhe
            }
                </span>

    {
        notificacao.prioridade && (
            <span
                                                            className={
            `notification-priority notification-priority-${obterClassePrioridade(
                notificacao.prioridade
            )}`
        }
                                                        >
        {
            notificacao.prioridade
        }
            </span>
                                                    )
    }
    </span>
        </button>
                                        )
                                    )
}
</div>
                            )}
</div>

    <div className = "notification-panel-footer" >
        <span>
        Os alertas são atualizados
automaticamente.
                        </span>
    </div>
    </div>
            )}
</div>
    );
}