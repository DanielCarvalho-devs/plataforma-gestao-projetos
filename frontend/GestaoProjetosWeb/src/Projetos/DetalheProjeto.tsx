import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Download,
    ExternalLink,
    Eye,
    FileText,
    FolderKanban,
    History,
    MapPin,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
    UploadCloud,
    UserRound,
    Users,
    Wrench,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    SyntheticEvent,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import AppSidebar from "../components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import {
    abrirArquivoProtegido,
    apiFormData,
    apiRequest,
    descarregarArquivoProtegido,
} from "../services/api";

import "./DetalheProjeto.css";

/* ========================================================= */
/* INTERFACES                                                */
/* ========================================================= */

interface Cliente {
    idCliente: number;
    nome: string;
    empresa?: string | null;
    telefone?: string | null;
    email?: string | null;
    morada?: string | null;
    observacoes?: string | null;
    ativo: boolean;
    dataCriacao: string;
}

interface Projeto {
    idProjeto: number;
    idCliente: number;
    idResponsavel?: number | null;
    codigo: string;
    nome: string;
    descricao?: string | null;
    localObra?: string | null;
    dataInicio?: string | null;
    prazoPrevisto?: string | null;
    estado: string;
    observacoes?: string | null;
    ativo: boolean;
    dataCriacao: string;
    dataAtualizacao?: string | null;
    nomeCliente?: string | null;
    nomeResponsavel?: string | null;
}

interface Tarefa {
    idTarefa: number;
    idProjeto: number;
    idUtilizador?: number | null;
    titulo: string;
    descricao?: string | null;
    data: string;
    horas?: number | null;
    estado: string;
    prioridade: string;
    dataCriacao: string;
    nomeProjeto?: string | null;
    nomeUtilizador?: string | null;
}

interface Alteracao {
    idAlteracao: number;
    idProjeto: number;
    idUtilizador?: number | null;
    descricao: string;
    dataAlteracao: string;
    estado: string;
    observacoes?: string | null;
    codigoProjeto?: string | null;
    nomeProjeto?: string | null;
    nomeUtilizador?: string | null;
}

interface Documento {
    idDocumento: number;
    idProjeto: number;
    nome: string;
    caminho: string;
    tipo?: string | null;
    dataUpload: string;
    codigoProjeto?: string | null;
    nomeProjeto?: string | null;
}

interface Historico {
    idHistorico: number;
    idProjeto?: number | null;
    idUtilizador?: number | null;
    acao: string;
    entidade?: string | null;
    idRegisto?: number | null;
    descricao?: string | null;
    dataAcao: string;
    codigoProjeto?: string | null;
    nomeProjeto?: string | null;
    nomeUtilizador?: string | null;
}

interface Utilizador {
    idUtilizador: number;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
}

interface ProjetoForm {
    idCliente: string;
    idResponsavel: string;
    codigo: string;
    nome: string;
    descricao: string;
    localObra: string;
    dataInicio: string;
    prazoPrevisto: string;
    estado: string;
    observacoes: string;
}

interface TarefaForm {
    titulo: string;
    descricao: string;
    data: string;
    horas: string;
    estado: string;
    prioridade: string;
    idUtilizador: string;
}

interface AlteracaoForm {
    descricao: string;
    dataAlteracao: string;
    estado: string;
    observacoes: string;
    idUtilizador: string;
}

interface DocumentoForm {
    nome: string;
    caminho: string;
    tipo: string;
}

type Separador =
    | "visao-geral"
    | "tarefas"
    | "alteracoes"
    | "documentos"
    | "historico";

type ModoTarefa =
    | "novo"
    | "visualizar"
    | "editar"
    | null;

type ModoAlteracao =
    | "novo"
    | "visualizar"
    | "editar"
    | null;

type ModoDocumento =
    | "novo"
    | "visualizar"
    | "editar"
    | null;

/* ========================================================= */
/* CONSTANTES                                                */
/* ========================================================= */

const estadosProjeto = [
    "Planeado",
    "Em desenvolvimento",
    "Suspenso",
    "Concluído",
    "Cancelado",
];

const estadosTarefa = [
    "Pendente",
    "Em execução",
    "Concluída",
    "Cancelada",
];

const prioridadesTarefa = [
    "Baixa",
    "Normal",
    "Alta",
    "Urgente",
];

const estadosAlteracao = [
    "Pendente",
    "Em análise",
    "Aprovada",
    "Rejeitada",
    "Concluída",
];

const tiposDocumento = [
    "PDF",
    "Planta",
    "Fotografia",
    "Desenho CAD",
    "Modelo 3D",
    "Outro ficheiro",
];

/* ========================================================= */
/* FUNÇÕES AUXILIARES                                        */
/* ========================================================= */

