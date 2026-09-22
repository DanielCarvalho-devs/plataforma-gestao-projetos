import {
    Activity,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    CirclePause,
    ClipboardCheck,
    ClipboardList,
    Clock3,
    FileText,
    FolderKanban,
    RefreshCw,
    TimerReset,
    Users,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import AppSidebar from "../../components/AppSidebar";
import NotificationBell from "../../components/NotificationBell";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../services/api";

import "./Dashboard.css";

interface ClienteItem {
    idCliente?: number;
    nome?: string;
    ativo?: boolean;
}

interface ProjetoItem {
    idProjeto?: number;
    codigo?: string;
    nome?: string;
    estado?: string;
    ativo?: boolean;
    prazoPrevisto?: string | null;
}

interface TarefaItem {
    idTarefa?: number;
    idProjeto?: number;
    titulo?: string;
    estado?: string;
    prioridade?: string;
    data?: string | null;
}

interface AlteracaoItem {
    idAlteracao?: number;
    estado?: string;
}

interface DocumentoItem {
    idDocumento?: number;
}

interface DashboardDados {
    clientesAtivos: number | null;
    projetosAtivos: number | null;
    tarefasPendentes: number | null;
    tarefasAtrasadas: number | null;
    tarefasTotal: number | null;
    tarefasConcluidas: number | null;
    alteracoes: number | null;
    documentos: number | null;
}

interface ProjetoEstado {
    nome: string;
    quantidade: number;
    classe: string;
}

interface ItemAtencao {
    id: string;
    titulo: string;
    descricao: string;
    tipo: "critico" | "aviso" | "info";
}

const dadosIniciais: DashboardDados = {
    clientesAtivos: null,
    projetosAtivos: null,
    tarefasPendentes: null,
    tarefasAtrasadas: null,
    tarefasTotal: null,
    tarefasConcluidas: null,
    alteracoes: null,
    documentos: null,
};

function normalizarTexto(valor?: string | null) {
    return (valor ?? "")
        .trim()
        .toLocaleLowerCase("pt-PT");
}

function dataLocal(data?: string | null) {
    if (!data) {
        return null;
    }

    const parteData = data.split("T")[0];
    const partes = parteData.split("-");

    if (partes.length !== 3) {
        return null;
    }

    const ano = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    if (
        Number.isNaN(ano) ||
        Number.isNaN(mes) ||
        Number.isNaN(dia)
    ) {
        return null;
    }

    return new Date(ano, mes - 1, dia);
}

function inicioDoDia(data: Date) {
    return new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
    );
}

function diferencaEmDias(
    inicio: Date,
    fim: Date
) {
    const milissegundosPorDia =
        1000 * 60 * 60 * 24;

    return Math.round(
        (
            inicioDoDia(fim).getTime() -
            inicioDoDia(inicio).getTime()
        ) /
        milissegundosPorDia
    );
}

function tarefaFinalizada(estado?: string) {
    const valor = normalizarTexto(estado);

    return (
        valor === "concluída" ||
        valor === "concluida" ||
        valor === "cancelada"
    );
}

function tarefaConcluida(estado?: string) {
    const valor = normalizarTexto(estado);

    return (
        valor === "concluída" ||
        valor === "concluida"
    );
}


