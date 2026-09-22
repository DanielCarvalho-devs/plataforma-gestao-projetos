import {
    AlertCircle,
    CalendarDays,
    Eye,
    FileClock,
    Filter,
    History,
    Loader2,
    RefreshCw,
    Search,
    Trash2,
    UserRound,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import AppSidebar from "../components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/api";

import "./Historico.css";

/* =========================================================
   TIPOS
   ========================================================= */

interface HistoricoItem {
    idHistorico: number;
    idProjeto: number | null;
    idUtilizador: number | null;
    acao: string;
    entidade: string | null;
    idRegisto: number | null;
    descricao: string | null;
    dataAcao: string;
    codigoProjeto: string | null;
    nomeProjeto: string | null;
    nomeUtilizador: string | null;
}

interface Projeto {
    idProjeto: number;
    codigo: string;
    nome: string;
    ativo: boolean;
}

type PeriodoFiltro =
    | ""
    | "hoje"
    | "7dias"
    | "30dias";

/* =========================================================
   COMPONENTE
   ========================================================= */

function Historico() {
    const { utilizador } = useAuth();

    const [historicos, setHistoricos] =
        useState<HistoricoItem[]>([]);

    const [projetos, setProjetos] =
        useState<Projeto[]>([]);

    const [carregando, setCarregando] =
        useState(true);

    const [atualizando, setAtualizando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [sucesso, setSucesso] =
        useState("");

    const [pesquisa, setPesquisa] =
        useState("");

    const [filtroProjeto, setFiltroProjeto] =
        useState("");

    const [filtroAcao, setFiltroAcao] =
        useState("");

    const [filtroEntidade, setFiltroEntidade] =
        useState("");

    const [filtroUtilizador, setFiltroUtilizador] =
        useState("");

    const [filtroPeriodo, setFiltroPeriodo] =
        useState<PeriodoFiltro>("");

    const [
        historicoSelecionado,
        setHistoricoSelecionado,
    ] = useState<HistoricoItem | null>(null);

    const eAdministrador =
        utilizador?.perfil === "Administrador";

    /* =====================================================
       CARREGAMENTO
       ===================================================== */

    const carregarDados = async (
        mostrarAtualizacao = false,
    ) => {
        try {
            if (mostrarAtualizacao) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro("");

            const [
                historicosResposta,
                projetosResposta,
            ] = await Promise.all([
                apiRequest<HistoricoItem[]>(
                    "/Historicos",
                ),

                /*
                 * /Projetos/todos permite também apresentar
                 * projetos inativos no filtro do histórico.
                 * Isso é importante porque a auditoria mantém
                 * registos antigos.
                 */
                apiRequest<Projeto[]>(
                    "/Projetos/todos",
                ),
            ]);

            setHistoricos(
                Array.isArray(historicosResposta)
                    ? historicosResposta
                    : [],
            );

            setProjetos(
                Array.isArray(projetosResposta)
                    ? projetosResposta
                    : [],
            );
        } catch (error) {
            setErro(
                obterMensagemErro(
                    error,
                    "Não foi possível carregar o histórico.",
                ),
            );
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    };

    useEffect(() => {
        void carregarDados();
    }, []);

    /* =====================================================
       VALORES DOS FILTROS
       ===================================================== */

    const acoesExistentes = useMemo(() => {
        const valores = historicos
            .map((item) => item.acao?.trim())
            .filter(
                (valor): valor is string =>
                    Boolean(valor),
            );

        return Array.from(new Set(valores)).sort(
            (a, b) =>
                formatarAcao(a).localeCompare(
                    formatarAcao(b),
                    "pt-PT",
                ),
        );
    }, [historicos]);

    const entidadesExistentes = useMemo(() => {
        const valores = historicos
            .map((item) => item.entidade?.trim())
            .filter(
                (valor): valor is string =>
                    Boolean(valor),
            );

        return Array.from(new Set(valores)).sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "pt-PT",
                    {
                        sensitivity: "base",
                    },
                ),
        );
    }, [historicos]);

    const utilizadoresExistentes = useMemo(() => {
        const valores = historicos
            .map(
                (item) =>
                    item.nomeUtilizador?.trim(),
            )
            .filter(
                (valor): valor is string =>
                    Boolean(valor),
            );

        return Array.from(new Set(valores)).sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "pt-PT",
                    {
                        sensitivity: "base",
                    },
                ),
        );
    }, [historicos]);

    /* =====================================================
       FILTRAGEM
       ===================================================== */

    const historicosFiltrados = useMemo(() => {
        const termo = pesquisa
            .trim()
            .toLocaleLowerCase("pt-PT");

        return historicos.filter((item) => {
            const correspondePesquisa =
                termo === "" ||
                item.acao
                    .toLocaleLowerCase("pt-PT")
                    .includes(termo) ||
                formatarAcao(item.acao)
                    .toLocaleLowerCase("pt-PT")
                    .includes(termo) ||
                (item.entidade ?? "")
                    .toLocaleLowerCase("pt-PT")
                    .includes(termo) ||
                (item.descricao ?? "")
                    .toLocaleLowerCase("pt-PT")
                    .includes(termo) ||
                (item.codigoProjeto ?? "")
                    .toLocaleLowerCase("pt-PT")
                    .includes(termo) ||
                (item.nomeProjeto ?? "")
                    .toLocaleLowerCase("pt-PT")
                    .includes(termo) ||
                (item.nomeUtilizador ?? "")
                    .toLocaleLowerCase("pt-PT")
                    .includes(termo) ||
                String(item.idHistorico).includes(
                    termo,
                ) ||
                String(item.idRegisto ?? "").includes(
                    termo,
                );

            const correspondeProjeto =
                filtroProjeto === "" ||
                item.idProjeto ===
                Number(filtroProjeto);

            const correspondeAcao =
                filtroAcao === "" ||
                item.acao === filtroAcao;

            const correspondeEntidade =
                filtroEntidade === "" ||
                item.entidade === filtroEntidade;

            const correspondeUtilizador =
                filtroUtilizador === "" ||
                item.nomeUtilizador ===
                filtroUtilizador;

            const correspondePeriodo =
                verificarPeriodo(
                    item.dataAcao,
                    filtroPeriodo,
                );

            return (
                correspondePesquisa &&
                correspondeProjeto &&
                correspondeAcao &&
                correspondeEntidade &&
                correspondeUtilizador &&
                correspondePeriodo
            );
        });
    }, [
        historicos,
        pesquisa,
        filtroProjeto,
        filtroAcao,
        filtroEntidade,
        filtroUtilizador,
        filtroPeriodo,
    ]);

    const filtrosAtivos =
        pesquisa !== "" ||
        filtroProjeto !== "" ||
        filtroAcao !== "" ||
        filtroEntidade !== "" ||
        filtroUtilizador !== "" ||
        filtroPeriodo !== "";

    /* =====================================================
       LIMPAR FILTROS
       ===================================================== */

    const limparFiltros = () => {
        setPesquisa("");
        setFiltroProjeto("");
        setFiltroAcao("");
        setFiltroEntidade("");
        setFiltroUtilizador("");
        setFiltroPeriodo("");
    };

    /* =====================================================
       ELIMINAR
       ===================================================== */

    const eliminarHistorico = async (
        item: HistoricoItem,
    ) => {
        if (!eAdministrador) {
            return;
        }

        const confirmado = window.confirm(
            `Tem a certeza de que pretende eliminar o registo de histórico #${item.idHistorico}?\n\nEste registo faz parte da auditoria da plataforma.`,
        );

        if (!confirmado) {
            return;
        }

        const confirmadoNovamente =
            window.confirm(
                "Confirme novamente a eliminação deste registo de auditoria. Esta operação não pode ser anulada.",
            );

        if (!confirmadoNovamente) {
            return;
        }

        try {
            setErro("");
            setSucesso("");

            await apiRequest<void>(
                `/Historicos/${item.idHistorico}`,
                {
                    method: "DELETE",
                },
            );

            setHistoricoSelecionado(null);

            setSucesso(
                `Registo de histórico #${item.idHistorico} eliminado.`,
            );

            await carregarDados(true);
        } catch (error) {
            setErro(
                obterMensagemErro(
                    error,
                    "Não foi possível eliminar o registo de histórico.",
                ),
            );
        }
    };

    /* =====================================================
       INTERFACE
       ===================================================== */

    return (
        <div className= "historico-shell" >
        <AppSidebar />

        < main className = "historico-main" >
            <header className="historico-topbar" >
                <div className="historico-topbar-location" >
                    Plataforma / Histórico
                    </div>

                    < div className = "historico-topbar-profile" >
                        <div className="historico-topbar-avatar" >
                        {
                            obterIniciais(
                                utilizador?.nome ?? "U",
                            )
}
</div>

    < div >
    <strong>
    { utilizador?.nome ??
    "Utilizador"}
</strong>

    <span>
{ utilizador?.perfil ?? "" }
</span>
    </div>
    </div>
    </header>

    < div className = "historico-content" >
        <section className="historico-heading" >
            <div>
            <span className="historico-eyebrow" >
                AUDITORIA
                </span>

                <h1>
Histórico
    </h1>

    <p>
Consulte as operações e
                                alterações registadas
                                automaticamente pela
plataforma.
                            </p>
    </div>

    < button
type = "button"
className = "historico-refresh-main"
onClick = {() =>
void carregarDados(true)
                            }
disabled = { atualizando }
    >
    <RefreshCw
                                size={ 16 }
className = {
    atualizando
    ? "historico-rotating"
        : ""
}
    />

{
    atualizando
    ? "A atualizar..."
        : "Atualizar"
}
    </button>
    </section>

{
    erro && (
        <div className="historico-alert historico-alert-error" >
            <AlertCircle size={ 17 } />

                < span > { erro } </span>
                </div>
                    )
}

{
    sucesso && (
        <div className="historico-alert historico-alert-success" >
            <History size={ 17 } />

                < span > { sucesso } </span>
                </div>
                    )
}

<section className="historico-card" >
    <div className="historico-toolbar" >
        <div className="historico-search" >
            <Search size={ 17 } />

                < input
type = "text"
value = { pesquisa }
onChange = {(event) =>
setPesquisa(
    event.target.value,
)
                                    }
placeholder = "Pesquisar no histórico..."
    />
    </div>

{
    filtrosAtivos && (
        <button
                                    type="button"
    className = "historico-clear-button"
    onClick = { limparFiltros }
        >
        <X size={ 15 } />
                                    Limpar filtros
        </button>
                            )
}
</div>

    < div className = "historico-filters" >
        <div className="historico-filter-title" >
            <Filter size={ 15 } />
                <span>
Filtros
    </span>
    </div>

    < select
value = { filtroProjeto }
onChange = {(event) =>
setFiltroProjeto(
    event.target.value,
)
                                }
                            >
    <option value="" >
        Todos os projetos
            </option>

{
    projetos.map(
        (projeto) => (
            <option
                                            key= {
            projeto.idProjeto
        }
                                            value = {
            projeto.idProjeto
        }
        >
        { projeto.codigo } —{ " "}
                                            { projeto.nome }
                                            {!projeto.ativo
        ? " (inativo)"
        : ""}
</option>
                                    ),
                                )}
</select>

    < select
value = { filtroAcao }
onChange = {(event) =>
setFiltroAcao(
    event.target.value,
)
                                }
                            >
    <option value="" >
        Todas as ações
        </option>

{
    acoesExistentes.map(
        (acao) => (
            <option
                                            key= { acao }
                                            value = { acao }
        >
        {
            formatarAcao(
                acao,
            )
        }
        </option>
    ),
                                )
}
</select>

    < select
value = { filtroEntidade }
onChange = {(event) =>
setFiltroEntidade(
    event.target.value,
)
                                }
                            >
    <option value="" >
        Todas as entidades
        </option>

{
    entidadesExistentes.map(
        (entidade) => (
            <option
                                            key= { entidade }
                                            value = { entidade }
        >
        { entidade }
        </option>
    ),
                                )
}
</select>

    < select
value = { filtroUtilizador }
onChange = {(event) =>
setFiltroUtilizador(
    event.target.value,
)
                                }
                            >
    <option value="" >
        Todos os utilizadores
            </option>

{
    utilizadoresExistentes.map(
        (nome) => (
            <option
                                            key= { nome }
                                            value = { nome }
        >
        { nome }
        </option>
    ),
                                )
}
</select>

    < select
value = { filtroPeriodo }
onChange = {(event) =>
setFiltroPeriodo(
    event.target
        .value as PeriodoFiltro,
)
                                }
                            >
    <option value="" >
        Todo o período
            </option>

            < option value = "hoje" >
                Hoje
                </option>

                < option value = "7dias" >
                    Últimos 7 dias
                        </option>

                        < option value = "30dias" >
                            Últimos 30 dias
                                </option>
                                </select>
                                </div>

                                < div className = "historico-table-wrapper" >
                                    <table className="historico-table" >
                                        <thead>
                                        <tr>
                                        <th>
                                        Data e hora
                                            </th>

                                            <th>
Ação
    </th>

    <th>
Entidade
    </th>

    <th>
Projeto
    </th>

    <th>
Utilizador
    </th>

    <th>
Descrição
    </th>

    < th className = "historico-actions-column" >
        Ações
        </th>
        </tr>
        </thead>

        <tbody>
{
    carregando ? (
        <tr>
        <td
                                                colSpan= { 7}
                                                className = "historico-empty"
        >
        <div className="historico-loading" >
            <Loader2
                                                        size={ 20 }
    className = "historico-rotating"
        />

        <span>
        A carregar
                                                        histórico...
    </span>
        </div>
        </td>
        </tr>
                                    ) : historicosFiltrados.length ===
        0 ? (
            <tr>
            <td
                                                colSpan= { 7}
                                                className = "historico-empty"
        >
        <History
                                                    size={ 25 }
                                                />

        <strong>
                                                    Nenhum registo
    encontrado
        </strong>

        <span>
                                                    Não existem
                                                    operações que
    correspondam
                                                    aos filtros
    selecionados.
                                                </span>
        </td>
        </tr>
                                    ) : (
        historicosFiltrados.map(
            (item) => (
                <tr
                                                    key= {
                    item.idHistorico
                }
                >
                <td>
                <div className="historico-date-cell" >
        <CalendarDays
                                                                size={
            14
                                                                }
        />

        <div>
        <strong>
        {
            formatarData(
                item.dataAcao,
                                                                    )}
</strong>

    <span>
{
    formatarHora(
        item.dataAcao,
    )
}
</span>
    </div>
    </div>
    </td>

    < td >
    <span className="historico-action-badge" >
    {
        formatarAcao(
            item.acao,
                                                            )
    }
        </span>
        </td>

        < td >
        <div className="historico-entity-cell" >
            <strong>
            {
                item.entidade ??
                    "—"
            }
            </strong>

{
    item.idRegisto !==
    null && (
        <span>
        Registo #
    {
        item.idRegisto
    }
    </span>
                                                                )
}
</div>
    </td>

    <td>
{
    item.idProjeto !==
    null ? (
        <div className= "historico-project-cell" >
        <strong>
        {
            item.codigoProjeto ??
                `Projeto #${item.idProjeto}`
        }
</strong>

<span>
                                                                    {
        item.nomeProjeto ??
        "Projeto"
    }
    </span>
        </div>
                                                        ) : (
        <span className= "historico-muted" >
        Sem projeto
            </span>
                                                        )
}
</td>

    < td >
    <div className="historico-user-cell" >
        <UserRound
                                                                size={
    14
}
                                                            />

    <span>
{
    item.nomeUtilizador ??
    "Sistema"
}
</span>
    </div>
    </td>

    < td >
    <div
                                                            className="historico-description"
title = {
    item.descricao ??
        ""
}
    >
{
    item.descricao ??
        "—"
}
    </div>
    </td>

    < td className = "historico-actions-column" >
        <div className="historico-row-actions" >
            <button
                                                                type="button"
className = "historico-action-button"
onClick = {() =>
setHistoricoSelecionado(
    item,
)
                                                                }
title = "Visualizar"
    >
    <Eye
                                                                    size={
    15
}
                                                                />
    </button>

{
    eAdministrador && (
        <button
                                                                    type="button"
    className = "historico-action-button historico-action-danger"
    onClick = {() =>
    void eliminarHistorico(
        item,
    )
}
title = "Eliminar registo"
    >
    <Trash2
                                                                        size={
    15
}
                                                                    />
    </button>
                                                            )}
</div>
    </td>
    </tr>
                                            ),
                                        )
                                    )}
</tbody>
    </table>
    </div>

    < div className = "historico-footer" >
        <span>
        { historicosFiltrados.length }{ " " }
{
    historicosFiltrados.length ===
    1
    ? "registo apresentado"
    : "registos apresentados"
}
</span>

    <span>
{ historicos.length } no total
    </span>
    </div>
    </section>
    </div>
    </main>

{
    historicoSelecionado && (
        <div
                    className="historico-modal-overlay"
    onMouseDown = {(event) => {
        if (
            event.target ===
            event.currentTarget
        ) {
            setHistoricoSelecionado(
                null,
            );
        }
    }
}
                >
    <div className="historico-modal" >
        <div className="historico-modal-header" >
            <div className="historico-modal-title" >
                <div className="historico-modal-icon" >
                    <FileClock
                                        size={ 20 }
                                    />
    </div>

    < div >
    <span>
    REGISTO DE
AUDITORIA
    </span>

    <h2>
                                        Histórico #
{
    historicoSelecionado.idHistorico
}
</h2>
    </div>
    </div>

    < button
type = "button"
className = "historico-modal-close"
onClick = {() =>
setHistoricoSelecionado(
    null,
)
                                }
                            >
    <X size={ 19 } />
        </button>
        </div>

        < div className = "historico-modal-body" >
            <div className="historico-detail-grid" >
                <div className="historico-detail" >
                    <span>
                    Data e hora
                        </span>

                        <strong>
{
    formatarDataHora(
        historicoSelecionado.dataAcao,
    )
}
</strong>
    </div>

    < div className = "historico-detail" >
        <span>
        Ação
        </span>

        <strong>
{
    formatarAcao(
        historicoSelecionado.acao,
    )
}
</strong>
    </div>

    < div className = "historico-detail" >
        <span>
        Entidade
        </span>

        <strong>
{
    historicoSelecionado.entidade ??
    "Não definida"
}
</strong>
    </div>

    < div className = "historico-detail" >
        <span>
        ID do registo
            </span>

            <strong>
                                        {
        historicoSelecionado.idRegisto ??
            "—"
    }
    </strong>
    </div>

    < div className = "historico-detail" >
        <span>
        Utilizador
        </span>

        <strong>
{
    historicoSelecionado.nomeUtilizador ??
    "Sistema"
}
</strong>
    </div>

    < div className = "historico-detail" >
        <span>
        ID do utilizador
            </span>

            <strong>
                                        {
        historicoSelecionado.idUtilizador ??
            "—"
    }
    </strong>
    </div>

    < div className = "historico-detail historico-detail-full" >
        <span>
        Projeto
        </span>

        <strong>
{
    obterProjeto(
        historicoSelecionado,
    )
}
</strong>
    </div>

    < div className = "historico-detail historico-detail-full" >
        <span>
        Descrição
        </span>

        <p>
{
    historicoSelecionado.descricao ??
    "Sem descrição."
}
</p>
    </div>
    </div>

    < div className = "historico-audit-notice" >
        <History size={ 18 } />

            < div >
            <strong>
            Registo de auditoria
                </strong>

                <span>
                                        Este histórico
                                        representa uma
                                        operação registada
                                        pela plataforma.
                                    </span>
    </div>
    </div>
    </div>

    < div className = "historico-modal-footer" >
    { eAdministrador && (
            <button
                                    type="button"
className = "historico-delete-button"
onClick = {() =>
void eliminarHistorico(
    historicoSelecionado,
)
                                    }
                                >
    <Trash2 size={ 15 } />
Eliminar
    </button>
                            )}

<button
                                type="button"
className = "historico-close-button"
onClick = {() =>
setHistoricoSelecionado(
    null,
)
                                }
                            >
    Fechar
    </button>
    </div>
    </div>
    </div>
            )}
</div>
    );
}