const obterDataHoje = () => {
    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes = String(
        hoje.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        hoje.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
};

const formatarData = (
    valor?: string | null
) => {
    if (!valor) {
        return "Não definida";
    }

    const apenasData =
        valor.substring(0, 10);

    const partes =
        apenasData.split("-");

    if (partes.length !== 3) {
        return valor;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const formatarDataHora = (
    valor?: string | null
) => {
    if (!valor) {
        return "—";
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return valor;
    }

    return data.toLocaleString(
        "pt-PT",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
};

const normalizarTexto = (
    valor?: string | null
) => {
    return (valor ?? "")
        .toLocaleLowerCase("pt-PT")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
};

const caminhoPodeAbrirNoBrowser = (
    caminho?: string | null
) => {
    if (!caminho) {
        return false;
    }

    const valor =
        caminho
            .trim()
            .toLowerCase();

    return (
        valor.startsWith(
            "http://"
        ) ||
        valor.startsWith(
            "https://"
        )
    );
};

/* ========================================================= */
/* COMPONENTE                                                */
/* ========================================================= */

export default function DetalheProjeto() {
    const navigate =
        useNavigate();

    const { id } =
        useParams();

    const { utilizador } =
        useAuth();

    const idProjeto =
        Number(id);

    /* DADOS PRINCIPAIS */

    const [
        projeto,
        setProjeto,
    ] =
        useState<Projeto | null>(
            null
        );

    const [
        clientes,
        setClientes,
    ] =
        useState<Cliente[]>([]);

    const [
        tarefas,
        setTarefas,
    ] =
        useState<Tarefa[]>([]);

    const [
        alteracoes,
        setAlteracoes,
    ] =
        useState<Alteracao[]>([]);

    const [
        documentos,
        setDocumentos,
    ] =
        useState<Documento[]>([]);

    const [
        historico,
        setHistorico,
    ] =
        useState<Historico[]>([]);

    const [
        utilizadores,
        setUtilizadores,
    ] =
        useState<Utilizador[]>([]);

    const [
        separador,
        setSeparador,
    ] =
        useState<Separador>(
            "visao-geral"
        );

    const [
        carregando,
        setCarregando,
    ] =
        useState(true);

    const [
        atualizando,
        setAtualizando,
    ] =
        useState(false);

    const [
        erro,
        setErro,
    ] =
        useState("");

    const [
        sucesso,
        setSucesso,
    ] =
        useState("");

    /* PROJETO */

    const [
        modalProjeto,
        setModalProjeto,
    ] =
        useState(false);

    const [
        processandoProjeto,
        setProcessandoProjeto,
    ] =
        useState(false);

    const [
        erroProjeto,
        setErroProjeto,
    ] =
        useState("");

    const [
        projetoForm,
        setProjetoForm,
    ] =
        useState<ProjetoForm>({
            idCliente: "",
            idResponsavel: "",
            codigo: "",
            nome: "",
            descricao: "",
            localObra: "",
            dataInicio: "",
            prazoPrevisto: "",
            estado:
                "Planeado",
            observacoes: "",
        });

    /* TAREFAS */

    const [
        processandoTarefa,
        setProcessandoTarefa,
    ] =
        useState(false);

    const [
        modoTarefa,
        setModoTarefa,
    ] =
        useState<ModoTarefa>(
            null
        );

    const [
        tarefaSelecionada,
        setTarefaSelecionada,
    ] =
        useState<Tarefa | null>(
            null
        );

    const [
        tarefaForm,
        setTarefaForm,
    ] =
        useState<TarefaForm>({
            titulo: "",
            descricao: "",
            data: obterDataHoje(),
            horas: "",
            estado: "Pendente",
            prioridade: "Normal",
            idUtilizador: "",
        });

    const [
        erroTarefa,
        setErroTarefa,
    ] =
        useState("");

    /* ALTERAÇÕES */

    const [
        processandoAlteracao,
        setProcessandoAlteracao,
    ] =
        useState(false);

    const [
        modoAlteracao,
        setModoAlteracao,
    ] =
        useState<ModoAlteracao>(
            null
        );

    const [
        alteracaoSelecionada,
        setAlteracaoSelecionada,
    ] =
        useState<Alteracao | null>(
            null
        );

    const [
        alteracaoForm,
        setAlteracaoForm,
    ] =
        useState<AlteracaoForm>({
            descricao: "",
            dataAlteracao:
                obterDataHoje(),
            estado:
                "Pendente",
            observacoes: "",
            idUtilizador: "",
        });

    const [
        erroAlteracao,
        setErroAlteracao,
    ] =
        useState("");

    /* DOCUMENTOS */

    const [
        processandoDocumento,
        setProcessandoDocumento,
    ] =
        useState(false);

    const [
        modoDocumento,
        setModoDocumento,
    ] =
        useState<ModoDocumento>(
            null
        );

    const [
        documentoSelecionado,
        setDocumentoSelecionado,
    ] =
        useState<Documento | null>(
            null
        );

    const [
        documentoForm,
        setDocumentoForm,
    ] =
        useState<DocumentoForm>({
            nome: "",
            caminho: "",
            tipo: "",
        });

    const [
        erroDocumento,
        setErroDocumento,
    ] =
        useState("");

    const [
        arquivoDocumento,
        setArquivoDocumento,
    ] =
        useState<File | null>(null);

    /* PERFIL */

    const eAdministrador =
        utilizador?.perfil ===
        "Administrador";

    const eGestor =
        utilizador?.perfil ===
        "Gestor";

    const podeGerirProjeto =
        eAdministrador ||
        eGestor;

    /* ===================================================== */
    /* CARREGAMENTO                                          */
    /* ===================================================== */

    const carregarDados =
        async (
            atualizacaoManual = false
        ) => {
            if (
                !Number.isInteger(
                    idProjeto
                ) ||
                idProjeto <= 0
            ) {
                setErro(
                    "O projeto indicado é inválido."
                );

                setCarregando(false);

                return;
            }

            if (
                atualizacaoManual
            ) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro("");

            try {
                const [
                    projetoResponse,
                    clientesResponse,
                    tarefasResponse,
                    alteracoesResponse,
                    documentosResponse,
                    historicoResponse,
                ] =
                    await Promise.all([
                        apiRequest<Projeto>(
                            `/Projetos/${idProjeto}`
                        ),

                        apiRequest<Cliente[]>(
                            "/Clientes"
                        ),

                        apiRequest<Tarefa[]>(
                            `/Tarefas/projeto/${idProjeto}`
                        ),

                        apiRequest<Alteracao[]>(
                            `/Alteracoes/projeto/${idProjeto}`
                        ),

                        apiRequest<Documento[]>(
                            `/Documentos/projeto/${idProjeto}`
                        ),

                        apiRequest<Historico[]>(
                            `/Historicos/projeto/${idProjeto}`
                        ),
                    ]);

                setProjeto(
                    projetoResponse
                );

                setClientes(
                    clientesResponse
                );

                setTarefas(
                    tarefasResponse
                );

                setAlteracoes(
                    alteracoesResponse
                );

                setDocumentos(
                    documentosResponse
                );

                setHistorico(
                    historicoResponse
                );

                if (
                    eAdministrador
                ) {
                    try {
                        const utilizadoresResponse =
                            await apiRequest<
                                Utilizador[]
                            >(
                                "/Utilizadores"
                            );

                        setUtilizadores(
                            utilizadoresResponse
                        );
                    } catch {
                        setUtilizadores(
                            []
                        );
                    }
                }
            } catch (error) {
                console.error(
                    error
                );

                setErro(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar o projeto."
                );
            } finally {
                setCarregando(
                    false
                );

                setAtualizando(
                    false
                );
            }
        };

    useEffect(() => {
        void carregarDados();
    }, [idProjeto]);

    /* ===================================================== */
    /* INDICADORES                                           */
    /* ===================================================== */

    const tarefasConcluidas =
        useMemo(
            () =>
                tarefas.filter(
                    (tarefa) =>
                        normalizarTexto(
                            tarefa.estado
                        ) ===
                        "concluida"
                ).length,
            [tarefas]
        );

    const tarefasPendentes =
        useMemo(
            () =>
                tarefas.filter(
                    (tarefa) =>
                        normalizarTexto(
                            tarefa.estado
                        ) !==
                        "concluida" &&
                        normalizarTexto(
                            tarefa.estado
                        ) !==
                        "cancelada"
                ).length,
            [tarefas]
        );

    const horasRegistadas =
        useMemo(
            () =>
                tarefas.reduce(
                    (
                        total,
                        tarefa
                    ) =>
                        total +
                        Number(
                            tarefa.horas ??
                            0
                        ),
                    0
                ),
            [tarefas]
        );

    /* ===================================================== */
    /* EDITAR PROJETO                                        */
    /* ===================================================== */

    const abrirEditarProjeto =
        () => {
            if (!projeto) {
                return;
            }

            setErroProjeto("");
            setSucesso("");

            setProjetoForm({
                idCliente:
                    String(
                        projeto.idCliente
                    ),

                idResponsavel:
                    projeto.idResponsavel !=
                        null
                        ? String(
                            projeto.idResponsavel
                        )
                        : "",

                codigo:
                    projeto.codigo,

                nome:
                    projeto.nome,

                descricao:
                    projeto.descricao ??
                    "",

                localObra:
                    projeto.localObra ??
                    "",

                dataInicio:
                    projeto.dataInicio
                        ? projeto.dataInicio.substring(
                            0,
                            10
                        )
                        : "",

                prazoPrevisto:
                    projeto.prazoPrevisto
                        ? projeto.prazoPrevisto.substring(
                            0,
                            10
                        )
                        : "",

                estado:
                    projeto.estado,

                observacoes:
                    projeto.observacoes ??
                    "",
            });

            setModalProjeto(
                true
            );
        };

    const fecharEditarProjeto =
        () => {
            if (
                processandoProjeto
            ) {
                return;
            }

            setErroProjeto("");
            setModalProjeto(false);
        };

    const guardarProjeto =
        async (
            evento: SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (!projeto) {
                return;
            }

            if (
                !projetoForm.idCliente
            ) {
                setErroProjeto(
                    "Selecione o cliente."
                );

                return;
            }

            if (
                !projetoForm.nome.trim()
            ) {
                setErroProjeto(
                    "O nome do projeto é obrigatório."
                );

                return;
            }

            if (
                !projetoForm.estado
            ) {
                setErroProjeto(
                    "Selecione o estado do projeto."
                );

                return;
            }

            if (
                projetoForm.dataInicio &&
                projetoForm.prazoPrevisto &&
                projetoForm.prazoPrevisto <
                projetoForm.dataInicio
            ) {
                setErroProjeto(
                    "O prazo previsto não pode ser anterior à data de início."
                );

                return;
            }

            setProcessandoProjeto(
                true
            );

            setErroProjeto("");

            try {
                await apiRequest(
                    `/Projetos/${projeto.idProjeto}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify({
                                idCliente:
                                    Number(
                                        projetoForm.idCliente
                                    ),

                                idResponsavel:
                                    projetoForm.idResponsavel
                                        ? Number(
                                            projetoForm.idResponsavel
                                        )
                                        : null,

                                codigo:
                                    projetoForm.codigo.trim(),

                                nome:
                                    projetoForm.nome.trim(),

                                descricao:
                                    projetoForm.descricao.trim() ||
                                    null,

                                localObra:
                                    projetoForm.localObra.trim() ||
                                    null,

                                dataInicio:
                                    projetoForm.dataInicio ||
                                    null,

                                prazoPrevisto:
                                    projetoForm.prazoPrevisto ||
                                    null,

                                estado:
                                    projetoForm.estado,

                                observacoes:
                                    projetoForm.observacoes.trim() ||
                                    null,
                            }),
                    }
                );

                setModalProjeto(
                    false
                );

                setSucesso(
                    "Projeto atualizado com sucesso."
                );

                await carregarDados();
            } catch (error) {
                setErroProjeto(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o projeto."
                );
            } finally {
                setProcessandoProjeto(
                    false
                );
            }
        };

    /* ===================================================== */
    /* TAREFAS                                               */
    /* ===================================================== */

    const abrirNovaTarefa =
        () => {
            setErroTarefa("");
            setSucesso("");

            setTarefaSelecionada(
                null
            );

            setTarefaForm({
                titulo: "",
                descricao: "",
                data:
                    obterDataHoje(),
                horas: "",
                estado:
                    "Pendente",
                prioridade:
                    "Normal",
                idUtilizador:
                    "",
            });

            setModoTarefa(
                "novo"
            );
        };

    const preencherFormularioTarefa =
        (
            tarefa: Tarefa
        ) => {
            setTarefaForm({
                titulo:
                    tarefa.titulo,

                descricao:
                    tarefa.descricao ??
                    "",

                data:
                    tarefa.data.substring(
                        0,
                        10
                    ),

                horas:
                    tarefa.horas !=
                        null
                        ? String(
                            tarefa.horas
                        )
                        : "",

                estado:
                    tarefa.estado,

                prioridade:
                    tarefa.prioridade,

                idUtilizador:
                    tarefa.idUtilizador !=
                        null
                        ? String(
                            tarefa.idUtilizador
                        )
                        : "",
            });
        };

    const abrirVisualizacaoTarefa =
        (
            tarefa: Tarefa
        ) => {
            setErroTarefa("");
            setSucesso("");

            setTarefaSelecionada(
                tarefa
            );

            preencherFormularioTarefa(
                tarefa
            );

            setModoTarefa(
                "visualizar"
            );
        };

    const abrirEdicaoTarefa =
        (
            tarefa: Tarefa
        ) => {
            setErroTarefa("");

            setTarefaSelecionada(
                tarefa
            );

            preencherFormularioTarefa(
                tarefa
            );

            setModoTarefa(
                "editar"
            );
        };

    const fecharModalTarefa =
        () => {
            if (
                processandoTarefa
            ) {
                return;
            }

            setErroTarefa("");
            setModoTarefa(null);
            setTarefaSelecionada(
                null
            );
        };

    const validarTarefa =
        () => {
            if (
                !tarefaForm.titulo.trim()
            ) {
                setErroTarefa(
                    "O título da tarefa é obrigatório."
                );

                return false;
            }

            if (
                !tarefaForm.data
            ) {
                setErroTarefa(
                    "A data da tarefa é obrigatória."
                );

                return false;
            }

            if (
                tarefaForm.horas &&
                Number(
                    tarefaForm.horas
                ) < 0
            ) {
                setErroTarefa(
                    "O número de horas não pode ser negativo."
                );

                return false;
            }

            return true;
        };

    const obterPayloadTarefa =
        () => ({
            idProjeto,

            idUtilizador:
                tarefaForm.idUtilizador
                    ? Number(
                        tarefaForm.idUtilizador
                    )
                    : null,

            titulo:
                tarefaForm.titulo.trim(),

            descricao:
                tarefaForm.descricao.trim() ||
                null,

            data:
                tarefaForm.data,

            horas:
                tarefaForm.horas
                    ? Number(
                        tarefaForm.horas
                    )
                    : null,

            estado:
                tarefaForm.estado,

            prioridade:
                tarefaForm.prioridade,
        });

    const guardarNovaTarefa =
        async (
            evento: SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !validarTarefa()
            ) {
                return;
            }

            setProcessandoTarefa(
                true
            );

            setErroTarefa("");

            try {
                await apiRequest(
                    "/Tarefas",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                obterPayloadTarefa()
                            ),
                    }
                );

                setModoTarefa(null);

                setSucesso(
                    "Tarefa criada com sucesso."
                );

                setSeparador(
                    "tarefas"
                );

                await carregarDados();
            } catch (error) {
                setErroTarefa(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar a tarefa."
                );
            } finally {
                setProcessandoTarefa(
                    false
                );
            }
        };

    const guardarEdicaoTarefa =
        async (
            evento: SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !tarefaSelecionada ||
                !validarTarefa()
            ) {
                return;
            }

            setProcessandoTarefa(
                true
            );

            setErroTarefa("");

            try {
                await apiRequest(
                    `/Tarefas/${tarefaSelecionada.idTarefa}`,
                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                obterPayloadTarefa()
                            ),
                    }
                );

                setModoTarefa(null);

                setSucesso(
                    "Tarefa atualizada com sucesso."
                );

                setSeparador(
                    "tarefas"
                );

                await carregarDados();
            } catch (error) {
                setErroTarefa(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar a tarefa."
                );
            } finally {
                setProcessandoTarefa(
                    false
                );
            }
        };

    const eliminarTarefa =
        async (
            tarefa: Tarefa
        ) => {
            if (!podeGerirProjeto) {
                setErro(
                    "Não possui permissão para eliminar tarefas."
                );
                return;
            }

            const confirmado =
                window.confirm(
                    `Deseja eliminar a tarefa "${tarefa.titulo}"?`
                );

            if (!confirmado) {
                return;
            }

            setErro("");
            setSucesso("");

            try {
                await apiRequest(
                    `/Tarefas/${tarefa.idTarefa}`,
                    {
                        method: "DELETE",
                    }
                );

                if (
                    tarefaSelecionada?.idTarefa ===
                    tarefa.idTarefa
                ) {
                    setModoTarefa(null);
                    setTarefaSelecionada(null);
                }

                setSucesso(
                    "Tarefa eliminada com sucesso."
                );

                setSeparador(
                    "tarefas"
                );

                await carregarDados();
            } catch (error) {
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível eliminar a tarefa."
                );
            }
        };

    /* ===================================================== */
    /* ALTERAÇÕES                                            */
    /* ===================================================== */

    const abrirNovaAlteracao =
        () => {
            setErroAlteracao("");
            setSucesso("");

            setAlteracaoSelecionada(
                null
            );

            setAlteracaoForm({
                descricao: "",
                dataAlteracao:
                    obterDataHoje(),
                estado:
                    "Pendente",
                observacoes: "",
                idUtilizador:
                    "",
            });

            setModoAlteracao(
                "novo"
            );
        };

    const preencherFormularioAlteracao =
        (
            alteracao: Alteracao
        ) => {
            setAlteracaoForm({
                descricao:
                    alteracao.descricao,

                dataAlteracao:
                    alteracao.dataAlteracao
                        ? alteracao.dataAlteracao.substring(
                            0,
                            10
                        )
                        : obterDataHoje(),

                estado:
                    alteracao.estado,

                observacoes:
                    alteracao.observacoes ??
                    "",

                idUtilizador:
                    alteracao.idUtilizador !=
                        null
                        ? String(
                            alteracao.idUtilizador
                        )
                        : "",
            });
        };

    const abrirVisualizacaoAlteracao =
        (
            alteracao: Alteracao
        ) => {
            setErroAlteracao("");
            setSucesso("");

            setAlteracaoSelecionada(
                alteracao
            );

            preencherFormularioAlteracao(
                alteracao
            );

            setModoAlteracao(
                "visualizar"
            );
        };

    const abrirEdicaoAlteracao =
        (
            alteracao: Alteracao
        ) => {
            setErroAlteracao("");

            setAlteracaoSelecionada(
                alteracao
            );

            preencherFormularioAlteracao(
                alteracao
            );

            setModoAlteracao(
                "editar"
            );
        };

    const fecharModalAlteracao =
        () => {
            if (
                processandoAlteracao
            ) {
                return;
            }

            setErroAlteracao("");
            setModoAlteracao(null);

            setAlteracaoSelecionada(
                null
            );
        };

    const validarAlteracao =
        () => {
            if (
                !alteracaoForm.descricao.trim()
            ) {
                setErroAlteracao(
                    "A descrição da alteração é obrigatória."
                );

                return false;
            }

            if (
                !alteracaoForm.dataAlteracao
            ) {
                setErroAlteracao(
                    "A data da alteração é obrigatória."
                );

                return false;
            }

            return true;
        };

    const obterPayloadAlteracao =
        () => ({
            idProjeto,

            idUtilizador:
                alteracaoForm.idUtilizador
                    ? Number(
                        alteracaoForm.idUtilizador
                    )
                    : null,

            descricao:
                alteracaoForm.descricao.trim(),

            dataAlteracao:
                `${alteracaoForm.dataAlteracao}T00:00:00`,

            estado:
                alteracaoForm.estado,

            observacoes:
                alteracaoForm.observacoes.trim() ||
                null,
        });

    const guardarNovaAlteracao =
        async (
            evento: SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !validarAlteracao()
            ) {
                return;
            }

            setProcessandoAlteracao(
                true
            );

            setErroAlteracao("");

            try {
                await apiRequest(
                    "/Alteracoes",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                obterPayloadAlteracao()
                            ),
                    }
                );

                setModoAlteracao(null);

                setSucesso(
                    "Alteração criada com sucesso."
                );

                setSeparador(
                    "alteracoes"
                );

                await carregarDados();
            } catch (error) {
                setErroAlteracao(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar a alteração."
                );
            } finally {
                setProcessandoAlteracao(
                    false
                );
            }
        };

    const guardarEdicaoAlteracao =
        async (
            evento: SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !alteracaoSelecionada ||
                !validarAlteracao()
            ) {
                return;
            }

            setProcessandoAlteracao(
                true
            );

            setErroAlteracao("");

            try {
                await apiRequest(
                    `/Alteracoes/${alteracaoSelecionada.idAlteracao}`,
                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                obterPayloadAlteracao()
                            ),
                    }
                );

                setModoAlteracao(null);

                setSucesso(
                    "Alteração atualizada com sucesso."
                );

                setSeparador(
                    "alteracoes"
                );

                await carregarDados();
            } catch (error) {
                setErroAlteracao(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar a alteração."
                );
            } finally {
                setProcessandoAlteracao(
                    false
                );
            }
        };

    const eliminarAlteracao =
        async (
            alteracao: Alteracao
        ) => {
            if (!podeGerirProjeto) {
                setErro(
                    "Não possui permissão para eliminar alterações."
                );
                return;
            }

            const confirmado =
                window.confirm(
                    "Deseja eliminar esta alteração do projeto?"
                );

            if (!confirmado) {
                return;
            }

            setErro("");
            setSucesso("");

            try {
                await apiRequest(
                    `/Alteracoes/${alteracao.idAlteracao}`,
                    {
                        method: "DELETE",
                    }
                );

                if (
                    alteracaoSelecionada?.idAlteracao ===
                    alteracao.idAlteracao
                ) {
                    setModoAlteracao(null);
                    setAlteracaoSelecionada(null);
                }

                setSucesso(
                    "Alteração eliminada com sucesso."
                );

                setSeparador(
                    "alteracoes"
                );

                await carregarDados();
            } catch (error) {
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível eliminar a alteração."
                );
            }
        };

    /* ===================================================== */
    /* DOCUMENTOS                                            */
    /* ===================================================== */

    const extensoesDocumentoPermitidas = [
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".dwg",
        ".dxf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".zip",
    ];

    const tamanhoMaximoDocumento =
        25 * 1024 * 1024;

    const documentoFoiEnviado =
        (
            documento?: Documento | null
        ) => {
            const caminho =
                documento?.caminho
                    ?.trim()
                    .replaceAll("\\", "/")
                    .toLowerCase() ??
                "";

            return (
                caminho.startsWith(
                    "/uploads/projetos/"
                ) ||
                caminho.startsWith(
                    "uploads/projetos/"
                )
            );
        };

    const obterExtensao =
        (nome: string) => {
            const indice =
                nome.lastIndexOf(".");

            if (
                indice < 0 ||
                indice === nome.length - 1
            ) {
                return "";
            }

            return nome
                .substring(indice)
                .toLowerCase();
        };

    const obterNomeSemExtensao =
        (nome: string) => {
            const indice =
                nome.lastIndexOf(".");

            if (indice <= 0) {
                return nome;
            }

            return nome.substring(
                0,
                indice
            );
        };

    const obterTipoPorArquivo =
        (arquivo: File) => {
            const extensao =
                obterExtensao(
                    arquivo.name
                );

            if (extensao === ".pdf") {
                return "PDF";
            }

            if (
                extensao === ".png" ||
                extensao === ".jpg" ||
                extensao === ".jpeg" ||
                extensao === ".webp"
            ) {
                return "Fotografia";
            }

            if (
                extensao === ".dwg" ||
                extensao === ".dxf"
            ) {
                return "Desenho CAD";
            }

            return "Outro ficheiro";
        };

    const obterNomeDownload =
        (documento: Documento) => {
            const nome =
                documento.nome.trim() ||
                "documento";

            if (obterExtensao(nome)) {
                return nome;
            }

            const caminhoNormalizado =
                documento.caminho
                    .replaceAll("\\", "/");

            const nomeFisico =
                caminhoNormalizado
                    .split("/")
                    .filter(Boolean)
                    .pop() ??
                "";

            const extensao =
                obterExtensao(
                    nomeFisico
                );

            return extensao
                ? `${nome}${extensao}`
                : nome;
        };

    const abrirNovoDocumento =
        () => {
            setErroDocumento("");
            setSucesso("");

            setDocumentoSelecionado(
                null
            );

            setArquivoDocumento(null);

            setDocumentoForm({
                nome: "",
                caminho: "",
                tipo: "",
            });

            setModoDocumento(
                "novo"
            );
        };

    const preencherFormularioDocumento =
        (
            documento: Documento
        ) => {
            setDocumentoForm({
                nome:
                    documento.nome,

                caminho:
                    documento.caminho,

                tipo:
                    documento.tipo ??
                    "",
            });
        };

    const abrirVisualizacaoDocumento =
        (
            documento: Documento
        ) => {
            setErroDocumento("");
            setSucesso("");
            setArquivoDocumento(null);

            setDocumentoSelecionado(
                documento
            );

            preencherFormularioDocumento(
                documento
            );

            setModoDocumento(
                "visualizar"
            );
        };

    const abrirEdicaoDocumento =
        (
            documento: Documento
        ) => {
            setErroDocumento("");
            setArquivoDocumento(null);

            setDocumentoSelecionado(
                documento
            );

            preencherFormularioDocumento(
                documento
            );

            setModoDocumento(
                "editar"
            );
        };

    const fecharModalDocumento =
        () => {
            if (
                processandoDocumento
            ) {
                return;
            }

            setErroDocumento("");
            setModoDocumento(null);
            setArquivoDocumento(null);

            setDocumentoSelecionado(
                null
            );
        };

    const selecionarArquivoDocumento =
        (
            arquivo?: File
        ) => {
            setErroDocumento("");

            if (!arquivo) {
                setArquivoDocumento(null);
                return;
            }

            const extensao =
                obterExtensao(
                    arquivo.name
                );

            if (
                !extensoesDocumentoPermitidas.includes(
                    extensao
                )
            ) {
                setArquivoDocumento(null);

                setErroDocumento(
                    "Formato não permitido. Utilize PDF, PNG, JPG, JPEG, WEBP, DWG, DXF, DOC, DOCX, XLS, XLSX ou ZIP."
                );

                return;
            }

            if (
                arquivo.size >
                tamanhoMaximoDocumento
            ) {
                setArquivoDocumento(null);

                setErroDocumento(
                    "O ficheiro não pode ultrapassar 25 MB."
                );

                return;
            }

            setArquivoDocumento(
                arquivo
            );

            setDocumentoForm(
                (formularioAtual) => ({
                    ...formularioAtual,

                    nome:
                        formularioAtual.nome.trim()
                            ? formularioAtual.nome
                            : obterNomeSemExtensao(
                                arquivo.name
                            ),

                    tipo:
                        formularioAtual.tipo ||
                        obterTipoPorArquivo(
                            arquivo
                        ),
                })
            );
        };

    const validarNovoDocumento =
        () => {
            if (
                !documentoForm.nome.trim()
            ) {
                setErroDocumento(
                    "O nome do documento é obrigatório."
                );

                return false;
            }

            if (!arquivoDocumento) {
                setErroDocumento(
                    "Selecione o ficheiro que pretende carregar."
                );

                return false;
            }

            return true;
        };

    const validarEdicaoDocumento =
        () => {
            if (
                !documentoForm.nome.trim()
            ) {
                setErroDocumento(
                    "O nome do documento é obrigatório."
                );

                return false;
            }

            if (
                !documentoForm.caminho.trim()
            ) {
                setErroDocumento(
                    "O documento não possui uma localização válida."
                );

                return false;
            }

            return true;
        };

    const obterPayloadDocumento =
        () => ({
            idProjeto,

            nome:
                documentoForm.nome.trim(),

            caminho:
                documentoForm.caminho.trim(),

            tipo:
                documentoForm.tipo.trim() ||
                null,
        });

    const guardarNovoDocumento =
        async (
            evento: SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !validarNovoDocumento() ||
                !arquivoDocumento
            ) {
                return;
            }

            setProcessandoDocumento(
                true
            );

            setErroDocumento("");

            try {
                const formData =
                    new FormData();

                formData.append(
                    "idProjeto",
                    String(idProjeto)
                );

                formData.append(
                    "nome",
                    documentoForm.nome.trim()
                );

                if (
                    documentoForm.tipo.trim()
                ) {
                    formData.append(
                        "tipo",
                        documentoForm.tipo.trim()
                    );
                }

                formData.append(
                    "arquivo",
                    arquivoDocumento
                );

                await apiFormData<Documento>(
                    "/Documentos/upload",
                    formData
                );

                setModoDocumento(null);
                setDocumentoSelecionado(null);
                setArquivoDocumento(null);

                setDocumentoForm({
                    nome: "",
                    caminho: "",
                    tipo: "",
                });

                setSucesso(
                    "Documento carregado com sucesso."
                );

                setSeparador(
                    "documentos"
                );

                await carregarDados();
            } catch (error) {
                setErroDocumento(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar o documento."
                );
            } finally {
                setProcessandoDocumento(
                    false
                );
            }
        };

    const guardarEdicaoDocumento =
        async (
            evento: SyntheticEvent<HTMLFormElement>
        ) => {
            evento.preventDefault();

            if (
                !documentoSelecionado ||
                !validarEdicaoDocumento()
            ) {
                return;
            }

            setProcessandoDocumento(
                true
            );

            setErroDocumento("");

            try {
                await apiRequest(
                    `/Documentos/${documentoSelecionado.idDocumento}`,
                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                obterPayloadDocumento()
                            ),
                    }
                );

                setModoDocumento(null);
                setDocumentoSelecionado(null);
                setArquivoDocumento(null);

                setSucesso(
                    "Documento atualizado com sucesso."
                );

                setSeparador(
                    "documentos"
                );

                await carregarDados();
            } catch (error) {
                setErroDocumento(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o documento."
                );
            } finally {
                setProcessandoDocumento(
                    false
                );
            }
        };

    const eliminarDocumento =
        async (
            documento: Documento
        ) => {
            if (!podeGerirProjeto) {
                setErro(
                    "Não possui permissão para eliminar documentos."
                );
                return;
            }

            const confirmado =
                window.confirm(
                    `Deseja eliminar o documento "${documento.nome}"?`
                );

            if (!confirmado) {
                return;
            }

            setErro("");
            setSucesso("");

            try {
                await apiRequest(
                    `/Documentos/${documento.idDocumento}`,
                    {
                        method: "DELETE",
                    }
                );

                if (
                    documentoSelecionado?.idDocumento ===
                    documento.idDocumento
                ) {
                    setModoDocumento(null);
                    setDocumentoSelecionado(null);
                    setArquivoDocumento(null);
                }

                setSucesso(
                    "Documento eliminado com sucesso."
                );

                setSeparador(
                    "documentos"
                );

                await carregarDados();
            } catch (error) {
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível eliminar o documento."
                );
            }
        };

    const abrirDocumento =
        async (
            documento: Documento
        ) => {
            setErroDocumento("");

            try {
                if (
                    documentoFoiEnviado(
                        documento
                    )
                ) {
                    await abrirArquivoProtegido(
                        `/Documentos/${documento.idDocumento}/visualizar`
                    );

                    return;
                }

                if (
                    caminhoPodeAbrirNoBrowser(
                        documento.caminho
                    )
                ) {
                    window.open(
                        documento.caminho,
                        "_blank",
                        "noopener,noreferrer"
                    );

                    return;
                }

                setErroDocumento(
                    "Este é um registo antigo com um caminho local ou de rede. O navegador não consegue abrir esse caminho diretamente."
                );
            } catch (error) {
                setErroDocumento(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível visualizar o documento."
                );
            }
        };

    const descarregarDocumento =
        async (
            documento: Documento
        ) => {
            setErroDocumento("");

            if (
                !documentoFoiEnviado(
                    documento
                )
            ) {
                setErroDocumento(
                    "O download direto está disponível para ficheiros carregados na plataforma."
                );

                return;
            }

            try {
                await descarregarArquivoProtegido(
                    `/Documentos/${documento.idDocumento}/download`,
                    obterNomeDownload(
                        documento
                    )
                );
            } catch (error) {
                setErroDocumento(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível descarregar o documento."
                );
            }
        };

    /* ===================================================== */
    /* CLASSES DE ESTADO                                     */
    /* ===================================================== */

    const classeEstadoProjeto =
        (
            estado: string
        ) => {
            const valor =
                normalizarTexto(
                    estado
                );

            if (
                valor.includes(
                    "concluido"
                )
            ) {
                return "detalhe-status-sucesso";
            }

            if (
                valor.includes(
                    "desenvolvimento"
                )
            ) {
                return "detalhe-status-progresso";
            }

            if (
                valor.includes(
                    "suspenso"
                ) ||
                valor.includes(
                    "cancelado"
                )
            ) {
                return "detalhe-status-perigo";
            }

            return "detalhe-status-neutro";
        };

    const classeEstadoTarefa =
        (
            estado: string
        ) => {
            const valor =
                normalizarTexto(
                    estado
                );

            if (
                valor ===
                "concluida"
            ) {
                return "detalhe-badge-sucesso";
            }

            if (
                valor ===
                "em execucao"
            ) {
                return "detalhe-badge-progresso";
            }

            if (
                valor ===
                "cancelada"
            ) {
                return "detalhe-badge-perigo";
            }

            return "detalhe-badge-neutro";
        };

    const classeEstadoAlteracao =
        (
            estado: string
        ) => {
            const valor =
                normalizarTexto(
                    estado
                );

            if (
                valor ===
                "aprovada" ||
                valor ===
                "concluida"
            ) {
                return "detalhe-badge-sucesso";
            }

            if (
                valor ===
                "em analise"
            ) {
                return "detalhe-badge-progresso";
            }

            if (
                valor ===
                "rejeitada"
            ) {
                return "detalhe-badge-perigo";
            }

            return "detalhe-badge-neutro";
        };

    /* ===================================================== */
    /* CARREGAMENTO / ERRO                                   */
    /* ===================================================== */

    if (carregando) {
        return (
            <div className="detalhe-shell">
                <AppSidebar />

                <main className="detalhe-main">
                    <div className="detalhe-carregando">
                        <RefreshCw
                            size={34}
                            className="detalhe-spin"
                        />

                        <strong>
                            A carregar projeto...
                        </strong>
                    </div>
                </main>
            </div>
        );
    }

    if (
        erro &&
        !projeto
    ) {
        return (
            <div className="detalhe-shell">
                <AppSidebar />

                <main className="detalhe-main">
                    <div className="detalhe-erro-pagina">
                        <FolderKanban
                            size={42}
                        />

                        <h2>
                            Não foi possível abrir o projeto
                        </h2>

                        <p>
                            {erro}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/gestao-projetos"
                                )
                            }
                        >
                            <ArrowLeft
                                size={18}
                            />

                            Voltar à gestão
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (!projeto) {
        return null;
    }

    /* ===================================================== */
    /* PÁGINA                                                */
    /* ===================================================== */

    return (
        <div className="detalhe-shell">
            <AppSidebar />

            <main className="detalhe-main">
                <header className="detalhe-topbar">
                    <div className="detalhe-topbar-conteudo">
                        <button
                            type="button"
                            className="detalhe-voltar"
                            onClick={() =>
                                navigate(
                                    "/gestao-projetos"
                                )
                            }
                        >
                            <ArrowLeft
                                size={18}
                            />

                            Gestão de Projetos
                        </button>

                        <button
                            type="button"
                            className="detalhe-atualizar"
                            disabled={
                                atualizando
                            }
                            onClick={() =>
                                void carregarDados(
                                    true
                                )
                            }
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    atualizando
                                        ? "detalhe-spin"
                                        : ""
                                }
                            />

                            {atualizando
                                ? "A atualizar..."
                                : "Atualizar"}
                        </button>
                    </div>
                </header>

                <div className="detalhe-content">
                    {erro && (
                        <div className="detalhe-alerta-erro">
                            {erro}
                        </div>
                    )}

                    {sucesso && (
                        <div className="detalhe-alerta-sucesso">
                            {sucesso}
                        </div>
                    )}

                    {/* CABEÇALHO DO PROJETO */}

                    <section className="detalhe-cabecalho">
                        <div className="detalhe-cabecalho-principal">
                            <div className="detalhe-icone-projeto">
                                <FolderKanban
                                    size={28}
                                />
                            </div>

                            <div>
                                <div className="detalhe-codigo-linha">
                                    <span className="detalhe-codigo">
                                        {
                                            projeto.codigo
                                        }
                                    </span>

                                    <span
                                        className={`detalhe-status ${classeEstadoProjeto(
                                            projeto.estado
                                        )}`}
                                    >
                                        {
                                            projeto.estado
                                        }
                                    </span>
                                </div>

                                <h1>
                                    {
                                        projeto.nome
                                    }
                                </h1>

                                <p>
                                    {projeto.descricao ||
                                        "Sem descrição registada para este projeto."}
                                </p>
                            </div>
                        </div>

                        {podeGerirProjeto && (
                            <button
                                type="button"
                                className="detalhe-editar"
                                onClick={
                                    abrirEditarProjeto
                                }
                            >
                                <Pencil
                                    size={17}
                                />

                                Gerir projeto
                            </button>
                        )}
                    </section>

                    {/* INFORMAÇÃO RÁPIDA */}

                    <section className="detalhe-informacoes-rapidas">
                        <article>
                            <div className="detalhe-info-icon">
                                <Users
                                    size={19}
                                />
                            </div>

                            <div>
                                <span>
                                    Cliente
                                </span>

                                <strong>
                                    {projeto.nomeCliente ||
                                        `Cliente #${projeto.idCliente}`}
                                </strong>
                            </div>
                        </article>

                        <article>
                            <div className="detalhe-info-icon">
                                <UserRound
                                    size={19}
                                />
                            </div>

                            <div>
                                <span>
                                    Responsável
                                </span>

                                <strong>
                                    {projeto.nomeResponsavel ||
                                        "Não definido"}
                                </strong>
                            </div>
                        </article>

                        <article>
                            <div className="detalhe-info-icon">
                                <CalendarDays
                                    size={19}
                                />
                            </div>

                            <div>
                                <span>
                                    Início
                                </span>

                                <strong>
                                    {formatarData(
                                        projeto.dataInicio
                                    )}
                                </strong>
                            </div>
                        </article>

                        <article>
                            <div className="detalhe-info-icon">
                                <Clock3
                                    size={19}
                                />
                            </div>

                            <div>
                                <span>
                                    Prazo
                                </span>

                                <strong>
                                    {formatarData(
                                        projeto.prazoPrevisto
                                    )}
                                </strong>
                            </div>
                        </article>
                    </section>

                    {/* TABS */}

                    <nav className="detalhe-tabs">
                        <button
                            type="button"
                            className={
                                separador ===
                                    "visao-geral"
                                    ? "ativo"
                                    : ""
                            }
                            onClick={() =>
                                setSeparador(
                                    "visao-geral"
                                )
                            }
                        >
                            <FolderKanban
                                size={17}
                            />

                            Visão geral
                        </button>

                        <button
                            type="button"
                            className={
                                separador ===
                                    "tarefas"
                                    ? "ativo"
                                    : ""
                            }
                            onClick={() =>
                                setSeparador(
                                    "tarefas"
                                )
                            }
                        >
                            <ClipboardList
                                size={17}
                            />

                            Tarefas

                            <span>
                                {
                                    tarefas.length
                                }
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                separador ===
                                    "alteracoes"
                                    ? "ativo"
                                    : ""
                            }
                            onClick={() =>
                                setSeparador(
                                    "alteracoes"
                                )
                            }
                        >
                            <Wrench
                                size={17}
                            />

                            Alterações

                            <span>
                                {
                                    alteracoes.length
                                }
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                separador ===
                                    "documentos"
                                    ? "ativo"
                                    : ""
                            }
                            onClick={() =>
                                setSeparador(
                                    "documentos"
                                )
                            }
                        >
                            <FileText
                                size={17}
                            />

                            Documentos

                            <span>
                                {
                                    documentos.length
                                }
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                separador ===
                                    "historico"
                                    ? "ativo"
                                    : ""
                            }
                            onClick={() =>
                                setSeparador(
                                    "historico"
                                )
                            }
                        >
                            <History
                                size={17}
                            />

                            Histórico
                        </button>
                    </nav>

                    {/* VISÃO GERAL */}

                    {separador ===
                        "visao-geral" && (
                            <>
                                <section className="detalhe-indicadores">
                                    <article>
                                        <div>
                                            <span>
                                                Total de tarefas
                                            </span>

                                            <strong>
                                                {
                                                    tarefas.length
                                                }
                                            </strong>
                                        </div>

                                        <ClipboardList
                                            size={23}
                                        />
                                    </article>

                                    <article>
                                        <div>
                                            <span>
                                                Pendentes
                                            </span>

                                            <strong>
                                                {
                                                    tarefasPendentes
                                                }
                                            </strong>
                                        </div>

                                        <Clock3
                                            size={23}
                                        />
                                    </article>

                                    <article>
                                        <div>
                                            <span>
                                                Concluídas
                                            </span>

                                            <strong>
                                                {
                                                    tarefasConcluidas
                                                }
                                            </strong>
                                        </div>

                                        <CheckCircle2
                                            size={23}
                                        />
                                    </article>

                                    <article>
                                        <div>
                                            <span>
                                                Horas registadas
                                            </span>

                                            <strong>
                                                {horasRegistadas.toLocaleString(
                                                    "pt-PT",
                                                    {
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </strong>
                                        </div>

                                        <Clock3
                                            size={23}
                                        />
                                    </article>
                                </section>

                                <section className="detalhe-grid">
                                    <article className="detalhe-painel">
                                        <div className="detalhe-painel-header">
                                            <div>
                                                <span>
                                                    PROJETO
                                                </span>

                                                <h2>
                                                    Informações
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="detalhe-campos">
                                            <div>
                                                <span>
                                                    Código
                                                </span>

                                                <strong>
                                                    {
                                                        projeto.codigo
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Estado
                                                </span>

                                                <strong>
                                                    {
                                                        projeto.estado
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Cliente
                                                </span>

                                                <strong>
                                                    {projeto.nomeCliente ||
                                                        "—"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Responsável
                                                </span>

                                                <strong>
                                                    {projeto.nomeResponsavel ||
                                                        "Não definido"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Data de início
                                                </span>

                                                <strong>
                                                    {formatarData(
                                                        projeto.dataInicio
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Prazo previsto
                                                </span>

                                                <strong>
                                                    {formatarData(
                                                        projeto.prazoPrevisto
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="detalhe-campo-largo">
                                                <span>
                                                    Local
                                                </span>

                                                <strong>
                                                    {projeto.localObra ||
                                                        "Não definido"}
                                                </strong>
                                            </div>

                                            <div className="detalhe-campo-largo">
                                                <span>
                                                    Observações
                                                </span>

                                                <p>
                                                    {projeto.observacoes ||
                                                        "Sem observações."}
                                                </p>
                                            </div>
                                        </div>
                                    </article>

                                    <article className="detalhe-painel">
                                        <div className="detalhe-painel-header">
                                            <div>
                                                <span>
                                                    ATIVIDADE
                                                </span>

                                                <h2>
                                                    Resumo
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="detalhe-resumo-lista">
                                            <div>
                                                <ClipboardList
                                                    size={18}
                                                />

                                                <span>
                                                    Tarefas
                                                </span>

                                                <strong>
                                                    {
                                                        tarefas.length
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <Wrench
                                                    size={18}
                                                />

                                                <span>
                                                    Alterações
                                                </span>

                                                <strong>
                                                    {
                                                        alteracoes.length
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <FileText
                                                    size={18}
                                                />

                                                <span>
                                                    Documentos
                                                </span>

                                                <strong>
                                                    {
                                                        documentos.length
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <History
                                                    size={18}
                                                />

                                                <span>
                                                    Registos no histórico
                                                </span>

                                                <strong>
                                                    {
                                                        historico.length
                                                    }
                                                </strong>
                                            </div>
                                        </div>

                                        {projeto.localObra && (
                                            <div className="detalhe-local">
                                                <MapPin
                                                    size={18}
                                                />

                                                <div>
                                                    <span>
                                                        Local do projeto
                                                    </span>

                                                    <strong>
                                                        {
                                                            projeto.localObra
                                                        }
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                </section>
                            </>
                        )}

                    {/* TAREFAS */}

                    {separador ===
                        "tarefas" && (
                            <section className="detalhe-painel detalhe-painel-tab">
                                <div className="detalhe-painel-header detalhe-painel-header-acoes">
                                    <div>
                                        <span>
                                            TAREFAS
                                        </span>

                                        <h2>
                                            Tarefas do projeto
                                        </h2>
                                    </div>

                                    <div className="detalhe-header-acoes">
                                        <strong className="detalhe-total">
                                            {
                                                tarefas.length
                                            }
                                        </strong>

                                        <button
                                            type="button"
                                            className="detalhe-novo-botao"
                                            onClick={
                                                abrirNovaTarefa
                                            }
                                        >
                                            <Plus
                                                size={17}
                                            />

                                            Nova tarefa
                                        </button>
                                    </div>
                                </div>

                                {tarefas.length ===
                                    0 ? (
                                    <div className="detalhe-vazio">
                                        <ClipboardList
                                            size={36}
                                        />

                                        <strong>
                                            Nenhuma tarefa
                                        </strong>

                                        <span>
                                            Este projeto ainda não possui tarefas registadas.
                                        </span>

                                        <button
                                            type="button"
                                            className="detalhe-vazio-botao"
                                            onClick={
                                                abrirNovaTarefa
                                            }
                                        >
                                            <Plus
                                                size={16}
                                            />

                                            Criar primeira tarefa
                                        </button>
                                    </div>
                                ) : (
                                    <div className="detalhe-lista">
                                        {tarefas.map(
                                            (
                                                tarefa
                                            ) => (
                                                <div
                                                    className="detalhe-lista-item"
                                                    key={
                                                        tarefa.idTarefa
                                                    }
                                                >
                                                    <div className="detalhe-lista-icone">
                                                        <ClipboardList
                                                            size={
                                                                19
                                                            }
                                                        />
                                                    </div>

                                                    <div className="detalhe-lista-conteudo">
                                                        <strong>
                                                            {
                                                                tarefa.titulo
                                                            }
                                                        </strong>

                                                        <span>
                                                            {formatarData(
                                                                tarefa.data
                                                            )}

                                                            {" · "}

                                                            Prioridade:{" "}
                                                            {
                                                                tarefa.prioridade
                                                            }

                                                            {tarefa.horas !=
                                                                null
                                                                ? ` · ${tarefa.horas} h`
                                                                : ""}

                                                            {tarefa.nomeUtilizador
                                                                ? ` · ${tarefa.nomeUtilizador}`
                                                                : ""}
                                                        </span>

                                                        {tarefa.descricao && (
                                                            <p className="detalhe-tarefa-descricao">
                                                                {
                                                                    tarefa.descricao
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="detalhe-tarefa-lateral">
                                                        <span
                                                            className={`detalhe-badge ${classeEstadoTarefa(
                                                                tarefa.estado
                                                            )}`}
                                                        >
                                                            {
                                                                tarefa.estado
                                                            }
                                                        </span>

                                                        <div className="detalhe-tarefa-acoes">
                                                            <button
                                                                type="button"
                                                                title="Visualizar tarefa"
                                                                onClick={() =>
                                                                    abrirVisualizacaoTarefa(
                                                                        tarefa
                                                                    )
                                                                }
                                                            >
                                                                <Eye
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Editar tarefa"
                                                                onClick={() =>
                                                                    abrirEdicaoTarefa(
                                                                        tarefa
                                                                    )
                                                                }
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            {podeGerirProjeto && (
                                                                <button
                                                                    type="button"
                                                                    title="Eliminar tarefa"
                                                                    onClick={() =>
                                                                        void eliminarTarefa(
                                                                            tarefa
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                    {/* ALTERAÇÕES */}

                    {separador ===
                        "alteracoes" && (
                            <section className="detalhe-painel detalhe-painel-tab">
                                <div className="detalhe-painel-header detalhe-painel-header-acoes">
                                    <div>
                                        <span>
                                            ALTERAÇÕES
                                        </span>

                                        <h2>
                                            Alterações do projeto
                                        </h2>
                                    </div>

                                    <div className="detalhe-header-acoes">
                                        <strong className="detalhe-total">
                                            {
                                                alteracoes.length
                                            }
                                        </strong>

                                        <button
                                            type="button"
                                            className="detalhe-novo-botao"
                                            onClick={
                                                abrirNovaAlteracao
                                            }
                                        >
                                            <Plus
                                                size={17}
                                            />

                                            Nova alteração
                                        </button>
                                    </div>
                                </div>

                                {alteracoes.length ===
                                    0 ? (
                                    <div className="detalhe-vazio">
                                        <Wrench
                                            size={36}
                                        />

                                        <strong>
                                            Nenhuma alteração
                                        </strong>

                                        <span>
                                            Não existem alterações registadas neste projeto.
                                        </span>

                                        <button
                                            type="button"
                                            className="detalhe-vazio-botao"
                                            onClick={
                                                abrirNovaAlteracao
                                            }
                                        >
                                            <Plus
                                                size={16}
                                            />

                                            Criar primeira alteração
                                        </button>
                                    </div>
                                ) : (
                                    <div className="detalhe-lista">
                                        {alteracoes.map(
                                            (
                                                alteracao
                                            ) => (
                                                <div
                                                    className="detalhe-lista-item"
                                                    key={
                                                        alteracao.idAlteracao
                                                    }
                                                >
                                                    <div className="detalhe-lista-icone">
                                                        <Wrench
                                                            size={
                                                                19
                                                            }
                                                        />
                                                    </div>

                                                    <div className="detalhe-lista-conteudo">
                                                        <strong>
                                                            {
                                                                alteracao.descricao
                                                            }
                                                        </strong>

                                                        <span>
                                                            {formatarData(
                                                                alteracao.dataAlteracao
                                                            )}

                                                            {alteracao.nomeUtilizador
                                                                ? ` · ${alteracao.nomeUtilizador}`
                                                                : ""}

                                                            {alteracao.observacoes
                                                                ? ` · ${alteracao.observacoes}`
                                                                : ""}
                                                        </span>
                                                    </div>

                                                    <div className="detalhe-tarefa-lateral">
                                                        <span
                                                            className={`detalhe-badge ${classeEstadoAlteracao(
                                                                alteracao.estado
                                                            )}`}
                                                        >
                                                            {
                                                                alteracao.estado
                                                            }
                                                        </span>

                                                        <div className="detalhe-tarefa-acoes">
                                                            <button
                                                                type="button"
                                                                title="Visualizar alteração"
                                                                onClick={() =>
                                                                    abrirVisualizacaoAlteracao(
                                                                        alteracao
                                                                    )
                                                                }
                                                            >
                                                                <Eye
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Editar alteração"
                                                                onClick={() =>
                                                                    abrirEdicaoAlteracao(
                                                                        alteracao
                                                                    )
                                                                }
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            {podeGerirProjeto && (
                                                                <button
                                                                    type="button"
                                                                    title="Eliminar alteração"
                                                                    onClick={() =>
                                                                        void eliminarAlteracao(
                                                                            alteracao
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                    {/* DOCUMENTOS */}

                    {separador ===
                        "documentos" && (
                            <section className="detalhe-painel detalhe-painel-tab">
                                <div className="detalhe-painel-header detalhe-painel-header-acoes">
                                    <div>
                                        <span>
                                            DOCUMENTOS
                                        </span>

                                        <h2>
                                            Documentos do projeto
                                        </h2>
                                    </div>

                                    <div className="detalhe-header-acoes">
                                        <strong className="detalhe-total">
                                            {
                                                documentos.length
                                            }
                                        </strong>

                                        <button
                                            type="button"
                                            className="detalhe-novo-botao"
                                            onClick={
                                                abrirNovoDocumento
                                            }
                                        >
                                            <Plus
                                                size={17}
                                            />

                                            Novo documento
                                        </button>
                                    </div>
                                </div>

                                {documentos.length ===
                                    0 ? (
                                    <div className="detalhe-vazio">
                                        <FileText
                                            size={36}
                                        />

                                        <strong>
                                            Nenhum documento
                                        </strong>

                                        <span>
                                            Este projeto ainda não possui documentos registados.
                                        </span>

                                        <button
                                            type="button"
                                            className="detalhe-vazio-botao"
                                            onClick={
                                                abrirNovoDocumento
                                            }
                                        >
                                            <Plus
                                                size={16}
                                            />

                                            Registar primeiro documento
                                        </button>
                                    </div>
                                ) : (
                                    <div className="detalhe-lista">
                                        {documentos.map(
                                            (
                                                documento
                                            ) => (
                                                <div
                                                    className="detalhe-lista-item"
                                                    key={
                                                        documento.idDocumento
                                                    }
                                                >
                                                    <div className="detalhe-lista-icone">
                                                        <FileText
                                                            size={
                                                                19
                                                            }
                                                        />
                                                    </div>

                                                    <div className="detalhe-lista-conteudo">
                                                        <strong>
                                                            {
                                                                documento.nome
                                                            }
                                                        </strong>

                                                        <span>
                                                            {documento.tipo ||
                                                                "Sem tipo"}

                                                            {" · "}

                                                            {formatarDataHora(
                                                                documento.dataUpload
                                                            )}
                                                        </span>

                                                        <p className="detalhe-tarefa-descricao">
                                                            {documentoFoiEnviado(
                                                                documento
                                                            )
                                                                ? "Ficheiro carregado na plataforma"
                                                                : documento.caminho}
                                                        </p>
                                                    </div>

                                                    <div className="detalhe-tarefa-lateral">
                                                        <div className="detalhe-tarefa-acoes">
                                                            {(documentoFoiEnviado(
                                                                documento
                                                            ) ||
                                                                caminhoPodeAbrirNoBrowser(
                                                                    documento.caminho
                                                                )) && (
                                                                    <button
                                                                        type="button"
                                                                        title="Abrir ficheiro"
                                                                        onClick={() =>
                                                                            void abrirDocumento(
                                                                                documento
                                                                            )
                                                                        }
                                                                    >
                                                                        <ExternalLink
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}

                                                            {documentoFoiEnviado(
                                                                documento
                                                            ) && (
                                                                    <button
                                                                        type="button"
                                                                        title="Download"
                                                                        onClick={() =>
                                                                            void descarregarDocumento(
                                                                                documento
                                                                            )
                                                                        }
                                                                    >
                                                                        <Download
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}

                                                            <button
                                                                type="button"
                                                                title="Ver detalhes"
                                                                onClick={() =>
                                                                    abrirVisualizacaoDocumento(
                                                                        documento
                                                                    )
                                                                }
                                                            >
                                                                <Eye
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Editar documento"
                                                                onClick={() =>
                                                                    abrirEdicaoDocumento(
                                                                        documento
                                                                    )
                                                                }
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>

                                                            {podeGerirProjeto && (
                                                                <button
                                                                    type="button"
                                                                    title="Eliminar documento"
                                                                    onClick={() =>
                                                                        void eliminarDocumento(
                                                                            documento
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                    {/* HISTÓRICO */}

                    {separador ===
                        "historico" && (
                            <section className="detalhe-painel detalhe-painel-tab">
                                <div className="detalhe-painel-header">
                                    <div>
                                        <span>
                                            HISTÓRICO
                                        </span>

                                        <h2>
                                            Atividade do projeto
                                        </h2>
                                    </div>

                                    <strong className="detalhe-total">
                                        {
                                            historico.length
                                        }
                                    </strong>
                                </div>

                                {historico.length ===
                                    0 ? (
                                    <div className="detalhe-vazio">
                                        <History
                                            size={36}
                                        />

                                        <strong>
                                            Sem histórico
                                        </strong>

                                        <span>
                                            Ainda não existem registos de atividade para este projeto.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="detalhe-historico">
                                        {historico.map(
                                            (
                                                item
                                            ) => (
                                                <div
                                                    className="detalhe-historico-item"
                                                    key={
                                                        item.idHistorico
                                                    }
                                                >
                                                    <div className="detalhe-historico-marcador" />

                                                    <div>
                                                        <div className="detalhe-historico-topo">
                                                            <strong>
                                                                {
                                                                    item.acao
                                                                }
                                                            </strong>

                                                            <span>
                                                                {formatarDataHora(
                                                                    item.dataAcao
                                                                )}
                                                            </span>
                                                        </div>

                                                        <p>
                                                            {item.descricao ||
                                                                "Sem descrição."}
                                                        </p>

                                                        <small>
                                                            {item.nomeUtilizador ||
                                                                "Sistema"}
                                                        </small>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>
                        )}
                </div>
            </main>

            {/* ================================================= */}
            {/* MODAL EDITAR PROJETO                              */}
            {/* ================================================= */}

            {modalProjeto && (
                <div className="detalhe-modal-overlay">
                    <div className="detalhe-modal">
                        <div className="detalhe-modal-header">
                            <div>
                                <span>
                                    PROJETO
                                </span>

                                <h2>
                                    Gerir projeto
                                </h2>

                                <p>
                                    {
                                        projeto.codigo
                                    }{" "}
                                    ·{" "}
                                    {
                                        projeto.nome
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharEditarProjeto
                                }
                                disabled={
                                    processandoProjeto
                                }
                            >
                                <X
                                    size={20}
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                guardarProjeto
                            }
                        >
                            <div className="detalhe-form-grid">
                                <label>
                                    Código
                                    <input
                                        type="text"
                                        value={
                                            projetoForm.codigo
                                        }
                                        readOnly
                                    />

                                    <small>
                                        O código é gerado automaticamente e não deve ser alterado.
                                    </small>
                                </label>

                                <label>
                                    Estado *
                                    <select
                                        value={
                                            projetoForm.estado
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    estado:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    >
                                        {estadosProjeto.map(
                                            (
                                                estado
                                            ) => (
                                                <option
                                                    key={
                                                        estado
                                                    }
                                                    value={
                                                        estado
                                                    }
                                                >
                                                    {
                                                        estado
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label className="detalhe-form-largo">
                                    Nome do projeto *
                                    <input
                                        type="text"
                                        value={
                                            projetoForm.nome
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    nome:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    />
                                </label>

                                <label className="detalhe-form-largo">
                                    Cliente *
                                    <select
                                        value={
                                            projetoForm.idCliente
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    idCliente:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    >
                                        <option value="">
                                            Selecionar cliente
                                        </option>

                                        {clientes.map(
                                            (
                                                cliente
                                            ) => (
                                                <option
                                                    key={
                                                        cliente.idCliente
                                                    }
                                                    value={
                                                        cliente.idCliente
                                                    }
                                                >
                                                    {
                                                        cliente.nome
                                                    }

                                                    {cliente.empresa
                                                        ? ` — ${cliente.empresa}`
                                                        : ""}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label className="detalhe-form-largo">
                                    Responsável

                                    {eAdministrador ? (
                                        <select
                                            value={
                                                projetoForm.idResponsavel
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setProjetoForm(
                                                    {
                                                        ...projetoForm,
                                                        idResponsavel:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        >
                                            <option value="">
                                                Sem responsável
                                            </option>

                                            {utilizadores.map(
                                                (
                                                    item
                                                ) => (
                                                    <option
                                                        key={
                                                            item.idUtilizador
                                                        }
                                                        value={
                                                            item.idUtilizador
                                                        }
                                                    >
                                                        {
                                                            item.nome
                                                        }{" "}
                                                        —{" "}
                                                        {
                                                            item.perfil
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={
                                                    projeto.nomeResponsavel ||
                                                    "Sem responsável"
                                                }
                                                disabled
                                            />

                                            <small>
                                                Apenas o Administrador pode selecionar outro responsável nesta interface.
                                            </small>
                                        </>
                                    )}
                                </label>

                                <label>
                                    Data de início
                                    <input
                                        type="date"
                                        value={
                                            projetoForm.dataInicio
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    dataInicio:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    />
                                </label>

                                <label>
                                    Prazo previsto
                                    <input
                                        type="date"
                                        value={
                                            projetoForm.prazoPrevisto
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    prazoPrevisto:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    />
                                </label>

                                <label className="detalhe-form-largo">
                                    Local do projeto / obra
                                    <input
                                        type="text"
                                        value={
                                            projetoForm.localObra
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    localObra:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    />
                                </label>

                                <label className="detalhe-form-largo">
                                    Descrição
                                    <textarea
                                        rows={4}
                                        value={
                                            projetoForm.descricao
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    descricao:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    />
                                </label>

                                <label className="detalhe-form-largo">
                                    Observações
                                    <textarea
                                        rows={4}
                                        value={
                                            projetoForm.observacoes
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setProjetoForm(
                                                {
                                                    ...projetoForm,
                                                    observacoes:
                                                        evento
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            {erroProjeto && (
                                <div className="detalhe-modal-erro">
                                    {
                                        erroProjeto
                                    }
                                </div>
                            )}

                            <div className="detalhe-modal-footer">
                                <button
                                    type="button"
                                    className="detalhe-modal-cancelar"
                                    onClick={
                                        fecharEditarProjeto
                                    }
                                    disabled={
                                        processandoProjeto
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="detalhe-modal-guardar"
                                    disabled={
                                        processandoProjeto
                                    }
                                >
                                    <Pencil
                                        size={16}
                                    />

                                    {processandoProjeto
                                        ? "A guardar..."
                                        : "Guardar projeto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* MODAL TAREFAS                                     */}
            {/* ================================================= */}

            {modoTarefa !== null && (
                <div className="detalhe-modal-overlay">
                    <div className="detalhe-modal">
                        <div className="detalhe-modal-header">
                            <div>
                                <span>
                                    TAREFA
                                </span>

                                <h2>
                                    {modoTarefa ===
                                        "novo"
                                        ? "Nova tarefa"
                                        : modoTarefa ===
                                            "editar"
                                            ? "Editar tarefa"
                                            : "Detalhes da tarefa"}
                                </h2>

                                <p>
                                    {
                                        projeto.codigo
                                    }{" "}
                                    ·{" "}
                                    {
                                        projeto.nome
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharModalTarefa
                                }
                                disabled={
                                    processandoTarefa
                                }
                            >
                                <X
                                    size={20}
                                />
                            </button>
                        </div>

                        {modoTarefa ===
                            "visualizar" ? (
                            <div className="detalhe-modal-visualizacao">
                                <div className="detalhe-visualizacao-grid">
                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Título
                                        </span>

                                        <strong>
                                            {
                                                tarefaSelecionada?.titulo
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Data
                                        </span>

                                        <strong>
                                            {formatarData(
                                                tarefaSelecionada?.data
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Horas
                                        </span>

                                        <strong>
                                            {tarefaSelecionada?.horas !=
                                                null
                                                ? `${tarefaSelecionada.horas} h`
                                                : "Não definidas"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Estado
                                        </span>

                                        <strong>
                                            {
                                                tarefaSelecionada?.estado
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Prioridade
                                        </span>

                                        <strong>
                                            {
                                                tarefaSelecionada?.prioridade
                                            }
                                        </strong>
                                    </div>

                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Responsável
                                        </span>

                                        <strong>
                                            {tarefaSelecionada?.nomeUtilizador ||
                                                "Sem responsável"}
                                        </strong>
                                    </div>

                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Descrição
                                        </span>

                                        <p>
                                            {tarefaSelecionada?.descricao ||
                                                "Sem descrição."}
                                        </p>
                                    </div>
                                </div>

                                <div className="detalhe-modal-footer">
                                    <button
                                        type="button"
                                        className="detalhe-modal-cancelar"
                                        onClick={
                                            fecharModalTarefa
                                        }
                                    >
                                        Fechar
                                    </button>

                                    {tarefaSelecionada &&
                                        podeGerirProjeto && (
                                            <button
                                                type="button"
                                                className="detalhe-modal-cancelar"
                                                onClick={() =>
                                                    void eliminarTarefa(
                                                        tarefaSelecionada
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={16}
                                                />

                                                Eliminar tarefa
                                            </button>
                                        )}

                                    {tarefaSelecionada && (
                                        <button
                                            type="button"
                                            className="detalhe-modal-guardar"
                                            onClick={() =>
                                                abrirEdicaoTarefa(
                                                    tarefaSelecionada
                                                )
                                            }
                                        >
                                            <Pencil
                                                size={16}
                                            />

                                            Editar tarefa
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={
                                    modoTarefa ===
                                        "novo"
                                        ? guardarNovaTarefa
                                        : guardarEdicaoTarefa
                                }
                            >
                                <div className="detalhe-form-grid">
                                    <label className="detalhe-form-largo">
                                        Título *
                                        <input
                                            type="text"
                                            value={
                                                tarefaForm.titulo
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setTarefaForm(
                                                    {
                                                        ...tarefaForm,
                                                        titulo:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Data *
                                        <input
                                            type="date"
                                            value={
                                                tarefaForm.data
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setTarefaForm(
                                                    {
                                                        ...tarefaForm,
                                                        data:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Horas
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.25"
                                            value={
                                                tarefaForm.horas
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setTarefaForm(
                                                    {
                                                        ...tarefaForm,
                                                        horas:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Estado *
                                        <select
                                            value={
                                                tarefaForm.estado
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setTarefaForm(
                                                    {
                                                        ...tarefaForm,
                                                        estado:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        >
                                            {estadosTarefa.map(
                                                (
                                                    estado
                                                ) => (
                                                    <option
                                                        key={
                                                            estado
                                                        }
                                                        value={
                                                            estado
                                                        }
                                                    >
                                                        {
                                                            estado
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label>
                                        Prioridade *
                                        <select
                                            value={
                                                tarefaForm.prioridade
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setTarefaForm(
                                                    {
                                                        ...tarefaForm,
                                                        prioridade:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        >
                                            {prioridadesTarefa.map(
                                                (
                                                    prioridade
                                                ) => (
                                                    <option
                                                        key={
                                                            prioridade
                                                        }
                                                        value={
                                                            prioridade
                                                        }
                                                    >
                                                        {
                                                            prioridade
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="detalhe-form-largo">
                                        Responsável

                                        {eAdministrador ? (
                                            <select
                                                value={
                                                    tarefaForm.idUtilizador
                                                }
                                                onChange={(
                                                    evento
                                                ) =>
                                                    setTarefaForm(
                                                        {
                                                            ...tarefaForm,
                                                            idUtilizador:
                                                                evento
                                                                    .target
                                                                    .value,
                                                        }
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Sem responsável
                                                </option>

                                                {utilizadores.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <option
                                                            key={
                                                                item.idUtilizador
                                                            }
                                                            value={
                                                                item.idUtilizador
                                                            }
                                                        >
                                                            {
                                                                item.nome
                                                            }{" "}
                                                            —{" "}
                                                            {
                                                                item.perfil
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={
                                                    tarefaSelecionada?.nomeUtilizador ||
                                                    "Sem responsável"
                                                }
                                                disabled
                                            />
                                        )}
                                    </label>

                                    <label className="detalhe-form-largo">
                                        Descrição
                                        <textarea
                                            rows={5}
                                            value={
                                                tarefaForm.descricao
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setTarefaForm(
                                                    {
                                                        ...tarefaForm,
                                                        descricao:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                {erroTarefa && (
                                    <div className="detalhe-modal-erro">
                                        {
                                            erroTarefa
                                        }
                                    </div>
                                )}

                                <div className="detalhe-modal-footer">
                                    <button
                                        type="button"
                                        className="detalhe-modal-cancelar"
                                        onClick={
                                            fecharModalTarefa
                                        }
                                        disabled={
                                            processandoTarefa
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="detalhe-modal-guardar"
                                        disabled={
                                            processandoTarefa
                                        }
                                    >
                                        {modoTarefa ===
                                            "novo" ? (
                                            <Plus
                                                size={17}
                                            />
                                        ) : (
                                            <Pencil
                                                size={16}
                                            />
                                        )}

                                        {processandoTarefa
                                            ? "A guardar..."
                                            : modoTarefa ===
                                                "novo"
                                                ? "Criar tarefa"
                                                : "Guardar alterações"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* MODAL ALTERAÇÕES                                  */}
            {/* ================================================= */}

            {modoAlteracao !== null && (
                <div className="detalhe-modal-overlay">
                    <div className="detalhe-modal">
                        <div className="detalhe-modal-header">
                            <div>
                                <span>
                                    ALTERAÇÃO
                                </span>

                                <h2>
                                    {modoAlteracao ===
                                        "novo"
                                        ? "Nova alteração"
                                        : modoAlteracao ===
                                            "editar"
                                            ? "Editar alteração"
                                            : "Detalhes da alteração"}
                                </h2>

                                <p>
                                    {
                                        projeto.codigo
                                    }{" "}
                                    ·{" "}
                                    {
                                        projeto.nome
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharModalAlteracao
                                }
                                disabled={
                                    processandoAlteracao
                                }
                            >
                                <X
                                    size={20}
                                />
                            </button>
                        </div>

                        {modoAlteracao ===
                            "visualizar" ? (
                            <div className="detalhe-modal-visualizacao">
                                <div className="detalhe-visualizacao-grid">
                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Descrição
                                        </span>

                                        <p>
                                            {
                                                alteracaoSelecionada?.descricao
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <span>
                                            Data
                                        </span>

                                        <strong>
                                            {formatarData(
                                                alteracaoSelecionada?.dataAlteracao
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Estado
                                        </span>

                                        <strong>
                                            {
                                                alteracaoSelecionada?.estado
                                            }
                                        </strong>
                                    </div>

                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Responsável
                                        </span>

                                        <strong>
                                            {alteracaoSelecionada?.nomeUtilizador ||
                                                "Sem responsável"}
                                        </strong>
                                    </div>

                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Observações
                                        </span>

                                        <p>
                                            {alteracaoSelecionada?.observacoes ||
                                                "Sem observações."}
                                        </p>
                                    </div>
                                </div>

                                <div className="detalhe-modal-footer">
                                    <button
                                        type="button"
                                        className="detalhe-modal-cancelar"
                                        onClick={
                                            fecharModalAlteracao
                                        }
                                    >
                                        Fechar
                                    </button>

                                    {alteracaoSelecionada &&
                                        podeGerirProjeto && (
                                            <button
                                                type="button"
                                                className="detalhe-modal-cancelar"
                                                onClick={() =>
                                                    void eliminarAlteracao(
                                                        alteracaoSelecionada
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={16}
                                                />

                                                Eliminar alteração
                                            </button>
                                        )}

                                    {alteracaoSelecionada && (
                                        <button
                                            type="button"
                                            className="detalhe-modal-guardar"
                                            onClick={() =>
                                                abrirEdicaoAlteracao(
                                                    alteracaoSelecionada
                                                )
                                            }
                                        >
                                            <Pencil
                                                size={16}
                                            />

                                            Editar alteração
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={
                                    modoAlteracao ===
                                        "novo"
                                        ? guardarNovaAlteracao
                                        : guardarEdicaoAlteracao
                                }
                            >
                                <div className="detalhe-form-grid">
                                    <label className="detalhe-form-largo">
                                        Descrição *
                                        <textarea
                                            rows={5}
                                            value={
                                                alteracaoForm.descricao
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setAlteracaoForm(
                                                    {
                                                        ...alteracaoForm,
                                                        descricao:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Data *
                                        <input
                                            type="date"
                                            value={
                                                alteracaoForm.dataAlteracao
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setAlteracaoForm(
                                                    {
                                                        ...alteracaoForm,
                                                        dataAlteracao:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Estado *
                                        <select
                                            value={
                                                alteracaoForm.estado
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setAlteracaoForm(
                                                    {
                                                        ...alteracaoForm,
                                                        estado:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        >
                                            {estadosAlteracao.map(
                                                (
                                                    estado
                                                ) => (
                                                    <option
                                                        key={
                                                            estado
                                                        }
                                                        value={
                                                            estado
                                                        }
                                                    >
                                                        {
                                                            estado
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className="detalhe-form-largo">
                                        Responsável

                                        {eAdministrador ? (
                                            <select
                                                value={
                                                    alteracaoForm.idUtilizador
                                                }
                                                onChange={(
                                                    evento
                                                ) =>
                                                    setAlteracaoForm(
                                                        {
                                                            ...alteracaoForm,
                                                            idUtilizador:
                                                                evento
                                                                    .target
                                                                    .value,
                                                        }
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Sem responsável
                                                </option>

                                                {utilizadores.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <option
                                                            key={
                                                                item.idUtilizador
                                                            }
                                                            value={
                                                                item.idUtilizador
                                                            }
                                                        >
                                                            {
                                                                item.nome
                                                            }{" "}
                                                            —{" "}
                                                            {
                                                                item.perfil
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={
                                                    alteracaoSelecionada?.nomeUtilizador ||
                                                    "Sem responsável"
                                                }
                                                disabled
                                            />
                                        )}
                                    </label>

                                    <label className="detalhe-form-largo">
                                        Observações
                                        <textarea
                                            rows={4}
                                            value={
                                                alteracaoForm.observacoes
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setAlteracaoForm(
                                                    {
                                                        ...alteracaoForm,
                                                        observacoes:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                {erroAlteracao && (
                                    <div className="detalhe-modal-erro">
                                        {
                                            erroAlteracao
                                        }
                                    </div>
                                )}

                                <div className="detalhe-modal-footer">
                                    <button
                                        type="button"
                                        className="detalhe-modal-cancelar"
                                        onClick={
                                            fecharModalAlteracao
                                        }
                                        disabled={
                                            processandoAlteracao
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="detalhe-modal-guardar"
                                        disabled={
                                            processandoAlteracao
                                        }
                                    >
                                        {modoAlteracao ===
                                            "novo" ? (
                                            <Plus
                                                size={17}
                                            />
                                        ) : (
                                            <Pencil
                                                size={16}
                                            />
                                        )}

                                        {processandoAlteracao
                                            ? "A guardar..."
                                            : modoAlteracao ===
                                                "novo"
                                                ? "Criar alteração"
                                                : "Guardar alterações"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* MODAL DOCUMENTOS                                  */}
            {/* ================================================= */}

            {modoDocumento !== null && (
                <div className="detalhe-modal-overlay">
                    <div className="detalhe-modal">
                        <div className="detalhe-modal-header">
                            <div>
                                <span>
                                    DOCUMENTO
                                </span>

                                <h2>
                                    {modoDocumento ===
                                        "novo"
                                        ? "Novo documento"
                                        : modoDocumento ===
                                            "editar"
                                            ? "Editar documento"
                                            : "Detalhes do documento"}
                                </h2>

                                <p>
                                    {
                                        projeto.codigo
                                    }{" "}
                                    ·{" "}
                                    {
                                        projeto.nome
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharModalDocumento
                                }
                                disabled={
                                    processandoDocumento
                                }
                            >
                                <X
                                    size={20}
                                />
                            </button>
                        </div>

                        {modoDocumento ===
                            "visualizar" ? (
                            <div className="detalhe-modal-visualizacao">
                                <div className="detalhe-visualizacao-grid">
                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Nome
                                        </span>

                                        <strong>
                                            {
                                                documentoSelecionado?.nome
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Tipo
                                        </span>

                                        <strong>
                                            {documentoSelecionado?.tipo ||
                                                "Não definido"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Registado em
                                        </span>

                                        <strong>
                                            {formatarDataHora(
                                                documentoSelecionado?.dataUpload
                                            )}
                                        </strong>
                                    </div>

                                    <div className="detalhe-visualizacao-largo">
                                        <span>
                                            Ficheiro / referência
                                        </span>

                                        <p>
                                            {documentoFoiEnviado(
                                                documentoSelecionado
                                            )
                                                ? "Ficheiro carregado e protegido na plataforma."
                                                : documentoSelecionado?.caminho}
                                        </p>
                                    </div>
                                </div>

                                {erroDocumento && (
                                    <div className="detalhe-modal-erro">
                                        {
                                            erroDocumento
                                        }
                                    </div>
                                )}

                                <div className="detalhe-modal-footer">
                                    <button
                                        type="button"
                                        className="detalhe-modal-cancelar"
                                        onClick={
                                            fecharModalDocumento
                                        }
                                    >
                                        Fechar
                                    </button>

                                    {documentoSelecionado &&
                                        (documentoFoiEnviado(
                                            documentoSelecionado
                                        ) ||
                                            caminhoPodeAbrirNoBrowser(
                                                documentoSelecionado.caminho
                                            )) && (
                                            <button
                                                type="button"
                                                className="detalhe-modal-cancelar"
                                                onClick={() =>
                                                    void abrirDocumento(
                                                        documentoSelecionado
                                                    )
                                                }
                                            >
                                                <ExternalLink
                                                    size={
                                                        16
                                                    }
                                                />

                                                Abrir ficheiro
                                            </button>
                                        )}

                                    {documentoSelecionado &&
                                        documentoFoiEnviado(
                                            documentoSelecionado
                                        ) && (
                                            <button
                                                type="button"
                                                className="detalhe-modal-cancelar"
                                                onClick={() =>
                                                    void descarregarDocumento(
                                                        documentoSelecionado
                                                    )
                                                }
                                            >
                                                <Download
                                                    size={
                                                        16
                                                    }
                                                />

                                                Download
                                            </button>
                                        )}

                                    {documentoSelecionado &&
                                        podeGerirProjeto && (
                                            <button
                                                type="button"
                                                className="detalhe-modal-cancelar"
                                                onClick={() =>
                                                    void eliminarDocumento(
                                                        documentoSelecionado
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={16}
                                                />

                                                Eliminar documento
                                            </button>
                                        )}

                                    {documentoSelecionado && (
                                        <button
                                            type="button"
                                            className="detalhe-modal-guardar"
                                            onClick={() =>
                                                abrirEdicaoDocumento(
                                                    documentoSelecionado
                                                )
                                            }
                                        >
                                            <Pencil
                                                size={16}
                                            />

                                            Editar documento
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={
                                    modoDocumento ===
                                        "novo"
                                        ? guardarNovoDocumento
                                        : guardarEdicaoDocumento
                                }
                            >
                                <div className="detalhe-form-grid">
                                    <label className="detalhe-form-largo">
                                        Nome do documento *
                                        <input
                                            type="text"
                                            value={
                                                documentoForm.nome
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setDocumentoForm(
                                                    {
                                                        ...documentoForm,
                                                        nome:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            placeholder="Ex.: Planta Piso 1"
                                        />
                                    </label>

                                    <label className="detalhe-form-largo">
                                        Tipo de documento
                                        <select
                                            value={
                                                documentoForm.tipo
                                            }
                                            onChange={(
                                                evento
                                            ) =>
                                                setDocumentoForm(
                                                    {
                                                        ...documentoForm,
                                                        tipo:
                                                            evento
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                        >
                                            <option value="">
                                                Selecionar tipo
                                            </option>

                                            {documentoForm.tipo &&
                                                !tiposDocumento.includes(
                                                    documentoForm.tipo
                                                ) && (
                                                    <option
                                                        value={
                                                            documentoForm.tipo
                                                        }
                                                    >
                                                        {
                                                            documentoForm.tipo
                                                        }
                                                    </option>
                                                )}

                                            {tiposDocumento.map(
                                                (
                                                    tipo
                                                ) => (
                                                    <option
                                                        key={
                                                            tipo
                                                        }
                                                        value={
                                                            tipo
                                                        }
                                                    >
                                                        {
                                                            tipo
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    {modoDocumento ===
                                        "novo" ? (
                                        <div className="detalhe-form-largo detalhe-upload-campo">
                                            <span className="detalhe-upload-label">
                                                Ficheiro *
                                            </span>

                                            <label className={`detalhe-upload-box ${arquivoDocumento ? "tem-ficheiro" : ""}`}>
                                                <input
                                                    className="detalhe-upload-input"
                                                    type="file"
                                                    accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.zip"
                                                    onChange={(
                                                        evento
                                                    ) =>
                                                        selecionarArquivoDocumento(
                                                            evento
                                                                .target
                                                                .files?.[0]
                                                        )
                                                    }
                                                />

                                                <div className="detalhe-upload-icone">
                                                    <UploadCloud
                                                        size={
                                                            22
                                                        }
                                                    />
                                                </div>

                                                <div className="detalhe-upload-conteudo">
                                                    {arquivoDocumento ? (
                                                        <>
                                                            <strong>
                                                                {
                                                                    arquivoDocumento.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {(
                                                                    arquivoDocumento.size /
                                                                    1024 /
                                                                    1024
                                                                ).toLocaleString(
                                                                    "pt-PT",
                                                                    {
                                                                        minimumFractionDigits: 0,
                                                                        maximumFractionDigits: 2,
                                                                    }
                                                                )} MB · Ficheiro pronto para carregar
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <strong>
                                                                Selecionar ficheiro
                                                            </strong>

                                                            <span>
                                                                Clique para escolher um documento do computador
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <span className="detalhe-upload-acao">
                                                    {arquivoDocumento
                                                        ? "Alterar"
                                                        : "Procurar"}
                                                </span>
                                            </label>

                                            <small className="detalhe-upload-ajuda">
                                                PDF, imagens, DWG, DXF, Word, Excel ou ZIP · Máximo de 25 MB
                                            </small>
                                        </div>
                                    ) : (
                                        <label className="detalhe-form-largo">
                                            Ficheiro / referência
                                            <input
                                                type="text"
                                                value={
                                                    documentoFoiEnviado(
                                                        documentoSelecionado
                                                    )
                                                        ? "Ficheiro carregado na plataforma"
                                                        : documentoForm.caminho
                                                }
                                                readOnly
                                            />

                                            <small>
                                                Nesta edição pode alterar o nome e o tipo. O ficheiro associado permanece o mesmo.
                                            </small>
                                        </label>
                                    )}
                                </div>

                                {erroDocumento && (
                                    <div className="detalhe-modal-erro">
                                        {
                                            erroDocumento
                                        }
                                    </div>
                                )}

                                <div className="detalhe-modal-footer">
                                    <button
                                        type="button"
                                        className="detalhe-modal-cancelar"
                                        onClick={
                                            fecharModalDocumento
                                        }
                                        disabled={
                                            processandoDocumento
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="detalhe-modal-guardar"
                                        disabled={
                                            processandoDocumento
                                        }
                                    >
                                        {modoDocumento ===
                                            "novo" ? (
                                            <Plus
                                                size={17}
                                            />
                                        ) : (
                                            <Pencil
                                                size={16}
                                            />
                                        )}

                                        {processandoDocumento
                                            ? "A guardar..."
                                            : modoDocumento ===
                                                "novo"
                                                ? "Carregar documento"
                                                : "Guardar alterações"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}