function DashboardSkeleton() {
    return (
        <>
        <section className= "dashboard-cards dashboard-skeleton-cards" >
        {
            Array.from({ length: 4 }).map((_, index) => (
                <article className= "dashboard-card dashboard-skeleton-card" key = { index } >
                <div className="dashboard-skeleton-card-top" >
            <span className="dashboard-skeleton dashboard-skeleton-icon" />
            <span className="dashboard-skeleton dashboard-skeleton-dot" />
            </div>
            < span className = "dashboard-skeleton dashboard-skeleton-number" />
            <span className="dashboard-skeleton dashboard-skeleton-title" />
            <span className="dashboard-skeleton dashboard-skeleton-text" />
            </article>
            ))
        }
        </section>

        < section className = "dashboard-main-grid" >
            <article className="dashboard-panel dashboard-skeleton-panel" >
                <div className="dashboard-skeleton-panel-header" >
                    <div>
                    <span className="dashboard-skeleton dashboard-skeleton-eyebrow" />
                        <span className="dashboard-skeleton dashboard-skeleton-heading" />
                            <span className="dashboard-skeleton dashboard-skeleton-subtitle" />
                                </div>
                                < span className = "dashboard-skeleton dashboard-skeleton-panel-icon" />
                                    </div>
                                    < div className = "dashboard-skeleton-status-list" >
                                    {
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <div className= "dashboard-skeleton-status-item" key = { index } >
                                            <div className="dashboard-skeleton-status-heading" >
                                        <span className="dashboard-skeleton dashboard-skeleton-status-name" />
                                        <span className="dashboard-skeleton dashboard-skeleton-status-value" />
                                        </div>
                                        < span className = "dashboard-skeleton dashboard-skeleton-status-track" />
                                        </div>
                                        ))
                                    }
                                        </div>
                                        </article>

                                        < article className = "dashboard-panel dashboard-skeleton-panel" >
                                            <div className="dashboard-skeleton-panel-header" >
                                                <div>
                                                <span className="dashboard-skeleton dashboard-skeleton-eyebrow" />
                                                    <span className="dashboard-skeleton dashboard-skeleton-heading dashboard-skeleton-heading-short" />
                                                        <span className="dashboard-skeleton dashboard-skeleton-subtitle" />
                                                            </div>
                                                            < span className = "dashboard-skeleton dashboard-skeleton-panel-icon" />
                                                                </div>
                                                                < div className = "dashboard-skeleton-attention-list" >
                                                                {
                                                                    Array.from({ length: 3 }).map((_, index) => (
                                                                        <div className= "dashboard-skeleton-attention" key = { index } >
                                                                        <span className="dashboard-skeleton dashboard-skeleton-attention-icon" />
                                                                    <div>
                                                                    <span className="dashboard-skeleton dashboard-skeleton-attention-title" />
                                                                    <span className="dashboard-skeleton dashboard-skeleton-attention-text" />
                                                                    </div>
                                                                    </div>
                                                                    ))
                                                                }
                                                                    </div>
                                                                    </article>
                                                                    </section>

                                                                    < section className = "dashboard-secondary-grid" >
                                                                        <article className="dashboard-panel dashboard-skeleton-panel" >
                                                                            <div className="dashboard-skeleton-panel-header" >
                                                                                <div>
                                                                                <span className="dashboard-skeleton dashboard-skeleton-eyebrow" />
                                                                                    <span className="dashboard-skeleton dashboard-skeleton-heading" />
                                                                                        </div>
                                                                                        < span className = "dashboard-skeleton dashboard-skeleton-panel-icon" />
                                                                                            </div>
                                                                                            < div className = "dashboard-skeleton-progress" >
                                                                                                <span className="dashboard-skeleton dashboard-skeleton-circle" />
                                                                                                    <div className="dashboard-skeleton-progress-lines" >
                                                                                                    {
                                                                                                        Array.from({ length: 3 }).map((_, index) => (
                                                                                                            <span className= "dashboard-skeleton dashboard-skeleton-progress-line" key = { index } />
                            ))
                                                                                                    }
                                                                                                        </div>
                                                                                                        </div>
                                                                                                        </article>

                                                                                                        < article className = "dashboard-panel dashboard-skeleton-panel" >
                                                                                                            <div className="dashboard-skeleton-panel-header" >
                                                                                                                <div>
                                                                                                                <span className="dashboard-skeleton dashboard-skeleton-eyebrow" />
                                                                                                                    <span className="dashboard-skeleton dashboard-skeleton-heading" />
                                                                                                                        </div>
                                                                                                                        < span className = "dashboard-skeleton dashboard-skeleton-panel-icon" />
                                                                                                                            </div>
                                                                                                                            < div className = "dashboard-skeleton-operation-grid" >
                                                                                                                            {
                                                                                                                                Array.from({ length: 4 }).map((_, index) => (
                                                                                                                                    <div className= "dashboard-skeleton-operation" key = { index } >
                                                                                                                                    <span className="dashboard-skeleton dashboard-skeleton-operation-icon" />
                                                                                                                                <div>
                                                                                                                                <span className="dashboard-skeleton dashboard-skeleton-operation-label" />
                                                                                                                                <span className="dashboard-skeleton dashboard-skeleton-operation-value" />
                                                                                                                                </div>
                                                                                                                                </div>
                                                                                                                                ))
                                                                                                                            }
                                                                                                                                </div>
                                                                                                                                </article>
                                                                                                                                </section>
                                                                                                                                </>
    );
}