/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function formatarAcao(
    acao: string,
): string {
    if (!acao) {
        return "Operação";
    }

    return acao
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
            /(^|\s)\S/g,
            (letra) =>
                letra.toUpperCase(),
        );
}

function formatarData(
    valor: string,
): string {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return valor || "—";
    }

    return new Intl.DateTimeFormat(
        "pt-PT",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        },
    ).format(data);
}

function formatarHora(
    valor: string,
): string {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "pt-PT",
        {
            hour: "2-digit",
            minute: "2-digit",
        },
    ).format(data);
}

function formatarDataHora(
    valor: string,
): string {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return valor || "—";
    }

    return new Intl.DateTimeFormat(
        "pt-PT",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        },
    ).format(data);
}

function obterProjeto(
    item: HistoricoItem,
): string {
    if (
        item.codigoProjeto &&
        item.nomeProjeto
    ) {
        return `${item.codigoProjeto} — ${item.nomeProjeto}`;
    }

    if (item.codigoProjeto) {
        return item.codigoProjeto;
    }

    if (item.nomeProjeto) {
        return item.nomeProjeto;
    }

    if (item.idProjeto !== null) {
        return `Projeto #${item.idProjeto}`;
    }

    return "Sem projeto associado";
}

function obterIniciais(
    nome: string,
): string {
    const partes = nome
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (partes.length === 0) {
        return "U";
    }

    if (partes.length === 1) {
        return partes[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        partes[0][0] +
        partes[partes.length - 1][0]
    ).toUpperCase();
}

function verificarPeriodo(
    valor: string,
    periodo: PeriodoFiltro,
): boolean {
    if (!periodo) {
        return true;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return false;
    }

    const agora = new Date();

    if (periodo === "hoje") {
        return (
            data.getFullYear() ===
            agora.getFullYear() &&
            data.getMonth() ===
            agora.getMonth() &&
            data.getDate() ===
            agora.getDate()
        );
    }

    const diferenca =
        agora.getTime() -
        data.getTime();

    const dias =
        diferenca /
        (1000 * 60 * 60 * 24);

    if (periodo === "7dias") {
        return dias >= 0 && dias <= 7;
    }

    if (periodo === "30dias") {
        return dias >= 0 && dias <= 30;
    }

    return true;
}

function obterMensagemErro(
    error: unknown,
    mensagemPadrao: string,
): string {
    if (error instanceof Error) {
        return (
            error.message ||
            mensagemPadrao
        );
    }

    return mensagemPadrao;
}

export default Historico;