export default function Dashboard() {
    const { utilizador } = useAuth();

    const [dados, setDados] =
        useState<DashboardDados>(
            dadosIniciais
        );

    const [projetos, setProjetos] =
        useState<ProjetoItem[]>([]);

    const [tarefas, setTarefas] =
        useState<TarefaItem[]>([]);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    const [
        ultimaAtualizacao,
        setUltimaAtualizacao,
    ] = useState<Date | null>(null);

    const carregarDashboard =
        useCallback(async () => {
            setCarregando(true);
            setErro("");

            const resultados =
                await Promise.allSettled([
                    apiRequest<ClienteItem[]>(
                        "/Clientes"
                    ),

                    apiRequest<ProjetoItem[]>(
                        "/Projetos"
                    ),

                    apiRequest<TarefaItem[]>(
                        "/Tarefas"
                    ),

                    apiRequest<AlteracaoItem[]>(
                        "/Alteracoes"
                    ),

                    apiRequest<DocumentoItem[]>(
                        "/Documentos"
                    ),
                ]);

            const [
                clientesResultado,
                projetosResultado,
                tarefasResultado,
                alteracoesResultado,
                documentosResultado,
            ] = resultados;

            const clientesCarregados =
                clientesResultado.status ===
                    "fulfilled"
                    ? clientesResultado.value
                    : [];

            const projetosCarregados =
                projetosResultado.status ===
                    "fulfilled"
                    ? projetosResultado.value
                    : [];

            const tarefasCarregadas =
                tarefasResultado.status ===
                    "fulfilled"
                    ? tarefasResultado.value
                    : [];

            const hoje =
                inicioDoDia(new Date());

            const tarefasNaoFinalizadas =
                tarefasCarregadas.filter(
                    (tarefa) =>
                        !tarefaFinalizada(
                            tarefa.estado
                        )
                );

            const tarefasAtrasadas =
                tarefasNaoFinalizadas.filter(
                    (tarefa) => {
                        const data =
                            dataLocal(
                                tarefa.data
                            );

                        return (
                            data !== null &&
                            data < hoje
                        );
                    }
                );

            const novosDados: DashboardDados = {
                clientesAtivos:
                    clientesResultado.status ===
                        "fulfilled"
                        ? clientesCarregados.filter(
                            (cliente) =>
                                cliente.ativo !==
                                false
                        ).length
                        : null,

                projetosAtivos:
                    projetosResultado.status ===
                        "fulfilled"
                        ? projetosCarregados.filter(
                            (projeto) =>
                                projeto.ativo !==
                                false
                        ).length
                        : null,

                tarefasPendentes:
                    tarefasResultado.status ===
                        "fulfilled"
                        ? tarefasNaoFinalizadas
                            .length
                        : null,

                tarefasAtrasadas:
                    tarefasResultado.status ===
                        "fulfilled"
                        ? tarefasAtrasadas.length
                        : null,

                tarefasTotal:
                    tarefasResultado.status ===
                        "fulfilled"
                        ? tarefasCarregadas.length
                        : null,

                tarefasConcluidas:
                    tarefasResultado.status ===
                        "fulfilled"
                        ? tarefasCarregadas.filter(
                            (tarefa) =>
                                tarefaConcluida(
                                    tarefa.estado
                                )
                        ).length
                        : null,

                alteracoes:
                    alteracoesResultado.status ===
                        "fulfilled"
                        ? alteracoesResultado.value
                            .length
                        : null,

                documentos:
                    documentosResultado.status ===
                        "fulfilled"
                        ? documentosResultado.value
                            .length
                        : null,
            };

            setDados(novosDados);
            setProjetos(projetosCarregados);
            setTarefas(tarefasCarregadas);

            const falhas =
                resultados.filter(
                    (resultado) =>
                        resultado.status ===
                        "rejected"
                );

            if (falhas.length > 0) {
                setErro(
                    falhas.length ===
                        resultados.length
                        ? "Não foi possível carregar os dados do Dashboard."
                        : "Alguns indicadores não puderam ser carregados."
                );
            }

            setUltimaAtualizacao(
                new Date()
            );

            setCarregando(false);
        }, []);

    useEffect(() => {
        void carregarDashboard();
    }, [carregarDashboard]);

    const saudacao =
        useMemo(() => {
            const hora =
                new Date().getHours();

            if (hora < 12) {
                return "Bom dia";
            }

            if (hora < 19) {
                return "Boa tarde";
            }

            return "Boa noite";
        }, []);

    const primeiroNome =
        useMemo(() => {
            const nome =
                utilizador?.nome?.trim();

            if (!nome) {
                return "Utilizador";
            }

            return nome.split(/\s+/)[0];
        }, [utilizador?.nome]);

    const iniciais =
        useMemo(() => {
            const nome =
                utilizador?.nome?.trim();

            if (!nome) {
                return "U";
            }

            const partes =
                nome
                    .split(/\s+/)
                    .filter(Boolean);

            if (partes.length === 1) {
                return partes[0]
                    .slice(0, 2)
                    .toUpperCase();
            }

            return (
                partes[0][0] +
                partes[
                partes.length - 1
                ][0]
            ).toUpperCase();
        }, [utilizador?.nome]);

    const projetosAtivos =
        useMemo(
            () =>
                projetos.filter(
                    (projeto) =>
                        projeto.ativo !== false
                ),
            [projetos]
        );

    const projetosPorEstado =
        useMemo<ProjetoEstado[]>(() => {
            const contar = (
                ...estados: string[]
            ) => {
                const normalizados =
                    estados.map(
                        normalizarTexto
                    );

                return projetosAtivos.filter(
                    (projeto) =>
                        normalizados.includes(
                            normalizarTexto(
                                projeto.estado
                            )
                        )
                ).length;
            };

            return [
                {
                    nome: "Planeados",
                    quantidade:
                        contar("Planeado"),
                    classe: "planeado",
                },
                {
                    nome:
                        "Em desenvolvimento",
                    quantidade:
                        contar(
                            "Em desenvolvimento"
                        ),
                    classe:
                        "desenvolvimento",
                },
                {
                    nome: "Suspensos",
                    quantidade:
                        contar("Suspenso"),
                    classe: "suspenso",
                },
                {
                    nome: "Concluídos",
                    quantidade:
                        contar("Concluído"),
                    classe: "concluido",
                },
            ];
        }, [projetosAtivos]);

    const maiorEstado =
        useMemo(
            () =>
                Math.max(
                    1,
                    ...projetosPorEstado.map(
                        (item) =>
                            item.quantidade
                    )
                ),
            [projetosPorEstado]
        );

    const itensAtencao =
        useMemo<ItemAtencao[]>(() => {
            const hoje =
                inicioDoDia(new Date());

            const itens: ItemAtencao[] = [];

            const atrasadas =
                tarefas.filter(
                    (tarefa) => {
                        if (
                            tarefaFinalizada(
                                tarefa.estado
                            )
                        ) {
                            return false;
                        }

                        const data =
                            dataLocal(
                                tarefa.data
                            );

                        return (
                            data !== null &&
                            data < hoje
                        );
                    }
                );

            if (atrasadas.length > 0) {
                itens.push({
                    id: "tarefas-atrasadas",
                    titulo:
                        `${atrasadas.length} ${atrasadas.length === 1
                            ? "tarefa atrasada"
                            : "tarefas atrasadas"
                        }`,
                    descricao:
                        "Existem tarefas com data anterior a hoje que ainda não foram concluídas.",
                    tipo: "critico",
                });
            }

            const urgentes =
                tarefas.filter(
                    (tarefa) =>
                        !tarefaFinalizada(
                            tarefa.estado
                        ) &&
                        normalizarTexto(
                            tarefa.prioridade
                        ) === "urgente"
                );

            if (urgentes.length > 0) {
                itens.push({
                    id: "tarefas-urgentes",
                    titulo:
                        `${urgentes.length} ${urgentes.length === 1
                            ? "tarefa urgente"
                            : "tarefas urgentes"
                        }`,
                    descricao:
                        "Tarefas com prioridade urgente requerem acompanhamento.",
                    tipo: "aviso",
                });
            }

            const projetosPrazo =
                projetosAtivos.filter(
                    (projeto) => {
                        const prazo =
                            dataLocal(
                                projeto.prazoPrevisto
                            );

                        if (!prazo) {
                            return false;
                        }

                        const estado =
                            normalizarTexto(
                                projeto.estado
                            );

                        if (
                            estado ===
                            "concluído" ||
                            estado ===
                            "concluido" ||
                            estado ===
                            "cancelado"
                        ) {
                            return false;
                        }

                        const dias =
                            diferencaEmDias(
                                hoje,
                                prazo
                            );

                        return (
                            dias >= 0 &&
                            dias <= 7
                        );
                    }
                );

            if (projetosPrazo.length > 0) {
                itens.push({
                    id: "projetos-prazo",
                    titulo:
                        `${projetosPrazo.length} ${projetosPrazo.length ===
                            1
                            ? "projeto próximo do prazo"
                            : "projetos próximos do prazo"
                        }`,
                    descricao:
                        "Prazo previsto dentro dos próximos 7 dias.",
                    tipo: "info",
                });
            }

            return itens;
        }, [
            projetosAtivos,
            tarefas,
        ]);

    const percentagemConcluidas =
        useMemo(() => {
            if (
                dados.tarefasTotal === null ||
                dados.tarefasConcluidas ===
                null ||
                dados.tarefasTotal === 0
            ) {
                return 0;
            }

            return Math.round(
                (
                    dados.tarefasConcluidas /
                    dados.tarefasTotal
                ) * 100
            );
        }, [
            dados.tarefasConcluidas,
            dados.tarefasTotal,
        ]);

    const cards = [
        {
            titulo: "Clientes ativos",
            valor:
                dados.clientesAtivos,
            descricao:
                "Clientes atualmente ativos na plataforma",
            icone: Users,
            classe: "clientes",
        },
        {
            titulo: "Projetos ativos",
            valor:
                dados.projetosAtivos,
            descricao:
                "Projetos em acompanhamento no sistema",
            icone: FolderKanban,
            classe: "projetos",
        },
        {
            titulo:
                "Tarefas pendentes",
            valor:
                dados.tarefasPendentes,
            descricao:
                "Tarefas que ainda requerem acompanhamento",
            icone: ClipboardList,
            classe: "tarefas",
        },
        {
            titulo:
                "Tarefas atrasadas",
            valor:
                dados.tarefasAtrasadas,
            descricao:
                "Tarefas fora da data prevista",
            icone: AlertTriangle,
            classe: "atrasadas",
        },
    ];

    return (
        <div className= "dashboard-shell" >
        <AppSidebar />

        < main className = "dashboard-main" >
            <header className="dashboard-topbar" >
                <div className="dashboard-breadcrumb" >
                    <span>Plataforma </span>
                    <span> / </span>
                    < strong > Dashboard </strong>
                    </div>

                    < div className = "topbar-actions" >
                        <NotificationBell />

                        < div className = "topbar-divider" />

                            <div className="topbar-profile" >
                                <div className="topbar-avatar" >
                                { iniciais }
                                    </div>

                                    < div >
                                    <strong>
                                    {
                                        utilizador?.nome
                                    }
                                    </strong>

                                    <span>
    {
        utilizador?.email
    }
    </span>
        </div>
        </div>
        </div>
        </header>

        < div className = "dashboard-content" >
            <section className="dashboard-welcome" >
                <div className="dashboard-welcome-copy" >
                    <span className="dashboard-eyebrow" >
                        VISÃO GERAL
                            </span>

                            <h1>
    { saudacao }, { " " }
    <span>
        {
            primeiroNome
        }
        </span>
            .
                            </h1>

        <p>
                                Acompanhe o estado
                                atual dos projetos,
        tarefas e operações
                                da plataforma.
                            </p>
        </div>

        < div className = "dashboard-refresh-area" >
        { ultimaAtualizacao && (
                <div className="dashboard-update-info" >
                    <span>
                    Última
    atualização
        </span>

        <strong>
    {
        ultimaAtualizacao.toLocaleTimeString(
            "pt-PT",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        )
    }
    </strong>
        </div>
                            )
}

<button
                                type="button"
className = "refresh-button"
onClick = {() =>
void carregarDashboard()
                                }
disabled = {
    carregando
}
    >
    <RefreshCw
                                    size={ 17 }
className = {
    carregando
    ? "rotating"
        : ""
}
    />

{
    carregando
    ? "A atualizar..."
        : "Atualizar"
}
    </button>
    </div>
    </section>

{
    erro && (
        <div className="dashboard-warning" >
            <AlertCircle
                                size={ 19 }
                            />

        < span > { erro } </span>
        </div>
                    )
}

{ carregando && <DashboardSkeleton /> }

<div className={ carregando ? "dashboard-real-content dashboard-real-content-loading" : "dashboard-real-content" }>
    <section className="dashboard-cards" >
    {
        cards.map(
            (card) => {
                const Icone =
                    card.icone;

                return (
                    <article
                                        className= {`dashboard-card dashboard-card-${card.classe}`
            }
                                        key = {
                card.titulo
            }
            >
            <div className="dashboard-card-top" >
        <div className="dashboard-card-icon" >
        <Icone
                                                    size={
            21
                                                    }
        />
        </div>

        < span className = "dashboard-card-indicator" >
        <span />
        </span>
        </div>

        < div className = "dashboard-card-value-row" >
        <strong className="dashboard-card-number" >
        {
            carregando
            ? "..."
                : card.valor ??
                "—"
        }
        </strong>
        </div>

        <h2>
                                            {
                card.titulo
            }
            </h2>

            <p>
                                            {
                card.descricao
            }
            </p>
            </article>
        );
    }
                        )}
</section>

    < section className = "dashboard-main-grid" >
        <article className="dashboard-panel dashboard-project-status" >
            <div className="dashboard-panel-header" >
                <div>
                <span className="panel-eyebrow" >
                    PROJETOS
                    </span>

                    <h2>
Distribuição
                                        por estado
    </h2>

    <p>
                                        Visão dos
projetos
                                        ativos por
                                        fase atual.
                                    </p>
    </div>

    < div className = "panel-header-icon" >
        <FolderKanban
                                        size={ 20 }
                                    />
    </div>
    </div>

    < div className = "project-status-list" >
    {
        projetosPorEstado.map(
            (item) => {
                const largura =
                    item.quantidade ===
                        0
                        ? 0
                        : Math.max(
                            8,
                            Math.round(
                                (
                                    item.quantidade /
                                    maiorEstado
                                ) *
                                100
                            )
                        );

                return (
                    <div
                                                className= "project-status-item"
                key = {
                    item.nome
                }
                    >
                    <div className="project-status-heading" >
                        <div>
                        <span
                                                            className={ `project-status-dot ${item.classe}` }
                                                        />

                    <strong>
                {
                    item.nome
                }
                </strong>
                    </div>

                    <b>
                {
                    carregando
                        ? "..."
                        : item.quantidade
                }
                </b>
                    </div>

                    < div className = "project-status-track" >
                        <span
                                                        className={
                    item.classe
                }
                style = {{
                    width: `${largura}%`,
                                                        }
            }
                                                    />
            </div>
            </div>
        );
    }
                                )}
</div>
    </article>

    < article className = "dashboard-panel dashboard-attention" >
        <div className="dashboard-panel-header" >
            <div>
            <span className="panel-eyebrow" >
                PRIORIDADES
                </span>

                <h2>
Atenção
necessária
    </h2>

    <p>
                                        Situações que
                                        podem exigir
acompanhamento.
                                    </p>
    </div>

    < div className = "panel-header-icon attention-icon" >
        <AlertTriangle
                                        size={ 20 }
                                    />
    </div>
    </div>

{
    carregando ? (
        <div className= "dashboard-skeleton-list" >
        <div />
        < div />
        <div />
        </div>
                            ) : itensAtencao.length >
        0 ? (
            <div className= "attention-list" >
    {
        itensAtencao.map(
            (item) => (
                <div
                                                className= {`attention-item ${item.tipo}`}
                                                key = {
        item.id
    }
        >
        <div className="attention-item-icon" >
            {
                item.tipo ===
                    "critico" ? (
                        <AlertCircle
                                                            size= {
                    18
                                                            }
                />
                                                    ) : item.tipo ===
                    "aviso" ? (
                        <AlertTriangle
                                                            size= {
                    18
                                                            }
                />
                                                    ) : (
                    <Clock3
                                                            size={
                    18
                                                            }
                />
                                                    )
}
</div>

    < div >
    <strong>
    {
        item.titulo
    }
    </strong>

    <span>
{
    item.descricao
}
</span>
    </div>
    </div>
                                        )
                                    )}
</div>
                            ) : (
    <div className= "attention-empty" >
    <div>
    <CheckCircle2
                                            size={
    23
}
                                        />
    </div>

    <strong>
                                        Sem situações
críticas
    </strong>

    <span>
                                        Não existem
alertas
operacionais
                                        neste momento.
                                    </span>
    </div>
                            )}
</article>
    </section>

    < section className = "dashboard-secondary-grid" >
        <article className="dashboard-panel dashboard-task-progress" >
            <div className="dashboard-panel-header compact" >
                <div>
                <span className="panel-eyebrow" >
                    TAREFAS
                    </span>

                    <h2>
Progresso
operacional
    </h2>
    </div>

    < div className = "panel-header-icon" >
        <ClipboardCheck
                                        size={ 20 }
                                    />
    </div>
    </div>

    < div className = "task-progress-content" >
        <div className="task-progress-circle" >
            <div
                                        className="task-progress-ring"
style = {{
    background: `conic-gradient(#2f6fed ${percentagemConcluidas}%, #e9eef6 ${percentagemConcluidas}% 100%)`,
                                        }}
                                    >
    <div>
    <strong>
    {
        carregando
        ? "..."
            : `${percentagemConcluidas}%`
    }
    </strong>

    <span>
concluídas
    </span>
    </div>
    </div>
    </div>

    < div className = "task-progress-stats" >
        <div>
        <span>
        <ClipboardList
                                                size={
    17
}
                                            />
Total
    </span>

    <strong>
{
    carregando
        ? "..."
        : dados.tarefasTotal ??
        "—"
}
</strong>
    </div>

    < div >
    <span>
    <CheckCircle2
                                                size={
    17
}
                                            />
Concluídas
    </span>

    <strong>
{
    carregando
        ? "..."
        : dados.tarefasConcluidas ??
        "—"
}
</strong>
    </div>

    < div >
    <span>
    <TimerReset
                                                size={
    17
}
                                            />
                                            Por concluir
    </span>

    <strong>
{
    carregando
        ? "..."
        : dados.tarefasPendentes ??
        "—"
}
</strong>
    </div>
    </div>
    </div>
    </article>

    < article className = "dashboard-panel dashboard-operation" >
        <div className="dashboard-panel-header compact" >
            <div>
            <span className="panel-eyebrow" >
                PLATAFORMA
                </span>

                <h2>
Resumo
operacional
    </h2>
    </div>

    < div className = "panel-header-icon" >
        <Activity
                                        size={ 20 }
                                    />
    </div>
    </div>

    < div className = "operation-grid" >
        <div className="operation-item" >
            <div className="operation-icon" >
                <Activity
                                            size={ 19 }
                                        />
    </div>

    < div >
    <span>
    Alterações
    </span>

    <strong>
{
    carregando
        ? "..."
        : dados.alteracoes ??
        "—"
}
</strong>
    </div>
    </div>

    < div className = "operation-item" >
        <div className="operation-icon" >
            <FileText
                                            size={ 19 }
                                        />
    </div>

    < div >
    <span>
    Documentos
    </span>

    <strong>
{
    carregando
        ? "..."
        : dados.documentos ??
        "—"
}
</strong>
    </div>
    </div>

    < div className = "operation-item" >
        <div className="operation-icon" >
            <CirclePause
                                            size={ 19 }
                                        />
    </div>

    < div >
    <span>
    Suspensos
    </span>

    <strong>
{
    carregando
        ? "..."
        : projetosPorEstado.find(
            (
                item
            ) =>
                item.classe ===
                "suspenso"
        )
            ?.quantidade ??
        0
}
</strong>
    </div>
    </div>

    < div className = "operation-item" >
        <div className="operation-icon" >
            <CheckCircle2
                                            size={ 19 }
                                        />
    </div>

    < div >
    <span>
    Perfil
    </span>

    < strong className = "operation-profile" >
    {
        utilizador?.perfil
    }
        </strong>
        </div>
        </div>
        </div>
        </article>
        </section>
        </div>
        </div>
        </main>
        </div>
    );
}